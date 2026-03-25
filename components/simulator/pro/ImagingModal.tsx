"use client";

import { useState } from "react";
import Image from "next/image";
import { useProGameStore } from "@/lib/simulator/store";
import type { PendingEvent, POCUSView } from "@/lib/simulator/types";
import { selectCXR, buildCXRInput } from "@/lib/simulator/engine/cxr-selector";
import { getLastBioGearsState } from "@/lib/simulator/engine/biogears-engine";
import {
  generateECGMorphology,
  generateInterpretation,
} from "@/lib/simulator/engine/ecg-generator";
import { EcgCanvas } from "./EcgCanvas";
import { CxrCanvas } from "./CxrCanvas";

// ── Tab definitions ──────────────────────────────────────────

type ImagingTab = "cxr" | "echo" | "lung_pocus" | "ivc" | "ecg";

interface TabDef {
  key: ImagingTab;
  label: string;
  emoji: string;
  turnaroundLabel: string;
  turnaround: "immediate" | number; // minutes or immediate
}

const TABS: TabDef[] = [
  { key: "cxr",        label: "CXR",        emoji: "📷", turnaroundLabel: "~15 min", turnaround: 15 },
  { key: "echo",       label: "Echo",       emoji: "🫀", turnaroundLabel: "即時",    turnaround: "immediate" },
  { key: "lung_pocus", label: "Lung POCUS", emoji: "🫁", turnaroundLabel: "即時",    turnaround: "immediate" },
  { key: "ivc",        label: "IVC",        emoji: "🩸", turnaroundLabel: "即時",    turnaround: "immediate" },
  { key: "ecg",        label: "ECG",        emoji: "📊", turnaroundLabel: "~5 min",  turnaround: 5 },
];

// ── Real CXR images per pathology ────────────────────────────

const CXR_REAL_IMAGES: Record<string, { src: string; alt: string; attribution: string }> = {
  cardiac_tamponade: {
    src: "/assets/cxr/cardiac-tamponade/water-bottle-sign.png",
    alt: "Water-bottle sign — 心包積液典型 CXR",
    attribution: "Wikimedia Commons, CC-BY-SA 4.0",
  },
  tamponade: {
    src: "/assets/cxr/cardiac-tamponade/water-bottle-sign.png",
    alt: "Water-bottle sign — 心包積液典型 CXR",
    attribution: "Wikimedia Commons, CC-BY-SA 4.0",
  },
  lcos: {
    src: "/assets/cxr/cardiogenic-shock/pulmonary-edema.png",
    alt: "Pulmonary edema — 心因性肺水腫 CXR",
    attribution: "Wikimedia Commons, CC-BY-SA 3.0",
  },
  septic_shock: {
    src: "/assets/cxr/cardiogenic-shock/pulmonary-edema.png",
    alt: "Bilateral infiltrates — ARDS/Sepsis 相關肺浸潤",
    attribution: "Wikimedia Commons, CC-BY-SA 3.0",
  },
  surgical_bleeding: {
    src: "/assets/cxr/surgical-bleeding/mediastinal-hematoma-post-cabg.jpg",
    alt: "Mediastinal hematoma post-CABG — 縱膈腔血腫，widened mediastinum",
    attribution: "Radiopaedia.org, CC-BY-NC-SA",
  },
};

// ── Real echo video clips per pathology + view ───────────────

interface EchoClip { src: string; label: string; }

/** Map: pathology → pocus view key → clips */
const ECHO_CLIPS: Record<string, Record<string, EchoClip[]>> = {
  cardiac_tamponade: {
    cardiac: [
      { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C — 心包積液 + RV collapse" },
      { src: "/assets/echo/cardiac-tamponade/plax.mp4", label: "PLAX — 心包積液" },
      { src: "/assets/echo/cardiac-tamponade/psax.mp4", label: "PSAX" },
      { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal" },
    ],
    ivc: [
      { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC — 擴張無塌陷（plethora）" },
    ],
    lung: [],
  },
  tamponade: {
    cardiac: [
      { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C — 心包積液" },
      { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal" },
    ],
    ivc: [
      { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC — 擴張無塌陷" },
    ],
    lung: [],
  },
  surgical_bleeding: {
    cardiac: [
      { src: "/assets/echo/normal/a4c.mp4", label: "A4C — 正常心臟功能（出血非心因性）" },
    ],
    ivc: [
      { src: "/assets/echo/hypovolemia/ivc-long.mp4", label: "IVC Long Axis — 塌陷（低血容量）" },
      { src: "/assets/echo/hypovolemia/ivc-trans.mp4", label: "IVC Trans — 呼吸變化明顯" },
    ],
    lung: [],
  },
  lcos: {
    cardiac: [
      { src: "/assets/echo/takotsubo/a4c.mp4", label: "A4C — LV dysfunction" },
      { src: "/assets/echo/takotsubo/plax.mp4", label: "PLAX — 收縮功能下降" },
    ],
    ivc: [],
    lung: [
      { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines — 肺水腫" },
    ],
  },
  septic_shock: {
    cardiac: [],
    ivc: [],
    lung: [
      { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines — ARDS/肺水腫" },
      { src: "/assets/echo/lung-b-lines/confluent-b-lines.mp4", label: "Confluent B-lines — 嚴重肺浸潤" },
    ],
  },
  tension_pneumothorax: {
    cardiac: [],
    ivc: [],
    lung: [
      { src: "/assets/echo/lung-pneumothorax/absent-sliding.mp4", label: "Lung — 肺滑動消失（Absent sliding）" },
    ],
  },
};

// ── Map tab key → POCUS view key (for availablePOCUS lookup) ─

function getPocusViewKey(tab: ImagingTab): string | null {
  switch (tab) {
    case "echo":       return "cardiac";
    case "lung_pocus": return "lung";
    case "ivc":        return "ivc";
    default:           return null;
  }
}

// ── Map tab key → echo clips key ─────────────────────────────

function getClipsKey(tab: ImagingTab): string | null {
  switch (tab) {
    case "echo":       return "cardiac";
    case "lung_pocus": return "lung";
    case "ivc":        return "ivc";
    default:           return null;
  }
}

// ── Component ────────────────────────────────────────────────

export function ImagingModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { scenario, patient, clock, closeModal, addTimelineEntry, addPendingEvent } =
    useProGameStore();
  const actionAdvance = useProGameStore((s) => s.actionAdvance);

  const [activeTab, setActiveTab] = useState<ImagingTab>("cxr");

  // Track which tabs have been ordered / scanned
  const [orderedTabs, setOrderedTabs] = useState<Set<ImagingTab>>(new Set());
  // Deferred results pending (CXR, ECG)
  const [pendingTabs, setPendingTabs] = useState<Set<ImagingTab>>(new Set());
  // Deferred results ready
  const [readyTabs, setReadyTabs] = useState<Set<ImagingTab>>(new Set());

  // ECG auto-interp visibility
  const [showEcgAutoInterp, setShowEcgAutoInterp] = useState(false);
  // (CXR findings pills removed — moved to Debrief)

  if (activeModal !== "imaging" || !scenario) return null;

  // Dynamic pathology: follows patient state (multi-phase scenario support)
  const currentPathology = patient?.pathology ?? scenario.pathology ?? "";
  const phased = patient?.pathology ? scenario.phasedFindings?.[patient.pathology] : undefined;
  const availableImaging = (phased?.availableImaging ?? scenario.availableImaging) as Record<string, string>;
  const availablePOCUS = (phased?.availablePOCUS ?? scenario.availablePOCUS) as Record<string, POCUSView>;
  const pathology = currentPathology;
  const nurseName = scenario.nurseProfile.name ?? "護理師";

  // ── Helpers ──

  const isTabOrdered = (tab: ImagingTab) => orderedTabs.has(tab);
  const isTabPending = (tab: ImagingTab) => pendingTabs.has(tab);
  const isTabReady = (tab: ImagingTab) => readyTabs.has(tab);

  // Check if a tab has result data available in the scenario
  function hasTabData(tab: ImagingTab): boolean {
    switch (tab) {
      case "cxr":
        return !!availableImaging["cxr_portable"];
      case "ecg":
        return !!availableImaging["ecg_12lead"];
      case "echo":
      case "lung_pocus":
      case "ivc": {
        const pocusKey = getPocusViewKey(tab);
        return pocusKey ? !!availablePOCUS[pocusKey] : false;
      }
      default:
        return false;
    }
  }

  // ── Order handler ──────────────────────────────────────────

  function handleOrder(tab: ImagingTab) {
    if (isTabOrdered(tab)) return;

    const tabDef = TABS.find((t) => t.key === tab)!;

    if (tabDef.turnaround === "immediate") {
      // POCUS tabs: immediate result, advance 3 game-minutes
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: `${tabDef.emoji} 你做了 POCUS — ${tabDef.label}`,
        sender: "player",
      });

      // Track player action
      const pocusKey = getPocusViewKey(tab);
      useProGameStore.setState((state) => ({
        playerActions: [
          ...state.playerActions,
          {
            action: `pocus:${pocusKey ?? tab}:${tabDef.label}`,
            gameTime: clock.currentTime,
            category: "pocus",
          },
        ],
      }));

      // Advance 3 game-minutes for POCUS scan
      actionAdvance(3);

      setOrderedTabs((prev) => new Set(prev).add(tab));
      setReadyTabs((prev) => new Set(prev).add(tab));
    } else {
      // Deferred: CXR or ECG
      const turnaroundMinutes = tabDef.turnaround as number;
      const isECG = tab === "ecg";

      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: `${tabDef.emoji} 開了 ${tabDef.label}（結果約 ${turnaroundMinutes} 分鐘後回來）`,
        sender: "player",
      });

      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "nurse_message",
        content: isECG
          ? `${nurseName}：好，我打電話叫心電圖技師過來。`
          : `${nurseName}：好，我打電話給 X 光室。`,
        sender: "nurse",
      });

      useProGameStore.setState((state) => ({
        playerActions: [
          ...state.playerActions,
          {
            action: `imaging:${isECG ? "ecg_12lead" : "cxr_portable"}`,
            gameTime: clock.currentTime,
            category: "imaging",
          },
        ],
      }));

      // Schedule result event
      const resultEvent: PendingEvent = {
        id: `ev_${tab}_result_${Date.now()}`,
        triggerAt: clock.currentTime + turnaroundMinutes,
        type: "lab_result",
        data: {
          imagingKey: isECG ? "ecg_12lead" : "cxr_portable",
          imagingType: isECG ? "ecg" : "cxr",
          label: tabDef.label,
        },
        fired: false,
        priority: 1,
      };
      addPendingEvent(resultEvent);

      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: `⏳ ${tabDef.label} 已排程 — 結果將在 ${turnaroundMinutes} 分鐘內回來`,
        sender: "system",
      });

      setOrderedTabs((prev) => new Set(prev).add(tab));
      setPendingTabs((prev) => new Set(prev).add(tab));

      // Simulate result arriving after short delay (UX)
      setTimeout(() => {
        addTimelineEntry({
          gameTime: clock.currentTime + turnaroundMinutes,
          type: "lab_result",
          content: `${tabDef.emoji} ${tabDef.label} 結果已回`,
          sender: "system",
          isImportant: true,
        });
        setPendingTabs((prev) => {
          const next = new Set(prev);
          next.delete(tab);
          return next;
        });
        setReadyTabs((prev) => new Set(prev).add(tab));
      }, 1500);
    }
  }

  // ── Tab badge ──────────────────────────────────────────────

  function tabBadge(tab: ImagingTab): React.ReactNode {
    if (isTabReady(tab)) {
      return (
        <span className="ml-1.5 w-2 h-2 rounded-full bg-teal-400 inline-block" />
      );
    }
    if (isTabPending(tab)) {
      return (
        <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
      );
    }
    return null;
  }

  // ── Severity-based echo clip selection ─────────────────────
  // Phase 1 (surgical_bleeding):
  //   severity < 40 → normal cardiac (surgical_bleeding clips)
  //   severity >= 40 → mild pericardial effusion (use tamponade clips as "early sign")
  // Phase 2 (tamponade) → full tamponade clips (RV collapse, D-shape when available)

  function getEffectiveEchoPathology(tab: ImagingTab): string {
    // Only apply severity-based override for cardiac echo and IVC
    if (tab !== "echo" && tab !== "ivc") return pathology;

    const severity = patient?.severity ?? 0;

    // Phase 1: surgical_bleeding with rising severity → show early effusion
    if (pathology === "surgical_bleeding" && severity >= 40) {
      return "tamponade"; // use tamponade clips (pericardial effusion) as "early sign"
    }

    return pathology;
  }

  // ── Render video clips ─────────────────────────────────────

  function renderClips(tab: ImagingTab) {
    const clipsKey = getClipsKey(tab);
    if (!clipsKey) return null;
    const effectivePathology = getEffectiveEchoPathology(tab);
    const clips = ECHO_CLIPS[effectivePathology]?.[clipsKey] ?? [];
    if (clips.length === 0) return null;

    return (
      <div className="space-y-2 mb-3">
        {clips.map((clip, ci) => (
          <div key={ci} className="rounded-lg overflow-hidden border border-teal-900/30">
            <video
              src={clip.src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
            />
            <p className="text-teal-400/70 text-xs px-2 py-1 bg-black/40">
              {clip.label}
            </p>
          </div>
        ))}
        <p className="text-teal-600/40 text-[10px]">
          LITFL ECG Library / Wikimedia Commons, CC-BY-NC-SA 4.0
        </p>
      </div>
    );
  }

  // ── Render POCUS finding (echo / lung / ivc) ──────────────

  function renderPocusFinding(tab: ImagingTab) {
    const pocusKey = getPocusViewKey(tab);
    if (!pocusKey) return null;

    const view: POCUSView | undefined = availablePOCUS[pocusKey];
    if (!view) {
      return (
        <p className="text-teal-500/40 text-sm italic text-center py-4">
          此項檢查在本情境中不可用
        </p>
      );
    }

    const clipsKey = getClipsKey(tab);
    const effectivePathology = getEffectiveEchoPathology(tab);
    const clips = clipsKey ? (ECHO_CLIPS[effectivePathology]?.[clipsKey] ?? []) : [];
    const hasClips = clips.length > 0;

    // Severity-based finding description for Phase 1 early effusion
    const isEarlyEffusion = pathology === "surgical_bleeding" && effectivePathology !== pathology;

    return (
      <div className="space-y-3">
        {/* Video clips — primary display */}
        {renderClips(tab)}

        {/* Early effusion annotation */}
        {isEarlyEffusion && hasClips && (
          <div className="rounded-lg border border-amber-700/30 bg-amber-900/10 px-3 py-2">
            <p className="text-amber-400/80 text-xs">
              {tab === "ivc"
                ? "IVC 看起來比預期飽滿⋯⋯跟出血的低血容量不太一致？"
                : "咦？似乎有一些 pericardial effusion⋯⋯出血的病人怎麼會有積液？"}
            </p>
          </div>
        )}

        {/* If no video clips, show a brief one-liner (not detailed finding) */}
        {!hasClips && (
          <div className="text-center py-6">
            <p className="text-teal-400/60 text-sm">
              超音波影像無明顯異常
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Render CXR ─────────────────────────────────────────────

  function renderCXR() {
    const text = availableImaging["cxr_portable"];
    if (!text) {
      return (
        <p className="text-teal-500/40 text-sm italic text-center py-4">
          此項檢查在本情境中不可用
        </p>
      );
    }

    // Build CXR canvas data
    const bgState = getLastBioGearsState();
    const firedEventIds = useProGameStore.getState().firedEvents.map((e) => e.id);
    const placedOrderIds = useProGameStore.getState().placedOrders.map((o) => o.id);
    const cxrInput = buildCXRInput({
      bgState,
      scenarioPathology: currentPathology || scenario?.pathology,
      firedEventIds,
      placedOrderIds,
      isPostop: true,
      hemorrhageActive: undefined,
      bloodVolumeLossFraction: undefined,
    });
    const cxrSelection = selectCXR(cxrInput);

    // Check for real reference image
    const realImage = CXR_REAL_IMAGES[pathology];

    return (
      <div className="space-y-3">
        {/* Real CXR image (preferred) */}
        {realImage ? (
          <div className="rounded-lg overflow-hidden border border-teal-900/30">
            <Image
              src={realImage.src}
              alt={realImage.alt}
              width={400}
              height={400}
              className="w-full h-auto"
              style={{ filter: "brightness(1.1)" }}
            />
            <p className="text-teal-600/50 text-[10px] px-2 py-1 bg-black/40">
              {realImage.attribution}
            </p>
          </div>
        ) : (
          /* Canvas fallback if no real photo */
          <div className="rounded-lg overflow-hidden border border-teal-900/30">
            <CxrCanvas
              cxrType={cxrSelection.type}
              severity={cxrSelection.severity}
              affectedSide={cxrSelection.affectedSide}
              isIntubated={cxrInput.isIntubated}
              isPostop={cxrInput.isPostop}
              showAnnotations
              animated
            />
          </div>
        )}
      </div>
    );
  }

  // ── Render ECG ─────────────────────────────────────────────

  function renderECG() {
    const scenarioText = availableImaging["ecg_12lead"];
    if (!scenarioText) {
      return (
        <p className="text-teal-500/40 text-sm italic text-center py-4">
          此項檢查在本情境中不可用
        </p>
      );
    }

    const bgState = getLastBioGearsState();
    const morphology = generateECGMorphology(bgState, {
      pathology: currentPathology || scenario?.pathology,
      tamponade: currentPathology === "cardiac_tamponade" || currentPathology === "tamponade",
    });
    const autoInterp = generateInterpretation(morphology);

    return (
      <div className="space-y-3">
        {/* ECG Canvas */}
        <div className="rounded-lg overflow-hidden border border-teal-900/30">
          <EcgCanvas
            morphology={morphology}
            width={672}
            height={504}
            showGrid
            showLabels
            interpretation={autoInterp}
          />
        </div>

        {/* Auto interpretation — collapsed by default */}
        <div>
          <button
            onClick={() => setShowEcgAutoInterp(!showEcgAutoInterp)}
            className="text-xs text-teal-400/70 hover:text-teal-300 transition-colors flex items-center gap-1"
          >
            <span className={`transition-transform ${showEcgAutoInterp ? "rotate-90" : ""}`}>&#9654;</span>
            顯示機器判讀
          </button>
          {showEcgAutoInterp && (
            <div className="mt-2 rounded-lg border border-teal-900/30 px-4 py-3" style={{ backgroundColor: "#001e2e" }}>
              <p className="text-xs text-teal-500/60 uppercase tracking-widest mb-1">
                Auto Interpretation
              </p>
              <p className="text-teal-300/80 text-xs leading-relaxed">{autoInterp}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render active tab content ──────────────────────────────

  function renderTabContent() {
    const tabDef = TABS.find((t) => t.key === activeTab)!;
    const ordered = isTabOrdered(activeTab);
    const pending = isTabPending(activeTab);
    const ready = isTabReady(activeTab);
    const hasData = hasTabData(activeTab);

    // Not yet ordered — show order button
    if (!ordered) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="text-center">
            <span className="text-3xl">{tabDef.emoji}</span>
            <h3 className="text-teal-200 font-medium text-sm mt-2">{tabDef.label}</h3>
            <p className="text-teal-500/50 text-xs mt-1">{tabDef.turnaroundLabel}</p>
          </div>
          {hasData ? (
            <button
              onClick={() => handleOrder(activeTab)}
              className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors border border-teal-600"
            >
              {tabDef.turnaround === "immediate" ? "開始掃描" : `開立 ${tabDef.label}`}
            </button>
          ) : (
            <p className="text-teal-500/40 text-sm italic">
              此項檢查在本情境中不可用
            </p>
          )}
        </div>
      );
    }

    // Pending — waiting for result
    if (pending) {
      return (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="text-3xl animate-pulse">⏳</div>
          <p className="text-amber-400/70 text-sm">
            結果準備中...（約 {tabDef.turnaround} 分鐘）
          </p>
        </div>
      );
    }

    // Ready — show result
    if (ready) {
      const isPocusTab = activeTab === "echo" || activeTab === "lung_pocus" || activeTab === "ivc";

      return (
        <div>
          {activeTab === "cxr" && renderCXR()}
          {activeTab === "ecg" && renderECG()}
          {isPocusTab && renderPocusFinding(activeTab)}

          {/* Redo POCUS button — 重新掃描看最新狀態 */}
          {isPocusTab && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => handleRescan(activeTab)}
                className="text-xs text-teal-500/60 hover:text-teal-300 transition-colors border border-teal-800/30 hover:border-teal-600/50 rounded-lg px-4 py-2"
              >
                🔄 重新掃描（看最新狀態）
              </button>
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  // ── Rescan handler (POCUS only) ─────────────────────────────

  function handleRescan(tab: ImagingTab) {
    const tabDef = TABS.find((t) => t.key === tab)!;
    const pocusKey = getPocusViewKey(tab);

    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `${tabDef.emoji} 重新掃描 POCUS — ${tabDef.label}`,
      sender: "player",
    });

    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        {
          action: `pocus:${pocusKey ?? tab}:${tabDef.label}:rescan`,
          gameTime: clock.currentTime,
          category: "pocus",
        },
      ],
    }));

    // Advance 2 game-minutes (rescan is faster than first scan)
    actionAdvance(2);

    // Force re-render by toggling ready state (clips will re-evaluate with current severity)
    setReadyTabs((prev) => {
      const next = new Set(prev);
      next.delete(tab);
      return next;
    });
    // Re-add after a brief delay so React re-renders the clips
    setTimeout(() => {
      setReadyTabs((prev) => new Set(prev).add(tab));
    }, 100);
  }

  // ── Main render ────────────────────────────────────────────

  const orderedCount = orderedTabs.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.78)" }}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-teal-800/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "#001219" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-teal-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🩻</span>
            <div>
              <h2 className="text-white font-semibold text-lg leading-tight">
                影像檢查
              </h2>
              <p className="text-teal-400/60 text-xs">
                CXR / Echo / Lung POCUS / IVC / ECG
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-teal-500/50 hover:text-white transition-colors text-xl font-light"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Tabs — horizontally scrollable for mobile */}
        <div className="flex overflow-x-auto border-b border-teal-900/30 scrollbar-hide shrink-0" style={{ backgroundColor: "#001219" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition border-b-2 ${
                activeTab === tab.key
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-teal-600/60 hover:text-teal-400/80"
              }`}
            >
              <span className="text-base">{tab.emoji}</span>
              <span>{tab.label}</span>
              {tabBadge(tab.key)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-teal-900/30 px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-teal-400/40 text-xs">
            {orderedCount > 0
              ? `已開 ${orderedCount} 項影像`
              : "選擇 Tab 並開立影像檢查"}
          </span>
          {orderedCount > 0 && (
            <button
              onClick={closeModal}
              className="text-xs text-teal-400 hover:text-teal-200 transition-colors"
            >
              關閉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
