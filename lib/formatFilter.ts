import type { MediaFormat } from "@/lib/types";

function resolutionScore(resolution?: string): number {
  if (!resolution) return 0;
  const height = Number(resolution.replace("p", ""));
  return Number.isFinite(height) ? height : 0;
}

export function sortFormats(formats: MediaFormat[]): MediaFormat[] {
  return [...formats].sort((a, b) => {
    // Prefer formats with both video and audio before pure video streams.
    const muxedDiff = Number(b.hasVideo && b.hasAudio) - Number(a.hasVideo && a.hasAudio);
    if (muxedDiff !== 0) return muxedDiff;

    const scoreDiff = resolutionScore(b.resolution) - resolutionScore(a.resolution);
    if (scoreDiff !== 0) return scoreDiff;
    return b.estimatedSizeMB - a.estimatedSizeMB;
  });
}

export function buildPresetFormats(formats: MediaFormat[]): MediaFormat[] {
  const videoFormats = formats.filter((f) => f.hasVideo);
  const muxedVideoFormats = videoFormats.filter((f) => f.hasAudio);
  const preferredVideoFormats = muxedVideoFormats.length > 0 ? muxedVideoFormats : videoFormats;
  const audioFormats = formats.filter((f) => !f.hasVideo && f.hasAudio);

  const fast = [...preferredVideoFormats]
    .filter((format) => resolutionScore(format.resolution) <= 480)
    .sort((a, b) => a.estimatedSizeMB - b.estimatedSizeMB)[0];
  const balanced = [...preferredVideoFormats]
    .filter((format) => resolutionScore(format.resolution) <= 720)
    .sort((a, b) => Math.abs(720 - resolutionScore(a.resolution)) - Math.abs(720 - resolutionScore(b.resolution)))[0];
  const best = sortFormats(preferredVideoFormats)[0];

  const audio128 = audioFormats.find((f) => f.bitrateKbps === 128);
  const audio320 = audioFormats.find((f) => f.bitrateKbps === 320);
  const wav = audioFormats.find((f) => f.container === "wav");

  const presetEntries: Array<MediaFormat | null> = [
    fast
      ? {
          ...fast,
          id: `${fast.id}-preset-fast`,
          sourceFormatId: fast.sourceFormatId ?? fast.id,
          label: "Fast Download (360p)",
          preset: "fast",
        }
      : null,
    balanced
      ? {
          ...balanced,
          id: `${balanced.id}-preset-balanced`,
          sourceFormatId: balanced.sourceFormatId ?? balanced.id,
          label: "Balanced Quality (720p)",
          preset: "balanced",
        }
      : null,
    best
      ? {
          ...best,
          id: `${best.id}-preset-best`,
          sourceFormatId: best.sourceFormatId ?? best.id,
          label: "Best Quality",
          preset: "best",
        }
      : null,
    audio128
      ? {
          ...audio128,
          id: `${audio128.id}-preset-a128`,
          sourceFormatId: audio128.sourceFormatId ?? audio128.id,
          label: "Audio Only (MP3 128)",
          preset: "audio-128",
        }
      : null,
    audio320
      ? {
          ...audio320,
          id: `${audio320.id}-preset-a320`,
          sourceFormatId: audio320.sourceFormatId ?? audio320.id,
          label: "Audio Only (MP3 320)",
          preset: "audio-320",
        }
      : null,
    wav
      ? {
          ...wav,
          id: `${wav.id}-preset-wav`,
          sourceFormatId: wav.sourceFormatId ?? wav.id,
          label: "Audio Only (WAV)",
          preset: "wav",
        }
      : null,
  ];

  return presetEntries.filter((entry): entry is MediaFormat => entry !== null);
}
