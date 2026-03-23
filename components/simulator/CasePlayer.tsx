"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Scenario, VitalSigns, ScenarioNode, DebriefItem } from "@/lib/simulator/types";
import VitalsPanel from "./VitalsPanel";

function mergeVitals(
  current: VitalSigns,
  update?: Partial<VitalSigns>
): VitalSigns {
  if (!update) return current;
  return { ...current, ...update };
}

function NurseNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-3">
      <span className="text-lg">👩‍⚕️</span>
      <div>
        <div className="text-amber-400 text-xs font-medium mb-1">護理師</div>
        <div className="text-amber-200/80 text-sm">{text}</div>
      </div>
    </div>
  );
}

function LabTable({ data }: { data: Record<string, string> }) {
  return (
    <div className="bg-black/30 rounded-lg border border-white/5 overflow-hidden mt-3">
      <div className="px-3 py-2 bg-white/5 text-xs text-gray-400 font-medium">
        📋 Lab Data
      </div>
      <div className="divide-y divide-white/5">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="flex justify-between px-3 py-2">
            <span className="text-cyan-300 text-sm font-mono">{key}</span>
            <span className="text-gray-300 text-sm">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DebriefCard({ item }: { item: DebriefItem }) {
  const styles = {
    "key-point": {
      icon: "🔑",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/5",
      title: "text-cyan-400",
    },
    pitfall: {
      icon: "⚠️",
      border: "border-red-500/30",
      bg: "bg-red-500/5",
      title: "text-red-400",
    },
    guideline: {
      icon: "📋",
      border: "border-green-500/30",
      bg: "bg-green-500/5",
      title: "text-green-400",
    },
    discussion: {
      icon: "💬",
      border: "border-purple-500/30",
      bg: "bg-purple-500/5",
      title: "text-purple-400",
    },
  };
  const s = styles[item.type];
  return (
    <div className={`${s.bg} ${s.border} border rounded-lg p-4`}>
      <div className={`${s.title} font-medium text-sm mb-2`}>
        {s.icon} {item.title}
      </div>
      <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
        {item.content}
      </div>
    </div>
  );
}

export default function CasePlayer({ scenario }: { scenario: Scenario }) {
  const [currentNodeId, setCurrentNodeId] = useState(scenario.startNode);
  const [vitals, setVitals] = useState<VitalSigns>(() =>
    mergeVitals(
      {
        hr: 80,
        bpSys: 120,
        bpDia: 70,
        spo2: 99,
        cvp: 8,
        temp: 36.5,
        chestTube: 50,
        uo: 50,
      },
      scenario.nodes[scenario.startNode].vitals
    )
  );
  const [prevVitals, setPrevVitals] = useState<VitalSigns | undefined>();
  const [history, setHistory] = useState<string[]>([scenario.startNode]);
  const [showTeachingNotes, setShowTeachingNotes] = useState(true);
  const [showDebrief, setShowDebrief] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const node: ScenarioNode = scenario.nodes[currentNodeId];

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentNodeId]);

  const goToNode = useCallback(
    (nodeId: string) => {
      const nextNode = scenario.nodes[nodeId];
      if (nextNode.vitals) {
        setPrevVitals(vitals);
        setVitals((v) => mergeVitals(v, nextNode.vitals));
      }
      setCurrentNodeId(nodeId);
      setHistory((h) => [...h, nodeId]);
      setShowDebrief(false);
    },
    [scenario, vitals]
  );

  const handleChoice = (choiceId: string, nextNode: string) => {
    goToNode(nextNode);
  };

  const handleAutoAdvance = () => {
    if (node.autoAdvance) {
      goToNode(node.autoAdvance);
    }
  };

  const restart = () => {
    const startNode = scenario.nodes[scenario.startNode];
    setCurrentNodeId(scenario.startNode);
    setVitals(
      mergeVitals(
        {
          hr: 80,
          bpSys: 120,
          bpDia: 70,
          spo2: 99,
          cvp: 8,
          temp: 36.5,
          chestTube: 50,
          uo: 50,
        },
        startNode.vitals
      )
    );
    setPrevVitals(undefined);
    setHistory([scenario.startNode]);
    setShowDebrief(false);
  };

  return (
    <div className="min-h-screen bg-[#001219] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#001219]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/teaching/simulator"
              className="text-gray-500 hover:text-white transition"
            >
              ← 返回
            </a>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-gray-400">{scenario.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTeachingNotes(!showTeachingNotes)}
              className={`text-xs px-2 py-1 rounded ${
                showTeachingNotes
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-white/5 text-gray-500"
              }`}
            >
              👨‍🏫 教師筆記
            </button>
            <span className="text-xs text-gray-600">
              Step {history.length}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6" ref={contentRef}>
        {/* Patient info bar */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-4">
          <span>
            {scenario.patient.age}
            {scenario.patient.sex} 
          </span>
          <span>🔧 {scenario.patient.surgery}</span>
          <span>📅 {scenario.patient.postOpDay}</span>
          <span>📝 {scenario.patient.history}</span>
        </div>

        {/* Vitals panel */}
        <VitalsPanel vitals={vitals} prevVitals={prevVitals} />

        {/* Act label */}
        {node.act && (
          <div className="mt-6 mb-2">
            <span className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full">
              {node.act}
            </span>
          </div>
        )}

        {/* Narrative */}
        <div className="mt-4 bg-white/[0.02] rounded-xl p-6 border border-white/5">
          <div className="prose prose-invert prose-sm max-w-none">
            {node.narrative.split("\n").map((line, i) => {
              if (line.startsWith("|")) {
                // Simple markdown table rendering
                return (
                  <div
                    key={i}
                    className="font-mono text-xs text-gray-300 whitespace-pre"
                  >
                    {line}
                  </div>
                );
              }
              if (line.trim() === "") return <br key={i} />;
              return (
                <p
                  key={i}
                  className="mb-2 text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatText(line) }}
                />
              );
            })}
          </div>

          {/* Nurse note */}
          {node.nurseNote && <NurseNote text={node.nurseNote} />}

          {/* Lab data */}
          {node.labData && <LabTable data={node.labData} />}

          {/* Teaching note */}
          {showTeachingNotes && node.teachingNote && (
            <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
              <div className="text-amber-400 text-xs font-medium mb-1">
                👨‍🏫 教師筆記（只有你看得到）
              </div>
              <div className="text-amber-200/70 text-sm">
                {node.teachingNote}
              </div>
            </div>
          )}
        </div>

        {/* Prompt + Choices */}
        {node.prompt && !node.isEnding && (
          <div className="mt-6">
            <div className="text-cyan-400 font-medium mb-4">
              💬 {node.prompt}
            </div>
            {node.choices && (
              <div className="grid gap-3">
                {node.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice.id, choice.nextNode)}
                    className="group text-left bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/30 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {choice.emoji && (
                        <span className="text-xl">{choice.emoji}</span>
                      )}
                      <div>
                        <div className="text-white font-medium group-hover:text-cyan-300 transition">
                          {choice.label}
                        </div>
                        {choice.description && (
                          <div className="text-gray-500 text-sm mt-0.5">
                            {choice.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {node.autoAdvance && (
              <button
                onClick={handleAutoAdvance}
                className="mt-4 w-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/20 text-cyan-300 rounded-xl py-3 font-medium transition"
              >
                繼續 →
              </button>
            )}
          </div>
        )}

        {/* Ending + Debrief */}
        {node.isEnding && (
          <div className="mt-6">
            <div
              className={`text-center py-4 rounded-xl text-lg font-bold ${
                node.endingType === "good"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : node.endingType === "critical"
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {node.endingType === "good" && "✅ 病人恢復順利"}
              {node.endingType === "critical" && "⚠️ 病人度過危機但有驚無險"}
              {node.endingType === "bad" && "❌ 病人情況惡化"}
            </div>

            <button
              onClick={() => setShowDebrief(!showDebrief)}
              className="mt-4 w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/20 text-purple-300 rounded-xl py-3 font-medium transition"
            >
              {showDebrief ? "收起 Debrief" : "📋 開始 Debrief"}
            </button>

            {showDebrief && node.debrief && (
              <div className="mt-4 space-y-3">
                {node.debrief.map((item, i) => (
                  <DebriefCard key={i} item={item} />
                ))}
              </div>
            )}

            <button
              onClick={restart}
              className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl py-3 transition"
            >
              🔄 重新開始
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(
      /`(.*?)`/g,
      '<code class="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 text-xs">$1</code>'
    );
}
