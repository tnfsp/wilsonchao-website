"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { StandardPresetOrder, PresetCategory } from "@/lib/simulator/scenarios/standard/types";

// ─── Category config ────────────────────────────────────────────────────────

const categoryLabels: Record<PresetCategory, string> = {
  medication: "藥物",
  procedure: "處置",
  lab: "檢查",
  communication: "溝通",
};

const categoryOrder: PresetCategory[] = ["medication", "procedure", "lab", "communication"];

// ─── Flash feedback state ───────────────────────────────────────────────────

interface FlashState {
  orderId: string;
  type: "correct" | "wrong";
  message?: string;
}

// ─── PresetOrderPanel ───────────────────────────────────────────────────────

interface PresetOrderPanelProps {
  presets: StandardPresetOrder[];
  onExecuteOrder: (preset: StandardPresetOrder) => void;
  executedOrderIds: Set<string>;
}

export default function PresetOrderPanel({
  presets,
  onExecuteOrder,
  executedOrderIds,
}: PresetOrderPanelProps) {
  const [flash, setFlash] = useState<FlashState | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleClick = useCallback(
    (preset: StandardPresetOrder) => {
      if (executedOrderIds.has(preset.id)) return;

      onExecuteOrder(preset);

      if (preset.isCorrect) {
        setFlash({ orderId: preset.id, type: "correct" });
      } else {
        setFlash({
          orderId: preset.id,
          type: "wrong",
          message: preset.feedbackIfWrong,
        });
      }

      const duration = preset.isCorrect ? 1200 : 3000;
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlash(null), duration);
    },
    [onExecuteOrder, executedOrderIds],
  );

  // Group presets by category
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: presets.filter((p) => p.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Flash feedback overlay */}
      {flash?.type === "wrong" && flash.message && (
        <div className="rounded-xl border border-yellow-600/50 bg-yellow-950/80 px-4 py-3 text-sm text-yellow-200 animate-pulse">
          <span className="font-bold text-yellow-400">護理師：</span>{" "}
          {flash.message}
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((preset) => {
              const isExecuted = executedOrderIds.has(preset.id);
              const isFlashCorrect =
                flash?.orderId === preset.id && flash.type === "correct";
              const isFlashWrong =
                flash?.orderId === preset.id && flash.type === "wrong";

              return (
                <button
                  key={preset.id}
                  onClick={() => handleClick(preset)}
                  disabled={isExecuted}
                  className={`
                    relative flex items-center gap-2.5 rounded-xl border px-3 py-3
                    text-left text-sm font-medium transition-all duration-200
                    ${
                      isExecuted
                        ? "cursor-default border-slate-700/40 bg-slate-800/30 text-slate-600"
                        : isFlashCorrect
                          ? "border-green-500/60 bg-green-950/60 text-green-300 ring-2 ring-green-500/40"
                          : isFlashWrong
                            ? "border-yellow-500/60 bg-yellow-950/60 text-yellow-300 ring-2 ring-yellow-500/40"
                            : "border-slate-600/40 bg-slate-800/60 text-slate-200 hover:border-blue-500/50 hover:bg-slate-700/60 active:scale-[0.97]"
                    }
                  `}
                >
                  <span className="text-lg shrink-0">
                    {isExecuted ? "✓" : preset.icon}
                  </span>
                  <span className="leading-tight">{preset.label}</span>
                  {isFlashCorrect && (
                    <span className="absolute -right-1 -top-1 text-green-400 text-lg">
                      ✅
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
