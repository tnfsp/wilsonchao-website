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
      "學長，38.8 度 + 心跳快 + 意識改變 + 傷口流膿——這不是普通發燒！這是 sepsis，需要啟動 Hour-1 Bundle（血液培養 → 抗生素 → 輸液），不是退燒觀察。",
    orders: [
      { definitionId: "acetaminophen", dose: "1000", frequency: "STAT" },
    ],
  },
  {
    id: "preset-dopamine",
    label: "給 Dopamine 升壓",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，Septic shock 的首選升壓劑是 Norepinephrine，不是 Dopamine。SSC 指引明確建議 NE first-line，Dopamine 心律不整風險比較高。",
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
      "CABG 術後第 3 天的病人發燒 38.8、心跳快、意識改變。想想看：術後發燒 + 這些症狀，最需要排除什麼？",
    highlightAction: "preset-blood-culture",
  },
  {
    id: "guide-hour1-bundle",
    trigger: "idle",
    message:
      "學長，高燒 + tachycardia + 意識改變 + 傷口流膿——這很像 sepsis！SSC Hour-1 Bundle：先抽 blood culture，然後馬上給抗生素，同時開始輸液。",
    highlightAction: "preset-blood-culture",
  },
  {
    id: "guide-antibiotics",
    trigger: "idle",
    message:
      "學長，blood culture 抽了嗎？抽完就趕快給抗生素！Sternal wound infection 要蓋 MRSA + Gram-negative：Vancomycin + Tazocin。每延遲 1 小時死亡率增加 7%。",
    highlightAction: "preset-antibiotics",
  },
  {
    id: "guide-vasopressor",
    trigger: "vitals_critical",
    message:
      "學長！已經給了不少輸液但 MAP 還是上不來。輸液給夠後 MAP 仍 < 65 → 要加 Norepinephrine 升壓。不要等太久！",
    highlightAction: "preset-norepinephrine",
  },
  {
    id: "guide-source-control",
    trigger: "missed_critical",
    message:
      "學長，sternal wound 在流膿——這是感染源！抗生素可以殺菌，但膿要靠手術清。是不是要通知學長安排 washout？",
    highlightAction: "preset-call-senior",
  },
  {
    id: "guide-wrong-action",
    trigger: "wrong_action",
    message:
      "學長，這個處置可能不太對。Sepsis 的核心處置是：抽培養 → 打抗生素 → 輸液 → 升壓劑 → source control。",
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
};
