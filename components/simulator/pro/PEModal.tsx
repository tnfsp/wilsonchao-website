"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { PEFinding } from "@/lib/simulator/types";

// ── PE area definitions ──────────────────────────────────────

interface PEArea {
  key: string;
  label: string;
  emoji: string;
  description: string;
}

const PE_AREAS: PEArea[] = [
  { key: "general",      label: "General",           emoji: "🧍", description: "整體外觀、意識狀態、膚色" },
  { key: "chest",        label: "Chest / Resp",      emoji: "🫁", description: "胸部視診聽診、傷口" },
  { key: "heart",        label: "Cardiovascular",    emoji: "🫀", description: "心音、心律、周邊脈搏" },
  { key: "abdomen",      label: "Abdomen",           emoji: "🩺", description: "腹部觸診聽診" },
  { key: "extremities",  label: "Extremities",       emoji: "🦵", description: "四肢脈搏、水腫、灌流" },
  { key: "ct_site",      label: "Chest Tube Site",   emoji: "🩹", description: "CT 傷口、引流管" },
];

// ── Component ────────────────────────────────────────────────

export function PEModal() {
  const { scenario, clock, closeModal, addTimelineEntry } = useProGameStore();
  const [selected, setSelected]   = useState<string | null>(null);
  const [examined, setExamined]   = useState<Set<string>>(new Set());
  const [showFinding, setShowFinding] = useState(false);

  if (!scenario) return null;

  const physicalExam = scenario.physicalExam as Record<string, PEFinding>;

  function handleSelectArea(key: string) {
    setSelected(key);
    setShowFinding(false);
    // slight delay for "examining" feel
    setTimeout(() => setShowFinding(true), 200);
  }

  function handleRecordAction(key: string) {
    const area = PE_AREAS.find((a) => a.key === key);
    if (!area) return;

    // Add to timeline
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `🔬 你做了理學檢查 — ${area.label}`,
      sender: "player",
    });

    // Update playerActions via zustand setState (no dedicated action in store)
    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        `pe:${key}:${area.label}`,
      ],
    }));

    setExamined((prev) => new Set(prev).add(key));
  }

  const currentFinding: PEFinding | undefined =
    selected ? physicalExam[selected] : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-teal-800/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-teal-900/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                理學檢查
              </h2>
              <p className="text-teal-400/70 text-xs">
                選擇部位 → 查看 finding → 記錄到 chart
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-teal-500/60 hover:text-white transition-colors text-xl font-light"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-0 flex-1 overflow-hidden">
          {/* Left: Area grid */}
          <div className="md:w-56 border-b md:border-b-0 md:border-r border-teal-900/40 p-4 flex flex-col gap-2">
            <p className="text-teal-400/50 text-xs uppercase tracking-widest mb-1">
              部位選擇
            </p>
            {PE_AREAS.map((area) => {
              const isDone = examined.has(area.key);
              const isSelected = selected === area.key;

              return (
                <button
                  key={area.key}
                  onClick={() => handleSelectArea(area.key)}
                  className={`
                    w-full text-left rounded-lg px-3 py-2.5 transition-all border
                    ${isSelected
                      ? "border-teal-500 bg-teal-900/40 text-white"
                      : isDone
                      ? "border-teal-800/40 bg-teal-950/30 text-teal-400"
                      : "border-teal-900/30 bg-transparent text-teal-300/70 hover:border-teal-700/60 hover:bg-teal-950/20"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{area.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight truncate">
                        {area.label}
                      </div>
                      <div className="text-xs text-teal-500/50 truncate">
                        {area.description}
                      </div>
                    </div>
                    {isDone && (
                      <span className="text-teal-400 text-xs flex-shrink-0">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Finding */}
          <div className="flex-1 p-5 flex flex-col overflow-y-auto">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3 opacity-30">🩺</div>
                  <p className="text-teal-500/40 text-sm">
                    點選左側部位開始檢查
                  </p>
                </div>
              </div>
            ) : !showFinding ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl mb-2 animate-pulse">🔍</div>
                  <p className="text-teal-400/50 text-sm">檢查中...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Area title */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">
                    {PE_AREAS.find((a) => a.key === selected)?.emoji}
                  </span>
                  <h3 className="text-teal-200 font-semibold text-base">
                    {PE_AREAS.find((a) => a.key === selected)?.label}
                  </h3>
                  {examined.has(selected) && (
                    <span className="ml-auto text-xs text-teal-400 bg-teal-900/30 px-2 py-0.5 rounded-full border border-teal-700/30">
                      ✓ 已記錄
                    </span>
                  )}
                </div>

                {/* Finding card */}
                {currentFinding ? (
                  <div
                    className="rounded-lg border border-teal-800/40 p-4 mb-4 flex-1"
                    style={{ backgroundColor: "#002030" }}
                  >
                    <p className="text-xs text-teal-500/60 uppercase tracking-widest mb-2">
                      Finding
                    </p>
                    <p className="text-teal-100 text-sm leading-relaxed whitespace-pre-line">
                      {currentFinding.finding}
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-lg border border-teal-900/30 p-4 mb-4 flex-1 flex items-center justify-center"
                    style={{ backgroundColor: "#001a27" }}
                  >
                    <p className="text-teal-500/40 text-sm italic">
                      此部位目前無特殊 finding
                    </p>
                  </div>
                )}

                {/* Record button */}
                {!examined.has(selected) ? (
                  <button
                    onClick={() => handleRecordAction(selected)}
                    className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors border border-teal-600"
                  >
                    ✓ 記錄到 Chart（Timeline）
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-lg text-center text-teal-400/60 text-sm border border-teal-900/30">
                    已記錄到 Timeline
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer summary */}
        {examined.size > 0 && (
          <div className="border-t border-teal-900/40 px-5 py-3 flex items-center justify-between">
            <span className="text-teal-400/60 text-xs">
              已檢查 {examined.size} / {PE_AREAS.length} 個部位
            </span>
            <button
              onClick={closeModal}
              className="text-xs text-teal-400 hover:text-teal-200 transition-colors"
            >
              完成 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
