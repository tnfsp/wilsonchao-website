// ICU 值班模擬器 Pro — Score Engine
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
// Internal Constants
// ============================================================

const HINT_PENALTY = 5;          // points deducted per hint used
const PAUSE_THINK_BONUS = 10;    // points added if pause-think was used

// Overall threshold (out of 100)
const EXCELLENT_THRESHOLD = 80;
const GOOD_THRESHOLD = 55;

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
];
const SBAR_R_KEYWORDS = [
  "re-explore", "return to or", "回 or", "transfusion", "輸血",
  "blood product", "vasopressor", "suggest", "recommend", "plan",
  "need", "should", "已經", "i have", "prepared", "準備", "given",
  "已給", "啟動", "mtp",
];

// Escalation timing bands (game minutes) vs severity
// If severity > 70 AND elapsed > 15 min without calling senior → "late"
// If severity > 90 AND elapsed > 10 min → "late"
const ESCALATION_APPROPRIATE_MAX_MINUTES = 15;
const ESCALATION_LATE_SEVERITY_THRESHOLD = 70;
const ESCALATION_CRITICAL_SEVERITY_THRESHOLD = 90;
const ESCALATION_CRITICAL_DEADLINE = 10;

// ============================================================
// Helpers — SBAR Analysis
// ============================================================

function countKeywordHits(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

function hasQuantitativeContent(text: string): boolean {
  const matches = text.match(SBAR_NUMBERS_PATTERN);
  return matches !== null && matches.length >= 2; // at least 2 numbers = quantitative
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
 * Each axis 0-100 except boolean fields.
 */
function scoreSBAR(report: SBARReport): SBARScore {
  const { situation, background, assessment, recommendation } = report;
  const allText = `${situation} ${background} ${assessment} ${recommendation}`;

  // Completeness: each section must have substantive content (> 15 chars)
  const sHits = countKeywordHits(situation, SBAR_S_KEYWORDS);
  const bHits = countKeywordHits(background, SBAR_B_KEYWORDS);
  const aHits = countKeywordHits(assessment, SBAR_A_KEYWORDS);
  const rHits = countKeywordHits(recommendation, SBAR_R_KEYWORDS);

  const sScore = situation.trim().length > 15 ? Math.min(100, 50 + sHits * 10) : 0;
  const bScore = background.trim().length > 15 ? Math.min(100, 50 + bHits * 10) : 0;
  const aScore = assessment.trim().length > 15 ? Math.min(100, 50 + aHits * 15) : 0;
  const rScore = recommendation.trim().length > 15 ? Math.min(100, 50 + rHits * 10) : 0;
  const completeness = Math.round((sScore + bScore + aScore + rScore) / 4);

  // Prioritization: most important info (vitals numbers, diagnosis) should appear
  // in Situation + Assessment (first two sections), not buried in Recommendation
  let prioritization = 50; // baseline

  // Numbers in S or A → good prioritization
  if (hasQuantitativeContent(situation)) prioritization += 20;
  if (hasQuantitativeContent(assessment)) prioritization += 15;
  // If recommendation is way longer than situation, it means the lead is buried
  if (recommendation.length > situation.length * 3) prioritization -= 15;
  // Assessment has diagnosis keywords
  if (aHits >= 1) prioritization += 15;
  prioritization = Math.min(100, Math.max(0, prioritization));

  // Quantitative: does report contain specific numbers?
  const quantitative = hasQuantitativeContent(allText);

  // Anticipatory: player says "I have already ordered / given / prepared..."
  const anticipatory = hasAnticipatoryContent(recommendation) ||
    hasAnticipatoryContent(situation);

  return {
    completeness,
    prioritization,
    quantitative,
    anticipatory,
  };
}

// ============================================================
// Helpers — Critical Actions
// ============================================================

/**
 * Match scenario expected actions against actual player orders.
 * Returns enriched CriticalAction list.
 */
function evaluateCriticalActions(
  expectedActions: ExpectedAction[],
  playerActions: PlayerAction[],
): CriticalAction[] {
  return expectedActions.map((ea): CriticalAction => {
    // Find a matching player action by keyword match on orderName or orderId
    const match = playerActions.find((pa) => {
      const paNameLower = pa.orderName.toLowerCase();
      const eaActionLower = ea.action.toLowerCase();
      const eaDescLower = ea.description.toLowerCase();

      return (
        pa.orderId === ea.id ||
        paNameLower.includes(eaActionLower) ||
        eaActionLower.includes(paNameLower) ||
        paNameLower.includes(eaDescLower.split(" ")[0]) // first word of description
      );
    });

    const met = match !== undefined;
    const timeToComplete = met ? match!.placedAt : null;
    const timedOut = met && timeToComplete !== null && timeToComplete > ea.deadline;

    return {
      id: ea.id,
      description: ea.description,
      met: met && !timedOut,
      timeToComplete: timeToComplete,
      critical: ea.critical,
      hint: ea.hint,
    };
  });
}

// ============================================================
// Helpers — Escalation Timing
// ============================================================

type EscalationTiming = "early" | "appropriate" | "late" | "never";

/**
 * Determine whether the player called for senior help at the right time.
 *
 * Logic:
 * - If player never called → "never"
 * - If called very early (before severity warrants) → "early"
 * - If called within the deadline for the prevailing severity → "appropriate"
 * - Otherwise → "late"
 */
function evaluateEscalationTiming(
  playerActions: PlayerAction[],
  timeline: TimelineEntry[],
  scenario: SimScenario,
): EscalationTiming {
  // Detect senior-call actions
  const escalationAction = playerActions.find(
    (pa) =>
      pa.category === "consult" ||
      pa.orderName.toLowerCase().includes("叫學長") ||
      pa.orderName.toLowerCase().includes("senior") ||
      pa.orderName.toLowerCase().includes("vs") ||
      pa.orderId === "call_senior",
  );

  // Also check timeline messages for "叫學長" text
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

  // Get escalation deadline from expectedActions
  const escalationExpected = scenario.expectedActions.find(
    (ea) =>
      ea.action.toLowerCase().includes("叫學長") ||
      ea.action.toLowerCase().includes("call senior") ||
      ea.id === "call_senior",
  );

  const deadline = escalationExpected?.deadline ?? ESCALATION_APPROPRIATE_MAX_MINUTES;

  // Too early: called in first 2 minutes regardless of severity — minor flag
  if (escalationTime <= 2) return "early";

  // Appropriate: called within deadline
  if (escalationTime <= deadline) return "appropriate";

  // Late
  return "late";
}

// ============================================================
// Helpers — Lethal Triad
// ============================================================

/**
 * Determine if the player managed the lethal triad adequately.
 *
 * Criteria (any two of three must be addressed):
 *   Hypothermia → warming blanket order or blood warmer used
 *   Acidosis    → volume resuscitation (fluid/blood) + vasopressor if needed
 *   Coagulopathy → FFP, Cryo, Platelet, or hemostatics ordered
 */
function evaluateLethalTriadManagement(
  playerActions: PlayerAction[],
): boolean {
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

  const addressedCount = [
    addressedHypothermia,
    addressedAcidosis,
    addressedCoagulopathy,
  ].filter(Boolean).length;

  return addressedCount >= 2;
}

// ============================================================
// Helpers — Diagnosis Check
// ============================================================

function evaluateCorrectDiagnosis(
  playerActions: PlayerAction[],
  timeline: TimelineEntry[],
  scenario: SimScenario,
  sbarReport: SBARReport,
): boolean {
  const correctDx = scenario.debrief.correctDiagnosis.toLowerCase();
  const allPlayerText = [
    ...timeline
      .filter((t) => t.sender === "player")
      .map((t) => t.content),
    sbarReport.assessment,
    sbarReport.situation,
  ]
    .join(" ")
    .toLowerCase();

  // Check if player mentioned the correct diagnosis keywords in text or SBAR
  const dxKeywords = correctDx.split(/[\s_]+/);
  const matchedKeywords = dxKeywords.filter((kw) =>
    kw.length > 3 && allPlayerText.includes(kw),
  );

  return matchedKeywords.length >= Math.ceil(dxKeywords.length * 0.5);
}

// ============================================================
// Helpers — Harmful Orders
// ============================================================

/**
 * Check for obvious harmful order patterns.
 * Returns array of human-readable warning strings.
 */
function detectHarmfulOrders(playerActions: PlayerAction[]): string[] {
  const harmful: string[] = [];

  const actionNames = playerActions.map((pa) => pa.orderName.toLowerCase());

  // Excessive diuresis in actively bleeding patient
  if (
    actionNames.some((n) => n.includes("lasix") || n.includes("furosemide") || n.includes("diuretic")) &&
    actionNames.some((n) => n.includes("prbc") || n.includes("bleeding"))
  ) {
    harmful.push("Diuretic ordered while patient is actively bleeding");
  }

  // High-dose vasopressor without volume (vasopressor without any fluid/blood)
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
    harmful.push("Vasopressor started without concurrent volume resuscitation");
  }

  // Anticoagulation in bleeding scenario
  if (actionNames.some((n) => n.includes("heparin") || n.includes("warfarin") || n.includes("coumadin"))) {
    harmful.push("Anticoagulation ordered in active bleeding scenario");
  }

  // NSAIDs / antiplatelet
  if (actionNames.some((n) => n.includes("aspirin") || n.includes("ibuprofen") || n.includes("ketorolac"))) {
    harmful.push("Antiplatelet / NSAID ordered in bleeding scenario");
  }

  return harmful;
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

/**
 * Evaluate player compliance with guideline bundles defined in the scenario.
 * Maps each bundle item's actionIds to actual player actions to determine completion.
 */
function evaluateGuidelineBundles(
  bundles: GuidelineBundle[] | undefined,
  criticalActions: CriticalAction[],
  playerActions: PlayerAction[],
): GuidelineBundleScore[] {
  if (!bundles || bundles.length === 0) return [];

  return bundles.map((bundle): GuidelineBundleScore => {
    const items: GuidelineBundleItemResult[] = bundle.items.map((item) => {
      // Check if any of the mapped actionIds were completed
      const matchingCritical = criticalActions.filter((ca) =>
        item.actionIds.includes(ca.id),
      );
      const completed = matchingCritical.some((ca) => ca.met);

      // Find the earliest completion time among matching actions
      const completionTimes = matchingCritical
        .filter((ca) => ca.met && ca.timeToComplete !== null)
        .map((ca) => ca.timeToComplete!);
      const completedAt = completionTimes.length > 0
        ? Math.min(...completionTimes)
        : null;

      // Check if within guideline time window
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
    const compliancePercent = bundle.items.length > 0
      ? Math.round((completedItems / bundle.items.length) * 100)
      : 0;

    // Time to complete ALL items (null if not all completed)
    const allCompleted = completedItems === bundle.items.length;
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
      totalItems: bundle.items.length,
      completedItems,
      items,
      compliancePercent,
      timeToCompletion,
    };
  });
}

// ============================================================
// Helpers — Numeric Score (for overall rating)
// ============================================================

function computeNumericScore(
  criticalActions: CriticalAction[],
  sbarScore: SBARScore,
  escalationTiming: EscalationTiming,
  lethalTriadManaged: boolean,
  harmfulOrders: string[],
  hintsUsed: number,
  pauseThinkUsed: boolean,
  correctDiagnosis: boolean,
  timeToFirstAction: number,
): number {
  let score = 0;

  // --- Critical actions (40 pts total) ---
  const totalCritical = criticalActions.filter((ca) => ca.critical).length;
  const metCritical = criticalActions.filter((ca) => ca.critical && ca.met).length;
  const totalBonus = criticalActions.filter((ca) => !ca.critical).length;
  const metBonus = criticalActions.filter((ca) => !ca.critical && ca.met).length;

  if (totalCritical > 0) {
    score += (metCritical / totalCritical) * 30;
  }
  if (totalBonus > 0) {
    score += (metBonus / totalBonus) * 10;
  }

  // --- SBAR (20 pts) ---
  score += (sbarScore.completeness / 100) * 8;
  score += (sbarScore.prioritization / 100) * 5;
  if (sbarScore.quantitative) score += 4;
  if (sbarScore.anticipatory) score += 3;

  // --- Escalation (15 pts) ---
  const escalationPoints: Record<EscalationTiming, number> = {
    appropriate: 15,
    early: 8,
    late: 3,
    never: 0,
  };
  score += escalationPoints[escalationTiming];

  // --- Lethal triad (10 pts) ---
  if (lethalTriadManaged) score += 10;

  // --- Correct diagnosis (5 pts) ---
  if (correctDiagnosis) score += 5;

  // --- Time to first action (5 pts, ≤ 3 min = full) ---
  if (timeToFirstAction <= 3) score += 5;
  else if (timeToFirstAction <= 6) score += 3;
  else if (timeToFirstAction <= 10) score += 1;

  // --- Hint penalty ---
  score -= hintsUsed * HINT_PENALTY;

  // --- Pause think bonus ---
  if (pauseThinkUsed) score += PAUSE_THINK_BONUS;

  // --- Harmful orders penalty (-5 each) ---
  score -= harmfulOrders.length * 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ============================================================
// Main: calculateScore
// ============================================================

/**
 * Calculate the final GameScore for a completed simulation run.
 *
 * @param scenario       - The scenario definition
 * @param playerActions  - All orders/actions placed by the player
 * @param timeline       - Full chat + event timeline
 * @param sbarReport     - SBAR report submitted at handoff
 * @param hintsUsed      - Number of hints used (from store)
 * @param pauseThinkUsed - Whether player used the pause-think feature
 * @param mtpState       - MTP state (to check for unnecessary activation)
 */
export function calculateScore(
  scenario: SimScenario,
  playerActions: PlayerAction[],
  timeline: TimelineEntry[],
  sbarReport: SBARReport,
  hintsUsed: number = 0,
  pauseThinkUsed: boolean = false,
  mtpState?: MTPState,
): GameScore {
  // --- Evaluate each dimension ---
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

  const lethalTriadManaged = evaluateLethalTriadManagement(playerActions);

  const harmfulOrders = detectHarmfulOrders(playerActions);

  const correctDiagnosis = evaluateCorrectDiagnosis(
    playerActions,
    timeline,
    scenario,
    sbarReport,
  );

  const timeToFirstAction = calculateTimeToFirstAction(playerActions);

  // --- Guideline bundle compliance ---
  const guidelineBundleScores = evaluateGuidelineBundles(
    scenario.guidelineBundles,
    criticalActions,
    playerActions,
  );

  // --- Compute numeric score for overall rating ---
  const numericScore = computeNumericScore(
    criticalActions,
    sbar,
    escalationTiming,
    lethalTriadManaged,
    harmfulOrders,
    hintsUsed,
    pauseThinkUsed,
    correctDiagnosis,
    timeToFirstAction,
  );

  const overall: GameScore["overall"] =
    numericScore >= EXCELLENT_THRESHOLD
      ? "excellent"
      : numericScore >= GOOD_THRESHOLD
      ? "good"
      : "needs_improvement";

  const keyLessons = generateKeyLessons(
    {
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
      keyLessons: [], // placeholder; will be filled below
      stars: 1,
      totalScore: numericScore,
      patientDied: false,
    },
    scenario,
  );

  // Calculate stars
  const patientDied = false;
  let stars: 1 | 2 | 3;
  if (patientDied) {
    stars = 1;
  } else if (numericScore >= 80) {
    stars = 3;
  } else if (numericScore >= 50) {
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
    totalScore: numericScore,
    patientDied,
    guidelineBundleScores: guidelineBundleScores.length > 0 ? guidelineBundleScores : undefined,
  };
}

// ============================================================
// generateKeyLessons
// ============================================================

/**
 * Generate personalised teaching points based on the player's score.
 * Returns up to 5 actionable lessons, ordered by priority.
 *
 * @param score    - The computed GameScore
 * @param scenario - The scenario definition (for context + debrief data)
 */
export function generateKeyLessons(
  score: GameScore,
  scenario: SimScenario,
): string[] {
  const lessons: Array<{ priority: number; text: string }> = [];

  // --- Missed critical actions (highest priority) ---
  score.criticalActions
    .filter((ca) => ca.critical && !ca.met)
    .forEach((ca, i) => {
      lessons.push({
        priority: 10 + i,
        text: `⚠️ 關鍵動作未完成：${ca.description}。${ca.hint}`,
      });
    });

  // --- Missed bonus actions ---
  score.criticalActions
    .filter((ca) => !ca.critical && !ca.met)
    .forEach((ca, i) => {
      lessons.push({
        priority: 30 + i,
        text: `💡 加分動作未執行：${ca.description}。${ca.hint}`,
      });
    });

  // --- Escalation ---
  if (score.escalationTiming === "never") {
    lessons.push({
      priority: 5,
      text: `🚨 始終未呼叫學長。在血流動力學不穩定且未改善的情況下，應即時 escalate——「叫學長不丟臉，叫太晚才丟臉。」`,
    });
  } else if (score.escalationTiming === "late") {
    lessons.push({
      priority: 8,
      text: `⏰ Escalation 時機偏晚。Severity 已高但延遲通知學長，可能錯過最佳處置時窗。`,
    });
  } else if (score.escalationTiming === "early") {
    lessons.push({
      priority: 50,
      text: `ℹ️ 叫學長的時機稍早（尚未完成初步評估）。建議先做快速評估再通知，效率更高。`,
    });
  }

  // --- Lethal triad ---
  if (!score.lethalTriadManaged) {
    lessons.push({
      priority: 15,
      text: `❄️ 死亡三角（Hypothermia + Acidosis + Coagulopathy）未完整處理。三者相互惡化，心外術後要主動監測並預防。`,
    });
  }

  // --- SBAR ---
  if (score.sbar.completeness < 60) {
    lessons.push({
      priority: 20,
      text: `📋 SBAR 完整性不足（${score.sbar.completeness}/100）。S/B/A/R 四項皆需實質內容，缺哪一項都會讓 senior 難以判斷。`,
    });
  }
  if (!score.sbar.quantitative) {
    lessons.push({
      priority: 22,
      text: `📊 交班缺乏具體數字（如「CT 280cc/hr、Hb 8.2」）。數字勝過形容詞，「出很多」不如「cumulative 1100cc within 3 hours」。`,
    });
  }
  if (!score.sbar.anticipatory) {
    lessons.push({
      priority: 25,
      text: `🔮 Recommendation 缺少「我已經...」的 anticipatory language。說「我已輸了 2U pRBC、準備第二套」比只報問題更展示臨床主動性。`,
    });
  }
  if (score.sbar.prioritization < 50) {
    lessons.push({
      priority: 27,
      text: `📑 重要資訊未放在前面（Situation 應先說最緊急的發現）。Prioritization 低代表 senior 需要多找才能抓到核心。`,
    });
  }

  // --- Harmful orders ---
  score.harmfulOrders.forEach((ho, i) => {
    lessons.push({
      priority: 3 + i,
      text: `🚫 有害醫囑：${ho}。`,
    });
  });

  // --- Slow to act ---
  if (score.timeToFirstAction > 10) {
    lessons.push({
      priority: 35,
      text: `⏱️ 初步反應偏慢（第一個 order 在第 ${score.timeToFirstAction} 分鐘）。Parallel processing：評估的同時就可以先抽血、給 fluid。`,
    });
  }

  // --- Correct diagnosis ---
  if (!score.correctDiagnosis) {
    lessons.push({
      priority: 18,
      text: `🔍 診斷方向未指向 "${scenario.debrief.correctDiagnosis}"。${scenario.debrief.pitfalls[0] ?? "注意鑑別診斷。"}`,
    });
  }

  // --- Scenario-specific pitfalls (append from debrief) ---
  scenario.debrief.pitfalls.slice(0, 2).forEach((pitfall, i) => {
    lessons.push({
      priority: 60 + i,
      text: `📌 常見陷阱：${pitfall}`,
    });
  });

  // Sort by priority (lower = more important), take top 5
  lessons.sort((a, b) => a.priority - b.priority);
  return lessons.slice(0, 5).map((l) => l.text);
}

// ============================================================
// generateWhatIf
// ============================================================

/**
 * For each WhatIfBranch in the scenario, determine whether the player
 * actually took that path and generate a WhatIfResult for the debrief.
 *
 * @param scenario      - The scenario (contains debrief.whatIf branches)
 * @param playerActions - All player actions
 * @returns Array of WhatIfResult, with branches the player missed first
 */
export function generateWhatIf(
  scenario: SimScenario,
  playerActions: PlayerAction[],
): WhatIfResult[] {
  const actionNames = playerActions.map((pa) => pa.orderName.toLowerCase());
  const actionCategories = playerActions.map((pa) => pa.category.toLowerCase());

  return scenario.debrief.whatIf.map((branch): WhatIfResult => {
    const scenarioLower = branch.scenario.toLowerCase();

    // Heuristic: did player actually walk the branch?
    let playerActuallyTook = false;
    let actualPath: string | undefined;

    if (
      scenarioLower.includes("叫學長") ||
      scenarioLower.includes("call senior") ||
      scenarioLower.includes("escalat")
    ) {
      // Branch = "if you called senior early"
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
      // Branch = "if you only gave fluid without blood"
      const gaveBlood = actionCategories.some((c) => c === "transfusion") ||
        actionNames.some((n) => n.includes("prbc") || n.includes("pRBC"));
      const gaveFluidOnly = actionCategories.some((c) => c === "fluid") && !gaveBlood;

      if (scenarioLower.includes("只給 fluid") || scenarioLower.includes("only fluid")) {
        playerActuallyTook = gaveFluidOnly;
        actualPath = gaveBlood ? "你同時有輸血" : undefined;
      } else {
        // "if you had given blood" → did they give blood?
        playerActuallyTook = gaveBlood;
        actualPath = !gaveBlood ? "你只給了 fluid，未輸血" : undefined;
      }
    } else if (
      scenarioLower.includes("chest tube") ||
      scenarioLower.includes("ct 堵") ||
      scenarioLower.includes("tamponade") ||
      scenarioLower.includes("通 ct") ||
      scenarioLower.includes("milk")
    ) {
      // Branch = chest tube management
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
    } else {
      // Generic fallback: just show the branch without player-path analysis
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
