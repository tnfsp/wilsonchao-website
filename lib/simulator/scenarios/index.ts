import { Scenario } from "../types";
import { bleedingVsTamponade } from "./bleeding-vs-tamponade";

export const scenarios: Record<string, Scenario> = {
  "bleeding-vs-tamponade": bleedingVsTamponade,
};

export const scenarioList = Object.values(scenarios).map((s) => ({
  id: s.id,
  title: s.title,
  subtitle: s.subtitle,
  difficulty: s.difficulty,
  duration: s.duration,
  tags: s.tags,
}));
