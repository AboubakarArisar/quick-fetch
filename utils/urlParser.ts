export function normalizeUrl(input: string): string {
  return input.trim();
}

export function extractYoutubeVideoId(url: string): string | null {
  const parsed = new URL(url);
  if (parsed.hostname.includes("youtu.be")) {
    return parsed.pathname.replace("/", "") || null;
  }
  return parsed.searchParams.get("v");
}

export function extractInstagramId(url: string): string {
  const parsed = new URL(url);
  const chunks = parsed.pathname.split("/").filter(Boolean);
  return chunks[chunks.length - 1] ?? "instagram-media";
}
