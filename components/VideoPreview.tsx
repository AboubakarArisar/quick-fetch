import type { VideoInfoResponse } from "@/lib/types";

type Props = {
  info: VideoInfoResponse;
};

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const short = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${short}` : short;
}

export default function VideoPreview({ info }: Props) {
  return (
    <section className="grid gap-4 md:grid-cols-[300px_1fr]">
      <div className="lift overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
        {/* Plain img avoids remote image config for quick prototype setup. */}
        <img
          src={info.thumbnailUrl}
          alt={info.title}
          className="h-full min-h-[170px] w-full object-cover"
        />
      </div>
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 font-mono uppercase tracking-wider text-zinc-600">
            {info.platform}
          </span>
          <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 font-mono text-zinc-600">
            {formatDuration(info.durationSeconds)}
          </span>
        </div>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-zinc-950">
          {info.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 line-clamp-3">{info.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-600 sm:grid-cols-3">
          <p className="surface-soft rounded-lg p-2">
            <span className="block font-mono uppercase tracking-wider text-zinc-500">Publisher</span>
            {info.channelName ?? "Instagram Author"}
          </p>
          <p className="surface-soft rounded-lg p-2">
            <span className="block font-mono uppercase tracking-wider text-zinc-500">Uploaded</span>
            {info.uploadDate}
          </p>
          <p className="surface-soft rounded-lg p-2">
            <span className="block font-mono uppercase tracking-wider text-zinc-500">Formats</span>
            {info.formats.length}
          </p>
        </div>
      </div>
    </section>
  );
}
