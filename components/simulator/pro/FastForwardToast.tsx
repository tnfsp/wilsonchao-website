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

export default function FastForwardToast() {
  const [toast, setToast] = useState<string | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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
      setToast(`已快轉至 ${timeStr}（+${delta} min）`);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setToast(null), 2000);
    }
  }, [currentTime, startHour, phase]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] animate-[fadeInDown_0.2s_ease-out]">
      <div
        className="px-4 py-2 rounded-xl text-sm font-medium text-white/90 border border-white/10 shadow-lg"
        style={{ background: "rgba(0, 18, 25, 0.85)", backdropFilter: "blur(8px)" }}
      >
        ⏩ {toast}
      </div>
    </div>
  );
}
