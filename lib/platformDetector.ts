import type { SupportedPlatform } from "@/lib/types";

export function detectPlatform(url: string): SupportedPlatform | null {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("instagram.com")) return "instagram";
  return null;
}
