"use client";

import { useEffect, useState, useRef } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { ChestTubeColor } from "@/lib/simulator/types";

// ── Color label config (same mapping as ChestTubePanel) ────────

const CT_COLOR_LABELS: Record<ChestTubeColor, { label: string; textClass: string }> = {
  bright_red:      { label: "鮮紅",   textClass: "text-red-400" },
  dark_red:        { label: "暗紅",   textClass: "text-red-500" },
  serosanguineous: { label: "淡血性", textClass: "text-rose-400" },
  serous:          { label: "漿液性", textClass: "text-amber-300" },
};

// ── Auto-close duration ────────────────────────────────────────

const AUTO_CLOSE_MS = 3000;

/**
 * MilkCTResultModal — shows chest tube milk/strip result in a modal
 * instead of dumping it into the chat timeline.
 *
 * Features:
 *   - Visual feedback animation (icon pulse on mount)
 *   - CT status overview (rate, total, color, patency)
 *   - Actionable hint when obstructed (POCUS suggestion)
 *   - Auto-close after ~3 seconds with countdown bar, or manual close
 */
export function MilkCTResultModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const patient = useProGameStore((s) => s.patient);

  const [countdown, setCountdown] = useState(AUTO_CLOSE_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPaused = useRef(false);

  const isOpen = activeModal === "milk_ct_result" && !!patient;

  // ── Auto-close countdown ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setCountdown(AUTO_CLOSE_MS);
      return;
    }

    // Reset countdown when modal opens
    setCountdown(AUTO_CLOSE_MS);
    isPaused.current = false;

    const TICK = 50; // update every 50ms for smooth progress bar
    timerRef.current = setInterval(() => {
      if (isPaused.current) return;
      setCountdown((prev) => {
        const next = prev - TICK;
        if (next <= 0) {
          closeModal();
          return 0;
        }
        return next;
      });
    }, TICK);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, closeModal]);

  // Pause countdown on hover (user is reading)
  const handleMouseEnter = () => { isPaused.current = true; };
  const handleMouseLeave = () => { isPaused.current = false; };

  if (!isOpen) return null;

  const ct = patient.chestTube;
  const isTamponade =
    patient.pathology === "cardiac_tamponade" || patient.pathology === "tamponade";

  // ── Determine result scenario ─────────────────────────────────

  let resultIcon: string;
  let resultTitle: string;
  let resultDescription: string;
  let warningText: string | null = null;
  let resultColor: "teal" | "green" | "amber";

  if (ct.isPatent && !ct.hasClots) {
    // Already patent, no clots
    resultIcon = "✅";
    resultTitle = "管路通暢";
    resultDescription =
      "胸管 milk 完了，管路通暢，沒有明顯血塊排出。引流量沒太大變化。";
    resultColor = "teal";
  } else if (ct.isPatent && !isTamponade) {
    // Clots cleared, not tamponade
    resultIcon = "✅";
    resultTitle = "擠出血塊，引流恢復";
    resultDescription =
      "Milk 後擠出血塊，胸管引流恢復通暢。Output burst +50cc。";
    resultColor = "green";
  } else if (isTamponade) {
    // Tamponade — milk helps briefly but output doesn't recover
    resultIcon = "⚠️";
    resultTitle = "管路通了但引流量未恢復";
    resultDescription =
      "Milk 後管路有通，但引流量幾乎沒增加。心包壓力暫時有稍微下降。管路不是主要問題？";
    warningText =
      "考慮 Cardiac POCUS 排除 pericardial effusion / tamponade";
    resultColor = "amber";
  } else {
    // Generic — patent restored
    resultIcon = "✅";
    resultTitle = "管路恢復通暢";
    resultDescription = "Milk 後管路通了，引流恢復。";
    resultColor = "teal";
  }

  // ── Color style maps ──────────────────────────────────────────

  const borderColorMap: Record<string, string> = {
    teal: "border-teal-700/40",
    green: "border-green-700/40",
    amber: "border-amber-700/40",
  };
  const titleColorMap: Record<string, string> = {
    teal: "text-teal-300",
    green: "text-green-300",
    amber: "text-amber-300",
  };
  const labelColorMap: Record<string, string> = {
    teal: "text-teal-500/60",
    green: "text-green-500/60",
    amber: "text-amber-500/60",
  };
  const progressColorMap: Record<string, string> = {
    teal: "bg-teal-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
  };

  const colorCfg = CT_COLOR_LABELS[ct.color];
  const progressPct = (countdown / AUTO_CLOSE_MS) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
      onClick={closeModal}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={`w-full max-w-sm rounded-xl border ${borderColorMap[resultColor]} shadow-2xl overflow-hidden`}
        style={{ backgroundColor: "#001219" }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Auto-close countdown bar */}
        <div className="h-0.5 w-full bg-white/5">
          <div
            className={`h-full ${progressColorMap[resultColor]} transition-none`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${borderColorMap[resultColor]}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <h2 className="text-white font-semibold text-lg">
              Milk/Strip Chest Tube
            </h2>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-500 hover:text-white transition-colors text-xl font-light"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Result with animated icon */}
          <div className="flex items-start gap-3">
            <span className="text-3xl animate-bounce" style={{ animationDuration: "0.6s", animationIterationCount: "2" }}>
              {resultIcon}
            </span>
            <div>
              <h3
                className={`font-semibold text-base ${titleColorMap[resultColor]}`}
              >
                {resultTitle}
              </h3>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                {resultDescription}
              </p>
            </div>
          </div>

          {/* CT Status */}
          <div
            className={`rounded-lg border ${borderColorMap[resultColor]} p-3`}
            style={{ backgroundColor: "#001a25" }}
          >
            <p
              className={`text-xs uppercase tracking-widest mb-2 ${labelColorMap[resultColor]}`}
            >
              CT 狀態
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">Output:</span>{" "}
                <span className="text-white font-mono">
                  {ct.currentRate} cc/hr
                </span>
              </div>
              <div>
                <span className="text-slate-500">累計:</span>{" "}
                <span className="text-white font-mono">
                  {Math.round(ct.totalOutput)} cc
                </span>
              </div>
              <div>
                <span className="text-slate-500">顏色:</span>{" "}
                <span className={colorCfg.textClass}>{colorCfg.label}</span>
              </div>
              <div>
                <span className="text-slate-500">Patent:</span>{" "}
                <span
                  className={ct.isPatent ? "text-green-400" : "text-red-400"}
                >
                  {ct.isPatent ? "Yes" : "No（堵塞）"}
                </span>
              </div>
            </div>
          </div>

          {/* Warning / actionable hint */}
          {warningText && (
            <div
              className="rounded-lg border border-amber-700/40 px-3 py-2.5"
              style={{ backgroundColor: "#1a1000" }}
            >
              <p className="text-amber-300 text-xs font-medium">
                ⚠️ {warningText}
              </p>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={closeModal}
            className={`w-full py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
              resultColor === "amber"
                ? "bg-amber-700 hover:bg-amber-600 border border-amber-600"
                : "bg-teal-700 hover:bg-teal-600 border border-teal-600"
            }`}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
