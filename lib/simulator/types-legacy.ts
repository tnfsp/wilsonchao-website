// Legacy types for teacher/self-study mode (CasePlayer, SelfStudyPlayer, etc.)
// These are separate from the Pro simulator types in types.ts

export interface LegacyVitalSigns {
  hr: number;
  bpSys: number;
  bpDia: number;
  spo2: number;
  cvp: number;
  temp: number;
  chestTube?: number;
  uo?: number;
  pap?: number;
  extraLines?: Array<{ label: string; value: string | number; unit?: string; color?: string }>;
  [key: string]: any;
}

export interface DebriefItem {
  type: string;
  title: string;
  content: string;
  points?: string[];
  pitfalls?: string[];
  guidelines?: string[];
}

export interface ScenarioChoice {
  id?: string;
  text?: string;
  label?: string;
  description?: string;
  emoji?: string;
  next?: string;
  nextNode?: string;
  consequence?: string;
}

export interface ScenarioNode {
  act?: string;
  vitals?: Partial<LegacyVitalSigns>;
  narrative: string;
  teachingNote?: string;
  nurseNote?: string;
  labData?: Record<string, string>;
  prompt?: string;
  choices?: ScenarioChoice[];
  debrief?: DebriefItem[];
  isEnd?: boolean;
  isEnding?: boolean;
  endingType?: string;
  autoAdvance?: string;
  autoAdvanceDelay?: number;
}

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  difficulty: string;
  duration: string;
  tags: string[];
  patient: {
    age: number;
    sex: string;
    surgery: string;
    postOpDay: string;
    history: string;
    allergies: string;
  };
  startNode: string;
  nodes: Record<string, ScenarioNode>;
}

// Re-export VitalSigns as legacy alias
export type VitalSigns = LegacyVitalSigns;
