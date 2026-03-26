"use client";

import { useState, useRef, useEffect } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import { dispatchPericardialEffusion } from "@/lib/simulator/engine/biogears-engine";

// ─── CT Milking Result Dialog ─────────────────────────────────────────────────

function CTMilkResultDialog({
  finding,
  onClose,
}: {
  finding: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-teal-700/40"
        style={{ background: "#001219" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔧</span>
          <h3 className="text-teal-300 font-bold text-lg">CT Milking</h3>
        </div>
        <div className="rounded-lg border border-teal-900/30 px-4 py-3 mb-4" style={{ backgroundColor: "#001e2e" }}>
          <p className="text-xs text-teal-500/60 uppercase tracking-widest mb-2">Finding</p>
          <p className="text-teal-100 text-sm leading-relaxed">{finding}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
        >
          關閉
        </button>
      </div>
    </div>
  );
}

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
      title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
      aria-label={label}
    >
      {icon}
      {shortcut && (
        <span className="hidden lg:block absolute -bottom-0.5 right-0 text-[8px] text-slate-600 font-mono">
          {shortcut}
        </span>
      )}
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
  const updateChestTube = useProGameStore((s) => s.updateChestTube);
  const patient = useProGameStore((s) => s.patient);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const clock = useProGameStore((s) => s.clock);
  const phase = useProGameStore((s) => s.phase);
  const hintsUsed = useProGameStore((s) => s.hintsUsed);
  const useHint = useProGameStore((s) => s.useHint);
  const actionAdvance = useProGameStore((s) => s.actionAdvance);
  const scenario = useProGameStore((s) => s.scenario);

  const [showMTPConfirm, setShowMTPConfirm] = useState(false);
  const [ctMilkResult, setCTMilkResult] = useState<string | null>(null);
  const [activePopover, setActivePopover] = useState<"treatment" | null>(null);

  const isPlaying = phase === "playing";

  // Show prominent MTP button for hemorrhage-related pathologies
  const showMTPButton = isPlaying && !mtpState.activated && (
    patient?.pathology === "surgical_bleeding" ||
    patient?.pathology === "coagulopathy"
  );

  // 通報交班: 所有 phase 都開 SBAR，但 Phase 1 提交後不結束遊戲
  const handleCallAndSBAR = () => {
    if (!isPlaying) return;

    // Record call_senior action
    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        { action: "call_senior", gameTime: clock.currentTime, category: "consult" },
      ],
    }));

    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "📞 你打電話通知學長，準備 SBAR 報告",
      sender: "player",
      isImportant: true,
    });

    // 開 SBAR modal（Phase 1 = 給學長的報告；Phase 2 = 最終交班）
    openModal("sbar");
  };

  const handleMilkCT = () => {
    if (!patient || !isPlaying) return;
    const ct = patient.chestTube;

    let finding: string;

    const nurseName = scenario?.nurseProfile?.name ?? "護理師";

    if (ct.isPatent) {
      finding = "\u80f8\u7ba1\u901a\u66a2\uff0c\u5f15\u6d41\u6b63\u5e38\uff0c\u7121\u8840\u584a\u3002\u4e0d\u9700\u8981\u8655\u7406\u3002";
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "\ud83d\udd27 Milk CT \u2014 \u80f8\u7ba1\u901a\u66a2",
        sender: "player",
      });
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "nurse_message",
        content: `${nurseName}：胸管看起來通暢，引流正常，不需要處理。`,
        sender: "nurse",
      });
      setCTMilkResult(finding);
      return;
    }

    if (ct.hasClots) {
      // Tamponade: 管路可以通但引流量不會恢復（血在心包腔凝固，不是單純管路阻塞）
      const isTamponade = patient.pathology === "cardiac_tamponade" || patient.pathology === "tamponade";
      if (isTamponade) {
        // Tamponade: milk 後管路感覺有通，但沒有血塊出來，引流量也沒恢復
        updateChestTube({ isPatent: true, currentRate: Math.max(ct.currentRate, 10), totalOutput: ct.totalOutput + 5 });
        // Milk CT 暫時緩解：部分恢復引流，降低心包壓力
        // 效果：severity -8，但 tamponade 的 base rate (2.5/min) 會很快追回來
        useProGameStore.getState().updatePatientSeverity(
          Math.max(0, (patient.severity ?? 0) - 8)
        );
        // T12: Dispatch to BioGears — temporarily reduce effusion rate by 20-30%
        // Milk effect: reduce for ~3 sim-minutes, then restore
        dispatchPericardialEffusion(10); // reduce from ~15 to 10 mL/min
        setTimeout(() => dispatchPericardialEffusion(15), 3 * 60 * 1000); // restore after 3 min
        finding = "用力 milk 了好幾次，管路感覺有通，但沒有擠出血塊。引流量幾乎沒有增加——管路本身好像不是問題⋯⋯那血去哪了？";
        addTimelineEntry({
          gameTime: clock.currentTime,
          type: "player_action",
          content: "🔧 Milk CT — 管路通了但無血塊排出，引流量未恢復。管路不是問題？",
          sender: "player",
          isImportant: true,
        });
        addTimelineEntry({
          gameTime: clock.currentTime,
          type: "nurse_message",
          content: `${nurseName}：醫師，我 milk 了好幾次，管路好像有通，但引流量幾乎沒增加⋯⋯心包壓力暫時有稍微下降。`,
          sender: "nurse",
          isImportant: true,
        });
      } else {
        updateChestTube({ isPatent: true, totalOutput: ct.totalOutput + 50 });
        // 成功擠出血塊，恢復引流 → severity -5
        useProGameStore.getState().updatePatientSeverity(
          Math.max(0, (patient.severity ?? 0) - 5)
        );
        finding = "擠出數個血塊，引流恢復通暢。Burst output +50cc，引流液為鮮紅色。";
        addTimelineEntry({
          gameTime: clock.currentTime,
          type: "player_action",
          content: "🔧 Milk CT — 擠出血塊，引流恢復",
          sender: "player",
          isImportant: true,
        });
        addTimelineEntry({
          gameTime: clock.currentTime,
          type: "nurse_message",
          content: `${nurseName}：胸管 milk 完，擠出血塊了！引流恢復通暢，burst output +50cc。Severity 有改善。`,
          sender: "nurse",
          isImportant: true,
        });
      }
    } else {
      updateChestTube({ isPatent: true });
      finding = "管路恢復通暢，但未擠出明顯血塊。引流量不多，阻塞原因可能非血塊。";
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "🔧 Milk CT — 管路通暢，無血塊",
        sender: "player",
        isImportant: false,
      });
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "nurse_message",
        content: `${nurseName}：胸管 milk 完了，管路通暢但沒有明顯血塊排出，引流量沒太大變化。`,
        sender: "nurse",
      });
    }

    setCTMilkResult(finding);

    useProGameStore.setState((state) => ({
      playerActions: [...state.playerActions, { action: "procedure:chest_tube_milk", gameTime: clock.currentTime, category: "procedure" }],
    }));
    actionAdvance(1);
  };

  // Treatment popover items
  const treatmentItems: PopoverItem[] = [
    { icon: "\ud83d\udc8a", label: "\u958b\u85e5", onClick: () => openModal("order") },
    { icon: "\ud83e\ude78", label: "\u8f38\u8840", onClick: () => openModal("order") },
    {
      icon: "\ud83d\udea8",
      label: mtpState.activated ? "MTP\u4e2d" : "\u5927\u91cf\u8f38\u8840 MTP",
      onClick: () => setShowMTPConfirm(true),
      disabled: mtpState.activated,
      disabledReason: "\u5927\u91cf\u8f38\u8840 Protocol \u5df2\u555f\u52d5\u4e2d",
      variant: "danger",
    },
    { icon: "\ud83d\udd27", label: "CT Milking", onClick: handleMilkCT },
    { icon: "\ud83c\udf2c\ufe0f", label: "\u547c\u5438\u5668", onClick: () => { sessionStorage.setItem("sim-order-tab", "ventilator"); openModal("order"); } },
  ];

  return (
    <>
      {ctMilkResult && (
        <CTMilkResultDialog
          finding={ctMilkResult}
          onClose={() => setCTMilkResult(null)}
        />
      )}
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

          {/* Treatment with popover */}
          <div className="relative">
            <IconBtn
              icon="💊" label="處置"
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
            icon="💡" label={`提示 ${3 - hintsUsed}/3`}
            onClick={useHint}
            disabled={!isPlaying || hintsUsed >= 3}
            variant="muted"
            shortcut="H"
          />
          <IconBtn
            icon="⏩" label="快轉5分"
            onClick={() => useProGameStore.getState().actionAdvance(5)}
            disabled={!isPlaying}
            variant="muted"
            shortcut="F"
          />
        </div>
      </div>
    </>
  );
}
