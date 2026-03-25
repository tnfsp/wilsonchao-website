"use client";

import { useState, useCallback } from "react";
import { useProGameStore } from "@/lib/simulator/store";
import type { PEFinding } from "@/lib/simulator/types";

// ── PE body-region definitions ────────────────────────────────

interface PERegion {
  key: string;
  label: string;
  shortLabel: string;
  view: "front" | "back";
}

const PE_REGIONS: PERegion[] = [
  { key: "head_neck",    label: "Head & Neck",     shortLabel: "Head/Neck",  view: "front" },
  { key: "chest",        label: "Chest",           shortLabel: "Chest",      view: "front" },
  { key: "lungs",        label: "Lungs",           shortLabel: "Lungs",      view: "front" },
  { key: "heart",        label: "Heart",           shortLabel: "Heart",      view: "front" },
  { key: "abdomen",      label: "Abdomen",         shortLabel: "Abdomen",    view: "front" },
  { key: "extremities",  label: "Extremities",     shortLabel: "Limbs",      view: "front" },
  { key: "tubes_lines",  label: "Tubes & Lines",   shortLabel: "Tubes",      view: "front" },
  { key: "back",         label: "Back",            shortLabel: "Back",       view: "back"  },
];

// ── SVG hotspot paths ──────────────────────────────────────────
// ViewBox: 0 0 200 440  (slim upright figure, front view)
// Each region is a closed SVG path forming a clickable zone.

const FRONT_HOTSPOTS: Record<string, string> = {
  // Head + neck: oval head + neck column
  head_neck:
    "M 85 12 C 75 12, 65 28, 65 48 C 65 68, 75 80, 85 82 L 85 98 L 115 98 L 115 82 C 125 80, 135 68, 135 48 C 135 28, 125 12, 115 12 Z",
  // Chest: upper torso (sternotomy zone)
  chest:
    "M 68 100 L 132 100 L 132 160 L 68 160 Z",
  // Lungs: left + right lateral chest  (drawn as two separated wing-like areas)
  lungs:
    "M 58 105 L 68 100 L 68 170 L 58 165 Z M 132 100 L 142 105 L 142 165 L 132 170 Z",
  // Heart: small zone center-left chest
  heart:
    "M 90 130 C 85 130, 82 140, 85 150 C 88 158, 95 162, 100 162 C 105 162, 112 158, 115 150 C 118 140, 115 130, 110 130 C 106 126, 94 126, 90 130 Z",
  // Abdomen
  abdomen:
    "M 70 162 L 130 162 L 135 230 L 65 230 Z",
  // Extremities: upper arms + forearms + lower legs (multi-path)
  extremities:
    "M 42 110 L 58 105 L 55 200 L 38 200 Z M 142 105 L 158 110 L 162 200 L 145 200 Z M 72 280 L 92 280 L 90 430 L 75 430 Z M 108 280 L 128 280 L 125 430 L 110 430 Z",
  // Tubes & lines: small icons at typical insertion sites (right neck + left chest drain)
  tubes_lines:
    "M 118 85 L 138 78 L 142 92 L 122 98 Z M 55 175 L 65 170 L 68 185 L 58 188 Z",
};

const BACK_HOTSPOT: string =
  "M 68 100 L 132 100 L 140 230 L 60 230 Z";

// ── Silhouette outline (decorative, not clickable) ─────────────
const SILHOUETTE_FRONT =
  "M 100 10 C 82 10, 62 28, 62 50 C 62 72, 80 85, 85 88 L 85 98 " +
  "L 58 105 L 35 115 L 30 200 L 50 205 L 55 200 L 58 230 " +
  "L 65 235 L 68 280 L 70 280 L 92 280 L 90 430 L 110 430 L 108 280 L 130 280 " +
  "L 132 280 L 135 235 L 142 230 L 145 200 L 150 205 L 170 200 L 165 115 " +
  "L 142 105 L 115 98 L 115 88 C 120 85, 138 72, 138 50 C 138 28, 118 10, 100 10 Z";

const SILHOUETTE_BACK =
  "M 100 10 C 82 10, 62 28, 62 50 C 62 72, 80 85, 85 88 L 85 98 " +
  "L 58 105 L 35 115 L 30 200 L 50 205 L 55 200 L 58 230 " +
  "L 65 235 L 68 280 L 70 280 L 92 280 L 90 430 L 110 430 L 108 280 L 130 280 " +
  "L 132 280 L 135 235 L 142 230 L 145 200 L 150 205 L 170 200 L 165 115 " +
  "L 142 105 L 115 98 L 115 88 C 120 85, 138 72, 138 50 C 138 28, 118 10, 100 10 Z";

// ── Component ────────────────────────────────────────────────

export function PEModal() {
  const activeModal = useProGameStore((s) => s.activeModal);
  const { scenario, patient, closeModal, addTimelineEntry } = useProGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [examined, setExamined] = useState<Set<string>>(new Set());
  const [showFinding, setShowFinding] = useState(false);
  const [viewSide, setViewSide] = useState<"front" | "back">("front");

  const handleSelectArea = useCallback((key: string) => {
    if (selected === key) {
      setSelected(null);
      setShowFinding(false);
      return;
    }
    setSelected(key);
    setShowFinding(false);
    setTimeout(() => setShowFinding(true), 250);
  }, [selected]);

  const handleRecordAction = useCallback((key: string) => {
    const region = PE_REGIONS.find((r) => r.key === key);
    if (!region) return;

    const actionAdvance = useProGameStore.getState().actionAdvance;
    actionAdvance(2);

    addTimelineEntry({
      gameTime: useProGameStore.getState().clock.currentTime,
      type: "player_action",
      content: `PE: ${region.label}`,
      sender: "player",
    });

    useProGameStore.setState((state) => ({
      playerActions: [
        ...state.playerActions,
        {
          action: `pe:${key}:${region.label}`,
          gameTime: useProGameStore.getState().clock.currentTime,
          category: "pe",
        },
      ],
    }));

    setExamined((prev) => new Set(prev).add(key));
  }, [addTimelineEntry]);

  if (activeModal !== "pe" || !scenario) return null;

  const phased = patient?.pathology ? scenario.phasedFindings?.[patient.pathology] : undefined;
  const physicalExam = (phased?.physicalExam ?? scenario.physicalExam) as Record<string, PEFinding>;
  const currentFinding: PEFinding | undefined = selected ? physicalExam[selected] : undefined;
  const currentRegion = selected ? PE_REGIONS.find((r) => r.key === selected) : undefined;
  const frontRegions = PE_REGIONS.filter((r) => r.view === "front");
  const totalRegions = PE_REGIONS.filter((r) => physicalExam[r.key]).length;

  // ── Render a single hotspot in the SVG ──
  function renderHotspot(key: string, d: string) {
    const isSelected = selected === key;
    const isDone = examined.has(key);
    const region = PE_REGIONS.find((r) => r.key === key);
    if (!region) return null;

    return (
      <path
        key={key}
        d={d}
        onClick={() => {
          if (key === "back") {
            // "back" hotspot doesn't exist in front view; handled by toggle
          }
          handleSelectArea(key);
        }}
        className="cursor-pointer transition-all duration-200"
        fill={
          isSelected
            ? "rgba(20, 184, 166, 0.35)"
            : isDone
            ? "rgba(20, 184, 166, 0.15)"
            : "rgba(20, 184, 166, 0.06)"
        }
        stroke={
          isSelected
            ? "#14b8a6"
            : isDone
            ? "#0d9488"
            : "rgba(20, 184, 166, 0.25)"
        }
        strokeWidth={isSelected ? 2 : 1}
        fillRule="evenodd"
      >
        <title>{region.label}</title>
      </path>
    );
  }

  // ── SVG body silhouette (front or back) ──
  function renderSilhouette() {
    const isFront = viewSide === "front";

    return (
      <svg
        viewBox="0 0 200 440"
        className="w-full h-full"
        style={{ maxHeight: "100%" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background silhouette outline */}
        <path
          d={isFront ? SILHOUETTE_FRONT : SILHOUETTE_BACK}
          fill="rgba(20, 184, 166, 0.04)"
          stroke="rgba(20, 184, 166, 0.2)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Midline (sternotomy reference on front) */}
        {isFront && (
          <line
            x1={100} y1={98} x2={100} y2={230}
            stroke="rgba(20, 184, 166, 0.1)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        )}

        {/* Clickable hotspots */}
        {isFront ? (
          <>
            {frontRegions.map((r) => {
              const d = FRONT_HOTSPOTS[r.key];
              return d ? renderHotspot(r.key, d) : null;
            })}
          </>
        ) : (
          renderHotspot("back", BACK_HOTSPOT)
        )}

        {/* Region labels (small text near each hotspot) */}
        {isFront ? (
          <>
            <text x={100} y={55} textAnchor="middle" className="fill-teal-500/60" style={{ fontSize: 7, fontFamily: "system-ui" }}>HEAD</text>
            <text x={100} y={135} textAnchor="middle" className="fill-teal-500/60" style={{ fontSize: 6, fontFamily: "system-ui" }}>CHEST</text>
            <text x={100} y={152} textAnchor="middle" className="fill-teal-500/50" style={{ fontSize: 5, fontFamily: "system-ui" }}>&#9829;</text>
            <text x={47} y={140} textAnchor="middle" className="fill-teal-500/50" style={{ fontSize: 5, fontFamily: "system-ui" }}>L</text>
            <text x={153} y={140} textAnchor="middle" className="fill-teal-500/50" style={{ fontSize: 5, fontFamily: "system-ui" }}>R</text>
            <text x={100} y={200} textAnchor="middle" className="fill-teal-500/60" style={{ fontSize: 7, fontFamily: "system-ui" }}>ABD</text>
            <text x={140} y={88} textAnchor="start" className="fill-teal-500/40" style={{ fontSize: 5, fontFamily: "system-ui" }}>tubes</text>
          </>
        ) : (
          <text x={100} y={170} textAnchor="middle" className="fill-teal-500/60" style={{ fontSize: 8, fontFamily: "system-ui" }}>BACK</text>
        )}
      </svg>
    );
  }

  // ── Finding panel (shared between desktop right side and mobile bottom) ──
  function renderFindingPanel(compact = false) {
    if (!selected) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={`${compact ? "text-2xl" : "text-4xl"} mb-2 opacity-30`}>&#x1FA7A;</div>
            <p className="text-teal-500/40 text-sm">
              {viewSide === "front" ? "Point on the body to examine" : "Tap the highlighted area"}
            </p>
          </div>
        </div>
      );
    }

    if (!showFinding) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-5 h-5 mx-auto rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            <p className="text-teal-400/50 text-sm mt-2">Examining...</p>
          </div>
        </div>
      );
    }

    const isDone = examined.has(selected);

    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Area title bar */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <h3 className="text-teal-200 font-semibold text-sm">
            {currentRegion?.label}
          </h3>
          {isDone && (
            <span className="ml-auto text-[10px] text-teal-400 bg-teal-900/30 px-2 py-0.5 rounded-full border border-teal-700/30">
              Recorded
            </span>
          )}
        </div>

        {/* Finding card */}
        {currentFinding ? (
          <div
            className="rounded-lg border border-teal-800/40 p-3 mb-3 flex-1 overflow-y-auto"
            style={{ backgroundColor: "#002030" }}
          >
            <p className="text-[10px] text-teal-500/60 uppercase tracking-widest mb-1.5">
              Finding
            </p>
            <p className="text-teal-100 text-sm leading-relaxed whitespace-pre-line break-words">
              {currentFinding.finding}
            </p>
          </div>
        ) : (
          <div
            className="rounded-lg border border-teal-900/30 p-3 mb-3 flex-1 flex items-center justify-center"
            style={{ backgroundColor: "#001a27" }}
          >
            <p className="text-teal-500/40 text-sm italic">
              No notable finding
            </p>
          </div>
        )}

        {/* Record button */}
        {!isDone ? (
          <button
            onClick={() => handleRecordAction(selected)}
            className="w-full py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors border border-teal-600 flex-shrink-0"
          >
            Record to Chart
          </button>
        ) : (
          <div className="w-full py-2 rounded-lg text-center text-teal-400/60 text-sm border border-teal-900/30 flex-shrink-0">
            Recorded
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.80)" }}
    >
      <div
        className="w-full max-w-3xl rounded-xl border border-teal-800/50 shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "#001219", maxHeight: "92vh" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-teal-900/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-base leading-tight">
              Physical Exam
            </h2>
            <span className="text-teal-500/50 text-xs">
              {examined.size}/{totalRegions}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Front / Back toggle */}
            <button
              onClick={() => {
                const next = viewSide === "front" ? "back" : "front";
                setViewSide(next);
                // If switching to back, auto-select the back region
                if (next === "back") {
                  handleSelectArea("back");
                } else if (selected === "back") {
                  setSelected(null);
                  setShowFinding(false);
                }
              }}
              className="text-xs px-2.5 py-1 rounded-md border border-teal-700/40 text-teal-400 hover:bg-teal-900/30 transition-colors"
            >
              {viewSide === "front" ? "Flip \u2192 Back" : "Flip \u2192 Front"}
            </button>

            <button
              onClick={closeModal}
              className="text-teal-500/60 hover:text-white transition-colors text-lg font-light"
              aria-label="Close"
            >
              &#x2715;
            </button>
          </div>
        </div>

        {/* ── Desktop layout: silhouette left + finding right ── */}
        <div className="hidden md:flex flex-row flex-1 overflow-hidden min-h-0">
          {/* Left: SVG body */}
          <div className="w-[260px] flex-shrink-0 border-r border-teal-900/40 p-4 flex items-center justify-center">
            <div className="w-full" style={{ maxHeight: "60vh" }}>
              {renderSilhouette()}
            </div>
          </div>

          {/* Right: Finding panel */}
          <div className="flex-1 p-4 flex flex-col overflow-y-auto min-h-0">
            {renderFindingPanel()}
          </div>
        </div>

        {/* ── Mobile layout: silhouette top + finding bottom ── */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Top: SVG (compact) */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2 flex justify-center" style={{ maxHeight: "45vh" }}>
            <div className="h-full" style={{ maxWidth: 160 }}>
              {renderSilhouette()}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-teal-900/40 mx-4" />

          {/* Bottom: Finding */}
          <div className="flex-1 p-4 flex flex-col overflow-y-auto min-h-0">
            {renderFindingPanel(true)}
          </div>
        </div>

        {/* ── Footer ── */}
        {examined.size > 0 && (
          <div className="border-t border-teal-900/40 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
            <span className="text-teal-400/60 text-xs">
              {examined.size} / {totalRegions} examined
            </span>
            <button
              onClick={closeModal}
              className="text-xs text-teal-400 hover:text-teal-200 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
