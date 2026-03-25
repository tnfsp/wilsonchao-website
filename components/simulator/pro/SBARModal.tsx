"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

export default function SBARModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { submitSBAR, scenario } = useProGameStore();

  const [report, setReport] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (activeModal !== "sbar") return null;

  const minLength = 30;
  const canSubmit = report.trim().length >= minLength && !submitted;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);
    // Store as single report — score engine will parse SBAR elements from free text
    submitSBAR({
      situation: report,
      background: "",
      assessment: "",
      recommendation: "",
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10"
        style={{ background: "#001219" }}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div className="flex-1">
              <h2 className="text-white font-bold text-xl tracking-tight">
                交班給學長
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                學長接起電話了：「怎麼了，跟我說。」
              </p>
            </div>
            <button
              onClick={() => useProGameStore.getState().closeModal()}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="關閉"
            >
              ✕
            </button>
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

        {/* Report area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="學長你好，我是值班 R1，我這邊有一個病人..."
            rows={12}
            disabled={submitted}
            autoFocus
            className="
              w-full rounded-xl bg-black/30 border border-white/10
              text-white text-sm leading-relaxed
              placeholder:text-gray-600 placeholder:italic
              px-4 py-3 resize-none outline-none
              focus:ring-1 focus:ring-teal-500 focus:border-transparent
              transition-all disabled:opacity-60
            "
          />
          <p className="text-gray-600 text-xs mt-2">
            {report.trim().length} 字
            {report.trim().length > 0 && report.trim().length < minLength && (
              <span className="text-yellow-600 ml-2">再多說一點</span>
            )}
          </p>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`
              px-6 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${canSubmit
                ? "bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-900/40"
                : "bg-white/5 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {submitted ? "送出中..." : "📤 講完了，交班"}
          </button>
        </div>
      </div>
    </div>
  );
}
