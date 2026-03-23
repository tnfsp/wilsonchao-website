"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

// ─────────────────────────────────────────────
// Button definition
// ─────────────────────────────────────────────
interface ActionButton {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledLabel?: string;
  variant?: "default" | "danger" | "muted";
}

// ─────────────────────────────────────────────
// MTP Confirm Dialog
// ─────────────────────────────────────────────
function MTPConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-red-700/60"
        style={{ background: "#0d1f3c" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🚨</span>
          <h3 className="text-red-400 font-bold text-lg">啟動大量輸血 Protocol</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-2">
          MTP 啟動條件：
        </p>
        <ul className="text-slate-400 text-sm space-y-1 mb-4 list-disc list-inside">
          <li>預估失血 &gt; 1 blood volume</li>
          <li>持續需要 ≥4U pRBC within 1hr</li>
          <li>血流動力學不穩定 despite resuscitation</li>
        </ul>
        <p className="text-yellow-400 text-sm font-semibold mb-5">
          確定要啟動嗎？此操作無法撤銷。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors"
          >
            確認啟動 MTP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Single Action Button
// ─────────────────────────────────────────────
function ActionBtn({ btn }: { btn: ActionButton }) {
  const isDisabled = btn.disabled ?? false;
  const displayLabel = isDisabled && btn.disabledLabel ? btn.disabledLabel : btn.label;

  let baseStyle =
    "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-all select-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 active:scale-95";

  if (isDisabled) {
    baseStyle += " bg-slate-800 text-slate-600 cursor-not-allowed opacity-60";
  } else if (btn.variant === "danger") {
    baseStyle +=
      " bg-red-900/50 border border-red-700/60 text-red-300 hover:bg-red-800/60 hover:border-red-600 cursor-pointer";
  } else {
    baseStyle +=
      " bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:bg-slate-700/80 hover:border-slate-500 cursor-pointer";
  }

  return (
    <button
      className={baseStyle}
      onClick={isDisabled ? undefined : btn.onClick}
      disabled={isDisabled}
      title={btn.label}
    >
      <span className="text-xl leading-none">{btn.icon}</span>
      <span className="leading-tight text-center">{displayLabel}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function ActionBar() {
  const openModal = useProGameStore((s) => s.openModal);
  const activateMTP = useProGameStore((s) => s.activateMTP);
  const mtpState = useProGameStore((s) => s.mtpState);
  const updateChestTube = useProGameStore((s) => s.updateChestTube);
  const patient = useProGameStore((s) => s.patient);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const clock = useProGameStore((s) => s.clock);
  const phase = useProGameStore((s) => s.phase);

  const [showMTPConfirm, setShowMTPConfirm] = useState(false);

  const isPlaying = phase === "playing";

  // 通 CT 動作
  const handleOpenCT = () => {
    if (!patient || !isPlaying) return;
    updateChestTube({ isPatent: true });
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "🔧 通暢胸管（Milk/Strip CT）— 確認引流通暢",
      sender: "player",
      isImportant: false,
    });
  };

  const buttons: ActionButton[] = [
    {
      icon: "💊",
      label: "開藥",
      onClick: () => openModal("order"),
      disabled: !isPlaying,
    },
    {
      icon: "🩸",
      label: "抽血",
      onClick: () => openModal("lab_order"),
      disabled: !isPlaying,
    },
    {
      icon: "🔬",
      label: "PE",
      onClick: () => openModal("pe"),
      disabled: !isPlaying,
    },
    {
      icon: "🩻",
      label: "影像",
      onClick: () => openModal("imaging"),
      disabled: !isPlaying,
    },
    {
      icon: "🫁",
      label: "POCUS",
      onClick: () => openModal("pocus"),
      disabled: !isPlaying,
    },
    {
      icon: "📞",
      label: "叫人",
      onClick: () => openModal("consult"),
      disabled: !isPlaying,
    },
    {
      icon: "🩸",
      label: "輸血",
      onClick: () => openModal("order"),
      disabled: !isPlaying,
    },
    {
      icon: "🚨",
      label: "MTP",
      onClick: () => setShowMTPConfirm(true),
      disabled: !isPlaying || mtpState.activated,
      disabledLabel: mtpState.activated ? "MTP進行中" : "MTP",
      variant: mtpState.activated ? "muted" : "danger",
    },
    {
      icon: "🔧",
      label: "通 CT",
      onClick: handleOpenCT,
      disabled: !isPlaying || (patient?.chestTube.isPatent === true),
    },
    {
      icon: "⏸",
      label: "思考",
      onClick: () => openModal("pause_think"),
      disabled: !isPlaying,
    },
    {
      icon: "⏩",
      label: "快轉5分",
      onClick: () => {
        const store = useProGameStore.getState();
        store.actionAdvance(5);
      },
      disabled: !isPlaying,
      variant: "muted" as const,
    },
    {
      icon: "📋",
      label: "SBAR",
      onClick: () => openModal("sbar"),
      disabled: !isPlaying,
      variant: "default" as const,
    },
  ];

  return (
    <>
      {/* MTP Confirm Dialog */}
      {showMTPConfirm && (
        <MTPConfirmDialog
          onConfirm={() => {
            activateMTP();
            setShowMTPConfirm(false);
          }}
          onCancel={() => setShowMTPConfirm(false)}
        />
      )}

      {/* Action Bar */}
      <div
        className="w-full px-2 py-2 border-t border-slate-700/60"
        style={{ background: "#0d1f3c" }}
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 md:gap-2">
          {buttons.map((btn, idx) => (
            <ActionBtn key={idx} btn={btn} />
          ))}
        </div>
      </div>
    </>
  );
}
