"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";

// ─── MTP Confirm Dialog ──────────────────────────────────────────────────────

function MTPConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-red-700/60"
        style={{ background: "#0d1f3c" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🚨</span>
          <h3 className="text-red-400 font-bold text-lg">啟動大量輸血 Protocol</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-2">MTP 啟動條件：</p>
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

// ─── Pulse Animation CSS ─────────────────────────────────────────────────────

const pulseStyle = `
@keyframes guidancePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { box-shadow: 0 0 12px 4px rgba(74, 222, 128, 0.6); }
}
`;

// ─── Action Button ───────────────────────────────────────────────────────────

interface ActionBtnProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "muted";
  highlighted?: boolean;
  small?: boolean;
  shortcut?: string;
}

function ActionBtn({ icon, label, onClick, disabled, variant, highlighted, small, shortcut }: ActionBtnProps) {
  let base = small
    ? "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all select-none"
    : "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-medium transition-all select-none";

  if (disabled) {
    base += " bg-slate-800 text-slate-600 cursor-not-allowed opacity-60";
  } else if (variant === "danger") {
    base += " bg-red-900/50 border border-red-700/60 text-red-300 hover:bg-red-800/60 cursor-pointer";
  } else if (highlighted) {
    base += " bg-green-900/30 border-2 border-green-400/70 text-green-300 cursor-pointer";
  } else {
    base += " bg-slate-800/80 border border-slate-700/60 text-slate-200 hover:bg-slate-700/80 cursor-pointer";
  }

  return (
    <button
      className={base}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
      style={highlighted && !disabled ? { animation: "guidancePulse 2s ease-in-out infinite" } : undefined}
    >
      <span className={small ? "text-base" : "text-xl leading-none"}>{icon}</span>
      <span className="leading-tight text-center">{label}</span>
      {shortcut && (
        <span className="hidden lg:block text-[10px] text-slate-500 leading-none">
          {shortcut}
        </span>
      )}
    </button>
  );
}

// ─── Main ActionBar ──────────────────────────────────────────────────────────

export default function ActionBar() {
  const openModal = useProGameStore((s) => s.openModal);
  const activateMTP = useProGameStore((s) => s.activateMTP);
  const mtpState = useProGameStore((s) => s.mtpState);
  const updateChestTube = useProGameStore((s) => s.updateChestTube);
  const patient = useProGameStore((s) => s.patient);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const clock = useProGameStore((s) => s.clock);
  const phase = useProGameStore((s) => s.phase);
  const guidanceHighlight = useProGameStore((s) => s.guidanceHighlight);

  const [showMTPConfirm, setShowMTPConfirm] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);

  const isPlaying = phase === "playing";

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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseStyle }} />

      {showMTPConfirm && (
        <MTPConfirmDialog
          onConfirm={() => { activateMTP(); setShowMTPConfirm(false); }}
          onCancel={() => setShowMTPConfirm(false)}
        />
      )}

      <div className="w-full px-2 py-2 border-t border-slate-700/60 space-y-2" style={{ background: "#0d1f3c" }}>
        {/* Main Row — 5 buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          <ActionBtn
            icon="🔬" label="PE"
            onClick={() => openModal("pe")}
            disabled={!isPlaying}
            highlighted={guidanceHighlight === "pe"}
            shortcut="1"
          />
          <ActionBtn
            icon="🩸" label="抽血"
            onClick={() => openModal("lab_order")}
            disabled={!isPlaying}
            highlighted={guidanceHighlight === "lab_order"}
            shortcut="2"
          />
          <ActionBtn
            icon="💊" label="處置"
            onClick={() => setShowSubMenu(!showSubMenu)}
            disabled={!isPlaying}
            highlighted={guidanceHighlight === "order"}
            shortcut="3"
          />
          <ActionBtn
            icon="📞" label="叫人"
            onClick={() => openModal("consult")}
            disabled={!isPlaying}
            highlighted={guidanceHighlight === "consult"}
            shortcut="4"
          />
          <ActionBtn
            icon="📋" label="SBAR"
            onClick={() => openModal("sbar")}
            disabled={!isPlaying}
            highlighted={guidanceHighlight === "sbar"}
            shortcut="5"
          />
        </div>

        {/* Sub Menu — expandable */}
        {showSubMenu && isPlaying && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1 border-t border-slate-700/40">
            <ActionBtn icon="💊" label="開藥" onClick={() => { openModal("order"); setShowSubMenu(false); }} small />
            <ActionBtn icon="🩸" label="輸血" onClick={() => { openModal("order"); setShowSubMenu(false); }} small />
            <ActionBtn
              icon="🚨" label={mtpState.activated ? "MTP中" : "MTP"}
              onClick={() => { setShowMTPConfirm(true); setShowSubMenu(false); }}
              disabled={mtpState.activated}
              variant="danger" small
            />
            <ActionBtn
              icon="🔧" label="通CT"
              onClick={() => { handleOpenCT(); setShowSubMenu(false); }}
              disabled={patient?.chestTube.isPatent === true}
              small
            />
            <ActionBtn icon="🫁" label="POCUS" onClick={() => { openModal("pocus"); setShowSubMenu(false); }} small />
            <ActionBtn icon="🩻" label="影像" onClick={() => { openModal("imaging"); setShowSubMenu(false); }} small />
          </div>
        )}

        {/* Bottom Row — utility */}
        <div className="flex gap-1.5">
          <ActionBtn
            icon="⏸" label="暫停思考"
            onClick={() => openModal("pause_think")}
            disabled={!isPlaying} small
            shortcut="Space"
          />
          <ActionBtn
            icon="⏩" label="快轉5分"
            onClick={() => useProGameStore.getState().actionAdvance(5)}
            disabled={!isPlaying} variant="muted" small
            shortcut="F"
          />
        </div>
      </div>
    </>
  );
}
