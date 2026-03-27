"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { RhythmType, TimelineEntry } from "@/lib/simulator/types";
import {
  dispatchCardiacArrest,
  dispatchStartCpr,
  dispatchStopCpr,
} from "@/lib/simulator/engine/biogears-engine";
import {
  createWaveformState,
  generateSamples,
  getDisplayBuffer,
  SAMPLE_RATE,
  BUFFER_SIZE,
  DISPLAY_SECONDS,
  type WaveformState,
  type WaveformVitals,
} from "@/lib/simulator/engine/waveform-synth";

// ─── Types ──────────────────────────────────────────────────────────────────

type ACLSPhase =
  | "arrest_detected"
  | "cpr_active"
  | "rhythm_check"
  | "rosc"
  | "re_arrest"
  | "death";

interface ACLSTimelineEvent {
  id: number;
  timestamp: number; // seconds since arrest start
  text: string;
  type: "cpr" | "shock" | "drug" | "check" | "rosc" | "system" | "error" | "re_arrest" | "rhythm_change" | "warning";
}

interface ReversibleCause {
  id: string;
  label: string;
  category: "H" | "T";
  checked: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ARREST_RHYTHMS: RhythmType[] = ["vf", "vt_pulseless", "pea", "asystole"];

const SHOCKABLE_RHYTHMS: RhythmType[] = ["vf", "vt_pulseless"];

// ACLS time is compressed 4:1 for gameplay (30s real = 2min ACLS).
// Real AHA durations in parentheses; game durations are 1/4 of real.
const CPR_CYCLE_SECONDS = 30; // 2 minutes per AHA → 30s game time

const MAX_ARREST_SECONDS = 5 * 60; // 20 minutes per AHA → 5 min game time

const WARNING_ARREST_SECONDS = 225; // 15 minutes per AHA → 225s (3:45) game time

const EPI_MIN_INTERVAL_SECONDS = 45; // 3 minutes per AHA 2020 → 45s game time

const AMIODARONE_MAX_DOSES = 2; // 300mg first, 150mg second

const RHYTHM_DISPLAY: Record<
  string,
  { label: string; shockable: boolean; color: string }
> = {
  pea: {
    label: "Pulseless Electrical Activity",
    shockable: false,
    color: "text-amber-400",
  },
  vf: {
    label: "Ventricular Fibrillation",
    shockable: true,
    color: "text-red-400",
  },
  vt_pulseless: {
    label: "Pulseless Ventricular Tachycardia",
    shockable: true,
    color: "text-red-400",
  },
  asystole: {
    label: "Asystole",
    shockable: false,
    color: "text-zinc-400",
  },
  nsr: {
    label: "Sinus Rhythm",
    shockable: false,
    color: "text-green-400",
  },
  sinus_tach: {
    label: "Sinus Tachycardia",
    shockable: false,
    color: "text-green-400",
  },
};

const INITIAL_REVERSIBLE_CAUSES: ReversibleCause[] = [
  // H's
  { id: "hypovolemia", label: "Hypovolemia", category: "H", checked: false },
  { id: "hypoxia", label: "Hypoxia", category: "H", checked: false },
  {
    id: "hydrogen_ion",
    label: "Hydrogen ion (Acidosis)",
    category: "H",
    checked: false,
  },
  {
    id: "hypo_hyperkalemia",
    label: "Hypo/Hyperkalemia",
    category: "H",
    checked: false,
  },
  { id: "hypothermia", label: "Hypothermia", category: "H", checked: false },
  // T's
  {
    id: "tension_pneumothorax",
    label: "Tension Pneumothorax",
    category: "T",
    checked: false,
  },
  { id: "tamponade", label: "Tamponade", category: "T", checked: false },
  { id: "toxins", label: "Toxins", category: "T", checked: false },
  {
    id: "thrombosis_pe",
    label: "Thrombosis (PE)",
    category: "T",
    checked: false,
  },
  {
    id: "thrombosis_coronary",
    label: "Thrombosis (Coronary)",
    category: "T",
    checked: false,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function isShockable(rhythm: RhythmType): boolean {
  return SHOCKABLE_RHYTHMS.includes(rhythm);
}

// ─── ACLS Mini Waveform Renderer ────────────────────────────────────────────

interface ACLSTraceConfig {
  label: string;
  color: string;
  heightRatio: number;
  yMin: number;
  yMax: number;
  getBuffer: (state: WaveformState) => Float32Array;
}

const ACLS_TRACES: ACLSTraceConfig[] = [
  {
    label: "II",
    color: "#22c55e",
    heightRatio: 0.50,
    yMin: -0.1,
    yMax: 1.1,
    getBuffer: (s) => s.ecg,
  },
  {
    label: "ART",
    color: "#ef4444",
    heightRatio: 0.50,
    yMin: 0.15,
    yMax: 1.05,
    getBuffer: (s) => s.arterial,
  },
];

function drawACLSWaveforms(
  canvas: HTMLCanvasElement,
  wfState: WaveformState,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  ctx.fillStyle = "#000d14";
  ctx.fillRect(0, 0, W, H);

  // Dim grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1 * dpr;
  for (let s = 1; s < DISPLAY_SECONDS; s++) {
    const x = (s / DISPLAY_SECONDS) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  const cursorX = ((wfState.writeIndex % BUFFER_SIZE) / BUFFER_SIZE) * W;

  let yOffset = 0;
  for (const trace of ACLS_TRACES) {
    const traceH = H * trace.heightRatio;
    const y0 = yOffset;
    const y1 = yOffset + traceH;

    // Separator
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.moveTo(0, y1);
    ctx.lineTo(W, y1);
    ctx.stroke();

    const buffer = getDisplayBuffer(trace.getBuffer(wfState), wfState.writeIndex);

    ctx.strokeStyle = trace.color;
    ctx.lineWidth = 1.5 * dpr;
    ctx.lineJoin = "round";
    ctx.beginPath();

    for (let i = 0; i < BUFFER_SIZE; i++) {
      const x = (i / BUFFER_SIZE) * W;
      const distFromCursor = Math.abs(x - cursorX);
      if (distFromCursor < W * 0.02) continue;

      const val = buffer[i];
      const normalized = (val - trace.yMin) / (trace.yMax - trace.yMin);
      const y = y1 - normalized * traceH;

      if (i === 0 || distFromCursor < W * 0.025) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Label
    ctx.font = `${10 * dpr}px ui-monospace, monospace`;
    ctx.fillStyle = trace.color;
    ctx.globalAlpha = 0.6;
    ctx.fillText(trace.label, 4 * dpr, y0 + 13 * dpr);
    ctx.globalAlpha = 1;

    yOffset = y1;
  }

  // Sweep cursor
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(cursorX, 0);
  ctx.lineTo(cursorX, H);
  ctx.stroke();
}

/** Maps ACLSModal rhythm types to waveform-synth rhythm types */
function mapRhythmToSynth(rhythm: RhythmType): WaveformVitals["rhythm"] {
  switch (rhythm) {
    case "vf": return "vfib";
    case "vt_pulseless": return "vtach";
    case "asystole": return "asystole";
    case "pea": return "sinus"; // PEA = electrical activity present (QRS visible) but no pulse
    case "nsr":
    case "sinus_tach":
    default: return "sinus";
  }
}

/** Builds waveform vitals based on ACLS state (rhythm, CPR status, arrest/ROSC) */
function getACLSWaveformVitals(
  rhythm: RhythmType,
  cprActive: boolean,
  isRosc: boolean,
): WaveformVitals {
  if (isRosc) {
    // ROSC: normal sinus rhythm with real arterial pulsations
    return { hr: 88, sbp: 95, dbp: 55, spo2: 94, rr: 14, etco2: 32, rhythm: "sinus" };
  }

  const synthRhythm = mapRhythmToSynth(rhythm);

  if (cprActive) {
    // CPR active: ECG shows underlying rhythm; A-line shows compression artifacts
    // Compressions at ~110/min → small A-line pulses (~30-40 mmHg)
    const cprHr = 110; // compression rate
    return {
      hr: synthRhythm === "asystole" ? cprHr : (synthRhythm === "vfib" ? 0 : 72),
      sbp: 40, dbp: 15, // CPR-generated pressures — low amplitude
      spo2: 70, rr: 10, etco2: 15,
      rhythm: synthRhythm === "asystole" ? "sinus" : synthRhythm,
      // For asystole during CPR: we drive the A-line via HR=110 (compression rate)
      // but ECG stays flat (overridden below)
    };
  }

  // No CPR, arrest: flatline A-line, ECG shows underlying rhythm
  switch (synthRhythm) {
    case "asystole":
      return { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, etco2: 0, rhythm: "asystole" };
    case "vfib":
      return { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, etco2: 0, rhythm: "vfib" };
    case "vtach":
      return { hr: 180, sbp: 0, dbp: 0, spo2: 0, rr: 0, etco2: 0, rhythm: "vtach" };
    case "sinus": // PEA
      return { hr: 72, sbp: 0, dbp: 0, spo2: 0, rr: 0, etco2: 0, rhythm: "sinus" };
    default:
      return { hr: 0, sbp: 0, dbp: 0, spo2: 0, rr: 0, etco2: 0, rhythm: "asystole" };
  }
}

/**
 * Special generate for ACLS: handles asystole-during-CPR case where
 * ECG must stay flat but A-line must show compression artifacts.
 */
function generateACLSSamples(
  state: WaveformState,
  rhythm: RhythmType,
  cprActive: boolean,
  isRosc: boolean,
  count: number,
): void {
  const vitals = getACLSWaveformVitals(rhythm, cprActive, isRosc);

  if (cprActive && (rhythm === "asystole")) {
    // Special case: asystole + CPR
    // Generate A-line with compression artifacts (use "sinus" at 110 bpm for A-line)
    // But ECG must be flat (asystole)
    const artVitals: WaveformVitals = {
      hr: 110, sbp: 40, dbp: 15, spo2: 70, rr: 10, etco2: 15, rhythm: "sinus",
    };
    generateSamples(state, artVitals, count);
    // Now overwrite ECG buffer with flatline
    for (let i = 0; i < count; i++) {
      const idx = (state.writeIndex - count + i + BUFFER_SIZE) % BUFFER_SIZE;
      state.ecg[idx] = 0.15; // asystole baseline
    }
  } else if (cprActive && rhythm === "pea") {
    // PEA during CPR: ECG shows QRS complexes (sinus-like), A-line shows CPR artifacts
    generateSamples(state, vitals, count);
  } else {
    generateSamples(state, vitals, count);
  }
}

/** Inline ACLS waveform canvas component */
function ACLSWaveformCanvas({
  rhythm,
  cprActive,
  isRosc,
}: {
  rhythm: RhythmType;
  cprActive: boolean;
  isRosc: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wfStateRef = useRef<WaveformState>(createWaveformState());
  const animRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  // Store latest props in refs so animation loop always reads current values
  const rhythmRef = useRef(rhythm);
  const cprRef = useRef(cprActive);
  const roscRef = useRef(isRosc);
  useEffect(() => { rhythmRef.current = rhythm; }, [rhythm]);
  useEffect(() => { cprRef.current = cprActive; }, [cprActive]);
  useEffect(() => { roscRef.current = isRosc; }, [isRosc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      const samplesToGenerate = Math.round((elapsed / 1000) * SAMPLE_RATE);
      if (samplesToGenerate > 0) {
        generateACLSSamples(
          wfStateRef.current,
          rhythmRef.current,
          cprRef.current,
          roscRef.current,
          Math.min(samplesToGenerate, SAMPLE_RATE),
        );
        drawACLSWaveforms(canvas, wfStateRef.current);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full rounded-lg border border-white/8 bg-[#000d14] overflow-hidden" style={{ height: 120 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ACLSModal() {
  const patient = useProGameStore((s) => s.patient);
  const phase = useProGameStore((s) => s.phase);
  const clock = useProGameStore((s) => s.clock);
  const deliverShock = useProGameStore((s) => s.deliverShock);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const scenario = useProGameStore((s) => s.scenario);
  const firedEvents = useProGameStore((s) => s.firedEvents);
  const pendingEvents = useProGameStore((s) => s.pendingEvents);

  // ── Derived: is this a tamponade scenario? ──
  const isTamponade =
    scenario?.pathology === "cardiac_tamponade" ||
    scenario?.pathology === "tamponade" ||
    patient?.pathology === "cardiac_tamponade" ||
    patient?.pathology === "tamponade";

  // ── ACLS internal state ──
  const [aclsPhase, setAclsPhase] = useState<ACLSPhase>("arrest_detected");
  const [currentRhythm, setCurrentRhythm] = useState<RhythmType>("pea");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cprActive, setCprActive] = useState(false);
  const [cprCycleSeconds, setCprCycleSeconds] = useState(0);
  const [cprCycles, setCprCycles] = useState(0);
  const [compressionCount, setCompressionCount] = useState(0);
  const [shocksDelivered, setShocksDelivered] = useState(0);
  const [epinephrineGiven, setEpinephrineGiven] = useState(0);
  const [amiodarone300Given, setAmiodarone300Given] = useState(false);
  const [amiodarone150Given, setAmiodarone150Given] = useState(false);
  const [lastEpiTime, setLastEpiTime] = useState<number | null>(null);
  const [roscProbability, setRoscProbability] = useState(0);
  const [showReversibleCauses, setShowReversibleCauses] = useState(false);
  const [reversibleCauses, setReversibleCauses] = useState<ReversibleCause[]>(
    () => INITIAL_REVERSIBLE_CAUSES.map((c) => ({ ...c }))
  );
  const [aclsTimeline, setAclsTimeline] = useState<ACLSTimelineEvent[]>([]);
  const [showTerminationPrompt, setShowTerminationPrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [teachingMessage, setTeachingMessage] = useState<string | null>(null);
  const [confirmShock, setConfirmShock] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pulseCheckRevealed, setPulseCheckRevealed] = useState(false);

  // ── Re-arrest tracking ──
  const [arrestCount, setArrestCount] = useState(0); // total arrest episodes (for debrief scoring)
  const [hasAchievedRosc, setHasAchievedRosc] = useState(false); // whether ROSC was ever achieved
  const [show15MinWarning, setShow15MinWarning] = useState(false); // arrest-time-limit approaching warning
  const [previousRhythm, setPreviousRhythm] = useState<RhythmType | null>(null); // for rhythm transition detection

  // ── Additional ACLS drug tracking ──
  const [atropineGiven, setAtropineGiven] = useState(0); // max 3 doses (3mg total)
  const [calciumChlorideGiven, setCalciumChlorideGiven] = useState(0);
  const [sodiumBicarbGiven, setSodiumBicarbGiven] = useState(0);
  const [magnesiumGiven, setMagnesiumGiven] = useState(0);
  const [lidocaineGiven, setLidocaineGiven] = useState(0);

  // ── Phase 1 additional ACLS drugs ──
  const [vasopressinGiven, setVasopressinGiven] = useState(false); // max 1 dose (40U)
  const [adenosineGiven, setAdenosineGiven] = useState(0); // max 3 doses (6mg, 12mg, 12mg)
  const [d50wGiven, setD50wGiven] = useState(0); // max 2 doses
  const [insulinGiven, setInsulinGiven] = useState(0); // max 2 doses
  const [epiDripActive, setEpiDripActive] = useState(false); // toggle on/off, post-ROSC only

  // ── Phase 2 additional ACLS drugs ──
  const [dopamineActive, setDopamineActive] = useState(false); // toggle on/off, bradycardia/post-ROSC
  const [procainamideGiven, setProcainamideGiven] = useState(0); // max 1 (slow infusion)
  const [diltiazemGiven, setDiltiazemGiven] = useState(0); // max 2 (0.25 then 0.35 mg/kg)
  const [isuprelActive, setIsuprelActive] = useState(false); // toggle on/off, bradycardia/torsades

  // ── Senior arrival resternotomy tracking (tamponade only) ──
  const [seniorResternotomyCountdown, setSeniorResternotomyCountdown] = useState<number | null>(null); // seconds remaining until ROSC
  const [seniorArrivalHandled, setSeniorArrivalHandled] = useState(false); // prevent re-triggering
  const resternotomyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const eventIdRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roscDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Detect arrest rhythm from patient state ──
  const rhythm = patient?.vitals.rhythmStrip ?? "nsr";
  const isArrestRhythm = ARREST_RHYTHMS.includes(rhythm);
  const patientInArrest =
    phase === "playing" &&
    patient != null &&
    (patient.vitals.hr === 0 || isArrestRhythm);

  // ── Show/hide logic (initial arrest + re-arrest after ROSC) ──
  useEffect(() => {
    if (!patientInArrest) return;

    if (!isVisible) {
      // First arrest or re-arrest after modal was dismissed
      setIsVisible(true);
      setCurrentRhythm(rhythm);
      setCprCycleSeconds(0); // reset CPR cycle timer on new arrest

      const isReArrest = hasAchievedRosc;

      if (isReArrest) {
        // Re-arrest: preserve timeline & drug history, increment counter
        setAclsPhase("re_arrest");
        setArrestCount((prev) => prev + 1);
        addEvent("RE-ARREST DETECTED - Patient has lost pulse again!", "re_arrest");
        addTimelineEntry({
          gameTime: clock.currentTime,
          type: "system_event",
          content: `RE-ARREST - Cardiac arrest #${arrestCount + 2} detected. Resuming ACLS protocol.`,
          sender: "system",
          isImportant: true,
        });
      } else {
        // Initial arrest
        setAclsPhase("arrest_detected");
        setArrestCount(1);
        addEvent("Cardiac arrest detected!", "system");
        addTimelineEntry({
          gameTime: clock.currentTime,
          type: "system_event",
          content: "CARDIAC ARREST - ACLS protocol initiated",
          sender: "system",
          isImportant: true,
        });
      }

      // Notify BioGears of arrest
      dispatchCardiacArrest(true);
      setHasAchievedRosc(false);
    } else if (aclsPhase === "rosc") {
      // Re-arrest while still on ROSC screen (before auto-dismiss)
      if (roscDismissTimerRef.current) {
        clearTimeout(roscDismissTimerRef.current);
        roscDismissTimerRef.current = null;
      }

      setAclsPhase("re_arrest");
      setCurrentRhythm(rhythm);
      setCprCycleSeconds(0);
      setArrestCount((prev) => prev + 1);
      setHasAchievedRosc(false);

      dispatchCardiacArrest(true);

      addEvent("RE-ARREST DETECTED - Patient has lost pulse again!", "re_arrest");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: `RE-ARREST - Cardiac arrest #${arrestCount + 1} detected during post-ROSC care.`,
        sender: "system",
        isImportant: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientInArrest]);

  // ── Timer tick (1 second real-time) ──
  // Elapsed time is cumulative across re-arrests (never reset on ROSC)
  useEffect(() => {
    if (!isVisible) return;

    tickRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;

        // Approaching arrest time limit warning (cumulative)
        if (
          next >= WARNING_ARREST_SECONDS &&
          next < MAX_ARREST_SECONDS &&
          aclsPhase !== "rosc" &&
          !show15MinWarning
        ) {
          setShow15MinWarning(true);
          // Add warning to timeline (using functional state update to avoid stale closure)
          setAclsTimeline((prevTimeline) => [
            ...prevTimeline,
            {
              id: ++eventIdRef.current,
              timestamp: next,
              text: "WARNING: Arrest duration approaching limit. Consider reversible causes and termination criteria.",
              type: "warning" as const,
            },
          ]);
        }

        // 20-minute threshold (cumulative across re-arrests)
        if (next >= MAX_ARREST_SECONDS && aclsPhase !== "rosc") {
          setShowTerminationPrompt(true);
        }

        return next;
      });

      if (cprActive) {
        setCprCycleSeconds((prev) => {
          const next = prev + 1;
          // Auto-prompt for rhythm check when cycle completes
          if (next >= CPR_CYCLE_SECONDS) {
            return next; // let the UI show "Rhythm check ready"
          }
          return next;
        });

        // ~110 compressions per minute (AHA target 100-120)
        setCompressionCount((prev) => prev + 2); // roughly 2 per second tick
      }

      // Update ROSC probability continuously
      updateRoscProbability();
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, cprActive, aclsPhase]);

  // ── Auto-scroll timeline ──
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    }
  }, [aclsTimeline]);

  // ── Sync rhythm from patient vitals + detect rhythm transitions mid-CPR ──
  useEffect(() => {
    if (patient && isVisible && aclsPhase !== "rosc") {
      const newRhythm = patient.vitals.rhythmStrip;
      if (newRhythm !== currentRhythm) {
        const oldRhythmInfo = RHYTHM_DISPLAY[currentRhythm];
        const newRhythmInfo = RHYTHM_DISPLAY[newRhythm];
        const wasShockable = isShockable(currentRhythm);
        const nowShockable = isShockable(newRhythm);

        setPreviousRhythm(currentRhythm);
        setCurrentRhythm(newRhythm);

        // Only log transition if we're actively managing the arrest (not on initial detection)
        if (aclsPhase === "cpr_active" || aclsPhase === "rhythm_check" || aclsPhase === "re_arrest") {
          const oldLabel = oldRhythmInfo?.label ?? currentRhythm;
          const newLabel = newRhythmInfo?.label ?? newRhythm;
          const shockabilityChange =
            wasShockable !== nowShockable
              ? ` [${wasShockable ? "SHOCKABLE" : "NON-SHOCKABLE"} -> ${nowShockable ? "SHOCKABLE" : "NON-SHOCKABLE"}]`
              : "";

          addEvent(
            `RHYTHM CHANGE: ${oldLabel} -> ${newLabel}${shockabilityChange}`,
            "rhythm_change"
          );
          addTimelineEntry({
            gameTime: clock.currentTime,
            type: "system_event",
            content: `ACLS: Rhythm transition ${oldLabel} -> ${newLabel}${shockabilityChange}`,
            sender: "system",
            isImportant: wasShockable !== nowShockable,
          });

          // Teaching moment if shockability changed
          if (wasShockable && !nowShockable) {
            setTeachingMessage(
              `Rhythm changed to ${newLabel} (non-shockable). Do NOT defibrillate. Continue CPR and epinephrine.`
            );
            setTimeout(() => setTeachingMessage(null), 5000);
          } else if (!wasShockable && nowShockable) {
            setTeachingMessage(
              `Rhythm changed to ${newLabel} (shockable). Consider defibrillation at next rhythm check.`
            );
            setTimeout(() => setTeachingMessage(null), 5000);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.vitals.rhythmStrip]);

  // ── Senior arrival detection (tamponade resternotomy mechanic) ──
  // Derive senior status from store events
  const seniorHasArrived = firedEvents.some((e) => e.type === "senior_arrives");
  const seniorEnRoute = pendingEvents.some((e) => e.type === "senior_arrives" && !e.fired);
  // Compute ETA for senior en route (game-minutes remaining)
  const seniorEtaMinutes = seniorEnRoute
    ? Math.max(
        0,
        Math.ceil(
          (pendingEvents.find((e) => e.type === "senior_arrives" && !e.fired)?.triggerAt ?? clock.currentTime) -
            clock.currentTime
        )
      )
    : 0;

  useEffect(() => {
    if (!isVisible || !isTamponade || seniorArrivalHandled) return;
    if (aclsPhase === "rosc" || aclsPhase === "death") return;

    if (seniorHasArrived) {
      // Senior just arrived (or was already present) during active arrest
      setSeniorArrivalHandled(true);
      setSeniorResternotomyCountdown(30); // 2 min AHA → 30s game time (4:1 compression)

      // Add timeline events
      const id1 = ++eventIdRef.current;
      setAclsTimeline((prev) => [
        ...prev,
        {
          id: id1,
          timestamp: elapsedSeconds,
          text: "學長已到達 — 評估後決定 emergent resternotomy",
          type: "system" as const,
        },
      ]);
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: "學長到達，評估後決定 emergent resternotomy。正在準備中...",
        sender: "senior",
        isImportant: true,
      });

      // Start 30-second countdown (4:1 time compression)
      resternotomyTimerRef.current = setInterval(() => {
        setSeniorResternotomyCountdown((prev) => {
          if (prev === null || prev <= 1) {
            // Timer done — clear interval and trigger ROSC
            if (resternotomyTimerRef.current) {
              clearInterval(resternotomyTimerRef.current);
              resternotomyTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (resternotomyTimerRef.current) {
        clearInterval(resternotomyTimerRef.current);
        resternotomyTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, seniorHasArrived, isTamponade, seniorArrivalHandled, aclsPhase]);

  // ── Trigger ROSC when resternotomy countdown reaches 0 ──
  useEffect(() => {
    if (seniorResternotomyCountdown === 0 && seniorArrivalHandled && aclsPhase !== "rosc" && aclsPhase !== "death") {
      // Resternotomy complete — ROSC
      const id1 = ++eventIdRef.current;
      setAclsTimeline((prev) => [
        ...prev,
        {
          id: id1,
          timestamp: elapsedSeconds,
          text: "Resternotomy 完成 — tamponade relieved, ROSC achieved",
          type: "rosc" as const,
        },
      ]);

      // Use the same ROSC flow
      setAclsPhase("rosc");
      setCprActive(false);
      setHasAchievedRosc(true);
      dispatchStopCpr();
      dispatchCardiacArrest(false);

      const arrestInfo = arrestCount > 1 ? ` (arrest episode #${arrestCount})` : "";
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "system_event",
        content: `ROSC achieved - 學長完成 resternotomy，tamponade relieved. Total arrest time: ${formatTime(elapsedSeconds)}${arrestInfo}`,
        sender: "system",
        isImportant: true,
      });

      // Auto-dismiss after 3 seconds
      roscDismissTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        roscDismissTimerRef.current = null;
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seniorResternotomyCountdown, seniorArrivalHandled, aclsPhase]);

  // ── Event helpers ──
  const addEvent = useCallback(
    (text: string, type: ACLSTimelineEvent["type"]) => {
      const id = ++eventIdRef.current;
      setAclsTimeline((prev) => [
        ...prev,
        { id, timestamp: elapsedSeconds, text, type },
      ]);
    },
    [elapsedSeconds]
  );

  const updateRoscProbability = useCallback(() => {
    // Simplified ROSC probability calculation inspired by the archived engine
    let prob = 0;

    // Base from time-to-CPR
    if (cprActive || cprCycles > 0) {
      prob = 0.3; // CPR started
    }

    // Epinephrine bonus
    if (epinephrineGiven > 0) {
      prob += 0.1;
    }

    // Amiodarone bonus (for shockable)
    if (amiodarone300Given && isShockable(currentRhythm)) {
      prob += 0.05;
    }

    // Reversible causes treated
    const treatedCount = reversibleCauses.filter((c) => c.checked).length;
    prob += treatedCount * 0.03;

    // Shock bonus for shockable rhythms
    if (isShockable(currentRhythm) && shocksDelivered > 0) {
      prob += 0.15;
    }

    // Time penalty
    if (elapsedSeconds > 600) {
      prob *= 0.5;
    } else if (elapsedSeconds > 300) {
      prob *= 0.8;
    }

    // No CPR penalty
    if (!cprActive && cprCycles === 0) {
      prob *= 0.2;
    }

    setRoscProbability(Math.max(0.01, Math.min(0.95, prob)));
  }, [
    cprActive,
    cprCycles,
    epinephrineGiven,
    amiodarone300Given,
    currentRhythm,
    shocksDelivered,
    reversibleCauses,
    elapsedSeconds,
  ]);

  // ── Actions ──
  const handleStartCpr = () => {
    if (cprActive) return;
    setCprActive(true);
    setCprCycleSeconds(0);
    setAclsPhase("cpr_active");

    dispatchStartCpr();
    addEvent("CPR started - chest compressions initiated", "cpr");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "ACLS: CPR initiated",
      sender: "player",
      isImportant: true,
    });
  };

  const handlePauseForRhythmCheck = () => {
    if (!cprActive || cprCycleSeconds < CPR_CYCLE_SECONDS) return;
    setCprActive(false);
    setCprCycles((prev) => prev + 1);
    setCprCycleSeconds(0);
    setAclsPhase("rhythm_check");
    setPulseCheckRevealed(false); // Reset — player must click to check monitors

    dispatchStopCpr();
    addEvent(
      `Rhythm check - Cycle #${cprCycles + 1} complete. 停止壓胸，看 monitor。`,
      "check"
    );
  };

  const handleRevealPulseCheck = () => {
    setPulseCheckRevealed(true);

    // Determine A-line and ECG results based on current state
    const isRosc = !ARREST_RHYTHMS.includes(currentRhythm);
    const aLineResult = isRosc
      ? "A-line: Pulsatile waveform — 有脈搏！"
      : "A-line: Flatline — 無脈搏";

    let ecgResult: string;
    switch (currentRhythm) {
      case "pea":
        ecgResult = "ECG: PEA — 無脈搏電氣活動";
        break;
      case "asystole":
        ecgResult = "ECG: Asystole — 心臟停止";
        break;
      case "vf":
        ecgResult = "ECG: VF — 心室顫動";
        break;
      case "vt_pulseless":
        ecgResult = "ECG: Pulseless VT — 無脈搏心室頻脈";
        break;
      case "nsr":
      case "sinus_tach":
        ecgResult = "ECG: Sinus — 竇性心律";
        break;
      default:
        ecgResult = `ECG: ${RHYTHM_DISPLAY[currentRhythm]?.label ?? currentRhythm}`;
    }

    addEvent(`${aLineResult} | ${ecgResult}`, "check");

    // Also log shockability for decision support
    const rhythmInfo = RHYTHM_DISPLAY[currentRhythm];
    if (rhythmInfo) {
      const shockText = rhythmInfo.shockable ? "SHOCKABLE" : "NON-SHOCKABLE";
      addEvent(`Rhythm: ${rhythmInfo.label} - ${shockText}`, "check");
    }

    if (isRosc) {
      handleRosc("Spontaneous ROSC detected on rhythm check");
    }
  };

  const handleResumeCpr = () => {
    setCprActive(true);
    setCprCycleSeconds(0);
    setAclsPhase("cpr_active");

    dispatchStartCpr();
    addEvent("CPR resumed", "cpr");
  };

  const handleChargeDefibrillator = () => {
    if (!isShockable(currentRhythm)) {
      // Teaching moment
      const rhythmName =
        RHYTHM_DISPLAY[currentRhythm]?.label ?? currentRhythm;
      setTeachingMessage(
        `${rhythmName} 是不可電擊心律。電擊對 PEA/asystole 無效 — 需要的是 CPR + epinephrine + 找出可逆原因（H's and T's）。`
      );
      addEvent(
        `Defibrillation attempted on ${rhythmName} - NON-SHOCKABLE rhythm!`,
        "error"
      );
      setTimeout(() => setTeachingMessage(null), 4000);
      return;
    }

    // Two-step safety: first click charges, second discharges
    if (!confirmShock) {
      setConfirmShock(true);
      addEvent("Defibrillator CHARGING to 200J...", "system");
      return;
    }

    // Second click: discharge
    setConfirmShock(false);

    // Pause CPR for shock
    if (cprActive) {
      setCprActive(false);
      dispatchStopCpr();
    }

    const result = deliverShock();
    setShocksDelivered((prev) => prev + 1);

    addEvent(
      `Shock #${shocksDelivered + 1} delivered (200J biphasic)`,
      "shock"
    );

    // ~70% chance of ROSC for VF with proper management
    const roscChance = roscProbability + (isShockable(currentRhythm) ? 0.3 : 0);
    const roscRoll = Math.random();

    if (roscRoll < Math.min(0.95, roscChance)) {
      // ROSC achieved
      handleRosc("Defibrillation successful");
    } else {
      // Failed - rhythm may change
      addEvent("No ROSC after shock - resume CPR immediately", "system");
      setAclsPhase("cpr_active");
      setCprActive(true);
      setCprCycleSeconds(0);
      dispatchStartCpr();
    }
  };

  const handleCancelCharge = () => {
    setConfirmShock(false);
    addEvent("Defibrillator charge cancelled", "system");
  };

  const handleEpinephrine = () => {
    // Check epinephrine interval (AHA 2020: 3 min real → 45s game time at 4:1 compression)
    // Drug timing persists across re-arrests (never reset on ROSC)
    if (lastEpiTime !== null && elapsedSeconds - lastEpiTime < EPI_MIN_INTERVAL_SECONDS) {
      const remaining = EPI_MIN_INTERVAL_SECONDS - (elapsedSeconds - lastEpiTime);
      setTeachingMessage(
        `Epinephrine 間隔未到：還需等 ${remaining} 秒。AHA 2020 建議每 3-5 分鐘給藥，過於頻繁不會增加療效，反而增加 ROSC 後心肌缺血風險。`
      );
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }

    setEpinephrineGiven((prev) => prev + 1);
    setLastEpiTime(elapsedSeconds);
    addEvent(
      `Epinephrine 1mg IV - Dose #${epinephrineGiven + 1}`,
      "drug"
    );
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Epinephrine 1mg IV (dose #${epinephrineGiven + 1})`,
      sender: "player",
    });
    setTeachingMessage(
      "Epinephrine 1mg IV：α1 受體血管收縮 → 提升冠狀動脈灌注壓（CPP），這是 CPR 期間 ROSC 的關鍵。每 3-5 分鐘重複一次，注意 ROSC 後可能出現心搏過速。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleAmiodarone300 = () => {
    if (amiodarone300Given) {
      setTeachingMessage(
        "Amiodarone 300mg 已給過。若 VF/pVT 仍持續，可考慮第二劑 150mg。總量上限 450mg。"
      );
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    const nonStandard = !isShockable(currentRhythm);
    const noteTag = nonStandard ? " (non-standard indication)" : "";
    setAmiodarone300Given(true);
    addEvent(`Amiodarone 300mg IV - First dose (1 of 2 max)${noteTag}`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Amiodarone 300mg IV (dose 1/2)${noteTag}`,
      sender: "player",
    });
    setTeachingMessage(
      "Amiodarone 300mg IV：Class III 抗心律不整藥（同時具 I/II/IV 特性），延長不應期以穩定心肌電位。用於電擊難治 VF/pVT。注意可能造成低血壓。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleAmiodarone150 = () => {
    if (amiodarone150Given) {
      setTeachingMessage(
        `Amiodarone 已達最大劑量（300mg + 150mg = 450mg）。Amiodarone 半衰期極長（40-55 天），無需追加。`
      );
      setTimeout(() => setTeachingMessage(null), 4000);
      return;
    }
    if (!amiodarone300Given) {
      setTeachingMessage(
        "必須先給 Amiodarone 300mg（首劑），才能給 150mg 追加劑。AHA 建議第三次電擊後給首劑。"
      );
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    const nonStandard = !isShockable(currentRhythm);
    const noteTag = nonStandard ? " (non-standard indication)" : "";
    setAmiodarone150Given(true);
    addEvent(`Amiodarone 150mg IV - Second dose (MAX DOSE REACHED)${noteTag}`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Amiodarone 150mg IV (dose 2/2 - max reached)${noteTag}`,
      sender: "player",
    });
    setTeachingMessage(
      "Amiodarone 150mg（第二劑）：已達急救最大劑量 450mg。K⁺ 通道阻斷提升去顫成功率。ROSC 後考慮維持輸注 1 mg/min × 6hr。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleAtropine = () => {
    if (atropineGiven >= 3) {
      setTeachingMessage("Atropine 已達最大劑量 3mg（完全迷走神經阻斷）。超過此劑量無額外效益，考慮 dopamine 或經皮 pacing。");
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    setAtropineGiven((prev) => prev + 1);
    addEvent(`Atropine 1mg IV - Dose #${atropineGiven + 1} (max 3mg)`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Atropine 1mg IV (dose ${atropineGiven + 1}/3)`,
      sender: "player",
    });
    setTeachingMessage(
      "Atropine 1mg IV：M₂ 蕈毒鹼受體拮抗劑，解除迷走神經對竇房結/房室結的抑制 → 心率上升。注意：對 infranodal block（寬 QRS）無效。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleCalciumChloride = () => {
    setCalciumChlorideGiven((prev) => prev + 1);
    addEvent(`Calcium Chloride 1g IV (10mL of 10%) - Dose #${calciumChlorideGiven + 1}`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: CaCl₂ 1g IV (dose ${calciumChlorideGiven + 1})`,
      sender: "player",
    });
    setTeachingMessage(
      "CaCl₂ 1g IV：提升細胞外 Ca²⁺ → 穩定心肌細胞膜（升高閾值電位）。用於高血鉀、低血鈣、鈣離子阻斷劑中毒。注意：不降低血鉀，需搭配 insulin + D50W。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleSodiumBicarb = () => {
    setSodiumBicarbGiven((prev) => prev + 1);
    addEvent(`Sodium Bicarbonate 50mEq IV - Dose #${sodiumBicarbGiven + 1}`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: NaHCO₃ 50mEq IV (dose ${sodiumBicarbGiven + 1})`,
      sender: "player",
    });
    setTeachingMessage(
      "NaHCO₃ 50mEq IV：緩衝代謝性酸中毒（HCO₃⁻ + H⁺ → CO₂ + H₂O）。適應症：高血鉀、TCA 中毒（Na⁺ 載入解除 Na⁺ 通道阻斷）、嚴重酸血症。禁止與 epinephrine 或 CaCl₂ 同管線！"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleMagnesium = () => {
    setMagnesiumGiven((prev) => prev + 1);
    addEvent(`Magnesium 2g IV over 5min - Dose #${magnesiumGiven + 1}`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Magnesium 2g IV (dose ${magnesiumGiven + 1})`,
      sender: "player",
    });
    setTeachingMessage(
      "MgSO₄ 2g IV：生理性鈣離子拮抗劑，抑制 early afterdepolarization → Torsades de Pointes（TdP）的首選藥物。即使血鎂正常也有效。注意快速推注可致低血壓。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleLidocaine = () => {
    setLidocaineGiven((prev) => prev + 1);
    const nonStandard = !isShockable(currentRhythm);
    const noteTag = nonStandard ? " (non-standard indication)" : "";
    addEvent(`Lidocaine 100mg IV (1-1.5 mg/kg) - Dose #${lidocaineGiven + 1}${noteTag}`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Lidocaine 100mg IV (dose ${lidocaineGiven + 1})${noteTag}`,
      sender: "player",
    });
    setTeachingMessage(
      "Lidocaine 100mg IV：Class Ib 抗心律不整藥，選擇性阻斷缺血心肌的 Na⁺ 通道 → 提升 VF 閾值。可替代 amiodarone 用於電擊難治 VF/pVT。最大累積劑量 3 mg/kg。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleVasopressin = () => {
    if (vasopressinGiven) {
      setTeachingMessage("Vasopressin 僅限單次 40U。與 epinephrine 不同，它不重複給藥。後續劑量請使用 epinephrine。");
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    setVasopressinGiven(true);
    addEvent("Vasopressin 40U IV - Single dose (alternative to epinephrine)", "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "ACLS: Vasopressin 40U IV (single dose, epi alternative)",
      sender: "player",
    });
    setTeachingMessage(
      "Vasopressin 40U IV：V₁a 受體血管收縮，不依賴腎上腺素受體（酸中毒下仍有效）。可替代第一或第二劑 epinephrine。無 β 效應 → 不增加心肌氧耗。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleAdenosine = () => {
    // CRITICAL: Adenosine in asystole = fatal error (teaching moment)
    if (currentRhythm === "asystole") {
      addEvent("CRITICAL ERROR: Adenosine given during ASYSTOLE — contraindicated! Would worsen bradycardia.", "error");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: CRITICAL ERROR — Adenosine given during asystole (contraindicated)",
        sender: "player",
        isImportant: true,
      });
      setTeachingMessage(
        "致命錯誤：Adenosine 在 asystole 下絕對禁忌！A₁ 受體活化 → 房室結傳導完全阻斷 → 加重心臟停止。Adenosine 僅用於 SVT（AVNRT/AVRT）。"
      );
      setTimeout(() => setTeachingMessage(null), 8000);
      return;
    }
    // Adenosine in VF/VT/PEA = inappropriate (all are arrest rhythms)
    if (currentRhythm === "vf" || currentRhythm === "vt_pulseless" || currentRhythm === "pea") {
      const rhythmLabel = RHYTHM_DISPLAY[currentRhythm]?.label ?? currentRhythm;
      addEvent(`WARNING: Adenosine given during ${rhythmLabel} — inappropriate. Use amiodarone or lidocaine instead.`, "error");
      setTeachingMessage(
        `Adenosine 不適用於 ${rhythmLabel}。它只能阻斷房室結（A₁ 受體），對不經過房室結的 VF/VT/PEA 無效。應使用 amiodarone 或 lidocaine。`
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    if (adenosineGiven >= 3) {
      setTeachingMessage("Adenosine 已達最大劑量（6mg + 12mg + 12mg = 30mg）。半衰期 <10 秒，如仍無效表示非 AV nodal reentry。");
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    const doseNum = adenosineGiven + 1;
    const doseMg = doseNum === 1 ? 6 : 12;
    setAdenosineGiven((prev) => prev + 1);
    addEvent(`Adenosine ${doseMg}mg rapid IV push + flush - Dose #${doseNum}/3`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Adenosine ${doseMg}mg rapid IV push (dose ${doseNum}/3)`,
      sender: "player",
    });
    if (doseNum === 1) {
      setTeachingMessage(
        "Adenosine 6mg 快速 IV push + 20mL NS 沖管：活化 A₁ 受體 → 房室結短暫完全阻斷（6-12 秒），中斷經房室結的 reentry 迴路。預期短暫心搏停止屬正常。"
      );
    } else {
      setTeachingMessage(
        `Adenosine 12mg 快速 IV push + 沖管（第 ${doseNum}/3 劑）。半衰期 <10 秒，必須快推且從近端 IV 給藥。${doseNum === 3 ? " 已達最大劑量。" : ""}`
      );
    }
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleD50W = () => {
    if (d50wGiven >= 2) {
      setTeachingMessage("D50W 已給 2 劑（共 50g 葡萄糖）。再次給藥前需重新確認血糖，並警覺 rebound 低血糖（尤其 sulfonylurea 中毒）。");
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    setD50wGiven((prev) => prev + 1);
    addEvent(`D50W 50mL IV (25g glucose) - Dose #${d50wGiven + 1}/2`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: D50W 50mL IV (dose ${d50wGiven + 1}/2)`,
      sender: "player",
    });
    setTeachingMessage(
      "D50W 50mL（25g 葡萄糖）：直接補充血糖。低血糖是可逆原因之一（H's）。也是高血鉀治療的必要搭配 — insulin 會驅使 K⁺ 進入細胞，同時消耗葡萄糖。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleInsulin = () => {
    if (insulinGiven >= 2) {
      setTeachingMessage("Insulin 已給 2 劑。K⁺ 轉移效果持續 4-6 小時，需密切監測血鉀與血糖（每 15-30 分鐘）。考慮最終移除方式：透析。");
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    // Teaching: warn if D50W not given
    if (d50wGiven === 0) {
      setTeachingMessage(
        "警告：未給 D50W 就給 insulin → 嚴重低血糖風險！Insulin 活化 Na⁺/K⁺-ATPase 驅使 K⁺ 進入細胞，但同時消耗葡萄糖。必須先給或同時給 D50W。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
    } else {
      setTeachingMessage(
        "Insulin 10U IV：活化 Na⁺/K⁺-ATPase → K⁺ 進入細胞，15-30 分鐘內降低血鉀 0.5-1.0 mEq/L。高血鉀完整治療：CaCl₂（穩定膜） → NaHCO₃ + Insulin/D50W（降 K⁺）→ 透析（移除）。"
      );
      setTimeout(() => setTeachingMessage(null), 5000);
    }
    setInsulinGiven((prev) => prev + 1);
    const warningTag = d50wGiven === 0 ? " (WARNING: no D50W given — hypoglycemia risk!)" : "";
    addEvent(`Regular Insulin 10U IV - Dose #${insulinGiven + 1}/2 (hyperkalemia Tx)${warningTag}`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Insulin 10U IV (dose ${insulinGiven + 1}/2)${warningTag}`,
      sender: "player",
    });
  };

  const handleEpiDrip = () => {
    if (aclsPhase !== "rosc") {
      // Teaching: epi drip is post-ROSC only
      addEvent("ERROR: Epinephrine drip ordered during active CPR — use push-dose epinephrine instead!", "error");
      setTeachingMessage(
        "Epi drip（0.1-0.5 mcg/kg/min）僅用於 ROSC 後血流動力學支持。CPR 中需要的是 push-dose 1mg IV — 因為 drip 的低濃度在無灌流狀態下無法達到足夠冠狀動脈灌注壓。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    setEpiDripActive((prev) => !prev);
    if (!epiDripActive) {
      addEvent("Epinephrine drip STARTED (0.1-0.5 mcg/kg/min) - post-ROSC vasopressor", "drug");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: Epinephrine drip started (0.1-0.5 mcg/kg/min)",
        sender: "player",
      });
      setTeachingMessage(
        "Epi drip 開始：低劑量以 β1/β2 效應為主（↑心輸出、輕微血管擴張），高劑量 α1 主導（血管收縮）。滴定目標 MAP > 65 mmHg，監測心律不整與末梢灌流。"
      );
      setTimeout(() => setTeachingMessage(null), 5000);
    } else {
      addEvent("Epinephrine drip STOPPED", "drug");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: Epinephrine drip stopped",
        sender: "player",
      });
    }
  };

  const handleDopamine = () => {
    // Guard: only allowed post-ROSC (dopamine drip requires perfusion to reach receptors)
    if (aclsPhase !== "rosc") {
      addEvent("ERROR: Dopamine ordered during active cardiac arrest — not indicated!", "error");
      setTeachingMessage(
        "Dopamine 不用於心臟停止急救！它需持續輸注才有效（非 bolus），且在無灌流狀態下無法到達受體。CPR 中應使用 push-dose epinephrine 1mg IV。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    setDopamineActive((prev) => !prev);
    if (!dopamineActive) {
      addEvent("Dopamine drip STARTED (2-20 mcg/kg/min) - dose-dependent effects", "drug");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: Dopamine drip started (2-20 mcg/kg/min)",
        sender: "player",
      });
      setTeachingMessage(
        "Dopamine 2-20 mcg/kg/min：劑量依賴性 — 低劑量 D₁ 腎臟擴張、中劑量 β1 強心、高劑量 α1 升壓。Atropine 無效後的心搏過緩二線選擇。注意：比 norepinephrine 更易致心律不整（SOAP II trial）。"
      );
      setTimeout(() => setTeachingMessage(null), 5000);
    } else {
      addEvent("Dopamine drip STOPPED", "drug");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: Dopamine drip stopped",
        sender: "player",
      });
    }
  };

  const handleProcainamide = () => {
    // Guard: asystole — BLOCK
    if (currentRhythm === "asystole") {
      addEvent("ERROR: Procainamide given during ASYSTOLE — contraindicated!", "error");
      setTeachingMessage(
        "Procainamide 禁用於 asystole！它是 Na⁺ 通道阻斷劑（Class Ia），會進一步抑制已停止的心肌電活動。僅用於有脈搏的穩定 VT。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Guard: PEA — BLOCK
    if (currentRhythm === "pea") {
      addEvent("ERROR: Procainamide given during PEA — contraindicated!", "error");
      setTeachingMessage(
        "Procainamide 禁用於 PEA！PEA 的治療是 CPR + epinephrine + 找出可逆原因（H's and T's），不是抗心律不整藥。Procainamide 的負性肌力與低血壓效應會雪上加霜。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Guard: VF — WARNING
    if (currentRhythm === "vf") {
      addEvent("WARNING: Procainamide given during VF — not standard indication. Use amiodarone or defibrillation.", "warning");
      setTeachingMessage(
        "Procainamide 不適用於 VF！VF 首選電擊 + amiodarone/lidocaine。Procainamide 需緩慢輸注（20-50 mg/min），在急性 VF 中來不及發揮作用。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Guard: pulseless VT — WARNING
    if (currentRhythm === "vt_pulseless") {
      addEvent("WARNING: Procainamide given during pulseless VT — pulseless VT requires defibrillation!", "warning");
      setTeachingMessage(
        "無脈搏 VT 需要電擊！Procainamide 僅用於有脈搏的穩定單型 VT（慢速輸注 20-50 mg/min）。無脈搏 = 按 VF 流程處理：電擊 + CPR + epinephrine。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Max dose check
    if (procainamideGiven >= 1) {
      setTeachingMessage("Procainamide 已在輸注中（最大 17 mg/kg 或 1g）。持續監測 QRS 寬度 — 若 QRS 增寬 >50% 立即停止，否則有 VF 風險。");
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    setProcainamideGiven(1);
    addEvent("Procainamide 20-50 mg/min IV infusion started (max 17 mg/kg or 1g total)", "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "ACLS: Procainamide IV infusion started (20-50 mg/min, max 17 mg/kg)",
      sender: "player",
    });
    setTeachingMessage(
      "Procainamide IV 輸注：Class Ia — 阻斷 Na⁺ 通道減慢傳導 + 延長不應期。用於有脈搏的穩定單型 VT 或 WPW+AFib。停藥指標：心律不整終止、QRS 增寬 >50%、低血壓、達最大劑量。"
    );
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleDiltiazem = () => {
    // Guard: asystole — BLOCK
    if (currentRhythm === "asystole") {
      addEvent("ERROR: Diltiazem given during ASYSTOLE — contraindicated!", "error");
      setTeachingMessage(
        "Diltiazem 禁用於 asystole！它阻斷 L-type Ca²⁺ 通道 → 抑制房室結傳導與心肌收縮力，會加重已停止的心臟。鈣離子阻斷劑在心臟停止中無任何角色。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Guard: PEA — BLOCK
    if (currentRhythm === "pea") {
      addEvent("ERROR: Diltiazem given during PEA — contraindicated!", "error");
      setTeachingMessage(
        "Diltiazem 禁用於 PEA！Ca²⁺ 通道阻斷 → 負性肌力 + 血管擴張 → 血壓更低。PEA 的處理是 CPR + epinephrine + 可逆原因。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Guard: VF — BLOCK (critical)
    if (currentRhythm === "vf") {
      addEvent("CRITICAL ERROR: Diltiazem given during VF — calcium channel blockers can worsen arrest!", "error");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: CRITICAL ERROR — Diltiazem given during VF (can worsen arrest)",
        sender: "player",
        isImportant: true,
      });
      setTeachingMessage(
        "致命錯誤：鈣離子阻斷劑在 VF 中會惡化心臟停止！負性肌力 + 血管擴張 = 災難。VF 唯一正確處置：電擊 + CPR + epinephrine + amiodarone。"
      );
      setTimeout(() => setTeachingMessage(null), 8000);
      return;
    }
    // Guard: pulseless VT — BLOCK (critical teaching moment)
    if (currentRhythm === "vt_pulseless") {
      addEvent("CRITICAL ERROR: Diltiazem given during pulseless VT — potentially fatal if VT misdiagnosed as SVT!", "error");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: CRITICAL ERROR — Diltiazem in wide complex tachycardia (potentially fatal)",
        sender: "player",
        isImportant: true,
      });
      setTeachingMessage(
        "致命錯誤：Diltiazem 用於寬 QRS 心搏過速 = 經典 ACLS 致死錯誤！若 VT 被誤診為 SVT，Ca²⁺ 阻斷會導致血流動力學崩潰。無脈搏 VT 必須電擊。"
      );
      setTimeout(() => setTeachingMessage(null), 8000);
      return;
    }
    // Max dose check
    if (diltiazemGiven >= 2) {
      setTeachingMessage("Diltiazem 已達最大劑量（0.25 + 0.35 mg/kg）。若心率控制仍不佳，考慮持續輸注 5-15 mg/hr 或轉換為 amiodarone。");
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    const doseNum = diltiazemGiven + 1;
    const doseMgKg = doseNum === 1 ? "0.25" : "0.35";
    setDiltiazemGiven((prev) => prev + 1);
    addEvent(`Diltiazem ${doseMgKg} mg/kg IV - Dose #${doseNum}/2`, "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: `ACLS: Diltiazem ${doseMgKg} mg/kg IV (dose ${doseNum}/2)`,
      sender: "player",
    });
    if (doseNum === 1) {
      setTeachingMessage(
        "Diltiazem 0.25 mg/kg IV：Non-DHP 鈣離子阻斷劑，阻斷房室結 L-type Ca²⁺ 通道 → 減慢心室率。用於窄 QRS 心搏過速（AFib/flutter/SVT）。密切監測血壓 — 可致低血壓。"
      );
    } else {
      setTeachingMessage(
        "Diltiazem 0.35 mg/kg（第二劑）：已達最大 bolus 劑量。記住：絕不可在 15-30 分鐘內同時給 IV β-blocker — 疊加房室結阻斷 → 完全阻滯。"
      );
    }
    setTimeout(() => setTeachingMessage(null), 5000);
  };

  const handleIsuprel = () => {
    // Guard: VF — BLOCK
    if (currentRhythm === "vf") {
      addEvent("ERROR: Isoproterenol given during VF — contraindicated!", "error");
      setTeachingMessage(
        "Isoproterenol 禁用於 VF！純 β 激動劑 → 增加心肌自動性（automaticity）→ 維持甚至惡化 VF。VF 需要電擊 + amiodarone，不是增加心肌興奮性。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Guard: pulseless VT — BLOCK
    if (currentRhythm === "vt_pulseless") {
      addEvent("ERROR: Isoproterenol given during pulseless VT — not indicated!", "error");
      setTeachingMessage(
        "Isoproterenol 不適用於無脈搏 VT！β1 激動增加自動性會惡化 VT。無脈搏 VT = 按 VF 流程：電擊 + CPR + epinephrine + amiodarone。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Guard: active CPR arrest (not ROSC) — BLOCK
    if (cprActive && aclsPhase !== "rosc") {
      addEvent("ERROR: Isoproterenol ordered during active CPR arrest — not indicated!", "error");
      setTeachingMessage(
        "Isoproterenol 不用於 CPR 中！它是純 β 激動劑（無 α） → 血管擴張降低 SVR → 無法維持冠狀動脈灌注壓。CPR 中需要有 α 效應的 epinephrine。"
      );
      setTimeout(() => setTeachingMessage(null), 6000);
      return;
    }
    // Toggle infusion
    setIsuprelActive((prev) => !prev);
    if (!isuprelActive) {
      addEvent("Isoproterenol drip STARTED (2-10 mcg/min) - beta-agonist infusion", "drug");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: Isoproterenol drip started (2-10 mcg/min)",
        sender: "player",
      });
      setTeachingMessage(
        "Isoproterenol 2-10 mcg/min：純 β1+β2 激動劑，最強效的變時性藥物（chronotrope）。用於難治性心搏過緩或 TdP（加速心率抑制 pause-dependent 觸發）。注意：無 α → ↓SVR、↓DBP，且大幅增加心肌氧耗。"
      );
      setTimeout(() => setTeachingMessage(null), 5000);
    } else {
      addEvent("Isoproterenol drip STOPPED", "drug");
      addTimelineEntry({
        gameTime: clock.currentTime,
        type: "player_action",
        content: "ACLS: Isoproterenol drip stopped",
        sender: "player",
      });
    }
  };

  const handleRosc = (method: string) => {
    setAclsPhase("rosc");
    setCprActive(false);
    setHasAchievedRosc(true);
    dispatchStopCpr();
    dispatchCardiacArrest(false);

    const arrestInfo = arrestCount > 1
      ? ` (arrest episode #${arrestCount})`
      : "";
    addEvent(`ROSC ACHIEVED! (${method})${arrestInfo}`, "rosc");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "system_event",
      content: `ROSC achieved - ${method}. Total arrest time: ${formatTime(elapsedSeconds)}${arrestInfo}`,
      sender: "system",
      isImportant: true,
    });

    // Note: drug history (epi timing, amiodarone doses) is intentionally NOT reset
    // per AHA guidelines — drug tracking persists across re-arrests

    // Auto-dismiss after 3 seconds (cancelable if re-arrest occurs)
    roscDismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      roscDismissTimerRef.current = null;
    }, 3000);
  };

  const handleTerminate = () => {
    setAclsPhase("death");
    setCprActive(false);
    dispatchStopCpr();

    const reArrestNote = arrestCount > 1
      ? ` (${arrestCount} arrest episodes)`
      : "";
    addEvent(`Resuscitation efforts terminated.${reArrestNote}`, "system");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "system_event",
      content: `Resuscitation terminated after ${formatTime(elapsedSeconds)}${reArrestNote}`,
      sender: "system",
      isImportant: true,
    });

    // Trigger death in game store
    useProGameStore
      .getState()
      .triggerDeath(
        `Cardiac arrest - resuscitation unsuccessful after ${formatTime(elapsedSeconds)}${reArrestNote}`
      );
    setIsVisible(false);
  };

  const toggleReversibleCause = (id: string) => {
    setReversibleCauses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, checked: !c.checked } : c
      )
    );
  };

  // ── Don't render if not visible ──
  if (!isVisible) return null;

  const rhythmInfo = RHYTHM_DISPLAY[currentRhythm] ?? {
    label: currentRhythm,
    shockable: false,
    color: "text-zinc-400",
  };
  const canShock = isShockable(currentRhythm);
  const cycleReady = cprCycleSeconds >= CPR_CYCLE_SECONDS;
  const epiCooldown =
    lastEpiTime !== null ? Math.max(0, EPI_MIN_INTERVAL_SECONDS - (elapsedSeconds - lastEpiTime)) : 0;
  const amiodaroneMaxReached = amiodarone300Given && amiodarone150Given;
  const isInActiveArrest = aclsPhase !== "rosc" && aclsPhase !== "death";

  // ── Minimized floating bar ──
  // Positioned above ActionBar (bottom-[52px]) so ActionBar remains fully accessible.
  // On desktop (lg+), ActionBar is inside the right column so we use bottom-[52px] consistently.
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-[52px] left-0 right-0 z-[60] h-[44px] flex items-center justify-between px-3 md:px-5 border-y"
        style={{
          background: "linear-gradient(180deg, #0a0000 0%, #001219 100%)",
          borderColor: aclsPhase === "rosc" ? "#22c55e" : "#dc2626",
          boxShadow:
            aclsPhase === "rosc"
              ? "0 -2px 20px rgba(34, 197, 94, 0.25)"
              : "0 -2px 20px rgba(220, 38, 38, 0.25)",
        }}
      >
        {/* Left: status indicator + rhythm */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              aclsPhase === "rosc"
                ? "bg-green-500"
                : "bg-red-500 animate-pulse"
            }`}
          />
          <span className="text-white font-bold text-xs truncate">ACLS</span>
          <span className={`text-[11px] font-semibold ${rhythmInfo.color} truncate hidden sm:inline`}>
            {rhythmInfo.label}
          </span>
          <span
            className={`text-[9px] font-bold uppercase px-1 py-px rounded ${
              rhythmInfo.shockable
                ? "bg-red-900/60 text-red-300 border border-red-700"
                : aclsPhase === "rosc"
                  ? "bg-green-900/60 text-green-300 border border-green-700"
                  : "bg-amber-900/60 text-amber-300 border border-amber-700"
            }`}
          >
            {aclsPhase === "rosc" ? "ROSC" : rhythmInfo.shockable ? "SHOCK" : "NON-SHOCK"}
          </span>
        </div>

        {/* Center: CPR timer + elapsed */}
        <div className="flex items-center gap-3">
          {cprActive && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-[11px] font-mono">
                CPR {formatTime(Math.min(cprCycleSeconds, CPR_CYCLE_SECONDS))}/{formatTime(CPR_CYCLE_SECONDS)}
              </span>
            </div>
          )}
          <span
            className={`font-mono font-bold text-xs ${
              elapsedSeconds > MAX_ARREST_SECONDS
                ? "text-red-400"
                : elapsedSeconds > WARNING_ARREST_SECONDS
                  ? "text-amber-400"
                  : "text-white"
            }`}
          >
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Right: expand button */}
        <button
          onClick={() => setIsMinimized(false)}
          className="flex-shrink-0 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-zinc-600 transition-all"
        >
          展開
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Full-screen on mobile, contained dialog on tablet/desktop */}
      <div
        className="relative w-full h-full flex flex-col border-2 overflow-hidden md:mx-4 md:max-w-6xl md:max-h-[95vh] md:rounded-2xl"
        style={{
          background: "linear-gradient(180deg, #0a0000 0%, #001219 30%)",
          borderColor: aclsPhase === "rosc" ? "#22c55e" : "#dc2626",
          boxShadow:
            aclsPhase === "rosc"
              ? "0 0 60px rgba(34, 197, 94, 0.3)"
              : "0 0 60px rgba(220, 38, 38, 0.3)",
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: Rhythm Display (Top)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-shrink-0 px-3 py-2 md:px-6 md:py-4 border-b border-red-900/40 bg-black/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 md:gap-3">
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    aclsPhase === "rosc"
                      ? "bg-green-500"
                      : aclsPhase === "re_arrest"
                        ? "bg-orange-500 animate-pulse"
                        : "bg-red-500 animate-pulse"
                  }`}
                />
                <h1 className="text-white font-bold text-base md:text-xl tracking-tight">
                  ACLS Protocol
                </h1>
                {arrestCount > 1 && (
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-900/60 text-orange-300 border border-orange-700">
                    Arrest #{arrestCount}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 md:gap-4 flex-wrap">
                <span className={`text-sm md:text-lg font-semibold ${rhythmInfo.color} truncate`}>
                  {rhythmInfo.label}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    aclsPhase === "re_arrest"
                      ? "bg-orange-900/60 text-orange-300 border border-orange-700"
                      : rhythmInfo.shockable
                        ? "bg-red-900/60 text-red-300 border border-red-700"
                        : aclsPhase === "rosc"
                          ? "bg-green-900/60 text-green-300 border border-green-700"
                          : "bg-amber-900/60 text-amber-300 border border-amber-700"
                  }`}
                >
                  {aclsPhase === "rosc"
                    ? "ROSC ACHIEVED"
                    : aclsPhase === "re_arrest"
                      ? "RE-ARREST"
                      : rhythmInfo.shockable
                        ? "SHOCKABLE"
                        : "NON-SHOCKABLE"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Minimize button */}
              <button
                onClick={() => setIsMinimized(true)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-600 transition-all"
                title="最小化 ACLS 面板"
              >
                最小化
              </button>
              <div className="text-right flex-shrink-0">
                <p className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider">
                  {arrestCount > 1 ? "Total Arrest Time" : "Arrest Duration"}
                </p>
                <p
                  className={`text-xl md:text-2xl font-mono font-bold ${
                    elapsedSeconds > MAX_ARREST_SECONDS
                      ? "text-red-400"
                      : elapsedSeconds > WARNING_ARREST_SECONDS
                        ? "text-amber-400"
                        : "text-white"
                  }`}
                >
                  {formatTime(elapsedSeconds)}
                </p>
                {elapsedSeconds >= WARNING_ARREST_SECONDS && elapsedSeconds < MAX_ARREST_SECONDS && isInActiveArrest && (
                  <p className="text-amber-500 text-[10px] font-semibold mt-0.5 animate-pulse">
                    Approaching arrest time limit
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            Teaching Message Banner
            ═══════════════════════════════════════════════════════════════════ */}
        {teachingMessage && (
          <div className="flex-shrink-0 px-3 py-2 md:px-6 md:py-3 bg-amber-900/40 border-b border-amber-700/40">
            <p className="text-amber-200 text-xs md:text-sm font-medium">
              {teachingMessage}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            Re-Arrest Banner
            ═══════════════════════════════════════════════════════════════════ */}
        {aclsPhase === "re_arrest" && (
          <div className="flex-shrink-0 px-3 py-3 md:px-6 md:py-4 bg-orange-950/50 border-b border-orange-700/50 text-center">
            <p className="text-orange-300 text-xl md:text-2xl font-bold tracking-wide animate-pulse">
              RE-ARREST DETECTED
            </p>
            <p className="text-orange-400/70 text-xs md:text-sm mt-1">
              Patient lost pulse after ROSC. Resume ACLS immediately. Drug history preserved.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            Senior Arrival / Resternotomy Banner (tamponade only)
            ═══════════════════════════════════════════════════════════════════ */}
        {isTamponade && isInActiveArrest && seniorResternotomyCountdown !== null && seniorResternotomyCountdown > 0 && (
          <div className="flex-shrink-0 px-3 py-3 md:px-6 md:py-4 bg-cyan-950/50 border-b border-cyan-700/50 text-center">
            <p className="text-cyan-300 text-base md:text-lg font-bold tracking-wide">
              學長已到達！正在準備 emergent resternotomy...
            </p>
            <p className="text-cyan-400/70 text-xs md:text-sm mt-1">
              準備中... {formatTime(seniorResternotomyCountdown)} — 繼續 CPR
            </p>
          </div>
        )}
        {isTamponade && isInActiveArrest && seniorEnRoute && !seniorHasArrived && (
          <div className="flex-shrink-0 px-3 py-2 md:px-6 md:py-3 bg-zinc-900/50 border-b border-zinc-700/50 text-center">
            <p className="text-zinc-300 text-sm font-semibold">
              學長在路上（預計 {seniorEtaMinutes} 分鐘）— 繼續 ACLS
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            Arrest Time Warning Banner
            ═══════════════════════════════════════════════════════════════════ */}
        {show15MinWarning && !showTerminationPrompt && isInActiveArrest && (
          <div className="flex-shrink-0 px-3 py-2 md:px-6 bg-amber-950/40 border-b border-amber-700/30">
            <p className="text-amber-300 text-xs font-semibold">
              Arrest prolonged. Review reversible causes and consider termination criteria.
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ROSC Success Banner
            ═══════════════════════════════════════════════════════════════════ */}
        {aclsPhase === "rosc" && (
          <div className="flex-shrink-0 px-3 py-4 md:px-6 md:py-6 bg-green-900/30 border-b border-green-700/40 text-center">
            <p className="text-green-300 text-2xl md:text-3xl font-bold tracking-wide animate-pulse">
              ROSC ACHIEVED
            </p>
            <p className="text-green-400/70 text-xs md:text-sm mt-1 md:mt-2">
              {arrestCount > 1
                ? "Spontaneous circulation restored. Monitor closely for re-arrest."
                : "Spontaneous circulation restored. Initiate post-cardiac arrest care."}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            Waveform Display (ECG Lead II + A-line)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-shrink-0 px-3 py-2 md:px-6 md:py-3">
          <ACLSWaveformCanvas
            rhythm={currentRhythm}
            cprActive={cprActive}
            isRosc={aclsPhase === "rosc"}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTIONS 2 & 3: CPR Status + Actions (Center)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* ── CPR Status (left on tablet+, top on mobile) ── */}
          <div className="md:w-1/2 p-3 md:p-5 flex flex-col gap-3 md:gap-4 overflow-y-auto md:border-r border-white/5">
            {/* CPR Button & Status */}
            <div className="rounded-xl border border-zinc-700/50 bg-black/30 p-3 md:p-4">
              <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-2 md:mb-3">
                CPR Status
              </h3>

              {!cprActive && aclsPhase !== "rosc" ? (
                <button
                  onClick={handleStartCpr}
                  className="w-full min-h-[64px] py-4 md:py-5 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xl transition-all shadow-xl shadow-blue-900/40"
                >
                  Start CPR
                </button>
              ) : aclsPhase === "rosc" ? (
                <div className="text-center py-4">
                  <p className="text-green-400 font-semibold text-lg">
                    CPR No Longer Required
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Active CPR indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-blue-300 font-bold text-lg">
                        CPR Active
                      </span>
                    </div>
                    <span className="text-zinc-400 font-mono text-sm">
                      Cycle #{cprCycles + 1}
                    </span>
                  </div>

                  {/* Compression count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Compressions</span>
                    <span className="text-white font-mono">
                      ~{compressionCount}
                    </span>
                  </div>

                  {/* CPR cycle timer bar */}
                  <div>
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>Cycle Progress</span>
                      <span>
                        {formatTime(Math.min(cprCycleSeconds, CPR_CYCLE_SECONDS))} /{" "}
                        {formatTime(CPR_CYCLE_SECONDS)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          cycleReady ? "bg-amber-500" : "bg-blue-500"
                        }`}
                        style={{
                          width: `${Math.min(100, (cprCycleSeconds / CPR_CYCLE_SECONDS) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rhythm check button */}
                  <button
                    onClick={handlePauseForRhythmCheck}
                    disabled={!cycleReady}
                    className={`w-full min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                      cycleReady
                        ? "bg-amber-700 hover:bg-amber-600 text-white shadow-lg shadow-amber-900/30 animate-pulse"
                        : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    {cycleReady
                      ? "Pause for Rhythm Check"
                      : `Rhythm Check in ${formatTime(CPR_CYCLE_SECONDS - cprCycleSeconds)}`}
                  </button>
                </div>
              )}

              {/* Post rhythm check: pulse/EKG check + action buttons */}
              {aclsPhase === "rhythm_check" && !cprActive && (
                <div className="mt-3 space-y-3">
                  {!pulseCheckRevealed ? (
                    /* Step 1: Player must actively check monitors */
                    <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-center">
                      <p className="text-amber-300 text-sm font-semibold mb-1">
                        停止壓胸，看 Monitor
                      </p>
                      <p className="text-zinc-400 text-xs mb-3">
                        CPR cycle complete. Check A-line and ECG monitors.
                      </p>
                      <button
                        onClick={handleRevealPulseCheck}
                        className="w-full min-h-[52px] py-3 rounded-xl bg-amber-700 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-base transition-all shadow-lg shadow-amber-900/40 animate-pulse"
                      >
                        Check Pulse &amp; Rhythm
                      </button>
                    </div>
                  ) : (
                    /* Step 2: Show A-line + ECG results, then action choices */
                    <div className="space-y-3">
                      {/* A-line result */}
                      <div
                        className={`rounded-lg border p-3 ${
                          ARREST_RHYTHMS.includes(currentRhythm)
                            ? "border-red-700/60 bg-red-950/40"
                            : "border-green-700/60 bg-green-950/40"
                        }`}
                      >
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                          A-Line (Arterial Waveform)
                        </p>
                        <p
                          className={`text-sm font-bold font-mono ${
                            ARREST_RHYTHMS.includes(currentRhythm)
                              ? "text-red-300"
                              : "text-green-300"
                          }`}
                        >
                          {ARREST_RHYTHMS.includes(currentRhythm)
                            ? "Flatline — 無脈搏"
                            : "Pulsatile waveform — 有脈搏！"}
                        </p>
                      </div>

                      {/* ECG result */}
                      <div
                        className={`rounded-lg border p-3 ${
                          currentRhythm === "asystole"
                            ? "border-zinc-600/60 bg-zinc-900/40"
                            : currentRhythm === "pea"
                              ? "border-amber-700/60 bg-amber-950/40"
                              : currentRhythm === "vf" || currentRhythm === "vt_pulseless"
                                ? "border-red-700/60 bg-red-950/40"
                                : "border-green-700/60 bg-green-950/40"
                        }`}
                      >
                        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
                          ECG Monitor
                        </p>
                        <p
                          className={`text-sm font-bold font-mono ${
                            currentRhythm === "asystole"
                              ? "text-zinc-300"
                              : currentRhythm === "pea"
                                ? "text-amber-300"
                                : currentRhythm === "vf" || currentRhythm === "vt_pulseless"
                                  ? "text-red-300"
                                  : "text-green-300"
                          }`}
                        >
                          {currentRhythm === "pea" && "PEA — 無脈搏電氣活動"}
                          {currentRhythm === "asystole" && "Asystole — 心臟停止"}
                          {currentRhythm === "vf" && "VF — 心室顫動"}
                          {currentRhythm === "vt_pulseless" && "Pulseless VT — 無脈搏心室頻脈"}
                          {(currentRhythm === "nsr" || currentRhythm === "sinus_tach") && "Sinus — 竇性心律"}
                          {!["pea", "asystole", "vf", "vt_pulseless", "nsr", "sinus_tach"].includes(currentRhythm) &&
                            (RHYTHM_DISPLAY[currentRhythm]?.label ?? currentRhythm)}
                        </p>
                      </div>

                      {/* Shockability badge */}
                      <div className="flex items-center justify-center">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded ${
                            isShockable(currentRhythm)
                              ? "bg-red-900/60 text-red-300 border border-red-700"
                              : "bg-amber-900/60 text-amber-300 border border-amber-700"
                          }`}
                        >
                          {isShockable(currentRhythm) ? "SHOCKABLE RHYTHM" : "NON-SHOCKABLE RHYTHM"}
                        </span>
                      </div>

                      {/* Action buttons after viewing results */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleResumeCpr}
                          className="flex-1 min-h-[44px] py-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm transition-all"
                        >
                          Resume CPR
                        </button>
                        {isShockable(currentRhythm) && (
                          <button
                            onClick={handleChargeDefibrillator}
                            className="flex-1 min-h-[44px] py-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold text-sm transition-all"
                          >
                            Defibrillate
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-2 md:p-3 text-center">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
                  Shocks
                </p>
                <p className="text-white font-bold text-lg font-mono">
                  {shocksDelivered}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-2 md:p-3 text-center">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
                  Epi Doses
                </p>
                <p className="text-white font-bold text-lg font-mono">
                  {epinephrineGiven}
                </p>
                {epiCooldown > 0 && (
                  <p className="text-zinc-500 text-[9px] font-mono mt-0.5">
                    Next in {formatTime(epiCooldown)}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-2 md:p-3 text-center">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
                  ROSC Prob
                </p>
                <p className="text-amber-400 font-bold text-lg font-mono">
                  {(roscProbability * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            {/* Amiodarone & arrest status */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 p-2 text-center">
                <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
                  Amiodarone
                </p>
                <p className={`font-bold text-sm font-mono ${amiodaroneMaxReached ? "text-red-400" : "text-white"}`}>
                  {amiodarone300Given && amiodarone150Given
                    ? "MAX (450mg)"
                    : amiodarone300Given
                      ? "300mg given"
                      : "Not given"}
                </p>
                {amiodaroneMaxReached && (
                  <p className="text-red-500 text-[9px] mt-0.5">Max dose reached</p>
                )}
              </div>
              {arrestCount > 1 && (
                <div className="rounded-lg bg-orange-950/40 border border-orange-800/50 p-2 text-center">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider">
                    Arrests
                  </p>
                  <p className="text-orange-300 font-bold text-sm font-mono">
                    {arrestCount} episodes
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Actions (right on tablet+, bottom on mobile) ── */}
          <div className="md:w-1/2 p-3 md:p-5 flex flex-col gap-2 md:gap-3 overflow-y-auto border-t md:border-t-0 border-white/5">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest">
              Interventions
            </h3>

            {/* Defibrillate — Two-step: Charge then Discharge */}
            {confirmShock ? (
              <div className="flex gap-2">
                <button
                  onClick={handleChargeDefibrillator}
                  className="flex-1 min-h-[52px] md:min-h-[56px] py-3 md:py-4 rounded-xl font-bold text-sm md:text-base bg-yellow-600 hover:bg-yellow-500 active:scale-[0.98] text-white shadow-xl shadow-yellow-900/50 animate-pulse transition-all"
                >
                  DISCHARGE 200J
                </button>
                <button
                  onClick={handleCancelCharge}
                  className="min-h-[52px] md:min-h-[56px] min-w-[44px] px-4 py-3 md:py-4 rounded-xl font-semibold text-sm border border-zinc-600 text-zinc-300 hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleChargeDefibrillator}
                disabled={aclsPhase === "rosc"}
                className={`w-full min-h-[52px] md:min-h-[56px] py-3 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all ${
                  canShock && aclsPhase !== "rosc"
                    ? "bg-red-700 hover:bg-red-600 active:scale-[0.98] text-white shadow-xl shadow-red-900/50"
                    : aclsPhase === "rosc"
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-500 hover:bg-zinc-700/50"
                }`}
                title={
                  !canShock && aclsPhase !== "rosc"
                    ? `${rhythmInfo.label} is non-shockable`
                    : undefined
                }
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Charge Defibrillator 200J</span>
                  {!canShock && aclsPhase !== "rosc" && (
                    <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-400">
                      Non-shockable
                    </span>
                  )}
                </div>
              </button>
            )}

            {/* Drugs — 2-col on mobile, 3-col on tablet+ */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                onClick={handleEpinephrine}
                disabled={aclsPhase === "rosc" || epiCooldown > 0}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || epiCooldown > 0
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-emerald-800 hover:bg-emerald-700 text-emerald-200 border border-emerald-700/50"
                }`}
              >
                Epinephrine 1mg
                {epiCooldown > 0 && (
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    {formatTime(epiCooldown)}
                  </span>
                )}
              </button>
              <button
                onClick={handleAmiodarone300}
                disabled={aclsPhase === "rosc" || amiodarone300Given}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || amiodarone300Given
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-700/50"
                }`}
              >
                Amiodarone 300mg
                {amiodarone300Given && (
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    Given
                  </span>
                )}
              </button>
              <button
                onClick={handleAmiodarone150}
                disabled={
                  aclsPhase === "rosc" ||
                  !amiodarone300Given ||
                  amiodarone150Given
                }
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" ||
                  !amiodarone300Given ||
                  amiodarone150Given
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-700/50"
                }`}
              >
                Amiodarone 150mg
                {amiodarone150Given ? (
                  <span className="block text-[10px] text-red-500 mt-0.5">
                    Max dose reached
                  </span>
                ) : !amiodarone300Given ? (
                  <span className="block text-[10px] text-zinc-600 mt-0.5">
                    Give 300mg first
                  </span>
                ) : null}
              </button>
              {/* ── Additional ACLS Drugs ── */}
              <button
                onClick={handleAtropine}
                disabled={aclsPhase === "rosc" || atropineGiven >= 3}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || atropineGiven >= 3
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-blue-900 hover:bg-blue-800 text-blue-200 border border-blue-700/50"
                }`}
              >
                Atropine 1mg
                {atropineGiven > 0 && (
                  <span className={`block text-[10px] mt-0.5 ${atropineGiven >= 3 ? "text-red-500" : "text-zinc-500"}`}>
                    {atropineGiven}/3 doses{atropineGiven >= 3 ? " (max)" : ""}
                  </span>
                )}
              </button>
              <button
                onClick={handleCalciumChloride}
                disabled={aclsPhase === "rosc"}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc"
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-yellow-900 hover:bg-yellow-800 text-yellow-200 border border-yellow-700/50"
                }`}
              >
                CaCl₂ 1g
                {calciumChlorideGiven > 0 && (
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    x{calciumChlorideGiven}
                  </span>
                )}
              </button>
              <button
                onClick={handleSodiumBicarb}
                disabled={aclsPhase === "rosc"}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc"
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200 border border-zinc-500/50"
                }`}
              >
                NaHCO₃ 50mEq
                {sodiumBicarbGiven > 0 && (
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    x{sodiumBicarbGiven}
                  </span>
                )}
              </button>
              <button
                onClick={handleMagnesium}
                disabled={aclsPhase === "rosc"}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc"
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-violet-900 hover:bg-violet-800 text-violet-200 border border-violet-700/50"
                }`}
              >
                Mg 2g
                {magnesiumGiven > 0 && (
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    x{magnesiumGiven}
                  </span>
                )}
              </button>
              <button
                onClick={handleLidocaine}
                disabled={aclsPhase === "rosc"}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc"
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-orange-900 hover:bg-orange-800 text-orange-200 border border-orange-700/50"
                }`}
              >
                Lidocaine 100mg
                {lidocaineGiven > 0 && (
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    x{lidocaineGiven}
                  </span>
                )}
              </button>
              {/* ── Phase 1 Additional ACLS Drugs ── */}
              <button
                onClick={handleVasopressin}
                disabled={aclsPhase === "rosc" || vasopressinGiven}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || vasopressinGiven
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50"
                }`}
              >
                Vasopressin 40U
                {vasopressinGiven && (
                  <span className="block text-[10px] text-red-500 mt-0.5">
                    Single dose given
                  </span>
                )}
              </button>
              <button
                onClick={handleAdenosine}
                disabled={aclsPhase === "rosc" || adenosineGiven >= 3}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || adenosineGiven >= 3
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-pink-900 hover:bg-pink-800 text-pink-200 border border-pink-700/50"
                }`}
              >
                Adenosine {adenosineGiven === 0 ? "6mg" : "12mg"}
                {adenosineGiven > 0 && (
                  <span className={`block text-[10px] mt-0.5 ${adenosineGiven >= 3 ? "text-red-500" : "text-zinc-500"}`}>
                    {adenosineGiven}/3 doses{adenosineGiven >= 3 ? " (max)" : ""}
                  </span>
                )}
              </button>
              <button
                onClick={handleD50W}
                disabled={aclsPhase === "rosc" || d50wGiven >= 2}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || d50wGiven >= 2
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-amber-900 hover:bg-amber-800 text-amber-200 border border-amber-700/50"
                }`}
              >
                D50W 50mL
                {d50wGiven > 0 && (
                  <span className={`block text-[10px] mt-0.5 ${d50wGiven >= 2 ? "text-red-500" : "text-zinc-500"}`}>
                    {d50wGiven}/2 doses{d50wGiven >= 2 ? " (max)" : ""}
                  </span>
                )}
              </button>
              <button
                onClick={handleInsulin}
                disabled={aclsPhase === "rosc" || insulinGiven >= 2}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || insulinGiven >= 2
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-teal-900 hover:bg-teal-800 text-teal-200 border border-teal-700/50"
                }`}
              >
                Insulin 10U
                {insulinGiven > 0 && (
                  <span className={`block text-[10px] mt-0.5 ${insulinGiven >= 2 ? "text-red-500" : "text-zinc-500"}`}>
                    {insulinGiven}/2 doses{insulinGiven >= 2 ? " (max)" : ""}
                  </span>
                )}
              </button>
              <button
                onClick={handleEpiDrip}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  epiDripActive
                    ? "bg-green-800 hover:bg-green-700 text-green-200 border border-green-500/70 ring-1 ring-green-500/40"
                    : aclsPhase === "rosc"
                      ? "bg-emerald-900 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700/50"
                }`}
              >
                {epiDripActive ? "Epi Drip ON" : "Epi Drip"}
                <span className="block text-[10px] mt-0.5 text-zinc-500">
                  {epiDripActive ? "0.1-0.5 mcg/kg/min" : "Post-ROSC only"}
                </span>
              </button>
              {/* ── Phase 2 Additional ACLS Drugs ── */}
              <button
                onClick={handleDopamine}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  dopamineActive
                    ? "bg-green-800 hover:bg-green-700 text-green-200 border border-green-500/70 ring-1 ring-green-500/40"
                    : aclsPhase === "rosc"
                      ? "bg-orange-900 hover:bg-orange-800 text-orange-200 border border-orange-700/50"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700/50"
                }`}
              >
                {dopamineActive ? "Dopamine ON" : "Dopamine"}
                <span className="block text-[10px] mt-0.5 text-zinc-500">
                  {dopamineActive ? "2-20 mcg/kg/min" : "Bradycardia / Post-ROSC"}
                </span>
              </button>
              <button
                onClick={handleIsuprel}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  isuprelActive
                    ? "bg-green-800 hover:bg-green-700 text-green-200 border border-green-500/70 ring-1 ring-green-500/40"
                    : aclsPhase === "rosc"
                      ? "bg-cyan-900 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/50"
                      : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700/50"
                }`}
              >
                {isuprelActive ? "Isuprel ON" : "Isuprel"}
                <span className="block text-[10px] mt-0.5 text-zinc-500">
                  {isuprelActive ? "2-10 mcg/min" : "Bradycardia / Torsades"}
                </span>
              </button>
              <button
                onClick={handleProcainamide}
                disabled={aclsPhase === "rosc" || procainamideGiven >= 1}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || procainamideGiven >= 1
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-violet-900 hover:bg-violet-800 text-violet-200 border border-violet-700/50"
                }`}
              >
                Procainamide
                {procainamideGiven >= 1 ? (
                  <span className="block text-[10px] text-red-500 mt-0.5">
                    Infusing (max reached)
                  </span>
                ) : (
                  <span className="block text-[10px] text-zinc-500 mt-0.5">
                    20-50 mg/min IV
                  </span>
                )}
              </button>
              <button
                onClick={handleDiltiazem}
                disabled={aclsPhase === "rosc" || diltiazemGiven >= 2}
                className={`min-h-[44px] py-3 rounded-lg text-sm font-semibold transition-all ${
                  aclsPhase === "rosc" || diltiazemGiven >= 2
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-rose-900 hover:bg-rose-800 text-rose-200 border border-rose-700/50"
                }`}
              >
                Diltiazem {diltiazemGiven === 0 ? "0.25" : "0.35"} mg/kg
                {diltiazemGiven > 0 && (
                  <span className={`block text-[10px] mt-0.5 ${diltiazemGiven >= 2 ? "text-red-500" : "text-zinc-500"}`}>
                    {diltiazemGiven}/2 doses{diltiazemGiven >= 2 ? " (max)" : ""}
                  </span>
                )}
              </button>
            </div>

            {/* Reversible Causes (H's and T's) */}
            <div className="rounded-xl border border-zinc-700/50 bg-black/30 overflow-hidden">
              <button
                onClick={() => setShowReversibleCauses(!showReversibleCauses)}
                className="w-full min-h-[44px] px-3 md:px-4 py-2 md:py-3 flex items-center justify-between text-left hover:bg-zinc-800/30 transition"
              >
                <span className="text-sm font-semibold text-zinc-300">
                  Check Reversible Causes (H&apos;s and T&apos;s)
                </span>
                <span
                  className={`text-zinc-500 text-xs transition-transform ${
                    showReversibleCauses ? "rotate-180" : ""
                  }`}
                >
                  &#9660;
                </span>
              </button>

              {showReversibleCauses && (
                <div className="px-3 pb-3 md:px-4 md:pb-4 grid grid-cols-2 gap-x-3 md:gap-x-6 gap-y-0 md:gap-y-1 border-t border-zinc-800 max-h-[200px] md:max-h-none overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      H&apos;s
                    </p>
                    {reversibleCauses
                      .filter((c) => c.category === "H")
                      .map((cause) => (
                        <label
                          key={cause.id}
                          className="flex items-center gap-2 py-1.5 md:py-1 cursor-pointer group min-h-[36px] md:min-h-0"
                        >
                          <input
                            type="checkbox"
                            checked={cause.checked}
                            onChange={() => toggleReversibleCause(cause.id)}
                            className="w-4 h-4 md:w-3.5 md:h-3.5 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500/30 flex-shrink-0"
                          />
                          <span
                            className={`text-xs transition ${
                              cause.checked
                                ? "text-green-400 line-through"
                                : "text-zinc-400 group-hover:text-zinc-300"
                            }`}
                          >
                            {cause.label}
                          </span>
                        </label>
                      ))}
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                      T&apos;s
                    </p>
                    {reversibleCauses
                      .filter((c) => c.category === "T")
                      .map((cause) => (
                        <label
                          key={cause.id}
                          className="flex items-center gap-2 py-1.5 md:py-1 cursor-pointer group min-h-[36px] md:min-h-0"
                        >
                          <input
                            type="checkbox"
                            checked={cause.checked}
                            onChange={() => toggleReversibleCause(cause.id)}
                            className="w-4 h-4 md:w-3.5 md:h-3.5 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500/30 flex-shrink-0"
                          />
                          <span
                            className={`text-xs transition ${
                              cause.checked
                                ? "text-green-400 line-through"
                                : "text-zinc-400 group-hover:text-zinc-300"
                            }`}
                          >
                            {cause.label}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Termination prompt */}
            {showTerminationPrompt && aclsPhase !== "rosc" && (
              <div className="rounded-xl border border-red-800/60 bg-red-950/40 p-3 md:p-4">
                <p className="text-red-300 text-sm font-semibold mb-2">
                  Arrest duration exceeds time limit.
                </p>
                <p className="text-red-400/70 text-xs mb-3">
                  Consider termination of resuscitation efforts.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTerminationPrompt(false)}
                    className="flex-1 min-h-[44px] py-2 rounded-lg border border-zinc-600 text-zinc-300 text-xs font-medium hover:bg-zinc-800 transition"
                  >
                    Continue Resuscitation
                  </button>
                  <button
                    onClick={handleTerminate}
                    className="flex-1 min-h-[44px] py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold transition"
                  >
                    Terminate Efforts
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4: Timeline (Bottom)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex-shrink-0 border-t border-zinc-800 bg-black/60">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full px-3 py-2 md:px-5 md:py-2 flex items-center justify-between min-h-[44px] md:min-h-0 hover:bg-zinc-900/30 transition"
          >
            <h3 className="text-zinc-500 text-xs uppercase tracking-widest">
              ACLS Timeline
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-zinc-600 text-[10px]">
                {aclsTimeline.length} events
              </span>
              <span
                className={`text-zinc-500 text-xs transition-transform md:hidden ${
                  showTimeline ? "rotate-180" : ""
                }`}
              >
                &#9660;
              </span>
            </div>
          </button>
          <div
            ref={timelineRef}
            className={`overflow-y-auto px-3 pb-2 md:px-5 md:pb-3 transition-all ${
              showTimeline ? "h-28 md:h-28" : "h-0 md:h-28 overflow-hidden"
            }`}
            style={{ scrollbarWidth: "thin", scrollbarColor: "#ffffff1a transparent" }}
          >
            {aclsTimeline.length === 0 ? (
              <p className="text-zinc-700 text-xs italic">
                Awaiting interventions...
              </p>
            ) : (
              <div className="space-y-1">
                {aclsTimeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <span className="text-zinc-600 font-mono text-[10px] flex-shrink-0 w-12 pt-0.5">
                      {formatTime(event.timestamp)}
                    </span>
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                        event.type === "rosc"
                          ? "bg-green-400"
                          : event.type === "shock"
                            ? "bg-red-400"
                            : event.type === "drug"
                              ? "bg-purple-400"
                              : event.type === "cpr"
                                ? "bg-blue-400"
                                : event.type === "error"
                                  ? "bg-amber-400"
                                  : event.type === "re_arrest"
                                    ? "bg-orange-400"
                                    : event.type === "rhythm_change"
                                      ? "bg-cyan-400"
                                      : event.type === "warning"
                                        ? "bg-amber-500"
                                        : "bg-zinc-500"
                      }`}
                    />
                    <span
                      className={`text-xs leading-tight ${
                        event.type === "rosc"
                          ? "text-green-300 font-semibold"
                          : event.type === "re_arrest"
                            ? "text-orange-300 font-semibold"
                            : event.type === "rhythm_change"
                              ? "text-cyan-300 font-medium"
                              : event.type === "warning"
                                ? "text-amber-300 font-semibold"
                                : event.type === "error"
                                  ? "text-amber-300"
                                  : "text-zinc-400"
                      }`}
                    >
                      {event.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
