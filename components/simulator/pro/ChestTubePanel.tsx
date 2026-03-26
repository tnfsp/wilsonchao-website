"use client";

import { useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import { dispatchPericardialEffusion } from "@/lib/simulator/engine/biogears-engine";
import type { ChestTubeColor } from "@/lib/simulator/types";

// ─── Color config ─────────────────────────────────────────────────────────────

const COLOR_CONFIG: Record<
  ChestTubeColor,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  bright_red: {
    label: "鮮紅",
    bgClass: "bg-red-600",
    textClass: "text-red-300",
    borderClass: "border-red-500/60",
  },
  dark_red: {
    label: "暗紅",
    bgClass: "bg-red-900",
    textClass: "text-red-400",
    borderClass: "border-red-700/60",
  },
  serosanguineous: {
    label: "淡血性",
    bgClass: "bg-rose-800",
    textClass: "text-rose-300",
    borderClass: "border-rose-600/60",
  },
  serous: {
    label: "漿液性",
    bgClass: "bg-amber-700",
    textClass: "text-amber-300",
    borderClass: "border-amber-600/40",
  },
};

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

// ─── StatusRow ────────────────────────────────────────────────────────────────

function StatusRow({
  label,
  ok,
  okLabel = "✓",
  badLabel = "✗",
  alert = false,
}: {
  label: string;
  ok: boolean;
  okLabel?: string;
  badLabel?: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span
        className={`font-mono font-bold ${
          ok
            ? "text-green-400"
            : alert
              ? "text-red-400 animate-pulse"
              : "text-red-400"
        }`}
      >
        {ok ? okLabel : badLabel}
      </span>
    </div>
  );
}

// ─── ChestTubePanel ───────────────────────────────────────────────────────────

export default function ChestTubePanel() {
  const chestTube = useProGameStore((s) => s.patient?.chestTube);
  const patient = useProGameStore((s) => s.patient);
  const updateChestTube = useProGameStore((s) => s.updateChestTube);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const clock = useProGameStore((s) => s.clock);
  const phase = useProGameStore((s) => s.phase);
  const actionAdvance = useProGameStore((s) => s.actionAdvance);
  const scenario = useProGameStore((s) => s.scenario);

  const [ctMilkResult, setCTMilkResult] = useState<string | null>(null);

  const isPlaying = phase === "playing";

  // ─── CT Milking handler ───────────────────────────────────────────────────

  const handleMilkCT = () => {
    if (!patient || !isPlaying) return;
    const ct = patient.chestTube;

    let finding: string;

    const nurseName = scenario?.nurseProfile?.name ?? "護理師";

    if (ct.isPatent) {
      finding = "胸管通暢，引流正常，無血塊。不需要處理。";
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "🔧 Milk CT — 胸管通暢",
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!chestTube) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/5 p-4 text-gray-500 text-sm">
        Chest Tube 尚未載入
      </div>
    );
  }

  const colorCfg = COLOR_CONFIG[chestTube.color];
  const isCritical = chestTube.currentRate > 200 || !chestTube.isPatent;

  return (
    <>
      {ctMilkResult && (
        <CTMilkResultDialog
          finding={ctMilkResult}
          onClose={() => setCTMilkResult(null)}
        />
      )}

      <div
        className={`rounded-xl border p-4 space-y-3 ${
          isCritical
            ? "border-red-500/60 bg-red-950/20"
            : "border-white/8 bg-[#001a25]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isCritical ? "bg-red-500 animate-ping" : "bg-gray-500"
              }`}
            />
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              Chest Tube
            </span>
          </div>
          {isCritical && (
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
              ⚠ Alert
            </span>
          )}
        </div>

        {/* Rate + Total */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-black/30 border border-white/8 p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              Rate
            </div>
            <div
              className={`font-mono font-bold text-2xl ${
                chestTube.currentRate > 200
                  ? "text-red-400"
                  : chestTube.currentRate > 100
                    ? "text-yellow-400"
                    : "text-green-400"
              }`}
            >
              {chestTube.currentRate}
              <span className="text-xs font-normal text-gray-500 ml-1">
                cc/hr
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-black/30 border border-white/8 p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">
              累計
            </div>
            <div
              className={`font-mono font-bold text-2xl ${
                chestTube.totalOutput > 1000
                  ? "text-red-400"
                  : chestTube.totalOutput > 500
                    ? "text-yellow-400"
                    : "text-gray-300"
              }`}
            >
              {chestTube.totalOutput}
              <span className="text-xs font-normal text-gray-500 ml-1">cc</span>
            </div>
          </div>
        </div>

        {/* Color indicator */}
        <div
          className={`rounded-lg border ${colorCfg.borderClass} bg-black/30 px-3 py-2.5 flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm ${colorCfg.bgClass} flex-shrink-0`} />
            <span className="text-[10px] uppercase tracking-widest text-gray-500">
              顏色
            </span>
          </div>
          <span className={`text-sm font-semibold ${colorCfg.textClass}`}>
            {colorCfg.label}
          </span>
        </div>

        {/* Status rows — no obstruction hints; player must discover themselves */}
        <div className="rounded-lg bg-black/30 border border-white/8 px-3 py-2 space-y-1.5">
          <StatusRow
            label="Patent"
            ok={chestTube.isPatent}
            okLabel="✓ Patent"
            badLabel="Not patent"
            alert={false}
          />
          <StatusRow
            label="Air Leak"
            ok={!chestTube.airLeak}
            okLabel="✓ None"
            badLabel="✗ Present"
          />
        </div>

        {/* ── CT Milking action button ── */}
        <button
          onClick={handleMilkCT}
          disabled={!isPlaying}
          className={[
            "w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isPlaying
              ? "bg-teal-800/40 hover:bg-teal-700/50 text-teal-300 border border-teal-700/40"
              : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5",
          ].join(" ")}
          title="Milk chest tube to check for clots"
        >
          <span className="text-base">🔧</span>
          <span>Milk CT</span>
        </button>
      </div>
    </>
  );
}
