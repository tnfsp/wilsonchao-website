export { postopBleedingStandard, postopBleedingPresets } from "./postop-bleeding.standard";
export { cardiacTamponadeStandard, cardiacTamponadePresets } from "./cardiac-tamponade.standard";
export { septicShockStandard, septicShockPresets } from "./septic-shock.standard";
export type { StandardPresetOrder, PresetCategory } from "./types";

import type { StandardOverlay } from "@/lib/simulator/types";
import { postopBleedingStandard } from "./postop-bleeding.standard";
import { cardiacTamponadeStandard } from "./cardiac-tamponade.standard";
import { septicShockStandard } from "./septic-shock.standard";

export const standardOverlays: Record<string, StandardOverlay> = {
  "pro-postop-bleeding-01": postopBleedingStandard,
  "pro-cardiac-tamponade-01": cardiacTamponadeStandard,
  "pro-septic-shock-01": septicShockStandard,
};
