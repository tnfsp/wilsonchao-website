// ICU 值班模擬器 Pro — Score Engine v2
// 純函數：無副作用、無外部依賴。
// calculateScore / generateKeyLessons / generateWhatIf

import type {
  SimScenario,
  PlacedOrder,
  TimelineEntry,
  GameScore,
  CriticalAction,
  SBARScore,
  WhatIfBranch,
  ExpectedAction,
  MTPState,
  GuidelineBundle,
  GuidelineBundleScore,
  GuidelineBundleItemResult,
  HarmfulOrderDetail,
  HarmfulOrderDef,
  ScoreBreakdown,
  DiagnosticCategory,
  Pathology,
} from "../types";

// ============================================================
// Public Types
// ============================================================

/** SBAR report filled by the player. */
export interface SBARReport {
  situation: string;   // S
  background: string;  // B
  assessment: string;  // A
  recommendation: string; // R
}

/** Aggregated player action record for scoring. */
export interface PlayerAction {
  orderId: string;        // matches PlacedOrder.id
  orderName: string;      // human-readable
  category: string;       // OrderCategory
  placedAt: number;       // game minutes
  dose?: string;
}

/** What-if result presented to player in debrief. */
export interface WhatIfResult extends WhatIfBranch {
  playerActuallyTook: boolean; // did player walk this branch?
  actualPath?: string;         // what player actually did instead
}

// ============================================================
// Internal Constants — NEW WEIGHTS v2
// ============================================================

const HINT_PENALTY = 5;          // points deducted per hint used
const PAUSE_THINK_BONUS = 5;     // was 10, now 5

// Overall threshold (out of 100)
const EXCELLENT_THRESHOLD = 80;
const GOOD_THRESHOLD = 55;

// Weight allocation (total 100 base)
const WEIGHTS = {
  criticalActions: 30,
  sbar: 15,             // was 20
  escalation: 15,
  lethalTriad: 10,      // now graded: 1/3=3, 2/3=7, 3/3=10
  diagnosticWorkup: 10, // NEW
  diagnosis: 10,        // was 5
  bonusActions: 5,      // was 10
  timeToFirst: 5,
} as const;

// SBAR keyword banks
const SBAR_NUMBERS_PATTERN = /\d+(\.\d+)?/g;

const SBAR_S_KEYWORDS = [
  "bed", "bed ", "病人", "chest tube", "ct", "blood pressure", "bp",
  "hr", "heart rate", "出血", "血壓", "掉", "deteriorat",
];
const SBAR_B_KEYWORDS = [
  "post", "術後", "history", "病史", "allergies", "過敏", "surgery",
  "day", "prior", "previously", "baseline", "medication", "药", "手術",
];
const SBAR_A_KEYWORDS = [
  "surgical bleeding", "外科出血", "coagulopathy", "tamponade", "lcos",
  "suspect", "likely", "assessment", "impression", "think", "believe",
  "judge", "diagnosis", "diagnosis", "判斷", "評估", "可能",
  "sepsis", "septic", "infection", "感染", "敗血",
];
const SBAR_R_KEYWORDS = [
  "re-explore", "return to or", "回 or", "transfusion", "輸血",
  "blood product", "vasopressor", "suggest", "recommend", "plan",
  "need", "should", "已經", "i have", "prepared", "準備", "given",
  "已給", "啟動", "mtp", "antibiotics", "抗生素",
];

// Escalation timing bands (game minutes) vs severity
const ESCALATION_APPROPRIATE_MAX_MINUTES = 15;

// ============================================================
// Helpers — SBAR Analysis
// ============================================================

function countKeywordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

function hasQuantitativeContent(text: string): boolean {
  const matches = text.match(SBAR_NUMBERS_PATTERN);
  return matches !== null && matches.length >= 2;
}

function hasAnticipatoryContent(text: string): boolean {
  const anticipatoryPhrases = [
    "已經", "已給", "準備", "i have", "i've", "i already",
    "already given", "already ordered", "we have", "prepared",
    "started", "啟動了", "given", "administered", "placed",
  ];
  const lower = text.toLowerCase();
  return anticipatoryPhrases.some((p) => lower.includes(p));
}

/**
 * Score an SBAR report on four axes.
 */
function scoreSBAR(report: SBARReport): SBARScore {
  const { situation, background, assessment, recommendation } = report;
  const allText = `${situation} ${background} ${assessment} ${recommendation}`;

  const sHits = countKeywordHits(situation, SBAR_S_KEYWORDS);
  const bHits = countKeywordHits(background, SBAR_B_KEYWORDS);
  const aHits = countKeywordHits(assessment, SBAR_A_KEYWORDS);
  const rHits = countKeywordHits(recommendation, SBAR_R_KEYWORDS);

  const sScore = situation.trim().length > 15 ? Math.min(100, 50 + sHits * 10) : 0;
  const bScore = background.trim().length > 15 ? Math.min(100, 50 + bHits * 10) : 0;
  const aScore = assessment.trim().length > 15 ? Math.min(100, 50 + aHits * 15) : 0;
  const rScore = recommendation.trim().length > 15 ? Math.min(100, 50 + rHits * 10) : 0;
  const completeness = Math.round((sScore + bScore + aScore + rScore) / 4);

  let prioritization = 50;
  if (hasQuantitativeContent(situation)) prioritization += 20;
  if (hasQuantitativeContent(assessment)) prioritization += 15;
  if (recommendation.length > situation.length * 3) prioritization -= 15;
  if (aHits >= 1) prioritization += 15;
  prioritization = Math.min(100, Math.max(0, prioritization));

  const quantitative = hasQuantitativeContent(allText);
  const anticipatory = hasAnticipatoryContent(recommendation) ||
    hasAnticipatoryContent(situation);

  return { completeness, prioritization, quantitative, anticipatory };
}

// ============================================================
// Helpers — Critical Actions
// ============================================================

function evaluateCriticalActions(
  expectedActions: ExpectedAction[],
  playerActions: PlayerAction[],
): CriticalAction[] {
  return expectedActions.map((ea): CriticalAction => {
    const match = playerActions.find((pa) => {
      const paNameLower = pa.orderName.toLowerCase();
      const eaActionLower = ea.action.toLowerCase();
      const eaDescLower = ea.description.toLowerCase();

      return (
        pa.orderId === ea.id ||
        paNameLower.includes(eaActionLower) ||
        eaActionLower.includes(paNameLower) ||
        paNameLower.includes(eaDescLower.split(" ")[0])
      );
    });

    const met = match !== undefined;
    const timeToComplete = met ? match!.placedAt : null;
    const timedOut = met && timeToComplete !== null && timeToComplete > ea.deadline;

    return {
      id: ea.id,
      description: ea.description,
      met: met && !timedOut,
      timeToComplete,
      critical: ea.critical,
      hint: ea.hint,
    };
  });
}

// ============================================================
// Helpers — Escalation Timing
// ============================================================

type EscalationTiming = "early" | "appropriate" | "late" | "never";

function evaluateEscalationTiming(
  playerActions: PlayerAction[],
  timeline: TimelineEntry[],
  scenario: SimScenario,
): EscalationTiming {
  const escalationAction = playerActions.find(
    (pa) =>
      pa.category === "consult" ||
      pa.orderName.toLowerCase().includes("叫學長") ||
      pa.orderName.toLowerCase().includes("senior") ||
      pa.orderName.toLowerCase().includes("vs") ||
      pa.orderId === "call_senior",
  );

  const escalationMessage = timeline.find(
    (t) =>
      t.type === "player_action" &&
      (t.content.toLowerCase().includes("叫學長") ||
        t.content.toLowerCase().includes("call senior") ||
        t.content.toLowerCase().includes("notify vs")),
  );

  const escalationTime =
    escalationAction?.placedAt ??
    escalationMessage?.gameTime ??
    null;

  if (escalationTime === null) return "never";

  const escalationExpected = scenario.expectedActions.find(
    (ea) =>
      ea.action.toLowerCase().includes("叫學長") ||
      ea.action.toLowerCase().includes("call senior") ||
      ea.id === "call_senior" ||
      ea.id === "act-call-senior",
  );

  const deadline = escalationExpected?.deadline ?? ESCALATION_APPROPRIATE_MAX_MINUTES;

  if (escalationTime <= 2) return "early";
  if (escalationTime <= deadline) return "appropriate";
  return "late";
}

/** Evaluate Phase 2 recall timing (B2T scenario: re-calling senior after situation changes). */
function evaluateRecallTiming(
  playerActions: PlayerAction[],
  scenario: SimScenario,
): EscalationTiming {
  // Only applicable if scenario has recall action
  const recallExpected = scenario.expectedActions.find(
    (ea) => ea.id === "act-recall-senior",
  );
  if (!recallExpected) return "appropriate"; // no recall expected → neutral

  const recallAction = playerActions.find(
    (pa) =>
      pa.orderId === "recall_senior" ||
      pa.orderName.toLowerCase().includes("recall") ||
      pa.orderName.toLowerCase().includes("再叫") ||
      pa.orderName.toLowerCase().includes("叫回來"),
  );

  if (!recallAction) return "never";

  const deadline = recallExpected.deadline ?? 28;
  if (recallAction.placedAt <= deadline) return "appropriate";
  return "late";
}

// ============================================================
// Helpers — Lethal Triad (GRADED: 1/3=3, 2/3=7, 3/3=10)
// ============================================================

function evaluateLethalTriadCount(
  playerActions: PlayerAction[],
): number {
  const actionNames = playerActions.map((pa) => pa.orderName.toLowerCase());
  const actionCategories = playerActions.map((pa) => pa.category.toLowerCase());

  const addressedHypothermia =
    actionNames.some((n) => n.includes("warming") || n.includes("blood warmer") || n.includes("warm"));

  const addressedAcidosis =
    actionCategories.some((c) => c === "fluid" || c === "transfusion") &&
    actionNames.some((n) =>
      n.includes("ns") || n.includes("lr") || n.includes("prbc") ||
      n.includes("fluid") || n.includes("bolus"),
    );

  const addressedCoagulopathy =
    actionCategories.some((c) => c === "transfusion" || c === "hemostatic") &&
    actionNames.some((n) =>
      n.includes("ffp") || n.includes("cryo") || n.includes("platelet") ||
      n.includes("txa") || n.includes("tranexamic") || n.includes("protamine"),
    );

  return [addressedHypothermia, addressedAcidosis, addressedCoagulopathy].filter(Boolean).length;
}

function getLethalTriadScore(count: number): number {
  if (count >= 3) return 10;
  if (count >= 2) return 7;
  if (count >= 1) return 3;
  return 0;
}

// ============================================================
// Helpers — Diagnostic Workup Quality (NEW)
// ============================================================

/**
 * Score based on breadth of diagnostic categories covered.
 * (unique categories done / total categories expected) * 10
 */
function evaluateDiagnosticWorkup(
  scenario: SimScenario,
  criticalActions: CriticalAction[],
): number {
  // Collect expected categories from all expectedActions that have a diagnosticCategory
  const expectedCategories = new Set<DiagnosticCategory>();
  scenario.expectedActions.forEach((ea) => {
    if (ea.diagnosticCategory) {
      expectedCategories.add(ea.diagnosticCategory);
    }
  });

  if (expectedCategories.size === 0) return 10; // no categories defined → full marks

  // Which categories did the player actually complete?
  const doneCategories = new Set<DiagnosticCategory>();
  scenario.expectedActions.forEach((ea) => {
    if (ea.diagnosticCategory) {
      const ca = criticalActions.find((c) => c.id === ea.id);
      if (ca?.met) {
        doneCategories.add(ea.diagnosticCategory);
      }
    }
  });

  return Math.round((doneCategories.size / expectedCategories.size) * 10);
}

// ============================================================
// Helpers — Phase-Aware Correct Diagnosis
// ============================================================

/**
 * For multi-phase scenarios (e.g. bleeding → tamponade), determine the
 * correct diagnosis based on where the patient actually is.
 *
 * - If patient is still in Phase 1 (pathology hasn't changed from initial),
 *   the correct diagnosis is the initial pathology (e.g. "surgical bleeding"),
 *   NOT the final debrief diagnosis (e.g. "cardiac tamponade").
 * - If patient progressed to Phase 2+, use the debrief correctDiagnosis.
 */
function getPhaseAwareCorrectDiagnosis(
  scenario: SimScenario,
  currentPathology?: Pathology,
): string {
  // Single-phase scenario or no pathology info → use debrief as-is
  if (!scenario.phasedFindings || !currentPathology) {
    return scenario.debrief.correctDiagnosis;
  }

  // Multi-phase: if pathology hasn't changed from the initial scenario pathology,
  // the patient is still in Phase 1
  if (currentPathology === scenario.pathology) {
    // Map known initial pathologies to human-readable diagnosis strings
    const initialPathologyDiagnosis: Partial<Record<Pathology, string>> = {
      surgical_bleeding: "Surgical bleeding — post-cardiac surgery hemorrhagic shock",
      coagulopathy: "Coagulopathy — post-cardiac surgery bleeding",
      septic_shock: "Septic shock",
    };
    return initialPathologyDiagnosis[scenario.pathology]
      ?? scenario.pathology.replace(/_/g, " ");
  }

  // Patient progressed to Phase 2+ → use the final debrief correctDiagnosis
  return scenario.debrief.correctDiagnosis;
}

// ============================================================
// Helpers — Diagnosis Check
// ============================================================

function evaluateCorrectDiagnosis(
  playerActions: PlayerAction[],
  timeline: TimelineEntry[],
  scenario: SimScenario,
  sbarReport: SBARReport,
  currentPathology?: Pathology,
): boolean {
  const correctDx = getPhaseAwareCorrectDiagnosis(scenario, currentPathology).toLowerCase();
  const allPlayerText = [
    ...timeline
      .filter((t) => t.sender === "player")
      .map((t) => t.content),
    sbarReport.assessment,
    sbarReport.situation,
  ]
    .join(" ")
    .toLowerCase();

  const dxKeywords = correctDx.split(/[\s_]+/);
  const matchedKeywords = dxKeywords.filter((kw) =>
    kw.length > 3 && allPlayerText.includes(kw),
  );

  return matchedKeywords.length >= Math.ceil(dxKeywords.length * 0.5);
}

// ============================================================
// Helpers — Harmful Orders (GRADED: critical=-15, moderate=-5)
// ============================================================

/**
 * Detect harmful orders. Returns both legacy string[] and graded details.
 */
function detectHarmfulOrders(
  playerActions: PlayerAction[],
  scenarioHarmfulDefs?: HarmfulOrderDef[],
): { descriptions: string[]; details: HarmfulOrderDetail[] } {
  const details: HarmfulOrderDetail[] = [];
  const actionNames = playerActions.map((pa) => pa.orderName.toLowerCase());

  // Check scenario-specific harmful order definitions first
  if (scenarioHarmfulDefs) {
    for (const def of scenarioHarmfulDefs) {
      const patternLower = def.pattern.toLowerCase();
      if (actionNames.some((n) => n.includes(patternLower))) {
        details.push({
          description: def.description,
          severity: def.severity,
          penalty: def.penalty,
        });
      }
    }
  }

  // Built-in harmful patterns (only add if not already matched by scenario defs)
  const existingDescs = new Set(details.map((d) => d.description));

  // Anticoagulation in bleeding scenario
  if (actionNames.some((n) => n.includes("heparin") || n.includes("warfarin") || n.includes("coumadin"))) {
    const desc = "Anticoagulation ordered in active bleeding scenario";
    if (!existingDescs.has(desc)) {
      details.push({ description: desc, severity: "critical", penalty: -15 });
    }
  }

  // Diuretic while bleeding
  if (
    actionNames.some((n) => n.includes("lasix") || n.includes("furosemide") || n.includes("diuretic")) &&
    actionNames.some((n) => n.includes("prbc") || n.includes("bleeding"))
  ) {
    const desc = "Diuretic ordered while patient is actively bleeding";
    if (!existingDescs.has(desc)) {
      details.push({ description: desc, severity: "moderate", penalty: -5 });
    }
  }

  // Vasopressor without volume
  const hasVasopressor = actionNames.some(
    (n) =>
      n.includes("levophed") ||
      n.includes("norepinephrine") ||
      n.includes("epinephrine") ||
      n.includes("vasopressin"),
  );
  const hasVolumeResuscitation = playerActions.some(
    (pa) => pa.category === "fluid" || pa.category === "transfusion",
  );
  if (hasVasopressor && !hasVolumeResuscitation) {
    const desc = "Vasopressor started without concurrent volume resuscitation";
    if (!existingDescs.has(desc)) {
      details.push({ description: desc, severity: "moderate", penalty: -5 });
    }
  }

  // NSAIDs / antiplatelet
  if (actionNames.some((n) => n.includes("aspirin") || n.includes("ibuprofen") || n.includes("ketorolac"))) {
    const desc = "Antiplatelet / NSAID ordered in bleeding scenario";
    if (!existingDescs.has(desc)) {
      details.push({ description: desc, severity: "moderate", penalty: -5 });
    }
  }

  return {
    descriptions: details.map((d) => d.description),
    details,
  };
}

// ============================================================
// Helpers — Time to First Action
// ============================================================

function calculateTimeToFirstAction(playerActions: PlayerAction[]): number {
  if (playerActions.length === 0) return 999;
  return Math.min(...playerActions.map((pa) => pa.placedAt));
}

// ============================================================
// Helpers — Guideline Bundle Compliance
// ============================================================

function evaluateGuidelineBundles(
  bundles: GuidelineBundle[] | undefined,
  criticalActions: CriticalAction[],
  playerActions: PlayerAction[],
): GuidelineBundleScore[] {
  if (!bundles || bundles.length === 0) return [];

  return bundles.map((bundle): GuidelineBundleScore => {
    const scorableItems = bundle.items.filter((item) => !item.informational);
    const items: GuidelineBundleItemResult[] = scorableItems.map((item) => {
      const matchingCritical = criticalActions.filter((ca) =>
        item.actionIds.includes(ca.id),
      );
      const completed = matchingCritical.some((ca) => ca.met);

      const completionTimes = matchingCritical
        .filter((ca) => ca.met && ca.timeToComplete !== null)
        .map((ca) => ca.timeToComplete!);
      const completedAt = completionTimes.length > 0
        ? Math.min(...completionTimes)
        : null;

      const withinTimeWindow = item.timeWindow
        ? completed && completedAt !== null && completedAt <= item.timeWindow
        : completed;

      return {
        id: item.id,
        description: item.description,
        completed,
        completedAt,
        withinTimeWindow,
        evidenceLevel: item.evidenceLevel,
      };
    });

    const completedItems = items.filter((i) => i.completed).length;
    const compliancePercent = scorableItems.length > 0
      ? Math.round((completedItems / scorableItems.length) * 100)
      : 0;

    const allCompleted = completedItems === scorableItems.length;
    const allTimes = items
      .filter((i) => i.completedAt !== null)
      .map((i) => i.completedAt!);
    const timeToCompletion = allCompleted && allTimes.length > 0
      ? Math.max(...allTimes)
      : null;

    return {
      bundleId: bundle.id,
      bundleName: bundle.shortName,
      source: bundle.source,
      url: bundle.url,
      totalItems: scorableItems.length,
      completedItems,
      items,
      compliancePercent,
      timeToCompletion,
    };
  });
}

// ============================================================
// Helpers — Numeric Score v2 (with ScoreBreakdown)
// ============================================================

function computeNumericScoreV2(
  criticalActions: CriticalAction[],
  sbarScore: SBARScore,
  escalationTiming: EscalationTiming,
  lethalTriadCount: number,
  harmfulDetails: HarmfulOrderDetail[],
  hintsUsed: number,
  pauseThinkUsed: boolean,
  correctDiagnosis: boolean,
  timeToFirstAction: number,
  diagnosticWorkupScore: number,
  recallTiming: EscalationTiming = "appropriate",
): { total: number; breakdown: ScoreBreakdown } {
  // --- Critical actions (30 pts) ---
  const totalCritical = criticalActions.filter((ca) => ca.critical).length;
  const metCritical = criticalActions.filter((ca) => ca.critical && ca.met).length;
  const criticalEarned = totalCritical > 0
    ? Math.round((metCritical / totalCritical) * WEIGHTS.criticalActions)
    : WEIGHTS.criticalActions;

  // --- Bonus actions (5 pts) ---
  const totalBonus = criticalActions.filter((ca) => !ca.critical).length;
  const metBonus = criticalActions.filter((ca) => !ca.critical && ca.met).length;
  const bonusEarned = totalBonus > 0
    ? Math.round((metBonus / totalBonus) * WEIGHTS.bonusActions)
    : 0;

  // --- SBAR (15 pts) ---
  const sbarEarned = Math.round(
    (sbarScore.completeness / 100) * 6 +
    (sbarScore.prioritization / 100) * 4 +
    (sbarScore.quantitative ? 3 : 0) +
    (sbarScore.anticipatory ? 2 : 0),
  );

  // --- Escalation (15 pts total: Phase 1 call 8 pts + Phase 2 recall 7 pts) ---
  const hasRecallAction = recallTiming !== "appropriate" || criticalActions.some(
    (ca) => ca.id === "act-recall-senior"
  );
  const phase1Max = hasRecallAction ? 8 : 15; // no recall expected → all 15 pts to Phase 1
  const phase2Max = hasRecallAction ? 7 : 0;

  const escalationPointsP1: Record<EscalationTiming, number> = {
    appropriate: phase1Max,
    early: Math.round(phase1Max * 0.6),
    late: Math.round(phase1Max * 0.2),
    never: 0,
  };
  const recallPointsP2: Record<EscalationTiming, number> = {
    appropriate: phase2Max,
    early: phase2Max,
    late: Math.round(phase2Max * 0.4),
    never: 0,
  };
  const escalationEarned = escalationPointsP1[escalationTiming] + recallPointsP2[recallTiming];

  // --- Lethal triad (10 pts, graded) ---
  const lethalTriadEarned = getLethalTriadScore(lethalTriadCount);

  // --- Diagnostic workup (10 pts) ---
  const diagnosticEarned = diagnosticWorkupScore;

  // --- Diagnosis (10 pts) ---
  const diagnosisEarned = correctDiagnosis ? WEIGHTS.diagnosis : 0;

  // --- Time to first action (5 pts) ---
  let timeEarned = 0;
  if (timeToFirstAction <= 3) timeEarned = 5;
  else if (timeToFirstAction <= 6) timeEarned = 3;
  else if (timeToFirstAction <= 10) timeEarned = 1;

  // --- Pause think bonus (+5) ---
  const pauseBonus = pauseThinkUsed ? PAUSE_THINK_BONUS : 0;

  // --- Hint penalty (-5 each) ---
  const hintPen = hintsUsed * HINT_PENALTY;

  // --- Harmful orders penalty (graded) ---
  const harmfulPen = Math.abs(harmfulDetails.reduce((sum, d) => sum + d.penalty, 0));

  const rawScore =
    criticalEarned + bonusEarned + sbarEarned + escalationEarned +
    lethalTriadEarned + diagnosticEarned + diagnosisEarned + timeEarned +
    pauseBonus - hintPen - harmfulPen;

  const total = Math.min(100, Math.max(0, Math.round(rawScore)));

  const breakdown: ScoreBreakdown = {
    criticalActions: { earned: criticalEarned, max: WEIGHTS.criticalActions },
    sbar: { earned: sbarEarned, max: WEIGHTS.sbar },
    escalation: { earned: escalationEarned, max: WEIGHTS.escalation },
    lethalTriad: { earned: lethalTriadEarned, max: WEIGHTS.lethalTriad },
    diagnosticWorkup: { earned: diagnosticEarned, max: WEIGHTS.diagnosticWorkup },
    diagnosis: { earned: diagnosisEarned, max: WEIGHTS.diagnosis },
    bonusActions: { earned: bonusEarned, max: WEIGHTS.bonusActions },
    timeToFirst: { earned: timeEarned, max: WEIGHTS.timeToFirst },
    pauseThinkBonus: pauseBonus,
    hintPenalty: -hintPen,
    harmfulOrderPenalty: -harmfulPen,
  };

  return { total, breakdown };
}

// ============================================================
// Stars — v2
// ============================================================

function getStars(score: number, patientDied: boolean, missedCriticalCount: number): 1 | 2 | 3 {
  if (patientDied) return 1;
  if (score >= 80 && missedCriticalCount === 0) return 3;
  if (score >= 60) return 2;
  return 1;
}

// ============================================================
// Main: calculateScore
// ============================================================

/**
 * Calculate the final GameScore for a completed simulation run.
 */
export function calculateScore(
  scenario: SimScenario,
  playerActions: PlayerAction[],
  timeline: TimelineEntry[],
  sbarReport: SBARReport,
  hintsUsed: number = 0,
  pauseThinkUsed: boolean = false,
  mtpState?: MTPState,
  patientDied: boolean = false,
  currentPathology?: Pathology,
): GameScore {
  const criticalActions = evaluateCriticalActions(
    scenario.expectedActions,
    playerActions,
  );

  const sbar = scoreSBAR(sbarReport);

  const escalationTiming = evaluateEscalationTiming(
    playerActions,
    timeline,
    scenario,
  );

  const recallTiming = evaluateRecallTiming(playerActions, scenario);

  const lethalTriadCount = evaluateLethalTriadCount(playerActions);
  const lethalTriadManaged = lethalTriadCount >= 2;

  const { descriptions: harmfulOrders, details: harmfulOrderDetails } =
    detectHarmfulOrders(playerActions);

  const correctDiagnosis = evaluateCorrectDiagnosis(
    playerActions,
    timeline,
    scenario,
    sbarReport,
    currentPathology,
  );

  const timeToFirstAction = calculateTimeToFirstAction(playerActions);

  const diagnosticWorkupScore = evaluateDiagnosticWorkup(scenario, criticalActions);

  const guidelineBundleScores = evaluateGuidelineBundles(
    scenario.guidelineBundles,
    criticalActions,
    playerActions,
  );

  const { total: numericScore, breakdown } = computeNumericScoreV2(
    criticalActions,
    sbar,
    escalationTiming,
    lethalTriadCount,
    harmfulOrderDetails,
    hintsUsed,
    pauseThinkUsed,
    correctDiagnosis,
    timeToFirstAction,
    diagnosticWorkupScore,
    recallTiming,
  );

  const overall: GameScore["overall"] =
    numericScore >= EXCELLENT_THRESHOLD
      ? "excellent"
      : numericScore >= GOOD_THRESHOLD
      ? "good"
      : "needs_improvement";

  const missedCriticalCount = criticalActions.filter((ca) => ca.critical && !ca.met).length;

  const keyLessons = generateKeyLessons(
    {
      timeToFirstAction,
      correctDiagnosis,
      criticalActions,
      harmfulOrders,
      harmfulOrderDetails,
      escalationTiming,
      lethalTriadManaged,
      lethalTriadCount,
      diagnosticWorkupScore,
      sbar,
      hintsUsed,
      pauseThinkUsed,
      overall,
      keyLessons: [],
      stars: 1,
      totalScore: numericScore,
      patientDied,
      scoreBreakdown: breakdown,
    },
    scenario,
    currentPathology,
  );

  const stars = getStars(numericScore, patientDied, missedCriticalCount);

  return {
    timeToFirstAction,
    correctDiagnosis,
    criticalActions,
    harmfulOrders,
    harmfulOrderDetails,
    escalationTiming,
    lethalTriadManaged,
    lethalTriadCount,
    diagnosticWorkupScore,
    sbar,
    hintsUsed,
    pauseThinkUsed,
    overall,
    keyLessons,
    stars,
    totalScore: numericScore,
    patientDied,
    guidelineBundleScores: guidelineBundleScores.length > 0 ? guidelineBundleScores : undefined,
    scoreBreakdown: breakdown,
  };
}

// ============================================================
// generateKeyLessons
// ============================================================

export function generateKeyLessons(
  score: GameScore,
  scenario: SimScenario,
  currentPathology?: Pathology,
): string[] {
  const lessons: Array<{ priority: number; text: string }> = [];

  // --- Missed critical actions (highest priority) ---
  score.criticalActions
    .filter((ca) => ca.critical && !ca.met)
    .forEach((ca, i) => {
      lessons.push({
        priority: 10 + i,
        text: `關鍵動作未完成：${ca.description}。${ca.hint}`,
      });
    });

  // --- Missed bonus actions ---
  score.criticalActions
    .filter((ca) => !ca.critical && !ca.met)
    .forEach((ca, i) => {
      lessons.push({
        priority: 30 + i,
        text: `加分動作未執行：${ca.description}。${ca.hint}`,
      });
    });

  // --- Escalation ---
  if (score.escalationTiming === "never") {
    lessons.push({
      priority: 5,
      text: `始終未呼叫學長。在血流動力學不穩定且未改善的情況下，應即時 escalate——「叫學長不丟臉，叫太晚才丟臉。」`,
    });
  } else if (score.escalationTiming === "late") {
    lessons.push({
      priority: 8,
      text: `Escalation 時機偏晚。Severity 已高但延遲通知學長，可能錯過最佳處置時窗。`,
    });
  } else if (score.escalationTiming === "early") {
    lessons.push({
      priority: 50,
      text: `叫學長的時機稍早（尚未完成初步評估）。建議先做快速評估再通知，效率更高。`,
    });
  }

  // --- Lethal triad ---
  if (!score.lethalTriadManaged) {
    lessons.push({
      priority: 15,
      text: `死亡三角（Hypothermia + Acidosis + Coagulopathy）未完整處理。三者相互惡化，心外術後要主動監測並預防。`,
    });
  }

  // --- SBAR ---
  if (score.sbar.completeness < 60) {
    lessons.push({
      priority: 20,
      text: `SBAR 完整性不足（${score.sbar.completeness}/100）。S/B/A/R 四項皆需實質內容，缺哪一項都會讓 senior 難以判斷。`,
    });
  }
  if (!score.sbar.quantitative) {
    lessons.push({
      priority: 22,
      text: `交班缺乏具體數字。數字勝過形容詞，「出很多」不如「cumulative 1100cc within 3 hours」。`,
    });
  }
  if (!score.sbar.anticipatory) {
    lessons.push({
      priority: 25,
      text: `Recommendation 缺少「我已經...」的 anticipatory language。說「我已輸了 2U pRBC、準備第二套」比只報問題更展示臨床主動性。`,
    });
  }

  // --- Harmful orders ---
  score.harmfulOrders.forEach((ho, i) => {
    lessons.push({
      priority: 3 + i,
      text: `有害醫囑：${ho}。`,
    });
  });

  // --- Slow to act ---
  if (score.timeToFirstAction > 10) {
    lessons.push({
      priority: 35,
      text: `初步反應偏慢（第一個 order 在第 ${score.timeToFirstAction} 分鐘）。Parallel processing：評估的同時就可以先抽血、給 fluid。`,
    });
  }

  // --- Correct diagnosis ---
  if (!score.correctDiagnosis) {
    const phaseAwareDx = getPhaseAwareCorrectDiagnosis(scenario, currentPathology);
    lessons.push({
      priority: 18,
      text: `診斷方向未指向 "${phaseAwareDx}"。${scenario.debrief.pitfalls[0] ?? "注意鑑別診斷。"}`,
    });
  }

  // --- Scenario-specific pitfalls ---
  scenario.debrief.pitfalls.slice(0, 2).forEach((pitfall, i) => {
    lessons.push({
      priority: 60 + i,
      text: `常見陷阱：${pitfall}`,
    });
  });

  lessons.sort((a, b) => a.priority - b.priority);
  return lessons.slice(0, 5).map((l) => l.text);
}

// ============================================================
// generateWhatIf
// ============================================================

export function generateWhatIf(
  scenario: SimScenario,
  playerActions: PlayerAction[],
): WhatIfResult[] {
  const actionNames = playerActions.map((pa) => pa.orderName.toLowerCase());
  const actionCategories = playerActions.map((pa) => pa.category.toLowerCase());

  return scenario.debrief.whatIf.map((branch): WhatIfResult => {
    const scenarioLower = branch.scenario.toLowerCase();

    let playerActuallyTook = false;
    let actualPath: string | undefined;

    if (
      scenarioLower.includes("叫學長") ||
      scenarioLower.includes("call senior") ||
      scenarioLower.includes("escalat")
    ) {
      playerActuallyTook = playerActions.some(
        (pa) =>
          pa.category === "consult" ||
          pa.orderName.toLowerCase().includes("叫學長") ||
          pa.orderId === "call_senior",
      );
      if (!playerActuallyTook) {
        actualPath = "你沒有叫學長（或叫得較晚）";
      }
    } else if (
      scenarioLower.includes("fluid") ||
      scenarioLower.includes("輸血") ||
      scenarioLower.includes("血") ||
      scenarioLower.includes("transfusion")
    ) {
      const gaveBlood = actionCategories.some((c) => c === "transfusion") ||
        actionNames.some((n) => n.includes("prbc") || n.includes("pRBC"));
      const gaveFluidOnly = actionCategories.some((c) => c === "fluid") && !gaveBlood;

      if (scenarioLower.includes("只給 fluid") || scenarioLower.includes("only fluid")) {
        playerActuallyTook = gaveFluidOnly;
        actualPath = gaveBlood ? "你同時有輸血" : undefined;
      } else {
        playerActuallyTook = gaveBlood;
        actualPath = !gaveBlood ? "你只給了 fluid，未輸血" : undefined;
      }
    } else if (
      scenarioLower.includes("chest tube") ||
      scenarioLower.includes("ct 堵") ||
      scenarioLower.includes("tamponade") ||
      scenarioLower.includes("通 ct") ||
      scenarioLower.includes("milk") ||
      scenarioLower.includes("strip")
    ) {
      playerActuallyTook = actionNames.some(
        (n) => n.includes("milk") || n.includes("strip") || n.includes("chest tube"),
      );
      actualPath = !playerActuallyTook ? "你沒有執行 milk/strip CT" : undefined;
    } else if (
      scenarioLower.includes("mtp") ||
      scenarioLower.includes("massive transfusion")
    ) {
      playerActuallyTook = actionCategories.some((c) => c === "mtp") ||
        actionNames.some((n) => n.includes("mtp"));
      actualPath = !playerActuallyTook ? "你沒有啟動 MTP" : undefined;
    } else if (
      scenarioLower.includes("sepsis") ||
      scenarioLower.includes("hour-1") ||
      scenarioLower.includes("bundle") ||
      scenarioLower.includes("辨識")
    ) {
      // Sepsis early recognition branch
      const earlyAbx = playerActions.some(
        (pa) => pa.orderName.toLowerCase().includes("antibiotic") ||
          pa.orderName.toLowerCase().includes("vancomycin") ||
          pa.orderName.toLowerCase().includes("tazocin") ||
          pa.orderName.toLowerCase().includes("piperacillin"),
      );
      playerActuallyTook = earlyAbx;
      actualPath = !earlyAbx ? "你沒有在第一時間啟動 sepsis bundle" : undefined;
    } else if (
      scenarioLower.includes("source") ||
      scenarioLower.includes("wound") ||
      scenarioLower.includes("pericardiocentesis")
    ) {
      playerActuallyTook = false;
      actualPath = undefined;
    } else {
      playerActuallyTook = false;
      actualPath = undefined;
    }

    return {
      ...branch,
      playerActuallyTook,
      actualPath,
    };
  });
}
