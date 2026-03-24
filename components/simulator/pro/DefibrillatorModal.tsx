"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { RhythmType } from "@/lib/simulator/types";

// ─── Rhythm descriptions ────────────────────────────────────────────────────

const RHYTHM_INFO: Record<RhythmType, { label: string; desc: string; shockable: boolean }> = {
  nsr:           { label: "Normal Sinus Rhythm",   desc: "正常竇性節律",             shockable: false },
  sinus_tach:    { label: "Sinus Tachycardia",     desc: "竇性心搏過速",             shockable: false },
  sinus_brady:   { label: "Sinus Bradycardia",     desc: "竇性心搏過緩",             shockable: false },
  afib:          { label: "Atrial Fibrillation",    desc: "心房顫動",                 shockable: false },
  aflutter:      { label: "Atrial Flutter",         desc: "心房撲動",                 shockable: false },
  vf:            { label: "Ventricular Fibrillation", desc: "心室顫動 — 可電擊節律",  shockable: true  },
  vt_pulse:      { label: "VT with Pulse",          desc: "有脈搏心室頻脈",           shockable: true  },
  vt_pulseless:  { label: "Pulseless VT",           desc: "無脈搏心室頻脈 — 可電擊節律", shockable: true },
  svt:           { label: "SVT",                    desc: "上心室頻脈",               shockable: false },
  pea:           { label: "PEA",                    desc: "無脈搏電活動 — 不可電擊",    shockable: false },
  asystole:      { label: "Asystole",               desc: "心搏停止 — 不可電擊",       shockable: false },
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
  const rhythmInfo = RHYTHM_INFO[rhythm];
  const { energy, mode } = defibrillator;

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
          {/* Current Rhythm */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">目前節律</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-lg">{rhythmInfo.label}</p>
                <p className="text-zinc-400 text-sm">{rhythmInfo.desc}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                rhythmInfo.shockable
                  ? "bg-red-900/40 text-red-400 border-red-500/30"
                  : "bg-zinc-800 text-zinc-500 border-zinc-600"
              }`}>
                {rhythmInfo.shockable ? "可電擊" : "不可電擊"}
              </span>
            </div>
            {patient && (
              <p className="text-zinc-600 text-xs mt-2">
                HR {Math.round(patient.vitals.hr)} bpm · MAP {Math.round(patient.vitals.map)} mmHg
              </p>
            )}
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
