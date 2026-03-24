import type { NurseUrgencyEvent } from "../scenarios/standard/types";

export interface UrgencyContext {
  currentGameMinutes: number;
  lastPlayerActionTime: number;
  firedUrgencyIds: Set<string>;
}

export function evaluateUrgency(
  events: NurseUrgencyEvent[],
  ctx: UrgencyContext,
): { toFire: NurseUrgencyEvent[]; updatedFiredIds: Set<string> } {
  const idleMinutes = ctx.currentGameMinutes - ctx.lastPlayerActionTime;
  const toFire: NurseUrgencyEvent[] = [];
  const updatedFiredIds = new Set(ctx.firedUrgencyIds);

  for (const evt of events) {
    if (updatedFiredIds.has(evt.id)) continue;
    if (idleMinutes >= evt.triggerAfterIdleMinutes) {
      toFire.push(evt);
      updatedFiredIds.add(evt.id);
    }
  }
  return { toFire, updatedFiredIds };
}
