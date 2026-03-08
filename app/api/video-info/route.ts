import { NextRequest, NextResponse } from "next/server";
import { applyCorsHeaders, corsPreflightResponse } from "@/lib/cors";
import { getInstagramInfo } from "@/lib/instagram";
import { detectPlatform } from "@/lib/platformDetector";
import { getYoutubeInfo } from "@/lib/youtube";
import { normalizeUrl } from "@/utils/urlParser";
import { isValidHttpUrl } from "@/utils/validators";

export const runtime = "nodejs";

export function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request);
}

function jsonWithCors(request: NextRequest, body: unknown, status: number) {
  const response = NextResponse.json(body, { status });
  applyCorsHeaders(request, response.headers);
  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const incomingUrl = normalizeUrl(body?.url ?? "");

  if (!incomingUrl || !isValidHttpUrl(incomingUrl)) {
    return jsonWithCors(request, { error: "Please provide a valid URL." }, 400);
  }

  const platform = detectPlatform(incomingUrl);
  if (!platform) {
    return jsonWithCors(
      request,
      { error: "Only YouTube and Instagram URLs are supported." },
      400,
    );
  }

  try {
    const data =
      platform === "youtube"
        ? await getYoutubeInfo(incomingUrl)
        : await getInstagramInfo(incomingUrl);
    return jsonWithCors(request, data, 200);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch media info. Please try again.";
    return jsonWithCors(
      request,
      { error: message },
      500,
    );
  }
}
