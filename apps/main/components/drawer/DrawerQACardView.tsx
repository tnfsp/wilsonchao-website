"use client";

import type { DrawerQACard } from "@/lib/content";

/**
 * Renders a single anonymous Q&A card in the paper-slip style of the drawer.
 * Layout: "匿名訪客問：<question>" / divider / "Wilson：<answer>"
 */
export function DrawerQACardView({ card }: { card: DrawerQACard }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">匿名訪客問：</p>
      <p className="text-lg font-semibold leading-relaxed text-[var(--foreground)]">
        {card.question}
      </p>
      <hr className="border-[var(--border)]" />
      <p className="text-sm text-[var(--muted)]">Wilson：</p>
      <p className="leading-relaxed text-[var(--foreground)]">{card.answer}</p>
    </div>
  );
}
