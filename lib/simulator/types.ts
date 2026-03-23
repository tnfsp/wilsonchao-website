// ============================================
// Scenario Types
// ============================================

export interface Scenario {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  author: string;
  version: string;
  opening: Opening;
  patient: Patient;
  initial_vitals: VitalSigns;
  current_status: CurrentStatus;
  history_context: HistoryContext;
  physical_exam: PhysicalExam;
  lab_results: LabResults;
  pocus_findings: POCUSFindings;
  diagnosis: Diagnosis;
  optimal_management: OptimalManagement;
  learning_points: string[];
  // v2 extensions
  vital_transitions?: VitalTransition[];
  deterioration_thresholds?: DeteriorationThresholds;
  handoff_evaluation?: HandoffEvaluation;
}

// v2: Vital transitions for dynamic patient state
export interface VitalTransition {
  trigger: {
    medication?: string;
    volume_gt?: number;
  };
  delay_seconds: number;
  effect: {
    hr_delta?: number;
    bp_systolic_delta?: number;
    bp_diastolic_delta?: number;
    rr_delta?: number;
    spo2_delta?: number;
  };
  nurse_message: string;
}

// v2: Thresholds for triggering ACLS
export interface DeteriorationThresholds {
  trigger_acls: {
    hr_lt?: number;
    hr_gt?: number;
    bp_systolic_lt?: number;
    spo2_lt?: number;
  };
}

// v2: Handoff evaluation criteria
export interface HandoffEvaluation {
  required_mentions: string[];
  critical_errors: string[];
}

export interface Opening {
  caller: string;
  message: string;
}

export interface Patient {
  age: number;
  gender: "M" | "F";
  bed: string;
  brief_history: string;
}

export interface VitalSigns {
  hr: number;
  bp_systolic: number;
  bp_diastolic: number;
  rr: number;
  spo2: number;
  temperature: number;
}

export interface CurrentStatus {
  consciousness: string;
  appearance: string;
}

export interface HistoryContext {
  description: string;
  key_points: string[];
}

// ============================================
// Physical Exam Types
// ============================================

export interface PhysicalExam {
  general: string;
  cardiac: CardiacExam;
  pulmonary: PulmonaryExam;
  abdomen: string;
  extremities: ExtremitiesExam;
}

export interface CardiacExam {
  jvp: string;
  heart_sound: string;
  pmi: string;
}

export interface PulmonaryExam {
  breath_sounds: string;
  percussion: string;
}

export interface ExtremitiesExam {
  edema: string;
  pulse: string;
  capillary_refill: string;
  temperature: string;
}

// ============================================
// Lab Results Types
// ============================================

export interface LabResults {
  cbc: CBCResults;
  biochemistry: BiochemistryResults;
  cardiac: CardiacMarkers;
  infection: InfectionMarkers;
  abg: ABGResults;
  coagulation: CoagulationResults;
}

export interface CBCResults {
  wbc: number;
  hb: number;
  hct: number;
  platelet: number;
}

export interface BiochemistryResults {
  bun: number;
  cr: number;
  na: number;
  k: number;
  ast: number;
  alt: number;
}

export interface CardiacMarkers {
  troponin_i: number;
  nt_probnp: number;
}

export interface InfectionMarkers {
  procalcitonin: number;
  lactate: number;
  crp: number;
}

export interface ABGResults {
  ph: number;
  pco2: number;
  po2: number;
  hco3: number;
  be: number;
  sao2: number;
}

export interface CoagulationResults {
  pt_inr: number;
  aptt: number;
  d_dimer: number;
}

// ============================================
// POCUS Types
// ============================================

export interface POCUSFindings {
  plax?: POCUSView;
  psax?: POCUSView;
  a4c?: POCUSView;
  subcostal?: POCUSView;
  ivc?: POCUSView;
  lung?: POCUSView;
}

export interface POCUSView {
  video?: string;
  image?: string;
  finding: string;
}

// ============================================
// Diagnosis & Management Types
// ============================================

export interface Diagnosis {
  primary: string;
  differential: string[];
  key_differentiators: string[];
}

export interface OptimalManagement {
  avoid: ManagementAction[];
  recommended: ManagementAction[];
}

export interface ManagementAction {
  action: string;
  reason?: string;
  detail?: string;
}

// ============================================
// Handoff Types
// ============================================

export interface HandoffReport {
  content: string;
}

export interface HandoffFeedback {
  overall: "excellent" | "good" | "needs_improvement";
  score: number;
  strengths: string[];
  missedPoints: string[];
  suggestions: string[];
  seniorComment: string;
}

// ============================================
// Game State Types
// ============================================

export interface Message {
  id: string;
  role: "nurse" | "user" | "system";
  content: string;
  timestamp: Date;
}

export interface OrderedLab {
  category: string;
  items: string[];
  orderedAt: Date;
  resultsAvailable: boolean;
}

export interface OrderedMedication {
  id: string;
  name: string;
  dose: string;
  unit: string;
  frequency: string;
  route: string;
  orderedAt: Date;
  warning?: string;
}

export interface ExaminedItem {
  category: string;
  item: string;
  result: string;
  examinedAt: Date;
}

export interface POCUSExamined {
  view: string;
  finding: string;
  examinedAt: Date;
}

// ============================================
// Player Action Tracking Types
// ============================================

export type PlayerActionType =
  | "chat"           // 對話詢問
  | "physical_exam"  // 理學檢查
  | "lab_order"      // 開立檢驗
  | "lab_view"       // 查看報告
  | "pocus"          // 床邊超音波
  | "medication"     // 開立醫囑
  | "handoff"        // 交班報告
  | "game_start"     // 遊戲開始
  | "game_end";      // 遊戲結束

export interface PlayerAction {
  id: string;
  type: PlayerActionType;
  timestamp: Date;
  detail: string;
  data?: Record<string, unknown>;
}

export interface GameState {
  // Scenario
  scenario: Scenario | null;
  isLoading: boolean;

  // Current state
  vitals: VitalSigns | null;
  status: CurrentStatus | null;

  // Interaction history
  messages: Message[];
  orderedLabs: OrderedLab[];
  orderedMedications: OrderedMedication[];
  examinedItems: ExaminedItem[];
  pocusExamined: POCUSExamined[];

  // Player action tracking
  playerActions: PlayerAction[];

  // Game progress
  gameStarted: boolean;
  gameEnded: boolean;
  submittedDiagnosis: string | null;

  // Handoff
  handoffReport: HandoffReport | null;
  handoffFeedback: HandoffFeedback | null;
}

// ============================================
// API Types
// ============================================

export interface ChatRequest {
  message: string;
  scenarioId: string;
  historyContext: HistoryContext;
  conversationHistory: Message[];
}

export interface ChatResponse {
  reply: string;
}

export interface ValidateMedicationRequest {
  medication: string;
  dose: number;
  unit: string;
}

export interface ValidateMedicationResponse {
  isValid: boolean;
  warning?: string;
  suggestion?: string;
}

export interface EvaluateHandoffRequest {
  report: HandoffReport;
  scenario: Scenario;
  actions: {
    orderedLabs: OrderedLab[];
    orderedMedications: OrderedMedication[];
    examinedItems: ExaminedItem[];
    pocusExamined: POCUSExamined[];
  };
}

export interface EvaluateHandoffResponse {
  feedback: HandoffFeedback;
}

// ============================================
// UI Types
// ============================================

export type ModalType =
  | "physical-exam"
  | "lab-order"
  | "lab-results"
  | "pocus"
  | "orders"
  | "handoff"
  | "debrief"
  | null;

export type PhysicalExamCategory =
  | "general"
  | "cardiac"
  | "pulmonary"
  | "abdomen"
  | "extremities";

export type LabCategory =
  | "cbc"
  | "biochemistry"
  | "cardiac"
  | "infection"
  | "abg"
  | "coagulation";

export type POCUSViewType =
  | "plax"
  | "psax"
  | "a4c"
  | "subcostal"
  | "ivc"
  | "lung";
