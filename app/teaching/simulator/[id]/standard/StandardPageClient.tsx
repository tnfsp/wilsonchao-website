"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { SimScenario, StandardOverlay } from "@/lib/simulator/types";
import { updatePatientState } from "@/lib/simulator/engine/patient-engine";
import { evaluateGuidance } from "@/lib/simulator/engine/guidance-engine";
import {
  computeStandardScore,
  type StandardScore,
} from "@/lib/simulator/engine/standard-score-engine";
import type { PlayerAction } from "@/lib/simulator/engine/score-engine";
import { standardOverlays } from "@/lib/simulator/scenarios/standard";
import type { StandardPresetOrder } from "@/lib/simulator/scenarios/standard/types";
import { getMedicationById } from "@/lib/simulator/data/medications";
import { getLabById } from "@/lib/simulator/data/labs";
import { getTransfusionById } from "@/lib/simulator/data/transfusions";
import type { GuidanceMessage as GuidanceBubbleMessage } from "@/components/simulator/standard/GuidanceBubble";
import type { OrderDefinition } from "@/lib/simulator/types";

// Standard components
import StandardGameLayout from "@/components/simulator/standard/StandardGameLayout";
import ColorVitalsPanel from "@/components/simulator/standard/ColorVitalsPanel";
import SimplifiedActionBar from "@/components/simulator/standard/SimplifiedActionBar";
import PresetOrderPanel from "@/components/simulator/standard/PresetOrderPanel";
import RescueCountdown from "@/components/simulator/standard/RescueCountdown";
import StandardDebriefPanel from "@/components/simulator/standard/StandardDebriefPanel";

// Re-use Pro components where appropriate
import ChatTimeline from "@/components/simulator/pro/ChatTimeline";
import SBARModal from "@/components/simulator/pro/SBARModal";
import DeathScreen from "@/components/simulator/pro/DeathScreen";
import LabOrderModal from "@/components/simulator/pro/LabOrderModal";
import { ConsultModal } from "@/components/simulator/pro/ConsultModal";
import { PauseThinkModal } from "@/components/simulator/pro/PauseThinkModal";

// ── Tags to hide from pre-game display ───────────────────────────────────────

const DIAGNOSTIC_TAGS = new Set([
  "hemorrhage", "tamponade", "beck-triad", "re-exploration",
  "re-sternotomy", "sepsis", "septic-shock", "wound-infection",
]);

// ── Order Definition Resolver ────────────────────────────────────────────────

function resolveOrderDefinition(
  definitionId: string,
  dose: string,
): OrderDefinition | null {
  // Exact match across all catalogs
  const med = getMedicationById(definitionId);
  if (med) return med;
  const lab = getLabById(definitionId);
  if (lab) return lab;
  const trans = getTransfusionById(definitionId);
  if (trans) return trans;

  // Fuzzy matching for transfusions (e.g., "prbc" + dose "2" → "prbc_2u")
  const doseInt = parseInt(dose, 10);
  if (doseInt > 0) {
    if (definitionId.startsWith("prbc")) {
      return getTransfusionById(`prbc_${doseInt}u`) ?? null;
    }
    if (definitionId.startsWith("ffp")) {
      return getTransfusionById(`ffp_${doseInt}u`) ?? null;
    }
    if (definitionId.startsWith("platelet")) {
      return getTransfusionById(`platelet_${doseInt}dose`) ?? null;
    }
    if (definitionId.startsWith("cryo")) {
      return getTransfusionById(`cryo_${doseInt}u`) ?? null;
    }
  }

  return null;
}

// ── Intro Screen ─────────────────────────────────────────────────────────────

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-gray-600 text-xs mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? "text-red-400" : "text-gray-200"}`}>{value || "\u2014"}</p>
    </div>
  );
}

function IntroScreen({ scenario }: { scenario: SimScenario }) {
  const { startGame } = useProGameStore();

  return (
    <div
      className="fixed inset-0 z-50 min-h-screen flex items-center justify-center p-6 overflow-y-auto"
      style={{ background: "#001219" }}
    >
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{"\uD83E\uDE7A"}</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-500/30">
              {"\u6559\u5B78\u6A21\u5F0F"}
            </span>
            <span className="text-gray-500 text-xs">{scenario.duration}</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            {scenario.hiddenTitle ?? scenario.title}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {scenario.hiddenSubtitle ?? scenario.subtitle}
          </p>
        </div>

        {/* Patient card */}
        <div
          className="rounded-2xl border border-white/10 p-5 mb-6"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
            {"\u75C5\u4EBA\u8CC7\u6599"}
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label={"\u5E8A\u4F4D"} value={scenario.patient.bed} />
            <InfoRow
              label={"\u75C5\u4EBA"}
              value={`${scenario.patient.age}\u6B72 ${scenario.patient.sex === "M" ? "\u7537" : "\u5973"} \u00B7 ${scenario.patient.weight}kg`}
            />
            <InfoRow label={"\u8853\u5F0F"} value={scenario.patient.surgery} />
            <InfoRow label={"\u8853\u5F8C"} value={scenario.patient.postOpDay} />
            <div className="col-span-2">
              <InfoRow label={"\u75C5\u53F2"} value={scenario.patient.history} />
            </div>
          </div>
        </div>

        {/* Standard mode info */}
        <div
          className="rounded-2xl border border-amber-500/20 p-5 mb-6"
          style={{ background: "rgba(245, 158, 11, 0.05)" }}
        >
          <h2 className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-3">
            {"\u6559\u5B78\u6A21\u5F0F\u7279\u8272"}
          </h2>
          <ul className="text-gray-300 text-sm space-y-2 leading-relaxed">
            <li>{"\uD83D\uDC69\u200D\u2695\uFE0F \u8B77\u7406\u5E2B\u6703\u4E3B\u52D5\u63D0\u793A\u4F60\u4E0B\u4E00\u6B65\u8A72\u505A\u4EC0\u9EBC"}</li>
            <li>{"\uD83D\uDFE2 Vitals \u984F\u8272\u6A19\u793A\uFF0C\u7DA0=\u6B63\u5E38 \u9EC3=\u6CE8\u610F \u7D05=\u5371\u6025"}</li>
            <li>{"\u23F3 \u6642\u9593\u901F\u5EA6\u8F03\u6162\uFF0C\u7D66\u4F60\u66F4\u591A\u601D\u8003\u6642\u9593"}</li>
            <li>{"\uD83D\uDEE1\uFE0F 60\u79D2\u6436\u6551\u7A97\u53E3\uFF0C\u4E0D\u6703\u7ACB\u5373\u6B7B\u4EA1"}</li>
          </ul>
        </div>

        {/* Tags */}
        {scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-7">
            {scenario.tags.filter((t) => !DIAGNOSTIC_TAGS.has(t)).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white/5 text-gray-500 px-2.5 py-1 rounded-full border border-white/8"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={startGame}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-bold text-base transition-all shadow-xl shadow-amber-900/50"
        >
          <span className="text-xl">{"\u25B6"}</span>
          {"\u958B\u59CB\u6559\u5B78\u6A21\u64EC"}
        </button>

        <p className="text-gray-600 text-xs text-center mt-3">
          {"\u904A\u6232\u4E2D\u53EF\u96A8\u6642\u66AB\u505C\uFF0C\u8B77\u7406\u5E2B\u6703\u5F15\u5C0E\u4F60\u5B8C\u6210\u6A21\u64EC"}
        </p>
      </div>
    </div>
  );
}

// ── Game tick (simplified: no BioGears, standard uses formula engine only) ──

function useStandardGameTick(
  overlay: StandardOverlay | null,
  pushGuidance: (msgs: GuidanceBubbleMessage[]) => void,
) {
  const phase = useProGameStore((s) => s.phase);
  const activeModal = useProGameStore((s) => s.activeModal);
  const advanceTime = useProGameStore((s) => s.advanceTime);
  const difficultyConfig = useProGameStore((s) => s.difficultyConfig);

  const lastGuidanceRef = useRef<Set<string>>(new Set());

  const tickPatient = useCallback((minutes = 1) => {
    const state = useProGameStore.getState();
    if (!state.patient || state.phase !== "playing") return;

    const newPatient = updatePatientState(state.patient, {
      minutesPassed: minutes,
      currentGameMinutes: state.clock.currentTime + minutes,
      ventilator: state.ventilator,
    });

    useProGameStore.setState({ patient: newPatient });

    // Guidance engine: evaluate all 7 triggers
    if (overlay && state.scenario) {
      const guidanceMsgs = evaluateGuidance(
        newPatient,
        state.playerActions,
        state.scenario,
        state.difficultyConfig,
        state.clock.currentTime,
      );

      if (guidanceMsgs.length > 0) {
        // Dedup: only push messages not seen recently (by trigger+relatedAction)
        const newMsgs: GuidanceBubbleMessage[] = [];
        for (const gm of guidanceMsgs) {
          const key = `${gm.trigger}:${gm.relatedAction ?? ""}`;
          if (!lastGuidanceRef.current.has(key)) {
            lastGuidanceRef.current.add(key);
            newMsgs.push({
              id: `guide-${gm.trigger}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              text: gm.message,
              severity: gm.severity,
            });
          }
        }
        if (newMsgs.length > 0) {
          pushGuidance(newMsgs);
        }
      }
    }

    // Death check with rescue window support (store.triggerDeath intercepts for Standard)
    const vitals = newPatient.vitals;
    const severity = newPatient.severity ?? 0;
    const threshold = difficultyConfig.rescueThreshold;

    if (
      severity >= 95 ||
      (threshold && vitals.sbp < threshold.sbp) ||
      vitals.map < 30 ||
      vitals.hr > 180 ||
      vitals.hr < 30
    ) {
      const scenarioId = state.scenario?.id ?? "";
      let cause: string;
      if (severity >= 95) {
        if (scenarioId.includes("septic")) {
          cause = "\u75C5\u4EBA\u56E0\u6557\u8840\u6027\u4F11\u514B\u60E1\u5316\uFF0C\u591A\u91CD\u5668\u5B98\u8870\u7AED\u3002";
        } else if (scenarioId.includes("tamponade")) {
          cause = "\u5FC3\u5305\u586B\u585E\u672A\u53CA\u6642\u8655\u7406\uFF0C\u5FC3\u8F38\u51FA\u91CF\u8870\u7AED\u3002";
        } else {
          cause = "\u75C5\u4EBA\u56E0\u6301\u7E8C\u51FA\u8840\u672A\u63A7\u5236\uFF0C\u8840\u6D41\u52D5\u529B\u5B78\u8870\u7AED\u3002";
        }
      } else {
        cause = vitals.map < 30
          ? "MAP \u904E\u4F4E\uFF0C\u5668\u5B98\u704C\u6D41\u4E0D\u8DB3\u5C0E\u81F4\u591A\u91CD\u5668\u5B98\u8870\u7AED\u3002"
          : "\u81F4\u6B7B\u6027\u5FC3\u5F8B\u4E0D\u6574\u3002";
      }
      useProGameStore.getState().triggerDeath(cause);
    }
  }, [difficultyConfig, overlay, pushGuidance]);

  // Expose for action handlers
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__tickPatient = tickPatient;
    return () => { delete (window as unknown as Record<string, unknown>).__tickPatient; };
  }, [tickPatient]);

  // Slower tick for Standard: 1 game-minute every 20 real-seconds (0.75x)
  useEffect(() => {
    if (phase !== "playing") return;
    if (activeModal) return;

    const interval = setInterval(() => {
      advanceTime(1);
      tickPatient(1);
    }, 20000);

    return () => clearInterval(interval);
  }, [phase, activeModal, advanceTime, tickPatient]);
}

// ── Preset Order Modal ──────────────────────────────────────────────────────

function PresetOrderModal({
  presets,
  executedIds,
  onExecute,
  onClose,
}: {
  presets: StandardPresetOrder[];
  executedIds: Set<string>;
  onExecute: (preset: StandardPresetOrder) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0a1929] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a1929]">
          <h2 className="text-white font-bold text-sm">
            {"\u8655\u7F6E\u9078\u55AE"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            {"\u2715"}
          </button>
        </div>
        <PresetOrderPanel
          presets={presets}
          onExecuteOrder={onExecute}
          executedOrderIds={executedIds}
        />
      </div>
    </div>
  );
}

// ── Game Screen ─────────────────────────────────────────────────────────────

function GameScreen({ overlay }: { overlay: StandardOverlay | null }) {
  const [guidanceMessages, setGuidanceMessages] = useState<GuidanceBubbleMessage[]>([]);
  const [executedPresetIds, setExecutedPresetIds] = useState<Set<string>>(new Set());
  const activeModal = useProGameStore((s) => s.activeModal);
  const closeModal = useProGameStore((s) => s.closeModal);

  const pushGuidance = useCallback((msgs: GuidanceBubbleMessage[]) => {
    setGuidanceMessages((prev) => [...prev, ...msgs]);
  }, []);

  useStandardGameTick(overlay, pushGuidance);

  const handleDismissGuidance = useCallback((id: string) => {
    setGuidanceMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handlePresetOrder = useCallback((preset: StandardPresetOrder) => {
    const state = useProGameStore.getState();

    if (!preset.isCorrect) {
      // Wrong order: push guidance feedback, don't execute
      if (preset.feedbackIfWrong) {
        setGuidanceMessages((prev) => [
          ...prev,
          {
            id: `preset-wrong-${preset.id}-${Date.now()}`,
            text: preset.feedbackIfWrong!,
            severity: "warning" as const,
          },
        ]);
      }
      // Track wrong action for scoring
      useProGameStore.setState({
        playerActions: [
          ...state.playerActions,
          {
            action: `preset:wrong:${preset.id}`,
            gameTime: state.clock.currentTime,
            category: "preset",
          },
        ],
      });
      return;
    }

    // Correct order: execute each sub-order
    for (const order of preset.orders) {
      const def = resolveOrderDefinition(order.definitionId, order.dose);

      if (def) {
        // Regular order through the store
        useProGameStore.getState().placeOrder({
          definition: def,
          dose: order.dose,
          frequency: order.frequency,
        });
      } else {
        // Special action (call_senior, pocus_cardiac, etc.) — track directly
        // Re-read state each iteration to avoid overwriting previous actions
        const fresh = useProGameStore.getState();
        useProGameStore.setState({
          playerActions: [
            ...fresh.playerActions,
            {
              action: order.definitionId,
              gameTime: fresh.clock.currentTime,
              category: "preset",
            },
          ],
        });
        fresh.addTimelineEntry({
          gameTime: fresh.clock.currentTime,
          type: "player_action",
          content: preset.label,
          sender: "player",
        });
      }
    }

    setExecutedPresetIds((prev) => new Set([...prev, preset.id]));
  }, []);

  const presets = (overlay?.presetOrders ?? []) as StandardPresetOrder[];

  return (
    <>
      <StandardGameLayout
        vitalsPanel={<ColorVitalsPanel />}
        chatTimeline={
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <ChatTimeline />
            </div>
          </div>
        }
        actionBar={<SimplifiedActionBar />}
        guidanceMessages={guidanceMessages}
        onDismissGuidance={handleDismissGuidance}
      />

      {/* Rescue countdown overlay — reads from store, self-manages visibility */}
      <RescueCountdown />

      {/* Preset order modal (replaces OrderModal for Standard mode) */}
      {activeModal === "order" && presets.length > 0 && (
        <PresetOrderModal
          presets={presets}
          executedIds={executedPresetIds}
          onExecute={handlePresetOrder}
          onClose={closeModal}
        />
      )}

      {/* Re-use Pro modals for lab, consult, pause */}
      <LabOrderModal />
      <ConsultModal />
      <PauseThinkModal />
    </>
  );
}

// ── Loading / Error screens ─────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#001219" }}
    >
      <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      <p className="text-gray-500 text-sm">{"\u8F09\u5165\u60C5\u5883\u4E2D..."}</p>
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div
      className="fixed inset-0 z-50 min-h-screen flex flex-col items-center justify-center gap-4 p-6"
      style={{ background: "#001219" }}
    >
      <div className="text-4xl">{"\u26A0\uFE0F"}</div>
      <p className="text-white font-medium">{"\u8F09\u5165\u5931\u6557"}</p>
      <p className="text-gray-500 text-sm text-center max-w-sm">{error}</p>
      <a
        href="/teaching/simulator"
        className="mt-2 text-amber-400 text-sm hover:underline"
      >
        {"\u2190 \u8FD4\u56DE\u60C5\u5883\u5217\u8868"}
      </a>
    </div>
  );
}

// ── Standard Debrief Wrapper ────────────────────────────────────────────────

function StandardDebriefWrapper({
  scenario,
  overlay,
}: {
  scenario: SimScenario;
  overlay: StandardOverlay | null;
}) {
  const placedOrders = useProGameStore((s) => s.placedOrders);

  // Convert PlacedOrder[] → PlayerAction[] for the score engine
  const playerActionsForScore: PlayerAction[] = placedOrders.map((o) => ({
    orderId: o.definition.id,
    orderName: o.definition.name,
    category: o.definition.category,
    placedAt: o.placedAt,
    dose: o.dose,
  }));

  const score: StandardScore = computeStandardScore(
    playerActionsForScore,
    scenario,
    overlay ?? undefined,
  );

  return (
    <StandardDebriefPanel
      score={score}
      scenario={scenario}
      onRestart={() => {
        useProGameStore.getState().resetGame();
        window.location.reload();
      }}
      onBackToList={() => {
        useProGameStore.getState().resetGame();
        window.location.href = "/teaching/simulator";
      }}
      onUpgradeToPro={() => {
        useProGameStore.getState().resetGame();
        window.location.href = window.location.pathname.replace("/standard", "/pro");
      }}
    />
  );
}

// ── Main Client Component ───────────────────────────────────────────────────

export default function StandardPageClient({ id }: { id: string }) {
  const {
    phase,
    isLoading,
    loadError,
    scenario,
    loadScenario,
    setDifficulty,
  } = useProGameStore();

  const loaded = useRef(false);

  // Load Standard overlay for this scenario
  const overlay: StandardOverlay | null = standardOverlays[id] ?? null;

  useEffect(() => {
    setDifficulty("standard");
  }, [setDifficulty]);

  useEffect(() => {
    if (!loaded.current && !scenario) {
      loaded.current = true;
      loadScenario(id);
    }
  }, [id, loadScenario, scenario]);

  // Hide site header
  useEffect(() => {
    document.body.classList.add("simulator-fullscreen");
    return () => document.body.classList.remove("simulator-fullscreen");
  }, []);

  if (isLoading) return <LoadingScreen />;
  if (loadError) return <ErrorScreen error={loadError} />;
  if (!scenario) return <LoadingScreen />;

  if (phase === "death") return <DeathScreen />;
  if (phase === "debrief") {
    return <StandardDebriefWrapper scenario={scenario} overlay={overlay} />;
  }

  if (phase === "sbar" || phase === "playing") {
    return (
      <>
        <GameScreen overlay={overlay} />
        <SBARModal />
      </>
    );
  }

  return <IntroScreen scenario={scenario} />;
}
