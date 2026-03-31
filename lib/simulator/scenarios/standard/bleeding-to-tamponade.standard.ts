// Standard overlay — Bleeding → Tamponade (pro-bleeding-to-tamponade-01)
// Two-phase scenario: surgical bleeding (Phase 1) → cardiac tamponade (Phase 2)
// Simplified nurse messages + preset orders for Clerk/PGY level

import type { StandardOverlay } from "@/lib/simulator/types";
import type { StandardPresetOrder } from "./types";

// ============================================================
// Preset Orders (one-tap, pre-filled dose)
// ============================================================
// Phase 1 (Bleeding): orders 1-8
// Phase 2 (Tamponade): orders 9-12
// Wrong (Distractors): orders 13-15

const presetOrders: StandardPresetOrder[] = [
  // ── Phase 1: Bleeding ─────────────────────────────────────

  {
    id: "preset-cbc-coag",
    label: "追蹤 CBC + Coag",
    icon: "🧪",
    category: "lab",
    isCorrect: true,
    orders: [
      { definitionId: "cbc", dose: "1", frequency: "STAT" },
      { definitionId: "coag", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-prbc-2u",
    label: "緊急輸血 pRBC 2U",
    icon: "🩸",
    category: "medication",
    isCorrect: true,
    orders: [
      { definitionId: "prbc", dose: "2", frequency: "STAT" },
    ],
  },
  {
    id: "preset-txa-1g",
    label: "給 TXA 1g IV",
    icon: "💊",
    category: "medication",
    isCorrect: true,
    orders: [
      { definitionId: "txa", dose: "1000", frequency: "Over 10min" },
    ],
  },
  {
    id: "preset-lr-500",
    label: "加壓輸液 LR 500mL",
    icon: "💧",
    category: "medication",
    isCorrect: true,
    orders: [
      { definitionId: "lr", dose: "500", frequency: "Bolus" },
    ],
  },
  {
    id: "preset-abg",
    label: "ABG + Lactate",
    icon: "🧪",
    category: "lab",
    isCorrect: true,
    orders: [
      { definitionId: "abg", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-type-screen",
    label: "Type & Screen 備血",
    icon: "🧪",
    category: "lab",
    isCorrect: true,
    orders: [
      { definitionId: "type_screen", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-ffp-2u",
    label: "輸 FFP 2U（補凝血因子）",
    icon: "🩸",
    category: "medication",
    isCorrect: true,
    orders: [
      { definitionId: "ffp", dose: "2", frequency: "Over 30min" },
    ],
  },
  {
    id: "preset-call-senior",
    label: "叫外科學長",
    icon: "📞",
    category: "communication",
    isCorrect: true,
    orders: [
      { definitionId: "call_senior", dose: "1", frequency: "STAT" },
    ],
  },

  // ── Phase 2: Tamponade ────────────────────────────────────

  {
    id: "preset-strip-milk-ct",
    label: "Strip / Milk Chest Tube",
    icon: "🔧",
    category: "procedure",
    isCorrect: true,
    orders: [
      { definitionId: "strip_milk_ct", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-pocus",
    label: "Cardiac POCUS",
    icon: "📡",
    category: "procedure",
    isCorrect: true,
    orders: [
      { definitionId: "pocus_cardiac", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-recall-senior",
    label: "緊急叫回學長",
    icon: "📞",
    category: "communication",
    isCorrect: true,
    orders: [
      { definitionId: "recall_senior", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-prep-resternotomy",
    label: "準備 Re-sternotomy",
    icon: "🏥",
    category: "procedure",
    isCorrect: true,
    orders: [
      { definitionId: "prepare_resternotomy", dose: "1", frequency: "STAT" },
    ],
  },

  // ── Wrong Orders (Distractors) ────────────────────────────

  {
    id: "preset-furosemide",
    label: "給 Furosemide 利尿",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，病人在大量出血欸，利尿只會讓血管內容積更少、血壓更低！",
    orders: [
      { definitionId: "furosemide", dose: "20", frequency: "STAT" },
    ],
    penaltyEffect: {
      id: "penalty-furosemide",
      source: "Furosemide 20mg",
      type: "fluid",
      startTime: 0,
      duration: 10,
      vitalChanges: { sbp: -15, hr: 10 },
      severityChange: 8,
      isCorrectTreatment: false,
    },
  },
  {
    id: "preset-heparin-drip",
    label: "Heparin Drip（抗凝）",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長！病人在大量出血，給抗凝血劑只會讓出血更難止、情況更快惡化！術後出血是絕對禁忌！",
    orders: [
      { definitionId: "heparin", dose: "1000", frequency: "Continuous" },
    ],
    penaltyEffect: {
      id: "penalty-heparin-drip",
      source: "Heparin drip 1000U/hr",
      type: "fluid",
      startTime: 0,
      duration: 15,
      vitalChanges: { sbp: -15, hr: 12 },
      severityChange: 18,
      isCorrectTreatment: false,
    },
  },
  {
    id: "preset-nitroglycerin",
    label: "Nitroglycerin 降血壓",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，血壓已經在掉了，NTG 會讓血壓更低，出血的傷口更難靠血壓自我止血！",
    orders: [
      { definitionId: "nitroglycerin", dose: "5", frequency: "Continuous" },
    ],
    penaltyEffect: {
      id: "penalty-nitroglycerin",
      source: "Nitroglycerin drip 5mcg/min",
      type: "fluid",
      startTime: 0,
      duration: 10,
      vitalChanges: { sbp: -22, dbp: -12, hr: 15 },
      severityChange: 13,
      isCorrectTreatment: false,
    },
  },
];

// ============================================================
// Guidance Steps
// ============================================================

const guidanceSteps: StandardOverlay["guidanceSteps"] = [
  {
    id: "guide-start",
    trigger: "idle",
    message:
      "學長，先看看 vitals 和 CT 量，出血量是多少？血壓有沒有在掉？",
  },
  {
    id: "guide-order-blood",
    trigger: "missed_critical",
    message:
      "學長，血壓在掉、CT 持續出血，要不要先輸血穩住？",
    highlightAction: "order",
  },
  {
    id: "guide-call",
    trigger: "missed_critical",
    message:
      "出血量這麼大，是不是要通知學長來評估要不要回 OR？",
    highlightAction: "consult",
  },
  {
    id: "guide-vitals-drop",
    trigger: "vitals_critical",
    message:
      "學長！血壓掉很快，再不處理病人會撐不住！",
    highlightAction: "order",
  },
  {
    id: "guide-phase2-clue",
    trigger: "phase_change",
    message:
      "學長，CT 突然不出了...不一定是好事，可能是 clot 堵住了。要不要檢查一下？",
  },
  {
    id: "guide-pocus-hint",
    trigger: "idle",
    message:
      "CT 不出了、CVP 在升、血壓在掉...要不要做個 POCUS 看看心臟？",
    highlightAction: "imaging",
  },
  {
    id: "guide-wrong",
    trigger: "wrong_action",
    message:
      "學長，確定嗎？在這個情況下可能不太適合...",
  },
];

// ============================================================
// Event Overrides (more explicit nurse messages for Standard)
// ============================================================

const eventOverrides: StandardOverlay["eventOverrides"] = {
  "evt-00-nurse-call": {
    message:
      "醫師，bed 3 的林伯伯剛做完 CABG 手術，chest tube 突然出很多血——鮮紅色的！血壓也在掉。你趕快來看一下，可能需要抽血和輸液。",
  },
  "evt-05-ct-increase": {
    message:
      "醫師，血壓又掉了——{{sbp}}/{{dbp}}。CT 出鮮紅色的血，有血塊，現在 {{ct_rate}}cc/hr。看起來像 surgical bleeding，要不要考慮輸血？",
  },
  "evt-15-nurse-report-status": {
    message:
      "醫師，血壓 {{sbp}}/{{dbp}}，CT 累計 {{ct_total}}cc，一直沒有減少。是不是要叫外科學長來評估需不需要回 OR？",
  },
  "evt-20-senior-arrives": {
    message:
      "（學長推門進來）「怎麼了，跟我報告一下病人的狀況——vitals、CT output 趨勢、做了什麼處置。」",
  },
  "evt-25-ct-drops": {
    message:
      "醫師！CT 突然完全不出了！剛剛還 200 多，現在 0。CVP 也在升...",
  },
};

// ============================================================
// Overlay Export
// ============================================================

export const bleedingToTamponadeStandard: StandardOverlay = {
  presetOrders,
  guidanceSteps,
  eventOverrides,
  timeScale: 0.75,
  rescueThreshold: { sbp: 60, hr: 150, spo2: 80 },
  rescueWindowSeconds: 60,
  nurseUrgencyEvents: [
    {
      id: "urg-1",
      triggerAfterIdleMinutes: 2,
      message: "醫師，你要不要先看一下數字？CT 一直在出血...",
    },
    {
      id: "urg-2",
      triggerAfterIdleMinutes: 5,
      message: "醫師，病人看起來越來越不對勁，血壓持續在掉！",
    },
    {
      id: "urg-3",
      triggerAfterIdleMinutes: 8,
      message: "醫師！！血壓快撐不住了，我覺得很不安全，我先通知 OR 了！",
    },
  ],
};
