"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "icu-sim-tutorial-done";

interface TutorialStep {
  /** CSS selector-like target region id */
  target: "left-panel" | "right-panel" | "action-bar" | "io-bar";
  message: string;
}

const STEPS: TutorialStep[] = [
  {
    target: "left-panel",
    message: "Vitals Monitor 顯示即時生命徵象，紅色 = 異常",
  },
  {
    target: "right-panel",
    message: "護理師會在這裡報告情況",
  },
  {
    target: "action-bar",
    message: "用這些按鈕執行動作：PE、抽血、處置、叫人、SBAR",
  },
  {
    target: "io-bar",
    message: "時間自動推進，適當時機叫學長並用 SBAR 交班",
  },
];

/**
 * Spotlight region positions for each step.
 * Returns inset CSS values for the spotlight "window" based on target.
 */
function getSpotlightStyle(target: TutorialStep["target"]): React.CSSProperties {
  switch (target) {
    case "left-panel":
      // Left vitals panel — desktop: left 380px column; mobile: top section
      return { top: "48px", left: "0", width: "380px", bottom: "0" };
    case "right-panel":
      // Right chat area — desktop: right of 380px
      return { top: "48px", left: "380px", right: "0", bottom: "120px" };
    case "action-bar":
      // Bottom action bar
      return { left: "0", right: "0", bottom: "0", height: "120px" };
    case "io-bar":
      // Top header/clock bar
      return { top: "0", left: "0", right: "0", height: "48px" };
  }
}

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setFading(true);
    localStorage.setItem(STORAGE_KEY, "1");
    setTimeout(() => setVisible(false), 300);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!visible) return null;

  const current = STEPS[step];
  const spotlight = getSpotlightStyle(current.target);

  return (
    <div
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      {/* Dark overlay with spotlight cutout using CSS mask */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Full dark overlay */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Spotlight cutout — transparent window */}
        <div
          className="absolute border-2 border-white/40 shadow-[0_0_30px_8px_rgba(255,255,255,0.15)]"
          style={{
            ...spotlight,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.7), 0 0 30px 8px rgba(255,255,255,0.15)",
            background: "transparent",
          }}
        />
      </div>

      {/* Message card — positioned near center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto max-w-sm w-full mx-4 rounded-2xl p-5 border border-white/20"
          style={{ background: "rgba(0, 18, 25, 0.95)" }}
        >
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-teal-400" : i < step ? "w-3 bg-teal-600" : "w-3 bg-white/20"
                }`}
              />
            ))}
            <span className="ml-auto text-gray-500 text-xs">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Message */}
          <p className="text-white text-sm leading-relaxed mb-4">
            {current.message}
          </p>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={dismiss}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              跳過
            </button>
            <button
              onClick={next}
              className="ml-auto px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
            >
              {step < STEPS.length - 1 ? "下一步" : "開始"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
