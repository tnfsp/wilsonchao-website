"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

/**
 * SeniorDialogModal — 學長到場的沉浸式對話視窗
 *
 * Multi-phase scenario 用：學長到場 → 評估 → 說明 → 離開。
 * 分 3 個 stage（到場、評估、離開），玩家逐步點「繼續」推進劇情。
 */

interface DialogStage {
  speaker: string;
  emoji: string;
  lines: string[];
  buttonText: string;
}

const STAGES: DialogStage[] = [
  {
    speaker: "學長",
    emoji: "🩺",
    lines: [
      "（推門進來，快步走到床邊）",
      "「怎麼了，跟我報告一下。」",
    ],
    buttonText: "報告現況",
  },
  {
    speaker: "學長",
    emoji: "🩺",
    lines: [
      "（聽完報告，看了 CT output 趨勢、vitals、labs）",
      "「嗯⋯⋯CT 持續出，鮮紅色有塊，量一直在增加。看起來是 surgical bleeding，不是 coagulopathy 的問題。」",
      "「這個量、這個趨勢，可能需要回 OR re-explore。」",
    ],
    buttonText: "繼續",
  },
  {
    speaker: "學長",
    emoji: "🚶",
    lines: [
      "「我去聯絡開刀房，看 OR 有沒有空位，順便通知麻醉科。」",
      "「你先繼續顧著——血品繼續跑，有什麼變化馬上叫我。」",
      "（學長走出 ICU，門關上了。你又是一個人了。）",
    ],
    buttonText: "知道了",
  },
];

export function SeniorDialogModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const updatePatientSeverity = useProGameStore((s) => s.updatePatientSeverity);
  const patient = useProGameStore((s) => s.patient);
  const clock = useProGameStore((s) => s.clock);
  const [stage, setStage] = useState(0);

  if (activeModal !== "senior_dialog") return null;

  const current = STAGES[stage];
  const isLast = stage === STAGES.length - 1;

  function handleNext() {
    if (isLast) {
      // 學長離開 → severity -5（安定效果）+ timeline entry + 關閉 modal
      if (patient) {
        updatePatientSeverity(Math.max(0, patient.severity - 5));
      }
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: "🚶 學長離開 ICU，去聯絡開刀房。",
        sender: "system",
        isImportant: true,
      });
      setStage(0);
      closeModal();
    } else {
      setStage((s) => s + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{current.emoji}</span>
            <div>
              <h3 className="text-white font-bold text-lg">{current.speaker}</h3>
              <p className="text-gray-400 text-xs">R4 / Fellow</p>
            </div>
          </div>
        </div>

        {/* Dialog content */}
        <div className="px-6 py-5 space-y-3 min-h-[160px]">
          {current.lines.map((line, i) => (
            <p
              key={i}
              className={`text-sm leading-relaxed ${
                line.startsWith("（")
                  ? "text-gray-500 italic"
                  : "text-gray-200"
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Progress dots + button */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STAGES.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === stage
                    ? "bg-teal-400"
                    : i < stage
                      ? "bg-teal-700"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 active:scale-[0.97] text-white text-sm font-medium transition-all"
          >
            {current.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
