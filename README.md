# QuickFetch

QuickFetch is a sleek downloader prototype focused on two platforms only:

- YouTube
- Instagram

The current implementation uses real metadata extraction and streaming through `yt-dlp`.

## Stack

- Next.js (App Router)
- React + TypeScript
- TailwindCSS v4
- Next.js API routes with Node.js runtime

## Run

Install runtime binaries first:

1. Install `yt-dlp` and make sure `yt-dlp` is in `PATH`.
2. Install `ffmpeg` and make sure `ffmpeg` is in `PATH`.

Optional: set explicit binary path if `yt-dlp` is not globally available.

```bash
# Windows PowerShell
$env:YT_DLP_PATH = "C:\\tools\\yt-dlp.exe"
```

```bash
pnpm dev
```

Visit `http://localhost:3000`.

## Implemented Features

- Single URL preview flow
- Batch URL input (sequential processing)
- Platform auto-detection (`youtube.com`, `youtu.be`, `instagram.com`)
- Smart presets:
	- Fast Download (360p)
	- Balanced Quality (720p)
	- Best Quality
	- Audio-only presets
- Resolution + file size estimates
- Clip bounds (start/end seconds)
- Developer mode format details
- Thumbnail + metadata asset download actions

## API Endpoints

- `POST /api/video-info`
	- Body: `{ "url": "https://..." }`
	- Returns normalized media metadata and formats.
- `GET /api/download`
	- Query: `url`, `formatId`, `assetType`, optional `clipStart`, `clipEnd`
	- Returns streamed downloadable media/asset content.

## Install Notes

No extra Node wrapper library is required for extraction; the app invokes the `yt-dlp` binary directly.

Recommended optional libraries if you want tighter process control later:

1. `zod` for stricter request validation.
2. `p-limit` for queue/concurrency control.
3. `rate-limiter-flexible` for abuse protection.

## Folder Overview

- `app/api/video-info/route.ts`: metadata API
- `app/api/download/route.ts`: stream download API
- `components/*`: URL, preview, clip, batch, and option UI
- `lib/*`: detector, extractors, format filtering, ffmpeg helpers
- `utils/*`: validators and URL parsing helpers
