"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "icu-sim-tutorial-done";

type TargetId = "pro-vitals-panel" | "action-bar" | "time-controls" | "sbar-btn" | "none";

interface TutorialStep {
  target: TargetId;
  title: string;
  message: string;
  /** Where to place the card relative to the target */
  placement: "above" | "below" | "center";
}

const STEPS: TutorialStep[] = [
  {
    target: "pro-vitals-panel",
    title: "生命徵象監視器",
    message: "病人的即時生命徵象。紅色 = 危急，黃色 = 警戒。注意趨勢變化。",
    placement: "below",
  },
  {
    target: "action-bar",
    title: "操作按鈕",
    message: "PE、抽血、處置、通報交班、電擊。點「處置」展開更多：開藥、輸血、影像、呼吸器等。",
    placement: "above",
  },
  {
    target: "time-controls",
    title: "時間控制",
    message: "「快轉 5 分」跳過等待時間，或按鍵盤 F。「暫停思考」整理你的臨床思路。",
    placement: "above",
  },
  {
    target: "sbar-btn",
    title: "通報交班",
    message: "覺得需要幫忙時，點這裡叫學長並用 SBAR 交班。知道什麼時候該叫人很重要。",
    placement: "above",
  },
  {
    target: "none",
    title: "祝你好運，醫師！",
    message: "現在開始，你一個人值班。相信你的判斷，果斷行動。",
    placement: "center",
  },
];

function useTargetRect(targetId: TargetId): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (targetId === "none") { setRect(null); return; }
    const el = document.getElementById(targetId);
    if (!el) { setRect(null); return; }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const update = () => setRect(el.getBoundingClientRect());
    const t = setTimeout(update, 400);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return rect;
}

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
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

  const current = STEPS[step];
  const rect = useTargetRect(current.target);

  if (!visible) return null;

  // Spotlight inset with padding
  const pad = 8;
  const spotStyle: React.CSSProperties | null = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Position the card near the target element
  const cardStyle: React.CSSProperties = {};

  if (rect && current.placement !== "center") {
    const cardWidth = 340;
    // Center horizontally relative to target, clamped to viewport
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
    cardStyle.left = left;
    cardStyle.width = cardWidth;
    cardStyle.position = "absolute";

    const cardHeight = 220; // approximate max card height
    const margin = 16;

    if (current.placement === "below") {
      const proposedTop = rect.bottom + pad + margin;
      if (proposedTop + cardHeight > window.innerHeight - margin) {
        // Won't fit below — try above
        const proposedAboveTop = rect.top - pad - margin - cardHeight;
        if (proposedAboveTop < margin) {
          // Won't fit above either — just place at top of viewport
          cardStyle.top = margin;
        } else {
          cardStyle.top = proposedAboveTop;
        }
      } else {
        cardStyle.top = proposedTop;
      }
    } else {
      // "above" placement
      const proposedAboveTop = rect.top - pad - margin - cardHeight;
      if (proposedAboveTop < margin) {
        // Won't fit above — place below or clamp to top
        const proposedBelowTop = rect.bottom + pad + margin;
        if (proposedBelowTop + cardHeight > window.innerHeight - margin) {
          cardStyle.top = margin;
        } else {
          cardStyle.top = proposedBelowTop;
        }
      } else {
        cardStyle.top = proposedAboveTop;
      }
    }
  }

  const isPositioned = rect && current.placement !== "center";

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[100] transition-opacity duration-300 ${fading ? "opacity-0" : "opacity-100"}`}
    >
      {/* Dark overlay with spotlight cutout */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/70" />
        {spotStyle && (
          <div
            className="absolute rounded-xl border-2 border-teal-400/60"
            style={{
              ...spotStyle,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.7), 0 0 30px 8px rgba(94,234,212,0.15)",
              background: "transparent",
            }}
          />
        )}
      </div>

      {/* Message card — positioned near target or centered */}
      <div
        className={`${isPositioned ? "" : "absolute inset-0 flex items-center justify-center"} pointer-events-none`}
      >
        <div
          className="pointer-events-auto max-w-sm w-full mx-4 rounded-2xl p-5 border border-white/20"
          style={{
            background: "rgba(0, 18, 25, 0.95)",
            ...cardStyle,
          }}
        >
          {/* Arrow pointing to target */}
          {isPositioned && current.placement === "below" && (
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "8px solid rgba(94,234,212,0.6)",
              }}
            />
          )}
          {isPositioned && current.placement === "above" && (
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid rgba(94,234,212,0.6)",
              }}
            />
          )}

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

          {/* Title */}
          <h3 className="text-teal-300 text-base font-semibold mb-1">{current.title}</h3>

          {/* Message */}
          <p className="text-white/90 text-sm leading-relaxed mb-4">
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
              {step < STEPS.length - 1 ? "下一步" : "開始！"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
