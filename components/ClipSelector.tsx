"use client";

import { useState } from "react";

type Props = {
  durationSeconds: number;
  onChange: (start?: number, end?: number) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function ClipSelector({ durationSeconds, onChange }: Props) {
  const [start, setStart] = useState<number | undefined>(undefined);
  const [end, setEnd] = useState<number | undefined>(undefined);
  const [open, setOpen] = useState(false);

  return (
    <section className="surface-soft rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">Clip Downloader</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">
            Optional
          </span>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div
        className={`grid overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs text-zinc-600">
            Start second
            <input
              type="number"
              min={0}
              max={durationSeconds}
              disabled={!open}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900"
              onChange={(event) => {
                const value = event.target.value;
                const nextStart = value
                  ? clamp(Number(value), 0, durationSeconds)
                  : undefined;
                setStart(nextStart);
                onChange(nextStart, end);
              }}
            />
          </label>
          <label className="grid gap-1 text-xs text-zinc-600">
            End second
            <input
              type="number"
              min={0}
              max={durationSeconds}
              disabled={!open}
              className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-900"
              onChange={(event) => {
                const value = event.target.value;
                const nextEnd = value ? clamp(Number(value), 0, durationSeconds) : undefined;
                setEnd(nextEnd);
                onChange(start, nextEnd);
              }}
            />
          </label>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Duration: {durationSeconds}s. Enter both fields, then use the download buttons below to download that clip.
      </p>
    </section>
  );
}
