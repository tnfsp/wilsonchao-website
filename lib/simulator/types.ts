// ICU 值班模擬器 Pro — 核心型別
// 所有 engine / store / component 共用

// ============================================================
// Vital Signs
// ============================================================

export interface VitalSigns {
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  spo2: number;
  cvp: number;
  temperature: number;
  rr: number;
  etco2?: number;
  bloodVolume?: number;          // mL — from BioGears blood_volume_mL
  ejectionFraction?: number;     // 0-100 % — from BioGears ejection_fraction
  aLineWaveform: ALineWaveform;
}

export type ALineWaveform =
  | "normal"
  | "dampened"
  | "low_amplitude"
  | "wide_pp_variation"
  | "pulsus_alternans";

// ============================================================
// Chest Tube
// ============================================================

export interface ChestTubeState {
  currentRate: number;          // cc/hr
  totalOutput: number;          // 累計 cc
  color: ChestTubeColor;
  hasClots: boolean;
  isPatent: boolean;
  airLeak: boolean;
}

export type ChestTubeColor =
  | "bright_red"
  | "dark_red"
  | "serosanguineous"
  | "serous";

// ============================================================
// I/O Balance
// ============================================================

export interface IOBalance {
  totalInput: number;
  totalOutput: number;
  netBalance: number;
  breakdown: {
    input: { iv: number; blood: number; oral: number };
    output: { chestTube: number; urine: number; ngo: number };
  };
}

// ============================================================
// Patient State
// ============================================================

export interface PatientState {
  vitals: VitalSigns;
  baselineVitals: VitalSigns;   // scenario initial vitals (never modified)
  chestTube: ChestTubeState;
  pathology: Pathology;
  severity: number;             // 0-100
  activeEffects: ActiveEffect[];
  ioBalance: IOBalance;
  lethalTriad: LethalTriadState;
}

export type Pathology =
  | "surgical_bleeding"
  | "coagulopathy"
  | "tamponade"
  | "cardiac_tamponade"
  | "lcos"
  | "vasoplegia"
  | "tension_pneumothorax"
  | "postop_af"
  | "septic_shock";

export interface LethalTriadState {
  hypothermia: boolean;         // temp < 36
  acidosis: boolean;            // BE < -6
  coagulopathy: boolean;        // INR > 1.5 or Fib < 150
  count: number;                // 幾項中了
}

export interface ActiveEffect {
  id: string;
  source: string;               // medication/fluid/blood name
  type: EffectType;
  startTime: number;            // game minutes
  duration: number;             // minutes
  vitalChanges: Partial<VitalSigns>;
  temperatureChange?: number;
  severityChange?: number;
  isCorrectTreatment: boolean;
}

export type EffectType =
  | "vasopressor"
  | "inotrope"
  | "fluid"
  | "blood_product"
  | "hemostatic"
  | "electrolyte"
  | "warming"
  | "procedure";

// ============================================================
// Time Engine
// ============================================================

export interface GameClock {
  currentTime: number;          // game minutes since start
  startHour: number;            // e.g. 2 for 02:00 AM
  isPaused: boolean;
  speed: number;
}

export interface PendingEvent {
  id: string;
  triggerAt: number;            // game minutes
  triggerCondition?: EventCondition;
  type: GameEventType;
  data: any;
  fired: boolean;
  priority: number;             // lower = fires first at same time
}

export type GameEventType =
  | "lab_result"
  | "nurse_call"
  | "vitals_change"
  | "chest_tube_change"
  | "escalation"
  | "senior_arrives"
  | "effect_start"
  | "effect_end"
  | "order_effect";

export interface EventCondition {
  operator: "AND" | "OR";
  conditions: SingleCondition[];
}

export interface SingleCondition {
  field: string;
  op: ">" | "<" | ">=" | "<=" | "==" | "!=" | "exists" | "not_exists";
  value: number | string | boolean;
}

// ============================================================
// Orders
// ============================================================

export type OrderCategory =
  | "medication"
  | "hemostatic"
  | "fluid"
  | "transfusion"
  | "mtp"
  | "electrolyte"
  | "lab"
  | "imaging"
  | "pocus"
  | "consult"
  | "procedure"
  | "note";

export interface OrderDefinition {
  id: string;
  name: string;
  category: OrderCategory;
  subcategory?: string;         // e.g. "vasopressor", "inotrope"
  defaultDose: string;
  unit: string;
  route: string;
  frequencies: string[];
  timeToEffect: number;         // game minutes
  timeToResult?: number;        // for labs: game minutes until result
  guardRail?: GuardRail;
  effect?: Partial<ActiveEffect>;
}

export interface GuardRail {
  min?: number;
  max?: number;
  warnAbove?: number;           // 護理師問「確定嗎？」
  rejectAbove?: number;         // 護理師拒絕
  warnMessage?: string;
  rejectMessage?: string;
  interactions?: DrugInteraction[];
}

export interface DrugInteraction {
  withDrug: string;
  message: string;
  severity: "info" | "warning" | "block";
}

export interface PlacedOrder {
  id: string;
  definition: OrderDefinition;
  dose: string;
  frequency: string;
  placedAt: number;             // game minutes
  status: OrderStatus;
  resultAvailableAt?: number;   // game minutes
  result?: any;
  warning?: string;
}

export type OrderStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

// ============================================================
// Transfusion
// ============================================================

export interface TransfusionOrder {
  product: BloodProduct;
  units: number;
  useWarmer: boolean;
}

export type BloodProduct = "prbc" | "ffp" | "platelet" | "cryo";

export interface MTPState {
  activated: boolean;
  activatedAt?: number;         // game minutes
  roundsDelivered: number;      // 每 round = 1:1:1
}

// ============================================================
// Labs
// ============================================================

export interface LabPanel {
  id: string;
  name: string;
  turnaroundTime: number;       // game minutes
  results: Record<string, LabValue>;
}

export interface LabValue {
  value: number | string;
  unit: string;
  normal: string;
  flag?: "H" | "L" | "critical";
}

// ============================================================
// Physical Exam & POCUS
// ============================================================

export interface PEFinding {
  area: string;
  finding: string;
}

export interface POCUSView {
  type: "cardiac" | "lung" | "ivc";
  finding: string;
  interpretation: string;
}

// ============================================================
// Chat / Timeline
// ============================================================

export interface TimelineEntry {
  id: string;
  gameTime: number;             // game minutes
  type: TimelineEntryType;
  content: string;
  sender?: "nurse" | "player" | "system" | "senior";
  isImportant?: boolean;
}

export type TimelineEntryType =
  | "nurse_message"
  | "player_message"
  | "player_action"
  | "system_event"
  | "lab_result"
  | "order_placed"
  | "vitals_update"
  | "hint";

// ============================================================
// Scoring
// ============================================================

export interface CriticalAction {
  id: string;
  description: string;
  met: boolean;
  timeToComplete: number | null;
  critical: boolean;            // true = 沒做扣大分
  hint: string;
}

export interface SBARScore {
  completeness: number;         // 0-100
  prioritization: number;       // 0-100
  quantitative: boolean;
  anticipatory: boolean;
}

export interface GameScore {
  timeToFirstAction: number;
  correctDiagnosis: boolean;
  criticalActions: CriticalAction[];
  harmfulOrders: string[];
  escalationTiming: "early" | "appropriate" | "late" | "never";
  lethalTriadManaged: boolean;
  sbar: SBARScore;
  hintsUsed: number;
  pauseThinkUsed: boolean;
  overall: "excellent" | "good" | "needs_improvement";
  keyLessons: string[];
  stars: 1 | 2 | 3;
  totalScore: number;
  patientDied: boolean;
}

// ============================================================
// Scenario Definition
// ============================================================

export interface SimScenario {
  id: string;
  title: string;
  subtitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: "15min" | "30min";
  tags: string[];

  patient: PatientInfo;
  initialVitals: VitalSigns;
  initialChestTube: ChestTubeState;
  initialLabs: Record<string, any>;
  pathology: Pathology;
  startHour: number;            // e.g. 2 for 02:00 AM

  nurseProfile: NurseProfile;
  events: ScriptedEvent[];
  expectedActions: ExpectedAction[];

  availableLabs: Record<string, LabPanel>;
  availableImaging: Record<string, string>;  // id → description
  availablePOCUS: Record<string, POCUSView>;
  physicalExam: Record<string, PEFinding>;

  debrief: DebriefData;
}

export interface PatientInfo {
  age: number;
  sex: "M" | "F";
  bed: string;
  weight: number;               // kg
  surgery: string;
  postOpDay: string;
  history: string;
  allergies: string[];
  keyMeds: string[];            // 術後正在用的藥
}

export interface NurseProfile {
  name: string;
  experience: "senior" | "junior";
}

export interface ScriptedEvent {
  id: string;
  triggerTime: number;
  triggerCondition?: EventCondition;
  type: GameEventType;
  message?: string;
  vitalChanges?: Partial<VitalSigns>;
  chestTubeChanges?: Partial<ChestTubeState>;
  temperatureChange?: number;
  severityChange?: number;
  newLabResults?: Record<string, any>;
}

export interface ExpectedAction {
  id: string;
  action: string;
  description: string;
  deadline: number;             // within X game minutes
  critical: boolean;
  hint: string;
}

export interface DebriefData {
  correctDiagnosis: string;
  keyPoints: string[];
  pitfalls: string[];
  guidelines: string[];
  whatIf: WhatIfBranch[];
}

export interface WhatIfBranch {
  scenario: string;
  outcome: string;
  lesson: string;
}

// ============================================================
// Game Store State
// ============================================================

export type GamePhase =
  | "not_started"
  | "playing"
  | "sbar"
  | "death"
  | "debrief";

export type ModalType =
  | null
  | "order"
  | "lab_order"
  | "lab_results"
  | "pe"
  | "pocus"
  | "imaging"
  | "sbar"
  | "debrief"
  | "pause_think"
  | "consult";
