"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { RhythmType } from "@/lib/simulator/types";
import { EcgCanvas } from "./EcgCanvas";
import { generateECGMorphology } from "@/lib/simulator/engine/ecg-generator";
import { getLastBioGearsState } from "@/lib/simulator/engine/biogears-engine";

// ─── Rhythm descriptions ────────────────────────────────────────────────────

const RHYTHM_INFO: Record<RhythmType, { label: string }> = {
  nsr:           { label: "Normal Sinus Rhythm" },
  sinus_tach:    { label: "Sinus Tachycardia" },
  sinus_brady:   { label: "Sinus Bradycardia" },
  afib:          { label: "Atrial Fibrillation" },
  aflutter:      { label: "Atrial Flutter" },
  vf:            { label: "Ventricular Fibrillation" },
  vt_pulse:      { label: "VT with Pulse" },
  vt_pulseless:  { label: "Pulseless VT" },
  svt:           { label: "SVT" },
  pea:           { label: "PEA" },
  asystole:      { label: "Asystole" },
};

const ENERGY_OPTIONS = [120, 150, 200, 360] as const;

// ─── Modal ──────────────────────────────────────────────────────────────────

export default function DefibrillatorModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const patient = useProGameStore((s) => s.patient);
  const defibrillator = useProGameStore((s) => s.defibrillator);
  const setDefibrillatorEnergy = useProGameStore((s) => s.setDefibrillatorEnergy);
  const setDefibrillatorMode = useProGameStore((s) => s.setDefibrillatorMode);
  const deliverShock = useProGameStore((s) => s.deliverShock);

  const [confirmShock, setConfirmShock] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  if (activeModal !== "defibrillator") return null;

  const rhythm = patient?.vitals.rhythmStrip ?? "nsr";
  const { energy, mode } = defibrillator;

  // Generate ECG morphology for live waveform display
  const bgState = getLastBioGearsState();
  const scenario = useProGameStore.getState().scenario;
  const ecgMorphology = generateECGMorphology(bgState, {
    pathology: scenario?.pathology,
    tamponade: scenario?.pathology === "cardiac_tamponade",
  });

  const handleShock = () => {
    if (!confirmShock) {
      setConfirmShock(true);
      return;
    }
    const result = deliverShock();
    setLastResult(result);
    setConfirmShock(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-md mx-auto my-6 rounded-2xl shadow-2xl border border-red-900/40"
        style={{ background: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-red-900/30">
          <div>
            <h2 className="text-white font-bold text-xl">⚡ 電擊器 Defibrillator</h2>
            <p className="text-zinc-500 text-sm mt-0.5">Biphasic defibrillator</p>
          </div>
          <button
            onClick={() => { closeModal(); setConfirmShock(false); setLastResult(null); }}
            className="text-zinc-500 hover:text-white text-2xl leading-none transition"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Live ECG — player must interpret rhythm themselves */}
          <div className="rounded-xl border border-zinc-700 bg-black overflow-hidden">
            <EcgCanvas
              morphology={ecgMorphology}
              width={380}
              height={120}
              showGrid
              showLabels={false}
            />
          </div>

          {/* Energy Selector */}
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">能量 Energy（Biphasic）</p>
            <div className="grid grid-cols-4 gap-2">
              {ENERGY_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setDefibrillatorEnergy(e)}
                  className={`rounded-lg py-2.5 text-center transition border font-mono font-bold text-sm ${
                    energy === e
                      ? "bg-red-900/40 border-red-500 text-red-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {e}J
                </button>
              ))}
            </div>
          </div>

          {/* Mode Toggle */}
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">模式 Mode</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDefibrillatorMode("sync")}
                className={`rounded-lg py-3 px-3 text-left transition border ${
                  mode === "sync"
                    ? "bg-amber-900/30 border-amber-500/60 text-amber-300"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <p className="font-bold text-sm">Synchronized</p>
                <p className="text-xs mt-0.5 opacity-70">VT with pulse / AF</p>
              </button>
              <button
                onClick={() => setDefibrillatorMode("async")}
                className={`rounded-lg py-3 px-3 text-left transition border ${
                  mode === "async"
                    ? "bg-red-900/30 border-red-500/60 text-red-300"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <p className="font-bold text-sm">Unsynchronized</p>
                <p className="text-xs mt-0.5 opacity-70">VF / Pulseless VT</p>
              </button>
            </div>
          </div>

          {/* Last result feedback */}
          {lastResult && (
            <div className={`rounded-lg px-4 py-3 text-sm border ${
              lastResult.success
                ? "bg-green-900/30 border-green-600 text-green-300"
                : "bg-yellow-900/30 border-yellow-600 text-yellow-300"
            }`}>
              {lastResult.message}
            </div>
          )}

          {/* Shock Button */}
          {confirmShock ? (
            <div className="space-y-2">
              <p className="text-yellow-400 text-sm font-semibold text-center">
                確認電擊 {energy}J（{mode === "sync" ? "同步" : "非同步"}）？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmShock(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleShock}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors animate-pulse"
                >
                  ⚡ SHOCK
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleShock}
              className="w-full py-4 rounded-xl bg-red-700 hover:bg-red-600 active:scale-[0.98] text-white font-bold text-lg transition-all shadow-xl shadow-red-900/50"
            >
              ⚡ SHOCK — {energy}J
            </button>
          )}

          {/* Info */}
          {defibrillator.lastShockAt !== null && (
            <p className="text-zinc-600 text-xs text-center">
              上次電擊：遊戲時間 {defibrillator.lastShockAt} 分鐘
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
