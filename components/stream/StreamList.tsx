"use client";

import { useState, useMemo } from "react";
import { StreamEntry } from "./StreamEntry";

type Entry = {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  tags?: string[];
  contentHtml?: string;
};

const TAG_CONFIG: Record<string, { emoji: string; label: string }> = {
  murmur: { emoji: "💭", label: "碎念" },
  blog: { emoji: "📰", label: "文章" },
  video: { emoji: "▶️", label: "影片" },
  music: { emoji: "🎵", label: "音樂" },
};

const PAGE_SIZE = 20;

function getDateKey(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }); // YYYY-MM-DD
}

function formatDateDivider(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00+08:00");
  if (Number.isNaN(d.getTime())) return dateKey;
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  const yesterday = new Date(now.getTime() - 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });

  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";

  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) {
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "Asia/Taipei",
    });
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Taipei",
  });
}

export function StreamList({ entries }: { entries: Entry[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags ?? []) {
        tagSet.add(tag);
      }
    }
    const ordered = ["murmur", "blog", "video", "music"];
    const known = ordered.filter((t) => tagSet.has(t));
    const unknown = [...tagSet].filter((t) => !ordered.includes(t));
    return [...known, ...unknown];
  }, [entries]);

  const filtered = useMemo(() => {
    if (!activeTag) return entries;
    return entries.filter((e) => e.tags?.includes(activeTag));
  }, [entries, activeTag]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Group by date
  let lastDateKey = "";

  return (
    <>
      {/* Tag pills */}
      {availableTags.length > 1 ? (
        <div className="flex flex-wrap gap-2 text-sm" role="toolbar" aria-label="Filter by tag">
          <button
            type="button"
            onClick={() => { setActiveTag(null); setVisibleCount(PAGE_SIZE); }}
            aria-pressed={!activeTag}
            className={`rounded-full border px-3 py-1 transition-colors ${
              !activeTag
                ? "border-[var(--accent-strong)] bg-[var(--highlight)]/60 text-[var(--foreground)]"
                : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => {
            const config = TAG_CONFIG[tag] || { emoji: "🏷️", label: tag };
            return (
              <button
                type="button"
                key={tag}
                onClick={() => { setActiveTag(activeTag === tag ? null : tag); setVisibleCount(PAGE_SIZE); }}
                aria-pressed={activeTag === tag}
                className={`rounded-full border px-3 py-1 transition-colors ${
                  activeTag === tag
                    ? "border-[var(--accent-strong)] bg-[var(--highlight)]/60 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                {config.emoji} {config.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Entries with date dividers */}
      <div className="space-y-3" role="feed" aria-label="Stream entries">
        {visible.length > 0 ? (
          visible.map((item, index) => {
            const dateKey = getDateKey(item.pubDate);
            const showDivider = dateKey && dateKey !== lastDateKey;
            if (dateKey) lastDateKey = dateKey;

            return (
              <div key={item.link || `stream-${index}`}>
                {showDivider ? (
                  <div className={`flex items-center gap-3 ${index > 0 ? "pt-3" : ""}`}>
                    <div className="h-px flex-1 bg-[var(--border)]" />
                    <span className="text-xs font-medium tracking-wide text-[var(--muted)] whitespace-nowrap">
                      {formatDateDivider(dateKey)}
                    </span>
                    <div className="h-px flex-1 bg-[var(--border)]" />
                  </div>
                ) : null}
                <StreamEntry
                  title={item.title}
                  link={item.link}
                  contentHtml={item.contentHtml}
                  description={item.description}
                  pubDate={item.pubDate}
                  tags={item.tags}
                />
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[var(--muted)]">No entries yet.</p>
        )}
      </div>

      {/* Load More */}
      {hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm text-[var(--foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Load more ↓
          </button>
        </div>
      ) : null}
    </>
  );
}
