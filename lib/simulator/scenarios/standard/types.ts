// Standard mode — extended types for preset order UI
// These extend the base PresetOrder with UI/feedback metadata

import type { PresetOrder, ActiveEffect } from "@/lib/simulator/types";

export type PresetCategory = "medication" | "procedure" | "lab" | "communication";

export interface StandardPresetOrder extends PresetOrder {
  icon: string;
  category: PresetCategory;
  isCorrect: boolean;
  feedbackIfWrong?: string;
  penaltyEffect?: ActiveEffect;
}

export interface NurseUrgencyEvent {
  id: string;
  triggerAfterIdleMinutes: number; // game-minutes of player inactivity
  message: string;
  repeatAfterMinutes?: number; // optional: re-fire if still idle
}
