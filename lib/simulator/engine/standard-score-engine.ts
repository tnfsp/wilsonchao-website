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
}

// ============================================================
// Helpers
// ============================================================

function matchAction(
  expected: ExpectedAction,
  playerActions: PlayerAction[],
): { matched: boolean; time?: number } {
  const match = playerActions.find((pa) => {
    const paName = pa.orderName.toLowerCase();
    const eaAction = expected.action.toLowerCase();
    const eaDesc = expected.description.toLowerCase();

    return (
      pa.orderId === expected.id ||
      paName.includes(eaAction) ||
      eaAction.includes(paName) ||
      paName.includes(eaDesc.split(" ")[0])
    );
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
 */
export function computeStandardScore(
  playerActions: PlayerAction[],
  scenario: SimScenario,
  _overlay?: StandardOverlay,
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
  let stars: 1 | 2 | 3;
  if (allCriticalDone && importantDoneRatio > 0.8) {
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
  };
}
