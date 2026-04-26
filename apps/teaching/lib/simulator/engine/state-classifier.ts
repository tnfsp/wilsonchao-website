/**
 * State Classifier — Auto-detect patient shock type from BioGears vitals
 *
 * Used by:
 * - PocusCanvas: renders appropriate findings
 * - Lab Engine: adjust derived values
 * - Debrief: track diagnostic accuracy
 */

import type { BioGearsState } from "./biogears-client";

export type ShockType =
  | "normal"
  | "hypovolemic"
  | "cardiogenic"
  | "cardiac_tamponade"
  | "distributive"   // septic, anaphylactic
  | "obstructive"    // PE, tension pneumo
  | "mixed";

export interface PatientClassification {
  shockType: ShockType;
  confidence: number;       // 0-1
  lethalTriad: {
    hypothermia: boolean;    // temp < 36°C
    acidosis: boolean;       // pH < 7.25
    coagulopathy: boolean;   // inferred from blood loss
  };
  volumeStatus: "depleted" | "normal" | "overloaded";
  severity: "stable" | "compensating" | "decompensating" | "critical" | "arrest";
  details: string;
}

/**
 * Classify patient state from BioGears vitals.
 * Works without BioGears too — pass null and get a minimal classification.
 */
export function classifyPatientState(
  bgState: BioGearsState | null,
  scenarioPathology?: string
): PatientClassification {
  if (!bgState?.ok) {
    // Fallback: use scenario pathology hint
    return {
      shockType: mapPathology(scenarioPathology),
      confidence: 0.3,
      lethalTriad: { hypothermia: false, acidosis: false, coagulopathy: false },
      volumeStatus: "normal",
      severity: "stable",
      details: "No BioGears data — using scenario hint",
    };
  }

  const { vitals, labs, patient } = bgState;

  // ── Extract key values ──
  const hr = vitals.hr;
  const map = vitals.map;
  const sbp = vitals.sbp;
  const cvp = vitals.cvp;
  const co = vitals.cardiac_output;     // L/min
  const ef = vitals.ejection_fraction;  // 0-1
  const bv = vitals.blood_volume_mL;
  const temp = vitals.temperature;
  const spo2 = vitals.spo2;
  const pH = labs.pH;

  const bvFraction = (bv ?? 5500) / 5500;

  // ── Lethal Triad ──
  const hypothermia = temp < 36;
  const acidosis = pH < 7.25;
  const coagulopathy = bvFraction < 0.65; // proxy: lost >35% blood volume

  // ── Severity ──
  let severity: PatientClassification["severity"] = "stable";
  if (patient.event_cardiac_arrest) {
    severity = "arrest";
  } else if (map < 40 || hr > 150 || spo2 < 0.8) {
    severity = "critical";
  } else if (map < 55 || hr > 130 || spo2 < 0.88) {
    severity = "decompensating";
  } else if (map < 70 || hr > 110) {
    severity = "compensating";
  }

  // ── Volume Status ──
  let volumeStatus: PatientClassification["volumeStatus"] = "normal";
  if (bvFraction < 0.8 || cvp < 4) {
    volumeStatus = "depleted";
  } else if (cvp > 15 || bvFraction > 1.15) {
    volumeStatus = "overloaded";
  }

  // ── Shock Type Classification ──
  // Uses pattern matching on hemodynamic profile

  let shockType: ShockType = "normal";
  let confidence = 0.5;
  const reasons: string[] = [];

  // Cardiac Tamponade: high CVP + low CO + equalization of pressures
  if (cvp > 15 && co < 4 && (ef ?? 0.55) > 0.35) {
    shockType = "cardiac_tamponade";
    confidence = 0.85;
    reasons.push(`CVP ${cvp.toFixed(0)} (high) + CO ${co.toFixed(1)} (low) + preserved EF`);
    if (bvFraction > 0.85) {
      confidence = 0.9;
      reasons.push("Blood volume preserved — obstruction, not hemorrhage");
    }
  }
  // Cardiogenic: low CO + low EF + normal/high CVP
  else if (co < 4 && (ef ?? 0.55) < 0.35 && cvp > 8) {
    shockType = "cardiogenic";
    confidence = 0.8;
    reasons.push(`EF ${((ef ?? 0.55) * 100).toFixed(0)}% (low) + CO ${co.toFixed(1)} + CVP ${cvp.toFixed(0)} (elevated)`);
  }
  // Hypovolemic: low blood volume + low CVP + high HR
  else if (bvFraction < 0.8 && cvp < 6 && hr > 100) {
    shockType = "hypovolemic";
    confidence = 0.85;
    reasons.push(`BV ${(bvFraction * 100).toFixed(0)}% + CVP ${cvp.toFixed(0)} (low) + HR ${hr.toFixed(0)}`);
  }
  // Distributive (septic): high CO + low SVR (inferred: low MAP despite reasonable CO)
  else if (co > 6 && map < 65 && hr > 100) {
    shockType = "distributive";
    confidence = 0.75;
    reasons.push(`CO ${co.toFixed(1)} (high) + MAP ${map.toFixed(0)} (low) = low SVR pattern`);
    if (temp > 38.5) {
      confidence = 0.85;
      reasons.push(`Temp ${temp.toFixed(1)}°C — febrile`);
    }
  }
  // Mixed: multiple patterns
  else if (severity !== "stable" && severity !== "compensating") {
    // Check for mixed picture
    const hasLowCO = co < 4.5;
    const hasLowBV = bvFraction < 0.85;
    const hasHighCVP = cvp > 12;
    const factors = [hasLowCO, hasLowBV, hasHighCVP].filter(Boolean).length;
    if (factors >= 2) {
      shockType = "mixed";
      confidence = 0.5;
      reasons.push("Multiple hemodynamic derangements");
    }
  }

  // If we still don't have a clear type but patient is unstable, fall back to scenario hint
  if (shockType === "normal" && severity !== "stable") {
    shockType = mapPathology(scenarioPathology);
    confidence = 0.4;
    reasons.push(`Unstable but unclear pattern — using scenario hint: ${scenarioPathology}`);
  }

  return {
    shockType,
    confidence,
    lethalTriad: { hypothermia, acidosis, coagulopathy },
    volumeStatus,
    severity,
    details: reasons.join("; ") || "Hemodynamically stable",
  };
}

function mapPathology(pathology?: string): ShockType {
  switch (pathology) {
    case "surgical_bleeding": return "hypovolemic";
    case "cardiac_tamponade": return "cardiac_tamponade";
    case "septic_shock": return "distributive";
    case "cardiogenic_shock": return "cardiogenic";
    default: return "normal";
  }
}
