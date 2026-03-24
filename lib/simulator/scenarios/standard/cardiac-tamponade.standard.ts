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
      "學長，CVP 高不是因為水太多——是心包積液壓迫心臟導致充盈受限。利尿反而會讓前負荷更低，血壓掉更快！Tamponade 要補液維持前負荷。",
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
      "學長，術後 tamponade 通常是凝血塊壓迫，不是液態積液。Needle 穿刺抽不到 clot，需要手術清除。正確做法是通知 VS 做 re-sternotomy。",
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
      "Bed 5 的病人 MVR + CABG 術後，CT output 突然變少了。先想想：CT 突然不出是好事嗎？還是有可能是堵住了？",
    highlightAction: "preset-strip-milk-ct",
  },
  {
    id: "guide-ct-drops",
    trigger: "idle",
    message:
      "學長，CT 從 150cc/hr 突然掉到 50cc/hr⋯⋯術後病人 CT 突然不出，最危險的可能是 clot 堵住！要不要先 milk 一下看看能不能通？",
    highlightAction: "preset-strip-milk-ct",
  },
  {
    id: "guide-beck-triad",
    trigger: "vitals_critical",
    message:
      "學長！血壓掉、CVP 一直升、心音變悶——這是 Beck triad！高度懷疑 cardiac tamponade。趕快照個 POCUS 確認！",
    highlightAction: "preset-pocus",
  },
  {
    id: "guide-escalation",
    trigger: "missed_critical",
    message:
      "學長，如果是 tamponade，這不是一個人能處理的！趕快叫外科學長來，可能需要緊急 re-sternotomy。",
    highlightAction: "preset-call-senior",
  },
  {
    id: "guide-volume",
    trigger: "vitals_critical",
    message:
      "學長，等學長來的同時，先給 volume 可以暫時提高前負荷、維持血壓。Tamponade 的橋接處置就是補液。",
    highlightAction: "preset-lr-500",
  },
  {
    id: "guide-wrong-action",
    trigger: "wrong_action",
    message:
      "學長，這個處置可能不適合 tamponade。記住：tamponade 的核心問題是心臟被壓迫，要解除壓迫（手術），不是利尿或穿刺。",
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
