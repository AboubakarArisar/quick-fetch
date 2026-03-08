"use client";

import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (url: string) => Promise<void> | void;
  isLoading: boolean;
};

export default function UrlInput({ onSubmit, isLoading }: Props) {
  const [url, setUrl] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    await onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label htmlFor="single-url" className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-600">
        Single URL
      </label>
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          id="single-url"
          type="url"
          placeholder="Paste a YouTube or Instagram URL"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm outline-none ring-0 transition placeholder:text-zinc-400 focus:border-zinc-900"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="lift h-12 rounded-xl border border-zinc-900 bg-zinc-900 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-400 disabled:bg-zinc-400"
        >
          {isLoading ? "Fetching..." : "Preview"}
        </button>
      </div>
    </form>
  );
}
