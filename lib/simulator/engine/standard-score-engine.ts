// ICU Simulator — Standard Mode Score Engine
// Checklist-based scoring (simpler than Pro's percentage-based system).
// Pure function: no side effects, no external dependencies.

import type {
  SimScenario,
  ExpectedAction,
  GuidelineBundle,
  StandardOverlay,
} from "../types";
import type { PlayerAction } from "./score-engine";

// ============================================================
// Public Types
// ============================================================

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  timeCompleted?: number;         // game minutes
  guidelineRef?: string;          // e.g. "SSC 2021: 1 hour antibiotics"
  importance: "critical" | "important" | "bonus";
}

export interface StandardScore {
  totalItems: number;
  completedItems: number;
  items: ChecklistItem[];
  stars: 1 | 2 | 3;
  grade: string;
  guidelineSummary: string;
  patientDied?: boolean;
}

// ============================================================
// Helpers
// ============================================================

/** Normalize an action/order ID for fuzzy matching:
 *  strip "act-" / "preset-" prefixes, strip trailing phase markers (_p2 etc),
 *  replace hyphens with underscores, lowercase. */
function normalizeId(id: string): string {
  return id
    .toLowerCase()
    .replace(/^(act|preset)-/, "")
    .replace(/-/g, "_")
    .replace(/_p\d+$/, ""); // strip phase suffix: _p2, _p3
}

/** Explicit aliases for IDs that can't be matched by normalization alone.
 *  Key = normalized expectedAction ID, Values = player action IDs that satisfy it. */
const ACTION_ALIASES: Record<string, string[]> = {
  // Short IDs (< 4 chars) that fail substring match
  cbc_stat: ["cbc", "cbc_stat"],
  abg_lactate: ["abg", "abg_lactate", "lactate"],
  // Word-order mismatch
  cardiac_pocus: ["pocus_cardiac", "cardiac_pocus"],
  // Category-based: any fluid or blood product counts as volume resuscitation
  volume_resuscitation: ["lr", "ns", "albumin_5", "prbc", "prbc_1u", "prbc_2u", "prbc_4u", "ffp_2u", "ffp_4u"],
  // Phase 2 volume challenge — same fluids/blood
  volume_challenge: ["lr", "ns", "albumin_5", "prbc", "prbc_1u", "prbc_2u", "prbc_4u", "ffp_2u", "ffp_4u"],
};

function matchAction(
  expected: ExpectedAction,
  playerActions: PlayerAction[],
): { matched: boolean; time?: number } {
  const expectedNorm = normalizeId(expected.id);

  const match = playerActions.find((pa) => {
    // 1. Exact ID match (most reliable)
    if (pa.orderId === expected.id) return true;

    const paNorm = normalizeId(pa.orderId);

    // 2. Normalized ID match (handles "call_senior" vs "act-call-senior")
    if (paNorm === expectedNorm) return true;

    // 3. Alias match (handles short IDs, word-order, category-based)
    const aliases = ACTION_ALIASES[expectedNorm];
    if (aliases && aliases.includes(paNorm)) return true;

    // 4. Substring match — only for strings >= 4 chars to avoid
    //    false positives like "epi" matching "norepinephrine"
    if (paNorm.length >= 4 && expectedNorm.length >= 4) {
      if (paNorm.includes(expectedNorm) || expectedNorm.includes(paNorm)) return true;
    }

    const paName = pa.orderName.toLowerCase().trim();
    const eaAction = expected.action.toLowerCase().trim();

    // 5. Exact name match
    if (paName === eaAction) return true;

    // 6. Substring name match (>= 4 chars)
    if (paName.length >= 4 && eaAction.length >= 4) {
      if (paName.includes(eaAction) || eaAction.includes(paName)) return true;
    }

    return false;
  });

  if (!match) return { matched: false };

  const withinDeadline = match.placedAt <= expected.deadline;
  return { matched: withinDeadline, time: match.placedAt };
}

function importanceFromExpected(ea: ExpectedAction): ChecklistItem["importance"] {
  if (ea.critical) return "critical";
  // Bonus items have lenient deadlines (>= 20 min) and are non-critical
  return ea.deadline >= 20 ? "bonus" : "important";
}

function buildGuidelineRef(
  ea: ExpectedAction,
  bundles: GuidelineBundle[] | undefined,
): string | undefined {
  if (!bundles || bundles.length === 0) return undefined;

  for (const bundle of bundles) {
    const item = bundle.items.find((bi) =>
      bi.actionIds.includes(ea.id),
    );
    if (item) {
      return `${bundle.shortName}: ${item.description}`;
    }
  }
  return undefined;
}

function deriveGuidelineSummary(
  bundles: GuidelineBundle[] | undefined,
): string {
  if (!bundles || bundles.length === 0) {
    return "Based on current clinical practice guidelines.";
  }

  const names = bundles.map((b) => b.shortName);
  const sources = bundles.map((b) => b.source);

  if (names.length === 1) {
    return `Based on ${names[0]} (${sources[0]})`;
  }
  return `Based on ${names.join(" / ")} guidelines.`;
}

// ============================================================
// Main: computeStandardScore
// ============================================================

/**
 * Compute a checklist-based score for Standard mode.
 *
 * @param playerActions - All orders/actions placed by the player
 * @param scenario      - The Pro scenario definition (canonical source)
 * @param _overlay      - Standard overlay (reserved for future use)
 * @param patientDied   - Whether the patient died (caps stars at 1)
 */
export function computeStandardScore(
  playerActions: PlayerAction[],
  scenario: SimScenario,
  _overlay?: StandardOverlay,
  patientDied?: boolean,
): StandardScore {
  const items: ChecklistItem[] = scenario.expectedActions.map(
    (ea): ChecklistItem => {
      const { matched, time } = matchAction(ea, playerActions);
      const importance = importanceFromExpected(ea);
      const guidelineRef = buildGuidelineRef(ea, scenario.guidelineBundles);

      return {
        id: ea.id,
        label: ea.description,
        completed: matched,
        timeCompleted: matched ? time : undefined,
        guidelineRef,
        importance,
      };
    },
  );

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;

  const criticalItems = items.filter((i) => i.importance === "critical");
  const importantItems = items.filter((i) => i.importance === "important");

  const allCriticalDone = criticalItems.every((i) => i.completed);
  const importantDoneRatio =
    importantItems.length > 0
      ? importantItems.filter((i) => i.completed).length / importantItems.length
      : 1;

  // Stars: 3 = all critical + >80% important, 2 = all critical, 1 = <all critical
  // Death protection: patient died → cap at 1 star (same as Pro mode)
  let stars: 1 | 2 | 3;
  if (patientDied) {
    stars = 1;
  } else if (allCriticalDone && importantDoneRatio > 0.8) {
    stars = 3;
  } else if (allCriticalDone) {
    stars = 2;
  } else {
    stars = 1;
  }

  const gradeMap: Record<number, string> = { 3: "優秀", 2: "合格", 1: "需加強" };
  const grade = gradeMap[stars];

  const guidelineSummary = deriveGuidelineSummary(scenario.guidelineBundles);

  return {
    totalItems,
    completedItems,
    items,
    stars,
    grade,
    guidelineSummary,
    patientDied: !!patientDied,
  };
}
