/**
 * 基礎分數計算（從 store.ts 機械搬移，零行為改變）
 *
 * 不 import score-engine — 這是 store 內建的 fallback 計分邏輯。
 */

import { ACTION_PATTERNS } from "./action-patterns";
import type { ProGameStore } from "./types";
import type { CriticalAction, GameScore } from "../types";

/** 基礎分數計算（不 import score-engine） */
export function computeBasicScore(
  state: Omit<
    ProGameStore,
    | "loadScenario"
    | "startGame"
    | "advanceTime"
    | "placeOrder"
    | "activateMTP"
    | "addTimelineEntry"
    | "updateVitals"
    | "updateChestTube"
    | "sendMessage"
    | "openModal"
    | "closeModal"
    | "usePauseThink"
    | "submitSBAR"
    | "endGame"
    | "resetGame"
    | "addPendingEvent"
    | "setPendingEvents"
    | "fireEvent"
    | "updatePatientSeverity"
    | "addActiveEffect"
    | "removeActiveEffect"
    | "updateLethalTriad"
    | "updateIOBalance"
    | "updateOrderStatus"
    | "setScore"
    | "updatePathology"
    | "updateVentilator"
    | "useHint"
    | "setDefibrillatorEnergy"
    | "setDefibrillatorMode"
    | "deliverShock"
    | "triggerDeath"
    | "triggerCardiacArrest"
    | "setRescueState"
    | "tickRescueCountdown"
    | "checkGuidance"
    | "setGuidanceHighlight"
    | "actionAdvance"
    | "resetGame"
  >
): GameScore {
  const { scenario, placedOrders, playerActions, hintsUsed, pauseThinkUsed, sbarReport, patient, clock } = state;

  if (!scenario) {
    return {
      timeToFirstAction: 0,
      correctDiagnosis: false,
      criticalActions: [],
      harmfulOrders: [],
      escalationTiming: "never",
      lethalTriadManaged: false,
      sbar: {
        completeness: 0,
        prioritization: 0,
        quantitative: false,
        anticipatory: false,
      },
      hintsUsed,
      pauseThinkUsed,
      overall: "needs_improvement",
      keyLessons: [],
      stars: 1 as 1 | 2 | 3,
      totalScore: 0,
      patientDied: !!state.deathCause,
    };
  }

  // 1. Time to first action (skip game_start entry)
  const meaningfulActions = playerActions.filter((pa) => !pa.action.startsWith("game_start:") && !pa.action.startsWith("event_fired:"));
  const timeToFirstAction = meaningfulActions.length > 0
    ? meaningfulActions[0].gameTime
    : clock.currentTime;

  // 2. Critical actions — 對照 scenario.expectedActions with pattern matching
  const criticalActions: CriticalAction[] = scenario.expectedActions.map(
    (expected) => {
      const pattern = ACTION_PATTERNS[expected.id];

      // M1 phase guard: act-recall-senior should only count if pathology
      // has already transitioned to cardiac_tamponade (i.e. Phase 2).
      // Without this, a Phase 1 "叫學長" message could false-match the Phase 2 recall pattern.
      if (expected.id === "act-recall-senior" && patient?.pathology !== "cardiac_tamponade") {
        return {
          id: expected.id,
          description: expected.description,
          met: false,
          timeToComplete: null,
          critical: expected.critical,
          hint: expected.hint,
        };
      }

      const matchingAction = pattern
        ? playerActions.find((pa) => pattern.test(pa.action))
        : playerActions.find((pa) =>
            pa.action.toLowerCase().includes(expected.action.toLowerCase())
          );

      return {
        id: expected.id,
        description: expected.description,
        met: !!matchingAction,
        timeToComplete: matchingAction ? matchingAction.gameTime : null,
        critical: expected.critical,
        hint: expected.hint,
      };
    }
  );

  // 3. Harmful orders（effect.isCorrectTreatment === false）
  const harmfulOrders = placedOrders
    .filter((o) => o.status === "completed" || o.status === "in_progress")
    .filter((o) => {
      // 如果 definition 上有 effect 且標記為不正確，算有害
      const effectDef = o.definition.effect;
      return effectDef && effectDef.isCorrectTreatment === false;
    })
    .map((o) => o.definition.name);

  // 4. Correct diagnosis（pathology match）
  // Multi-phase scenario: 玩家活到 Phase 2 (pathology 已轉換) 才算正確
  const correctDiagnosis = scenario.phasedFindings
    ? patient?.pathology !== scenario.pathology && state.phase !== "death"  // pathology 有轉換 + 存活才算
    : scenario.pathology === patient?.pathology;

  // 5. Escalation timing (now using actual gameTime from TrackedAction)
  // Phase 1: first call_senior
  const escalationAction = playerActions.find((pa) =>
    pa.action.includes("叫學長") || pa.action.includes("consult") || pa.action.includes("通知VS") || pa.action.includes("call_senior") || pa.action.includes("call_vs")
  );
  let escalationTiming: GameScore["escalationTiming"] = "never";
  if (escalationAction) {
    if (escalationAction.gameTime <= 10) escalationTiming = "early";
    else if (escalationAction.gameTime <= 20) escalationTiming = "appropriate";
    else escalationTiming = "late";
  }
  // Phase 2: recall_senior (if applicable) — with timing
  const recallAction = playerActions.find((pa) => pa.action === "recall_senior");
  const hasRecallExpected = scenario.expectedActions.some((ea) => ea.id === "act-recall-senior");
  const recallDeadline = scenario.expectedActions.find((ea) => ea.id === "act-recall-senior")?.deadline ?? 28;
  let recallPoints = 0; // out of 7
  if (!hasRecallExpected) {
    recallPoints = 0; // no recall expected → 0 (all 15 go to Phase 1)
  } else if (recallAction) {
    recallPoints = recallAction.gameTime <= recallDeadline ? 7 : 3; // on time: 7, late: 3
  }
  // else: never recalled → 0

  // 6. Lethal triad managed
  const lethalTriadManaged = patient?.lethalTriad.count === 0;

  // 7. SBAR score
  const sbar = computeSBARScore(sbarReport);

  // 8. Overall
  const criticalMissed = criticalActions.filter(
    (ca) => ca.critical && !ca.met
  ).length;
  let overall: GameScore["overall"] = "excellent";
  if (criticalMissed >= 2 || harmfulOrders.length > 0) {
    overall = "needs_improvement";
  } else if (criticalMissed === 1 || hintsUsed > 2) {
    overall = "good";
  }

  // 9. Key lessons
  const keyLessons = scenario.debrief.keyPoints.slice(0, 3);

  // 10. Total score (0-100) and stars
  const patientDied = !!state.deathCause;
  let totalScore = 0;
  // Base: critical actions completion (50 pts)
  const totalCritical = criticalActions.filter((ca) => ca.critical).length;
  const metCritical = criticalActions.filter((ca) => ca.critical && ca.met).length;
  const criticalScore = totalCritical > 0 ? Math.round((metCritical / totalCritical) * 50) : 50;
  totalScore += criticalScore;
  // SBAR score (25 pts)
  totalScore += Math.round((sbar.completeness / 100) * 15);
  totalScore += sbar.quantitative ? 5 : 0;
  totalScore += sbar.anticipatory ? 5 : 0;
  // Escalation (15 pts: Phase 1 call 8 pts + Phase 2 recall 7 pts if applicable)
  if (hasRecallExpected) {
    // Split scoring — aligned with score-engine's computeNumericScoreV2
    if (escalationTiming === "appropriate") totalScore += 8;
    else if (escalationTiming === "early") totalScore += 5;
    else if (escalationTiming === "late") totalScore += 2;
    totalScore += recallPoints;
  } else {
    // All 15 pts to Phase 1
    if (escalationTiming === "appropriate") totalScore += 15;
    else if (escalationTiming === "early") totalScore += 9; // aligned: Math.round(15 * 0.6)
    else if (escalationTiming === "late") totalScore += 5;
  }
  // Lethal triad (10 pts)
  if (lethalTriadManaged) totalScore += 10;
  // Deductions
  totalScore -= harmfulOrders.length * 10;
  totalScore -= hintsUsed * 5;
  totalScore = Math.max(0, Math.min(100, totalScore));

  // M3: Death penalty — patient died → score capped at 40
  if (patientDied) {
    totalScore = Math.min(totalScore, 40);
  }

  // Stars
  let stars: 1 | 2 | 3;
  if (patientDied) {
    stars = 1;
  } else if (totalScore >= 80) {
    stars = 3;
  } else if (totalScore >= 50) {
    stars = 2;
  } else {
    stars = 1;
  }

  return {
    timeToFirstAction,
    correctDiagnosis,
    criticalActions,
    harmfulOrders,
    escalationTiming,
    lethalTriadManaged,
    sbar,
    hintsUsed,
    pauseThinkUsed,
    overall,
    keyLessons,
    stars,
    totalScore,
    patientDied,
  };
}

/** SBAR 內容評分 */
export function computeSBARScore(
  report: Record<string, string> | null
): GameScore["sbar"] {
  if (!report) {
    return {
      completeness: 0,
      prioritization: 0,
      quantitative: false,
      anticipatory: false,
    };
  }

  const text = Object.values(report).join(" ").toLowerCase();
  const hasQuantitative =
    /\d+/.test(text) && (text.includes("cc") || text.includes("mg") || text.includes("mmhg"));
  const hasAnticipatory =
    text.includes("已準備") ||
    text.includes("已經") ||
    text.includes("已開") ||
    text.includes("建議");

  // completeness: 各 SBAR 欄位是否都填
  const sbarFields = ["situation", "background", "assessment", "recommendation"];
  const filled = sbarFields.filter(
    (f) => report[f] && report[f].trim().length > 10
  ).length;
  const completeness = Math.round((filled / sbarFields.length) * 100);

  // prioritization: 是否先說最重要的事
  const situationText = (report["situation"] ?? "").toLowerCase();
  const mentionsCritical =
    situationText.includes("血壓") ||
    situationText.includes("chest tube") ||
    situationText.includes("出血");
  const prioritization = mentionsCritical ? 80 : 40;

  return {
    completeness,
    prioritization,
    quantitative: hasQuantitative,
    anticipatory: hasAnticipatory,
  };
}
