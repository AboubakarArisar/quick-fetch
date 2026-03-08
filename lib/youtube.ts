import { estimateFileSizeMB } from "@/lib/fileSizeEstimator";
import { buildPresetFormats, sortFormats } from "@/lib/formatFilter";
import type { MediaFormat, VideoInfoResponse } from "@/lib/types";
import {
  fetchYtDlpInfo,
  hasAudio,
  hasVideo,
  normalizeDate,
  sizeMb,
  toContainer,
} from "@/lib/ytDlp";

export async function getYoutubeInfo(url: string): Promise<VideoInfoResponse> {
  const raw = await fetchYtDlpInfo(url);
  const durationSeconds = Math.max(1, Math.round(raw.duration ?? 0));

  const extractedFormats: MediaFormat[] = (raw.formats ?? [])
    .filter((format) => Boolean(format.format_id))
    .map((format) => {
      const video = hasVideo(format);
      const audio = hasAudio(format);
      const container = toContainer(format.ext);
      const bitrateKbps = Math.round(format.tbr ?? format.abr ?? 0) || undefined;
      const estimatedSizeMB =
        sizeMb(format.filesize, format.filesize_approx) ??
        estimateFileSizeMB({ durationSeconds, bitrateKbps });

      return {
        id: format.format_id!,
        sourceFormatId: format.format_id!,
        label: `${format.format_note ?? format.format_id} (${container})`,
        container,
        hasVideo: video,
        hasAudio: audio,
        resolution: format.height ? `${format.height}p` : undefined,
        fps: format.fps,
        codec: [format.vcodec, format.acodec].filter(Boolean).join(" / "),
        bitrateKbps,
        itag: Number(format.format_id),
        estimatedSizeMB,
        ext: format.ext,
      } satisfies MediaFormat;
    })
    .filter((format) => format.hasVideo || format.hasAudio);

  const deduped = [...new Map(extractedFormats.map((format) => [format.id, format])).values()];
  const sorted = sortFormats(deduped);
  const presets = buildPresetFormats(sorted);

  return {
    id: raw.id,
    url,
    platform: "youtube",
    title: raw.title,
    description: raw.description ?? "",
    channelName: raw.channel ?? raw.uploader,
    uploadDate: normalizeDate(raw.upload_date),
    durationSeconds,
    thumbnailUrl: raw.thumbnail ?? "",
    formats: [...presets, ...sorted],
    warnings: [
      "Real metadata from yt-dlp. For best compatibility, keep yt-dlp and ffmpeg updated.",
      "Some adaptive formats can require ffmpeg merging depending on platform format availability.",
    ],
  };
}
