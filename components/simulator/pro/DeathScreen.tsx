"use client";

import { useEffect } from "react";
import { useProGameStore } from "@/lib/simulator/store";

export default function DeathScreen() {
  const deathCause = useProGameStore((s) => s.deathCause);
  const endGame = useProGameStore((s) => s.endGame);

  // Auto-transition to debrief after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => endGame(), 5000);
    return () => clearTimeout(timer);
  }, [endGame]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "#0a0a0a" }}
    >
      <div className="text-center max-w-md px-6">
        <div className="text-6xl mb-6 animate-pulse">💀</div>
        <h1 className="text-red-500 text-3xl font-bold mb-4">病人死亡</h1>
        <p className="text-slate-300 text-lg leading-relaxed mb-6">{deathCause}</p>
        <p className="text-slate-500 text-sm">即將進入 Debrief...</p>
        <button
          onClick={endGame}
          className="mt-6 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          直接進入 Debrief →
        </button>
      </div>
    </div>
  );
}
