export type SupportedPlatform = "youtube" | "instagram";

export type AssetType = "media" | "thumbnail" | "metadata";

export type DownloadPreset =
  | "fast"
  | "balanced"
  | "best"
  | "audio-128"
  | "audio-320"
  | "wav";

export type MediaFormat = {
  id: string;
  sourceFormatId?: string;
  label: string;
  container: "mp4" | "webm" | "mp3" | "wav" | "m4a";
  hasVideo: boolean;
  hasAudio: boolean;
  resolution?: string;
  fps?: number;
  codec?: string;
  bitrateKbps?: number;
  itag?: number;
  estimatedSizeMB: number;
  ext?: string;
  preset?: DownloadPreset;
};

export type VideoInfoResponse = {
  id: string;
  url: string;
  platform: SupportedPlatform;
  title: string;
  description: string;
  channelName?: string;
  uploadDate: string;
  durationSeconds: number;
  thumbnailUrl: string;
  formats: MediaFormat[];
  warnings: string[];
};
