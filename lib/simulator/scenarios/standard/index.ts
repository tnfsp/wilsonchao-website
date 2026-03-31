// Archived standard overlays (files preserved, removed from active export):
// - postop-bleeding.standard: parent scenario archived
// - cardiac-tamponade.standard: parent scenario archived
// - septic-shock.standard: parent scenario archived
export type { StandardPresetOrder, PresetCategory } from "./types";

import type { StandardOverlay } from "@/lib/simulator/types";
import { bleedingToTamponadeStandard } from "./bleeding-to-tamponade.standard";

export const standardOverlays: Record<string, StandardOverlay> = {
  "pro-bleeding-to-tamponade-01": bleedingToTamponadeStandard,
};
