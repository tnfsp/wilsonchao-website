"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

// ─── Accent colours per section ───────────────────────────────────────────────

const SECTION_CONFIG = [
  {
    key: "situation" as const,
    label: "S — Situation",
    sublabel: "你是誰、病人是誰、什麼事",
    accent: "border-red-500",
    labelColor: "text-red-400",
    focusBorder: "focus:ring-red-500",
    bgHover: "bg-red-900/10",
    placeholder:
      "我是住院醫師，bed 3 的 65 歲男性，CABG POD#0，目前 chest tube 持續大量引流，血壓持續下降，需要您評估是否需要緊急處置。",
  },
  {
    key: "background" as const,
    label: "B — Background",
    sublabel: "術式、病史、術後狀況",
    accent: "border-amber-500",
    labelColor: "text-amber-400",
    focusBorder: "focus:ring-amber-500",
    bgHover: "bg-amber-900/10",
    placeholder:
      "病人接受 CABG × 3（LIMA-LAD、SVG-RCA、SVG-OM），有 HTN、DM、CKD stage 3，baseline Cr 1.6。回 ICU 時 Hb 10.5，INR 1.1。目前在 Levophed 0.02 mcg/kg/min。",
  },
  {
    key: "assessment" as const,
    label: "A — Assessment",
    sublabel: "你覺得問題是什麼、目前處置、labs",
    accent: "border-teal-500",
    labelColor: "text-teal-400",
    focusBorder: "focus:ring-teal-500",
    bgHover: "bg-teal-900/10",
    placeholder:
      "我判斷是 surgical bleeding。CT output 280-320 cc/hr、鮮紅色有血塊，累計 1100cc。Hb 掉到 8.2，INR 1.3，Fib 195（borderline）。Lactate 3.1，BE -5.2，出現 lethal triad 早期表現。",
  },
  {
    key: "recommendation" as const,
    label: "R — Recommendation",
    sublabel: "你希望接下來怎麼做",
    accent: "border-violet-500",
    labelColor: "text-violet-400",
    focusBorder: "focus:ring-violet-500",
    bgHover: "bg-violet-900/10",
    placeholder:
      "建議 re-explore。我已輸了 2U pRBC、正在跑 2U FFP，備了 4U pRBC crossmatch。已通知學長準備回 OR 評估。建議同時準備 Cryo 6U（Fib 接近 150 閾值）並追 iCa。",
  },
] as const;

type SBARKey = "situation" | "background" | "assessment" | "recommendation";

// ─── Component ────────────────────────────────────────────────────────────────

export default function SBARModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { submitSBAR, endGame, scenario } = useProGameStore();

  const [form, setForm] = useState<Record<SBARKey, string>>({
    situation: "",
    background: "",
    assessment: "",
    recommendation: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [charCounts] = useState<Record<SBARKey, number>>({
    situation: 0,
    background: 0,
    assessment: 0,
    recommendation: 0,
  });

  const allFilled = SECTION_CONFIG.every(
    (s) => form[s.key].trim().length > 15
  );

  if (activeModal !== "sbar") return null;

  function handleChange(key: SBARKey, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!allFilled || submitted) return;
    setSubmitted(true);
    submitSBAR(form);
    // brief delay before debrief
    setTimeout(() => {
      endGame();
    }, 800);
  }

  return (
    /* Full-screen overlay */
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10"
        style={{ background: "#001219" }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="text-white font-bold text-xl tracking-tight">
                SBAR 交班報告
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                學長到了。用 SBAR 格式，清楚地告訴他病人狀況。
              </p>
            </div>
          </div>

          {/* Patient tag */}
          {scenario && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="bg-white/5 text-gray-300 px-2 py-1 rounded-md">
                {scenario.patient.bed}
              </span>
              <span className="bg-white/5 text-gray-300 px-2 py-1 rounded-md">
                {scenario.patient.age}M {scenario.patient.sex}
              </span>
              <span className="bg-white/5 text-gray-300 px-2 py-1 rounded-md">
                {scenario.patient.surgery}
              </span>
              <span className="bg-white/5 text-gray-300 px-2 py-1 rounded-md">
                {scenario.patient.postOpDay}
              </span>
            </div>
          )}
        </div>

        {/* ── SBAR Form ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {SECTION_CONFIG.map((section) => {
            const value = form[section.key];
            const isEmpty = value.trim().length === 0;
            const isTooShort = value.trim().length > 0 && value.trim().length <= 15;

            return (
              <div
                key={section.key}
                className={`rounded-xl border-l-4 ${section.accent} ${section.bgHover} p-4 transition-all`}
              >
                {/* Section header */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className={`font-bold text-sm ${section.labelColor}`}>
                      {section.label}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">
                      {section.sublabel}
                    </span>
                  </div>
                  <span className="text-gray-600 text-xs">
                    {value.length} 字
                  </span>
                </div>

                {/* Textarea */}
                <textarea
                  value={value}
                  onChange={(e) => handleChange(section.key, e.target.value)}
                  placeholder={section.placeholder}
                  rows={4}
                  disabled={submitted}
                  className={`
                    w-full rounded-lg bg-black/30 border border-white/10 
                    text-white text-sm placeholder:text-gray-600
                    px-3 py-2.5 resize-none outline-none
                    focus:ring-1 ${section.focusBorder} focus:border-transparent
                    transition-all disabled:opacity-60
                  `}
                />

                {/* Validation hint */}
                {isTooShort && (
                  <p className="text-yellow-500 text-xs mt-1">
                    ⚠️ 內容太短，請補充更多細節
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-6 py-4 border-t border-white/10">
          {/* Completion indicator */}
          <div className="flex gap-2 mb-3">
            {SECTION_CONFIG.map((s) => {
              const v = form[s.key];
              const done = v.trim().length > 15;
              return (
                <div
                  key={s.key}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    done ? s.accent.replace("border-", "bg-") : "bg-white/10"
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">
              {allFilled
                ? "✅ 四項都填了，可以送出"
                : `還差 ${SECTION_CONFIG.filter((s) => form[s.key].trim().length <= 15).length} 項`}
            </p>

            <button
              onClick={handleSubmit}
              disabled={!allFilled || submitted}
              className={`
                px-6 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${
                  allFilled && !submitted
                    ? "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/40"
                    : "bg-white/5 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {submitted ? "送出中..." : "📤 送出交班"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
