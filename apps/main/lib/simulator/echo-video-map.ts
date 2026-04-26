/**
 * Echo Video Map — Maps pathology states to LITFL ultrasound MP4 paths
 *
 * Source: LITFL (Life in the Fast Lane) | Dr James Rippey
 * License: CC-BY-NC-SA 4.0
 *
 * Severity-based clip selection:
 *   Low   (0-40):  Minimal findings — small effusion or normal
 *   Medium (40-70): Moderate findings — visible effusion, early hemodynamic compromise
 *   High  (70-100): Severe findings — significant cardiac compression, tamponade physiology
 */

import type { POCUSViewType } from "@/lib/simulator/types";

// ── Types ────────────────────────────────────────────────────

export interface EchoVideoEntry {
  path: string;
  description: string;
  litflCase?: string;
}

type EchoVideoMap = Partial<Record<POCUSViewType, EchoVideoEntry>>;

/** A clip for UI display, with src path and Chinese label */
export interface EchoClip {
  src: string;
  label: string;
}

/** Severity tier: low (0-40), medium (40-70), high (70-100) */
export type SeverityTier = "low" | "medium" | "high";

/** POCUS category key used in ImagingModal tabs */
export type PocusCategoryKey = "cardiac" | "lung" | "ivc";

/** Severity-tiered clip set for a single POCUS category */
interface SeverityClipSet {
  low: EchoClip[];
  medium: EchoClip[];
  high: EchoClip[];
}

/** Full severity-based clip map for a pathology */
type SeverityClipMap = Partial<Record<PocusCategoryKey, SeverityClipSet>>;

// ── Raw video catalog (unchanged from previous version) ──────

const echoVideos: Record<string, EchoVideoMap> = {
  cardiac_tamponade: {
    a4c: {
      path: "/assets/echo/cardiac-tamponade/a4c.mp4",
      description: "Pericardial effusion with RA/RV diastolic collapse",
      litflCase: "Case 005",
    },
    subcostal: {
      path: "/assets/echo/cardiac-tamponade/subcostal.mp4",
      description: "Subcostal view — pericardial effusion",
      litflCase: "Case 005",
    },
    ivc: {
      path: "/assets/echo/cardiac-tamponade/ivc.mp4",
      description: "Distended IVC, no respiratory variation",
      litflCase: "Case 005",
    },
    plax: {
      path: "/assets/echo/cardiac-tamponade/plax.mp4",
      description: "PLAX — pericardial effusion, RV collapse",
      litflCase: "Case 005",
    },
    psax: {
      path: "/assets/echo/cardiac-tamponade/psax.mp4",
      description: "PSAX — circumferential effusion",
      litflCase: "Case 005",
    },
  },
  pericardial_effusion: {
    a4c: {
      path: "/assets/echo/pericardial-effusion/a4c.mp4",
      description: "Large pericardial effusion, echogenic",
      litflCase: "Case 006",
    },
  },
  hypovolemia: {
    ivc: {
      path: "/assets/echo/hypovolemia/ivc-long.mp4",
      description: "Flat IVC with complete inspiratory collapse — subcostal long-axis",
      litflCase: "Case 015",
    },
  },
  normal: {
    a4c: {
      path: "/assets/echo/normal/a4c.mp4",
      description: "Normal A4C — normal ventricular size and contractility",
    },
  },
  rv_dilation: {
    psax: {
      path: "/assets/echo/rv-dilation/psax-d-sign.mp4",
      description: "D-shaped septum — RV pressure/volume overload",
      litflCase: "Case 079",
    },
    a4c: {
      path: "/assets/echo/rv-dilation/a4c-mcconnell.mp4",
      description: "McConnell's sign — RV free wall akinesis, apical sparing",
      litflCase: "Case 079",
    },
  },
  takotsubo: {
    plax: {
      path: "/assets/echo/takotsubo/plax.mp4",
      description: "Apical ballooning, basal hyperkinesis",
      litflCase: "Case 091",
    },
    psax: {
      path: "/assets/echo/takotsubo/psax-1.mp4",
      description: "PSAX — regional wall motion abnormality",
      litflCase: "Case 091",
    },
    a4c: {
      path: "/assets/echo/takotsubo/a4c.mp4",
      description: "A4C — apical akinesis",
      litflCase: "Case 091",
    },
  },
  low_ef: {
    // Reuse takotsubo as closest available match for severe LV dysfunction
    plax: {
      path: "/assets/echo/takotsubo/plax.mp4",
      description: "Severely reduced LV function (proxy: takotsubo)",
      litflCase: "Case 091",
    },
    a4c: {
      path: "/assets/echo/takotsubo/a4c.mp4",
      description: "Dilated LV, global hypokinesis (proxy: takotsubo)",
      litflCase: "Case 091",
    },
  },
  pulmonary_edema: {
    lung: {
      path: "/assets/echo/lung-b-lines/b-lines.mp4",
      description: "Multiple B-lines — pulmonary oedema",
    },
  },
  pulmonary_edema_severe: {
    lung: {
      path: "/assets/echo/lung-b-lines/confluent-b-lines.mp4",
      description: "Confluent B-lines — severe pulmonary oedema",
    },
  },
  pneumothorax: {
    lung: {
      path: "/assets/echo/lung-pneumothorax/absent-sliding.mp4",
      description: "Absent lung sliding — pneumothorax",
    },
  },
};

// ── Severity-based clip mapping ──────────────────────────────
//
// Each pathology maps pocus-category (cardiac/ivc/lung) to 3 severity tiers.
// If a pathology is not severity-sensitive, all 3 tiers return the same clips.

const severityClipMap: Record<string, SeverityClipMap> = {
  // ── Cardiac Tamponade ──────────────────────────────────────
  // Pure tamponade scenario: severity drives how dramatic the echo looks
  cardiac_tamponade: {
    cardiac: {
      low: [
        { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C -- Pericardial effusion" },
        { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal -- Pericardial effusion" },
      ],
      medium: [
        { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C -- Pericardial effusion + early RV compression" },
        { src: "/assets/echo/cardiac-tamponade/plax.mp4", label: "PLAX -- Pericardial effusion" },
        { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal -- Effusion" },
      ],
      high: [
        { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C -- RV diastolic collapse + large effusion" },
        { src: "/assets/echo/cardiac-tamponade/plax.mp4", label: "PLAX -- Significant pericardial effusion" },
        { src: "/assets/echo/cardiac-tamponade/psax.mp4", label: "PSAX -- Circumferential effusion" },
        { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal -- Swinging heart" },
      ],
    },
    ivc: {
      low: [
        { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC -- Mildly distended" },
      ],
      medium: [
        { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC -- Distended, reduced respiratory variation" },
      ],
      high: [
        { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC -- Plethoric, no collapsibility (> 25mm)" },
      ],
    },
    lung: {
      low: [],
      medium: [],
      high: [],
    },
  },

  // ── Tamponade (alias, used in Phase 1 early-effusion override) ─
  tamponade: {
    cardiac: {
      low: [
        { src: "/assets/echo/pericardial-effusion/a4c.mp4", label: "A4C -- Small pericardial effusion" },
      ],
      medium: [
        { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C -- Moderate pericardial effusion" },
        { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal -- Effusion visible" },
      ],
      high: [
        { src: "/assets/echo/cardiac-tamponade/a4c.mp4", label: "A4C -- RV diastolic collapse" },
        { src: "/assets/echo/cardiac-tamponade/plax.mp4", label: "PLAX -- Large effusion" },
        { src: "/assets/echo/cardiac-tamponade/subcostal.mp4", label: "Subcostal -- Swinging heart" },
      ],
    },
    ivc: {
      low: [
        { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC -- Borderline distended" },
      ],
      medium: [
        { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC -- Distended" },
      ],
      high: [
        { src: "/assets/echo/cardiac-tamponade/ivc.mp4", label: "IVC -- Plethoric, no collapsibility" },
      ],
    },
    lung: {
      low: [],
      medium: [],
      high: [],
    },
  },

  // ── Surgical Bleeding ──────────────────────────────────────
  // Low: normal heart, flat IVC (hypovolemia)
  // Medium: still normal heart, but IVC more collapsed + early hint of pericardial effusion
  // High: early effusion visible (transition hint toward tamponade)
  surgical_bleeding: {
    cardiac: {
      low: [
        { src: "/assets/echo/normal/a4c.mp4", label: "A4C -- Normal LV function (hyperdynamic)" },
      ],
      medium: [
        { src: "/assets/echo/normal/a4c.mp4", label: "A4C -- Hyperdynamic LV, no effusion" },
      ],
      high: [
        { src: "/assets/echo/pericardial-effusion/a4c.mp4", label: "A4C -- Small pericardial effusion visible" },
      ],
    },
    ivc: {
      low: [
        { src: "/assets/echo/hypovolemia/ivc-long.mp4", label: "IVC Long Axis -- Collapsing (hypovolemia)" },
      ],
      medium: [
        { src: "/assets/echo/hypovolemia/ivc-long.mp4", label: "IVC Long Axis -- Flat, significant collapse" },
        { src: "/assets/echo/hypovolemia/ivc-trans.mp4", label: "IVC Trans -- Marked respiratory variation" },
      ],
      high: [
        { src: "/assets/echo/hypovolemia/ivc-long.mp4", label: "IVC Long Axis -- Collapsed" },
        { src: "/assets/echo/hypovolemia/ivc-trans.mp4", label: "IVC Trans -- Significant variation" },
      ],
    },
    lung: {
      low: [],
      medium: [],
      high: [],
    },
  },

  // ── LCOS (Low Cardiac Output Syndrome) ─────────────────────
  lcos: {
    cardiac: {
      low: [
        { src: "/assets/echo/takotsubo/a4c.mp4", label: "A4C -- Mildly reduced LV function" },
      ],
      medium: [
        { src: "/assets/echo/takotsubo/a4c.mp4", label: "A4C -- LV dysfunction" },
        { src: "/assets/echo/takotsubo/plax.mp4", label: "PLAX -- Reduced contractility" },
      ],
      high: [
        { src: "/assets/echo/takotsubo/a4c.mp4", label: "A4C -- Severe LV dysfunction" },
        { src: "/assets/echo/takotsubo/plax.mp4", label: "PLAX -- Severely reduced contractility" },
      ],
    },
    ivc: {
      low: [],
      medium: [],
      high: [],
    },
    lung: {
      low: [],
      medium: [
        { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines -- Pulmonary edema" },
      ],
      high: [
        { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines -- Pulmonary edema" },
        { src: "/assets/echo/lung-b-lines/confluent-b-lines.mp4", label: "Confluent B-lines -- Severe pulmonary edema" },
      ],
    },
  },

  // ── Septic Shock ───────────────────────────────────────────
  septic_shock: {
    cardiac: {
      low: [],
      medium: [],
      high: [],
    },
    ivc: {
      low: [],
      medium: [],
      high: [],
    },
    lung: {
      low: [],
      medium: [
        { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines -- ARDS / Pulmonary edema" },
      ],
      high: [
        { src: "/assets/echo/lung-b-lines/b-lines.mp4", label: "Lung B-lines -- ARDS / Pulmonary edema" },
        { src: "/assets/echo/lung-b-lines/confluent-b-lines.mp4", label: "Confluent B-lines -- Severe pulmonary infiltrates" },
      ],
    },
  },

  // ── Tension Pneumothorax ───────────────────────────────────
  tension_pneumothorax: {
    cardiac: {
      low: [],
      medium: [],
      high: [],
    },
    ivc: {
      low: [],
      medium: [],
      high: [],
    },
    lung: {
      low: [
        { src: "/assets/echo/lung-pneumothorax/absent-sliding.mp4", label: "Lung -- Absent sliding (pneumothorax)" },
      ],
      medium: [
        { src: "/assets/echo/lung-pneumothorax/absent-sliding.mp4", label: "Lung -- Absent sliding (pneumothorax)" },
      ],
      high: [
        { src: "/assets/echo/lung-pneumothorax/absent-sliding.mp4", label: "Lung -- Absent sliding (pneumothorax)" },
      ],
    },
  },
};

// ── Public API ────────────────────────────────────────────────

/**
 * Determine severity tier from a 0-100 severity score.
 */
export function getSeverityTier(severity: number): SeverityTier {
  if (severity < 40) return "low";
  if (severity < 70) return "medium";
  return "high";
}

/**
 * Get echo clips for a given pathology, POCUS category, and severity.
 *
 * This is the primary function used by ImagingModal to select which
 * video clips to show based on the current patient state.
 *
 * @param pathology - Current pathology string (e.g., "cardiac_tamponade")
 * @param category  - POCUS category ("cardiac" | "ivc" | "lung")
 * @param severity  - Patient severity score (0-100)
 * @returns Array of EchoClip objects to render
 */
export function getClipsForSeverity(
  pathology: string,
  category: PocusCategoryKey,
  severity: number,
): EchoClip[] {
  const map = severityClipMap[pathology];
  if (!map) return [];

  const catMap = map[category];
  if (!catMap) return [];

  const tier = getSeverityTier(severity);
  return catMap[tier] ?? [];
}

/**
 * Get the echo video path for a given pathology and POCUS view.
 * Returns null if no video is available for this combination.
 *
 * (Preserved for backward compatibility with echo-video-map consumers.)
 */
export function getEchoVideo(
  pathology: string,
  view: POCUSViewType,
): EchoVideoEntry | null {
  const map = echoVideos[pathology];
  if (!map) return null;
  return map[view] ?? null;
}

/**
 * Get all available views for a pathology.
 */
export function getAvailableViews(
  pathology: string,
): { view: POCUSViewType; entry: EchoVideoEntry }[] {
  const map = echoVideos[pathology];
  if (!map) return [];
  return Object.entries(map).map(([view, entry]) => ({
    view: view as POCUSViewType,
    entry: entry as EchoVideoEntry,
  }));
}

export const ECHO_ATTRIBUTION = {
  source: "LITFL (Life in the Fast Lane)",
  author: "Dr James Rippey",
  license: "CC-BY-NC-SA 4.0",
  url: "https://litfl.com",
};

export const ECHO_ATTRIBUTION_WIKIMEDIA = {
  source: "Wikimedia Commons (CardioNetworks ECHOpedia)",
  author: "Vdbilt / CardioNetworks",
  license: "CC-BY-SA 3.0",
  url: "https://commons.wikimedia.org/wiki/File:A4C_normal_(CardioNetworks_ECHOpedia).webm",
};
