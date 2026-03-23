import { postopBleeding } from "./postop-bleeding";
import type { SimScenario } from "@/lib/simulator/types";

export const proScenarios: Record<string, SimScenario> = {
  "pro-postop-bleeding-01": postopBleeding,
};

export const proScenarioList = Object.values(proScenarios).map((s) => ({
  id: s.id,
  title: s.title,
  subtitle: s.subtitle,
  difficulty: s.difficulty,
  duration: s.duration,
  tags: s.tags,
}));
