import { Scenario } from "../types-legacy";

// Legacy scenarios archived — bleeding-vs-tamponade replaced by pro multi-phase version
export const scenarios: Record<string, Scenario> = {};

export const scenarioList = Object.values(scenarios).map((s) => ({
  id: s.id,
  title: s.title,
  subtitle: s.subtitle,
  difficulty: s.difficulty,
  duration: s.duration,
  tags: s.tags,
}));
