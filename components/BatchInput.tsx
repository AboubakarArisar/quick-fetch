"use client";

import { FormEvent, useMemo, useState } from "react";

type Props = {
  onSubmit: (urls: string[]) => Promise<void> | void;
  isLoading: boolean;
};

export default function BatchInput({ onSubmit, isLoading }: Props) {
  const [value, setValue] = useState("");

  const count = useMemo(
    () =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean).length,
    [value],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const urls = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (urls.length === 0) return;
    await onSubmit(urls);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor="batch-urls" className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-600">
          Batch URLs
        </label>
        <span className="rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-[11px] text-zinc-500">
          {count} items
        </span>
      </div>
      <textarea
        id="batch-urls"
        placeholder="One URL per line"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="lift h-11 w-fit rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
      >
        {isLoading ? "Processing batch..." : "Process Batch"}
      </button>
    </form>
  );
}
