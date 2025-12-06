"use client";

import { useEffect, useState } from "react";

type ViewCounterProps = {
  slug: string;
  label?: string;
};

export function ViewCounter({ slug, label = "瀏覽人次（本機）" }: ViewCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const storageKey = `view-count:${slug}`;
    try {
      const current = Number.parseInt(localStorage.getItem(storageKey) || "0", 10) || 0;
      const next = current + 1;
      localStorage.setItem(storageKey, String(next));
      setCount(next);
    } catch {
      setCount(0);
    }
  }, [slug]);

  return (
    <span className="text-xs text-[var(--muted)]">
      {label}：{count !== null ? count : "…"}
    </span>
  );
}
