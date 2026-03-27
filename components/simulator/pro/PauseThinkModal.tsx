"use client";

import { useProGameStore } from "@/lib/simulator/store";

// ── Component ────────────────────────────────────────────────

export function PauseThinkModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const usePauseThink = useProGameStore((s) => s.usePauseThink);

  if (activeModal !== "pause_think") return null;

  function handleResume() {
    usePauseThink();
    closeModal();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.80)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-indigo-800/40 shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#001219" }}
      >
        <div className="flex flex-col items-center justify-center px-6 py-10 text-center gap-4">
          <div className="text-5xl">⏸</div>
          <h2 className="text-white font-semibold text-lg">遊戲暫停</h2>
          <p className="text-indigo-400/60 text-sm leading-relaxed">
            時間已停止。慢慢想，準備好再繼續。
          </p>
          <button
            onClick={handleResume}
            className="mt-2 px-8 py-3 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium transition-colors border border-indigo-600"
          >
            繼續 →
          </button>
        </div>
      </div>
    </div>
  );
}
