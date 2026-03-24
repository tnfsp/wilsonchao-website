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

  // ── 15:00 ── 如果沒叫學長 → 護理師主動建議（條件觸發）
  {
    id: "evt-15-nurse-suggest-senior",
    triggerTime: 15,
    triggerCondition: conditionHighSeverityNoSenior,
    type: "nurse_call",
    message:
      "醫師，血壓掉到 {{sbp}} 了，CT 累計快到 {{ct_total}}cc，量一直沒有減少。我覺得⋯要不要通知 VS？",
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

  // ── 20:00 ── 學長到場
  {
    id: "evt-20-senior-arrives",
    triggerTime: 20,
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

  // ── 25:00 ── 決定 re-explore → debrief 開始
  {
    id: "evt-25-reexplore",
    triggerTime: 25,
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
  },
  {
    id: "act-coag-panel",
    action: "Order Coagulation panel (PT/INR/aPTT/Fibrinogen)",
    description: "評估是否有 coagulopathy（surgical bleeding vs coagulopathy）",
    deadline: 5,
    critical: true,
    hint: "光補血不夠，要知道有沒有 coagulopathy — Coag panel 幫你區分。",
  },
  {
    id: "act-type-screen",
    action: "Type & Screen / Crossmatch",
    description: "提前備血，避免大量輸血時沒有血品",
    deadline: 10,
    critical: true,
    hint: "備血越早越好，配血需要時間。",
  },
  {
    id: "act-volume-resuscitation",
    action: "Volume resuscitation (IV fluid 或 blood)",
    description: "血壓掉了要先穩住灌流",
    deadline: 10,
    critical: true,
    hint: "血壓 95，CVP 低，先給 volume — 可以是晶體液或開始輸血。",
  },
  {
    id: "act-call-senior",
    action: "通知 Senior / VS",
    description: "持續出血 + 血壓不穩 → 需要 escalate，這不是一個人的決定",
    deadline: 20,
    critical: true,
    hint: "CT output 趨勢持續上升、血壓在掉 — 叫學長不丟臉，叫太晚才丟臉。",
  },
  {
    id: "act-abg-lactate",
    action: "Order ABG / Lactate",
    description: "評估組織灌流是否足夠（lactate、base deficit）",
    deadline: 10,
    critical: false,
    hint: "知道血壓低還不夠，ABG + Lactate 告訴你灌流夠不夠、dead space 多不多。",
  },
  {
    id: "act-act",
    action: "Order ACT",
    description: "評估術後 heparin 殘留 — 心臟外科特有教學點",
    deadline: 15,
    critical: false,
    hint: "心臟外科術中用 heparin，ACT 可以告訴你還有多少殘留，是否需要 protamine 追加。",
  },
  {
    id: "act-cardiac-pocus",
    action: "Cardiac POCUS（排除 tamponade）",
    description: "有無 pericardial effusion？CT 是否 patent？",
    deadline: 15,
    critical: false,
    hint: "Cardiac POCUS 可以在床邊快速排除 tamponade — 尤其 CT output 突然減少時。",
  },
  {
    id: "act-protamine",
    action: "考慮 Protamine（逆轉 heparin）",
    description: "ACT 延長或 heparin effect 未消退 → Protamine 50mg IV slow push",
    deadline: 15,
    critical: false,
    hint: "心外術後標配：ACT > 130，考慮 Protamine 追加。注意要慢慢推，太快會低血壓。",
  },
  {
    id: "act-ica-monitoring",
    action: "iCa monitoring（輸血 ≥4U 後）",
    description: "大量輸血後，citrate 螯合 calcium → ionized Ca 下降 → 心肌收縮力變差",
    deadline: 999, // after 4U blood, no strict deadline
    critical: false,
    hint: "每輸 4U blood 追一次 iCa，< 1.0 mmol/L 需要補 Calcium gluconate。",
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
  general: {
    area: "General",
    finding:
      "Drowsy but arousable。意識稍降低（hypoperfusion 表現）。四肢冰冷，皮膚蒼白濕冷。",
  },
  chest: {
    area: "Chest / Respiratory",
    finding:
      "雙側呼吸音清晰，無囉音。Sternotomy wound intact，無皮膚感染跡象。敷料稍有血跡滲出（少量）。",
  },
  heart: {
    area: "Cardiovascular",
    finding:
      "Heart rate regular，心律整齊。無雜音。無 S3/S4 gallop。Peripheral pulse 微弱。",
  },
  abdomen: {
    area: "Abdomen",
    finding: "Soft, non-tender, non-distended。Bowel sounds present。無腹脹跡象。",
  },
  extremities: {
    area: "Extremities",
    finding:
      "Bilateral weak pedal pulses。四肢冰冷。Cap refill > 3 秒。無明顯水腫（術後第 0 天）。",
  },
  ct_site: {
    area: "Chest Tube Site",
    finding:
      "CT dressing dry externally。雙側胸管 patent，可見鮮紅色引流液。Suction set at -20 cmH2O。",
  },
};

// ============================================================
// Debrief
// ============================================================

const debrief: DebriefData = {
  correctDiagnosis: "Surgical bleeding requiring re-exploration",

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
// Scenario Export
// ============================================================

export const postopBleeding: SimScenario = {
  id: "pro-postop-bleeding-01",
  title: "術後出血",
  subtitle: "CABG POD#0 — 凌晨的呼叫",
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
  startHour: 2, // 02:00 AM

  nurseProfile: {
    name: "林姐",
    experience: "senior",
  },

  events,
  expectedActions,

  availableLabs,
  availableImaging,
  availablePOCUS,
  physicalExam,

  debrief,
};

export default postopBleeding;
