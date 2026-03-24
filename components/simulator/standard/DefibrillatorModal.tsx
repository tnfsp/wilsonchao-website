"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { RhythmType } from "@/lib/simulator/types";

// ─── Rhythm info ─────────────────────────────────────────────────────────────

interface RhythmInfo {
  label: string;
  desc: string;
  shockable: boolean;
  teachingNote: string;
}

const RHYTHM_INFO: Record<RhythmType, RhythmInfo> = {
  nsr:          { label: "Normal Sinus Rhythm",        desc: "正常竇性節律",      shockable: false, teachingNote: "正常節律，不需電擊。" },
  sinus_tach:   { label: "Sinus Tachycardia",          desc: "竇性心搏過速",      shockable: false, teachingNote: "尋找潛在病因（低血量、疼痛、感染）。" },
  sinus_brady:  { label: "Sinus Bradycardia",          desc: "竇性心搏過緩",      shockable: false, teachingNote: "考慮 Atropine 或經皮起搏，非電擊適應症。" },
  afib:         { label: "Atrial Fibrillation",         desc: "心房顫動",          shockable: false, teachingNote: "血動力學穩定時非電擊；不穩定可考慮同步電覆律。" },
  aflutter:     { label: "Atrial Flutter",              desc: "心房撲動",          shockable: false, teachingNote: "血動力學不穩定才做同步電覆律。" },
  vf:           { label: "Ventricular Fibrillation",    desc: "心室顫動",          shockable: true,  teachingNote: "VF 是最常見的可電擊節律。立即給予非同步電擊（200J）。" },
  vt_pulse:     { label: "VT with Pulse",               desc: "有脈搏心室頻脈",    shockable: true,  teachingNote: "血動力學不穩定的有脈 VT 可做同步電覆律。" },
  vt_pulseless: { label: "Pulseless VT",                desc: "無脈搏心室頻脈",    shockable: true,  teachingNote: "pVT 與 VF 相同處理：非同步電擊（200J）。" },
  svt:          { label: "SVT",                         desc: "上心室頻脈",        shockable: false, teachingNote: "先嘗試迷走神經刺激或 Adenosine；不穩定才電覆律。" },
  pea:          { label: "PEA",                         desc: "無脈搏電活動",       shockable: false, teachingNote: "PEA 不可電擊！治療 5H5T 可逆因素，給予 CPR + Epinephrine。" },
  asystole:     { label: "Asystole",                    desc: "心搏停止",           shockable: false, teachingNote: "Asystole 不可電擊！給予 CPR + Epinephrine，尋找可逆因素。" },
};

// ─── Teaching note card ───────────────────────────────────────────────────────

function ShockabilityGuide() {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-sm space-y-3">
      <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">ACLS 電擊適應症</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-red-900/20 border border-red-800/40 p-3">
          <p className="text-red-400 font-bold text-xs mb-1.5">⚡ 可電擊</p>
          <ul className="text-slate-300 text-xs space-y-1">
            <li>• VF（心室顫動）</li>
            <li>• pVT（無脈搏心室頻脈）</li>
          </ul>
        </div>
        <div className="rounded-lg bg-slate-700/30 border border-slate-600/40 p-3">
          <p className="text-slate-400 font-bold text-xs mb-1.5">🚫 不可電擊</p>
          <ul className="text-slate-300 text-xs space-y-1">
            <li>• PEA（無脈搏電活動）</li>
            <li>• Asystole（心搏停止）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function StandardDefibrillatorModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);
  const patient = useProGameStore((s) => s.patient);
  const deliverShock = useProGameStore((s) => s.deliverShock);

  const [analyzed, setAnalyzed] = useState(false);
  const [shockResult, setShockResult] = useState<{ success: boolean; message: string } | null>(null);

  if (activeModal !== "defibrillator") return null;

  const rhythm: RhythmType = patient?.vitals.rhythmStrip ?? "nsr";
  const rhythmInfo = RHYTHM_INFO[rhythm];

  const handleAnalyze = () => {
    setAnalyzed(true);
    setShockResult(null);
  };

  const handleShock = () => {
    const result = deliverShock();
    setShockResult(result);
  };

  const handleClose = () => {
    closeModal();
    setAnalyzed(false);
    setShockResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-sm mx-auto my-6 rounded-2xl shadow-2xl border border-red-900/40"
        style={{ background: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-red-900/30">
          <div>
            <h2 className="text-white font-bold text-lg">⚡ 電擊器</h2>
            <p className="text-slate-500 text-xs mt-0.5">Defibrillator · 200J Biphasic</p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-white text-2xl leading-none transition"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Shockability guide — always visible */}
          <ShockabilityGuide />

          {/* Rhythm analysis result */}
          {analyzed && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-2">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">目前心律分析</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-base">{rhythmInfo.label}</p>
                  <p className="text-slate-400 text-sm">{rhythmInfo.desc}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold whitespace-nowrap ${
                  rhythmInfo.shockable
                    ? "bg-red-900/40 text-red-400 border-red-500/30"
                    : "bg-slate-800 text-slate-500 border-slate-600"
                }`}>
                  {rhythmInfo.shockable ? "可電擊" : "不可電擊"}
                </span>
              </div>
              {/* Teaching note */}
              <p className="text-amber-300/80 text-xs leading-relaxed border-t border-slate-700/50 pt-2 mt-1">
                💡 {rhythmInfo.teachingNote}
              </p>
            </div>
          )}

          {/* Shock result */}
          {shockResult && (
            <div className={`rounded-lg px-4 py-3 text-sm border ${
              shockResult.success
                ? "bg-green-900/30 border-green-600 text-green-300"
                : "bg-yellow-900/30 border-yellow-600 text-yellow-300"
            }`}>
              {shockResult.success ? "✅ " : "⚠️ "}{shockResult.message}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            {/* Analyze */}
            <button
              onClick={handleAnalyze}
              className="w-full py-3 rounded-xl bg-blue-800/50 hover:bg-blue-700/60 border border-blue-600/40 text-blue-200 font-semibold text-sm transition-colors"
            >
              🔍 分析心律
            </button>

            {/* Shock */}
            <button
              onClick={handleShock}
              disabled={!analyzed}
              className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
                analyzed
                  ? "bg-red-700 hover:bg-red-600 active:scale-[0.98] text-white shadow-xl shadow-red-900/50"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
              }`}
            >
              ⚡ Shock (200J)
            </button>

            {/* Cancel */}
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700/40 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
