"use client";

import { useProGameStore } from "@/lib/simulator/store";
import type { ChestTubeColor } from "@/lib/simulator/types";

// ─── Color labels ────────────────────────────────────────────────────────────

const COLOR_LABEL: Record<ChestTubeColor, { label: string; cls: string }> = {
  bright_red: { label: "\u9bae\u7d05", cls: "text-red-400" },
  dark_red: { label: "\u6697\u7d05", cls: "text-red-500" },
  serosanguineous: { label: "\u6de1\u8840\u6027", cls: "text-rose-300" },
  serous: { label: "\u6f3f\u6db2\u6027", cls: "text-amber-300" },
};

// ─── ChestTubeInline ─────────────────────────────────────────────────────────
// Compact single-row CT status for mobile monitor panel.
// Shows: rate, total, color, patent status.
// Does NOT reveal obstruction — player must discover it themselves.

export default function ChestTubeInline() {
  const chestTube = useProGameStore((s) => s.patient?.chestTube);

  if (!chestTube) return null;

  const colorCfg = COLOR_LABEL[chestTube.color];
  const rateColor =
    chestTube.currentRate > 200
      ? "text-red-400"
      : chestTube.currentRate > 100
        ? "text-yellow-400"
        : "text-green-400";
  const totalColor =
    chestTube.totalOutput > 1000
      ? "text-red-400"
      : chestTube.totalOutput > 500
        ? "text-yellow-400"
        : "text-gray-300";

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 text-xs border-t border-white/5 bg-[#001219]">
      <span className="text-gray-500 uppercase tracking-wider text-[10px] font-medium flex-shrink-0">
        CT:
      </span>
      <span className={`font-mono font-bold ${rateColor}`}>
        {chestTube.currentRate}cc/hr
      </span>
      <span className={`font-mono ${totalColor}`}>
        {chestTube.totalOutput}cc
      </span>
      <span className={`${colorCfg.cls}`}>{colorCfg.label}</span>
      <span
        className={`font-mono ${
          chestTube.isPatent ? "text-green-400" : "text-gray-500"
        }`}
      >
        {chestTube.isPatent ? "Patent" : "---"}
      </span>
    </div>
  );
}
