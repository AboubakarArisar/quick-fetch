import { spawn } from "node:child_process";
import { PassThrough } from "node:stream";
import { Readable } from "node:stream";

type RawFormat = {
  format_id?: string;
  ext?: string;
  acodec?: string;
  vcodec?: string;
  width?: number;
  height?: number;
  fps?: number;
  tbr?: number;
  abr?: number;
  filesize?: number;
  filesize_approx?: number;
  format_note?: string;
};

type RawVideoInfo = {
  id: string;
  title: string;
  description?: string;
  channel?: string;
  uploader?: string;
  upload_date?: string;
  duration?: number;
  thumbnail?: string;
  formats?: RawFormat[];
};

type StreamArgs = {
  url: string;
  formatSelector: string;
  clipStart?: number;
  clipEnd?: number;
};

type Runner = {
  command: string;
  prefixArgs: string[];
  label: string;
};

let runnerPromise: Promise<Runner> | null = null;

function runnerCandidates(): Runner[] {
  const configured = process.env.YT_DLP_PATH?.trim();
  const fromEnv = configured
    ? [{ command: configured, prefixArgs: [], label: `YT_DLP_PATH (${configured})` }]
    : [];

  return [
    ...fromEnv,
    { command: "yt-dlp", prefixArgs: [], label: "yt-dlp" },
    { command: "yt-dlp.exe", prefixArgs: [], label: "yt-dlp.exe" },
    { command: "yt_dlp", prefixArgs: [], label: "yt_dlp" },
    { command: "python", prefixArgs: ["-m", "yt_dlp"], label: "python -m yt_dlp" },
    { command: "py", prefixArgs: ["-m", "yt_dlp"], label: "py -m yt_dlp" },
  ];
}

async function checkRunner(candidate: Runner): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const child = spawn(candidate.command, [...candidate.prefixArgs, "--version"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve((code ?? 1) === 0));
  });
}

async function resolveRunner(): Promise<Runner> {
  const tried: string[] = [];

  for (const candidate of runnerCandidates()) {
    tried.push(candidate.label);
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkRunner(candidate);
    if (ok) return candidate;
  }

  throw new Error(
    `yt-dlp binary not found. Tried: ${tried.join(", ")}. Set YT_DLP_PATH to your yt-dlp executable path if needed.`,
  );
}

export async function ensureYtDlpAvailable(): Promise<void> {
  if (!runnerPromise) {
    runnerPromise = resolveRunner();
  }
  await runnerPromise;
}

export async function fetchYtDlpInfo(url: string): Promise<RawVideoInfo> {
  await ensureYtDlpAvailable();
  const runner = await runnerPromise;
  if (!runner) throw new Error("yt-dlp runner is unavailable");

  const args = [...runner.prefixArgs, "--dump-single-json", "--no-playlist", url];
  const child = spawn(runner.command, args, { stdio: ["ignore", "pipe", "pipe"] });

  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk: Buffer | string) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk: Buffer | string) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(stderr || "yt-dlp failed to fetch metadata");
  }

  return JSON.parse(stdout) as RawVideoInfo;
}

export function normalizeDate(uploadDate?: string): string {
  if (!uploadDate || uploadDate.length !== 8) return "Unknown";
  const yyyy = uploadDate.slice(0, 4);
  const mm = uploadDate.slice(4, 6);
  const dd = uploadDate.slice(6, 8);
  return `${yyyy}-${mm}-${dd}`;
}

export function hasVideo(format: RawFormat): boolean {
  return Boolean(format.vcodec && format.vcodec !== "none");
}

export function hasAudio(format: RawFormat): boolean {
  return Boolean(format.acodec && format.acodec !== "none");
}

export function toContainer(ext?: string): "mp4" | "webm" | "mp3" | "wav" | "m4a" {
  if (ext === "mp4") return "mp4";
  if (ext === "webm") return "webm";
  if (ext === "mp3") return "mp3";
  if (ext === "wav") return "wav";
  if (ext === "m4a") return "m4a";
  return "mp4";
}

export function sizeMb(filesize?: number, approx?: number): number | null {
  const bytes = filesize ?? approx;
  if (!bytes || bytes <= 0) return null;
  return Math.max(1, Math.round(bytes / (1024 * 1024)));
}

export async function streamFromYtDlp({
  url,
  formatSelector,
  clipStart,
  clipEnd,
}: StreamArgs): Promise<ReadableStream<Uint8Array>> {
  await ensureYtDlpAvailable();
  const runner = await runnerPromise;
  if (!runner) throw new Error("yt-dlp runner is unavailable");

  const args = [...runner.prefixArgs, "--no-playlist", "-f", formatSelector, "-o", "-", url];

  if (
    clipStart !== undefined &&
    clipEnd !== undefined &&
    Number.isFinite(clipStart) &&
    Number.isFinite(clipEnd) &&
    clipEnd > clipStart
  ) {
    args.unshift("--download-sections", `*${clipStart}-${clipEnd}`);
  }

  const child = spawn(runner.command, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  let stdoutBytes = 0;
  const proxy = new PassThrough();

  child.stdout.on("data", (chunk: Buffer | string) => {
    stdoutBytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
  });

  child.stdout.pipe(proxy);

  child.stderr.on("data", (chunk: Buffer | string) => {
    stderr += chunk.toString();
  });

  await new Promise<{ ok: true }>((resolve, reject) => {
    function cleanup() {
      child.stdout.off("data", onFirstChunk);
      child.off("close", onClose);
      child.off("error", onError);
    }

    function onFirstChunk() {
      cleanup();
      resolve({ ok: true });
    }

    function onClose(code: number | null) {
      cleanup();
      if ((code ?? 1) !== 0) {
        reject(new Error(stderr.trim() || "yt-dlp exited before streaming data"));
        return;
      }
      if (stdoutBytes === 0) {
        reject(new Error("No media bytes were produced for this selection/clip range."));
        return;
      }
      resolve({ ok: true });
    }

    function onError(error: Error) {
      cleanup();
      reject(error);
    }

    child.stdout.once("data", onFirstChunk);
    child.once("close", onClose);
    child.once("error", onError);
  });

  child.on("error", () => {
    child.kill();
  });

  return Readable.toWeb(proxy) as ReadableStream<Uint8Array>;
}
