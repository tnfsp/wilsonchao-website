// ICU 值班模擬器 — 核心型別
// 所有 engine / store / component 共用

// ============================================================
// Difficulty System
// ============================================================

export type DifficultyLevel = "lite" | "standard" | "pro";

export interface DifficultyConfig {
  canDie: boolean;
  rescueThreshold?: { sbp: number; hr: number; spo2: number };
  rescueWindowSeconds?: number;
  timeScale: number;
  hintLimit: number;
  fogLevel?: "none" | "light" | "full";
}

/** Standard mode overlay — simplifies Pro scenario with guidance */
export interface StandardOverlay {
  eventOverrides: Record<string, Partial<ScriptedEvent>>;
  presetOrders: PresetOrder[];
  guidanceSteps: GuidanceStep[];
  timeScale: number;
  rescueThreshold: { sbp: number; hr: number; spo2: number };
  rescueWindowSeconds: number;
  nurseUrgencyEvents?: import("./scenarios/standard/types").NurseUrgencyEvent[];
}

export interface PresetOrder {
  id: string;
  label: string;
  orders: { definitionId: string; dose: string; frequency: string }[];
}

export interface GuidanceStep {
  id: string;
  trigger: "idle" | "wrong_action" | "missed_critical" | "vitals_critical" | "phase_change" | "duplicate_order" | "absurd_dose";
  message: string;
  highlightAction?: string;
}

/** Lite mode — interactive story (visual-novel style) */
export interface LiteScenario {
  id: string;
  title: string;
  beats: StoryBeat[];
  choices: StoryChoice[];
  endings: StoryEnding[];
  shareCard: { template: string; dynamicFields: string[] };
}

export interface StoryBeat {
  id: string;
  type: "narration" | "dialogue" | "choice" | "vital_change" | "reveal";
  speaker?: "narrator" | "nurse" | "patient" | "senior";
  text: string;
  duration?: number;
}

export interface StoryChoice {
  id: string;
  prompt: string;
  options: { text: string; score: number; feedback: string }[];
}

export interface StoryEnding {
  id: "hero" | "lesson" | "close_call";
  title: string;
  description: string;
  guidelineNote: string;
  minScore: number;
}

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
  rhythmStrip: RhythmType;
}

export type RhythmType =
  | "nsr"
  | "sinus_tach"
  | "sinus_brady"
  | "afib"
  | "aflutter"
  | "vf"
  | "vt_pulse"
  | "vt_pulseless"
  | "svt"
  | "pea"
  | "asystole";

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
// Ventilator
// ============================================================

export type VentMode = 'VC' | 'PC' | 'PS' | 'SIMV';

export interface VentilatorState {
  mode: VentMode;
  fio2: number;       // 0.21 - 1.0
  peep: number;       // cmH2O
  rrSet: number;      // breaths/min
  tvSet: number;      // mL
  ieRatio: string;    // e.g. "1:2"
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

// ── PendingEvent data types (discriminated by GameEventType) ─────────────────

export interface LabResultData {
  orderId?: string;
  orderName?: string;
  imagingKey?: string;
  imagingType?: "ecg" | "cxr";
  label?: string;
}

export interface NurseCallData {
  message: string;
}

export interface ScriptedEventData {
  message?: string;
  content?: string;
  vitalChanges?: Partial<VitalSigns>;
  chestTubeChanges?: Partial<ChestTubeState>;
  temperatureChange?: number;
  severityChange?: number;
  newLabResults?: Record<string, unknown>;
}

export interface SeniorArrivesData {
  type?: string;
  message?: string;
  label?: string;
}

export interface OrderEffectData {
  orderId?: string;
  isMTP?: boolean;
  mtpRound?: number;
  products?: { prbc: number; ffp: number; platelet: number };
}

export type PendingEventData =
  | LabResultData
  | NurseCallData
  | ScriptedEventData
  | SeniorArrivesData
  | OrderEffectData;

export interface PendingEvent {
  id: string;
  triggerAt: number;            // game minutes
  triggerCondition?: EventCondition;
  type: GameEventType;
  data: PendingEventData;
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
  tags?: string[];              // clinical usage tags for filtering (e.g. 'cardiac', 'sepsis')
  defaultDose: string;
  unit: string;
  route: string;
  frequencies: string[];
  timeToEffect: number;         // game minutes
  timeToResult?: number;        // for labs: game minutes until result
  guardRail?: GuardRail;
  effect?: Partial<ActiveEffect>;
  scenarioOverrides?: Partial<Record<Pathology, Partial<ActiveEffect>>>;
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
  guidelineBundleScores?: GuidelineBundleScore[];  // guideline compliance results
}

// ============================================================
// Guideline-Based Scoring
// ============================================================

/** A clinical guideline bundle that anchors scenario scoring */
export interface GuidelineBundle {
  id: string;                           // e.g. "ssc-2021-hour1"
  name: string;                         // "Surviving Sepsis Campaign 2021 Hour-1 Bundle"
  shortName: string;                    // "SSC Hour-1 Bundle"
  source: string;                       // "Evans et al. Crit Care Med 2021;49(11):e1063-e1143"
  url?: string;                         // link to guideline
  items: GuidelineBundleItem[];         // ordered checklist items
}

/** Individual checklist item within a guideline bundle */
export interface GuidelineBundleItem {
  id: string;                           // e.g. "ssc-lactate"
  description: string;                  // "Measure lactate level"
  actionIds: string[];                  // maps to ExpectedAction.id(s) that fulfill this item
  informational?: boolean;              // true = display-only, excluded from scoring
  timeWindow?: number;                  // guideline-recommended time (game minutes), if applicable
  evidenceLevel?: string;               // "Strong recommendation, moderate quality"
  rationale?: string;                   // brief clinical rationale from guideline
}

/** Score result for a single guideline bundle */
export interface GuidelineBundleScore {
  bundleId: string;
  bundleName: string;
  source: string;
  url?: string;
  totalItems: number;
  completedItems: number;
  items: GuidelineBundleItemResult[];
  compliancePercent: number;            // 0-100
  timeToCompletion: number | null;      // game minutes to complete ALL items, null if incomplete
}

/** Result for each guideline bundle item */
export interface GuidelineBundleItemResult {
  id: string;
  description: string;
  completed: boolean;
  completedAt: number | null;           // game minutes
  withinTimeWindow: boolean;            // completed within guideline time window
  evidenceLevel?: string;
}

// ============================================================
// Scenario Definition
// ============================================================

export interface SimScenario {
  id: string;
  title: string;
  subtitle: string;
  hiddenTitle?: string;       // Title shown before completion (e.g., "術後急變 Case A")
  hiddenSubtitle?: string;    // Subtitle shown before completion
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: "15min" | "30min";
  tags: string[];
  relevantTags?: string[];    // medication tags relevant to this scenario (for order filtering)

  patient: PatientInfo;
  initialVitals: VitalSigns;
  initialChestTube: ChestTubeState;
  initialVentilator?: VentilatorState;
  initialLabs: Record<string, any>;
  pathology: Pathology;
  startHour: number;            // e.g. 2 for 02:00 AM

  nurseProfile: NurseProfile;
  events: ScriptedEvent[];
  expectedActions: ExpectedAction[];
  guidelineBundles?: GuidelineBundle[];    // guideline-anchored scoring

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
  role?: "reporter" | "guide";
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
  rationale?: string;           // 為什麼重要？+ 臨床依據
  howTo?: string;               // 正確做法
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
  | "consult"
  | "defibrillator";

// ============================================================
// Defibrillator (ACLS)
// ============================================================

export interface DefibrillatorState {
  energy: number;                 // Joules (default 200)
  mode: "sync" | "async";
  lastShockAt: number | null;     // game minutes
}

export type ShockResult = {
  success: boolean;
  message: string;
};

// ============================================================
// Rescue Window (Standard mode delayed death)
// ============================================================

export interface RescueState {
  active: boolean;
  startedAt: number;             // game minutes when rescue window started
  expiresAt: number;             // game minutes when window expires
  remainingSeconds: number;      // real-time countdown seconds remaining
  requiredActions: string[];     // action patterns that would rescue the patient
  cause: string;                 // what triggered the rescue window
}

// ============================================================
// Tracked Player Action (for scoring timestamps)
// ============================================================

/** Wraps every action string pushed to playerActions with game-time metadata. */
export interface TrackedAction {
  action: string;       // existing action string (e.g. "order:medication:norepinephrine:0.05")
  gameTime: number;     // game minutes when action was recorded
  category?: string;    // "order" | "pocus" | "lab" | "mtp" | "message" | "consult" | etc.
}

// ============================================================
// POCUS
// ============================================================

export type POCUSViewType =
  | "plax"
  | "psax"
  | "a4c"
  | "subcostal"
  | "ivc"
  | "lung";
