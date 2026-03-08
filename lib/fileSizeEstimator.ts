type FileSizeParams = {
  durationSeconds: number;
  bitrateKbps?: number;
};

export function estimateFileSizeMB({ durationSeconds, bitrateKbps }: FileSizeParams): number {
  const safeBitrate = bitrateKbps ?? 1500;
  const bytes = (durationSeconds * safeBitrate * 1000) / 8;
  return Math.max(1, Math.round(bytes / (1024 * 1024)));
}
