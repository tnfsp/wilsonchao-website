"use client";

import { useState, useEffect, useRef } from "react";
import { useProGameStore } from "@/lib/simulator/store";

/** Format elapsed game-minutes + startHour into "HH:MM AM" */
function formatGameTime(elapsedMinutes: number, startHour = 2): string {
  const totalMin = startHour * 60 + elapsedMinutes;
  const wrapped = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

const toastCSS = `
@keyframes ff-fade-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.96); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
}
@keyframes ff-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
.ff-toast-enter { animation: ff-fade-in 0.2s ease-out forwards; }
.ff-toast-exit  { animation: ff-fade-out 0.3s ease-in  forwards; }
@keyframes ff-progress {
  from { width: 100%; }
  to   { width: 0%; }
}
`;

const TOAST_DURATION_MS = 3500; // longer than original 2000ms

export default function FastForwardToast() {
  const [toast, setToast] = useState<{ text: string; delta: number } | null>(null);
  const [exiting, setExiting] = useState(false);
  const prevTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentTime = useProGameStore((s) => s.clock.currentTime);
  const startHour = useProGameStore((s) => s.clock.startHour);
  const phase = useProGameStore((s) => s.phase);

  useEffect(() => {
    if (phase !== "playing") {
      prevTimeRef.current = null;
      return;
    }

    if (prevTimeRef.current === null) {
      prevTimeRef.current = currentTime;
      return;
    }

    const delta = currentTime - prevTimeRef.current;
    prevTimeRef.current = currentTime;

    // Only show toast for jumps > 1 minute (i.e. fast-forward, not background tick)
    if (delta > 1) {
      const timeStr = formatGameTime(currentTime, startHour);
      // Reset exit animation
      setExiting(false);
      setToast({ text: `已快轉至 ${timeStr}`, delta });

      clearTimeout(timerRef.current);
      clearTimeout(exitTimerRef.current);

      // Start exit animation slightly before removal
      timerRef.current = setTimeout(() => {
        setExiting(true);
        exitTimerRef.current = setTimeout(() => setToast(null), 300);
      }, TOAST_DURATION_MS);
    }
  }, [currentTime, startHour, phase]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(exitTimerRef.current);
    };
  }, []);

  if (!toast) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: toastCSS }} />
      <div
        className={`fixed top-4 left-1/2 z-[90] ${exiting ? "ff-toast-exit" : "ff-toast-enter"}`}
        style={{ transform: "translateX(-50%)" }}
      >
        <div
          className="px-5 py-3 rounded-2xl text-sm font-medium text-white border border-cyan-500/20 shadow-xl overflow-hidden"
          style={{
            background: "rgba(0, 22, 32, 0.92)",
            backdropFilter: "blur(12px)",
            minWidth: "220px",
          }}
        >
          {/* Icon + text row */}
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⏩</span>
            <div>
              <p className="text-white/95 font-semibold">{toast.text}</p>
              <p className="text-cyan-400/70 text-xs mt-0.5">+{toast.delta} 分鐘</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-cyan-500/60 rounded-full"
              style={{
                animation: `ff-progress ${TOAST_DURATION_MS}ms linear forwards`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
