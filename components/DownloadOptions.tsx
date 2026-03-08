"use client";

import { useEffect, useState } from "react";
import { toApiUrl } from "@/lib/clientApi";
import type { MediaFormat, VideoInfoResponse } from "@/lib/types";

type Props = {
  info: VideoInfoResponse;
  clipStart?: number;
  clipEnd?: number;
};

function hasValidClip(start?: number, end?: number) {
  return (
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start !== undefined &&
    end !== undefined &&
    end > start
  );
}

function estimateClipSizeMB(
  fullSizeMB: number,
  totalDurationSeconds: number,
  clipStart?: number,
  clipEnd?: number,
) {
  if (!hasValidClip(clipStart, clipEnd)) return fullSizeMB;
  if (!Number.isFinite(totalDurationSeconds) || totalDurationSeconds <= 0) return fullSizeMB;

  const clipDuration = Math.max(0, (clipEnd ?? 0) - (clipStart ?? 0));
  const ratio = Math.min(1, clipDuration / totalDurationSeconds);
  return Math.max(1, Math.round(fullSizeMB * ratio));
}

function buildDownloadHref(
  url: string,
  formatId: string,
  assetType: "media" | "thumbnail" | "metadata",
  clipStart?: number,
  clipEnd?: number,
  fileBaseName?: string,
  fileExt?: string,
) {
  const params = new URLSearchParams({
    url,
    formatId,
    assetType,
  });

  if (clipStart !== undefined) params.set("clipStart", String(clipStart));
  if (clipEnd !== undefined) params.set("clipEnd", String(clipEnd));
  if (fileBaseName) params.set("fileBaseName", fileBaseName);
  if (fileExt) params.set("fileExt", fileExt);

  return toApiUrl(`/api/download?${params.toString()}`);
}

function AnimatedMB({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 380;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const next = Math.round(value * progress);
      setDisplay(next);
      if (progress < 1) requestAnimationFrame(tick);
    }

    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return <>{display} MB</>;
}

function FormatCard({
  sourceUrl,
  sourceTitle,
  totalDurationSeconds,
  format,
  clipStart,
  clipEnd,
  isClipActive,
  activeDownload,
  setActiveDownload,
}: {
  sourceUrl: string;
  sourceTitle: string;
  totalDurationSeconds: number;
  format: MediaFormat;
  clipStart?: number;
  clipEnd?: number;
  isClipActive: boolean;
  activeDownload: string | null;
  setActiveDownload: (id: string | null) => void;
}) {
  const displaySizeMB = estimateClipSizeMB(
    format.estimatedSizeMB,
    totalDurationSeconds,
    clipStart,
    clipEnd,
  );

  const href = buildDownloadHref(
    sourceUrl,
    format.sourceFormatId ?? format.id,
    "media",
    clipStart,
    clipEnd,
    sourceTitle,
    format.ext ?? format.container,
  );

  const isActive = activeDownload === format.id;

  return (
    <div className="lift rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium text-zinc-900">{format.label}</p>
        <span className="shrink-0 rounded-full border border-zinc-300 bg-zinc-100 px-2 py-1 font-mono text-[11px] text-zinc-600">
          <AnimatedMB value={displaySizeMB} />
        </span>
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        {format.container.toUpperCase()} {format.resolution ? `• ${format.resolution}` : ""}
      </p>
      <a
        href={href}
        onClick={() => {
          setActiveDownload(format.id);
          window.setTimeout(() => setActiveDownload(null), 1800);
        }}
        className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-medium transition ${
          isActive
            ? "border-zinc-300 bg-zinc-100 text-zinc-700"
            : "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
        }`}
      >
        {isActive ? "Starting..." : isClipActive ? "Download Clip" : "Download"}
      </a>
    </div>
  );
}

export default function DownloadOptions({
  info,
  clipStart,
  clipEnd,
}: Props) {
  const presets = info.formats.filter((format) => format.preset);
  const [activeDownload, setActiveDownload] = useState<string | null>(null);
  const isClipActive = hasValidClip(clipStart, clipEnd);
  const clipDownloadId = "quick-clip-download";
  const clipDurationSeconds = isClipActive ? (clipEnd ?? 0) - (clipStart ?? 0) : undefined;
  const clipTargetFormat = presets[0] ?? info.formats[0] ?? null;
  const clipHref =
    clipTargetFormat && isClipActive
      ? buildDownloadHref(
          info.url,
          clipTargetFormat.sourceFormatId ?? clipTargetFormat.id,
          "media",
          clipStart,
          clipEnd,
          info.title,
          clipTargetFormat.ext ?? clipTargetFormat.container,
        )
      : null;
  const clipTargetSizeMB =
    clipTargetFormat && isClipActive
      ? estimateClipSizeMB(
          clipTargetFormat.estimatedSizeMB,
          info.durationSeconds,
          clipStart,
          clipEnd,
        )
      : null;

  return (
    <section className="grid gap-4">
      {isClipActive ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Clip mode is on: all media download buttons will download {clipStart}s to {clipEnd}s.
          {clipDurationSeconds ? ` (${clipDurationSeconds}s clip)` : ""}
        </div>
      ) : null}

      {clipHref && clipTargetFormat ? (
        <div className="rounded-2xl border border-emerald-300 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-900">Quick Clip Action</p>
            {clipTargetSizeMB ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 font-mono text-[11px] text-emerald-700">
                <AnimatedMB value={clipTargetSizeMB} />
              </span>
            ) : null}
          </div>
          <p className="mb-3 text-xs text-zinc-600">
            Downloads the selected clip using {clipTargetFormat.label}.
          </p>
          <a
            href={clipHref}
            onClick={() => {
              setActiveDownload(clipDownloadId);
              window.setTimeout(() => setActiveDownload(null), 2600);
            }}
            className="inline-flex h-10 items-center rounded-lg border border-emerald-700 bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            {activeDownload === clipDownloadId ? "Starting clip download..." : "Download Selected Clip"}
          </a>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700">Smart Presets</p>
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">Quick Picks</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <a
              key={preset.id}
              href={buildDownloadHref(
                info.url,
                preset.sourceFormatId ?? preset.id,
                "media",
                clipStart,
                clipEnd,
                info.title,
                preset.ext ?? preset.container,
              )}
              onClick={() => {
                setActiveDownload(preset.id);
                window.setTimeout(() => setActiveDownload(null), 1800);
              }}
              className="lift group rounded-2xl border border-zinc-300 bg-zinc-50 p-3"
            >
              <p className="text-sm font-medium">{preset.label}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Estimated <AnimatedMB
                  value={estimateClipSizeMB(
                    preset.estimatedSizeMB,
                    info.durationSeconds,
                    clipStart,
                    clipEnd,
                  )}
                />
              </p>
              <p className="mt-2 text-[11px] font-medium text-zinc-500">
                {activeDownload === preset.id
                  ? "Starting..."
                  : isClipActive
                    ? "Tap to download clip"
                    : "Tap to download"}
              </p>
            </a>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-700">All Formats</p>
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">Advanced</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {info.formats.map((format) => (
            <FormatCard
              key={format.id}
              sourceUrl={info.url}
              sourceTitle={info.title}
              totalDurationSeconds={info.durationSeconds}
              format={format}
              clipStart={clipStart}
              clipEnd={clipEnd}
              isClipActive={isClipActive}
              activeDownload={activeDownload}
              setActiveDownload={setActiveDownload}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={buildDownloadHref(info.url, "asset-thumbnail", "thumbnail")}
          className="lift h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium leading-9 text-zinc-700"
        >
          Download Thumbnail
        </a>
        <a
          href={buildDownloadHref(info.url, "asset-metadata", "metadata")}
          className="lift h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium leading-9 text-zinc-700"
        >
          Download Metadata JSON
        </a>
      </div>

      {info.warnings.length > 0 ? (
        <ul className="grid gap-2 text-xs text-amber-700">
          {info.warnings.map((warning) => (
            <li key={warning} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              {warning}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
