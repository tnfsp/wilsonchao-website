/**
 * CT Output Engine — Derive chest tube output from BioGears state
 *
 * Formula:
 *   CT_output = hemorrhageRate × patency_factor
 *
 * patency_factor is determined by pericardium_volume_mL:
 *   < 50 mL   → 1.0  (fully patent, no clot obstruction)
 *   50-250 mL  → linear ramp from 1.0 down to 0.05
 *   > 250 mL   → 0.05 (nearly fully obstructed)
 *
 * hemorrhageRate is inferred from the delta of total_blood_volume_lost_mL
 * between successive BioGears snapshots.
 *
 * Milk/strip CT → temporarily sets isPatent = true and resets patency_factor
 * to 1.0. If effusion continues, CT re-clots in 3-5 minutes.
 */

import type { BioGearsState } from "./biogears-client";
import type { ChestTubeState, ChestTubeColor } from "../types";

// ============================================================
// State tracking for delta computation
// ============================================================

let _prevBloodVolumeLost = 0;
let _prevTimeS = 0;
let _cumulativeCtOutput = 0;
let _milkTimestamp: number | null = null;  // game sim-time when last milked

/**
 * Reset CT output engine state (call on scenario start).
 */
export function resetCtOutputEngine(initialTotalOutput: number = 0): void {
  _prevBloodVolumeLost = 0;
  _prevTimeS = 0;
  _cumulativeCtOutput = initialTotalOutput;
  _milkTimestamp = null;
}

/**
 * Record a milk/strip CT action. Temporarily restores patency.
 * @param simTimeS - current BioGears simulation time in seconds
 */
export function recordMilkCt(simTimeS: number): void {
  _milkTimestamp = simTimeS;
}

// ============================================================
// Core derivation
// ============================================================

/**
 * Compute patency_factor from pericardium volume.
 *
 * < 50 mL:    1.0 (fully patent)
 * 50-250 mL:  linear interpolation from 1.0 → 0.05
 * > 250 mL:   0.05 (nearly fully obstructed)
 *
 * After milk/strip CT: temporarily 1.0, decays back over 3-5 min.
 */
function computePatencyFactor(
  pericardiumVolumeMl: number,
  simTimeS: number,
): number {
  // Post-milk temporary patency window: 3-5 minutes (180-300 sim-seconds)
  const milkDuration = 240; // 4 minutes average
  if (_milkTimestamp !== null) {
    const elapsed = simTimeS - _milkTimestamp;
    if (elapsed < milkDuration) {
      // Linear decay from 1.0 back toward the "real" patency
      const milkFraction = 1 - (elapsed / milkDuration);
      const realPatency = rawPatencyFactor(pericardiumVolumeMl);
      return realPatency + milkFraction * (1.0 - realPatency);
    } else {
      _milkTimestamp = null; // milk effect expired
    }
  }

  return rawPatencyFactor(pericardiumVolumeMl);
}

/**
 * Raw patency factor without milk effect.
 */
function rawPatencyFactor(pericardiumVolumeMl: number): number {
  if (pericardiumVolumeMl < 50) return 1.0;
  if (pericardiumVolumeMl > 250) return 0.05;
  // Linear interpolation: 50 → 1.0, 250 → 0.05
  const t = (pericardiumVolumeMl - 50) / (250 - 50);
  return 1.0 - t * 0.95;
}

/**
 * Infer chest tube color from hemorrhage rate and patency.
 */
function inferCtColor(hemorrhageRateMlPerMin: number, patencyFactor: number): ChestTubeColor {
  if (hemorrhageRateMlPerMin > 3) {
    return patencyFactor > 0.5 ? "bright_red" : "dark_red";
  }
  if (hemorrhageRateMlPerMin > 1) {
    return "serosanguineous";
  }
  return "serous";
}

/**
 * Derive chest tube state from BioGears snapshot.
 *
 * @param bgState - Current BioGears state
 * @param currentCt - Current chest tube state from store (for cumulative tracking)
 * @returns Updated ChestTubeState derived from BioGears physiology
 */
export function deriveCtOutput(
  bgState: BioGearsState,
  currentCt: ChestTubeState,
): ChestTubeState {
  const hemodynamics = bgState.hemodynamics;
  const vitals = bgState.vitals;
  const simTimeS = bgState.time_s;

  // 1. Compute hemorrhage rate from delta of total_blood_volume_lost_mL
  const totalLost = hemodynamics?.total_blood_volume_lost_mL ?? 0;
  const deltaTime = simTimeS - _prevTimeS;

  let hemorrhageRateMlPerMin = 0;
  if (deltaTime > 0 && _prevTimeS > 0) {
    const deltaLost = Math.max(0, totalLost - _prevBloodVolumeLost);
    hemorrhageRateMlPerMin = (deltaLost / deltaTime) * 60; // convert to mL/min
  }

  // Update tracking
  _prevBloodVolumeLost = totalLost;
  _prevTimeS = simTimeS;

  // 2. Compute patency factor from pericardium volume
  const pericardiumVol = vitals.pericardium_volume_mL ?? 0;
  const patencyFactor = computePatencyFactor(pericardiumVol, simTimeS);

  // 3. CT output = hemorrhageRate × patency_factor (convert to cc/hr)
  const ctOutputCcPerHr = hemorrhageRateMlPerMin * 60 * patencyFactor;

  // 4. Accumulate total output
  if (deltaTime > 0) {
    const ctOutputThisTick = (hemorrhageRateMlPerMin * patencyFactor * deltaTime) / 60; // mL in this tick
    _cumulativeCtOutput += ctOutputThisTick;
  }

  // 5. Determine patency state
  const isPatent = patencyFactor > 0.3;
  const hasClots = pericardiumVol > 30 || !isPatent;

  // 6. Infer color
  const color = inferCtColor(hemorrhageRateMlPerMin, patencyFactor);

  return {
    currentRate: Math.round(ctOutputCcPerHr),
    totalOutput: Math.round(_cumulativeCtOutput),
    color,
    hasClots,
    isPatent,
    airLeak: currentCt.airLeak, // preserve existing state
  };
}

/**
 * Get the current hemorrhage rate in mL/min (for nurse trigger conditions).
 */
export function getCurrentHemorrhageRate(): number {
  return _prevBloodVolumeLost; // This is total lost, not rate
}

/**
 * Get cumulative CT output (for external access).
 */
export function getCumulativeCtOutput(): number {
  return _cumulativeCtOutput;
}
