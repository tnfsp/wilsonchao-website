"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { RhythmType, TimelineEntry } from "@/lib/simulator/types";
import {
  dispatchCardiacArrest,
  dispatchStartCpr,
  dispatchStopCpr,
} from "@/lib/simulator/engine/biogears-engine";

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

const CPR_CYCLE_SECONDS = 120; // 2 minutes per AHA

const MAX_ARREST_SECONDS = 20 * 60; // 20 minutes before termination prompt

const WARNING_ARREST_SECONDS = 15 * 60; // 15-minute warning

const EPI_MIN_INTERVAL_SECONDS = 180; // 3 minutes per AHA 2020

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function ACLSModal() {
  const patient = useProGameStore((s) => s.patient);
  const phase = useProGameStore((s) => s.phase);
  const clock = useProGameStore((s) => s.clock);
  const deliverShock = useProGameStore((s) => s.deliverShock);
  const addTimelineEntry = useProGameStore((s) => s.addTimelineEntry);
  const scenario = useProGameStore((s) => s.scenario);

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

  // ── Re-arrest tracking ──
  const [arrestCount, setArrestCount] = useState(0); // total arrest episodes (for debrief scoring)
  const [hasAchievedRosc, setHasAchievedRosc] = useState(false); // whether ROSC was ever achieved
  const [show15MinWarning, setShow15MinWarning] = useState(false); // 15-minute approaching warning
  const [previousRhythm, setPreviousRhythm] = useState<RhythmType | null>(null); // for rhythm transition detection

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

        // 15-minute approaching warning (cumulative)
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
              text: "WARNING: Arrest duration approaching 20 minutes. Consider reversible causes and termination criteria.",
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
          // Auto-prompt for rhythm check at 2-minute cycle
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

    dispatchStopCpr();
    addEvent(
      `Rhythm check - Cycle #${cprCycles + 1} complete`,
      "check"
    );

    // Evaluate rhythm
    const rhythmInfo = RHYTHM_DISPLAY[currentRhythm];
    if (rhythmInfo) {
      const shockText = rhythmInfo.shockable ? "SHOCKABLE" : "NON-SHOCKABLE";
      addEvent(
        `Rhythm: ${rhythmInfo.label} - ${shockText}`,
        "check"
      );
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
        `${rhythmName} is non-shockable. Continue CPR and treat reversible causes.`
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
    // Check 3-minute interval (AHA 2020: minimum 3 minutes between doses)
    // Drug timing persists across re-arrests (never reset on ROSC)
    if (lastEpiTime !== null && elapsedSeconds - lastEpiTime < EPI_MIN_INTERVAL_SECONDS) {
      const remaining = EPI_MIN_INTERVAL_SECONDS - (elapsedSeconds - lastEpiTime);
      setTeachingMessage(
        `Epinephrine interval not met. Wait ${remaining}s (minimum 3 minutes between doses per AHA 2020).`
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
  };

  const handleAmiodarone300 = () => {
    if (amiodarone300Given) {
      setTeachingMessage(
        "Amiodarone 300mg already administered. Consider 150mg second dose if refractory VF/pVT."
      );
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    if (!isShockable(currentRhythm)) {
      setTeachingMessage(
        "Amiodarone is only indicated for refractory VF/pulseless VT."
      );
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    setAmiodarone300Given(true);
    addEvent("Amiodarone 300mg IV - First dose (1 of 2 max)", "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "ACLS: Amiodarone 300mg IV (dose 1/2)",
      sender: "player",
    });
  };

  const handleAmiodarone150 = () => {
    if (amiodarone150Given) {
      setTeachingMessage(
        `Max amiodarone dose reached (${AMIODARONE_MAX_DOSES} doses: 300mg + 150mg = 450mg total). No further doses recommended.`
      );
      setTimeout(() => setTeachingMessage(null), 4000);
      return;
    }
    if (!amiodarone300Given) {
      setTeachingMessage(
        "Amiodarone 300mg must be given first before the 150mg second dose."
      );
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    if (!isShockable(currentRhythm)) {
      setTeachingMessage(
        "Amiodarone is only indicated for refractory VF/pulseless VT."
      );
      setTimeout(() => setTeachingMessage(null), 3000);
      return;
    }
    setAmiodarone150Given(true);
    addEvent("Amiodarone 150mg IV - Second dose (MAX DOSE REACHED)", "drug");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "ACLS: Amiodarone 150mg IV (dose 2/2 - max reached)",
      sender: "player",
    });
  };

  const handleResternotomy = () => {
    addEvent("EMERGENCY RESTERNOTOMY performed!", "system");
    addTimelineEntry({
      gameTime: clock.currentTime,
      type: "player_action",
      content: "ACLS: Emergency Resternotomy - definitive tamponade treatment",
      sender: "player",
      isImportant: true,
    });
    handleRosc("Resternotomy - tamponade relieved");
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
  const isTamponade =
    scenario?.pathology === "cardiac_tamponade" ||
    scenario?.pathology === "tamponade" ||
    patient?.pathology === "cardiac_tamponade" ||
    patient?.pathology === "tamponade";

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
                  Approaching 20 min limit
                </p>
              )}
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
            15-Minute Warning Banner
            ═══════════════════════════════════════════════════════════════════ */}
        {show15MinWarning && !showTerminationPrompt && isInActiveArrest && (
          <div className="flex-shrink-0 px-3 py-2 md:px-6 bg-amber-950/40 border-b border-amber-700/30">
            <p className="text-amber-300 text-xs font-semibold">
              15 minutes elapsed. Review reversible causes and consider termination criteria.
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

              {/* Post rhythm check: resume CPR button */}
              {aclsPhase === "rhythm_check" && !cprActive && (
                <button
                  onClick={handleResumeCpr}
                  className="w-full mt-3 min-h-[44px] py-3 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold text-sm transition-all"
                >
                  Resume CPR
                </button>
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
            </div>

            {/* Emergency Resternotomy (only for tamponade) */}
            {isTamponade && (
              <button
                onClick={handleResternotomy}
                disabled={aclsPhase === "rosc"}
                className={`w-full min-h-[44px] py-3 rounded-xl text-sm font-bold transition-all ${
                  aclsPhase === "rosc"
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-orange-800 hover:bg-orange-700 text-orange-100 border border-orange-600/50 shadow-lg shadow-orange-900/30"
                }`}
              >
                Emergency Resternotomy
              </button>
            )}

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
                  Arrest duration exceeds 20 minutes.
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
