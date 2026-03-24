// Standard overlay — Postop Bleeding
// Simplified nurse messages + preset orders for Clerk/PGY level

import type { StandardOverlay } from "@/lib/simulator/types";
import type { StandardPresetOrder } from "./types";

// ============================================================
// Preset Orders (one-tap, pre-filled dose)
// ============================================================

export const postopBleedingPresets: StandardPresetOrder[] = [
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
    id: "preset-call-senior",
    label: "叫外科學長",
    icon: "📞",
    category: "communication",
    isCorrect: true,
    orders: [
      { definitionId: "call_senior", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-furosemide",
    label: "給 Furosemide 利尿",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，病人在出血欸，確定要利尿？",
    orders: [
      { definitionId: "furosemide", dose: "20", frequency: "STAT" },
    ],
  },
  {
    id: "preset-dopamine",
    label: "給 Dopamine 升壓",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，出血的話是不是先補 volume 比較重要？",
    orders: [
      { definitionId: "dopamine", dose: "5", frequency: "Continuous" },
    ],
  },
];

// ============================================================
// Guidance Steps
// ============================================================

const guidanceSteps: StandardOverlay["guidanceSteps"] = [
  {
    id: "guide-orientation",
    trigger: "phase_change",
    message:
      "學長，CT 突然出很多血，你要不要先看一下？",
  },
  {
    id: "guide-assessment",
    trigger: "idle",
    message:
      "學長，要不要先看看數字？",
  },
  {
    id: "guide-intervention",
    trigger: "vitals_critical",
    message:
      "學長！血壓一直在掉耶...",
  },
  {
    id: "guide-escalation",
    trigger: "missed_critical",
    message:
      "學長，這個量一直沒有減少...是不是要找人來？",
  },
  {
    id: "guide-wrong-action",
    trigger: "wrong_action",
    message:
      "學長，確定嗎？",
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
      "醫師，血壓又掉了——{{sbp}}/{{dbp}}。Chest tube 出的是鮮紅色的血，有看到血塊，現在 {{ct_rate}}cc/hr。這個量一直在增加，看起來像 surgical bleeding，可能需要輸血。",
  },
  "evt-15-nurse-report-status": {
    message:
      "醫師，血壓 {{sbp}}/{{dbp}}，CT 累計 {{ct_total}}cc，一直沒有減少。是不是要叫外科學長來評估需不需要回 OR？",
  },
  "evt-20-senior-arrives": {
    message:
      "（學長推門進來）「怎麼了，跟我報告一下病人的狀況——vitals、CT output 趨勢、做了什麼處置。」",
  },
};

// ============================================================
// Overlay Export
// ============================================================

export const postopBleedingStandard: StandardOverlay = {
  presetOrders: postopBleedingPresets,
  guidanceSteps,
  eventOverrides,
  timeScale: 0.75,
  rescueThreshold: { sbp: 70, hr: 140, spo2: 85 },
  rescueWindowSeconds: 60,
};
