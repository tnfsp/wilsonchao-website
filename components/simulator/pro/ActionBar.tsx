"use client";

import { useState, useRef, useEffect } from "react";
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
        <p className="text-yellow-400 text-sm font-semibold mb-5">
          確定啟動大量輸血 Protocol 嗎？此操作無法撤銷。
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

// ─── Popover ─────────────────────────────────────────────────────────────────

interface PopoverItem {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  variant?: "default" | "danger";
}

function ActionPopover({
  items,
  onClose,
}: {
  items: PopoverItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[65] min-w-[180px] rounded-xl border border-white/10 bg-[#001a25] shadow-2xl p-1.5"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
          title={item.disabled && item.disabledReason ? item.disabledReason : item.label}
          className={[
            "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
            item.disabled
              ? "text-slate-600 cursor-not-allowed"
              : item.variant === "danger"
                ? "text-red-300 hover:bg-red-900/40"
                : "text-slate-200 hover:bg-white/8",
          ].join(" ")}
        >
          <span className="text-base flex-shrink-0">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function Tooltip({ label, shortcut }: { label: string; shortcut?: string }) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[80] pointer-events-none whitespace-nowrap">
      <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 shadow-xl text-xs">
        <span className="text-slate-200">{label}</span>
        {shortcut && (
          <span className="ml-1.5 px-1 py-0.5 rounded bg-slate-700 text-slate-400 font-mono text-[10px]">
            {shortcut}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Icon Button ─────────────────────────────────────────────────────────────

interface IconBtnProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "muted";
  active?: boolean;
  shortcut?: string;
}

function IconBtn({ icon, label, onClick, disabled, variant, active, shortcut }: IconBtnProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  let cls =
    "relative flex items-center justify-center w-10 h-10 rounded-lg text-lg transition-all select-none";

  if (disabled) {
    cls += " text-slate-600 cursor-not-allowed opacity-50";
  } else if (active) {
    cls += " bg-cyan-600/30 text-cyan-300 cursor-pointer";
  } else if (variant === "danger") {
    cls += " text-red-400 hover:bg-red-900/40 cursor-pointer";
  } else if (variant === "muted") {
    cls += " text-slate-400 hover:bg-white/8 cursor-pointer";
  } else {
    cls += " text-slate-200 hover:bg-white/8 cursor-pointer";
  }

  return (
    <button
      className={cls}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={label}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {icon}
      {shortcut && (
        <span className="hidden lg:block absolute -bottom-0.5 right-0 text-[8px] text-slate-600 font-mono">
          {shortcut}
        </span>
      )}
      {showTooltip && !disabled && <Tooltip label={label} shortcut={shortcut} />}
    </button>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function BarDivider() {
  return <div className="w-px h-6 bg-white/10 mx-0.5 flex-shrink-0" />;
}

// ─── MTP Phase Banner ────────────────────────────────────────────────────────

/** ACS TQIP 6:6:1 MTP products per phase */
const MTP_PHASES: Record<number, string> = {
  1: "pRBC 6u + FFP 6u + Plt 1 pool + TXA 1g",
  2: "pRBC 6u + FFP 6u + Plt 1 pool",
  3: "pRBC 6u + FFP 6u + Plt 1 pool",
  4: "pRBC 6u + FFP 6u + Plt 1 pool",
};

function MTPPhaseBanner({
  roundsDelivered,
  activated,
}: {
  roundsDelivered: number;
  activated: boolean;
}) {
  if (!activated) return null;

  const currentPhase = roundsDelivered + 1;
  const isComplete = roundsDelivered >= 4;
  const phaseDesc = MTP_PHASES[Math.min(currentPhase, 4)] ?? "";

  return (
    <div className="w-full px-3 py-1.5 flex items-center gap-2 bg-red-950/80 border-t border-red-500/30">
      <span className="text-red-400 text-sm flex-shrink-0">🩸</span>
      <div className="flex-1 min-w-0">
        {isComplete ? (
          <p className="text-[11px] text-red-300 font-medium truncate">
            MTP 完成 — 共 4 rounds 已送達
          </p>
        ) : roundsDelivered === 0 ? (
          <p className="text-[11px] text-red-300 font-medium truncate">
            MTP 啟動中 — Phase 1 血品準備中：{phaseDesc}
          </p>
        ) : (
          <p className="text-[11px] text-red-300 font-medium truncate">
            MTP Phase {roundsDelivered} 已送達 — Phase {currentPhase} 準備中：{phaseDesc}
          </p>
        )}
      </div>
      {/* Phase dots */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {[1, 2, 3, 4].map((r) => (
          <div
            key={r}
            className={`w-2 h-2 rounded-full ${
              r <= roundsDelivered
                ? "bg-red-400"
                : r === roundsDelivered + 1
                  ? "bg-red-400/40 animate-pulse"
                  : "bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main ActionBar ──────────────────────────────────────────────────────────

export default function ActionBar() {
  const openModal = useProGameStore((s) => s.openModal);
  const activateMTP = useProGameStore((s) => s.activateMTP);
  const mtpState = useProGameStore((s) => s.mtpState);
  const patient = useProGameStore((s) => s.patient);
  const phase = useProGameStore((s) => s.phase);
  const hintsUsed = useProGameStore((s) => s.hintsUsed);
  const hintLoading = useProGameStore((s) => s.hintLoading);
  const useHint = useProGameStore((s) => s.useHint);
  const difficulty = useProGameStore((s) => s.difficulty);
  const isStandard = difficulty === "standard";

  const [showMTPConfirm, setShowMTPConfirm] = useState(false);
  const [activePopover, setActivePopover] = useState<"treatment" | null>(null);

  const isPlaying = phase === "playing";

  // Disable fast-forward during cardiac arrest (ACLS timer is separate)
  const arrestRhythms = ["vf", "vt_pulseless", "pea", "asystole"];
  const isInArrest = patient?.vitals.hr === 0 || arrestRhythms.includes(patient?.vitals.rhythmStrip ?? "");

  // Show prominent MTP button for hemorrhage-related pathologies
  const showMTPButton = isPlaying && !mtpState.activated && (
    patient?.pathology === "surgical_bleeding" ||
    patient?.pathology === "coagulopathy"
  );

  // CT Milking handler — delegates to store-level milkChestTube action
  const handleMilkCT = useProGameStore((s) => s.milkChestTube);

  // 通報交班 / 叫人 → 一律開 ConsultModal
  const handleCallAndSBAR = () => {
    if (!isPlaying) return;
    openModal("consult");
  };

  // Treatment popover items (identical for Standard and Pro)
  const treatmentItems: PopoverItem[] = [
    { icon: "💊", label: "開藥", onClick: () => openModal("order") },
    { icon: "🩸", label: "輸血", onClick: () => openModal("order") },
    {
      icon: "🚨",
      label: mtpState.activated ? "MTP中" : "大量輸血 MTP",
      onClick: () => setShowMTPConfirm(true),
      disabled: mtpState.activated,
      disabledReason: "大量輸血 Protocol 已啟動中",
      variant: "danger" as const,
    },
    { icon: "🌬️", label: "呼吸器", onClick: () => { sessionStorage.setItem("sim-order-tab", "ventilator"); openModal("order"); } },
    {
      icon: "🔧",
      label: "Milk CT",
      onClick: handleMilkCT,
      disabled: !patient?.chestTube,
      disabledReason: "沒有 chest tube",
    },
  ];

  return (
    <>
      {showMTPConfirm && (
        <MTPConfirmDialog
          onConfirm={() => { activateMTP(); setShowMTPConfirm(false); }}
          onCancel={() => setShowMTPConfirm(false)}
        />
      )}

      {/* ── MTP Phase progression banner ── */}
      <MTPPhaseBanner
        roundsDelivered={mtpState.roundsDelivered}
        activated={mtpState.activated}
      />

      <div
        id="action-bar"
        className="w-full px-2 py-1.5 flex items-center justify-between"
        style={{ background: "#0d1f3c" }}
      >
        {/* ── Left group: main actions ── */}
        <div className="flex items-center gap-0.5">
          <IconBtn
            icon="🔬" label="PE"
            onClick={() => openModal("pe")}
            disabled={!isPlaying}
            shortcut="1"
          />
          <IconBtn
            icon="🩸" label="抽血"
            onClick={() => openModal("lab_order")}
            disabled={!isPlaying}
            shortcut="2"
          />

          {/* Treatment popover (shared: Standard omits MTP, Pro has full menu) */}
          <div className="relative">
            <IconBtn
              icon="⚕️" label="處置"
              onClick={() => setActivePopover(activePopover === "treatment" ? null : "treatment")}
              disabled={!isPlaying}
              active={activePopover === "treatment"}
              shortcut="3"
            />
            {activePopover === "treatment" && isPlaying && (
              <ActionPopover
                items={treatmentItems}
                onClose={() => setActivePopover(null)}
              />
            )}
          </div>

          <IconBtn
            icon="📞" label="通報交班"
            onClick={handleCallAndSBAR}
            disabled={!isPlaying}
            shortcut="4"
          />
          <IconBtn
            icon="⚡" label="電擊"
            onClick={() => openModal("defibrillator")}
            disabled={!isPlaying}
            shortcut="5"
          />
          <IconBtn
            icon="🩻" label="影像"
            onClick={() => openModal("imaging")}
            disabled={!isPlaying}
            shortcut="6"
          />

          {/* ── Prominent MTP activation button (hemorrhage scenarios only) ── */}
          {showMTPButton && (
            <>
              <BarDivider />
              <button
                onClick={() => setShowMTPConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold transition-colors animate-pulse"
                title="啟動大量輸血 Protocol (MTP)"
              >
                <span className="text-sm">🩸</span>
                <span>MTP</span>
              </button>
            </>
          )}
        </div>

        {/* ── Divider ── */}
        <BarDivider />

        {/* ── Right group: utility ── */}
        <div className="flex items-center gap-0.5">
          <IconBtn
            icon="📊" label="Lab 總覽"
            onClick={() => openModal("lab_overview")}
            disabled={!isPlaying}
            variant="muted"
            shortcut="L"
          />
          <IconBtn
            icon="⏸" label="暫停思考"
            onClick={() => openModal("pause_think")}
            disabled={!isPlaying}
            variant="muted"
            shortcut="Space"
          />
          <IconBtn
            icon={hintLoading ? "⏳" : "💡"} label={hintLoading ? "思考中..." : `提示 ${3 - hintsUsed}/3`}
            onClick={useHint}
            disabled={!isPlaying || hintsUsed >= 3 || hintLoading}
            variant="muted"
            shortcut="H"
          />
          <IconBtn
            icon="⏩" label="快轉5分"
            onClick={() => useProGameStore.getState().actionAdvance(5)}
            disabled={!isPlaying || isInArrest}
            variant="muted"
            shortcut="F"
          />
        </div>
      </div>
    </>
  );
}
