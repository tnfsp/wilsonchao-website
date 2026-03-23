// ICU Simulator v2 — Interactive Teaching Case Player
// Wilson controls the pace. Clerks discuss. Patient responds.

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string; // e.g. "10-15 min"
  tags: string[];
  patient: PatientInfo;
  nodes: Record<string, ScenarioNode>;
  startNode: string;
}

export interface PatientInfo {
  age: number;
  sex: "M" | "F";
  surgery: string;
  postOpDay: string;
  history: string;
  allergies?: string;
}

export interface ScenarioNode {
  act?: string; // e.g. "Act 1: 交班"
  vitals?: Partial<VitalSigns>;
  narrative: string;
  nurseNote?: string;
  image?: { src: string; caption: string };
  labData?: Record<string, string>;
  prompt?: string;
  choices?: Choice[];
  isEnding?: boolean;
  endingType?: "good" | "critical" | "bad";
  debrief?: DebriefItem[];
  autoAdvance?: string; // auto go to next node after reading
  teachingNote?: string; // Wilson-only note (shown subtly)
}

export interface Choice {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  nextNode: string;
}

export interface VitalSigns {
  hr: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  cvp: number;
  temp: number;
  chestTube: number;
  uo: number;
  pap?: string; // e.g. "35/15"
  extraLines?: { label: string; value: string; color?: string }[];
}

export interface DebriefItem {
  title: string;
  content: string;
  type: "key-point" | "pitfall" | "guideline" | "discussion";
}

export interface GameState {
  scenarioId: string;
  currentNode: string;
  history: { nodeId: string; choiceId?: string; timestamp: number }[];
  vitals: VitalSigns;
  startedAt: number;
}
