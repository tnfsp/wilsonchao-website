"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { POCUSView } from "@/lib/simulator/types";

// ── Real echo video clips per pathology + view ───────────────

interface EchoClip {
  src: string;
  label: string;
}

/** Map: pathology → pocus view key → clips */
const ECHO_CLIPS: Record<string, Record<string, EchoClip[]>> = {
  cardiac_tamponade: {
    cardiac: [
      { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C — 心包積液 + RV collapse" },
      { src: "/assets/echo/cardiac-tamponade/plax.mp4", label: "PLAX — 心包積液" },
      { src: "/assets/echo/cardiac-tamponade/psax.mp4", label: "PSAX" },
      { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal" },
    ],
    ivc: [
      { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC — 擴張無塌陷（plethora）" },
    ],
    lung: [],
  },
  tamponade: {
    cardiac: [
      { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C — 心包積液" },
      { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal" },
    ],
    ivc: [
      { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC — 擴張無塌陷" },
    ],
    lung: [],
  },
  surgical_bleeding: {
    cardiac: [],
    ivc: [
      { src: "/assets/echo/hypovolemia/ivc-long.mp4", label: "IVC Long Axis — 塌陷（低血容）" },
      { src: "/assets/echo/hypovolemia/ivc-trans.mp4", label: "IVC Trans — 呼吸變化明顯" },
    ],
    lung: [],
  },
  lcos: {
    cardiac: [
      { src: "/assets/echo/takotsubo/a4c.mp4", label: "A4C — LV dysfunction" },
      { src: "/assets/echo/takotsubo/plax.mp4", label: "PLAX — 收縮功能下降" },
    ],
    ivc: [],
    lung: [
      { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines — 肺水腫" },
    ],
  },
  septic_shock: {
    cardiac: [],
    ivc: [],
    lung: [
      { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines — ARDS/肺水腫" },
      { src: "/assets/echo/lung-b-lines/confluent-b-lines.mp4", label: "Confluent B-lines — 嚴重肺浸潤" },
    ],
  },
  tension_pneumothorax: {
    cardiac: [],
    ivc: [],
    lung: [
      { src: "/assets/echo/lung-pneumothorax/absent-sliding.mp4", label: "Lung — 肺滑動消失（Absent sliding）" },
    ],
  },
};

// ── POCUS view definitions ───────────────────────────────────

interface POCUSOption {
  key: string;
  type: POCUSView["type"];
  label: string;
  emoji: string;
  subtitle: string;
  clinicalHint?: string;
}

const POCUS_OPTIONS: POCUSOption[] = [
  {
    key: "cardiac",
    type: "cardiac",
    label: "Cardiac",
    emoji: "🫀",
    subtitle: "Pericardial effusion / LV function / Tamponade",
    clinicalHint: "術後出血情境下最重要 — 排除 tamponade",
  },
  {
    key: "lung",
    type: "lung",
    label: "Lung",
    emoji: "🫁",
    subtitle: "Pulmonary edema / Pneumothorax / Pleural effusion",
  },
  {
    key: "ivc",
    type: "ivc",
    label: "IVC",
    emoji: "🩸",
    subtitle: "Volume status / Fluid responsiveness",
  },
];

// ── Component ────────────────────────────────────────────────

export function POCUSModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { scenario, clock, closeModal, addTimelineEntry } = useProGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [scanned, setScanned]   = useState<Set<string>>(new Set());

  if (activeModal !== "pocus" || !scenario) return null;

  const availablePOCUS = scenario.availablePOCUS as Record<string, POCUSView>;

  function handleSelect(key: string) {
    setSelected(key);
    setShowResult(false);
    setTimeout(() => setShowResult(true), 300);
  }

  function handleRecord(key: string) {
    const opt = POCUS_OPTIONS.find((o) => o.key === key);
    if (!opt) return;

    // POCUS takes ~3 game-minutes
    useProGameStore.getState().actionAdvance(3);

    addTimelineEntry({
      gameTime: useProGameStore.getState().clock.currentTime,
      type: "player_action",
      content: `🫀 你做了 POCUS — ${opt.label}`,
      sender: "player",
    });

    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        { action: `pocus:${key}:${opt.label}`, gameTime: useProGameStore.getState().clock.currentTime, category: "pocus" },
      ],
    }));

    setScanned((prev) => new Set(prev).add(key));
  }

  const currentView: POCUSView | undefined =
    selected ? availablePOCUS[selected] : undefined;

  const selectedOpt = POCUS_OPTIONS.find((o) => o.key === selected);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-cyan-800/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩻</span>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                POCUS
              </h2>
              <p className="text-cyan-400/60 text-xs">
                Point-of-Care Ultrasound — 床邊即時超音波
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-cyan-500/50 hover:text-white transition-colors text-xl font-light"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* POCUS options */}
        <div className="px-5 pt-4 pb-2 flex flex-col gap-2">
          {POCUS_OPTIONS.map((opt) => {
            const isSelected = selected === opt.key;
            const isDone = scanned.has(opt.key);

            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                className={`
                  w-full text-left rounded-lg px-4 py-3 transition-all border
                  ${isSelected
                    ? "border-cyan-500 bg-cyan-900/30 text-white"
                    : isDone
                    ? "border-cyan-800/30 bg-cyan-950/20 text-cyan-400"
                    : "border-cyan-900/25 bg-transparent text-cyan-300/70 hover:border-cyan-700/50 hover:bg-cyan-950/15"
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{opt.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{opt.label}</span>
                      {isDone && (
                        <span className="text-xs text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded-full border border-cyan-700/30">
                          ✓ scanned
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cyan-500/60 mt-0.5">
                      {opt.subtitle}
                    </div>
                    {opt.clinicalHint && (
                      <div className="text-xs text-amber-400/70 mt-1 flex items-center gap-1">
                        <span>⚠️</span> {opt.clinicalHint}
                      </div>
                    )}
                  </div>
                  <span className={`text-cyan-600 mt-1 flex-shrink-0 transition-transform ${isSelected ? "rotate-90" : ""}`}>
                    ›
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Result panel */}
        {selected && (
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2">
            {!showResult ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-2xl mb-2 animate-pulse">🔊</div>
                  <p className="text-cyan-400/50 text-sm">掃描中...</p>
                </div>
              </div>
            ) : currentView ? (
              <div
                className="rounded-lg border border-cyan-800/30 overflow-hidden"
                style={{ backgroundColor: "#001e2e" }}
              >
                {/* View label */}
                <div className="px-4 py-2.5 border-b border-cyan-900/30 flex items-center gap-2">
                  <span className="text-lg">{selectedOpt?.emoji}</span>
                  <span className="text-cyan-200 font-medium text-sm">
                    {selectedOpt?.label} POCUS
                  </span>
                  <span className="ml-auto text-xs text-cyan-500/50 uppercase tracking-widest">
                    Bedside
                  </span>
                </div>

                {/* Real echo video clips */}
                {(() => {
                  const pathology = scenario?.pathology ?? "";
                  const clips = ECHO_CLIPS[pathology]?.[selected] ?? [];
                  if (clips.length === 0) return null;
                  return (
                    <div className="px-4 py-3 border-b border-cyan-900/20">
                      <p className="text-xs text-cyan-500/60 uppercase tracking-widest mb-2">
                        Echo Clips
                      </p>
                      <div className="space-y-2">
                        {clips.map((clip, ci) => (
                          <div key={ci} className="rounded-lg overflow-hidden border border-cyan-900/30">
                            <video
                              src={clip.src}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-auto"
                            />
                            <p className="text-cyan-400/70 text-xs px-2 py-1 bg-black/40">
                              🎬 {clip.label}
                            </p>
                          </div>
                        ))}
                        <p className="text-cyan-600/40 text-[10px]">
                          📷 LITFL ECG Library / Wikimedia Commons, CC-BY-NC-SA 4.0
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Finding */}
                <div className="px-4 py-3 border-b border-cyan-900/20">
                  <p className="text-xs text-cyan-500/60 uppercase tracking-widest mb-2">
                    Finding
                  </p>
                  <p className="text-teal-100 text-sm leading-relaxed">
                    {currentView.finding}
                  </p>
                </div>

                {/* Interpretation */}
                <div className="px-4 py-3">
                  <p className="text-xs text-cyan-500/60 uppercase tracking-widest mb-2">
                    Interpretation
                  </p>
                  <p className="text-cyan-200/80 text-sm leading-relaxed">
                    {currentView.interpretation}
                  </p>
                </div>

                {/* Clinical note for cardiac in bleeding scenario */}
                {selected === "cardiac" && (
                  <div className="mx-4 mb-4 px-3 py-2 rounded bg-amber-900/20 border border-amber-700/30">
                    <p className="text-amber-300/80 text-xs leading-relaxed">
                      💡 <strong>臨床提示：</strong>CT output 若突然驟減，務必立即重做 Cardiac POCUS — CT 堵住引流假性減少，可能掩蓋進展中的 tamponade。
                    </p>
                  </div>
                )}

                {/* Record button */}
                <div className="px-4 pb-4">
                  {!scanned.has(selected) ? (
                    <button
                      onClick={() => handleRecord(selected)}
                      className="w-full py-2.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-medium transition-colors border border-cyan-600"
                    >
                      ✓ 記錄到 Timeline
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-cyan-400/50 text-xs">
                      已記錄到 Timeline
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="rounded-lg border border-cyan-900/30 p-4 text-center"
                style={{ backgroundColor: "#001a27" }}
              >
                <p className="text-cyan-500/40 text-sm italic">
                  此項 POCUS 在本情境中不可用
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-cyan-900/30 px-5 py-3 flex items-center justify-between">
          <span className="text-cyan-400/40 text-xs">
            {scanned.size > 0
              ? `已掃 ${scanned.size} / ${POCUS_OPTIONS.length} 個視窗`
              : "點選上方選項開始 POCUS"}
          </span>
          {scanned.size > 0 && (
            <button
              onClick={closeModal}
              className="text-xs text-cyan-400 hover:text-cyan-200 transition-colors"
            >
              完成 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
