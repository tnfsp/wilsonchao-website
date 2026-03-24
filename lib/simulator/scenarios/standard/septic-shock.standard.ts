// Standard overlay — Septic Shock
// Simplified nurse messages + preset orders for Clerk/PGY level

import type { StandardOverlay } from "@/lib/simulator/types";
import type { StandardPresetOrder } from "./types";

// ============================================================
// Preset Orders (one-tap, pre-filled dose)
// ============================================================

export const septicShockPresets: StandardPresetOrder[] = [
  {
    id: "preset-blood-culture",
    label: "血液培養 x2 sets",
    icon: "🧫",
    category: "lab",
    isCorrect: true,
    orders: [
      { definitionId: "blood_culture", dose: "2", frequency: "STAT" },
    ],
  },
  {
    id: "preset-antibiotics",
    label: "經驗性抗生素 Vancomycin + Tazocin",
    icon: "💊",
    category: "medication",
    isCorrect: true,
    orders: [
      { definitionId: "vancomycin", dose: "2000", frequency: "Over 1hr" },
      { definitionId: "pip_tazo", dose: "4.5", frequency: "Q6H" },
    ],
  },
  {
    id: "preset-fluid-30ml",
    label: "輸液挑戰 LR 30mL/kg",
    icon: "💧",
    category: "medication",
    isCorrect: true,
    orders: [
      { definitionId: "lr", dose: "2000", frequency: "Bolus" },
    ],
  },
  {
    id: "preset-norepinephrine",
    label: "Norepinephrine 升壓",
    icon: "⬆️",
    category: "medication",
    isCorrect: true,
    orders: [
      { definitionId: "norepinephrine", dose: "0.05", frequency: "Continuous" },
    ],
  },
  {
    id: "preset-lactate",
    label: "追蹤 Lactate",
    icon: "🧪",
    category: "lab",
    isCorrect: true,
    orders: [
      { definitionId: "lactate", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-call-senior",
    label: "叫外科學長（source control）",
    icon: "📞",
    category: "communication",
    isCorrect: true,
    orders: [
      { definitionId: "call_senior", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-antipyretic",
    label: "給退燒藥觀察",
    icon: "🌡️",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，高燒加意識改變，只退燒觀察嗎？",
    orders: [
      { definitionId: "acetaminophen", dose: "1000", frequency: "STAT" },
    ],
    penaltyEffect: {
      id: "penalty-antipyretic",
      source: "Acetaminophen 1000mg",
      type: "fluid",
      startTime: 0,
      duration: 15,
      vitalChanges: {},
      severityChange: 5,
      isCorrectTreatment: false,
    },
  },
  {
    id: "preset-dopamine",
    label: "給 Dopamine 升壓",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，septic shock 首選不是用 Dopamine 喔...",
    orders: [
      { definitionId: "dopamine", dose: "5", frequency: "Continuous" },
    ],
    penaltyEffect: {
      id: "penalty-dopamine",
      source: "Dopamine 5mcg/kg/min",
      type: "vasopressor",
      startTime: 0,
      duration: 10,
      vitalChanges: { hr: 20 },
      severityChange: 3,
      isCorrectTreatment: false,
    },
  },
  {
    id: "preset-dexamethasone-high",
    label: "Dexamethasone 10mg IV",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，高劑量 Dexamethasone 不是 septic shock 的第一線，先給抗生素和輸液才對，類固醇要拖到 vasopressor refractory 才考慮。",
    orders: [
      { definitionId: "dexamethasone", dose: "10", frequency: "STAT" },
    ],
    penaltyEffect: {
      id: "penalty-dexamethasone-high",
      source: "Dexamethasone 10mg IV",
      type: "fluid",
      startTime: 0,
      duration: 20,
      vitalChanges: { hr: 5 },
      severityChange: 6,
      isCorrectTreatment: false,
    },
  },
  {
    id: "preset-restrict-fluid",
    label: "限制補液、觀察",
    icon: "🚫",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，sepsis 早期需要積極 volume resuscitation，限液觀察會讓器官灌流更差！",
    orders: [
      { definitionId: "fluid_restrict", dose: "1", frequency: "STAT" },
    ],
    penaltyEffect: {
      id: "penalty-restrict-fluid",
      source: "Fluid restriction order",
      type: "fluid",
      startTime: 0,
      duration: 15,
      vitalChanges: { sbp: -15, map: -12, hr: 10 },
      severityChange: 10,
      isCorrectTreatment: false,
    },
  },
  {
    id: "preset-esmolol",
    label: "Esmolol drip（控制心跳）",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，septic shock 時 tachycardia 是代償機制，用 Esmolol 壓心率只會讓心輸出量更差、血壓更低！",
    orders: [
      { definitionId: "esmolol", dose: "50", frequency: "Continuous" },
    ],
    penaltyEffect: {
      id: "penalty-esmolol",
      source: "Esmolol 50mcg/kg/min",
      type: "vasopressor",
      startTime: 0,
      duration: 10,
      vitalChanges: { sbp: -20, hr: -30, map: -15 },
      severityChange: 14,
      isCorrectTreatment: false,
    },
  },
  {
    id: "preset-oral-antibiotics",
    label: "口服 Augmentin 抗生素",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，septic shock 一定要靜脈注射抗生素，口服吸收太慢、生物利用率不夠，這樣等不及！",
    orders: [
      { definitionId: "oral_augmentin", dose: "875", frequency: "BID" },
    ],
    penaltyEffect: {
      id: "penalty-oral-antibiotics",
      source: "Oral Augmentin 875mg",
      type: "fluid",
      startTime: 0,
      duration: 20,
      vitalChanges: { hr: 5 },
      severityChange: 8,
      isCorrectTreatment: false,
    },
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
      "學長，這個病人高燒加意識改變，你覺得要先做什麼？",
  },
  {
    id: "guide-hour1-bundle",
    trigger: "idle",
    message:
      "學長，病人燒成這樣、人又迷迷糊糊的...要不要先查一下原因？",
  },
  {
    id: "guide-antibiotics",
    trigger: "idle",
    message:
      "學長，感染源還沒處理，時間一直在跑欸...",
  },
  {
    id: "guide-vasopressor",
    trigger: "vitals_critical",
    message:
      "學長，液體給了不少但血壓還是上不來耶...",
  },
  {
    id: "guide-source-control",
    trigger: "missed_critical",
    message:
      "學長，傷口那邊的問題...是不是要找人來處理？",
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
      "醫師，bed 8 的張先生 CABG 術後第 3 天。體溫 38.8、心跳 105、呼吸 24，人迷迷糊糊的。術後第 3 天突然高燒加意識改變，要注意有沒有感染的可能。你快來看一下。",
  },
  "evt-05-worsening": {
    message:
      "醫師，體溫升到 {{temp}} 了！病人講話語無倫次，問日期答不出來。高燒 + 意識改變 + tachycardia——這很像 sepsis，要不要啟動 sepsis bundle？",
  },
  "evt-08-wound": {
    message:
      "醫師！我幫他換藥看到——sternal wound 紅腫明顯、在流黃綠色的膿！這應該是 wound infection，可能就是 sepsis 的感染源。要不要取 wound culture？",
  },
  "evt-10-bp-drop": {
    message:
      "醫師，500cc NS 給完了但血壓還在掉——{{sbp}}/{{dbp}}。有感染 + 輸液反應不好 = septic shock 的表現。是不是要加 vasopressor？",
  },
  "evt-15-vasopressor-needed": {
    message:
      "醫師，又灌了 1000cc 液體，MAP 勉強 {{map}}。WBC 18.5、lactate 4.2——數字很不好。輸液給了 MAP 還是 < 65 → SSC 建議開始 Norepinephrine。",
  },
};

// ============================================================
// Overlay Export
// ============================================================

export const septicShockStandard: StandardOverlay = {
  presetOrders: septicShockPresets,
  guidanceSteps,
  eventOverrides,
  timeScale: 0.75,
  rescueThreshold: { sbp: 65, hr: 150, spo2: 85 },
  rescueWindowSeconds: 60,
  nurseUrgencyEvents: [
    { id: "urg-1", triggerAfterIdleMinutes: 2, message: "學長，病人燒成這樣，要趕快處理吧？" },
    { id: "urg-2", triggerAfterIdleMinutes: 5, message: "學長！病人意識越來越差了，Sepsis Hour-1 Bundle 的時間在跑！" },
    { id: "urg-3", triggerAfterIdleMinutes: 8, message: "學長！！感染很嚴重，我先叫主治來了！" },
  ],
};
