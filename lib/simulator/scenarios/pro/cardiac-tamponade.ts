// lib/simulator/scenarios/pro/cardiac-tamponade.ts
// ICU 值班模擬器 Pro — 情境：術後心包填塞
// 病人：72F, MVR (mechanical) + CABG ×2, POD#0, Bed 5
// 難度：Advanced | 時長：30min | 開始：03:30 AM

import type {
  SimScenario,
  VitalSigns,
  ChestTubeState,
  ScriptedEvent,
  ExpectedAction,
  LabPanel,
  POCUSView,
  PEFinding,
  DebriefData,
  EventCondition,
} from "@/lib/simulator/types";

// ============================================================
// Initial State
// ============================================================

const initialVitals: VitalSigns = {
  hr: 110,
  sbp: 95,
  dbp: 68,
  map: 77,
  spo2: 96,
  cvp: 12,
  temperature: 35.5,
  rr: 20,
  aLineWaveform: "dampened",
};

const initialChestTube: ChestTubeState = {
  currentRate: 150,       // cc/hr
  totalOutput: 525,       // 3.5 hours post-op
  color: "bright_red",
  hasClots: false,
  isPatent: true,
  airLeak: false,
};

// ============================================================
// Scripted Events
// ============================================================

// Condition: severity > 60 AND 沒叫學長
const conditionHighSeverityNoSenior: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "severity",         op: ">",    value: 60 },
    { field: "action_not_taken", op: "==",   value: "call_senior" },
  ],
};

// Condition: 沒做 POCUS 且 CT output 已經降到 0
const conditionNoPocusCtStopped: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_not_taken",    op: "==", value: "cardiac_pocus" },
    { field: "chestTube.currentRate", op: "==", value: 0 },
  ],
};

// Condition: 沒有 strip/milk CT 且 CT output 掉下來
const conditionNoStripCT: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_not_taken",      op: "==", value: "strip_milk_ct" },
    { field: "chestTube.currentRate", op: "<",  value: 30 },
  ],
};

const events: ScriptedEvent[] = [
  // ── 00:00 ── 交班。CT output 看起來還行
  {
    id: "evt-00-handoff",
    triggerTime: 0,
    type: "nurse_call",
    message:
      "醫師，bed 5 的陳阿姨，MVR + CABG ×2，POD#0。目前 CT 引流每小時大概 150cc，鮮紅色沒有塊。A-line 波形有點 dampened，血壓勉強維持。你先來看一下好嗎？",
    severityChange: 0,
  },

  // ── 05:00 ── CT output 突然掉！CVP 開始爬
  {
    id: "evt-05-ct-drops",
    triggerTime: 5,
    type: "nurse_call",
    message:
      "醫師！不太對——chest tube 突然出很少了，現在大概 {{ct_rate}} cc/hr。而且 CVP monitor 在升，現在 {{cvp}}。",
    chestTubeChanges: {
      currentRate: 50,
      totalOutput: 575,
      color: "dark_red",
      hasClots: true,
      isPatent: true, // 還沒完全堵
    },
    severityChange: 20,
  },

  // ── 10:00 ── CT output 幾乎沒了。Beck triad 開始形成
  {
    id: "evt-10-beck-triad",
    triggerTime: 10,
    type: "nurse_call",
    message:
      "醫師，CT 這 5 分鐘幾乎沒引流了，只有 {{ct_rate}}cc/hr。血壓掉到 {{sbp}}/{{dbp}}，心跳 {{hr}}，CVP 直接跳到 {{cvp}}。我聽心音好像有變悶。還有——A-line 波形呼吸的時候落差變很大。",
    chestTubeChanges: {
      currentRate: 20,
      totalOutput: 595,
      hasClots: true,
      isPatent: false, // clot obstruction
    },
    severityChange: 25,
  },

  // ── 12:00 ── 沒有通 CT 的話，護理師提醒（條件觸發）
  {
    id: "evt-12-nurse-hint-strip",
    triggerTime: 12,
    triggerCondition: conditionNoStripCT,
    type: "nurse_call",
    message:
      "醫師，CT 幾乎不出了⋯⋯你看要不要先試著 milk 一下 chest tube？有時候是 clot 堵住。",
  },

  // ── 15:00 ── CT 完全停。CVP 20。JVD。
  {
    id: "evt-15-ct-stopped",
    triggerTime: 15,
    type: "nurse_call",
    message:
      "醫師！CT 完全沒出了——零！CVP {{cvp}}，血壓 {{sbp}}/{{dbp}}，heart rate {{hr}}。頸靜脈怒張很明顯，聽心音很悶。",
    chestTubeChanges: {
      currentRate: 0,
      totalOutput: 595,
      hasClots: true,
      isPatent: false,
    },
    severityChange: 20,
  },

  // ── 15:00 ── 沒叫學長 → 護理師主動建議（條件觸發）
  {
    id: "evt-15-nurse-suggest-senior",
    triggerTime: 15,
    triggerCondition: conditionHighSeverityNoSenior,
    type: "nurse_call",
    message:
      "醫師，我覺得這個很不對⋯⋯要不要趕快通知 VS？如果是 tamponade 可能需要緊急處理。",
  },

  // ── 18:00 ── 沒做 POCUS 的提醒（條件觸發）
  {
    id: "evt-18-pocus-reminder",
    triggerTime: 18,
    triggerCondition: conditionNoPocusCtStopped,
    type: "nurse_call",
    message:
      "醫師，超音波機就在旁邊——你要不要照個心臟看看有沒有積液？",
  },

  // ── 20:00 ── 若未處理 → 瀕臨 PEA arrest
  {
    id: "evt-20-pre-arrest",
    triggerTime: 20,
    type: "escalation",
    message:
      "⚠️ 血壓 {{sbp}}/{{dbp}}，心跳 {{hr}}，意識下降。病人呈現 near-PEA 狀態——心臟在跳但幾乎沒有 output。必須立即行動！",
    severityChange: 20,
  },

  // ── 25:00 ── 死亡（若未介入）
  {
    id: "evt-25-death",
    triggerTime: 25,
    type: "escalation",
    message:
      "⚠️ PEA arrest！心跳從 {{hr}} 突然掉 → asystole。Tamponade 導致心臟完全無法舒張充盈。→ 情境結束，進入 Debrief。",
    severityChange: 100,
  },
];

// ============================================================
// Expected Actions
// ============================================================

const expectedActions: ExpectedAction[] = [
  {
    id: "act-strip-milk-ct",
    action: "Strip/Milk chest tube",
    description: "CT output 突然減少 → 先排除 clot obstruction：strip/milk 嘗試恢復引流",
    deadline: 5,
    critical: true,
    hint: "CT output 從 150 掉到 50 → 不是改善，最可能是 clot 堵住。先試 milk/strip！",
  },
  {
    id: "act-cardiac-pocus",
    action: "Cardiac POCUS（評估 pericardial effusion）",
    description: "Beck triad 形成中 → 床邊超音波確認是否有心包積液和 RV diastolic collapse",
    deadline: 5,
    critical: true,
    hint: "CVP 升 + BP 降 + 心音變悶 → Beck triad。POCUS 30 秒就可以確認 tamponade。",
  },
  {
    id: "act-call-senior",
    action: "通知 Senior / VS（緊急）",
    description: "Cardiac tamponade 不是你一個人可以處理的 → 需要 VS 評估是否 re-sternotomy",
    deadline: 10,
    critical: true,
    hint: "這是急症中的急症。需要 VS 來決定是否 bedside re-open 或回 OR。越早通知越好。",
  },
  {
    id: "act-volume-challenge",
    action: "Volume challenge（Crystalloid 500mL rapid infusion）",
    description: "暫時提高前負荷，維持血壓等待 definitive treatment",
    deadline: 10,
    critical: true,
    hint: "Tamponade 時心臟充盈受限。給 volume 可以暫時提高 preload 維持 CO，爭取時間。",
  },
  {
    id: "act-vasopressor",
    action: "Levophed 維持或 Phenylephrine push",
    description: "橋接用血管升壓劑，維持灌流壓",
    deadline: 10,
    critical: false,
    hint: "Levophed 如果已經在跑就加速；或 push Phenylephrine 100-200mcg PRN 維持 MAP > 60。",
  },
  {
    id: "act-prepare-resternotomy",
    action: "準備 emergent re-sternotomy",
    description: "通知 OR、備血、準備開胸器械",
    deadline: 15,
    critical: true,
    hint: "Tamponade 的 definitive treatment 是解除壓迫。備好：開胸器械、pRBC、外科團隊。",
  },
  {
    id: "act-type-screen",
    action: "Type & Screen / Crossmatch",
    description: "準備血品，re-sternotomy 一定會需要",
    deadline: 10,
    critical: false,
    hint: "Re-open 一定需要血。提前備好 pRBC 至少 4U。",
  },
  {
    id: "act-abg-lactate",
    action: "Order ABG / Lactate",
    description: "評估組織灌流和酸鹼狀態",
    deadline: 10,
    critical: false,
    hint: "Lactate 和 base deficit 告訴你灌流夠不夠。Tamponade 的低心輸出 → 會有 lactic acidosis。",
  },
];

// ============================================================
// Available Labs
// ============================================================

const availableLabs: Record<string, LabPanel> = {
  cbc: {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    turnaroundTime: 8,
    results: {
      hb:  { value: 9.8,  unit: "g/dL",  normal: "12-16",    flag: "L" },
      wbc: { value: 11.2, unit: "K/μL",  normal: "4.5-11.0", flag: "H" },
      plt: { value: 108,  unit: "K/μL",  normal: "150-400",   flag: "L" },
      hct: { value: 29.4, unit: "%",      normal: "36-46",     flag: "L" },
    },
  },
  coag: {
    id: "coag",
    name: "Coagulation Panel (PT/INR/aPTT/Fibrinogen)",
    turnaroundTime: 10,
    results: {
      pt:  { value: 15.8, unit: "sec",   normal: "11-13",   flag: "H" },
      inr: { value: 1.4,  unit: "",      normal: "0.9-1.1", flag: "H" },
      aptt:{ value: 42,   unit: "sec",   normal: "25-35",   flag: "H" },
      fib: { value: 175,  unit: "mg/dL", normal: "200-400", flag: "L" },
    },
  },
  abg: {
    id: "abg",
    name: "Arterial Blood Gas (ABG) + Lactate",
    turnaroundTime: 5,
    results: {
      ph:     { value: 7.30, unit: "",       normal: "7.35-7.45", flag: "L" },
      paco2:  { value: 32,   unit: "mmHg",   normal: "35-45",     flag: "L" },
      pao2:   { value: 165,  unit: "mmHg",   normal: "80-100",    flag: "H" },
      hco3:   { value: 18,   unit: "mEq/L",  normal: "22-26",     flag: "L" },
      be:     { value: -6.5, unit: "mEq/L",  normal: "-2 to +2",  flag: "L" },
      lactate:{ value: 4.8,  unit: "mmol/L", normal: "0.5-1.6",   flag: "critical" },
      sao2:   { value: 96,   unit: "%",       normal: "95-100" },
    },
  },
  act: {
    id: "act",
    name: "Activated Clotting Time (ACT)",
    turnaroundTime: 8,
    results: {
      act: { value: 118, unit: "sec", normal: "< 130" },
    },
  },
  bcs: {
    id: "bcs",
    name: "Basic Chemistry (BCS)",
    turnaroundTime: 10,
    results: {
      na:      { value: 140, unit: "mEq/L", normal: "136-145" },
      k:       { value: 4.2, unit: "mEq/L", normal: "3.5-5.0" },
      bun:     { value: 22,  unit: "mg/dL", normal: "7-20",    flag: "H" },
      cr:      { value: 1.1, unit: "mg/dL", normal: "0.6-1.2" },
      glucose: { value: 185, unit: "mg/dL", normal: "70-110",  flag: "H" },
    },
  },
  type_screen: {
    id: "type_screen",
    name: "Type & Screen / Crossmatch",
    turnaroundTime: 15,
    results: {
      blood_type:      { value: "B+",       unit: "", normal: "" },
      antibody_screen: { value: "Negative", unit: "", normal: "" },
      crossmatch:      { value: "Compatible — 4U pRBC reserved", unit: "", normal: "" },
    },
  },
  lactate: {
    id: "lactate",
    name: "Lactate",
    turnaroundTime: 8,
    results: {
      lactate: { value: 4.8, unit: "mmol/L", normal: "0.5-1.6", flag: "critical" },
    },
  },
  ica: {
    id: "ica",
    name: "Ionized Calcium (iCa)",
    turnaroundTime: 5,
    results: {
      ica: { value: 1.08, unit: "mmol/L", normal: "1.12-1.32", flag: "L" },
    },
  },
};

// ============================================================
// Available Imaging
// ============================================================

const availableImaging: Record<string, string> = {
  cxr_portable: `
**Portable CXR（床邊）**
- 縱膈腔明顯變寬（較前一張明顯增加）
- Heart silhouette 呈 "water-bottle" shape
- 雙側肺野清晰，無明顯 pulmonary edema
- 氣管位居中線
- Sternotomy wires intact
- Bilateral chest tubes in situ
  `,
  ecg_12lead: `Low voltage QRS. Electrical alternans (alternating QRS amplitude). Sinus tachycardia. No acute ST changes.`,
};

// ============================================================
// Available POCUS
// ============================================================

const availablePOCUS: Record<string, POCUSView> = {
  cardiac: {
    type: "cardiac",
    finding:
      "Large pericardial effusion with circumferential fluid collection。RV diastolic collapse 明顯。'Swinging heart' sign present。RA systolic collapse。",
    interpretation:
      "典型 cardiac tamponade 超音波表現。大量心包積液壓迫右心室，造成 diastolic collapse → 充盈受限 → cardiac output 下降。需立即解除壓迫。",
  },
  ivc: {
    type: "ivc",
    finding:
      "IVC plethoric，直徑 > 25mm，呼吸變異 < 10%（幾乎沒有 collapsibility）。",
    interpretation:
      "Plethoric IVC = 右心壓力極高，與 tamponade physiology 一致。不是 volume 的問題，是心臟充盈被壓迫。但短期給 volume 仍可暫時提高 preload。",
  },
  lung: {
    type: "lung",
    finding:
      "雙側 A-lines，無明顯 B-lines。無 pleural effusion。Lung sliding present。",
    interpretation:
      "肺部清晰。排除 tension pneumothorax 或大量胸腔積液作為低血壓原因。",
  },
};

// ============================================================
// Physical Exam
// ============================================================

const physicalExam: Record<string, PEFinding> = {
  general: {
    area: "General",
    finding:
      "病人焦躁不安、意識漸混。四肢冰冷濕冷，周邊膚色蒼白。Cap refill > 4 秒。",
  },
  chest: {
    area: "Chest / Respiratory",
    finding:
      "雙側呼吸音清晰，無囉音。Sternotomy wound intact。敷料乾淨。Chest tube 引流瓶內可見暗紅色凝血塊。",
  },
  heart: {
    area: "Cardiovascular",
    finding:
      "Heart sounds distant / muffled。心跳快但規律。頸靜脈明顯怒張（JVD）。Peripheral pulse weak, thready。Pulsus paradoxus > 15mmHg（A-line 可測量）。",
  },
  abdomen: {
    area: "Abdomen",
    finding: "Soft, non-tender, non-distended。Bowel sounds present but diminished。",
  },
  extremities: {
    area: "Extremities",
    finding:
      "四肢冰冷、蒼白。Bilateral pedal pulses barely palpable。無明顯水腫。",
  },
  ct_site: {
    area: "Chest Tube Site",
    finding:
      "雙側 CT in situ。Suction at -20 cmH2O。右側 CT 引流管內可見暗紅色 clot 堵塞——用手擠壓（milk）無法通過。左側 CT 引流微量暗紅色。",
  },
};

// ============================================================
// Debrief
// ============================================================

const debrief: DebriefData = {
  correctDiagnosis: "Cardiac tamponade due to clot obstruction of chest tube",

  keyPoints: [
    "CT output 突然減少 ≠ 改善！最危險的可能是 clot obstruction → 血液積在 pericardial space → tamponade。",
    "Beck triad：hypotension + JVD（high CVP）+ muffled heart sounds — 三者並存高度提示 tamponade。",
    "Pulsus paradoxus > 10mmHg：A-line 上呼吸時血壓落差明顯增大，是 tamponade 的重要 hemodynamic sign。",
    "Cardiac POCUS 是最快的確診工具：large pericardial effusion + RV diastolic collapse = tamponade 確診。",
    "IVC plethoric（> 25mm, no collapsibility）= 右心壓力過高，與 tamponade physiology 一致。",
    "處置順序：①Strip/milk CT（嘗試恢復引流）→ ②失敗 → 通知 VS → ③Volume challenge 暫時維持 → ④準備 emergent re-sternotomy。",
    "這是 TIME-CRITICAL emergency：從 CT 停止到 PEA arrest 可能只有 15-20 分鐘。每一秒都重要。",
    "術後 cardiac tamponade 的 definitive treatment 是 re-sternotomy（而非一般的 pericardiocentesis），因為是凝血塊壓迫。",
  ],

  pitfalls: [
    "CT output 突然減少就放鬆警戒：「出血變少了」→ 錯誤！在剛動過心臟手術的病人，CT 突然不出才是最危險的。",
    "沒有嘗試 strip/milk CT：這是第一步也是最快的介入。如果 clot 可以被通開，可能立即恢復引流。",
    "只看 CVP 數字不看趨勢：CVP 從 12 → 14 → 17 → 20 的「趨勢」比任何單一數字更有意義。",
    "等 lab 結果才行動：Tamponade 是臨床 + POCUS 診斷。等 lab 回來病人已經 PEA arrest 了。",
    "給太多 fluid 但忘記根本原因：Volume 只是暫時的橋接，definitive treatment 是解除壓迫。不能只靠輸液。",
    "不敢叫學長：Tamponade 可能需要 bedside emergency re-sternotomy。這絕對不是你一個人可以處理的。",
    "用 pericardiocentesis 代替 re-sternotomy：術後 tamponade 通常是凝血塊（不是液態積液），needle 抽不到。需要手術清除。",
  ],

  guidelines: [
    "術後 cardiac tamponade 發生率約 1-6%。MVR 等瓣膜手術風險更高（術中需更多縫合線、更大的心包操作面積）。",
    "Beck triad 敏感度不到 50%，但特異度高。有 Beck triad = 高度懷疑 tamponade。沒有 ≠ 排除。",
    "Pulsus paradoxus > 10mmHg 是 tamponade 的 classic finding。A-line 上最容易觀察：呼吸時 SBP 落差。",
    "STS 指引：術後 CT 突然停止 + hemodynamic instability → 高度懷疑 tamponade → 立即 POCUS + 準備 re-sternotomy。",
    "Emergency re-sternotomy 可在 ICU bedside 進行（有些中心的 protocol）。需要：無菌開胸器械包、足夠的血品、VS 在場。",
    "Volume resuscitation 在 tamponade 時的角色：暫時提高 preload 維持 CO，但效果有限且短暫。不是 definitive treatment。",
    "Warfarin 橋接 heparin 的病人，術後凝血功能更差 → 出血/tamponade 風險更高。Coag panel 追蹤很重要。",
  ],

  whatIf: [
    {
      scenario: "如果你在 05:00 時就立即 strip/milk CT",
      outcome:
        "可能打通 clot → CT 恢復引流（一口氣出 100cc 暗紅色血 + clot）。CVP 從 14 回到 10，血壓回穩到 90/60。爭取到時間叫 VS 評估是否需要 re-explore。預後明顯好。",
      lesson:
        "Strip/milk 是第一步且最快的介入。CT 突然減少 → 立刻 milk，不用想太多。成功率其實不低，但要注意力道和方向。",
    },
    {
      scenario: "如果你沒做 POCUS，只靠臨床判斷",
      outcome:
        "你可能懷疑 tamponade 但不確定。猶豫是否叫 VS → 延遲 5-8 分鐘 → 血壓掉到 60/45。POCUS 只要 30 秒就可以確認，消除猶豫。",
      lesson:
        "POCUS 在術後 ICU 是最有價值的工具之一。不確定就照一下 — 30 秒的投資可以省下 10 分鐘的猶豫。",
    },
    {
      scenario: "如果你嘗試 pericardiocentesis 而非通知 VS 做 re-sternotomy",
      outcome:
        "Needle 進入 pericardial space 但只抽到少量血液（因為大部分是 organized clot）。壓迫沒有解除，血壓持續掉。失去了寶貴的 5-10 分鐘。最終還是需要 re-sternotomy，但病人狀況已明顯惡化。",
      lesson:
        "術後 tamponade ≠ 一般 tamponade。凝血塊需要手術清除。Pericardiocentesis 對液態積液有效，對 organized clot 幾乎無效。",
    },
  ],
};

// ============================================================
// Scenario Export
// ============================================================

export const cardiacTamponade: SimScenario = {
  id: "pro-cardiac-tamponade-01",
  title: "術後心包填塞",
  subtitle: "MVR + CABG POD#0 — 凌晨的急變",
  hiddenTitle: "術後急變 Case B",
  hiddenSubtitle: "MVR + CABG POD#0 — 凌晨的急變",
  difficulty: "advanced",
  duration: "30min",
  tags: [
    "cardiac-surgery",
    "post-op",
    "tamponade",
    "chest-tube",
    "pocus",
    "beck-triad",
    "re-sternotomy",
    "escalation",
    "time-critical",
  ],

  patient: {
    age: 72,
    sex: "F",
    bed: "Bed 5",
    weight: 55,
    surgery: "MVR (mechanical, St. Jude 27mm) + CABG × 2 (LIMA-LAD, SVG-OM)",
    postOpDay: "POD#0（術後 3.5 小時）",
    history: "RHD with severe MS/MR, AF (chronic, on warfarin pre-op → bridged with heparin), DM type 2；無已知藥物過敏",
    allergies: [],
    keyMeds: [
      "Warfarin（術前停用 5 天，bridged with heparin）",
      "Protamine given post-CPB（heparin reversal, ACT normalized）",
      "Insulin drip (target glucose 140-180)",
      "Cefazolin 2g IV Q8H × 48hr (prophylaxis)",
      "Levophed 0.03 mcg/kg/min (titrate for MAP > 65)",
      "Morphine 2mg IV PRN (pain)",
      "Amiodarone drip 0.5mg/min (rate control for AF)",
    ],
  },

  initialVitals,
  initialChestTube,

  initialVentilator: {
    mode: 'SIMV',
    fio2: 0.5,
    peep: 5,
    rrSet: 12,
    tvSet: 500,
    ieRatio: '1:2',
  },

  initialLabs: {
    hb_baseline:  10.2,
    inr_baseline: 1.3,
    cr_baseline:  1.0,
    k_baseline:   4.1,
    glucose:      175,
    act_postop:   120,
    note: "以上為術後即時 labs（回 ICU 時已抽）。ACT 已回復正常（protamine given）。新的 lab 需要另外 order。",
  },

  pathology: "cardiac_tamponade",
  startHour: 3.5, // 03:30 AM

  nurseProfile: {
    name: "小陳",
    experience: "junior",
  },

  events,
  expectedActions,

  availableLabs,
  availableImaging,
  availablePOCUS,
  physicalExam,

  debrief,
};

export default cardiacTamponade;
