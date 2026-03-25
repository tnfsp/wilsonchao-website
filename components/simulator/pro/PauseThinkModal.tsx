"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

// ── Prompt definitions ───────────────────────────────────────

interface ThinkPrompt {
  id: string;
  question: string;
  placeholder: string;
  hint?: string;
}

const THINK_PROMPTS: ThinkPrompt[] = [
  {
    id: "diagnosis",
    question: "你覺得最可能的問題是什麼？",
    placeholder:
      "e.g. Surgical bleeding — CT output 趨勢持續上升，鮮紅色有血塊，血壓在掉...",
    hint: "不需要完美，寫出你目前最有把握的假設就好",
  },
  {
    id: "plan",
    question: "接下來你打算做什麼？",
    placeholder:
      "e.g. 先開 CBC stat + Coag panel，同時給 500cc NS bolus，然後叫學長...",
    hint: "列出優先順序，急的事情先說",
  },
  {
    id: "rationale",
    question: "為什麼？",
    placeholder:
      "e.g. Hb 下降 + CT 持續出血 + 血壓不穩 → 需要量化失血、補充 volume、同時備血...",
    hint: "說明你的臨床推理，哪些 findings 支持你的計畫",
  },
];

// ── Component ────────────────────────────────────────────────

export function PauseThinkModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { clock, closeModal, usePauseThink, addTimelineEntry } = useProGameStore();

  const [answers, setAnswers] = useState<Record<string, string>>({
    diagnosis: "",
    plan: "",
    rationale: "",
  });
  const [submitted, setSubmitted] = useState(false);

  if (activeModal !== "pause_think") return null;

  function handleChange(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  const hasAnyContent = Object.values(answers).some((v) => v.trim().length > 0);

  function handleSubmit() {
    // Call store action (sets pauseThinkUsed = true, adds basic timeline entry)
    usePauseThink();

    // Add richer timeline entry with the answers
    const parts: string[] = [];
    if (answers.diagnosis.trim()) {
      parts.push(`🧠 診斷假設：${answers.diagnosis.trim()}`);
    }
    if (answers.plan.trim()) {
      parts.push(`📋 計畫：${answers.plan.trim()}`);
    }
    if (answers.rationale.trim()) {
      parts.push(`💡 理由：${answers.rationale.trim()}`);
    }

    if (parts.length > 0) {
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: `⏸ 暫停思考\n${parts.join("\n")}`,
        sender: "player",
      });
    }

    setSubmitted(true);
  }

  function handleSkip() {
    // Still marks as used (no penalty) but nothing recorded
    usePauseThink();
    closeModal();
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.80)" }}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-indigo-800/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{ backgroundColor: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏸</span>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                暫停思考
              </h2>
              <p className="text-indigo-400/60 text-xs">
                整理你的臨床思路
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-indigo-500/50 hover:text-white transition-colors text-xl font-light"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Submitted state */}
        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-4">
            <div className="text-4xl">⏸</div>
            <p className="text-white font-medium text-base">思路整理完成</p>
            <p className="text-indigo-400/60 text-sm">
              臨床推理已記錄。繼續處理病人。
            </p>
            <button
              onClick={closeModal}
              className="mt-2 px-6 py-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium transition-colors border border-indigo-600"
            >
              繼續 →
            </button>
          </div>
        ) : (
          <>
            {/* Prompts */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
              {THINK_PROMPTS.map((prompt, index) => (
                <div key={prompt.id}>
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-800/50 border border-indigo-700/40 text-xs text-indigo-300 flex items-center justify-center font-medium mt-0.5"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <label className="text-indigo-200 text-sm font-medium block">
                        {prompt.question}
                      </label>
                      {prompt.hint && (
                        <p className="text-indigo-500/50 text-xs mt-0.5">
                          {prompt.hint}
                        </p>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={answers[prompt.id]}
                    onChange={(e) => handleChange(prompt.id, e.target.value)}
                    placeholder={prompt.placeholder}
                    rows={3}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white border border-indigo-800/40 focus:border-indigo-600 focus:outline-none transition-colors resize-none leading-relaxed placeholder-indigo-700/40"
                    style={{ backgroundColor: "#001a30" }}
                  />
                </div>
              ))}

            </div>

            {/* Footer actions */}
            <div className="border-t border-indigo-900/30 px-5 py-4 flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-none px-4 py-2.5 rounded-lg text-indigo-400/60 text-sm border border-indigo-900/30 hover:border-indigo-800/50 hover:text-indigo-300 transition-colors"
              >
                跳過
              </button>
              <button
                onClick={handleSubmit}
                disabled={!hasAnyContent}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors border
                  ${hasAnyContent
                    ? "bg-indigo-700 hover:bg-indigo-600 border-indigo-600"
                    : "bg-indigo-900/30 border-indigo-900/30 text-indigo-600 cursor-not-allowed"
                  }
                `}
              >
                ⏸ 送出思路
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
