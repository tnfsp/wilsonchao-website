"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "icu-sim-tutorial-done";

type TargetId = "pro-vitals-panel" | "action-bar" | "time-controls" | "sbar-btn" | "none";

interface TutorialStep {
  target: TargetId;
  title: string;
  message: string;
}

const STEPS: TutorialStep[] = [
  {
    target: "pro-vitals-panel",
    title: "Vitals Monitor",
    message: "Vitals Monitor shows patient status. Red = danger, yellow = warning.",
  },
  {
    target: "action-bar",
    title: "Action Buttons",
    message: "Use these buttons to take actions: PE, labs, imaging, orders, and consults.",
  },
  {
    target: "time-controls",
    title: "Fast Forward",
    message: "Fast forward time with the \u23E9 button or press F on your keyboard.",
  },
  {
    target: "sbar-btn",
    title: "Call for Help",
    message: "Call for help with SBAR when you\u2019re ready to escalate to the senior.",
  },
  {
    target: "none",
    title: "Good luck, Dr!",
    message: "You\u2019re on your own now. Trust your instincts and act fast.",
  },
];

function useTargetRect(targetId: TargetId): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (targetId === "none") { setRect(null); return; }
    const el = document.getElementById(targetId);
    if (!el) { setRect(null); return; }

    // Scroll the element into view so the spotlight lands on it even on mobile
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const update = () => setRect(el.getBoundingClientRect());
    // Small delay to let scroll settle before measuring
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
      // Small delay so game elements mount first
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

      {/* Message card */}
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
              Skip
            </button>
            <button
              onClick={next}
              className="ml-auto px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
            >
              {step < STEPS.length - 1 ? "Next" : "Start!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
