"use client";

import { useProGameStore } from "@/lib/simulator/store";
import type { ChestTubeColor } from "@/lib/simulator/types";

// ─── Color config ─────────────────────────────────────────────────────────────

const COLOR_CONFIG: Record<
  ChestTubeColor,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  bright_red: {
    label: "鮮紅",
    bgClass: "bg-red-600",
    textClass: "text-red-300",
    borderClass: "border-red-500/60",
  },
  dark_red: {
    label: "暗紅",
    bgClass: "bg-red-900",
    textClass: "text-red-400",
    borderClass: "border-red-700/60",
  },
  serosanguineous: {
    label: "淡血性",
    bgClass: "bg-rose-800",
    textClass: "text-rose-300",
    borderClass: "border-rose-600/60",
  },
  serous: {
    label: "漿液性",
    bgClass: "bg-amber-700",
    textClass: "text-amber-300",
    borderClass: "border-amber-600/40",
  },
};

// ─── StatusRow ────────────────────────────────────────────────────────────────

function StatusRow({
  label,
  ok,
  okLabel = "✓",
  badLabel = "✗",
  alert = false,
}: {
  label: string;
  ok: boolean;
  okLabel?: string;
  badLabel?: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span
        className={`font-mono font-bold ${
          ok
            ? "text-green-400"
            : alert
              ? "text-red-400 animate-pulse"
              : "text-red-400"
        }`}
      >
        {ok ? okLabel : badLabel}
      </span>
    </div>
  );
}

// ─── ChestTubePanel ───────────────────────────────────────────────────────────

export default function ChestTubePanel() {
  const chestTube = useProGameStore((s) => s.patient?.chestTube);

  if (!chestTube) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/5 p-4 text-gray-500 text-sm">
        Chest Tube 尚未載入
      </div>
    );
  }

  const colorCfg = COLOR_CONFIG[chestTube.color];
  const isCritical = chestTube.currentRate > 200 || !chestTube.isPatent;

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        isCritical
          ? "border-red-500/60 bg-red-950/20"
          : "border-white/8 bg-[#001a25]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isCritical ? "bg-red-500 animate-ping" : "bg-gray-500"
            }`}
          />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            Chest Tube
          </span>
        </div>
        {isCritical && (
          <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
            ⚠ Alert
          </span>
        )}
      </div>

      {/* Rate + Total */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-black/30 border border-white/8 p-2.5">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
            Rate
          </div>
          <div
            className={`font-mono font-bold text-2xl ${
              chestTube.currentRate > 200
                ? "text-red-400"
                : chestTube.currentRate > 100
                  ? "text-yellow-400"
                  : "text-green-400"
            }`}
          >
            {chestTube.currentRate}
            <span className="text-xs font-normal text-gray-500 ml-1">
              cc/hr
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-black/30 border border-white/8 p-2.5">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
            累計
          </div>
          <div
            className={`font-mono font-bold text-2xl ${
              chestTube.totalOutput > 1000
                ? "text-red-400"
                : chestTube.totalOutput > 500
                  ? "text-yellow-400"
                  : "text-gray-300"
            }`}
          >
            {chestTube.totalOutput}
            <span className="text-xs font-normal text-gray-500 ml-1">cc</span>
          </div>
        </div>
      </div>

      {/* Color indicator */}
      <div
        className={`rounded-lg border ${colorCfg.borderClass} bg-black/30 px-3 py-2.5 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-sm ${colorCfg.bgClass} flex-shrink-0`} />
          <span className="text-[10px] uppercase tracking-widest text-gray-500">
            顏色
          </span>
        </div>
        <span className={`text-sm font-semibold ${colorCfg.textClass}`}>
          {colorCfg.label}
        </span>
      </div>

      {/* Status rows */}
      <div className="rounded-lg bg-black/30 border border-white/8 px-3 py-2 space-y-1.5">
        <StatusRow
          label="Patent"
          ok={chestTube.isPatent}
          okLabel="✓ Patent"
          badLabel="✗ Obstructed"
          alert={!chestTube.isPatent}
        />
        <StatusRow
          label="Air Leak"
          ok={!chestTube.airLeak}
          okLabel="✓ None"
          badLabel="✗ Present"
        />
        {chestTube.hasClots && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">血塊</span>
            <span className="text-red-400 font-bold animate-pulse">
              ⚠ 有血塊
            </span>
          </div>
        )}
      </div>

      {/* Not-patent warning */}
      {!chestTube.isPatent && (
        <div className="rounded-lg bg-red-950/50 border border-red-500/60 px-3 py-2">
          <p className="text-red-300 text-xs font-semibold leading-snug">
            ⚠ Chest tube 可能阻塞！
            <br />
            <span className="font-normal text-red-400">
              Output 假性減少 → Tamponade risk！考慮 Milk/Strip CT。
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
