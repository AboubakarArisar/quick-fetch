import { NextRequest, NextResponse } from "next/server";
import { getInstagramInfo } from "@/lib/instagram";
import { detectPlatform } from "@/lib/platformDetector";
import { getYoutubeInfo } from "@/lib/youtube";
import { normalizeUrl } from "@/utils/urlParser";
import { isValidHttpUrl } from "@/utils/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { url?: string } | null;
  const incomingUrl = normalizeUrl(body?.url ?? "");

  if (!incomingUrl || !isValidHttpUrl(incomingUrl)) {
    return NextResponse.json({ error: "Please provide a valid URL." }, { status: 400 });
  }

  const platform = detectPlatform(incomingUrl);
  if (!platform) {
    return NextResponse.json(
      { error: "Only YouTube and Instagram URLs are supported." },
      { status: 400 },
    );
  }

  try {
    const data =
      platform === "youtube"
        ? await getYoutubeInfo(incomingUrl)
        : await getInstagramInfo(incomingUrl);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch media info. Please try again.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
