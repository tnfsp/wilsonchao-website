// Standard overlay — Cardiac Tamponade
// Simplified nurse messages + preset orders for Clerk/PGY level

import type { StandardOverlay } from "@/lib/simulator/types";
import type { StandardPresetOrder } from "./types";

// ============================================================
// Preset Orders (one-tap, pre-filled dose)
// ============================================================

export const cardiacTamponadePresets: StandardPresetOrder[] = [
  {
    id: "preset-strip-milk-ct",
    label: "Strip/Milk Chest Tube",
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
    id: "preset-call-senior",
    label: "叫外科學長（緊急）",
    icon: "📞",
    category: "communication",
    isCorrect: true,
    orders: [
      { definitionId: "call_senior", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-prepare-resternotomy",
    label: "準備 Re-sternotomy",
    icon: "🏥",
    category: "procedure",
    isCorrect: true,
    orders: [
      { definitionId: "prepare_resternotomy", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-type-screen",
    label: "備血 Type & Screen",
    icon: "🧪",
    category: "lab",
    isCorrect: true,
    orders: [
      { definitionId: "type_screen", dose: "1", frequency: "STAT" },
    ],
  },
  {
    id: "preset-furosemide",
    label: "給 Furosemide 利尿",
    icon: "💊",
    category: "medication",
    isCorrect: false,
    feedbackIfWrong:
      "學長，CVP 已經這麼高了，確定要利尿嗎？",
    orders: [
      { definitionId: "furosemide", dose: "20", frequency: "STAT" },
    ],
  },
  {
    id: "preset-pericardiocentesis",
    label: "Pericardiocentesis 心包穿刺",
    icon: "💉",
    category: "procedure",
    isCorrect: false,
    feedbackIfWrong:
      "學長，術後的 tamponade 用穿刺抽得到嗎？",
    orders: [
      { definitionId: "pericardiocentesis", dose: "1", frequency: "STAT" },
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
      "學長，這個病人的 CT 好像有點變化欸...",
  },
  {
    id: "guide-ct-drops",
    trigger: "idle",
    message:
      "學長，CT 突然出很少耶...這樣正常嗎？",
  },
  {
    id: "guide-beck-triad",
    trigger: "vitals_critical",
    message:
      "學長！血壓在掉、CVP 一直升、心音變悶...你覺得怎麼樣？",
  },
  {
    id: "guide-escalation",
    trigger: "missed_critical",
    message:
      "學長，這個狀況...是不是要找人來幫忙？",
  },
  {
    id: "guide-volume",
    trigger: "vitals_critical",
    message:
      "學長，血壓一直掉，要不要先想辦法撐一下？",
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
  "evt-00-handoff": {
    message:
      "醫師，bed 5 的陳阿姨，剛做完 MVR + CABG 手術。目前 CT 引流每小時 150cc，鮮紅色。A-line 波形有點 dampened。你先來看一下——注意觀察 CT output 的變化趨勢。",
  },
  "evt-05-ct-drops": {
    message:
      "醫師！不太對——chest tube 突然出很少了，從 150 掉到 {{ct_rate}} cc/hr！術後 CT 突然減少不一定是好事，可能是 clot 堵住了。要不要先 milk 看看？",
  },
  "evt-10-beck-triad": {
    message:
      "醫師，CT 幾乎沒東西出來了，只有 {{ct_rate}}cc/hr。血壓 {{sbp}}/{{dbp}}、心跳 {{hr}}、CVP 一直在升。病人說胸悶⋯⋯血壓低 + CVP 高 + CT 不出 = 高度懷疑 tamponade！",
  },
  "evt-15-ct-stopped": {
    message:
      "醫師！CT 完全沒出了！血壓 {{sbp}}/{{dbp}}，heart rate {{hr}}，CVP {{cvp}}。病人躁動冒冷汗。這很可能是 cardiac tamponade——需要趕快處理！",
  },
};

// ============================================================
// Overlay Export
// ============================================================

export const cardiacTamponadeStandard: StandardOverlay = {
  presetOrders: cardiacTamponadePresets,
  guidanceSteps,
  eventOverrides,
  timeScale: 0.75,
  rescueThreshold: { sbp: 60, hr: 150, spo2: 80 },
  rescueWindowSeconds: 60,
};
