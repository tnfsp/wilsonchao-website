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
      "學長，病人在出血欸！利尿會讓血壓更低、volume 更不夠。出血的時候要補液和輸血，不是利尿。",
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
      "學長，出血性休克的首要處置是補充 volume（輸液+輸血），不是先拉升壓劑。而且 Dopamine 不是心外首選，Norepinephrine 比較好。",
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
      "護理師叫你來看 bed 3 的 CABG 病人，chest tube 突然出很多血。先看 vitals，評估嚴重度。",
    highlightAction: "preset-cbc-coag",
  },
  {
    id: "guide-assessment",
    trigger: "idle",
    message:
      "學長，要不要先抽血（CBC + Coag）看看 Hb 跟凝血功能？同時可以先加壓輸液穩住血壓。",
    highlightAction: "preset-cbc-coag",
  },
  {
    id: "guide-intervention",
    trigger: "vitals_critical",
    message:
      "學長！血壓一直在掉，CT 出血量越來越大！要不要先輸血？鮮紅色有血塊，很可能是 surgical bleeding。",
    highlightAction: "preset-prbc-2u",
  },
  {
    id: "guide-escalation",
    trigger: "missed_critical",
    message:
      "學長，出血趨勢一直上升，血壓也不穩⋯⋯是不是要叫學長來評估需不需要回 OR re-explore？",
    highlightAction: "preset-call-senior",
  },
  {
    id: "guide-wrong-action",
    trigger: "wrong_action",
    message:
      "學長，這個處置可能不太適合現在的狀況。出血的病人最需要的是補液、輸血、找出血原因。",
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
