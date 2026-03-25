"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

// ── Types ───────────────────────────────────────────────────────────────────

interface ActionButtonConfig {
  id: string;
  icon: string;
  label: string;
  modal: "order" | "lab_order" | "consult" | "sbar" | "defibrillator" | "pe" | "imaging";
}

const MAIN_ACTIONS: ActionButtonConfig[] = [
  { id: "orders", icon: "\uD83D\uDC8A", label: "\u8655\u7F6E", modal: "order" },
  { id: "labs", icon: "\uD83E\uDE78", label: "\u6AA2\u67E5", modal: "lab_order" },
  { id: "pe", icon: "\uD83E\uDE7A", label: "PE", modal: "pe" },
  { id: "imaging", icon: "\uD83D\uDCF8", label: "\u5F71\u50CF", modal: "imaging" },
  { id: "call", icon: "\uD83D\uDCDE", label: "\u53EB\u4EBA", modal: "consult" },
  { id: "sbar", icon: "\uD83D\uDCCB", label: "SBAR", modal: "sbar" },
  { id: "defib", icon: "⚡", label: "電擊", modal: "defibrillator" },
];

// ── ActionButton ────────────────────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  highlighted,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  highlighted?: boolean;
}) {
  const base = [
    "flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-2",
    "text-sm font-medium transition-all select-none min-h-[56px] min-w-[48px]",
  ].join(" ");

  let variant: string;
  if (disabled) {
    variant = "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50";
  } else if (highlighted) {
    variant = "bg-green-900/30 border-2 border-green-400/70 text-green-300 cursor-pointer active:scale-95";
  } else {
    variant = "bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:bg-slate-700/80 cursor-pointer active:scale-95";
  }

  return (
    <button
      className={`${base} ${variant}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span className="leading-tight text-center font-semibold">{label}</span>
    </button>
  );
}

// ── SimplifiedActionBar ─────────────────────────────────────────────────────

export default function SimplifiedActionBar() {
  const openModal = useProGameStore((s) => s.openModal);
  const phase = useProGameStore((s) => s.phase);
  const guidanceHighlight = useProGameStore((s) => s.guidanceHighlight);
  const actionAdvance = useProGameStore((s) => s.actionAdvance);
  const isPlaying = phase === "playing";

  return (
    <div
      className="w-full px-3 py-3 space-y-2"
      style={{ background: "#0d1f3c" }}
    >
      {/* action buttons — 4+3 layout (two rows) */}
      <div className="grid grid-cols-4 gap-2">
        {MAIN_ACTIONS.slice(0, 4).map((action) => (
          <ActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            onClick={() => openModal(action.modal)}
            disabled={!isPlaying}
            highlighted={guidanceHighlight === action.modal || guidanceHighlight === action.id}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MAIN_ACTIONS.slice(4).map((action) => (
          <ActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            onClick={() => openModal(action.modal)}
            disabled={!isPlaying}
            highlighted={guidanceHighlight === action.modal || guidanceHighlight === action.id}
          />
        ))}
      </div>

      {/* Utility row */}
      <div className="flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm font-medium hover:bg-slate-700/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => openModal("pause_think")}
          disabled={!isPlaying}
        >
          <span>{"\u23F8"}</span>
          <span>{"\u66AB\u505C\u601D\u8003"}</span>
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm font-medium hover:bg-slate-700/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => actionAdvance(5)}
          disabled={!isPlaying}
        >
          <span>{"\u23E9"}</span>
          <span>{"\u5FEB\u8F495\u5206"}</span>
        </button>
      </div>
    </div>
  );
}
