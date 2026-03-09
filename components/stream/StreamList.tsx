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

export function StreamList({ entries }: { entries: Entry[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags ?? []) {
        tagSet.add(tag);
      }
    }
    // Return in preferred order
    const ordered = ["murmur", "blog", "video", "music"];
    return ordered.filter((t) => tagSet.has(t));
  }, [entries]);

  const filtered = useMemo(() => {
    if (!activeTag) return entries;
    return entries.filter((e) => e.tags?.includes(activeTag));
  }, [entries, activeTag]);

  return (
    <>
      {/* Tag pills */}
      {availableTags.length > 1 ? (
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
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
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
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

      {/* Entries */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <StreamEntry
              key={item.link || item.title}
              title={item.title}
              link={item.link}
              contentHtml={item.contentHtml}
              description={item.description}
              pubDate={item.pubDate}
              tags={item.tags}
            />
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">No entries yet.</p>
        )}
      </div>
    </>
  );
}
