// Archived standard overlays (files preserved, removed from active export):
// - postop-bleeding.standard: parent scenario archived
// - cardiac-tamponade.standard: parent scenario archived
// - septic-shock.standard: parent scenario archived
// TODO: Create bleeding-to-tamponade.standard overlay
export type { StandardPresetOrder, PresetCategory } from "./types";

import type { StandardOverlay } from "@/lib/simulator/types";

export const standardOverlays: Record<string, StandardOverlay> = {
  // bleeding-to-tamponade standard overlay: pending design
};
