"use client";

import { useState, useEffect } from "react";
import type { SimScenario, ExpectedAction } from "@/lib/simulator/types";
import type {
  StandardScore,
  ChecklistItem,
} from "@/lib/simulator/engine/standard-score-engine";

// ============================================================
// Props
// ============================================================

export interface StandardDebriefProps {
  score: StandardScore;
  scenario: SimScenario;
  onRestart: () => void;
  onBackToList: () => void;
  onUpgradeToPro?: () => void;
}

// ============================================================
// Progress Persistence
// ============================================================

const PROGRESS_KEY = "icu-sim-standard-progress";

interface CaseProgress {
  bestStars: number;
  lastPlayed: string;
}

function saveProgress(caseId: string, stars: number) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const data: Record<string, CaseProgress> = raw ? JSON.parse(raw) : {};
    const existing = data[caseId];
    const bestStars = existing ? Math.max(existing.bestStars, stars) : stars;
    data[caseId] = { bestStars, lastPlayed: new Date().toISOString() };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch {
    /* localStorage unavailable */
  }
}

// ============================================================
// Micro-survey Persistence
// ============================================================

const SURVEY_KEY = "icu-sim-standard-survey";

interface SurveyData {
  caseId: string;
  helpful: number; // 1-5
  difficulty: "too_easy" | "just_right" | "too_hard";
  timestamp: string;
}

function saveSurvey(survey: SurveyData) {
  try {
    const raw = localStorage.getItem(SURVEY_KEY);
    const all: SurveyData[] = raw ? JSON.parse(raw) : [];
    all.push(survey);
    localStorage.setItem(SURVEY_KEY, JSON.stringify(all));
  } catch {
    /* localStorage unavailable */
  }
}

// ============================================================
// Header: Stars + Grade
// ============================================================

const ENCOURAGE_MAP: Record<number, string> = {
  3: "太棒了！你展現了紮實的臨床判斷力！",
  2: "做得不錯！關鍵步驟都掌握到了，繼續精進！",
  1: "別氣餒！每一次練習都是進步的機會。",
};

function ScoreHeader({ score }: { score: StandardScore }) {
  return (
    <div className="text-center py-6">
      {/* Stars */}
      <div className="flex justify-center gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-5xl transition-all duration-500 ${
              i <= score.stars
                ? "text-yellow-400 scale-110"
                : "text-slate-700 scale-90 opacity-40"
            }`}
          >
            {"\u2B50"}
          </span>
        ))}
      </div>

      {/* Grade */}
      <div
        className={`text-2xl font-bold mb-2 ${
          score.stars === 3
            ? "text-yellow-400"
            : score.stars === 2
            ? "text-teal-400"
            : "text-orange-400"
        }`}
      >
        {score.grade}
      </div>

      {/* Encouraging message */}
      <p className="text-gray-400 text-sm">{ENCOURAGE_MAP[score.stars]}</p>

      {/* Completion stats */}
      <div className="mt-4 text-gray-500 text-xs">
        {score.completedItems} / {score.totalItems} items completed
      </div>
    </div>
  );
}

// ============================================================
// Checklist Card
// ============================================================

function ChecklistCard({
  item,
  expectedAction,
}: {
  item: ChecklistItem;
  expectedAction?: ExpectedAction;
}) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    item.importance === "bonus" && item.completed
      ? "border-l-amber-400"
      : item.completed
      ? "border-l-emerald-500"
      : "border-l-red-500";

  const bgColor = item.completed
    ? "bg-emerald-900/5"
    : "bg-red-900/5";

  const canExpand = !item.completed && expectedAction && (expectedAction.rationale || expectedAction.howTo);

  return (
    <div
      className={`rounded-lg border border-white/10 border-l-4 ${borderColor} ${bgColor} overflow-hidden`}
    >
      <div
        className={`px-4 py-3 ${canExpand ? "cursor-pointer" : ""}`}
        onClick={() => canExpand && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className="mt-0.5 shrink-0">
            {item.completed ? (
              item.importance === "bonus" ? (
                <span className="text-amber-400 text-sm">{"\u2B50"}</span>
              ) : (
                <span className="text-emerald-400 text-sm">{"\u2705"}</span>
              )
            ) : (
              <span className="text-red-400 text-sm">{"\u274C"}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {canExpand && (
                <span className="text-gray-600 text-xs shrink-0">
                  {expanded ? "\u25BC" : "\u25B6"}
                </span>
              )}
              <p className={`text-sm ${item.completed ? "text-gray-300" : "text-gray-400"}`}>
                {item.label}
              </p>
            </div>

            {/* Meta line */}
            <div className="flex flex-wrap gap-3 mt-1">
              {item.completed && item.timeCompleted !== undefined && (
                <span className="text-xs text-emerald-500">
                  {item.timeCompleted}min
                </span>
              )}
              {item.completed && (
                <span className="text-xs text-emerald-500/80">
                  {item.importance === "bonus" ? "Bonus!" : "done"}
                </span>
              )}
              {item.guidelineRef && (
                <span className="text-xs text-cyan-600">{item.guidelineRef}</span>
              )}
              {/* Importance badge */}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  item.importance === "critical"
                    ? "bg-red-900/40 text-red-400"
                    : item.importance === "important"
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-amber-900/30 text-amber-400"
                }`}
              >
                {item.importance === "critical"
                  ? "critical"
                  : item.importance === "important"
                  ? "important"
                  : "bonus"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded detail for missed items */}
      {expanded && expectedAction && (
        <div className="px-4 pb-4 pt-0 ml-8 space-y-3">
          <div className="bg-slate-800 rounded-lg p-4 space-y-3 text-sm leading-relaxed">
            {expectedAction.rationale && (
              <div>
                <p className="font-medium text-xs text-amber-400 mb-1">
                  Why is this important?
                </p>
                <p className="text-gray-300 text-xs">{expectedAction.rationale}</p>
              </div>
            )}
            {expectedAction.howTo && (
              <div>
                <p className="font-medium text-xs text-cyan-400 mb-1">
                  Correct action
                </p>
                <p className="text-gray-300 text-xs">{expectedAction.howTo}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Guided Review Step
// ============================================================

interface GuidedStepProps {
  step: number;
  expectedAction: ExpectedAction;
  checklistItem?: ChecklistItem;
}

function GuidedStep({ step, expectedAction, checklistItem }: GuidedStepProps) {
  const [whyExpanded, setWhyExpanded] = useState(false);
  const completed = checklistItem?.completed ?? false;
  const timeCompleted = checklistItem?.timeCompleted;

  return (
    <div
      className={`rounded-xl border ${
        completed
          ? "border-emerald-700/40 bg-emerald-900/10"
          : "border-red-700/30 bg-red-900/5"
      } overflow-hidden`}
    >
      {/* Step header */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Step number + status */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              completed
                ? "bg-emerald-700 text-emerald-100"
                : "bg-red-900/60 text-red-400 border border-red-700/50"
            }`}
          >
            {step}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-medium ${
                completed ? "text-gray-200" : "text-gray-400"
              }`}
            >
              {expectedAction.description || expectedAction.action}
            </p>
            {/* Status badge */}
            <span
              className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                completed
                  ? "bg-emerald-900/50 text-emerald-400"
                  : "bg-red-900/40 text-red-400"
              }`}
            >
              {completed ? (timeCompleted !== undefined ? `✅ ${timeCompleted}min` : "✅ 完成") : "❌ 未執行"}
            </span>
          </div>

          {/* Deadline hint */}
          <p className="text-xs text-gray-600 mt-0.5">
            建議在 {expectedAction.deadline} 分鐘內完成
            {expectedAction.critical && (
              <span className="ml-2 text-red-500 font-medium">• Critical</span>
            )}
          </p>

          {/* Why toggle */}
          {expectedAction.rationale && (
            <button
              onClick={() => setWhyExpanded(!whyExpanded)}
              className="mt-2 flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 transition-colors"
            >
              <span
                className={`transition-transform duration-200 ${
                  whyExpanded ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
              為什麼？
            </button>
          )}
        </div>
      </div>

      {/* Expandable why section */}
      {whyExpanded && expectedAction.rationale && (
        <div className="px-4 pb-4 ml-10 space-y-2">
          <div className="rounded-lg bg-amber-900/10 border border-amber-700/20 p-3 space-y-2">
            <p className="text-xs text-amber-300 leading-relaxed">
              {expectedAction.rationale}
            </p>
            {expectedAction.howTo && (
              <>
                <div className="border-t border-amber-700/20 pt-2">
                  <p className="text-[10px] text-cyan-500 font-medium mb-1">
                    正確做法
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {expectedAction.howTo}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Guided Review Section
// ============================================================

function GuidedReviewSection({
  score,
  scenario,
}: {
  score: StandardScore;
  scenario: SimScenario;
}) {
  // Build a lookup from expectedAction id → checklistItem
  const itemMap = new Map<string, ChecklistItem>(
    score.items.map((item) => [item.id, item]),
  );

  // Order by criticality (critical first), then by deadline
  const orderedActions = [...scenario.expectedActions].sort((a, b) => {
    if (a.critical !== b.critical) return a.critical ? -1 : 1;
    return a.deadline - b.deadline;
  });

  return (
    <div className="space-y-3">
      {orderedActions.map((action, idx) => (
        <GuidedStep
          key={action.id}
          step={idx + 1}
          expectedAction={action}
          checklistItem={itemMap.get(action.id)}
        />
      ))}
    </div>
  );
}

// ============================================================
// Key Learning Points Section
// ============================================================

function KeyLearningPoints({ keyPoints }: { keyPoints: string[] }) {
  if (!keyPoints || keyPoints.length === 0) return null;

  // Render bold text for **...** markdown pattern
  function renderBold(text: string) {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="text-amber-300 font-semibold">
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  }

  return (
    <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 space-y-3">
      <ul className="space-y-3">
        {keyPoints.map((point, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="text-amber-400 shrink-0 mt-0.5">💡</span>
            <span className="text-gray-300">{renderBold(point)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// Guideline Summary Section
// ============================================================

function GuidelineSummarySection({
  summary,
  scenario,
}: {
  summary: string;
  scenario: SimScenario;
}) {
  const guidelines = scenario.debrief.guidelines ?? [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <p className="text-gray-300 text-sm font-medium">{summary}</p>
      {guidelines.length > 0 && (
        <ul className="space-y-2">
          {guidelines.map((g, i) => (
            <li
              key={i}
              className="flex gap-2 text-xs text-gray-400 leading-relaxed"
            >
              <span className="text-teal-500 shrink-0 mt-0.5">{"\u25B8"}</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Micro-survey
// ============================================================

function MicroSurvey({ caseId }: { caseId: string }) {
  const [helpful, setHelpful] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<
    "too_easy" | "just_right" | "too_hard" | null
  >(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (helpful === null || difficulty === null) return;
    saveSurvey({
      caseId,
      helpful,
      difficulty,
      timestamp: new Date().toISOString(),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center">
        <p className="text-teal-400 text-sm">Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
      {/* Q1: Helpful? */}
      <div>
        <p className="text-gray-300 text-sm mb-2">
          Was this scenario helpful?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setHelpful(n)}
              className={`w-9 h-9 rounded-lg border text-sm transition-colors ${
                helpful === n
                  ? "border-yellow-500 bg-yellow-900/30 text-yellow-400"
                  : "border-white/10 bg-white/5 text-gray-500 hover:bg-white/10"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Q2: Difficulty */}
      <div>
        <p className="text-gray-300 text-sm mb-2">
          How was the difficulty?
        </p>
        <div className="flex gap-2">
          {(
            [
              ["too_easy", "Too easy"],
              ["just_right", "Just right"],
              ["too_hard", "Too hard"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setDifficulty(val)}
              className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${
                difficulty === val
                  ? "border-teal-500 bg-teal-900/30 text-teal-400"
                  : "border-white/10 bg-white/5 text-gray-500 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={helpful === null || difficulty === null}
        className="w-full py-2 rounded-lg bg-white/10 text-gray-300 text-sm hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </div>
  );
}

// ============================================================
// Main: StandardDebriefPanel
// ============================================================

export default function StandardDebriefPanel({
  score,
  scenario,
  onRestart,
  onBackToList,
  onUpgradeToPro,
}: StandardDebriefProps) {
  // Build expectedAction lookup
  const expectedMap = new Map<string, ExpectedAction>(
    scenario.expectedActions.map((ea) => [ea.id, ea]),
  );

  // Save progress on mount
  useEffect(() => {
    saveProgress(scenario.id, score.stars);
  }, [scenario.id, score.stars]);

  // Group items by importance for rendering order
  const criticalItems = score.items.filter((i) => i.importance === "critical");
  const importantItems = score.items.filter((i) => i.importance === "important");
  const bonusItems = score.items.filter((i) => i.importance === "bonus");

  const hasKeyPoints =
    scenario.debrief.keyPoints && scenario.debrief.keyPoints.length > 0;

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: "#001219" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-white text-xl font-bold tracking-tight">
            Debrief
          </h1>
          {scenario.hiddenTitle && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Final Diagnosis</div>
              <h2 className="text-lg font-bold text-cyan-300">
                {scenario.title}
              </h2>
            </div>
          )}
        </div>

        {/* Score Header */}
        <ScoreHeader score={score} />

        <div className="border-t border-white/8" />

        {/* Checklist: Critical */}
        {criticalItems.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-red-400">{"\u26A1"}</span> Critical Steps
            </h3>
            <div className="space-y-2">
              {criticalItems.map((item) => (
                <ChecklistCard
                  key={item.id}
                  item={item}
                  expectedAction={expectedMap.get(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Checklist: Important */}
        {importantItems.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-blue-400">{"\u2139\uFE0F"}</span> Important
              Steps
            </h3>
            <div className="space-y-2">
              {importantItems.map((item) => (
                <ChecklistCard
                  key={item.id}
                  item={item}
                  expectedAction={expectedMap.get(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Checklist: Bonus */}
        {bonusItems.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-amber-400">{"\u2B50"}</span> Bonus
            </h3>
            <div className="space-y-2">
              {bonusItems.map((item) => (
                <ChecklistCard
                  key={item.id}
                  item={item}
                  expectedAction={expectedMap.get(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        <div className="border-t border-white/8" />

        {/* Guided Review Section */}
        {scenario.expectedActions.length > 0 && (
          <section>
            <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
              <span className="text-cyan-400">🎓</span> Guided Review — 正確處置流程
            </h3>
            <p className="text-gray-500 text-xs mb-3">
              點擊「為什麼？」查看每步驟的臨床理由
            </p>
            <GuidedReviewSection score={score} scenario={scenario} />
          </section>
        )}

        {/* Key Learning Points */}
        {hasKeyPoints && (
          <section>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <span className="text-amber-400">💡</span> Key Learning Points
            </h3>
            <KeyLearningPoints keyPoints={scenario.debrief.keyPoints} />
          </section>
        )}

        <div className="border-t border-white/8" />

        {/* Guideline Summary */}
        <section>
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span className="text-teal-400">{"\uD83D\uDCD6"}</span> Guideline
            Reference
          </h3>
          <GuidelineSummarySection
            summary={score.guidelineSummary}
            scenario={scenario}
          />
        </section>

        <div className="border-t border-white/8" />

        {/* Micro-survey */}
        <section>
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span className="text-gray-400">{"\uD83D\uDCDD"}</span> Quick
            Feedback
          </h3>
          <MicroSurvey caseId={scenario.id} />
        </section>

        <div className="border-t border-white/8" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pb-8">
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold transition-colors"
          >
            {"\uD83D\uDD04"} Try Again
          </button>
          <button
            onClick={onBackToList}
            className="w-full py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            {"\u2190"} Choose Another Scenario
          </button>
          {onUpgradeToPro && (
            <button
              onClick={onUpgradeToPro}
              className="w-full py-3 rounded-xl border border-amber-600/50 bg-amber-900/20 text-amber-300 hover:bg-amber-900/40 transition-colors font-medium"
            >
              {"\u2694\uFE0F"} Challenge Pro Mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
