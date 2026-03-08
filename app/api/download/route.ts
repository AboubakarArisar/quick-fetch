import { NextRequest } from "next/server";
import { applyCorsHeaders, corsPreflightResponse } from "@/lib/cors";
import { sanitizeClipBounds, toTrimDescription } from "@/lib/ffmpeg";
import { getInstagramInfo } from "@/lib/instagram";
import { detectPlatform } from "@/lib/platformDetector";
import type { AssetType } from "@/lib/types";
import { streamFromYtDlp } from "@/lib/ytDlp";
import { getYoutubeInfo } from "@/lib/youtube";
import { isValidHttpUrl } from "@/utils/validators";

export const runtime = "nodejs";

const encoder = new TextEncoder();

function buildHeaders(fileName: string, contentType: string): Headers {
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `attachment; filename=\"${fileName}\"`);
  headers.set("Cache-Control", "no-store");
  headers.set("X-QuickFetch-Mode", "stream");
  return headers;
}

function responseWithCors(request: NextRequest, body: BodyInit | null, status: number, headers?: Headers) {
  const responseHeaders = headers ?? new Headers();
  applyCorsHeaders(request, responseHeaders);
  return new Response(body, { status, headers: responseHeaders });
}

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);
}

function parseOptionalNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sanitizeExtension(ext: string | null): string {
  if (!ext) return "mp4";
  const cleaned = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || "mp4";
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const url = params.get("url") ?? "";
  const formatId = params.get("formatId") ?? "unknown";
  const assetType = (params.get("assetType") ?? "media") as AssetType;
  const clipStart = parseOptionalNumber(params.get("clipStart"));
  const clipEnd = parseOptionalNumber(params.get("clipEnd"));
  const fileBaseName = params.get("fileBaseName") ?? "";
  const fileExt = sanitizeExtension(params.get("fileExt"));

  if (!isValidHttpUrl(url)) {
    return responseWithCors(request, "Invalid URL", 400);
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return responseWithCors(request, "Unsupported platform", 400);
  }

  if (assetType === "thumbnail") {
    let info;
    try {
      info =
        platform === "youtube" ? await getYoutubeInfo(url) : await getInstagramInfo(url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resolve media info. Check yt-dlp installation.";
      return responseWithCors(request, message, 500);
    }

    if (!info.thumbnailUrl) return responseWithCors(request, "No thumbnail available", 404);

    const response = await fetch(info.thumbnailUrl);
    if (!response.ok || !response.body) {
      return responseWithCors(request, "Failed to fetch thumbnail", 502);
    }

    const headers = buildHeaders(`${sanitizeFileName(info.title) || "thumbnail"}.jpg`, "image/jpeg");
    applyCorsHeaders(request, headers);
    return new Response(response.body, { headers });
  }

  if (assetType === "metadata") {
    let info;
    try {
      info =
        platform === "youtube" ? await getYoutubeInfo(url) : await getInstagramInfo(url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resolve media info. Check yt-dlp installation.";
      return responseWithCors(request, message, 500);
    }

    const metadata = JSON.stringify(
      {
        title: info.title,
        description: info.description,
        channelName: info.channelName,
        uploadDate: info.uploadDate,
        platform: info.platform,
        durationSeconds: info.durationSeconds,
        sourceUrl: info.url,
      },
      null,
      2,
    );

    const headers = buildHeaders("metadata.json", "application/json; charset=utf-8");
    applyCorsHeaders(request, headers);
    return new Response(encoder.encode(metadata), { headers });
  }

  const clip = sanitizeClipBounds({ start: clipStart, end: clipEnd });
  const trimSuffix = toTrimDescription(clip) === "full" ? "" : `-${toTrimDescription(clip)}`;
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await streamFromYtDlp({
      url,
      formatSelector: formatId,
      clipStart: clip.start,
      clipEnd: clip.end,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to stream media. Check yt-dlp installation.";
    return responseWithCors(request, message, 500);
  }

  const headers = buildHeaders(
    `${sanitizeFileName(fileBaseName) || `${platform}-media`}${trimSuffix}.${fileExt}`,
    "application/octet-stream",
  );
  applyCorsHeaders(request, headers);
  return new Response(stream, { headers });
}

export function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request);
}
