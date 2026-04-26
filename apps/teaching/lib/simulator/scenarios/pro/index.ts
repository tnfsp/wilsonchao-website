// Archived scenarios (files preserved, removed from active export):
// - postop-bleeding: covered by bleeding-to-tamponade Phase 1
// - cardiac-tamponade: covered by bleeding-to-tamponade Phase 2
// - septic-shock: standalone, will return as separate scenario later
import { bleedingToTamponade } from "./bleeding-to-tamponade";
import type { SimScenario } from "@/lib/simulator/types";

export const proScenarios: Record<string, SimScenario> = {
  "pro-bleeding-to-tamponade-01": bleedingToTamponade,
};

// Diagnostic tags to hide from the scenario list (would reveal the answer)
const diagnosticTags = new Set([
  "hemorrhage", "tamponade", "beck-triad", "re-exploration",
  "re-sternotomy", "sepsis", "septic-shock", "wound-infection",
]);

export const proScenarioList = Object.values(proScenarios).map((s) => ({
  id: s.id,
  title: s.hiddenTitle ?? s.title,
  subtitle: s.hiddenSubtitle ?? s.subtitle,
  difficulty: s.difficulty,
  duration: s.duration,
  tags: s.tags.filter((t) => !diagnosticTags.has(t)),
}));
