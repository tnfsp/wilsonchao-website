"use client";

import { useState, useMemo } from "react";
import type { TasteEntity } from "@/lib/content";

const TYPE_CONFIG: Record<TasteEntity["type"], { emoji: string; label: string }> = {
  music: { emoji: "🎵", label: "樂" },
  book: { emoji: "📖", label: "書" },
  movie: { emoji: "🎬", label: "影" },
};

const TYPE_ORDER: TasteEntity["type"][] = ["music", "book", "movie"];

function TasteCard({ entity }: { entity: TasteEntity }) {
  const config = TYPE_CONFIG[entity.type];
  return (
    <article className="surface-card flex flex-col gap-2 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold leading-tight text-[var(--foreground)]">
          {entity.title}
        </h3>
        <span
          className="flex-shrink-0 text-sm text-[var(--muted)]"
          aria-label={config.label}
          title={config.label}
        >
          {config.emoji}
        </span>
      </div>

      {(entity.subtitle || entity.year) && (
        <p className="text-xs text-[var(--muted)]">
          {entity.subtitle}
          {entity.subtitle && entity.year ? " · " : ""}
          {entity.year ?? ""}
        </p>
      )}

      {entity.why && (
        <p className="border-l-2 border-[var(--accent)]/40 pl-3 text-sm leading-relaxed text-[var(--foreground)]">
          {entity.why}
        </p>
      )}

      {entity.links && entity.links.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
          {entity.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-link text-xs text-[var(--accent)]"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}

      {entity.tags && entity.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {entity.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--highlight)]/50 px-2 py-0.5 text-[11px] text-[var(--muted)]"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function TasteShelf({ entities }: { entities: TasteEntity[] }) {
  const [activeType, setActiveType] = useState<TasteEntity["type"] | null>(null);

  const availableTypes = useMemo(() => {
    const set = new Set(entities.map((e) => e.type));
    return TYPE_ORDER.filter((t) => set.has(t));
  }, [entities]);

  const filtered = useMemo(
    () => (activeType ? entities.filter((e) => e.type === activeType) : entities),
    [entities, activeType]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entities) c[e.type] = (c[e.type] ?? 0) + 1;
    return c;
  }, [entities]);

  return (
    <>
      {availableTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm" role="toolbar" aria-label="依類型篩選">
          <button
            type="button"
            onClick={() => setActiveType(null)}
            aria-pressed={!activeType}
            className={`rounded-full border px-3 py-1 transition-colors ${
              !activeType
                ? "border-[var(--accent-strong)] bg-[var(--highlight)]/60 text-[var(--foreground)]"
                : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            }`}
          >
            全部 {entities.length}
          </button>
          {availableTypes.map((type) => {
            const config = TYPE_CONFIG[type];
            return (
              <button
                type="button"
                key={type}
                onClick={() => setActiveType(activeType === type ? null : type)}
                aria-pressed={activeType === type}
                className={`rounded-full border px-3 py-1 transition-colors ${
                  activeType === type
                    ? "border-[var(--accent-strong)] bg-[var(--highlight)]/60 text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                }`}
              >
                {config.emoji} {config.label} {counts[type] ?? 0}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((entity) => (
          <TasteCard key={entity.id} entity={entity} />
        ))}
      </div>
    </>
  );
}
