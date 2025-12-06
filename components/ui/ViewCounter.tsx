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

type ViewStatsProps = {
  storageKey?: string;
  label?: string;
};

// Local-only view stats: counts are stored in localStorage per-device.
export function ViewStats({ storageKey = "home", label = "瀏覽人次（本機）" }: ViewStatsProps) {
  const [today, setToday] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const todayKey = `${storageKey}:today`;
    const totalKey = `${storageKey}:total`;
    const todayDateKey = `${storageKey}:today-date`;
    const todayDate = new Date().toISOString().slice(0, 10);

    try {
      const storedDate = localStorage.getItem(todayDateKey);
      const storedToday = Number.parseInt(localStorage.getItem(todayKey) || "0", 10) || 0;
      const storedTotal = Number.parseInt(localStorage.getItem(totalKey) || "0", 10) || 0;

      const nextToday = storedDate === todayDate ? storedToday + 1 : 1;
      const nextTotal = storedTotal + 1;

      localStorage.setItem(todayKey, String(nextToday));
      localStorage.setItem(totalKey, String(nextTotal));
      localStorage.setItem(todayDateKey, todayDate);

      setToday(nextToday);
      setTotal(nextTotal);
    } catch {
      setToday(0);
      setTotal(0);
    }
  }, [storageKey]);

  return (
    <div className="flex gap-4 text-xs text-[var(--muted)]">
      <span>{label}</span>
      <span>今日：{today !== null ? today : "…"}</span>
      <span>總計：{total !== null ? total : "…"}</span>
    </div>
  );
}
