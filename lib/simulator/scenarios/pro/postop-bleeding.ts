// lib/simulator/scenarios/pro/postop-bleeding.ts
// ICU 值班模擬器 Pro — 第一個情境：術後出血
// 病人：65M, CABG x3, POD#0, Bed 3
// 難度：Intermediate | 時長：30min | 開始：02:00 AM

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
  hr: 98,
  sbp: 105,
  dbp: 62,
  map: 76,
  spo2: 97,
  cvp: 7,
  temperature: 35.8,
  rr: 18,
  aLineWaveform: "dampened",
  rhythmStrip: "sinus_tach",
};

const initialChestTube: ChestTubeState = {
  currentRate: 200,       // cc/hr
  totalOutput: 200,       // 開始時累計 1 小時的量
  color: "bright_red",
  hasClots: false,
  isPatent: true,
  airLeak: false,
};

// ============================================================
// Scripted Events
// ============================================================

// Condition: severity > 70 AND 沒叫學長
const conditionHighSeverityNoSenior: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "severity",       op: ">",         value: 70 },
    { field: "action_not_taken", op: "==",      value: "call_senior" },
  ],
};

// Condition: 輸血 ≥ 4U AND 沒追 iCa
const conditionTransfusionNoiCa: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "blood_units_given", op: ">=",     value: 4 },
    { field: "action_not_taken",  op: "==",     value: "order_ica" },
  ],
};

// Condition: CT isPatent 變 false
const conditionCTOccluded: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "chestTube.isPatent", op: "==",    value: false },
  ],
};

// Condition: 第二套 lab — 只有追蹤過 lab 才出現
const conditionSecondLabTracked: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_taken", op: "==",          value: "order_cbc" },
  ],
};

const events: ScriptedEvent[] = [
  // ── 00:00 ── 護理師 call：CT 突然出很多
  {
    id: "evt-00-nurse-call",
    triggerTime: 0,
    type: "nurse_call",
    message:
      "醫師，bed 3 的 Lin 伯伯，chest tube 突然出很多，血壓有點在掉，你要不要先來看一下？",
    severityChange: 0,
  },

  // ── 05:00 ── CT 增加 + 血壓掉 + 鮮紅色有血塊
  {
    id: "evt-05-ct-increase",
    triggerTime: 5,
    type: "nurse_call",
    message:
      "醫師，血壓又掉了一點，{{sbp}}/{{dbp}}。chest tube 出的是鮮紅色的，有看到一些血塊，現在 {{ct_rate}}cc/hr。",
    chestTubeChanges: {
      currentRate: 280,
      totalOutput: 480,
      color: "bright_red",
      hasClots: true,
      isPatent: true,
    },
    severityChange: 20,
  },

  // ── 10:00 ── 第一套 Lab 結果回來
  {
    id: "evt-10-lab-result",
    triggerTime: 10,
    type: "lab_result",
    message: "醫師，CBC 和 Coag 結果出來了。",
    newLabResults: {
      cbc_t1: {
        hb:  { value: 8.2,  unit: "g/dL",  normal: "13.5-17.5", flag: "L" },
        wbc: { value: 9.8,  unit: "K/μL",  normal: "4.5-11.0" },
        plt: { value: 128,  unit: "K/μL",  normal: "150-400",   flag: "L" },
        hct: { value: 24.6, unit: "%",      normal: "41-53",     flag: "L" },
      },
      coag_t1: {
        pt:  { value: 14.2, unit: "sec",    normal: "11-13",     flag: "H" },
        inr: { value: 1.3,  unit: "",       normal: "0.9-1.1",   flag: "H" },
        aptt:{ value: 38,   unit: "sec",    normal: "25-35",     flag: "H" },
        fib: { value: 195,  unit: "mg/dL",  normal: "200-400",   flag: "L" },
      },
    },
  },

  // ── 15:00 ── 如果沒叫學長 → 護理師只報數字，不建議行動
  {
    id: "evt-15-nurse-report-status",
    triggerTime: 15,
    triggerCondition: conditionHighSeverityNoSenior,
    type: "nurse_call",
    message:
      "醫師，血壓 {{sbp}}/{{dbp}}，CT 累計 {{ct_total}}cc，這一個小時量一直沒有減少⋯⋯接下來要怎麼處理？",
    chestTubeChanges: {
      currentRate: 320,
      totalOutput: 1100,
      color: "bright_red",
      hasClots: true,
    },
    severityChange: 20,
  },

  // ── 15:00 ── 正常推進（無條件，給有叫學長的路徑）
  {
    id: "evt-15-vitals-progress",
    triggerTime: 15,
    type: "vitals_change",
    chestTubeChanges: {
      currentRate: 310,
      totalOutput: 1050,
      color: "bright_red",
      hasClots: true,
    },
    severityChange: 10,
  },

  // ── 18:00 ── 第二套 Lab（有追蹤才出現）
  {
    id: "evt-18-second-lab",
    triggerTime: 18,
    triggerCondition: conditionSecondLabTracked,
    type: "lab_result",
    message: "醫師，追的 CBC 第二次結果出來了。",
    newLabResults: {
      cbc_t2: {
        hb:  { value: 7.1, unit: "g/dL",  normal: "13.5-17.5", flag: "critical" },
        wbc: { value: 10.2,unit: "K/μL",  normal: "4.5-11.0" },
        plt: { value: 95,  unit: "K/μL",  normal: "150-400",   flag: "L" },
        fib: { value: 148, unit: "mg/dL",  normal: "200-400",   flag: "critical" },
      },
    },
  },

  // ── 18:00 ── 輸 ≥4U 血但沒追 iCa → 護理師提醒（條件觸發）
  {
    id: "evt-18-ica-reminder",
    triggerTime: 18,
    triggerCondition: conditionTransfusionNoiCa,
    type: "nurse_call",
    message:
      "醫師，輸了不少血了，要不要追一下 ionized calcium？輸太多有時候 iCa 會掉。",
  },

  // ── 20:00 ── 學長到場（只有玩家叫過學長才觸發）
  {
    id: "evt-20-senior-arrives",
    triggerTime: 20,
    triggerCondition: {
      operator: "AND",
      conditions: [
        { field: "action_taken", op: "==", value: "call_senior" },
      ],
    },
    type: "senior_arrives",
    message: "（學長推門進來）「怎麼了，跟我報告一下。」",
    severityChange: 0,
  },

  // ── 20:00 ── CT 堵住警告（條件觸發）
  {
    id: "evt-20-tamponade-warning",
    triggerTime: 20,
    triggerCondition: conditionCTOccluded,
    type: "escalation",
    message:
      "⚠️ Chest tube output 突然減少接近零！血壓 {{sbp}}/{{dbp}}，心跳 {{hr}}。可能是 clot 堵住 — tamponade 風險極高！",
    severityChange: 30,
  },

  // ── 25:00 ── 決定 re-explore → debrief 開始（需學長已到場）
  {
    id: "evt-25-reexplore",
    triggerTime: 25,
    triggerCondition: {
      operator: "AND",
      conditions: [
        { field: "action_taken", op: "==", value: "call_senior" },
      ],
    },
    type: "escalation",
    message:
      "學長評估後：「這個量、這個血壓、血還是鮮紅色有塊，surgical bleeding 機率很高。跟家屬說一下，我們準備回 OR re-explore。」→ 情境結束，進入 Debrief。",
    severityChange: 0,
  },
];

// ============================================================
// Expected Actions
// ============================================================

const expectedActions: ExpectedAction[] = [
  {
    id: "act-cbc-stat",
    action: "Order CBC stat",
    description: "追蹤 Hb 下降趨勢，作為輸血決策依據",
    deadline: 5,
    critical: true,
    hint: "出血情況下，第一步是量化失血：CBC stat 看 Hb。",
    rationale: "Hb 趨勢是判斷出血速度和輸血時機的核心指標。單次數值不夠，需要 serial follow-up 才能看出 trajectory。術後初始 Hb 可能被 hemodilution 影響，但趨勢下降是確切的出血證據。",
    howTo: "Order CBC stat → 抽完後標記時間。30 分鐘後再追一次 CBC 看趨勢。Hb drop > 1 g/dL/hr 代表活動性出血。Transfusion trigger 一般 Hb < 7（心外可考慮 < 8）。",
    diagnosticCategory: "lab",
  },
  {
    id: "act-coag-panel",
    action: "Order Coagulation panel (PT/INR/aPTT/Fibrinogen)",
    description: "評估是否有 coagulopathy（surgical bleeding vs coagulopathy）",
    deadline: 5,
    critical: true,
    hint: "光補血不夠，要知道有沒有 coagulopathy — Coag panel 幫你區分。",
    rationale: "心臟外科術後出血有兩種：surgical（需要回 OR）和 coagulopathy（可以用藥矯正）。Coag panel 是區分的關鍵。INR > 1.5、Fibrinogen < 150、Plt < 100 都指向 coagulopathy。不做這個檢查就無法做出正確決策。",
    howTo: "Order PT/INR, aPTT, Fibrinogen, Platelet count。同時考慮 ACT（心外特有）。結果判讀：INR > 1.5 → FFP；Fibrinogen < 150 → Cryo；Plt < 100 → Platelet transfusion。",
    diagnosticCategory: "lab",
  },
  {
    id: "act-type-screen",
    action: "Type & Screen / Crossmatch",
    description: "提前備血，避免大量輸血時沒有血品",
    deadline: 10,
    critical: true,
    hint: "備血越早越好，配血需要時間。",
    rationale: "Blood bank 配血需要 30-45 分鐘。在出血進行中，提前備血可以縮短 'decision to transfusion' 的時間。如果等到 Hb 掉到 critical 才送，來不及。",
    howTo: "立即抽紅頭管送 blood bank：Type & Screen + Crossmatch pRBC 至少 4U。告知 blood bank 預期可能大量用血。如果已有之前的 T&S 結果（< 72hr），可直接 crossmatch。",
    diagnosticCategory: "lab",
  },
  {
    id: "act-volume-resuscitation",
    action: "Volume resuscitation (IV fluid 或 blood)",
    description: "血壓掉了要先穩住灌流",
    deadline: 10,
    critical: true,
    hint: "血壓 95，CVP 低，先給 volume — 可以是晶體液或開始輸血。",
    rationale: "低血壓 + 低 CVP = 容積不足。不管最終是要輸血還是回 OR，先穩住血壓維持 organ perfusion 是第一優先。腎臟和大腦對低灌流最敏感，每分鐘的低血壓都在造成 end-organ damage。",
    howTo: "LR 或 NS 500mL bolus（pressure bag），同時備血。如果 Hb 已知偏低 → 直接 O-negative pRBC 先輸再等 crossmatch。目標 MAP > 65。輸完 reassess CVP 和 BP。",
    diagnosticCategory: "treatment",
  },
  {
    id: "act-call-senior",
    action: "通知 Senior / VS",
    description: "持續出血 + 血壓不穩 → 需要 escalate，這不是一個人的決定",
    deadline: 20,
    critical: true,
    hint: "CT output 趨勢持續上升、血壓在掉 — 叫學長不丟臉，叫太晚才丟臉。",
    rationale: "持續出血合併血流動力學不穩定 = 可能需要 re-exploration。這個決定需要 VS 來做。過晚 escalate 是住院醫師最常見的錯誤之一，也是 M&M conference 最常檢討的問題。",
    howTo: "電話通知 Senior/VS：'POD1 CABG，CT output 趨勢上升（目前 Xcc/hr），BP dropping to X/X，已 bolus volume，Hb X → 可能需要 re-exploration'。準備好所有數據讓 VS 快速決策。",
    diagnosticCategory: "consult",
  },
  {
    id: "act-abg-lactate",
    action: "Order ABG / Lactate",
    description: "評估組織灌流是否足夠（lactate、base deficit）",
    deadline: 10,
    critical: false,
    hint: "知道血壓低還不夠，ABG + Lactate 告訴你灌流夠不夠、dead space 多不多。",
    rationale: "血壓只告訴你 'pressure'，不告訴你 'flow'。Lactate 和 base deficit 反映組織是否真的有在灌流。Lactate 上升趨勢代表 resuscitation 不足，需要加速處理。",
    howTo: "Arterial line 抽 ABG（或 VBG + lactate）。重點看：pH（< 7.3 = 嚴重）、Base deficit（< -6 = Lethal triad 之一）、Lactate（> 2 代表開始缺氧，> 4 代表嚴重）。",
    diagnosticCategory: "lab",
  },
  {
    id: "act-act",
    action: "Order ACT",
    description: "評估術後 heparin 殘留 — 心臟外科特有教學點",
    deadline: 15,
    critical: false,
    hint: "心臟外科術中用 heparin，ACT 可以告訴你還有多少殘留，是否需要 protamine 追加。",
    rationale: "心臟外科術中使用大量 heparin（300-400 U/kg）。雖然術末會用 protamine 逆轉，但可能逆轉不完全。ACT 是快速評估 residual heparin effect 的方法，如果延長 → protamine 追加可能就能止住 'medical bleeding'。",
    howTo: "床邊 ACT 機器（point-of-care），取 whole blood sample。正常 ACT < 130 sec。如果 > 130 → 考慮 Protamine 25-50mg slow IV push。注意 protamine 過量也會造成 coagulopathy。",
    diagnosticCategory: "lab",
  },
  {
    id: "act-cardiac-pocus",
    action: "Cardiac POCUS（排除 tamponade）",
    description: "有無 pericardial effusion？CT 是否 patent？",
    deadline: 15,
    critical: false,
    hint: "Cardiac POCUS 可以在床邊快速排除 tamponade — 尤其 CT output 突然減少時。",
    rationale: "Postop bleeding 和 tamponade 可以同時存在。CT output 突然減少不一定是改善，可能是 clot 堵塞引流 → 血積在 pericardium → tamponade。POCUS 30 秒可以排除這個致命鑑別診斷。",
    howTo: "Subxiphoid view 優先（術後 parasternal window 可能被 dressing 擋住）。看 pericardial space 有無積液、RV 有無 collapse。同時看 LV function 評估 cardiac output。",
    diagnosticCategory: "pocus",
  },
  {
    id: "act-protamine",
    action: "考慮 Protamine（逆轉 heparin）",
    description: "ACT 延長或 heparin effect 未消退 → Protamine 50mg IV slow push",
    deadline: 15,
    critical: false,
    hint: "心外術後標配：ACT > 130，考慮 Protamine 追加。注意要慢慢推，太快會低血壓。",
    rationale: "如果 ACT 延長（> 130 sec），代表 heparin 還有殘留效果。Protamine 是 heparin 的 specific antidote，1mg 中和約 100U heparin。在 surgical bleeding 前先排除 heparin effect 是 systematic approach 的一部分。",
    howTo: "Protamine 25-50mg dilute in 50mL NS，IV slow push over 10 min（太快會造成低血壓和過敏反應）。給完後 15 分鐘再測 ACT。注意：protamine 過量本身也會延長 aPTT。",
  },
  {
    id: "act-ica-monitoring",
    action: "iCa monitoring（輸血 ≥4U 後）",
    description: "大量輸血後，citrate 螯合 calcium → ionized Ca 下降 → 心肌收縮力變差",
    deadline: 999, // after 4U blood, no strict deadline
    critical: false,
    hint: "每輸 4U blood 追一次 iCa，< 1.0 mmol/L 需要補 Calcium gluconate。",
    rationale: "每袋 pRBC 含 citrate 防腐劑。Citrate 會螯合 ionized calcium → 大量輸血後 iCa 下降 → 心肌收縮力變差 → 低血壓惡化。這是 massive transfusion 最容易被忽略的併發症。",
    howTo: "每輸 4U blood product 後 check iCa（ABG 機器可測）。iCa < 1.0 mmol/L → Calcium Gluconate 1g IV over 10 min 或 CaCl2 500mg central line。目標 iCa > 1.1。",
  },
  {
    id: "act-vent-fio2-adjust",
    action: "調整 FiO₂（SpO₂ 下降時）",
    description: "大量出血導致 Hb 下降，攜氧能力降低 → 適度提高 FiO₂ 維持氧合",
    deadline: 15,
    critical: false,
    hint: "Hb 掉 → 攜氧能力下降 → SpO₂ 可能也跟著掉。提高 FiO₂ 可以暫時補償，但根本治療是輸血。",
    rationale: "出血導致 Hb 下降，DO₂ = CO × (Hb × 1.34 × SaO₂)。在 Hb 尚未被輸血矯正前，提高 FiO₂ 可以最大化現有 Hb 的攜氧量。但這只是橋接措施，不能取代輸血。",
    howTo: "SpO₂ < 94% → FiO₂ 提高至 0.6-0.8。同時加速輸血。SpO₂ 穩定後逐步 wean FiO₂，目標 < 0.5。",
  },
];

// ============================================================
// Available Labs（只有 order 了才看得到）
// ============================================================

const availableLabs: Record<string, LabPanel> = {
  cbc: {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    turnaroundTime: 8, // game minutes
    results: {
      hb:  { value: 8.2,  unit: "g/dL",  normal: "13.5-17.5", flag: "L" },
      wbc: { value: 9.8,  unit: "K/μL",  normal: "4.5-11.0" },
      plt: { value: 128,  unit: "K/μL",  normal: "150-400",   flag: "L" },
      hct: { value: 24.6, unit: "%",      normal: "41-53",     flag: "L" },
      mcv: { value: 87,   unit: "fL",     normal: "80-100" },
      mch: { value: 28,   unit: "pg",     normal: "27-33" },
    },
  },
  coag: {
    id: "coag",
    name: "Coagulation Panel (PT/INR/aPTT/Fibrinogen)",
    turnaroundTime: 10,
    results: {
      pt:  { value: 14.2, unit: "sec",   normal: "11-13",   flag: "H" },
      inr: { value: 1.3,  unit: "",      normal: "0.9-1.1", flag: "H" },
      aptt:{ value: 38,   unit: "sec",   normal: "25-35",   flag: "H" },
      fib: { value: 195,  unit: "mg/dL", normal: "200-400", flag: "L" },
      tt:  { value: 18,   unit: "sec",   normal: "14-21" },
    },
  },
  abg: {
    id: "abg",
    name: "Arterial Blood Gas (ABG) + Lactate",
    turnaroundTime: 5,
    results: {
      ph:    { value: 7.32, unit: "",         normal: "7.35-7.45", flag: "L" },
      paco2: { value: 35,   unit: "mmHg",     normal: "35-45" },
      pao2:  { value: 185,  unit: "mmHg",     normal: "80-100",    flag: "H" },
      hco3:  { value: 19,   unit: "mEq/L",    normal: "22-26",     flag: "L" },
      be:    { value: -5.2, unit: "mEq/L",    normal: "-2 to +2",  flag: "L" },
      lactate:{ value: 3.1, unit: "mmol/L",   normal: "0.5-1.6",   flag: "critical" },
      sao2:  { value: 97,   unit: "%",         normal: "95-100" },
    },
  },
  ica: {
    id: "ica",
    name: "Ionized Calcium (iCa)",
    turnaroundTime: 5,
    results: {
      ica: { value: 1.05, unit: "mmol/L", normal: "1.12-1.32", flag: "L" },
    },
  },
  lactate: {
    id: "lactate",
    name: "Lactate",
    turnaroundTime: 8,
    results: {
      lactate: { value: 3.1, unit: "mmol/L", normal: "0.5-1.6", flag: "critical" },
    },
  },
  act: {
    id: "act",
    name: "Activated Clotting Time (ACT)",
    turnaroundTime: 8,
    results: {
      act: { value: 145, unit: "sec", normal: "< 130", flag: "H" },
    },
  },
  bcs: {
    id: "bcs",
    name: "Basic Chemistry (BCS)",
    turnaroundTime: 10,
    results: {
      na:  { value: 138, unit: "mEq/L", normal: "136-145" },
      k:   { value: 3.8, unit: "mEq/L", normal: "3.5-5.0" },
      bun: { value: 28,  unit: "mg/dL", normal: "7-20",    flag: "H" },
      cr:  { value: 1.6, unit: "mg/dL", normal: "0.6-1.2", flag: "H" }, // CKD stage 3
      glucose: { value: 145, unit: "mg/dL", normal: "70-110", flag: "H" },
    },
  },
  cardiac_markers: {
    id: "cardiac_markers",
    name: "Cardiac Markers (Troponin)",
    turnaroundTime: 12,
    results: {
      troponin_i: {
        value: 0.45,
        unit: "ng/mL",
        normal: "< 0.04",
        flag: "H",
        // 術後正常偏高，非急性 MI
      },
    },
  },
  teg: {
    id: "teg",
    name: "Thromboelastography (TEG)",
    turnaroundTime: 15,
    results: {
      r_time:  { value: 7.2,  unit: "min", normal: "5-10" },
      k_time:  { value: 2.8,  unit: "min", normal: "1-3" },
      alpha:   { value: 58,   unit: "°",   normal: "53-72" },
      ma:      { value: 52,   unit: "mm",  normal: "51-69" },
      ly30:    { value: 4.2,  unit: "%",   normal: "< 8" },
      ci:      { value: -0.5, unit: "",    normal: "-3 to +3" },
    },
  },
  rotem: {
    id: "rotem",
    name: "ROTEM (Rotational Thromboelastometry)",
    turnaroundTime: 10,
    results: {
      ct_extem:  { value: 72,  unit: "sec", normal: "38-79" },
      cft_extem: { value: 95,  unit: "sec", normal: "34-159" },
      a10_extem: { value: 48,  unit: "mm",  normal: "43-65" },
      ct_intem:  { value: 185, unit: "sec", normal: "100-240" },
      ct_fibtem: { value: 68,  unit: "sec", normal: "43-69" },
      a10_fibtem:{ value: 10,  unit: "mm",  normal: "7-23" },
    },
  },
  type_screen: {
    id: "type_screen",
    name: "Type & Screen / Crossmatch",
    turnaroundTime: 15,
    results: {
      blood_type: { value: "O+", unit: "", normal: "" },
      antibody_screen: { value: "Negative", unit: "", normal: "" },
      crossmatch: { value: "Compatible — 4U pRBC reserved", unit: "", normal: "" },
    },
  },
};

// ============================================================
// Available Imaging
// ============================================================

const availableImaging: Record<string, string> = {
  cxr_portable: `
**Portable CXR（床邊）**
- 術後縱膈腔稍寬（手術後正常）
- 雙側肺野清晰，無明顯 pulmonary edema
- 氣管位居中線
- Sternotomy wires intact，無明顯 sternal dehiscence
- 雙側肋膈角清晰，無 hemothorax
- ET tube 位置正常，NG tube 尖端於胃
  `,
  ecg_12lead: `Sinus tachycardia, rate 110-130. Normal axis. No ST changes. Low voltage in limb leads (post-sternotomy artifact).`,
};

// ============================================================
// Available POCUS
// ============================================================

const availablePOCUS: Record<string, POCUSView> = {
  cardiac: {
    type: "cardiac",
    finding:
      "No significant pericardial effusion（胸管仍 patent 時）。LV function hyperdynamic（代償）。RV 大小正常。無明顯 wall motion abnormality。",
    interpretation:
      "目前無 tamponade 跡象。LV 空虛且高動力 = hypovolemia 的表現。若 CT 突然堵住須立即重複評估。",
  },
  lung: {
    type: "lung",
    finding:
      "雙側 A-lines，無 B-lines，無 pleural effusion。",
    interpretation:
      "無肺水腫，無胸腔積液。目前出血往胸腔的量不足以在超音波看到。",
  },
  ivc: {
    type: "ivc",
    finding:
      "IVC collapsed，直徑 < 1cm，呼吸變異 > 50%。",
    interpretation:
      "嚴重 volume depletion，volume responsive。積極補充 volume 有好處。",
  },
};

// ============================================================
// Physical Exam
// ============================================================

const physicalExam: Record<string, PEFinding> = {
  head_neck: {
    area: "Head & Neck",
    finding:
      "Drowsy but arousable。意識稍降低（hypoperfusion 表現）。皮膚蒼白濕冷。JVD (-)。氣管置中。",
  },
  chest: {
    area: "Chest",
    finding:
      "Sternotomy wound intact，無皮膚感染跡象。敷料稍有血跡滲出（少量）。胸廓起伏對稱。",
  },
  lungs: {
    area: "Lungs",
    finding:
      "雙側呼吸音清晰，無囉音、無 wheezing。Base clear bilaterally。",
  },
  heart: {
    area: "Heart",
    finding:
      "Heart rate regular，心律整齊。S1/S2 clear。無雜音。無 S3/S4 gallop。Heart sounds not muffled。",
  },
  abdomen: {
    area: "Abdomen",
    finding: "Soft, non-tender, non-distended。Bowel sounds present。無腹脹跡象。",
  },
  extremities: {
    area: "Extremities",
    finding:
      "Bilateral weak pedal pulses。四肢冰冷。Cap refill > 3 秒。Temp cool。無明顯水腫（術後第 0 天）。",
  },
  tubes_lines: {
    area: "Tubes & Lines",
    finding:
      "CT dressing dry externally。雙側胸管 patent，可見鮮紅色引流液。Suction set at -20 cmH2O。Right IJ central line in situ, site clean。A-line left radial functional。",
  },
  back: {
    area: "Back",
    finding:
      "Sacrum intact，無壓瘡。Posterior lung fields clear bilaterally。",
  },
};

// ============================================================
// Debrief
// ============================================================

const debrief: DebriefData = {
  correctDiagnosis: "Surgical bleeding requiring re-exploration",

  exampleSBAR: {
    situation: "床3的林先生，65歲男性，CABG x3 POD0。CT output 持續上升至 280cc/hr，BP 95/55 → 85/50，HR 從 90 升至 115。",
    background: "今日 CABG x3，術中順利。術後初期穩定，但過去 2 小時 CT output 逐漸增加。目前已給 Volume 1000cc NS，Hb 從 10.2 降至 8.2。",
    assessment: "高度懷疑術後出血需要 re-exploration。INR 1.3，Fibrinogen 195 偏低。死亡三角風險：低溫 35.8\u00B0C、凝血異常、酸鹼失衡 pH 7.32。",
    recommendation: "建議通知主治醫師評估是否需要緊急 re-exploration。同時繼續輸血糾正貧血和凝血異常，保溫措施加強。",
  },

  keyPoints: [
    "CT output 趨勢比單一時間點更重要：200 → 280 → 320 cc/hr，持續上升 = 外科止血點還在出血。",
    "鮮紅色 + 大量 + 有血塊 = surgical bleeding（vs 暗紅色少量 = coagulopathy）。",
    "CT 突然不出 ≠ 改善。可能是 clot 堵住管路，反而是 tamponade 的前兆。永遠要通 CT。",
    "Parallel processing：resuscitate + 抽血 + 叫人，三件事同時進行，不是做完一件再做下一件。",
    "Re-explore 的最重要指標是：adequate resuscitation 後仍 hemodynamically unstable，而非單純看 cc/hr 數字。",
    "死亡三角（Lethal Triad）：Hypothermia（Temp 35.2）+ Acidosis（BE -5.2）+ Coagulopathy（INR 1.3, Fib 195↓）— 任何兩項共存 = severity 加速惡化，必須同步矯正。",
    "心外特有：ACT > 130 → 考慮 Protamine 追加。術後 heparin 效果未完全消退是出血原因之一。",
    "叫學長的時機：血壓掉 + CT 出血趨勢上升 → 這不是你一個人的決定。越早叫越好，不丟臉。",
  ],

  pitfalls: [
    "只看當下數字（CT 200cc/hr）而不看趨勢，低估了情況的緊急性。",
    "只給 fluid 不輸血：Hb 8.2 → 7.1 的速度告訴你，光給晶體液會造成 dilutional coagulopathy 惡化。",
    "等 lab 回來才開始處置：臨床判斷 + 即時 vitals 足以先開始 resuscitation，不用等結果才動。",
    "忘記 Fibrinogen borderline（195，接近 < 200 的 Cryo 閾值）：Fib 掉到 148 就必須補 Cryo。",
    "沒有追 iCa：輸 ≥ 4U pRBC 後，citrate 螯合 calcium → iCa 下降 → 心肌收縮力下降 → 惡化低血壓。",
    "CT output 突然減少時放鬆警戒：這反而是危險信號，應該立即通 CT + POCUS 評估。",
    "Protamine 推太快：會造成急性低血壓和支氣管痙攣，必須 slow push over 10-15 分鐘。",
  ],

  guidelines: [
    "STS（Society of Thoracic Surgeons）術後出血處置指引：CT output > 400cc/hr × 1hr 或 > 200cc/hr × 2-4hr = 強烈考慮 re-exploration。",
    "Massive Transfusion Protocol（MTP）啟動條件：預估失血 > 1 blood volume（70cc/kg = 5600cc for 80kg）、持續需要 ≥4U pRBC within 1hr、hemodynamically unstable despite resuscitation。",
    "Lethal Triad 管理：warming blanket + blood warmer（預防 hypothermia）、積極 buffer（預防 acidosis 惡化）、Cryo/FFP（維持 Fib > 200, INR < 1.5）。",
    "ACT 正常值 < 130 sec（心外術後）。延長考慮 Protamine 25-50mg IV slow push over 10-15min。",
    "大量輸血 iCa 監測：每 4U pRBC 追一次 iCa。iCa < 1.0 mmol/L → Calcium gluconate 1g IV（peripheral OK）或 Calcium chloride 1g IV（central line only）。",
    "Fibrinogen 閾值：< 200 mg/dL 考慮 Cryo；< 150 mg/dL 強烈建議 Cryo（6-10U）。",
  ],

  whatIf: [
    {
      scenario: "如果你一開始（05:00）就叫學長",
      outcome:
        "學長 07-08 分鐘到，評估後 15 分鐘決定 re-explore。病人只輸了 2U pRBC 就回 OR，出血量控制在 600cc 以內，死亡三角尚未觸發，預後明顯較好。",
      lesson:
        "Escalation timing 是最重要的決策之一。CT output 趨勢上升 + 血壓在掉 = 叫學長的時機，不需要等到血壓掉到 70 才叫。",
    },
    {
      scenario: "如果你沒有輸血，只給 IV fluid（Normal Saline）",
      outcome:
        "Hb 從 8.2 進一步被稀釋到 < 6.5，同時 dilutional coagulopathy 讓 INR → 1.8, Fib → 110。凝血功能惡化加速出血速度。25 分鐘後 Hb < 5，patient goes into hemorrhagic shock，arrest 風險極高。",
      lesson:
        "失血不能只補晶體液。出血量大時要早輸血，目標 Hb > 8（心外術後）。晶體液稀釋 coag factors，加重出血。",
    },
    {
      scenario: "如果 CT 堵住（isPatent = false）但你沒有通",
      outcome:
        "Chest tube 引流停止，血液在 pericardial space 積聚。20 分鐘內發展為 cardiac tamponade。HR 130、BP 70/40、CVP 急升到 16、Kussmaul's sign 出現。若未即時 POCUS 確認 + 通 CT / 緊急手術，PEA arrest 在 25-30 分鐘內發生。",
      lesson:
        "CT output 突然減少是危險信號，不是好消息。立即：①通（milk/strip）CT、②POCUS 評估 pericardial effusion、③備緊急開胸。",
    },
  ],
};

// ============================================================
// Guideline Bundles
// ============================================================

const guidelineBundles: GuidelineBundle[] = [
  {
    id: "sts-reexplore",
    name: "STS/EACTS Re-exploration Criteria for Post-Cardiac Surgery Bleeding",
    shortName: "STS Re-exploration Criteria",
    source: "Colson PH, et al. Post cardiac surgery bleeding: Management algorithm. J Cardiothorac Vasc Anesth. 2020;34(7):1923-1935. & EACTS/EACTA Guidelines on Patient Blood Management. Eur J Cardiothorac Surg. 2017;53:79-97.",
    items: [
      {
        id: "sts-labs",
        description: "Obtain CBC + coagulation panel (PT/INR, aPTT, fibrinogen, platelet count)",
        actionIds: ["act-cbc-stat", "act-coag-panel"],
        timeWindow: 10,
        evidenceLevel: "Class I, Level B",
        rationale: "Rapid assessment of coagulation status is essential to differentiate surgical bleeding from coagulopathy. Fibrinogen <1.5 g/L and platelet count <100K are transfusion triggers.",
      },
      {
        id: "sts-type-screen",
        description: "Type & screen / crossmatch blood products",
        actionIds: ["act-type-screen"],
        timeWindow: 10,
        evidenceLevel: "Best practice statement",
        rationale: "Ensuring blood product availability is critical in actively bleeding post-cardiac surgery patients.",
      },
      {
        id: "sts-volume",
        description: "Initiate volume resuscitation (crystalloid + blood products as indicated)",
        actionIds: ["act-volume-resuscitation"],
        timeWindow: 10,
        evidenceLevel: "Class I, Level B",
        rationale: "Goal-directed resuscitation to maintain hemodynamic stability. Target Hb >7-8 g/dL, platelet >100K, fibrinogen >1.5g/L.",
      },
      {
        id: "sts-act",
        description: "Check ACT for residual heparin effect, give protamine if prolonged",
        actionIds: ["act-act", "act-protamine"],
        timeWindow: 15,
        evidenceLevel: "Class I, Level B",
        rationale: "Incomplete heparin reversal post-CPB is a common cause of medical bleeding. ACT >130s suggests residual heparin requiring protamine.",
      },
      {
        id: "sts-escalation",
        description: "Notify attending surgeon — consider re-exploration if CT output >200mL/hr for 2hrs or >400mL in first hour",
        actionIds: ["act-call-senior"],
        timeWindow: 15,
        evidenceLevel: "Class I, Level C",
        rationale: "Delayed re-exploration (>12hrs) is associated with increased mortality, prolonged ICU stay, and higher transfusion requirements. The decision to re-explore should not be delayed.",
      },
    ],
  },
];

// ============================================================
// Scenario Export
// ============================================================

export const postopBleeding: SimScenario = {
  id: "pro-postop-bleeding-01",
  title: "術後出血",
  subtitle: "CABG POD#0 — 凌晨的呼叫",
  hiddenTitle: "術後急變 Case A",
  hiddenSubtitle: "CABG POD#0 — 凌晨的呼叫",
  difficulty: "intermediate",
  duration: "30min",
  tags: [
    "cardiac-surgery",
    "post-op",
    "hemorrhage",
    "chest-tube",
    "transfusion",
    "re-exploration",
    "lethal-triad",
    "escalation",
  ],
  relevantTags: ["cardiac", "bleeding", "hemostatic", "transfusion", "sedation", "general"],

  patient: {
    age: 65,
    sex: "M",
    bed: "Bed 3",
    weight: 80,
    surgery: "CABG × 3 (LIMA-LAD, SVG-RCA, SVG-OM)",
    postOpDay: "POD#0（術後當晚）",
    history: "HTN, DM type 2, CKD stage 3 (baseline Cr 1.4-1.6)；無已知藥物過敏",
    allergies: [],
    keyMeds: [
      "Aspirin 100mg QD (hold post-op)",
      "Insulin drip (target glucose 140-180)",
      "Cefazolin 2g IV Q8H × 24hr (prophylaxis)",
      "Heparin 5000U SC Q8H (DVT prophylaxis，暫 hold)",
      "Morphine 2mg IV PRN (pain)",
      "Levophed 0.02 mcg/kg/min (titrate for MAP > 65)",
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
    inspPressure: 15,
    psLevel: 10,
    ieRatio: '1:2',
  },

  initialLabs: {
    // 術後回 ICU 時的 baseline labs（不需 order 即可查）
    hb_baseline:  10.5,
    inr_baseline: 1.1,
    cr_baseline:  1.6,
    k_baseline:   4.0,
    glucose:      155,
    note: "以上為術後即時 labs（回 ICU 時已抽）。新的 lab 需要另外 order。",
  },

  pathology: "surgical_bleeding",
  isPostSternotomy: true,
  startHour: 2, // 02:00 AM

  nurseProfile: {
    name: "林姐",
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

  outcomes: [
    {
      condition: "survived_good",
      emoji: "🌟",
      title: "病人穩定轉回 ICU",
      narrative:
        "學長到場後聽完你的 SBAR 報告，迅速評估 CT output 趨勢和 vitals。他決定帶病人回 OR 進行 re-exploration。手術中發現一條 IMA branch 在出血，電燒止血後引流量明顯下降。病人輸了 4U pRBC + 2U FFP，術後穩定轉回 ICU。你的及時處置和清楚的交班，讓整個團隊能在黃金時間內做出正確決策。",
    },
    {
      condition: "survived_poor",
      emoji: "⚠️",
      title: "病人存活，但過程驚險",
      narrative:
        "學長到場時，病人已經進入死亡三角的早期階段 — 體溫偏低、凝血功能惡化。由於部分關鍵處置延遲，病人在等待期間多失了將近 800cc 的血。學長緊急帶回 OR，手術比預期困難，最終勉強止血成功。病人術後需要延長加護病房住院，但最終存活。這次經驗提醒我們：每多等一分鐘，出血就多一分風險。",
    },
    {
      condition: "died",
      emoji: "💀",
      title: "病人因失血性休克過世",
      narrative:
        "儘管團隊全力搶救，持續的出血加上死亡三角的惡性循環，病人最終因為不可逆的血流動力學衰竭而過世。累計失血量超過一個血液體積。每一次這樣的經歷都是沉重的。讓我們回顧整個過程，找出可以更早介入的時間點。",
    },
  ],
};

export default postopBleeding;
