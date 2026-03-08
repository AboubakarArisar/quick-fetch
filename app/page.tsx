"use client";

import { useMemo, useState } from "react";
import BatchInput from "@/components/BatchInput";
import ClipSelector from "@/components/ClipSelector";
import DownloadOptions from "@/components/DownloadOptions";
import UrlInput from "@/components/UrlInput";
import VideoPreview from "@/components/VideoPreview";
import type { VideoInfoResponse } from "@/lib/types";

type ItemState = {
  id: string;
  sourceUrl: string;
  data?: VideoInfoResponse;
  error?: string;
  isPending?: boolean;
  clipStart?: number;
  clipEnd?: number;
};

function createItemId() {
  return `${Date.now()}-${Math.random()}`;
}

async function fetchVideoInfo(url: string): Promise<VideoInfoResponse> {
  const response = await fetch("/api/video-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Failed to load video info");
  }

  return response.json();
}

export default function Home() {
  const [items, setItems] = useState<ItemState[]>([]);
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);

  const loading = isLoadingSingle || isLoadingBatch;

  async function handleSingleSubmit(url: string) {
    const id = createItemId();
    setIsLoadingSingle(true);
    setItems([
      {
        id,
        sourceUrl: url,
        isPending: true,
      },
    ]);

    try {
      const data = await fetchVideoInfo(url);
      setItems([
        {
          id,
          sourceUrl: url,
          data,
          isPending: false,
        },
      ]);
    } catch (error) {
      setItems([
        {
          id,
          sourceUrl: url,
          error: error instanceof Error ? error.message : "Unknown error",
          isPending: false,
        },
      ]);
    } finally {
      setIsLoadingSingle(false);
    }
  }

  async function handleBatchSubmit(urls: string[]) {
    setIsLoadingBatch(true);
    const pendingItems = urls.map((url) => ({
      id: createItemId(),
      sourceUrl: url,
      isPending: true,
    }));

    setItems(pendingItems);

    for (const pendingItem of pendingItems) {
      try {
        const data = await fetchVideoInfo(pendingItem.sourceUrl);
        setItems((current) =>
          current.map((item) =>
            item.id === pendingItem.id
              ? {
                  ...item,
                  data,
                  error: undefined,
                  isPending: false,
                }
              : item,
          ),
        );
      } catch (error) {
        setItems((current) =>
          current.map((item) =>
            item.id === pendingItem.id
              ? {
                  ...item,
                  data: undefined,
                  error: error instanceof Error ? error.message : "Unknown error",
                  isPending: false,
                }
              : item,
          ),
        );
      }
    }
    setIsLoadingBatch(false);
  }

  function setClipBounds(id: string, start?: number, end?: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, clipStart: start, clipEnd: end } : item,
      ),
    );
  }

  const summary = useMemo(() => {
    const successCount = items.filter((item) => item.data).length;
    const errorCount = items.filter((item) => item.error).length;
    const pendingCount = items.filter((item) => item.isPending).length;
    const doneCount = items.length - pendingCount;
    return { successCount, errorCount, pendingCount, doneCount, totalCount: items.length };
  }, [items]);

  const showSkeletons = loading && items.length === 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="fade-up mb-8 grid gap-5">
        <div className="surface-card rounded-3xl px-5 py-6 sm:px-7 sm:py-8">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 font-mono text-[11px] tracking-[0.16em] text-zinc-700">
            <span className="inline-block size-2 rounded-full bg-zinc-900" />
            QUICKFETCH / LIVE
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-5xl lg:text-[3.4rem]">
            Fast, clean media downloads for YouTube and Instagram.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Drop a link, inspect formats instantly, trim a clip when needed,
            and download directly without clutter.
          </p>
        </div>
      </section>

      <section className="fade-up surface-card mb-8 rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-200 pb-4">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
            Fetch Media
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            URL Intake
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-soft rounded-2xl p-4">
            <UrlInput onSubmit={handleSingleSubmit} isLoading={isLoadingSingle} />
          </div>
          <div className="surface-soft rounded-2xl p-4">
            <BatchInput onSubmit={handleBatchSubmit} isLoading={isLoadingBatch} />
          </div>
        </div>
      </section>

      {(loading || items.length > 0) && (
        <section className="fade-up mb-5 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          <span>
            {loading
              ? `Fetching ${summary.doneCount}/${summary.totalCount}...`
              : `${summary.successCount} ready • ${summary.errorCount} failed`}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            Stream Mode
          </span>
        </section>
      )}

      {showSkeletons ? (
        <section className="grid gap-5">
          {[0, 1].map((skeleton) => (
            <article
              key={`skeleton-${skeleton}`}
              className="surface-card fade-up rounded-3xl p-4 sm:p-6"
              style={{ animationDelay: `${skeleton * 90}ms` }}
            >
              <div className="shimmer mb-4 h-3 w-2/3 rounded bg-zinc-200" />
              <div className="grid gap-4 md:grid-cols-[300px_1fr]">
                <div className="shimmer h-[170px] rounded-2xl bg-zinc-200" />
                <div className="grid gap-3">
                  <div className="shimmer h-3 w-28 rounded bg-zinc-200" />
                  <div className="shimmer h-7 w-5/6 rounded bg-zinc-200" />
                  <div className="shimmer h-3 w-full rounded bg-zinc-200" />
                  <div className="shimmer h-3 w-11/12 rounded bg-zinc-200" />
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="shimmer h-12 rounded-lg bg-zinc-200" />
                    <div className="shimmer h-12 rounded-lg bg-zinc-200" />
                    <div className="shimmer h-12 rounded-lg bg-zinc-200" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section className="grid gap-6">
        {items.map((item, index) => (
          <article
            key={item.id}
            className="fade-up surface-card rounded-3xl p-4 sm:p-6"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <p className="mb-3 truncate font-mono text-xs text-zinc-500">
              Source: {item.sourceUrl}
            </p>

            {item.error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {item.error}
              </p>
            ) : null}

            {item.isPending ? (
              <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-700">Fetching media details...</p>
                <div className="grid gap-2">
                  <div className="shimmer h-3 w-1/3 rounded bg-zinc-200" />
                  <div className="shimmer h-3 w-4/5 rounded bg-zinc-200" />
                  <div className="shimmer h-3 w-2/3 rounded bg-zinc-200" />
                </div>
              </div>
            ) : null}

            {item.data && !item.isPending ? (
              <div className="grid gap-4">
                <VideoPreview info={item.data} />
                <ClipSelector
                  durationSeconds={item.data.durationSeconds}
                  onChange={(start, end) => setClipBounds(item.id, start, end)}
                />
                <DownloadOptions
                  info={item.data}
                  clipStart={item.clipStart}
                  clipEnd={item.clipEnd}
                />
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
