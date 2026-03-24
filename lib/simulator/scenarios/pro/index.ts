import { postopBleeding } from "./postop-bleeding";
import { cardiacTamponade } from "./cardiac-tamponade";
import { septicShock } from "./septic-shock";
import type { SimScenario } from "@/lib/simulator/types";

export const proScenarios: Record<string, SimScenario> = {
  "pro-postop-bleeding-01": postopBleeding,
  "pro-cardiac-tamponade-01": cardiacTamponade,
  "pro-septic-shock-01": septicShock,
};

export const proScenarioList = Object.values(proScenarios).map((s) => ({
  id: s.id,
  title: s.title,
  subtitle: s.subtitle,
  difficulty: s.difficulty,
  duration: s.duration,
  tags: s.tags,
}));
