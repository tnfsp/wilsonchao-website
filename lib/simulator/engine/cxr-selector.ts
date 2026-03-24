/**
 * CXR Selector — Maps patient state → CXR type
 *
 * Priority chain:
 *   1. tension_ptx   (scenario event fired)
 *   2. widened_mediastinum (cardiac_tamponade shock type)
 *   3. hemothorax    (blood_volume_loss > 15% + hemorrhage active)
 *   4. pulmonary_edema (carrico < 200 OR fluid overload)
 *   5. pleural_effusion (scenario flag)
 *   6. et_malposition (intubated + tube placed incorrectly)
 *   7. normal_postop  (default postop)
 *   8. normal         (post-extubation / non-postop)
 */

import type { BioGearsState } from "./biogears-client";
import type { Pathology } from "../types";

// ── Public types ─────────────────────────────────────────────

export type CXRType =
  | "normal_postop"        // sternotomy wires, mediastinal drain, clear lungs
  | "hemothorax"           // unilateral/bilateral opacity, meniscus sign
  | "widened_mediastinum"  // tamponade: mediastinal widening
  | "pulmonary_edema"      // bilateral perihilar infiltrates, Kerley B, cephalization
  | "tension_ptx"          // unilateral hyperexpansion, mediastinal shift
  | "pleural_effusion"     // blunted costophrenic angle, meniscus sign
  | "et_malposition"       // ET tube too high or low
  | "normal";              // clear lungs, no tubes (post-extubation)

export interface CXRSelection {
  type: CXRType;
  severity: number;       // 0-1, affects how dramatic the finding looks
  description: string;    // radiologist-style report text
  keyFindings: string[];
  affectedSide?: "left" | "right" | "bilateral";
}

// ── Input interface ──────────────────────────────────────────

export interface CXRSelectorInput {
  /** Live BioGears state — may be null if BioGears not running */
  bgState?: BioGearsState | null;
  /** Scenario's declared pathology */
  scenarioPathology?: Pathology | string;
  /** Set of fired event IDs from the game store */
  firedEventIds?: string[];
  /** Whether patient is currently intubated */
  isIntubated?: boolean;
  /** Whether this is a post-op scenario (shows sternotomy wires / drain) */
  isPostop?: boolean;
  /** Whether active hemorrhage is ongoing */
  hemorrhageActive?: boolean;
  /** Cumulative blood volume loss as fraction (0-1) */
  bloodVolumeLossFraction?: number;
  /** Override for the affected side in unilateral findings */
  affectedSide?: "left" | "right";
}

// ── Helpers ───────────────────────────────────────────────────

const NORMAL_BV_ML = 5500;

function getBloodVolumeLoss(bgState: BioGearsState | null | undefined): number {
  if (!bgState?.ok) return 0;
  const bv = bgState.vitals.blood_volume_mL ?? NORMAL_BV_ML;
  return Math.max(0, (NORMAL_BV_ML - bv) / NORMAL_BV_ML);
}

function getCarricoIndex(bgState: BioGearsState | null | undefined): number {
  if (!bgState?.ok) return 400;
  return bgState.respiratory?.carrico_index ?? 400;
}

function isFluidOverloaded(bgState: BioGearsState | null | undefined): boolean {
  if (!bgState?.ok) return false;
  const cvp = bgState.vitals.cvp;
  const bv = bgState.vitals.blood_volume_mL ?? NORMAL_BV_ML;
  return cvp > 18 || bv / NORMAL_BV_ML > 1.2;
}

function hasTensionPTXEvent(firedEventIds: string[] = []): boolean {
  return firedEventIds.some(
    (id) =>
      id.includes("tension_ptx") ||
      id.includes("tension_pneumo") ||
      id.includes("pneumothorax")
  );
}

// ── Main selector ─────────────────────────────────────────────

export function selectCXR(input: CXRSelectorInput): CXRSelection {
  const {
    bgState,
    scenarioPathology,
    firedEventIds = [],
    isIntubated = true,
    isPostop = true,
    hemorrhageActive = false,
    bloodVolumeLossFraction,
    affectedSide = "left",
  } = input;

  const bvLoss = bloodVolumeLossFraction ?? getBloodVolumeLoss(bgState);
  const carrico = getCarricoIndex(bgState);
  const fluidOverload = isFluidOverloaded(bgState);

  // ── 1. Tension PTX ───────────────────────────────────────────
  if (
    hasTensionPTXEvent(firedEventIds) ||
    scenarioPathology === "tension_pneumothorax"
  ) {
    const severity = Math.min(1, 0.6 + bvLoss * 0.4);
    return {
      type: "tension_ptx",
      severity,
      affectedSide,
      description:
        `TENSION PNEUMOTHORAX — ${affectedSide === "left" ? "Left" : "Right"}-sided tension pneumothorax. ` +
        `Marked hyperexpansion of the ${affectedSide} hemithorax with complete absence of lung markings. ` +
        `Tracheal deviation and mediastinal shift to the contralateral side. ` +
        `Compression of contralateral lung. ` +
        (isIntubated ? "ET tube in situ, pushed contralateral. " : "") +
        `URGENT: Needle decompression indicated.`,
      keyFindings: [
        `${affectedSide === "left" ? "Left" : "Right"} hemithorax hyperexpansion`,
        "Absent lung markings ipsilateral",
        `Mediastinal shift to ${affectedSide === "left" ? "right" : "left"}`,
        "Tracheal deviation",
        "Contralateral lung compression",
      ],
    };
  }

  // ── 2. Widened mediastinum (cardiac tamponade) ────────────────
  if (
    scenarioPathology === "cardiac_tamponade" ||
    scenarioPathology === "tamponade"
  ) {
    const cvp = bgState?.ok ? bgState.vitals.cvp : 18;
    const severity = Math.min(1, 0.5 + (Math.max(0, (cvp ?? 18) - 10) / 20));
    return {
      type: "widened_mediastinum",
      severity,
      affectedSide: "bilateral",
      description:
        `WIDENED MEDIASTINUM — Globular cardiac silhouette with cardiothoracic ratio > 0.55. ` +
        `Mediastinal widening consistent with pericardial effusion / tamponade physiology. ` +
        `Bilateral hilar fullness. Lung fields clear. ` +
        (isPostop
          ? "Sternotomy wires and mediastinal drain in situ. "
          : "") +
        (isIntubated ? "ET tube in standard position. " : "") +
        `Clinical context: post-cardiac surgery — tamponade until proven otherwise.`,
      keyFindings: [
        "Globular cardiac silhouette",
        "CT ratio > 0.55",
        "Mediastinal widening",
        "Clear lung fields",
        ...(isPostop ? ["Sternotomy wires present", "Mediastinal drain in situ"] : []),
      ],
    };
  }

  // ── 3. Hemothorax ─────────────────────────────────────────────
  if (
    (bvLoss > 0.15 && hemorrhageActive) ||
    scenarioPathology === "surgical_bleeding"
  ) {
    const severity = Math.min(1, bvLoss / 0.4);
    const side = affectedSide;
    return {
      type: "hemothorax",
      severity,
      affectedSide: side,
      description:
        `HEMOTHORAX — Homogeneous opacification of the ${side} hemithorax with meniscus sign. ` +
        `Estimated ${severity > 0.7 ? "large (>1500 mL)" : severity > 0.4 ? "moderate (500–1500 mL)" : "small (<500 mL)"} hemothorax. ` +
        `Blunting of ${side} costophrenic angle. ` +
        (severity > 0.5 ? `Contralateral mediastinal shift present. ` : "") +
        (isPostop ? `Sternotomy wires in situ. ` : "") +
        (isIntubated ? `ET tube in position. ` : "") +
        `Chest tube placement indicated.`,
      keyFindings: [
        `${side === "left" ? "Left" : "Right"} hemithorax opacification`,
        "Meniscus sign",
        `Blunted ${side} costophrenic angle`,
        ...(severity > 0.5 ? ["Contralateral mediastinal shift"] : []),
        ...(isPostop ? ["Sternotomy wires"] : []),
      ],
    };
  }

  // ── 4. Pulmonary edema ────────────────────────────────────────
  if (carrico < 200 || fluidOverload) {
    const severity = carrico < 100 ? 0.9 : carrico < 150 ? 0.7 : 0.5;
    return {
      type: "pulmonary_edema",
      severity,
      affectedSide: "bilateral",
      description:
        `PULMONARY EDEMA — Bilateral perihilar "butterfly" infiltrates. ` +
        (severity > 0.7
          ? `Diffuse alveolar opacification. Kerley B lines visible at bases. `
          : `Haziness predominant in perihilar regions. Early Kerley B lines. `) +
        `Upper lobe venous cephalization. Increased cardiothoracic ratio. ` +
        (isPostop ? `Sternotomy wires in situ. Mediastinal drain. ` : "") +
        (isIntubated ? `ET tube in standard position. ` : "") +
        `PaO2/FiO2 ratio ${carrico.toFixed(0)} mmHg — ${carrico < 100 ? "Severe" : carrico < 200 ? "Moderate" : "Mild"} ARDS criteria.`,
      keyFindings: [
        'Bilateral perihilar "butterfly" infiltrates',
        "Upper lobe cephalization",
        carrico < 150 ? "Kerley B lines" : "Early Kerley B lines",
        "Increased cardiac silhouette",
        `P/F ratio: ${carrico.toFixed(0)} mmHg`,
      ],
    };
  }

  // ── 5. Pleural effusion ───────────────────────────────────────
  // (scenario flag or mild fluid retention without full edema)
  if (fluidOverload || bgState?.vitals?.cvp != null && bgState.vitals.cvp > 14) {
    return {
      type: "pleural_effusion",
      severity: 0.4,
      affectedSide,
      description:
        `PLEURAL EFFUSION — Blunting of the ${affectedSide} costophrenic angle consistent with small-to-moderate pleural effusion. ` +
        `Meniscus sign present. ` +
        (isPostop ? `Sternotomy wires in situ. Mediastinal drain in position. ` : "") +
        (isIntubated ? `ET tube in position. ` : "") +
        `Lung fields otherwise clear. Consider drainage if symptomatic.`,
      keyFindings: [
        `Blunted ${affectedSide} costophrenic angle`,
        "Meniscus sign",
        "Small-to-moderate effusion",
        ...(isPostop ? ["Sternotomy wires"] : []),
      ],
    };
  }

  // ── 6. ET malposition (if intubated, no other finding) ───────
  // Not auto-selected here — would require explicit trigger
  // Kept as available type for future use

  // ── 7. Normal postop ─────────────────────────────────────────
  if (isPostop) {
    return {
      type: "normal_postop",
      severity: 0,
      affectedSide: "bilateral",
      description:
        `POST-OPERATIVE CHEST — Sternotomy wires intact. Mediastinal drain in situ. ` +
        (isIntubated
          ? `ET tube tip approximately 4–5 cm above the carina — standard position. `
          : `No ET tube (extubated). `) +
        `Lung fields clear bilaterally. No pneumothorax. No pleural effusion. ` +
        `Cardiac silhouette within normal limits. Mild mediastinal widening expected post-sternotomy.`,
      keyFindings: [
        "Sternotomy wires intact",
        "Mediastinal drain in situ",
        isIntubated ? "ET tube in standard position" : "Post-extubation",
        "Clear lung fields bilaterally",
        "No pneumothorax",
        "No significant effusion",
      ],
    };
  }

  // ── 8. Normal ────────────────────────────────────────────────
  return {
    type: "normal",
    severity: 0,
    affectedSide: "bilateral",
    description:
      `NORMAL CHEST — Clear lung fields bilaterally. ` +
      `Cardiac silhouette within normal limits (CT ratio ≤ 0.50). ` +
      `Sharp costophrenic angles. No pleural effusion. No pneumothorax. ` +
      `No acute cardiopulmonary process identified.`,
    keyFindings: [
      "Clear lung fields",
      "Normal cardiac silhouette",
      "Sharp costophrenic angles",
      "No effusion or pneumothorax",
    ],
  };
}

// ── Helper: build input from store state ─────────────────────

/**
 * Convenience function to build CXRSelectorInput from commonly
 * available store + engine data. Import this in components.
 */
export function buildCXRInput(params: {
  bgState?: BioGearsState | null;
  scenarioPathology?: Pathology | string;
  firedEventIds?: string[];
  placedOrderIds?: string[];    // to detect intubation
  isPostop?: boolean;
  hemorrhageActive?: boolean;
  bloodVolumeLossFraction?: number;
}): CXRSelectorInput {
  const {
    bgState,
    scenarioPathology,
    firedEventIds = [],
    placedOrderIds = [],
    isPostop = true,
    hemorrhageActive,
    bloodVolumeLossFraction,
  } = params;

  // Detect intubation from placed orders
  const isIntubated =
    placedOrderIds.some((id) =>
      id.includes("intubat") || id.includes("ett") || id.includes("vent")
    ) || isPostop; // postop patients are typically intubated

  // Detect hemorrhage activity from BioGears or blood volume loss
  const bvLoss = bloodVolumeLossFraction ?? getBloodVolumeLoss(bgState);
  const activeHemorrhage = hemorrhageActive ?? bvLoss > 0.05;

  return {
    bgState,
    scenarioPathology,
    firedEventIds,
    isIntubated,
    isPostop,
    hemorrhageActive: activeHemorrhage,
    bloodVolumeLossFraction: bvLoss,
  };
}
