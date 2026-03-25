"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type {
  TimelineEntry,
  CriticalAction,
  WhatIfBranch,
  ExpectedAction,
  TrackedAction,
  GuidelineBundleScore,
  GuidelineBundle,
  GameScore,
  ScoreBreakdown,
  ScriptedEvent,
  HarmfulOrderDetail,
  ExampleSBAR,
  AIDebriefResponse,
  SimScenario,
} from "@/lib/simulator/types";
import type { WhatIfResult } from "@/lib/simulator/engine/score-engine";

// ============================================================
// Progress persistence
// ============================================================

const PROGRESS_KEY = "icu-sim-progress";

interface CaseProgress {
  bestScore: number;
  lastPlayed: string;
  rating: number;
}

function saveProgress(caseId: string, totalScore: number, stars: number) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const data: Record<string, CaseProgress> = raw ? JSON.parse(raw) : {};
    const existing = data[caseId];
    const best = existing ? Math.max(existing.bestScore, totalScore) : totalScore;
    const rating = best >= 80 ? 3 : best >= 60 ? 2 : 1;
    data[caseId] = { bestScore: best, lastPlayed: new Date().toISOString(), rating };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch { /* localStorage unavailable */ }
}

// ============================================================
// Utility: format game minutes
// ============================================================

function fmtMin(m: number): string {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// ============================================================
// Collapsible Section wrapper
// ============================================================

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-white/8 pb-6 mb-6 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left group mb-4"
      >
        <div>
          <h3 className="text-white font-bold text-base tracking-tight group-hover:text-cyan-300 transition-colors">
            {title}
          </h3>
          {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-gray-600 text-xs shrink-0 ml-3">{open ? "▲" : "▼"}</span>
      </button>
      {open && children}
    </section>
  );
}

// ============================================================
// Layer 2 — Section A: Annotated Timeline
// ============================================================

interface AnnotatedNode {
  gameTime: number;
  description: string;
  annotation: string;
  type: "good" | "missed" | "event" | "gap" | "death";
}

function buildAnnotatedTimeline(
  timeline: TimelineEntry[],
  events: ScriptedEvent[],
  criticalActions: CriticalAction[],
  expectedActions: ExpectedAction[],
  patientDied: boolean,
  deathCause: string | null,
): AnnotatedNode[] {
  const nodes: AnnotatedNode[] = [];

  // 1. Severity-changing scripted events (select important ones)
  const importantEvents = events.filter(
    (e) =>
      (e.severityChange && e.severityChange >= 15) ||
      e.type === "escalation",
  );
  for (const evt of importantEvents) {
    const desc = evt.message
      ? evt.message.replace(/\{\{[^}]+\}\}/g, "...").slice(0, 80)
      : `Event at ${fmtMin(evt.triggerTime)}`;
    nodes.push({
      gameTime: evt.triggerTime,
      description: desc,
      annotation: evt.severityChange && evt.severityChange >= 20
        ? `Severity +${evt.severityChange}`
        : "Event",
      type: "event",
    });
  }

  // 2. Critical actions (met & missed)
  const eaMap = new Map(expectedActions.map((ea) => [ea.id, ea]));
  for (const ca of criticalActions) {
    if (!ca.critical) continue;
    const ea = eaMap.get(ca.id);
    if (ca.met) {
      nodes.push({
        gameTime: ca.timeToComplete ?? 0,
        description: ca.description,
        annotation: `Done at ${fmtMin(ca.timeToComplete ?? 0)}`,
        type: "good",
      });
    } else {
      nodes.push({
        gameTime: ea?.deadline ?? 15,
        description: ca.description,
        annotation: ea ? `Deadline: ${fmtMin(ea.deadline)}` : "Missed",
        type: "missed",
      });
    }
  }

  // 3. Death event
  if (patientDied) {
    const deathEvt = events.find(
      (e) => e.severityChange && e.severityChange >= 100,
    );
    nodes.push({
      gameTime: deathEvt?.triggerTime ?? 25,
      description: deathCause ?? "Patient expired",
      annotation: "Death",
      type: "death",
    });
  }

  // Sort by time
  nodes.sort((a, b) => a.gameTime - b.gameTime);

  // 4. Insert gap markers (> 5 min between critical actions without player action)
  const withGaps: AnnotatedNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    withGaps.push(nodes[i]);
    if (i < nodes.length - 1) {
      const gap = nodes[i + 1].gameTime - nodes[i].gameTime;
      if (gap > 5) {
        withGaps.push({
          gameTime: nodes[i].gameTime + Math.round(gap / 2),
          description: `${Math.round(gap)} minutes without critical action`,
          annotation: "",
          type: "gap",
        });
      }
    }
  }

  // Limit to 8 nodes
  return withGaps.slice(0, 8);
}

function AnnotatedTimeline({
  nodes,
  maxSeverity,
}: {
  nodes: AnnotatedNode[];
  maxSeverity: number;
}) {
  const nodeColor = (t: AnnotatedNode["type"]) => {
    switch (t) {
      case "good": return "border-emerald-500 bg-emerald-500/10";
      case "missed": return "border-red-500 bg-red-500/10";
      case "event": return "border-amber-500 bg-amber-500/10";
      case "gap": return "border-gray-600 bg-gray-800/50 border-dashed";
      case "death": return "border-red-600 bg-red-900/20";
    }
  };
  const dotColor = (t: AnnotatedNode["type"]) => {
    switch (t) {
      case "good": return "bg-emerald-500";
      case "missed": return "bg-red-500";
      case "event": return "bg-amber-500";
      case "gap": return "bg-gray-600";
      case "death": return "bg-red-600";
    }
  };

  return (
    <div className="space-y-2">
      {nodes.map((node, i) => (
        <div key={i} className={`flex gap-3 items-start rounded-lg border px-3 py-2.5 ${nodeColor(node.type)}`}>
          <div className="flex flex-col items-center shrink-0 w-12">
            <span className="text-gray-400 text-[11px] font-mono">{fmtMin(node.gameTime)}</span>
            <div className={`w-2 h-2 rounded-full mt-1 ${dotColor(node.type)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-200 text-xs leading-relaxed">{node.description}</p>
            {node.annotation && (
              <p className={`text-[10px] mt-0.5 ${
                node.type === "good" ? "text-emerald-400" :
                node.type === "missed" ? "text-red-400" :
                "text-gray-500"
              }`}>
                {node.type === "good" && "\u2713 "}
                {node.type === "missed" && "\u2717 "}
                {node.annotation}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Mini severity bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span>Severity</span>
          <span>Peak: {maxSeverity}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              maxSeverity >= 80 ? "bg-red-500" : maxSeverity >= 50 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(100, maxSeverity)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Layer 2 — Section B: Attending Feedback
// ============================================================

function AttendingFeedback({
  criticalActions,
  expectedActions,
  correctDiagnosis,
  escalationTiming,
  harmfulDetails,
  patientDied,
}: {
  criticalActions: CriticalAction[];
  expectedActions: ExpectedAction[];
  correctDiagnosis: boolean;
  escalationTiming: string;
  harmfulDetails: HarmfulOrderDetail[];
  patientDied: boolean;
}) {
  const eaMap = new Map(expectedActions.map((ea) => [ea.id, ea]));
  const metCritical = criticalActions.filter((ca) => ca.critical && ca.met);
  const missedCritical = criticalActions.filter((ca) => ca.critical && !ca.met);

  const tone = patientDied ? "reflective" : "direct";

  return (
    <div className="space-y-4">
      {/* What you did well */}
      {(metCritical.length > 0 || correctDiagnosis || escalationTiming === "appropriate") && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
          <h4 className="text-emerald-400 text-sm font-semibold mb-2">
            {patientDied ? "你做到的部分" : "你做得好的"}
          </h4>
          <ul className="space-y-1.5">
            {metCritical.map((ca) => (
              <li key={ca.id} className="text-xs text-gray-300 flex gap-2">
                <span className="text-emerald-400 shrink-0">{"\u2713"}</span>
                {ca.description}
                {ca.timeToComplete !== null && (
                  <span className="text-gray-600 ml-auto shrink-0">@{fmtMin(ca.timeToComplete)}</span>
                )}
              </li>
            ))}
            {correctDiagnosis && (
              <li className="text-xs text-gray-300 flex gap-2">
                <span className="text-emerald-400 shrink-0">{"\u2713"}</span>
                Correct diagnosis identified
              </li>
            )}
            {escalationTiming === "appropriate" && (
              <li className="text-xs text-gray-300 flex gap-2">
                <span className="text-emerald-400 shrink-0">{"\u2713"}</span>
                Timely escalation to senior
              </li>
            )}
          </ul>
        </div>
      )}

      {/* What needs improvement */}
      {missedCritical.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-4">
          <h4 className="text-amber-400 text-sm font-semibold mb-2">
            {patientDied ? "如果當時有做到..." : "需要加強的"}
          </h4>
          <ul className="space-y-2">
            {missedCritical.map((ca) => {
              const ea = eaMap.get(ca.id);
              return (
                <li key={ca.id} className="text-xs text-gray-300">
                  <div className="flex gap-2">
                    <span className="text-amber-400 shrink-0">{"\u2717"}</span>
                    <div>
                      <span className="font-medium">{ca.description}</span>
                      {ea?.rationale && (
                        <p className="text-gray-500 mt-0.5 leading-relaxed">{ea.rationale.slice(0, 120)}...</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Harmful orders */}
      {harmfulDetails.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-900/15 p-4">
          <h4 className="text-red-400 text-sm font-semibold mb-2">
            Dangerous Actions
          </h4>
          <ul className="space-y-1.5">
            {harmfulDetails.map((h, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2 items-start">
                <span className="text-red-500 shrink-0">{"\u2717"}</span>
                <div>
                  <span>{h.description}</span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                    h.severity === "critical"
                      ? "bg-red-900/50 text-red-400"
                      : "bg-orange-900/50 text-orange-400"
                  }`}>
                    {h.severity === "critical" ? `${h.penalty}pts` : `${h.penalty}pts`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Layer 2 — Section B2: Critical Moment (death only)
// ============================================================

function CriticalMoment({
  events,
  criticalActions,
  expectedActions,
}: {
  events: ScriptedEvent[];
  criticalActions: CriticalAction[];
  expectedActions: ExpectedAction[];
}) {
  // Find the event where severity crosses ~80
  const sevEvents = events
    .filter((e) => e.severityChange && e.severityChange > 0)
    .sort((a, b) => a.triggerTime - b.triggerTime);

  let cumSeverity = 0;
  let crossingTime = 20;
  for (const evt of sevEvents) {
    cumSeverity += (evt.severityChange ?? 0);
    if (cumSeverity >= 80) {
      crossingTime = evt.triggerTime;
      break;
    }
  }

  // Find highest-priority missed critical action near that time
  const eaMap = new Map(expectedActions.map((ea) => [ea.id, ea]));
  const missedCriticals = criticalActions
    .filter((ca) => ca.critical && !ca.met)
    .sort((a, b) => {
      const eaA = eaMap.get(a.id);
      const eaB = eaMap.get(b.id);
      return (eaA?.deadline ?? 999) - (eaB?.deadline ?? 999);
    });

  const keyMissed = missedCriticals[0];
  if (!keyMissed) return null;

  return (
    <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-900/20 to-transparent p-5">
      <h4 className="text-red-400 text-sm font-bold mb-2">Critical Turning Point</h4>
      <p className="text-gray-300 text-sm leading-relaxed">
        At minute <span className="text-white font-mono font-bold">{crossingTime}</span>,
        the patient&apos;s condition became critical.{" "}
        {keyMissed && (
          <>
            If you had performed{" "}
            <span className="text-amber-300 font-medium">{keyMissed.description}</span>,
            the outcome could have been different.
          </>
        )}
      </p>
    </div>
  );
}

// ============================================================
// Layer 2 — Section C: SBAR Comparison
// ============================================================

function SBARComparison({
  playerSBAR,
  exampleSBAR,
  sbarScore,
}: {
  playerSBAR: Record<string, string> | null;
  exampleSBAR?: ExampleSBAR;
  sbarScore: GameScore["sbar"];
}) {
  const sections: Array<{ key: keyof ExampleSBAR; label: string }> = [
    { key: "situation", label: "S - Situation" },
    { key: "background", label: "B - Background" },
    { key: "assessment", label: "A - Assessment" },
    { key: "recommendation", label: "R - Recommendation" },
  ];

  const badges = [
    { label: "Completeness", value: `${sbarScore.completeness}/100`, met: sbarScore.completeness >= 60 },
    { label: "Prioritization", value: `${sbarScore.prioritization}/100`, met: sbarScore.prioritization >= 50 },
    { label: "Quantitative", value: sbarScore.quantitative ? "Yes" : "No", met: sbarScore.quantitative },
    { label: "Anticipatory", value: sbarScore.anticipatory ? "Yes" : "No", met: sbarScore.anticipatory },
  ];

  return (
    <div className="space-y-4">
      {exampleSBAR && playerSBAR && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-2 gap-0">
            <div className="px-3 py-2 border-b border-r border-white/10 text-xs text-gray-500 font-medium">
              Your SBAR
            </div>
            <div className="px-3 py-2 border-b border-white/10 text-xs text-cyan-500 font-medium">
              Example SBAR
            </div>
          </div>
          {sections.map(({ key, label }) => (
            <div key={key} className="border-b border-white/5 last:border-0">
              <div className="px-3 py-1 text-[10px] text-gray-600 font-medium bg-white/[0.02]">{label}</div>
              <div className="grid grid-cols-2 gap-0">
                <div className="px-3 py-2 text-xs text-gray-400 leading-relaxed border-r border-white/5">
                  {playerSBAR[key] || <span className="text-gray-600 italic">Empty</span>}
                </div>
                <div className="px-3 py-2 text-xs text-gray-300 leading-relaxed">
                  {exampleSBAR[key]}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badges */}
      <div className="grid grid-cols-4 gap-2">
        {badges.map((b) => (
          <div
            key={b.label}
            className={`rounded-lg border p-2 text-center ${
              b.met
                ? "border-emerald-500/30 bg-emerald-900/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className={`text-xs font-bold ${b.met ? "text-emerald-400" : "text-gray-500"}`}>
              {b.value}
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Layer 3 — Section D: Guideline Compliance (merged)
// ============================================================

function GuidelineComplianceSection({
  criticalActions,
  expectedActions,
  guidelineBundleScores,
  sourceBundles,
}: {
  criticalActions: CriticalAction[];
  expectedActions: ExpectedAction[];
  guidelineBundleScores?: GuidelineBundleScore[];
  sourceBundles?: GuidelineBundle[];
}) {
  // Build a de-duplicated merged list
  const shownIds = new Set<string>();

  // Guideline bundle items first
  const bundleItems: Array<{ id: string; desc: string; met: boolean; source: string; time: number | null }> = [];
  if (guidelineBundleScores) {
    for (const bundle of guidelineBundleScores) {
      for (const item of bundle.items) {
        bundleItems.push({
          id: item.id,
          desc: item.description,
          met: item.completed,
          source: bundle.bundleName,
          time: item.completedAt,
        });
        // Mark action IDs covered by this bundle item
        const srcBundle = sourceBundles?.find((b) => b.id === bundle.bundleId);
        const srcItem = srcBundle?.items.find((bi) => bi.id === item.id);
        srcItem?.actionIds.forEach((aid) => shownIds.add(aid));
      }
    }
  }

  // Remaining critical actions not covered by bundle
  const remainingActions = criticalActions.filter((ca) => !shownIds.has(ca.id));

  return (
    <div className="space-y-3">
      {/* Bundle items */}
      {bundleItems.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {bundleItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
              <span className={item.met ? "text-emerald-400" : "text-red-400"}>
                {item.met ? "\u2713" : "\u2717"}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${item.met ? "text-gray-300" : "text-gray-500"}`}>{item.desc}</p>
                <p className="text-[10px] text-gray-600">{item.source}</p>
              </div>
              {item.time !== null && (
                <span className="text-[10px] text-gray-600 font-mono shrink-0">{item.time}m</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Remaining actions */}
      {remainingActions.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/10 text-xs text-gray-500 font-medium">
            Additional Actions
          </div>
          {remainingActions.map((ca) => (
            <div key={ca.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
              <span className={ca.met ? "text-emerald-400" : "text-red-400"}>
                {ca.met ? "\u2713" : "\u2717"}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${ca.met ? "text-gray-300" : "text-gray-500"}`}>{ca.description}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                ca.critical ? "bg-red-900/40 text-red-400" : "bg-blue-900/30 text-blue-400"
              }`}>
                {ca.critical ? "Critical" : "Bonus"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Layer 3 — Section E: What-If
// ============================================================

function WhatIfSection({
  whatIf,
  defaultOpen,
}: {
  whatIf: WhatIfBranch[];
  defaultOpen: boolean;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(defaultOpen ? 0 : null);

  return (
    <div className="space-y-2">
      {whatIf.map((branch, i) => {
        const isOpen = openIdx === i;
        const wir = branch as WhatIfResult;
        return (
          <div key={i} className="rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-gray-300 font-medium truncate">
                  {branch.scenario}
                </span>
                {wir.playerActuallyTook !== undefined && (
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                    wir.playerActuallyTook
                      ? "bg-emerald-900/30 text-emerald-400"
                      : "bg-gray-800 text-gray-500"
                  }`}>
                    {wir.playerActuallyTook ? "You did this" : "Missed"}
                  </span>
                )}
              </div>
              <span className="text-gray-500 text-xs shrink-0 ml-3">{isOpen ? "\u25B2" : "\u25BC"}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                {wir.actualPath && (
                  <p className="text-gray-500 text-xs italic">Your path: {wir.actualPath}</p>
                )}
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Outcome</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{branch.outcome}</p>
                </div>
                <div className="bg-amber-900/15 border border-amber-500/20 rounded-lg px-3 py-2">
                  <p className="text-amber-400 text-xs font-medium mb-0.5">Teaching Point</p>
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

// ============================================================
// Layer 3 — Section F: Full Timeline
// ============================================================

function FullTimeline({ timeline }: { timeline: TimelineEntry[] }) {
  const entryIcon = (entry: TimelineEntry) => {
    if (entry.type === "nurse_message")  return "\u{1F4AC}";
    if (entry.type === "player_action")  return "\u25B6";
    if (entry.type === "order_placed")   return "\u{1F4CB}";
    if (entry.type === "lab_result")     return "\u{1F52C}";
    if (entry.type === "system_event")   return "\u23F0";
    if (entry.type === "hint")           return "\u{1F4A1}";
    if (entry.type === "player_message") return "\u{1F5E3}";
    return "\u00B7";
  };

  const entryColor = (entry: TimelineEntry) => {
    if (entry.sender === "nurse")  return "text-teal-300";
    if (entry.sender === "player") return "text-white";
    if (entry.sender === "system") return "text-gray-500";
    if (entry.sender === "senior") return "text-amber-300";
    return "text-gray-400";
  };

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
      {timeline.map((entry) => (
        <div
          key={entry.id}
          className={`flex gap-3 text-xs py-1.5 border-b border-white/5 last:border-0 px-2 ${
            entry.isImportant ? "bg-white/[0.03] rounded" : ""
          }`}
        >
          <span className="text-gray-600 shrink-0 w-8 font-mono">{fmtMin(entry.gameTime)}</span>
          <span className="shrink-0 w-4 text-center">{entryIcon(entry)}</span>
          <span className={`flex-1 leading-relaxed ${entryColor(entry)}`}>{entry.content}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Layer 3 — Section G: Score Breakdown
// ============================================================

function ScoreBreakdownSection({
  breakdown,
  totalScore,
}: {
  breakdown: ScoreBreakdown;
  totalScore: number;
}) {
  const dims = [
    { label: "Critical Actions", ...breakdown.criticalActions },
    { label: "SBAR", ...breakdown.sbar },
    { label: "Escalation", ...breakdown.escalation },
    { label: "Lethal Triad", ...breakdown.lethalTriad },
    { label: "Diagnostic Workup", ...breakdown.diagnosticWorkup },
    { label: "Diagnosis", ...breakdown.diagnosis },
    { label: "Bonus Actions", ...breakdown.bonusActions },
    { label: "Time to First Action", ...breakdown.timeToFirst },
  ];

  const modifiers = [
    { label: "Pause & Think Bonus", value: breakdown.pauseThinkBonus, positive: true },
    { label: "Hint Penalty", value: breakdown.hintPenalty, positive: false },
    { label: "Harmful Order Penalty", value: breakdown.harmfulOrderPenalty, positive: false },
  ].filter((m) => m.value !== 0);

  return (
    <div className="space-y-3">
      {/* Dimension bars */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        {dims.map((d) => {
          const pct = d.max > 0 ? (d.earned / d.max) * 100 : 0;
          return (
            <div key={d.label} className="flex items-center gap-3 px-4 py-2 border-b border-white/5 last:border-0">
              <span className="text-xs text-gray-400 w-36 shrink-0">{d.label}</span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono w-12 text-right shrink-0">
                {d.earned}/{d.max}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modifiers */}
      {modifiers.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {modifiers.map((m) => (
            <div
              key={m.label}
              className={`rounded-lg border px-3 py-1.5 text-xs ${
                m.value > 0
                  ? "border-emerald-500/30 bg-emerald-900/10 text-emerald-400"
                  : "border-red-500/30 bg-red-900/10 text-red-400"
              }`}
            >
              {m.label}: {m.value > 0 ? "+" : ""}{m.value}
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="text-right text-sm text-gray-400 font-mono">
        Total: <span className="text-white font-bold text-lg">{totalScore}</span> / 100
      </div>
    </div>
  );
}

// ============================================================
// Star display component
// ============================================================

function StarDisplay({ stars, patientDied }: { stars: number; patientDied: boolean }) {
  return (
    <div className="flex justify-center gap-3">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`text-5xl transition-all duration-500 ${
            i <= stars
              ? "text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
              : "text-slate-700 scale-90 opacity-40"
          }`}
        >
          {"\u2605"}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// AI Debrief Hook
// ============================================================

type AIDebriefState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AIDebriefResponse }
  | { status: "error"; error: string };

function useAIDebrief(
  score: GameScore | null,
  scenario: SimScenario | null,
  timeline: TimelineEntry[],
  sbarReport: Record<string, string> | null,
  deathCause: string | null,
) {
  const [state, setState] = useState<AIDebriefState>({ status: "idle" });

  const fetchDebrief = useCallback(async () => {
    if (!score || !scenario) return;

    setState({ status: "loading" });

    try {
      const body = {
        timeline: timeline.map((t) => ({
          id: t.id,
          gameTime: t.gameTime,
          type: t.type,
          content: t.content,
          sender: t.sender,
          isImportant: t.isImportant,
        })),
        scoreResult: {
          totalScore: score.totalScore,
          stars: score.stars,
          overall: score.overall,
          criticalActions: score.criticalActions,
          escalationTiming: score.escalationTiming,
          correctDiagnosis: score.correctDiagnosis,
          harmfulOrders: score.harmfulOrders,
          sbar: score.sbar,
          lethalTriadManaged: score.lethalTriadManaged,
          lethalTriadCount: score.lethalTriadCount,
          keyLessons: score.keyLessons,
          patientDied: score.patientDied,
        },
        scenarioMeta: {
          pathology: patient?.pathology ?? scenario.pathology,
          correctDiagnosis: scenario.debrief.correctDiagnosis,
          keyPoints: scenario.debrief.keyPoints,
          pitfalls: scenario.debrief.pitfalls,
          expectedActions: scenario.expectedActions.map((ea: ExpectedAction) => ({
            id: ea.id,
            action: ea.action,
            description: ea.description,
            deadline: ea.deadline,
            critical: ea.critical,
          })),
          exampleSBAR: scenario.debrief.exampleSBAR,
          patientInfo: {
            age: scenario.patient.age,
            sex: scenario.patient.sex,
            surgery: scenario.patient.surgery,
            postOpDay: scenario.patient.postOpDay,
            history: scenario.patient.history,
          },
        },
        playerSBAR: sbarReport
          ? {
              situation: sbarReport.situation ?? "",
              background: sbarReport.background ?? "",
              assessment: sbarReport.assessment ?? "",
              recommendation: sbarReport.recommendation ?? "",
            }
          : null,
        patientOutcome: {
          survived: !score.patientDied,
          deathCause: deathCause,
        },
      };

      const res = await fetch("/api/simulator/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `HTTP ${res.status}`);
      }

      const data: AIDebriefResponse = await res.json();
      setState({ status: "success", data });
    } catch (err) {
      console.error("[AI Debrief] fetch failed:", err);
      setState({ status: "error", error: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [score, scenario, timeline, sbarReport, deathCause]);

  useEffect(() => {
    fetchDebrief();
  }, [fetchDebrief]);

  return state;
}

// ============================================================
// AI Loading Skeleton
// ============================================================

function AISkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-2 h-2 rounded-full bg-white/10 mt-1.5 shrink-0" />
          <div
            className="h-3 bg-white/10 rounded"
            style={{ width: `${60 + Math.random() * 30}%` }}
          />
        </div>
      ))}
      <div className="text-[10px] text-gray-700 mt-2">AI generating debrief...</div>
    </div>
  );
}

// ============================================================
// AI Annotated Timeline (replaces rule-based when available)
// ============================================================

function AIAnnotatedTimeline({ moments }: { moments: AIDebriefResponse["keyMoments"] }) {
  const nodeColor = (t: string) => {
    switch (t) {
      case "good": return "border-emerald-500 bg-emerald-500/10";
      case "missed": return "border-red-500 bg-red-500/10";
      case "critical": return "border-red-600 bg-red-900/20";
      case "neutral": return "border-gray-500 bg-gray-800/50";
      default: return "border-gray-600 bg-gray-800/50";
    }
  };
  const dotColor = (t: string) => {
    switch (t) {
      case "good": return "bg-emerald-500";
      case "missed": return "bg-red-500";
      case "critical": return "bg-red-600";
      case "neutral": return "bg-gray-500";
      default: return "bg-gray-600";
    }
  };
  const iconChar = (t: string) => {
    switch (t) {
      case "good": return "\u2713";
      case "missed": return "\u2717";
      case "critical": return "!";
      default: return "\u00B7";
    }
  };

  return (
    <div className="space-y-2">
      {moments.map((m, i) => (
        <div key={i} className={`flex gap-3 items-start rounded-lg border px-3 py-2.5 ${nodeColor(m.type)}`}>
          <div className="flex flex-col items-center shrink-0 w-12">
            <span className="text-gray-400 text-[11px] font-mono">{fmtMin(m.gameTime)}</span>
            <div className={`w-2 h-2 rounded-full mt-1 ${dotColor(m.type)}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-200 text-xs leading-relaxed">{m.event}</p>
            <p className={`text-[10px] mt-0.5 ${
              m.type === "good" ? "text-emerald-400" :
              m.type === "missed" ? "text-red-400" :
              m.type === "critical" ? "text-red-400" :
              "text-gray-500"
            }`}>
              {iconChar(m.type)} {m.annotation}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// AI Attending Feedback (replaces rule-based when available)
// ============================================================

function AIAttendingFeedbackSection({ feedback }: { feedback: AIDebriefResponse["attendingFeedback"] }) {
  return (
    <div className="space-y-4">
      {/* Positive */}
      {feedback.positive.length > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
          <h4 className="text-emerald-400 text-sm font-semibold mb-2">
            Attending: What you did well
          </h4>
          <ul className="space-y-1.5">
            {feedback.positive.map((p, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-emerald-400 shrink-0">{"\u2713"}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement */}
      {feedback.improvement.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-4">
          <h4 className="text-amber-400 text-sm font-semibold mb-2">
            Areas for growth
          </h4>
          <ul className="space-y-2">
            {feedback.improvement.map((imp, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-amber-400 shrink-0">{"\u2717"}</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dangerous */}
      {feedback.dangerous && feedback.dangerous.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-900/15 p-4">
          <h4 className="text-red-400 text-sm font-semibold mb-2">
            Dangerous Actions
          </h4>
          <ul className="space-y-1.5">
            {feedback.dangerous.map((d, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2 items-start">
                <span className="text-red-500 shrink-0">{"\u2717"}</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AI SBAR Review
// ============================================================

function AISBARReviewSection({ review }: { review: AIDebriefResponse["sbarReview"] }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-gray-300 text-sm leading-relaxed">{review.overall}</p>
      </div>

      {review.goodPoints.length > 0 && (
        <div>
          <h5 className="text-emerald-400 text-xs font-semibold mb-1.5">Good points</h5>
          <ul className="space-y-1">
            {review.goodPoints.map((p, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-emerald-400 shrink-0">{"\u2713"}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.missingElements.length > 0 && (
        <div>
          <h5 className="text-amber-400 text-xs font-semibold mb-1.5">Missing elements</h5>
          <ul className="space-y-1">
            {review.missingElements.map((m, i) => (
              <li key={i} className="text-xs text-gray-300 flex gap-2">
                <span className="text-amber-400 shrink-0">{"\u2717"}</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// AI Critical Moment
// ============================================================

function AICriticalMomentSection({ moment }: { moment: AIDebriefResponse["criticalMoment"] }) {
  if (!moment) return null;
  return (
    <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-900/20 to-transparent p-5">
      <h4 className="text-red-400 text-sm font-bold mb-2">Critical Turning Point</h4>
      <p className="text-gray-300 text-sm leading-relaxed">
        At minute <span className="text-white font-mono font-bold">{moment.gameTime}</span>:{" "}
        {moment.description}
      </p>
    </div>
  );
}

// ============================================================
// AI Key Lessons
// ============================================================

function AIKeyLessonsSection({ lessons }: { lessons: string[] }) {
  return (
    <ol className="space-y-3">
      {lessons.map((lesson, i) => (
        <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
          <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-900/30 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
            {i + 1}
          </span>
          <span>{lesson}</span>
        </li>
      ))}
    </ol>
  );
}

// ============================================================
// Main: DebriefPanel
// ============================================================

export default function DebriefPanel() {
  const { score, scenario, patient, timeline, resetGame, deathCause, playerActions, sbarReport } = useProGameStore();

  // AI debrief
  const aiDebrief = useAIDebrief(score, scenario, timeline, sbarReport, deathCause);
  const aiData = aiDebrief.status === "success" ? aiDebrief.data : null;
  const aiLoading = aiDebrief.status === "loading";

  // Save progress
  useEffect(() => {
    if (score && scenario) {
      saveProgress(scenario.id, score.totalScore ?? 0, score.stars ?? 1);
    }
  }, [score, scenario]);

  // Build annotated timeline (rule-based fallback)
  const annotatedNodes = useMemo(() => {
    if (!scenario || !score) return [];
    return buildAnnotatedTimeline(
      timeline,
      scenario.events,
      score.criticalActions,
      scenario.expectedActions,
      score.patientDied,
      deathCause,
    );
  }, [timeline, scenario, score, deathCause]);

  // Estimate max severity from events
  const maxSeverity = useMemo(() => {
    if (!scenario) return 0;
    let sev = 0;
    for (const evt of scenario.events) {
      sev += evt.severityChange ?? 0;
    }
    return Math.min(100, sev);
  }, [scenario]);

  if (!score || !scenario) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#001219" }}>
        <div className="text-gray-500 text-sm">Calculating score...</div>
      </div>
    );
  }

  const patientDied = score.patientDied;
  const whatIf = scenario.debrief.whatIf ?? [];
  const harmfulDetails = score.harmfulOrderDetails ?? [];
  const missedCriticalCount = score.criticalActions.filter((ca) => ca.critical && !ca.met).length;

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: "#001219" }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight">Debrief</h1>
          {scenario.hiddenTitle && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">Diagnosis</div>
              <h2 className="text-xl font-bold text-cyan-300">{scenario.title}</h2>
            </div>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {scenario.patient.bed} {"\u00B7"} {scenario.patient.age}{scenario.patient.sex}
          </p>
        </div>

        {/* ── Score display (survival: show here; death: hide to Layer 3) ── */}
        {!patientDied && (
          <div className="text-center space-y-3">
            <StarDisplay stars={score.stars} patientDied={false} />
            <div className="text-gray-500 text-sm font-mono">{score.totalScore} / 100</div>
          </div>
        )}

        {/* Death banner */}
        {patientDied && deathCause && (
          <div className="rounded-xl border border-red-700/40 bg-red-900/20 p-4 text-center">
            <p className="text-red-400 font-bold text-lg">Patient Expired</p>
            <p className="text-slate-400 text-sm mt-1">{deathCause}</p>
          </div>
        )}

        {/* ================================================================ */}
        {/* LAYER 2: Clinical Story (default expanded) */}
        {/* ================================================================ */}

        {/* Section A: Annotated Timeline — AI replaces rule-based */}
        <CollapsibleSection
          title="Annotated Timeline"
          subtitle={aiData ? "AI-annotated key moments" : "Key moments of your case"}
          defaultOpen={true}
        >
          {aiLoading && <AISkeleton lines={6} />}
          {aiData ? (
            <AIAnnotatedTimeline moments={aiData.keyMoments} />
          ) : !aiLoading ? (
            <AnnotatedTimeline nodes={annotatedNodes} maxSeverity={maxSeverity} />
          ) : null}
        </CollapsibleSection>

        {/* Section B: Attending Feedback — AI replaces rule-based */}
        <CollapsibleSection
          title={patientDied ? "Attending Reflection" : "Attending Feedback"}
          subtitle={aiData ? "AI-generated attending review" : (patientDied ? "Looking back at what happened" : "Your clinical performance review")}
          defaultOpen={true}
        >
          {aiLoading && <AISkeleton lines={5} />}
          {aiData ? (
            <AIAttendingFeedbackSection feedback={aiData.attendingFeedback} />
          ) : !aiLoading ? (
            <AttendingFeedback
              criticalActions={score.criticalActions}
              expectedActions={scenario.expectedActions}
              correctDiagnosis={score.correctDiagnosis}
              escalationTiming={score.escalationTiming}
              harmfulDetails={harmfulDetails}
              patientDied={patientDied}
            />
          ) : null}
        </CollapsibleSection>

        {/* Section B2: Critical Moment (death only) — AI replaces rule-based */}
        {patientDied && (
          <CollapsibleSection
            title="Critical Turning Point"
            subtitle="The moment that mattered most"
            defaultOpen={true}
          >
            {aiLoading && <AISkeleton lines={3} />}
            {aiData?.criticalMoment ? (
              <AICriticalMomentSection moment={aiData.criticalMoment} />
            ) : !aiLoading ? (
              <CriticalMoment
                events={scenario.events}
                criticalActions={score.criticalActions}
                expectedActions={scenario.expectedActions}
              />
            ) : null}
          </CollapsibleSection>
        )}

        {/* Section C: SBAR — AI review + rule-based comparison side by side */}
        <CollapsibleSection
          title="SBAR Review"
          subtitle={aiData ? "AI-reviewed SBAR assessment" : "Your handoff compared to an example"}
          defaultOpen={true}
        >
          {/* AI SBAR review (if available) */}
          {aiLoading && <AISkeleton lines={4} />}
          {aiData && (
            <div className="mb-4">
              <AISBARReviewSection review={aiData.sbarReview} />
            </div>
          )}
          {/* Always show the side-by-side comparison (rule-based) */}
          {!aiLoading && (
            <SBARComparison
              playerSBAR={sbarReport}
              exampleSBAR={scenario.debrief.exampleSBAR}
              sbarScore={score.sbar}
            />
          )}
        </CollapsibleSection>

        {/* ================================================================ */}
        {/* LAYER 3: Deep Dive (default collapsed) */}
        {/* ================================================================ */}

        <div className="pt-2">
          <div className="text-xs text-gray-600 uppercase tracking-widest mb-4">Deep Dive</div>
        </div>

        {/* Section D: Guideline Compliance */}
        <CollapsibleSection
          title="Guideline Compliance"
          subtitle="Critical actions + guideline bundle items"
          defaultOpen={false}
        >
          <GuidelineComplianceSection
            criticalActions={score.criticalActions}
            expectedActions={scenario.expectedActions}
            guidelineBundleScores={score.guidelineBundleScores}
            sourceBundles={scenario.guidelineBundles}
          />
        </CollapsibleSection>

        {/* Section E: What-If */}
        {whatIf.length > 0 && (
          <CollapsibleSection
            title="What-If Scenarios"
            subtitle="Alternative paths and their outcomes"
            defaultOpen={patientDied}
          >
            <WhatIfSection whatIf={whatIf} defaultOpen={patientDied} />
          </CollapsibleSection>
        )}

        {/* Section F: Full Timeline */}
        <CollapsibleSection
          title="Full Timeline"
          subtitle="Every action and event"
          defaultOpen={false}
        >
          <FullTimeline timeline={timeline} />
        </CollapsibleSection>

        {/* Section G: Score Breakdown */}
        {score.scoreBreakdown && (
          <CollapsibleSection
            title="Score Breakdown"
            subtitle="Points earned per dimension"
            defaultOpen={false}
          >
            {patientDied && (
              <div className="mb-4 text-center space-y-2">
                <StarDisplay stars={score.stars} patientDied={true} />
                <div className="text-gray-500 text-sm font-mono">{score.totalScore} / 100</div>
              </div>
            )}
            <ScoreBreakdownSection breakdown={score.scoreBreakdown} totalScore={score.totalScore} />
          </CollapsibleSection>
        )}

        {/* Key Lessons — AI replaces rule-based */}
        <CollapsibleSection
          title="Key Takeaways"
          subtitle={aiData ? "AI-personalized lessons" : `${score.keyLessons.length} personalized lessons`}
          defaultOpen={true}
        >
          {aiLoading && <AISkeleton lines={3} />}
          {aiData ? (
            <AIKeyLessonsSection lessons={aiData.keyLessons} />
          ) : !aiLoading && score.keyLessons.length > 0 ? (
            <ol className="space-y-3">
              {score.keyLessons.map((lesson, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-300 leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                    {i + 1}
                  </span>
                  <span>{lesson}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </CollapsibleSection>

        {/* ── Footer buttons ── */}
        <div className="flex gap-3 mt-8 pb-8">
          <button
            onClick={() => resetGame()}
            className="flex-1 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold transition-colors"
          >
            Retry Challenge
          </button>
          {!patientDied && (
            <button
              onClick={() => { window.location.href = "/teaching/simulator"; }}
              className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {"\u2190"} Back to Cases
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
