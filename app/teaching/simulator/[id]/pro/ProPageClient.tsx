"use client";

import { useEffect, useRef, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { SimScenario } from "@/lib/simulator/types";
import { updatePatientState } from "@/lib/simulator/engine/patient-engine";

// Pro components
import SBARModal from "@/components/simulator/pro/SBARModal";
import DebriefPanel from "@/components/simulator/pro/DebriefPanel";
import ProGameLayout from "@/components/simulator/pro/ProGameLayout";
import ProVitalsPanel from "@/components/simulator/pro/ProVitalsPanel";
import ChestTubePanel from "@/components/simulator/pro/ChestTubePanel";
import ChatTimeline from "@/components/simulator/pro/ChatTimeline";
import ActionBar from "@/components/simulator/pro/ActionBar";
import MessageInput from "@/components/simulator/pro/MessageInput";
// Modals
import OrderModal from "@/components/simulator/pro/OrderModal";
import LabOrderModal from "@/components/simulator/pro/LabOrderModal";
import { PEModal } from "@/components/simulator/pro/PEModal";
import { POCUSModal } from "@/components/simulator/pro/POCUSModal";
import { ImagingModal } from "@/components/simulator/pro/ImagingModal";
import { ConsultModal } from "@/components/simulator/pro/ConsultModal";
import { PauseThinkModal } from "@/components/simulator/pro/PauseThinkModal";

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFFICULTY_CONFIG = {
  beginner:     { label: "初階",       color: "bg-green-900/40 text-green-400  border-green-500/30" },
  intermediate: { label: "中階",       color: "bg-amber-900/40 text-amber-400  border-amber-500/30" },
  advanced:     { label: "高階",       color: "bg-red-900/40   text-red-400    border-red-500/30"   },
} as const;

function DifficultyBadge({ difficulty }: { difficulty: SimScenario["difficulty"] }) {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Not-started intro screen ─────────────────────────────────────────────────

function IntroScreen({ scenario }: { scenario: SimScenario }) {
  const { startGame } = useProGameStore();
  const diff = DIFFICULTY_CONFIG[scenario.difficulty];

  return (
    <div
      className="fixed inset-0 z-50 min-h-screen flex items-center justify-center p-6 overflow-y-auto"
      style={{ background: "#001219" }}
    >
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏥</div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <DifficultyBadge difficulty={scenario.difficulty} />
            <span className="text-gray-500 text-xs">{scenario.duration}</span>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">
            {scenario.title}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{scenario.subtitle}</p>
        </div>

        {/* Patient card */}
        <div
          className="rounded-2xl border border-white/10 p-5 mb-6"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
            病人資料
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="床位" value={scenario.patient.bed} />
            <InfoRow
              label="病人"
              value={`${scenario.patient.age}歲 ${scenario.patient.sex === "M" ? "男" : "女"} · ${scenario.patient.weight}kg`}
            />
            <InfoRow label="術式" value={scenario.patient.surgery} />
            <InfoRow label="術後" value={scenario.patient.postOpDay} />
            <div className="col-span-2">
              <InfoRow label="病史" value={scenario.patient.history} />
            </div>
            {scenario.patient.allergies.length > 0 && (
              <div className="col-span-2">
                <InfoRow
                  label="過敏"
                  value={scenario.patient.allergies.join("、")}
                  highlight
                />
              </div>
            )}
          </div>
        </div>

        {/* Scenario context */}
        <div
          className="rounded-2xl border border-white/10 p-5 mb-6"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            情境說明
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            你是 ICU 的值班住院醫師，現在是凌晨{" "}
            <span className="text-teal-400 font-mono">
              {String(scenario.startHour).padStart(2, "0")}:00
            </span>
            。護理師{" "}
            <span className="text-white font-medium">
              {scenario.nurseProfile.name}
            </span>{" "}
            剛打電話給你。
          </p>
          <p className="text-gray-500 text-xs mt-3 leading-relaxed">
            評估病人、下 order、管理血流動力學，在適當時機交班給學長。
            最後進行 SBAR 交班報告並進入 Debrief 評分。
          </p>
        </div>

        {/* Tags */}
        {scenario.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-7">
            {scenario.tags.map((tag) => (
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
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-teal-700 hover:bg-teal-600 active:scale-[0.98] text-white font-bold text-base transition-all shadow-xl shadow-teal-900/50"
        >
          <span className="text-xl">▶</span>
          開始模擬
        </button>

        <p className="text-gray-600 text-xs text-center mt-3">
          遊戲中可隨時暫停，最終 SBAR 交班後進入 Debrief
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-gray-600 text-xs mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? "text-red-400" : "text-gray-200"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

// ─── Auto-tick: advance game time every 5 seconds by 1 minute ────────────────

function useGameTick() {
  const phase = useProGameStore((s) => s.phase);
  const activeModal = useProGameStore((s) => s.activeModal);
  const advanceTime = useProGameStore((s) => s.advanceTime);

  const tickPatient = useCallback(() => {
    const state = useProGameStore.getState();
    if (!state.patient || state.phase !== "playing") return;
    
    const newPatient = updatePatientState(state.patient, {
      minutesPassed: 1,
      currentGameMinutes: state.clock.currentTime + 1,
    });
    
    useProGameStore.setState({ patient: newPatient });
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    // Pause auto-tick when a modal is open (player is thinking/acting)
    if (activeModal) return;

    const interval = setInterval(() => {
      advanceTime(1);
      tickPatient();
    }, 5000); // 1 game-minute every 5 real-seconds

    return () => clearInterval(interval);
  }, [phase, activeModal, advanceTime, tickPatient]);
}

// ─── Game layout wrapper ──────────────────────────────────────────────────────

function GameScreen() {
  useGameTick();
  return (
    <>
      <ProGameLayout
        leftPanel={
          <>
            <ProVitalsPanel />
            <ChestTubePanel />
          </>
        }
        rightPanel={
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <ChatTimeline />
            </div>
            <MessageInput />
          </div>
        }
        actionBar={<ActionBar />}
      />
      {/* Modals — rendered as overlays, controlled by store.activeModal */}
      <OrderModal />
      <LabOrderModal />
      <PEModal />
      <POCUSModal />
      <ImagingModal />
      <ConsultModal />
      <PauseThinkModal />
    </>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-50 min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: "#001219" }}
    >
      <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
      <p className="text-gray-500 text-sm">載入情境中...</p>
    </div>
  );
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ error }: { error: string }) {
  return (
    <div
      className="fixed inset-0 z-50 min-h-screen flex flex-col items-center justify-center gap-4 p-6"
      style={{ background: "#001219" }}
    >
      <div className="text-4xl">⚠️</div>
      <p className="text-white font-medium">載入失敗</p>
      <p className="text-gray-500 text-sm text-center max-w-sm">{error}</p>
      <a
        href="/teaching/simulator"
        className="mt-2 text-teal-400 text-sm hover:underline"
      >
        ← 返回情境列表
      </a>
    </div>
  );
}

// ─── Main ProPageClient ───────────────────────────────────────────────────────

interface ProPageClientProps {
  id: string;
  /**
   * Optional: pass initial scenario metadata for SEO / SSR hydration.
   * The store will still fetch full scenario data from API.
   */
  scenarioMeta?: Pick<SimScenario, "title" | "subtitle" | "difficulty" | "duration" | "tags">;
}

export default function ProPageClient({ id }: ProPageClientProps) {
  const {
    phase,
    isLoading,
    loadError,
    scenario,
    loadScenario,
  } = useProGameStore();

  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current && !scenario) {
      loaded.current = true;
      loadScenario(id);
    }
  }, [id, loadScenario, scenario]);

  // ── Loading ──
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ── Error ──
  if (loadError) {
    return <ErrorScreen error={loadError} />;
  }

  // ── Not yet loaded ──
  if (!scenario) {
    return <LoadingScreen />;
  }

  // ── Phase routing ──
  if (phase === "debrief") {
    return <DebriefPanel />;
  }

  if (phase === "sbar") {
    // sbar phase: show game layout + SBAR modal overlay
    return (
      <>
        <GameScreen />
        <SBARModal />
      </>
    );
  }

  if (phase === "playing") {
    return <GameScreen />;
  }

  // ── not_started ──
  return <IntroScreen scenario={scenario} />;
}
