"use client";

import { useEffect, useRef, useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

/**
 * Rescue Window overlay for Standard mode.
 * Shows a dramatic countdown with red vignette + nurse warning.
 * Does NOT block action buttons (pointer-events: none on background).
 *
 * States:
 * - Active countdown: red vignette + countdown number + nurse warning
 * - Rescued: green flash + success message (auto-dismisses)
 * - Expired: transitions to death (handled by store)
 */
export default function RescueCountdown() {
  const rescueState = useProGameStore((s) => s.rescueState);
  const tickRescueCountdown = useProGameStore((s) => s.tickRescueCountdown);
  const nurseName = useProGameStore((s) => s.scenario?.nurseProfile?.name ?? "護理師");

  const [rescued, setRescued] = useState(false);
  const prevRescueRef = useRef(rescueState);

  // Detect rescue success: rescueState went from active to null (not via death)
  useEffect(() => {
    const prev = prevRescueRef.current;
    if (prev?.active && !rescueState) {
      const phase = useProGameStore.getState().phase;
      if (phase === "playing") {
        setRescued(true);
        const timer = setTimeout(() => setRescued(false), 2500);
        return () => clearTimeout(timer);
      }
    }
    prevRescueRef.current = rescueState;
  }, [rescueState]);

  // Real-time countdown ticker (1 second interval)
  useEffect(() => {
    if (!rescueState?.active) return;
    const interval = setInterval(() => {
      tickRescueCountdown();
    }, 1000);
    return () => clearInterval(interval);
  }, [rescueState?.active, tickRescueCountdown]);

  // Success flash
  if (rescued) {
    return (
      <div
        className="fixed inset-0 z-[75] pointer-events-none flex items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at center, rgba(34, 197, 94, 0.3) 0%, transparent 70%)",
          animation: "rescueFadeOut 2.5s ease-out forwards",
        }}
      >
        <div className="text-center animate-bounce">
          <div className="text-6xl mb-4">&#x2764;&#xFE0F;</div>
          <p className="text-green-400 text-3xl font-bold drop-shadow-lg">
            {nurseName}：好險！穩住了！
          </p>
        </div>

        <style jsx>{`
          @keyframes rescueFadeOut {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // Not in rescue window
  if (!rescueState?.active) return null;

  const remaining = rescueState.remainingSeconds;
  const urgency = remaining <= 10 ? "extreme" : remaining <= 30 ? "high" : "normal";

  return (
    <div
      className="fixed inset-0 z-[75] pointer-events-none"
      style={{
        background:
          urgency === "extreme"
            ? "radial-gradient(ellipse at center, transparent 30%, rgba(220, 38, 38, 0.5) 100%)"
            : "radial-gradient(ellipse at center, transparent 40%, rgba(220, 38, 38, 0.35) 100%)",
      }}
    >
      {/* Pulsing border */}
      <div
        className="absolute inset-0 border-4 rounded-none"
        style={{
          borderColor: urgency === "extreme" ? "#dc2626" : "#ef4444",
          animation: `rescuePulse ${urgency === "extreme" ? "0.5s" : "1s"} ease-in-out infinite`,
        }}
      />

      {/* Top center: countdown + nurse warning */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {/* Countdown number */}
        <div
          className="flex items-center justify-center rounded-full bg-red-900/80 border-2 border-red-500"
          style={{
            width: urgency === "extreme" ? 96 : 80,
            height: urgency === "extreme" ? 96 : 80,
            animation: urgency === "extreme" ? "rescueShake 0.3s ease-in-out infinite" : undefined,
          }}
        >
          <span
            className="font-mono font-black text-red-200 tabular-nums"
            style={{ fontSize: urgency === "extreme" ? 48 : 40 }}
          >
            {remaining}
          </span>
        </div>

        {/* Nurse warning */}
        <div className="bg-red-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/50 max-w-xs text-center">
          <p className="text-red-200 text-sm font-bold">
            {nurseName}：醫師！病人快不行了！
          </p>
          <p className="text-red-300/80 text-xs mt-1">
            趕快做正確處置！
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes rescuePulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes rescueShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
