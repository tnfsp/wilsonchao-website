"use client";

import { useState, useEffect } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { TimelineEntry, CriticalAction, WhatIfBranch, ExpectedAction, TrackedAction, GuidelineBundleScore } from "@/lib/simulator/types";
import type { GameScore } from "@/lib/simulator/types";

// ─── Progress persistence ────────────────────────────────────────────────────

const PROGRESS_KEY = "icu-sim-progress";

interface CaseProgress {
  bestScore: number;
  lastPlayed: string;
  rating: number; // 1, 2, or 3 stars
}

function saveProgress(caseId: string, totalScore: number, stars: number) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const data: Record<string, CaseProgress> = raw ? JSON.parse(raw) : {};
    const existing = data[caseId];
    const best = existing ? Math.max(existing.bestScore, totalScore) : totalScore;
    const rating = best >= 80 ? 3 : best >= 55 ? 2 : 1;
    data[caseId] = { bestScore: best, lastPlayed: new Date().toISOString(), rating };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch { /* localStorage unavailable */ }
}

// ─── Section toggle header ─────────────────────────────────────────────────────

function SectionHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{emoji}</span>
      <div>
        <h3 className="text-white font-bold text-base tracking-tight">{title}</h3>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Section 1: Overall Score ─────────────────────────────────────────────────

function OverallScoreSection({ score, deathCause }: { score: GameScore; deathCause: string | null }) {
  const config = {
    excellent: {
      emoji: "🏆",
      label: "Excellent",
      sublabel: "表現優秀，關鍵決策都做到了",
      color: "text-yellow-400",
      border: "border-yellow-500/30",
      bg: "bg-yellow-900/10",
    },
    good: {
      emoji: "✅",
      label: "Good",
      sublabel: "整體良好，有幾個可以加強的地方",
      color: "text-teal-400",
      border: "border-teal-500/30",
      bg: "bg-teal-900/10",
    },
    needs_improvement: {
      emoji: "📚",
      label: "Needs Improvement",
      sublabel: "有幾個關鍵動作還需要加強",
      color: "text-orange-400",
      border: "border-orange-500/30",
      bg: "bg-orange-900/10",
    },
  } as const;

  const cfg = config[score.overall];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-6 text-center`}>
      {/* Death banner */}
      {deathCause && (
        <div className="rounded-xl border border-red-700/40 bg-red-900/20 p-4 mb-4 text-center">
          <p className="text-red-400 font-bold">💀 病人死亡</p>
          <p className="text-slate-400 text-sm mt-1">{deathCause}</p>
        </div>
      )}

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-4xl transition-all duration-500 ${
              i <= (score.stars ?? 1) ? "text-yellow-400 scale-110" : "text-slate-700 scale-90"
            }`}
            style={{ animationDelay: `${i * 300}ms` }}
          >
            ⭐
          </span>
        ))}
      </div>

      {/* Score number */}
      <div className="text-gray-500 text-sm mb-3 font-mono">{score.totalScore ?? 0} / 100</div>

      <div className="text-6xl mb-3">{cfg.emoji}</div>
      <div className={`text-2xl font-bold ${cfg.color} mb-1`}>{cfg.label}</div>
      <div className="text-gray-400 text-sm">{cfg.sublabel}</div>

      {/* Quick stats row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatPill
          label="關鍵動作"
          value={`${score.criticalActions.filter((ca) => ca.critical && ca.met).length}/${score.criticalActions.filter((ca) => ca.critical).length}`}
          ok={score.criticalActions.filter((ca) => ca.critical && !ca.met).length === 0}
        />
        <StatPill
          label="Escalation"
          value={
            score.escalationTiming === "appropriate"
              ? "適時"
              : score.escalationTiming === "early"
              ? "稍早"
              : score.escalationTiming === "late"
              ? "偏晚"
              : "未呼叫"
          }
          ok={score.escalationTiming === "appropriate"}
        />
        <StatPill
          label="Hints 使用"
          value={`${score.hintsUsed} 次`}
          ok={score.hintsUsed === 0}
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="bg-black/30 rounded-lg p-2.5">
      <div className={`text-sm font-bold ${ok ? "text-teal-400" : "text-orange-400"}`}>
        {value}
      </div>
      <div className="text-gray-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}

// ─── Section 2: Timeline ──────────────────────────────────────────────────────

function TimelineSection({ timeline }: { timeline: TimelineEntry[] }) {
  function entryIcon(entry: TimelineEntry) {
    if (entry.type === "nurse_message")  return "💬";
    if (entry.type === "player_action")  return "▶";
    if (entry.type === "order_placed")   return "📋";
    if (entry.type === "lab_result")     return "🔬";
    if (entry.type === "system_event")   return "⏰";
    if (entry.type === "hint")           return "💡";
    if (entry.type === "player_message") return "🗣";
    return "·";
  }

  function entryColor(entry: TimelineEntry) {
    if (entry.sender === "nurse")  return "text-teal-300";
    if (entry.sender === "player") return "text-white";
    if (entry.sender === "system") return "text-gray-500";
    if (entry.sender === "senior") return "text-amber-300";
    return "text-gray-400";
  }

  function evalMark(entry: TimelineEntry): "✅" | "❌" | "⚠️" | null {
    if (entry.type === "hint")         return "⚠️";
    if (entry.type === "order_placed") return "✅";
    if (entry.isImportant && entry.sender === "system") return "⚠️";
    return null;
  }

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
      {timeline.map((entry) => {
        const mark = evalMark(entry);
        return (
          <div
            key={entry.id}
            className={`flex gap-3 text-xs py-1.5 border-b border-white/5 last:border-0 ${
              entry.isImportant ? "bg-white/3 rounded px-2" : "px-2"
            }`}
          >
            {/* Time */}
            <span className="text-gray-600 shrink-0 w-8 font-mono">
              {formatTime(entry.gameTime)}
            </span>
            {/* Icon */}
            <span className="shrink-0 w-4 text-center">{entryIcon(entry)}</span>
            {/* Content */}
            <span className={`flex-1 leading-relaxed ${entryColor(entry)}`}>
              {entry.content}
            </span>
            {/* Mark */}
            {mark && <span className="shrink-0">{mark}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section 3: Critical Actions ─────────────────────────────────────────────

function CriticalActionRow({
  ca,
  expected,
}: {
  ca: CriticalAction;
  expected?: ExpectedAction;
}) {
  const [open, setOpen] = useState(false);
  const hasDetail = expected && (expected.rationale || expected.howTo);

  return (
    <>
      <tr
        onClick={() => hasDetail && setOpen(!open)}
        className={`border-b border-white/5 last:border-0 transition-colors ${
          hasDetail ? "cursor-pointer hover:bg-white/5" : "hover:bg-white/3"
        }`}
      >
        <td className="px-3 py-2.5 text-gray-300">
          <div className="flex items-center gap-1.5">
            {hasDetail && (
              <span className="text-gray-600 text-xs shrink-0">{open ? "▼" : "▶"}</span>
            )}
            <span>{ca.description}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-center">
          {ca.met ? (
            <span className="text-green-400 font-bold">✅</span>
          ) : (
            <span className="text-red-400 font-bold">❌</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-center text-gray-500 font-mono">
          {ca.timeToComplete !== null ? `${ca.timeToComplete}m` : "—"}
        </td>
        <td className="px-3 py-2.5 text-center">
          {ca.critical ? (
            <span className="bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded text-xs">必做</span>
          ) : (
            <span className="bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded text-xs">加分</span>
          )}
        </td>
      </tr>
      {open && hasDetail && (
        <tr>
          <td colSpan={4} className="px-3 pb-3 pt-0">
            <div className="bg-slate-800 rounded-lg p-4 space-y-3 text-sm leading-relaxed">
              {ca.met && (
                <p className="text-green-400/80 text-xs font-medium">Well done — 你做到了這個動作</p>
              )}
              {expected.rationale && (
                <div>
                  <p className={`font-medium text-xs mb-1 ${ca.met ? "text-gray-500" : "text-amber-400"}`}>
                    為什麼重要？
                  </p>
                  <p className={ca.met ? "text-gray-500" : "text-gray-300"}>{expected.rationale}</p>
                </div>
              )}
              {expected.howTo && (
                <div>
                  <p className={`font-medium text-xs mb-1 ${ca.met ? "text-gray-500" : "text-cyan-400"}`}>
                    正確做法
                  </p>
                  <p className={ca.met ? "text-gray-500" : "text-gray-300"}>{expected.howTo}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CriticalActionsTable({
  actions,
  expectedActions,
}: {
  actions: CriticalAction[];
  expectedActions?: ExpectedAction[];
}) {
  const expectedMap = new Map(expectedActions?.map((ea) => [ea.id, ea]));

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 text-gray-500">
            <th className="text-left px-3 py-2.5 font-medium">動作</th>
            <th className="text-center px-3 py-2.5 font-medium w-16">完成</th>
            <th className="text-center px-3 py-2.5 font-medium w-20">時間</th>
            <th className="text-center px-3 py-2.5 font-medium w-16">重要性</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((ca) => (
            <CriticalActionRow
              key={ca.id}
              ca={ca}
              expected={expectedMap.get(ca.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section 4: SBAR Score ────────────────────────────────────────────────────

function SBARScoreSection({ sbar }: { sbar: GameScore["sbar"] }) {
  const bars = [
    {
      label: "Completeness",
      sublabel: "各區塊有沒有涵蓋到",
      value: sbar.completeness,
      color: "bg-teal-500",
    },
    {
      label: "Prioritization",
      sublabel: "重要的事放在前面",
      value: sbar.prioritization,
      color: "bg-violet-500",
    },
  ];

  const badges = [
    {
      label: "Quantitative",
      sublabel: "有具體數字（cc/hr、mg/dL）",
      met: sbar.quantitative,
    },
    {
      label: "Anticipatory",
      sublabel: "說「我已經...」",
      met: sbar.anticipatory,
    },
  ];

  return (
    <div className="space-y-4">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between text-xs mb-1">
            <div>
              <span className="text-gray-300 font-medium">{b.label}</span>
              <span className="text-gray-600 ml-2">{b.sublabel}</span>
            </div>
            <span className="text-gray-400 font-mono">{b.value}/100</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${b.color} rounded-full transition-all`}
              style={{ width: `${b.value}%` }}
            />
          </div>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3 mt-2">
        {badges.map((b) => (
          <div
            key={b.label}
            className={`rounded-lg border p-3 ${
              b.met
                ? "border-green-500/30 bg-green-900/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{b.met ? "✅" : "❌"}</span>
              <span className={`text-sm font-medium ${b.met ? "text-green-400" : "text-gray-500"}`}>
                {b.label}
              </span>
            </div>
            <p className="text-gray-600 text-xs mt-1">{b.sublabel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section 5: What-If Cards ─────────────────────────────────────────────────

function WhatIfCards({ whatIf }: { whatIf: WhatIfBranch[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {whatIf.map((branch, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-white/10 overflow-hidden"
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              <span className="text-sm text-gray-300 font-medium">
                💭 {branch.scenario}
              </span>
              <span className="text-gray-500 text-xs shrink-0 ml-3">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                    結果
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {branch.outcome}
                  </p>
                </div>
                <div className="bg-amber-900/15 border border-amber-500/20 rounded-lg px-3 py-2">
                  <p className="text-amber-400 text-xs font-medium mb-0.5">💡 Teaching Point</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{branch.lesson}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section 6: Key Lessons ───────────────────────────────────────────────────

function KeyLessonsSection({ lessons }: { lessons: string[] }) {
  return (
    <ol className="space-y-3">
      {lessons.map((lesson, i) => (
        <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
          <span className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
            {i + 1}
          </span>
          <span>{lesson}</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Section 7: Diagnostic Accuracy ──────────────────────────────────────────

interface DiagnosticStep {
  id: string;
  label: string;
  pattern: RegExp;
  critical: boolean;
}

const DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  { id: "pe", label: "Physical Examination", pattern: /^(pe:|open_pe|order:physical_exam)/i, critical: true },
  { id: "pocus", label: "POCUS", pattern: /^(pocus:|imaging:pocus)/i, critical: true },
  { id: "labs", label: "Lab Orders", pattern: /^order:lab/i, critical: true },
  { id: "imaging", label: "Imaging (CXR/ECG)", pattern: /^(order:imaging|imaging:)/i, critical: false },
  { id: "abg", label: "ABG / Lactate", pattern: /(abg|lactate|blood.?gas)/i, critical: false },
  { id: "coag", label: "Coagulation Panel", pattern: /(coag|pt.*inr|aptt|fibrinogen)/i, critical: false },
];

// ─── Guideline Bundle Compliance Section ─────────────────────────────────────

function GuidelineBundleSection({ bundles }: { bundles: GuidelineBundleScore[] }) {
  return (
    <div className="space-y-4">
      {bundles.map((bundle) => {
        const complianceColor =
          bundle.compliancePercent >= 80
            ? "text-emerald-400"
            : bundle.compliancePercent >= 50
            ? "text-yellow-400"
            : "text-red-400";

        const complianceBg =
          bundle.compliancePercent >= 80
            ? "bg-emerald-500"
            : bundle.compliancePercent >= 50
            ? "bg-yellow-500"
            : "bg-red-500";

        return (
          <div
            key={bundle.bundleId}
            className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
          >
            {/* Bundle header */}
            <div className="px-4 py-3 border-b border-white/8">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white text-sm font-semibold">{bundle.bundleName}</h4>
                  <p className="text-gray-500 text-[11px] mt-0.5 leading-tight max-w-md">
                    {bundle.source.length > 100 ? bundle.source.slice(0, 100) + "…" : bundle.source}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${complianceColor}`}>
                    {bundle.completedItems}/{bundle.totalItems}
                  </div>
                  <div className="text-gray-500 text-[10px]">compliance</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${complianceBg}`}
                  style={{ width: `${bundle.compliancePercent}%` }}
                />
              </div>

              {bundle.timeToCompletion !== null && (
                <p className="text-emerald-400 text-[10px] mt-1">
                  ✅ Bundle 完成於 {bundle.timeToCompletion} 分鐘
                </p>
              )}
            </div>

            {/* Checklist items */}
            <div className="divide-y divide-white/5">
              {bundle.items.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-2.5 flex items-start gap-3"
                >
                  <div className="mt-0.5">
                    {item.completed ? (
                      item.withinTimeWindow ? (
                        <span className="text-emerald-400 text-sm">✅</span>
                      ) : (
                        <span className="text-yellow-400 text-sm">⚠️</span>
                      )
                    ) : (
                      <span className="text-red-400 text-sm">❌</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${item.completed ? "text-gray-300" : "text-gray-500"}`}>
                      {item.description}
                    </p>
                    <div className="flex gap-3 mt-0.5">
                      {item.completedAt !== null && (
                        <span className="text-[10px] text-gray-600">
                          {item.withinTimeWindow ? "⏱" : "⏱ 延遲"} {item.completedAt}min
                        </span>
                      )}
                      {item.evidenceLevel && (
                        <span className="text-[10px] text-cyan-700">{item.evidenceLevel}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Source link */}
            {bundle.url && (
              <div className="px-4 py-2 border-t border-white/5">
                <a
                  href={bundle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-500 text-[10px] hover:underline"
                >
                  📄 查看原始 Guideline →
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Diagnostic Accuracy Section ─────────────────────────────────────────────

function DiagnosticAccuracySection({
  score,
  scenario,
  playerActions,
}: {
  score: GameScore;
  scenario: { debrief: { correctDiagnosis: string }; expectedActions: ExpectedAction[] };
  playerActions: TrackedAction[];
}) {
  // Determine which diagnostic steps were taken
  const stepsTaken = DIAGNOSTIC_STEPS.map((step) => ({
    ...step,
    done: playerActions.some((pa) => step.pattern.test(pa.action)),
    time: playerActions.find((pa) => step.pattern.test(pa.action))?.gameTime ?? null,
  }));

  const criticalSteps = stepsTaken.filter((s) => s.critical);
  const criticalDone = criticalSteps.filter((s) => s.done).length;
  const criticalTotal = criticalSteps.length;

  // Time to correct diagnosis: earliest time player mentioned correct diagnosis
  // (approximation: when first diagnostic action was taken that led to correct dx)
  const diagnosticActions = playerActions.filter(
    (pa) =>
      pa.action.startsWith("pe:") ||
      pa.action.startsWith("pocus:") ||
      pa.action.includes("sbar:") ||
      pa.action.startsWith("message:")
  );
  const timeToDiagnosis = diagnosticActions.length > 0
    ? Math.min(...diagnosticActions.map((pa) => pa.gameTime))
    : null;

  // Diagnostic accuracy: weighted score based on steps + correct diagnosis
  const stepScore = stepsTaken.filter((s) => s.done).length / Math.max(stepsTaken.length, 1);
  const dxBonus = score.correctDiagnosis ? 0.4 : 0;
  const accuracyPct = Math.round(Math.min(100, (stepScore * 0.6 + dxBonus) * 100));

  return (
    <div className="space-y-4">
      {/* Diagnosis correctness */}
      <div
        className={`rounded-xl border p-4 ${
          score.correctDiagnosis
            ? "border-green-500/30 bg-green-900/10"
            : "border-red-500/30 bg-red-900/10"
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">{score.correctDiagnosis ? "✅" : "❌"}</span>
          <div>
            <div className={`font-medium text-sm ${score.correctDiagnosis ? "text-green-400" : "text-red-400"}`}>
              {score.correctDiagnosis ? "診斷正確" : "診斷未命中"}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              正確診斷：{scenario.debrief.correctDiagnosis}
            </div>
          </div>
        </div>
        {timeToDiagnosis !== null && score.correctDiagnosis && (
          <div className="text-xs text-gray-400 mt-1">
            首次診斷性動作時間：第 {timeToDiagnosis} 分鐘
          </div>
        )}
      </div>

      {/* Accuracy bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-300 font-medium">診斷準確度</span>
          <span className="text-gray-400 font-mono">{accuracyPct}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              accuracyPct >= 70 ? "bg-green-500" : accuracyPct >= 40 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${accuracyPct}%` }}
          />
        </div>
      </div>

      {/* Diagnostic steps checklist */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-3 py-2 border-b border-white/10">
          <span className="text-xs text-gray-500 font-medium">
            關鍵診斷步驟 ({criticalDone}/{criticalTotal} 必要步驟完成)
          </span>
        </div>
        <div className="divide-y divide-white/5">
          {stepsTaken.map((step) => (
            <div key={step.id} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={step.done ? "text-green-400" : "text-gray-600"}>
                  {step.done ? "✅" : "○"}
                </span>
                <span className={`text-xs ${step.done ? "text-gray-300" : "text-gray-500"}`}>
                  {step.label}
                </span>
                {step.critical && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-white/5 text-gray-500">必要</span>
                )}
              </div>
              <span className="text-xs text-gray-600 font-mono">
                {step.time !== null ? `${step.time}m` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: Guidelines ────────────────────────────────────────────────────

function GuidelinesSection({ guidelines }: { guidelines: string[] }) {
  return (
    <ul className="space-y-2">
      {guidelines.map((g, i) => (
        <li key={i} className="flex gap-2 text-xs text-gray-400 leading-relaxed">
          <span className="text-teal-500 shrink-0 mt-0.5">▸</span>
          <span>{g}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Main DebriefPanel ────────────────────────────────────────────────────────

export default function DebriefPanel() {
  const { score, scenario, timeline, resetGame, deathCause, playerActions } = useProGameStore();

  // Save progress to localStorage when debrief is shown
  useEffect(() => {
    if (score && scenario) {
      saveProgress(scenario.id, score.totalScore ?? 0, score.stars ?? 1);
    }
  }, [score, scenario]);

  if (!score || !scenario) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#001219" }}>
        <div className="text-gray-500 text-sm">計算分數中...</div>
      </div>
    );
  }

  const whatIf = scenario.debrief.whatIf ?? [];
  const guidelines = scenario.debrief.guidelines ?? [];

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: "#001219" }}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ── Title with diagnosis reveal ── */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight">Debrief</h1>
          {scenario.hiddenTitle && (
            <div className="mt-4 mb-2">
              <div className="text-sm text-gray-500 mb-1">最終診斷</div>
              <h2 className="text-2xl font-bold text-cyan-300">{scenario.title}</h2>
            </div>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {scenario.title} — {scenario.patient.bed} · {scenario.patient.age}{scenario.patient.sex === "M" ? "M" : "F"}
          </p>
        </div>

        {/* ── Section 1: Overall Score ── */}
        <section>
          <SectionHeader emoji="🏆" title="整體表現" />
          <OverallScoreSection score={score} deathCause={deathCause} />
        </section>

        <div className="border-t border-white/8" />

        {/* ── Section 2: Timeline ── */}
        <section>
          <SectionHeader
            emoji="🕐"
            title="Timeline 回顧"
            subtitle="你的每一步動作"
          />
          <TimelineSection timeline={timeline} />
        </section>

        <div className="border-t border-white/8" />

        {/* ── Section 3: Critical Actions ── */}
        <section>
          <SectionHeader
            emoji="⚡"
            title="關鍵動作"
            subtitle="必做項目與加分項目"
          />
          <CriticalActionsTable actions={score.criticalActions} expectedActions={scenario.expectedActions} />

          {score.harmfulOrders.length > 0 && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-900/10 p-4">
              <p className="text-red-400 text-sm font-medium mb-2">🚫 有害醫囑</p>
              <ul className="space-y-1">
                {score.harmfulOrders.map((h, i) => (
                  <li key={i} className="text-gray-400 text-xs flex gap-2">
                    <span className="text-red-500">❌</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="border-t border-white/8" />

        {/* ── Section 3.5: Guideline Bundle Compliance ── */}
        {score.guidelineBundleScores && score.guidelineBundleScores.length > 0 && (
          <>
            <section>
              <SectionHeader
                emoji="📋"
                title="Guideline 遵循度"
                subtitle="根據國際指引評估你的處置"
              />
              <GuidelineBundleSection bundles={score.guidelineBundleScores} />
            </section>
            <div className="border-t border-white/8" />
          </>
        )}

        {/* ── Section 3.6: Diagnostic Accuracy ── */}
        <section>
          <SectionHeader
            emoji="🔍"
            title="診斷準確度"
            subtitle="診斷過程分析"
          />
          <DiagnosticAccuracySection
            score={score}
            scenario={scenario}
            playerActions={playerActions}
          />
        </section>

        <div className="border-t border-white/8" />

        {/* ── Section 4: SBAR Score ── */}
        <section>
          <SectionHeader
            emoji="📝"
            title="SBAR 交班評分"
            subtitle="你的交班品質分析"
          />
          <SBARScoreSection sbar={score.sbar} />
        </section>

        <div className="border-t border-white/8" />

        {/* ── Section 5: What-If ── */}
        {whatIf.length > 0 && (
          <>
            <section>
              <SectionHeader
                emoji="🔀"
                title="如果你當時..."
                subtitle="不同決策路徑的結果"
              />
              <WhatIfCards whatIf={whatIf} />
            </section>
            <div className="border-t border-white/8" />
          </>
        )}

        {/* ── Section 6: Key Lessons ── */}
        {score.keyLessons.length > 0 && (
          <>
            <section>
              <SectionHeader
                emoji="💡"
                title="本次教學重點"
                subtitle={`${score.keyLessons.length} 條個人化建議`}
              />
              <KeyLessonsSection lessons={score.keyLessons} />
            </section>
            <div className="border-t border-white/8" />
          </>
        )}

        {/* ── Section 7: Guidelines ── */}
        {guidelines.length > 0 && (
          <>
            <section>
              <SectionHeader
                emoji="📖"
                title="參考 Guidelines"
                subtitle="相關指引與標準"
              />
              <GuidelinesSection guidelines={guidelines} />
            </section>
            <div className="border-t border-white/8" />
          </>
        )}

        {/* ── Footer buttons ── */}
        <div className="flex gap-3 mt-8 pb-8">
          <button
            onClick={() => resetGame()}
            className="flex-1 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold transition-colors"
          >
            🔄 重新挑戰
          </button>
          <button
            onClick={() => { window.location.href = "/teaching/simulator"; }}
            className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            ← 返回列表
          </button>
        </div>
      </div>
    </div>
  );
}
