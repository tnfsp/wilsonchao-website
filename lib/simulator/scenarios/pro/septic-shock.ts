// lib/simulator/scenarios/pro/septic-shock.ts
// ICU 值班模擬器 Pro — 情境：術後敗血性休克
// 病人：58M, CABG ×4, POD#3, Bed 8
// 難度：Intermediate | 時長：30min | 開始：22:00

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
  GuidelineBundle,
} from "@/lib/simulator/types";

// ============================================================
// Initial State
// ============================================================

const initialVitals: VitalSigns = {
  hr: 105,
  sbp: 100,
  dbp: 55,
  map: 70,
  spo2: 94,
  cvp: 5,
  temperature: 38.8,
  rr: 24,
  aLineWaveform: "normal", // A-line 已拔除，但 type 需要
};

const initialChestTube: ChestTubeState = {
  currentRate: 0,         // CT 已於 POD#2 拔除
  totalOutput: 0,
  color: "serous",
  hasClots: false,
  isPatent: false,        // 已拔除
  airLeak: false,
};

// ============================================================
// Scripted Events
// ============================================================

// Condition: 10 分鐘內沒有開 blood culture
const conditionNoBcx: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_not_taken", op: "==", value: "order_blood_culture" },
  ],
};

// Condition: 15 分鐘內沒給抗生素
const conditionNoAntibiotics: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_not_taken", op: "==", value: "order_antibiotics" },
    { field: "severity",         op: ">",  value: 50 },
  ],
};

// Condition: severity > 60 AND 沒叫學長
const conditionHighSeverityNoSenior: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "severity",         op: ">",    value: 60 },
    { field: "action_not_taken", op: "==",   value: "call_senior" },
  ],
};

// Condition: 有給抗生素（互斥 conditionNoAntibiotics，用於正常穩定路徑）
const conditionAntibioticsGiven: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_taken", op: "==", value: "order_antibiotics" },
  ],
};

// Condition: 給了足夠 fluid（> 2000mL）後追蹤
const conditionFluidGiven: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "total_fluid_given", op: ">=", value: 2000 },
  ],
};

const events: ScriptedEvent[] = [
  // ── 00:00 ── 護理師 call：發燒 + 心跳快
  {
    id: "evt-00-nurse-call",
    triggerTime: 0,
    type: "nurse_call",
    message:
      "醫師，bed 8 的張先生，CABG ×4 POD#3。剛量體溫 38.8，心跳 105，有點喘、呼吸 24。他跟我說他覺得不太舒服，人看起來有點迷迷糊糊的。你要不要來看一下？",
    severityChange: 0,
  },

  // ── 05:00 ── 體溫持續升。Lactate 回報（如果有抽）。意識變化。
  {
    id: "evt-05-worsening",
    triggerTime: 5,
    type: "nurse_call",
    message:
      "醫師，體溫升到 {{temp}} 了。他講話開始有點語無倫次，問他今天星期幾答不出來。我覺得不太對勁⋯⋯",
    severityChange: 15,
  },

  // ── 08:00 ── 護理師發現 sternal wound 問題
  {
    id: "evt-08-wound",
    triggerTime: 8,
    type: "nurse_call",
    message:
      "醫師，我幫他換藥的時候看到——sternal wound 周圍紅腫明顯、摸起來很熱。有一個角在滲濃黃色的膿。是不是 wound infection？",
    severityChange: 10,
  },

  // ── 10:00 ── BP 掉了。第一輪 fluid 效果不好。
  {
    id: "evt-10-bp-drop",
    triggerTime: 10,
    type: "nurse_call",
    message:
      "醫師，500cc NS 給完了，但血壓還是掉——現在 {{sbp}}/{{dbp}}。心跳 {{hr}}。人越來越不清楚了。",
    severityChange: 15,
  },

  // ── 12:00 ── 沒開 blood culture 的話護理師提醒（條件觸發）
  {
    id: "evt-12-bcx-reminder",
    triggerTime: 12,
    triggerCondition: conditionNoBcx,
    type: "nurse_call",
    message:
      "醫師，要不要先抽個 blood culture？燒這麼高，在給抗生素之前先抽比較好⋯⋯",
  },

  // ── 15:00 ── 需要 vasopressor。Lab 結果回來。
  {
    id: "evt-15-vasopressor-needed",
    triggerTime: 15,
    type: "nurse_call",
    message:
      "醫師，又給了 1000cc fluid，血壓還是上不來，MAP 勉強 {{map}}。心跳 {{hr}}。WBC 和 lactate 結果出來了——看起來很不好。你要不要開 vasopressor？",
    newLabResults: {
      cbc_t1: {
        wbc: { value: 18.5, unit: "K/μL",  normal: "4.5-11.0", flag: "H" },
        hb:  { value: 10.8, unit: "g/dL",  normal: "13.5-17.5", flag: "L" },
        plt: { value: 95,   unit: "K/μL",  normal: "150-400",   flag: "L" },
      },
      abg_t1: {
        ph:     { value: 7.30, unit: "",       normal: "7.35-7.45", flag: "L" },
        paco2:  { value: 28,   unit: "mmHg",   normal: "35-45",     flag: "L" },
        lactate:{ value: 4.2,  unit: "mmol/L", normal: "0.5-1.6",   flag: "critical" },
      },
    },
    severityChange: 15,
  },

  // ── 15:00 ── 沒給抗生素 → 護理師主動問（條件觸發）
  {
    id: "evt-15-abx-reminder",
    triggerTime: 15,
    triggerCondition: conditionNoAntibiotics,
    type: "nurse_call",
    message:
      "醫師，WBC 18.5、lactate 4.2，wound 又在流膿⋯⋯要不要先經驗性給個抗生素？Vancomycin + Tazocin 好不好？",
  },

  // ── 18:00 ── 沒叫學長 → 護理師建議（條件觸發）
  {
    id: "evt-18-nurse-suggest-senior",
    triggerTime: 18,
    triggerCondition: conditionHighSeverityNoSenior,
    type: "nurse_call",
    message:
      "醫師，他的 wound 需要 surgical washout，這個你沒辦法自己處理。我覺得應該通知 VS⋯⋯",
  },

  // ── 20:00 ── 如果沒給抗生素 → 持續惡化
  {
    id: "evt-20-deterioration",
    triggerTime: 20,
    triggerCondition: conditionNoAntibiotics,
    type: "escalation",
    message:
      "⚠️ 血壓 {{sbp}}/{{dbp}}，MAP {{map}}。Lactate 趨勢上升。病人開始出現 mottled skin。敗血性休克正在失控！",
    severityChange: 20,
  },

  // ── 20:00 ── 正常路徑（有給 antibiotics → 互斥 evt-20-deterioration）
  {
    id: "evt-20-stabilizing",
    triggerTime: 20,
    triggerCondition: conditionAntibioticsGiven,
    type: "vitals_change",
    severityChange: -5,
  },

  // ── 25:00 ── 大量輸液後肺部開始有 crackles（條件觸發）
  {
    id: "evt-25-fluid-overload",
    triggerTime: 25,
    triggerCondition: conditionFluidGiven,
    type: "nurse_call",
    message:
      "醫師，給了不少水了。我聽到雙側底部有一些 crackle，SpO2 也掉了一點。要不要放慢 fluid rate？",
    severityChange: 5,
  },

  // ── 30:00 ── 穩定或結束
  {
    id: "evt-30-resolution",
    triggerTime: 30,
    type: "escalation",
    message:
      "學長到場評估後：「這是 sternal wound infection 引起的 septic shock。抗生素開對了，vasopressor 用得好。明天一早安排 OR washout + debridement。先把他穩住。」→ 情境結束，進入 Debrief。",
    severityChange: 0,
  },
];

// ============================================================
// Expected Actions
// ============================================================

const expectedActions: ExpectedAction[] = [
  {
    id: "act-blood-culture",
    action: "Blood cultures × 2 sets（給抗生素之前）",
    description: "在開始抗生素之前，先抽兩套血液培養（不同部位）。之後再給不到 → 培養率下降",
    deadline: 10,
    critical: true,
    hint: "Sepsis bundle 第一條：在抗生素之前抽 blood culture × 2。先抽再打！順序很重要。",
    rationale: "Blood culture 是確認致病菌和調整抗生素的唯一方法。一旦給了抗生素，培養的陽性率會顯著下降（30-50% reduction）。'先抽再打' 是 Surviving Sepsis Campaign 的核心原則之一。兩套不同部位可以區分 true bacteremia vs contamination。",
    howTo: "兩套 blood culture（不同部位抽）：一套 peripheral venipuncture + 一套 central line（如果有的話）。每套含 aerobic + anaerobic bottle。消毒 > 30 sec 減少 contamination。然後立刻給抗生素，不要等結果。",
  },
  {
    id: "act-antibiotics",
    action: "Broad-spectrum antibiotics within 1 hour（Vancomycin + Piperacillin-Tazobactam）",
    description: "Hour-1 bundle：經驗性抗生素必須在辨識 sepsis 後 1 小時內給",
    deadline: 10,
    critical: true,
    hint: "Sternal wound infection + septic shock → 要蓋 MRSA + Gram-negative。Vancomycin + Tazocin 是標準組合。",
    rationale: "Septic shock 每延遲 1 小時給抗生素，死亡率增加約 7.6%（Kumar et al. 2006）。Hour-1 bundle 是 SSC 2021 最高等級建議。Sternal wound infection 需要蓋 MRSA（Vancomycin）+ Gram-negative（Piperacillin-Tazobactam），因為術後感染可能是 polymicrobial。",
    howTo: "Vancomycin 25-30mg/kg IV loading dose（90kg → 約 2g）over 1-2hr + Piperacillin-Tazobactam 4.5g IV q6h。先打 Tazocin（快），Vancomycin 需要 infuse 較久。如果 PCN allergy → 改 Meropenem + Vancomycin。",
  },
  {
    id: "act-fluid-resuscitation",
    action: "Crystalloid 30mL/kg（2700mL for 90kg）",
    description: "Surviving Sepsis Campaign：septic shock 的初始 fluid resuscitation 目標 30mL/kg",
    deadline: 15,
    critical: true,
    hint: "90kg 病人 × 30mL/kg = 2700mL。先快速給，再評估反應。不用一次灌完，但要盡快啟動。",
  },
  {
    id: "act-lactate",
    action: "Lactate 追蹤（q2-4h）",
    description: "用 lactate 趨勢評估 resuscitation 效果。目標：6 小時內下降 ≥ 10%",
    deadline: 10,
    critical: true,
    hint: "Lactate 是 sepsis 嚴重度和 resuscitation 效果的最佳指標。一定要追蹤趨勢！",
  },
  {
    id: "act-vasopressor",
    action: "Norepinephrine（Levophed）— septic shock 首選 vasopressor",
    description: "Adequate fluid 後 MAP 仍 < 65 → 開始 Levophed",
    deadline: 15,
    critical: true,
    hint: "Fluid 給了但 MAP 上不來 → Levophed 是 septic shock 的 first-line vasopressor。不要等太久。",
  },
  {
    id: "act-call-senior",
    action: "通知 Senior / VS（source control）",
    description: "Sternal wound infection 需要 surgical washout — 這需要 VS 決定",
    deadline: 15,
    critical: true,
    hint: "Antibiotics 治菌、但膿要清。Source control 是 sepsis 的根本治療之一。VS 需要決定 timing。",
  },
  {
    id: "act-wound-culture",
    action: "Wound culture / swab",
    description: "傷口有明顯膿性滲出 → 取檢體培養，作為調整抗生素的依據",
    deadline: 15,
    critical: false,
    hint: "有膿就要取 culture。Gram stain 可以在 1 小時內初步告訴你是什麼菌。",
  },
  {
    id: "act-foley",
    action: "Foley catheter（UOP monitoring）",
    description: "UOP 是 end-organ perfusion 最簡單的指標。目標 ≥ 0.5mL/kg/hr",
    deadline: 15,
    critical: false,
    hint: "放尿管追蹤每小時尿量。90kg → 目標 ≥ 45mL/hr。如果掉到 < 30 → resuscitation 不夠或 AKI。",
  },
  {
    id: "act-central-line",
    action: "Central line（for vasopressor administration）",
    description: "Levophed 需要 central line（或有 designated peripheral line protocol）",
    deadline: 20,
    critical: false,
    hint: "Levophed 長時間跑需要 central line。如果病人之前 CVC 已拔，需要重新放。短期可先 peripheral 跑。",
  },
  {
    id: "act-abg",
    action: "ABG / Lactate",
    description: "評估酸鹼狀態和組織灌流",
    deadline: 10,
    critical: false,
    hint: "pH 7.30 + lactate 4.2 = significant metabolic acidosis with tissue hypoperfusion。",
  },
  {
    id: "act-vent-fio2-increase",
    action: "提高 FiO₂（SpO₂ < 92% 時）",
    description: "Sepsis 造成肺部氣體交換下降，SpO₂ 持續掉 → 需要先提高 FiO₂ 維持氧合",
    deadline: 10,
    critical: false,
    hint: "SpO₂ < 92% → 先拉 FiO₂。目標 SpO₂ > 94%，但不要長期維持 FiO₂ > 0.6（氧毒性）。",
    rationale: "Sepsis 引起的 ARDS / pulmonary edema 會導致 V/Q mismatch 和 shunt，SpO₂ 下降。提高 FiO₂ 是最快改善氧合的方式。但長期 FiO₂ > 0.6 有氧毒性風險，應搭配 PEEP 調整。",
    howTo: "呼吸器調整 FiO₂：從目前設定向上調整，每次 +10-20%，觀察 SpO₂ 反應。若 FiO₂ 已 > 0.6 仍缺氧 → 考慮提高 PEEP。",
  },
  {
    id: "act-vent-peep-increase",
    action: "提高 PEEP（呼吸衰竭時）",
    description: "Sepsis-related ARDS → 提高 PEEP 改善肺擴張和氧合",
    deadline: 20,
    critical: false,
    hint: "FiO₂ 拉高還不夠 → 提高 PEEP ≥ 10。注意 PEEP 會降低回心血量，血壓可能更低。",
    rationale: "PEEP 可以打開塌陷的肺泡（recruitment），改善功能殘氣量（FRC），減少 shunt。但 PEEP 會增加胸腔內壓 → 降低靜脈回流 → 可能惡化 septic shock 的低血壓。需要平衡 oxygenation 和 hemodynamics。",
    howTo: "從 PEEP 8 開始，每次 +2，觀察 SpO₂ 和 MAP 反應。若 MAP 掉 > 10% → 可能需要加 vasopressor 補償。ARDSnet protocol: Low PEEP table 搭配 FiO₂。",
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
      wbc: { value: 18.5, unit: "K/μL",  normal: "4.5-11.0", flag: "H" },
      hb:  { value: 10.8, unit: "g/dL",  normal: "13.5-17.5", flag: "L" },
      plt: { value: 95,   unit: "K/μL",  normal: "150-400",   flag: "L" },
      hct: { value: 32.4, unit: "%",      normal: "41-53",     flag: "L" },
      band:{ value: 12,   unit: "%",      normal: "0-5",       flag: "H" },
    },
  },
  abg: {
    id: "abg",
    name: "Arterial Blood Gas (ABG) + Lactate",
    turnaroundTime: 5,
    results: {
      ph:     { value: 7.30, unit: "",       normal: "7.35-7.45", flag: "L" },
      paco2:  { value: 28,   unit: "mmHg",   normal: "35-45",     flag: "L" },
      pao2:   { value: 72,   unit: "mmHg",   normal: "80-100",    flag: "L" },
      hco3:   { value: 16,   unit: "mEq/L",  normal: "22-26",     flag: "L" },
      be:     { value: -8.5, unit: "mEq/L",  normal: "-2 to +2",  flag: "L" },
      lactate:{ value: 4.2,  unit: "mmol/L", normal: "0.5-1.6",   flag: "critical" },
      sao2:   { value: 93,   unit: "%",       normal: "95-100",    flag: "L" },
    },
  },
  bcs: {
    id: "bcs",
    name: "Basic Chemistry (BCS)",
    turnaroundTime: 10,
    results: {
      na:      { value: 136, unit: "mEq/L", normal: "136-145" },
      k:       { value: 4.5, unit: "mEq/L", normal: "3.5-5.0" },
      bun:     { value: 35,  unit: "mg/dL", normal: "7-20",    flag: "H" },
      cr:      { value: 2.1, unit: "mg/dL", normal: "0.6-1.2", flag: "H" },
      glucose: { value: 250, unit: "mg/dL", normal: "70-110",  flag: "H" },
    },
  },
  lactate: {
    id: "lactate",
    name: "Lactate",
    turnaroundTime: 8,
    results: {
      lactate: { value: 4.2, unit: "mmol/L", normal: "0.5-1.6", flag: "critical" },
    },
  },
  procalcitonin: {
    id: "procalcitonin",
    name: "Procalcitonin (PCT)",
    turnaroundTime: 12,
    results: {
      pct: { value: 8.5, unit: "ng/mL", normal: "< 0.5", flag: "critical" },
    },
  },
  blood_culture: {
    id: "blood_culture",
    name: "Blood Culture × 2 sets",
    turnaroundTime: 30, // 初步 Gram stain 約 30 min（game time）
    results: {
      gram_stain: { value: "Gram-positive cocci in clusters（初步報告）", unit: "", normal: "" },
      culture:    { value: "Pending — 完整結果 48-72hr", unit: "", normal: "" },
    },
  },
  coag: {
    id: "coag",
    name: "Coagulation Panel (PT/INR/aPTT/Fibrinogen)",
    turnaroundTime: 10,
    results: {
      pt:  { value: 16.5, unit: "sec",   normal: "11-13",   flag: "H" },
      inr: { value: 1.5,  unit: "",      normal: "0.9-1.1", flag: "H" },
      aptt:{ value: 40,   unit: "sec",   normal: "25-35",   flag: "H" },
      fib: { value: 380,  unit: "mg/dL", normal: "200-400" },
    },
  },
  crp: {
    id: "crp",
    name: "C-Reactive Protein (CRP)",
    turnaroundTime: 10,
    results: {
      crp: { value: 185, unit: "mg/L", normal: "< 5", flag: "critical" },
    },
  },
  ua: {
    id: "ua",
    name: "Urinalysis",
    turnaroundTime: 8,
    results: {
      appearance: { value: "Cloudy", unit: "", normal: "Clear" },
      wbc:        { value: "5-10",   unit: "/HPF", normal: "0-5" },
      bacteria:   { value: "Few",    unit: "",     normal: "None" },
      nitrite:    { value: "Negative", unit: "", normal: "Negative" },
    },
  },
  type_screen: {
    id: "type_screen",
    name: "Type & Screen",
    turnaroundTime: 15,
    results: {
      blood_type:      { value: "A+",       unit: "", normal: "" },
      antibody_screen: { value: "Negative", unit: "", normal: "" },
    },
  },
};

// ============================================================
// Available Imaging
// ============================================================

const availableImaging: Record<string, string> = {
  cxr_portable: `
**Portable CXR（床邊）**
- 心影大小正常（s/p CABG ×4, sternotomy wires intact）
- 雙側肺野基底可見少許 haziness（可能 mild atelectasis 或 early infiltrate）
- 無明顯 pleural effusion
- 氣管位居中線
- No pneumothorax
- NG tube in situ, tip at stomach
  `,
  sternal_wound_photo: `
**Sternal wound 外觀**
- 正中 sternotomy incision 上半段 erythema 明顯（紅腫範圍約 5cm）
- 局部觸診 warmth (+)、fluctuance (+)
- 右上角有 1cm opening，滲出黃綠色 purulent drainage
- 周圍皮膚 indurated、tender to touch
- 未見 sternal instability（但需 CT scan 進一步評估）
  `,
  ecg_12lead: `Sinus tachycardia, rate 120+. Normal axis. Non-specific ST-T changes. Possible prolonged QTc.`,
};

// ============================================================
// Available POCUS
// ============================================================

const availablePOCUS: Record<string, POCUSView> = {
  cardiac: {
    type: "cardiac",
    finding:
      "LV hyperdynamic（EF estimated > 70%）。RV 大小正常。No pericardial effusion。Valves 正常。",
    interpretation:
      "Hyperdynamic LV = 典型 distributive shock（高 CO、低 SVR）。排除 cardiogenic shock 和 tamponade。與 septic shock 表現一致。",
  },
  ivc: {
    type: "ivc",
    finding:
      "IVC small（直徑 < 15mm），呼吸變異 > 50%（明顯 collapse）。",
    interpretation:
      "Volume responsive。需要積極 fluid resuscitation。IVC 小 + collapsible = 前負荷不足，還有空間給 volume。",
  },
  lung: {
    type: "lung",
    finding:
      "初始：雙側 A-lines 為主，基底少量 B-lines。大量輸液後：bilateral B-lines 增加（≥3 per intercostal space）。",
    interpretation:
      "初始肺部清晰。大量輸液後出現 pulmonary edema 跡象 → 應減慢 fluid rate，考慮 vasopressor 為主。",
  },
};

// ============================================================
// Physical Exam
// ============================================================

const physicalExam: Record<string, PEFinding> = {
  general: {
    area: "General",
    finding:
      "Febrile, flushed, diaphoretic。意識漸混：GCS 13（E3V4M6）→ 後期可能掉到 11。問時間地點答不正確。四肢溫暖但有 delayed capillary refill。",
  },
  chest: {
    area: "Chest / Respiratory",
    finding:
      "Tachypneic（RR 24-30）。雙側呼吸音清晰，基底可能有少許 crackle（大量輸液後加重）。Sternotomy wound：見下方 wound 部分。",
  },
  heart: {
    area: "Cardiovascular",
    finding:
      "Tachycardic, regular rhythm。心音正常，無雜音。Warm extremities（distributive shock 特徵 — warm shock phase）。Bounding pulses initially。Wide pulse pressure（100/55 → PP 45）。",
  },
  abdomen: {
    area: "Abdomen",
    finding: "Soft, non-distended。Mild tenderness RUQ（可能 early hepatic congestion）。Bowel sounds present。",
  },
  wound: {
    area: "Sternal Wound",
    finding:
      "Erythema 明顯（紅腫範圍 > 5cm from incision line）。Warmth (+++)。Fluctuance (+) at upper portion。右上角 1cm 開口滲出黃綠色 purulent drainage。臭味 (+)。Sternal stability 尚可，但按壓有 mild click。",
  },
  extremities: {
    area: "Extremities",
    finding:
      "Warm peripheries（warm shock phase）。Cap refill 2-3 秒。Bilateral pedal pulses present。Mild bilateral pitting edema（POD#3 術後液體平衡）。",
  },
};

// ============================================================
// Debrief
// ============================================================

const debrief: DebriefData = {
  correctDiagnosis: "Septic shock secondary to deep sternal wound infection (DSWI)",

  keyPoints: [
    "Sepsis-3 定義：感染 + qSOFA ≥ 2（altered mental status + tachypnea + hypotension）→ 啟動 sepsis workup。",
    "Hour-1 Bundle（Surviving Sepsis Campaign 2021）：①Lactate ②Blood cultures ×2 ③Broad-spectrum antibiotics ④30mL/kg crystalloid（if hypotension or lactate ≥ 4）⑤Vasopressor（if MAP < 65 after fluid）。",
    "Blood culture 要在抗生素之前！順序很重要：先抽再打。但不要因為等 culture 而延遲 antibiotics — 兩者要幾乎同時進行。",
    "Sternal wound infection（深部 / DSWI）是 CABG 術後嚴重併發症（發生率 1-3%）。Risk factors：DM、COPD、肥胖、bilateral IMA harvest。",
    "Source control 是 sepsis 治療的核心之一：抗生素只能殺菌，但膿和壞死組織必須手術清除。VS 需要安排 washout。",
    "Norepinephrine 是 septic shock 的 first-line vasopressor。Adequate fluid resuscitation 後 MAP 仍 < 65 → 開始 NE。",
    "Lactate 追蹤（q2-4h）是評估 resuscitation 效果的最重要指標。目標：6 小時內下降 ≥ 10%。",
    "Dynamic assessment 三大指標：lactate trend + UOP + mental status。不要只看血壓數字。",
  ],

  pitfalls: [
    "等體溫很高才懷疑 sepsis：38.8 + tachycardia + tachypnea + altered mental status → 已經符合 sepsis criteria。不要等到 40 度才動。",
    "在抗生素之前沒有抽 blood culture：一旦給了抗生素，培養率顯著下降。先抽再打！但也不要因為抽血而延遲抗生素超過 15 分鐘。",
    "只給 fluid 不評估 fluid responsiveness：盲目灌水 → pulmonary edema → 更難呼吸。要用 POCUS/IVC 動態評估。",
    "忘記 source control：光靠抗生素無法治療 deep sternal wound infection。膿和壞死組織必須手術清除。",
    "用 Dopamine 而非 Norepinephrine：SSC guideline 明確建議 NE first-line。Dopamine 的 arrhythmia 風險更高。",
    "沒有放 Foley catheter 追蹤 UOP：尿量是 end-organ perfusion 最簡單的指標。沒放尿管等於矇著眼睛做 resuscitation。",
    "延遲 escalation：sternal wound infection 需要外科介入。你可以先穩住病人，但必須通知 VS 安排 washout。",
    "忘記 DM 的血糖控制：sepsis + DM → stress hyperglycemia。glucose 250 需要 insulin 控制，但避免低血糖。",
  ],

  guidelines: [
    "Surviving Sepsis Campaign 2021 Hour-1 Bundle：Lactate + Blood cultures + Antibiotics + 30mL/kg fluid + Vasopressor（if MAP < 65 after fluid）。",
    "Sepsis-3 定義：Infection + SOFA score increase ≥ 2。qSOFA（screening）：AMS + RR ≥ 22 + SBP ≤ 100。兩項即 positive。",
    "Empiric antibiotics for post-cardiac surgery wound infection：Vancomycin（cover MRSA）+ Piperacillin-Tazobactam（cover Gram-negative + anaerobes）。",
    "DSWI（Deep Sternal Wound Infection）CDC 分類：Superficial（皮膚）vs Deep（胸骨下到縱膈腔）。Deep 需要 surgical debridement + VAC therapy + possible muscle flap。",
    "Norepinephrine starting dose：0.05-0.1 mcg/kg/min，titrate to MAP ≥ 65。如果需要 > 0.5 mcg/kg/min，加 Vasopressin 0.03-0.04 U/min。",
    "Fluid resuscitation 動態評估：IVC collapsibility > 50% = likely fluid responsive。給 250-500mL bolus → 重新評估。不是一口氣灌 3L。",
    "Procalcitonin > 2 ng/mL 高度提示 bacterial infection。> 10 = severe sepsis。可用於追蹤抗生素治療效果（trend down = improving）。",
  ],

  whatIf: [
    {
      scenario: "如果你在 05:00 就辨識出 sepsis 並啟動 Hour-1 Bundle",
      outcome:
        "10 分鐘內 blood culture 抽好、antibiotics 開始跑、fluid 在灌。15 分鐘 MAP 勉強維持 62 → 加 Levophed。20 分鐘 VS 已被通知，明早安排 wound washout。Lactate 從 4.2 → 3.0（6hr）。病人穩定。",
      lesson:
        "Early recognition + rapid bundle execution 是 sepsis survival 的關鍵。每延遲 1 小時的抗生素，死亡率增加約 7%。",
    },
    {
      scenario: "如果你只把他當成普通術後發燒處理（退燒藥 + 觀察）",
      outcome:
        "30 分鐘內 MAP 掉到 55，lactate 飆到 6.8。1 小時後 multi-organ dysfunction（AKI + DIC + respiratory failure）。需要 intubation + 高劑量 vasopressor。死亡率從 20% 升到 > 50%。",
      lesson:
        "術後發燒不是都 benign。38.8 + qSOFA ≥ 2 = sepsis until proven otherwise。不要用退燒藥蒙蔽自己。",
    },
    {
      scenario: "如果你沒有找到 source（沒注意到 sternal wound）",
      outcome:
        "抗生素給了、fluid 灌了、vasopressor 開了⋯⋯但 48 小時後 wound 進展成 mediastinitis。感染擴散到縱膈腔，需要更大範圍的 debridement + flap coverage。住院天數增加 2-4 週，死亡率顯著上升。",
      lesson:
        "Source control 是 sepsis 治療的四大支柱之一（antibiotics + fluid + vasopressor + source control）。找到 source 並清除它，和給抗生素一樣重要。",
    },
  ],
};

// ============================================================
// ============================================================
// Guideline Bundles
// ============================================================

const guidelineBundles: GuidelineBundle[] = [
  {
    id: "ssc-2021-hour1",
    name: "Surviving Sepsis Campaign 2021 — Hour-1 Bundle",
    shortName: "SSC Hour-1 Bundle",
    source: "Evans L, et al. Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock 2021. Crit Care Med. 2021;49(11):e1063-e1143.",
    url: "https://doi.org/10.1097/CCM.0000000000005337",
    items: [
      {
        id: "ssc-lactate",
        description: "Measure lactate level",
        actionIds: ["act-lactate", "act-abg"],
        timeWindow: 10,
        evidenceLevel: "Strong recommendation, low quality of evidence",
        rationale: "If initial lactate is >2 mmol/L, remeasure within 2-4 hrs to guide resuscitation.",
      },
      {
        id: "ssc-blood-culture",
        description: "Obtain blood cultures before administering antibiotics",
        actionIds: ["act-blood-culture"],
        timeWindow: 10,
        evidenceLevel: "Best practice statement",
        rationale: "Obtaining cultures before antibiotics significantly improves pathogen identification. Do not delay antibiotics to obtain cultures.",
      },
      {
        id: "ssc-antibiotics",
        description: "Administer broad-spectrum antibiotics within 1 hour",
        actionIds: ["act-antibiotics"],
        timeWindow: 10,
        evidenceLevel: "Strong recommendation, moderate quality of evidence",
        rationale: "For septic shock, administer antimicrobials ideally within 1 hour of recognition. Each hour of delay is associated with measurable increase in mortality.",
      },
      {
        id: "ssc-fluid",
        description: "Begin rapid administration of 30 mL/kg crystalloid for hypotension or lactate ≥4",
        actionIds: ["act-fluid-resuscitation"],
        timeWindow: 15,
        evidenceLevel: "Strong recommendation, low quality of evidence",
        rationale: "Initial resuscitation with at least 30 mL/kg IV crystalloid fluid within the first 3 hours. Reassess hemodynamic status with dynamic measures.",
      },
      {
        id: "ssc-vasopressor",
        description: "Apply vasopressors if hypotensive during or after fluid resuscitation (target MAP ≥65 mmHg)",
        actionIds: ["act-vasopressor"],
        timeWindow: 20,
        evidenceLevel: "Strong recommendation, moderate quality of evidence",
        rationale: "Norepinephrine is first-line vasopressor. Start if MAP <65 despite adequate fluid resuscitation.",
      },
    ],
  },
  {
    id: "sts-source-control",
    name: "Source Control in Post-Cardiac Surgery Sepsis",
    shortName: "Source Control",
    source: "STS Practice Guidelines: Diagnosis & Management of Sternal Wound Infections. Ann Thorac Surg. 2017;104:e325-e335.",
    items: [
      {
        id: "src-wound-eval",
        description: "Evaluate surgical wound for signs of deep sternal wound infection",
        actionIds: ["act-wound-culture"],
        timeWindow: 15,
        evidenceLevel: "Strong recommendation",
        rationale: "DSWI requires early recognition. Sternal instability, purulent drainage, or positive cultures from mediastinal tissue/fluid are diagnostic criteria.",
      },
      {
        id: "src-escalation",
        description: "Notify attending surgeon for source control planning",
        actionIds: ["act-call-senior"],
        timeWindow: 20,
        evidenceLevel: "Best practice statement",
        rationale: "Surgical debridement is the cornerstone of DSWI treatment. Early notification enables timely OR scheduling for washout + debridement.",
      },
    ],
  },
];

// ============================================================
// Scenario Export
// ============================================================

export const septicShock: SimScenario = {
  id: "pro-septic-shock-01",
  title: "術後敗血性休克",
  subtitle: "CABG POD#3 — 夜班的發燒電話",
  hiddenTitle: "術後急變 Case C",
  hiddenSubtitle: "CABG POD#3 — 夜班的發燒電話",
  difficulty: "intermediate",
  duration: "30min",
  tags: [
    "cardiac-surgery",
    "post-op",
    "sepsis",
    "septic-shock",
    "wound-infection",
    "hour-1-bundle",
    "vasopressor",
    "source-control",
    "escalation",
  ],
  relevantTags: ["cardiac", "sepsis", "vasopressor", "sedation", "general"],

  patient: {
    age: 58,
    sex: "M",
    bed: "Bed 8",
    weight: 90,
    surgery: "CABG × 4 (LIMA-LAD, SVG-Diag, SVG-OM, SVG-RCA)",
    postOpDay: "POD#3",
    history: "DM type 2 (HbA1c 8.2%), COPD (GOLD II, ex-smoker 30 pack-years), HTN；無已知藥物過敏",
    allergies: [],
    keyMeds: [
      "Aspirin 100mg QD (resumed POD#1)",
      "Metformin 500mg BID (resumed POD#2)",
      "Insulin sliding scale (target glucose 140-180)",
      "Cefazolin 2g IV Q8H (prophylaxis, day 3 — 即將停)",
      "Enoxaparin 40mg SC QD (DVT prophylaxis, resumed POD#1)",
      "Tiotropium 18mcg INH QD (COPD maintenance)",
      "Acetaminophen 1g IV Q6H PRN (fever/pain)",
    ],
  },

  initialVitals,
  initialChestTube,

  initialVentilator: {
    mode: 'SIMV',
    fio2: 0.6,
    peep: 8,
    rrSet: 12,
    tvSet: 500,
    ieRatio: '1:2',
  },

  initialLabs: {
    hb_baseline:  11.5,
    wbc_pod1:     12.0,
    cr_baseline:  1.0,
    k_baseline:   4.3,
    glucose:      195,
    note: "以上為 POD#1 labs。POD#2 labs not yet drawn（夜班）。CT 已於 POD#2 拔除（引流 < 50cc/8hr）。A-line 已於 POD#2 拔除。",
  },

  pathology: "septic_shock",
  startHour: 22, // 22:00

  nurseProfile: {
    name: "王姐",
    experience: "senior",
  },

  events,
  expectedActions,
  guidelineBundles,

  availableLabs,
  availableImaging,
  availablePOCUS,
  physicalExam,

  debrief,
};

export default septicShock;
