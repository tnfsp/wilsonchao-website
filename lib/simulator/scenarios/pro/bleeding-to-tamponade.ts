// lib/simulator/scenarios/pro/bleeding-to-tamponade.ts
// ICU 值班模擬器 Pro — 合併情境：術後出血 → 心包填塞
// 病人：65M, CABG x3, POD#0, Bed 3（同 postop-bleeding: 林伯伯）
// 難度：Advanced | 時長：30min | 開始：02:00 AM
//
// Phase 1 (0-18 min): Surgical bleeding — CT output 持續上升
// Phase 2 (20-33 min): Cardiac tamponade — CT 被 clot 堵住，血液積在心包腔

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
// Initial State (same as postop-bleeding Phase 1 start)
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
// Event Conditions
// ============================================================

// Phase 1: severity > 70 AND 沒叫學長
const conditionHighSeverityNoSenior: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "severity",         op: ">",    value: 70 },
    { field: "action_not_taken", op: "==",   value: "call_senior" },
  ],
};

// Phase 1: 輸血 >= 4U AND 沒追 iCa
const conditionTransfusionNoiCa: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "blood_units_given", op: ">=",  value: 4 },
    { field: "action_not_taken",  op: "==",  value: "order_ica" },
  ],
};

// Phase 1: 第二套 lab — 只有追蹤過 lab 才出現
const conditionSecondLabTracked: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_taken", op: "==", value: "order_cbc" },
  ],
};

// Phase 1: 學長到場（叫過學長才觸發）
const conditionSeniorCalled: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_taken", op: "==", value: "call_senior" },
  ],
};

// Phase 2: 沒有 strip/milk CT 且 CT output 掉下來
const conditionNoStripCTLowOutput: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_not_taken",      op: "==", value: "strip_milk_ct" },
    { field: "chestTube.currentRate", op: "<",  value: 30 },
  ],
};

// Phase 2: 沒做 POCUS 且 CT output < 20
const conditionNoPocusCtLow: EventCondition = {
  operator: "AND",
  conditions: [
    { field: "action_not_taken",      op: "==", value: "cardiac_pocus" },
    { field: "chestTube.currentRate", op: "<",  value: 20 },
  ],
};

// ============================================================
// Scripted Events
// ============================================================

const events: ScriptedEvent[] = [
  // ════════════════════════════════════════════════════════════
  // Phase 1: Surgical Bleeding (0-18 min)
  // ════════════════════════════════════════════════════════════

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
    severityChange: 15,
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
        wbc: { value: 9.8,  unit: "K/\u03BCL",  normal: "4.5-11.0" },
        plt: { value: 128,  unit: "K/\u03BCL",  normal: "150-400",   flag: "L" },
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

  // ── 12:00 ── 如果 severity > 70 且沒叫學長 → 護理師報數字
  {
    id: "evt-12-nurse-report",
    triggerTime: 12,
    triggerCondition: conditionHighSeverityNoSenior,
    type: "nurse_call",
    message:
      "醫師，血壓 {{sbp}}/{{dbp}}，CT 累計 {{ct_total}}cc，這一個小時量一直沒有減少⋯⋯接下來要怎麼處理？",
    chestTubeChanges: {
      currentRate: 320,
      totalOutput: 1100,
    },
    severityChange: 10,
  },

  // ── 15:00 ── 正常推進（無條件）
  {
    id: "evt-15-vitals-progress",
    triggerTime: 15,
    type: "vitals_change",
    chestTubeChanges: {
      currentRate: 310,
      totalOutput: 1150,
    },
    severityChange: 10,
  },

  // ── 學長到場/離開 ──
  // 由 ConsultModal 處理（玩家點「叫學長」→ 排程 senior_arrives event → SeniorDialogModal 彈出）
  // 不用 scripted event，避免學長在沒被叫的情況下自動出現

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
        wbc: { value: 10.2,unit: "K/\u03BCL",  normal: "4.5-11.0" },
        plt: { value: 95,  unit: "K/\u03BCL",  normal: "150-400",   flag: "L" },
        fib: { value: 148, unit: "mg/dL",  normal: "200-400",   flag: "critical" },
      },
    },
  },

  // ── 18:00 ── 輸 >= 4U 血但沒追 iCa → 護理師提醒
  {
    id: "evt-18-ica-reminder",
    triggerTime: 18,
    triggerCondition: conditionTransfusionNoiCa,
    type: "nurse_call",
    message:
      "醫師，輸了不少血了，要不要追一下 ionized calcium？",
  },

  // ════════════════════════════════════════════════════════════
  // Phase 2: Transition & Cardiac Tamponade (19-33 min)
  // ════════════════════════════════════════════════════════════

  // ── 19:00 ── CT output 逐漸下降（靜默）
  {
    id: "evt-19-ct-gradual-decline",
    triggerTime: 19,
    type: "vitals_change",
    chestTubeChanges: {
      currentRate: 120,
      color: "dark_red",
      hasClots: true,
    },
  },

  // ── 20:00 ── PATHOLOGY TRANSITION: surgical_bleeding → cardiac_tamponade
  {
    id: "evt-20-pathology-transition",
    triggerTime: 20,
    type: "vitals_change",
    pathologyChange: "cardiac_tamponade",
    severitySet: 25,
    chestTubeChanges: {
      currentRate: 40,
      hasClots: true,
      isPatent: false,
    },
  },

  // ── 21:00 ── 護理師的「好消息」（誤導）
  {
    id: "evt-21-nurse-mislead",
    triggerTime: 21,
    type: "nurse_call",
    message:
      "醫師，好消息欸，CT 量少了很多，只剩 {{ct_rate}}cc/hr，看起來出血有在止了吧？血壓 {{sbp}}/{{dbp}}，也稍微穩了一下。",
    severityChange: 0,
  },

  // ── 23:00 ── CVP 上升
  {
    id: "evt-23-cvp-rising",
    triggerTime: 23,
    type: "nurse_call",
    message:
      "醫師，跟你報一下，CVP 現在 {{cvp}}，比剛剛高了一些。血壓 {{sbp}}/{{dbp}}。",
    severityChange: 10,
  },

  // ── 25:00 ── CT 幾乎停了
  {
    id: "evt-25-ct-nearly-zero",
    triggerTime: 25,
    type: "nurse_call",
    message:
      "醫師！CT 這幾分鐘幾乎沒東西出來了，只有 {{ct_rate}}cc/hr。血壓 {{sbp}}/{{dbp}}，心跳 {{hr}}。",
    chestTubeChanges: {
      currentRate: 10,
      totalOutput: 1200,
      hasClots: true,
      isPatent: false,
    },
    severityChange: 15,
  },

  // ── 27:00 ── 沒有通 CT → 護理師提醒 strip/milk（條件觸發）
  {
    id: "evt-27-hint-strip",
    triggerTime: 27,
    triggerCondition: conditionNoStripCTLowOutput,
    type: "nurse_call",
    message:
      "醫師，CT 好像不太通的樣子⋯⋯你看要不要先試著 milk 一下 chest tube？有時候是 clot 堵住。",
  },

  // ── 28:00 ── 沒做 POCUS → 護理師提醒（條件觸發）
  {
    id: "evt-28-hint-pocus",
    triggerTime: 28,
    triggerCondition: conditionNoPocusCtLow,
    type: "nurse_call",
    message:
      "醫師，超音波機就在旁邊——你要不要照個心臟看看有沒有積液？",
  },

  // ── 30:00 ── 瀕臨 PEA arrest
  {
    id: "evt-30-pre-arrest",
    triggerTime: 30,
    type: "escalation",
    message:
      "\u26A0\uFE0F 血壓 {{sbp}}/{{dbp}}，心跳 {{hr}}，意識下降。病人呈現 near-PEA 狀態——心臟在跳但幾乎沒有 output。必須立即行動！",
    severityChange: 20,
  },

  // ── 33:00 ── 死亡
  {
    id: "evt-33-death",
    triggerTime: 33,
    type: "escalation",
    message:
      "\u26A0\uFE0F PEA arrest！心跳從 {{hr}} 突然掉 \u2192 asystole。Tamponade 導致心臟完全無法舒張充盈。\u2192 情境結束。",
    severityChange: 100,
  },
];

// ============================================================
// Expected Actions (14 total)
// ============================================================

const expectedActions: ExpectedAction[] = [
  // ── Phase 1: Bleeding (0-18 min) ──

  {
    id: "act-cbc-stat",
    action: "Order CBC stat",
    description: "追蹤 Hb 下降趨勢，作為輸血決策依據",
    deadline: 5,
    critical: true,
    hint: "出血情況下，第一步是量化失血：CBC stat 看 Hb。",
    rationale: "Hb 趨勢是判斷出血速度和輸血時機的核心指標。單次數值不夠，需要 serial follow-up 才能看出 trajectory。術後初始 Hb 可能被 hemodilution 影響，但趨勢下降是確切的出血證據。",
    howTo: "Order CBC stat \u2192 抽完後標記時間。30 分鐘後再追一次 CBC 看趨勢。Hb drop > 1 g/dL/hr 代表活動性出血。Transfusion trigger 一般 Hb < 7（心外可考慮 < 8）。",
    diagnosticCategory: "lab",
  },
  {
    id: "act-coag-panel",
    action: "Order Coagulation panel (PT/INR/aPTT/Fibrinogen)",
    description: "評估是否有 coagulopathy（surgical bleeding vs coagulopathy）",
    deadline: 5,
    critical: true,
    hint: "光補血不夠，要知道有沒有 coagulopathy \u2014 Coag panel 幫你區分。",
    rationale: "心臟外科術後出血有兩種：surgical（需要回 OR）和 coagulopathy（可以用藥矯正）。Coag panel 是區分的關鍵。INR > 1.5、Fibrinogen < 150、Plt < 100 都指向 coagulopathy。不做這個檢查就無法做出正確決策。",
    howTo: "Order PT/INR, aPTT, Fibrinogen, Platelet count。同時考慮 ACT（心外特有）。結果判讀：INR > 1.5 \u2192 FFP；Fibrinogen < 150 \u2192 Cryo；Plt < 100 \u2192 Platelet transfusion。",
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
    hint: "血壓 95，CVP 低，先給 volume \u2014 可以是晶體液或開始輸血。",
    rationale: "低血壓 + 低 CVP = 容積不足。不管最終是要輸血還是回 OR，先穩住血壓維持 organ perfusion 是第一優先。腎臟和大腦對低灌流最敏感，每分鐘的低血壓都在造成 end-organ damage。",
    howTo: "LR 或 NS 500mL bolus（pressure bag），同時備血。如果 Hb 已知偏低 \u2192 直接 O-negative pRBC 先輸再等 crossmatch。目標 MAP > 65。輸完 reassess CVP 和 BP。",
    diagnosticCategory: "treatment",
  },
  {
    id: "act-call-senior",
    action: "通知 Senior / VS",
    description: "持續出血 + 血壓不穩 \u2192 需要 escalate，這不是一個人的決定",
    deadline: 15,
    critical: true,
    hint: "CT output 趨勢持續上升、血壓在掉 \u2014 叫學長不丟臉，叫太晚才丟臉。",
    rationale: "持續出血合併血流動力學不穩定 = 可能需要 re-exploration。這個決定需要 VS 來做。過晚 escalate 是住院醫師最常見的錯誤之一，也是 M&M conference 最常檢討的問題。",
    howTo: "電話通知 Senior/VS：'POD0 CABG，CT output 趨勢上升（目前 Xcc/hr），BP dropping to X/X，已 bolus volume，Hb X \u2192 可能需要 re-exploration'。準備好所有數據讓 VS 快速決策。",
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
    id: "act-protamine",
    action: "考慮 Protamine（逆轉 heparin）",
    description: "ACT 延長或 heparin effect 未消退 \u2192 Protamine 50mg IV slow push",
    deadline: 15,
    critical: false,
    hint: "心外術後標配：ACT > 130，考慮 Protamine 追加。注意要慢慢推，太快會低血壓。",
    rationale: "如果 ACT 延長（> 130 sec），代表 heparin 還有殘留效果。Protamine 是 heparin 的 specific antidote，1mg 中和約 100U heparin。在 surgical bleeding 前先排除 heparin effect 是 systematic approach 的一部分。",
    howTo: "Protamine 25-50mg dilute in 50mL NS，IV slow push over 10 min（太快會造成低血壓和過敏反應）。給完後 15 分鐘再測 ACT。注意：protamine 過量本身也會延長 aPTT。",
  },

  // ── Phase 2: Tamponade (20-33 min) ──

  {
    id: "act-strip-milk-ct-p2",
    action: "Strip/Milk CT（CT output 突降後）",
    description: "Phase 1 出血處理中 CT 突然不出了 \u2192 先排除 clot obstruction：strip/milk 嘗試恢復引流",
    deadline: 25,
    critical: true,
    hint: "CT 從 300cc/hr 掉到 40 再到幾乎零 \u2014 這不是改善！先通 CT，排除 clot 堵住。",
    rationale: "在剛處理完大量出血的情境下，CT output 突然減少最容易被誤認為改善。但出血病人的 CT 突然不出，最可能是 clot obstruction \u2192 血液積在心包腔 \u2192 tamponade。Strip/milk 是零風險的第一步，能立即區分堵塞 vs 真正止血。",
    howTo: "雙手戴手套 \u2192 從 chest tube 近端向遠端依序 strip，再反向 milk。觀察是否有 clot 排出、output 是否恢復。若無恢復 \u2192 高度懷疑 tamponade，立即 POCUS。",
    diagnosticCategory: "pe",
  },
  {
    id: "act-cardiac-pocus-p2",
    action: "Cardiac POCUS（評估 pericardial effusion）",
    description: "CT output 突降 + CVP 升 + BP 降 \u2192 床邊超音波確認是否有心包積液和 RV diastolic collapse",
    deadline: 27,
    critical: true,
    hint: "CVP 升 + BP 降 + CT 不出 = Beck triad 形成中。POCUS 30 秒就可以確認 tamponade。",
    rationale: "Beck triad（低血壓 + JVD + muffled heart sounds）的敏感度不高，POCUS 是床邊確認 tamponade 最快最準的工具。Subxiphoid view 30 秒即可看到 pericardial effusion 和 RV diastolic collapse。延遲診斷 = 延遲治療 = 死亡率上升。",
    howTo: "Subxiphoid view 為首選：探頭放劍突下，朝左肩方向。看 pericardial space 有無積液、RV 是否有 diastolic collapse。如果畫面不佳，改用 parasternal long axis。",
    diagnosticCategory: "pocus",
  },
  {
    id: "act-recall-senior",
    action: "緊急再叫學長回來",
    description: "Phase 1 學長離開聯絡 OR 後，Phase 2 情況急轉直下 \u2192 需要緊急把學長叫回來",
    deadline: 28,
    critical: true,
    hint: "學長剛離開去聯絡 OR，但情況變了 \u2014 從出血變成 tamponade。馬上叫他回來！",
    rationale: "Phase 1 的出血處理讓學長離開去聯絡 OR，但此時 pathology 已轉變為 tamponade。這不再是「等 OR 排到」的情況，而是需要 emergent re-sternotomy \u2014 可能要在 bedside 進行。住院醫師必須意識到情況質變，重新 escalate。",
    howTo: "直接打學長手機：'學長，剛剛出血的林伯伯，CT 突然完全不出了，CVP 急升到 XX，POCUS 看到 large pericardial effusion \u2014 我覺得變成 tamponade 了！你可以馬上回來嗎？'",
    diagnosticCategory: "consult",
  },
  {
    id: "act-volume-challenge-p2",
    action: "Volume challenge（Crystalloid 500mL rapid infusion）",
    description: "暫時提高前負荷，維持血壓等待 definitive treatment",
    deadline: 27,
    critical: true,
    hint: "Tamponade 時心臟充盈受限。給 volume 可以暫時提高 preload 維持 CO，爭取時間。",
    rationale: "Tamponade 時心臟被外壓限制充盈，但提高靜脈回流壓可部分克服 \u2192 暫時維持 cardiac output。這是 bridging therapy，爭取手術準備時間。SSC 和 EACTS guideline 都建議 volume loading 作為 tamponade 的暫時處置。",
    howTo: "Crystalloid（LR 或 NS）500mL bolus，用 pressure bag 快速灌注。給完後評估 BP/CVP 反應。可重複一次，但若無反應不要繼續灌 \u2192 改用 vasopressor bridge。",
    diagnosticCategory: "treatment",
  },
  {
    id: "act-prepare-resternotomy",
    action: "準備 emergent re-sternotomy",
    description: "通知 OR、備血、準備開胸器械",
    deadline: 30,
    critical: true,
    hint: "Tamponade 的 definitive treatment 是解除壓迫。備好：開胸器械、pRBC、外科團隊。",
    rationale: "Re-sternotomy 是 cardiac tamponade 的 definitive treatment。準備工作需要時間（通知 OR、備血、開胸器械），越早開始準備越能縮短 door-to-incision time。在極端情況下，bedside re-sternotomy 可能是唯一選項。",
    howTo: "三件事同步進行：(1) 通知 OR team + 麻醉科準備 emergent case (2) 備血：pRBC 4U + FFP 4U + Plt 1 dose (3) 床邊準備開胸器械包（sternal wire cutter、retractor）。",
    diagnosticCategory: "treatment",
  },
  {
    id: "act-abg-lactate-p2",
    action: "Order ABG / Lactate（Phase 2）",
    description: "Phase 2 低心輸出狀態下，追蹤組織灌流和酸鹼狀態",
    deadline: 28,
    critical: false,
    hint: "Lactate 和 base deficit 告訴你灌流夠不夠。Tamponade 的低心輸出 \u2192 會有 lactic acidosis。",
    rationale: "Phase 1 出血後可能已有 lactic acidosis，進入 Phase 2 tamponade 後低心輸出會進一步惡化。追蹤 lactate 趨勢可以客觀評估情況惡化速度和手術急迫性。",
    howTo: "從 arterial line 抽 ABG（如果有的話），或做 venous blood gas + lactate。重點看 pH、base deficit、lactate。Lactate > 4 mmol/L 代表嚴重組織低灌流。",
    diagnosticCategory: "lab",
  },
  {
    id: "act-vent-fio2",
    action: "調整 FiO\u2082",
    description: "Hb 下降 + 低心輸出 \u2192 攜氧能力降低 \u2192 適度提高 FiO\u2082 維持氧合",
    deadline: 30,
    critical: false,
    hint: "Hb 掉 + CO 掉 \u2192 DO\u2082 嚴重不足。提高 FiO\u2082 可以暫時補償，但注意 PEEP 不要調高（tamponade 會更差）。",
    rationale: "DO\u2082 = CO \u00D7 (Hb \u00D7 1.34 \u00D7 SaO\u2082)。Phase 1 出血導致 Hb 下降，Phase 2 tamponade 導致 CO 下降 \u2014 雙重打擊讓氧氣輸送嚴重不足。提高 FiO\u2082 是暫時性措施。注意 PEEP 不要調太高，tamponade 時高 PEEP 會進一步降低靜脈回流。",
    howTo: "FiO\u2082 調至 0.8-1.0 作為 bridge。PEEP 維持或降低（\u2264 5 cmH\u2082O）。同時加速準備 re-sternotomy。SpO\u2082 穩定後逐步 wean。",
  },
];

// ============================================================
// Available Labs (same as postop-bleeding)
// ============================================================

const availableLabs: Record<string, LabPanel> = {
  cbc: {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    turnaroundTime: 8,
    results: {
      hb:  { value: 8.2,  unit: "g/dL",  normal: "13.5-17.5", flag: "L" },
      wbc: { value: 9.8,  unit: "K/\u03BCL",  normal: "4.5-11.0" },
      plt: { value: 128,  unit: "K/\u03BCL",  normal: "150-400",   flag: "L" },
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
      cr:  { value: 1.6, unit: "mg/dL", normal: "0.6-1.2", flag: "H" },
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
      alpha:   { value: 58,   unit: "\u00B0",   normal: "53-72" },
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
      crossmatch: { value: "Compatible \u2014 4U pRBC reserved", unit: "", normal: "" },
    },
  },
};

// ============================================================
// Available Imaging (Phase 1 defaults — normal post-op)
// ============================================================

const availableImaging: Record<string, string> = {
  cxr_portable: `
**Portable CXR\uFF08\u5E8A\u908A\uFF09**
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
// Available POCUS (Phase 1 defaults — no effusion)
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
// Physical Exam (Phase 1 defaults — bleeding presentation)
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
      "CT dressing dry externally。雙側胸管 patent，可見鮮紅色引流液。Suction set at -20 cmH\u2082O。Right IJ central line in situ, site clean。A-line left radial functional。",
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
  correctDiagnosis: "Cardiac tamponade \u2014 hidden tamponade following surgical bleeding with CT clot obstruction",

  exampleSBAR: {
    situation: "床3的林先生，65歲男性，CABG x3 POD0。一開始 CT output 持續上升至 320cc/hr，BP 掉到 85/50。處理出血過程中，CT output 突然從 300 降到近乎零。CVP 從 7 升到 18，BP 持續惡化。",
    background: "今日 CABG x3，術後初期穩定。Phase 1 出血：CT 持續出鮮紅色有血塊，Hb 從 10.5 降至 7.1，已輸 pRBC + FFP。Phase 2 轉變：約第 20 分鐘 CT 突然不出，strip/milk 發現 clot obstruction，POCUS 顯示 large pericardial effusion with RV diastolic collapse。",
    assessment: "判斷為出血後續發的 cardiac tamponade。血液凝塊堵塞 CT \u2192 無法引流 \u2192 心包積血壓迫心臟。目前 Beck triad 形成中：低血壓、CVP 上升、心音變悶。已給 volume challenge 暫時維持。",
    recommendation: "建議學長立即回來評估 emergent re-sternotomy。已備血 4U pRBC + 4U FFP、通知 OR、床邊準備開胸器械。這是 time-critical emergency，需要盡快解除心包壓迫。",
  },

  keyPoints: [
    "CT output 突然減少 \u2260 改善！在剛處理完出血的情境下，這個假象最容易騙過你。",
    "出血和 tamponade 可以在同一個病人依序發生 \u2014 這是心外術後最危險的組合之一。",
    "CT output 趨勢比單一時間點更重要：Phase 1 的 200 \u2192 280 \u2192 320 cc/hr 代表 surgical bleeding；Phase 2 的 300 \u2192 40 \u2192 0 代表 clot obstruction。",
    "鮮紅色 + 大量 + 有血塊 = surgical bleeding（Phase 1）；CT 突停 + CVP 升 + BP 降 = tamponade（Phase 2）。",
    "Beck triad：hypotension + JVD（high CVP）+ muffled heart sounds \u2014 敏感度不到 50%，但三者並存高度提示 tamponade。",
    "Cardiac POCUS 是最快的確診工具：large pericardial effusion + RV diastolic collapse = tamponade 確診。30 秒。",
    "Phase 2 的處置順序：\u2460 Strip/milk CT（嘗試恢復引流）\u2192 \u2461 失敗 \u2192 POCUS 確認 \u2192 \u2462 叫學長回來 \u2192 \u2463 Volume challenge 暫時維持 \u2192 \u2464 準備 emergent re-sternotomy。",
    "Parallel processing：resuscitate + 抽血 + 叫人，三件事同時進行，不是做完一件再做下一件。",
    "死亡三角（Lethal Triad）：Hypothermia + Acidosis + Coagulopathy \u2014 在 Phase 1 出血就已開始形成，進入 Phase 2 會加速惡化。",
    "叫學長和「再叫學長回來」是兩個不同的決策 \u2014 情況質變時必須重新 escalate。",
    "術後 cardiac tamponade 的 definitive treatment 是 re-sternotomy（而非一般的 pericardiocentesis），因為是凝血塊壓迫。",
  ],

  pitfalls: [
    "CT output 突然減少就放鬆警戒：「出血變少了」\u2192 錯誤！在剛動過心臟手術且大量出血的病人，CT 突然不出才是最危險的。",
    "只看當下數字而不看趨勢，低估了情況的緊急性。CT 200 \u2192 320 \u2192 40 \u2192 0 的軌跡是「出血到堵住」。",
    "Phase 1 只給 fluid 不輸血：Hb 8.2 \u2192 7.1 的速度告訴你，光給晶體液會造成 dilutional coagulopathy 惡化。",
    "等 lab 回來才開始處置：臨床判斷 + 即時 vitals 足以先開始 resuscitation，不用等結果才動。",
    "沒有嘗試 strip/milk CT：Phase 2 第一步也是最快的介入。如果 clot 可以被通開，可能立即恢復引流。",
    "只看 CVP 數字不看趨勢：CVP 從 7 \u2192 12 \u2192 17 \u2192 20 的「趨勢」比任何單一數字更有意義。",
    "完全信任護理師的「好消息」：經驗再豐富的護理師也可能把 CT 減少誤判為改善。獨立思考是醫師的責任。",
    "Phase 1 叫了學長就覺得安全：學長離開聯絡 OR 後，新的 emergency 發生了 \u2014 你需要再叫他回來。",
    "用 pericardiocentesis 代替 re-sternotomy：術後 tamponade 通常是凝血塊（不是液態積液），needle 抽不到。需要手術清除。",
    "忘記 Fibrinogen borderline（195，接近 < 200 的 Cryo 閾值）：Fib 掉到 148 就必須補 Cryo。",
    "沒有追 iCa：輸 \u2265 4U pRBC 後，citrate 螯合 calcium \u2192 iCa 下降 \u2192 心肌收縮力下降 \u2192 Phase 2 tamponade 更嚴重。",
  ],

  guidelines: [
    "STS 術後出血處置指引：CT output > 400cc/hr \u00D7 1hr 或 > 200cc/hr \u00D7 2-4hr = 強烈考慮 re-exploration。",
    "術後 cardiac tamponade 發生率約 1-6%。出血量大的病人 tamponade 風險更高（更多 clot 可堵塞 CT）。",
    "Beck triad 敏感度不到 50%，但特異度高。有 Beck triad = 高度懷疑 tamponade。沒有 \u2260 排除。",
    "STS 指引：術後 CT 突然停止 + hemodynamic instability \u2192 高度懷疑 tamponade \u2192 立即 POCUS + 準備 re-sternotomy。",
    "Massive Transfusion Protocol 啟動條件：預估失血 > 1 blood volume、持續需要 \u2265 4U pRBC within 1hr、hemodynamically unstable despite resuscitation。",
    "Lethal Triad 管理：warming blanket + blood warmer + 積極 buffer + Cryo/FFP（維持 Fib > 200, INR < 1.5）。",
    "ACT 正常值 < 130 sec。延長考慮 Protamine 25-50mg IV slow push over 10-15min。",
    "Volume resuscitation 在 tamponade 時的角色：暫時提高 preload 維持 CO，但效果有限且短暫。不是 definitive treatment。",
    "Emergency re-sternotomy 可在 ICU bedside 進行。需要：無菌開胸器械包、足夠的血品、VS 在場。",
    "大量輸血 iCa 監測：每 4U pRBC 追一次 iCa。iCa < 1.0 mmol/L \u2192 Calcium gluconate 1g IV 或 CaCl\u2082 1g central line。",
  ],

  whatIf: [
    {
      scenario: "如果你在 CT 量減少時（min 21）立即懷疑不對",
      outcome:
        "你在護理師報「好消息」時反而警覺 \u2014 立刻 strip/milk CT，發現 clot obstruction。隨即 POCUS 確認 pericardial effusion，5 分鐘內叫學長回來。學長到場時病人 BP 還維持在 80/50，有足夠時間準備 re-sternotomy。手術清出心包腔 250cc 血塊，病人穩定恢復。",
      lesson:
        "「好消息」可能是最危險的假象。在剛處理完大量出血的情境下，CT 突然減少的第一反應應該是懷疑 clot obstruction，不是慶幸止血了。",
    },
    {
      scenario: "如果你完全相信護理師的「好消息」",
      outcome:
        "你放鬆了 8-10 分鐘。等到 CVP 升到 20、BP 掉到 65/40、心音變悶時才意識到不對。叫學長回來又多花 5 分鐘。最終在 near-PEA 狀態下緊急 bedside re-sternotomy，過程驚險，病人經歷長時間低灌流，術後需要長期 ICU 照護。",
      lesson:
        "護理師的觀察是有價值的線索，但臨床判斷是醫師的責任。CT 的數字要放在整個 trajectory 和 context 中解讀 \u2014 從 300 掉到 40 不正常。",
    },
    {
      scenario: "如果你在 Phase 1 就做了 POCUS",
      outcome:
        "Phase 1 POCUS 顯示無 pericardial effusion、LV hyperdynamic、IVC collapsed \u2014 確認是 hypovolemia + bleeding。但這個 baseline 讓你在 Phase 2 CT 突降時有比較 \u2014 第二次 POCUS 看到大量心包積液，反差讓你立刻確定是 tamponade，反應時間比沒做 baseline 的人快 3-5 分鐘。",
      lesson:
        "POCUS 在 Phase 1 是「排除 tamponade」和「建立 baseline」，在 Phase 2 是「確診 tamponade」。有 baseline 的對比讓你反應更快、更有信心。",
    },
  ],
};

// ============================================================
// Guideline Bundles
// ============================================================

const guidelineBundles: GuidelineBundle[] = [
  // Phase 1: STS Re-exploration Criteria
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
        id: "sts-escalation",
        description: "Notify attending surgeon \u2014 consider re-exploration if CT output >200mL/hr for 2hrs or >400mL in first hour",
        actionIds: ["act-call-senior"],
        timeWindow: 15,
        evidenceLevel: "Class I, Level C",
        rationale: "Delayed re-exploration (>12hrs) is associated with increased mortality, prolonged ICU stay, and higher transfusion requirements. The decision to re-explore should not be delayed.",
      },
    ],
  },

  // Phase 2: EACTS Tamponade Protocol
  {
    id: "eacts-tamponade",
    name: "EACTS Guidelines on Post-Operative Cardiac Tamponade Management",
    shortName: "EACTS Tamponade Protocol",
    source: "Boyle EM, et al. Diagnosis and management of cardiac tamponade after cardiac surgery. Ann Thorac Surg. 2023. & EACTS/EACTA Guidelines on Patient Blood Management 2017.",
    items: [
      {
        id: "eacts-ct-check",
        description: "Assess and troubleshoot chest tube patency (strip/milk if clotted)",
        actionIds: ["act-strip-milk-ct-p2"],
        timeWindow: 5,
        evidenceLevel: "Class I, Level C",
        rationale: "Abrupt cessation of chest tube drainage in the context of hemodynamic deterioration is classic for tamponade from clotted hemothorax/hemopericardium.",
      },
      {
        id: "eacts-pocus",
        description: "Bedside echocardiography / POCUS to confirm pericardial effusion and RV/RA collapse",
        actionIds: ["act-cardiac-pocus-p2"],
        timeWindow: 10,
        evidenceLevel: "Class I, Level B",
        rationale: "Focused cardiac ultrasound is the diagnostic standard for post-surgical tamponade. Look for pericardial fluid, RV diastolic collapse, IVC plethora, and respiratory variation.",
      },
      {
        id: "eacts-volume",
        description: "Volume loading to increase venous return as a temporizing bridge",
        actionIds: ["act-volume-challenge-p2"],
        timeWindow: 10,
        evidenceLevel: "Class IIa, Level C",
        rationale: "Volume loading can partially overcome the impaired filling from external cardiac compression, maintaining cardiac output temporarily while preparing for definitive surgical treatment.",
      },
      {
        id: "eacts-escalation",
        description: "Immediately recall attending surgeon \u2014 prepare for emergent re-sternotomy",
        actionIds: ["act-recall-senior", "act-prepare-resternotomy"],
        timeWindow: 10,
        evidenceLevel: "Class I, Level B",
        rationale: "Post-cardiac surgery tamponade requires emergent surgical evacuation. Every minute of delay increases mortality. Bedside re-sternotomy may be necessary if patient is in extremis.",
      },
    ],
  },
];

// ============================================================
// Scenario Export
// ============================================================

export const bleedingToTamponade: SimScenario = {
  id: "pro-bleeding-to-tamponade-01",
  title: "術後出血 \u2192 心包填塞",
  subtitle: "CABG POD#0 \u2014 出血處理後的致命陷阱",
  hiddenTitle: "術後急變 Case D",
  hiddenSubtitle: "CABG POD#0 \u2014 你能看穿假象嗎？",
  difficulty: "advanced",
  duration: "30min",
  tags: [
    "cardiac-surgery",
    "post-op",
    "hemorrhage",
    "tamponade",
    "chest-tube",
    "pocus",
    "beck-triad",
    "transfusion",
    "re-sternotomy",
    "escalation",
    "time-critical",
    "multi-phase",
  ],
  relevantTags: ["cardiac", "bleeding", "hemostatic", "transfusion", "sedation", "general"],

  patient: {
    age: 65,
    sex: "M",
    bed: "Bed 3",
    weight: 80,
    surgery: "CABG \u00D7 3 (LIMA-LAD, SVG-RCA, SVG-OM)",
    postOpDay: "POD#0（術後當晚）",
    history: "HTN, DM type 2, CKD stage 3 (baseline Cr 1.4-1.6)；無已知藥物過敏",
    allergies: [],
    keyMeds: [
      "Aspirin 100mg QD (hold post-op)",
      "Insulin drip (target glucose 140-180)",
      "Cefazolin 2g IV Q8H \u00D7 24hr (prophylaxis)",
      "Heparin 5000U SC Q8H (DVT prophylaxis，暫 hold)",
      "Morphine 2mg IV PRN (pain)",
      "Levophed 0.02 mcg/kg/min (titrate for MAP > 65)",
    ],
  },

  initialVitals,
  initialChestTube,

  initialVentilator: {
    mode: "SIMV",
    fio2: 0.5,
    peep: 5,
    rrSet: 12,
    tvSet: 500,
    inspPressure: 15,
    psLevel: 10,
    ieRatio: "1:2",
  },

  initialLabs: {
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
  guidelineBundles,

  availableLabs,
  availableImaging,
  availablePOCUS,
  physicalExam,

  debrief,

  // ── Multi-phase findings ──
  phasedFindings: {
    surgical_bleeding: {
      // Phase 1 uses scenario defaults (no override needed)
    },
    cardiac_tamponade: {
      availablePOCUS: {
        cardiac: {
          type: "cardiac",
          finding:
            "Large pericardial effusion with circumferential fluid collection。RV diastolic collapse 明顯。'Swinging heart' sign present。RA systolic collapse。",
          interpretation:
            "典型 cardiac tamponade 超音波表現。大量心包積液壓迫右心室，造成 diastolic collapse \u2192 充盈受限 \u2192 cardiac output 下降。需立即解除壓迫。",
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
      },
      physicalExam: {
        head_neck: {
          area: "Head & Neck",
          finding:
            "病人焦躁不安、意識漸混。周邊膚色蒼白。頸靜脈明顯怒張（JVD +）。氣管置中。",
        },
        chest: {
          area: "Chest",
          finding:
            "Sternotomy wound intact。敷料乾淨。胸廓起伏對稱。",
        },
        lungs: {
          area: "Lungs",
          finding:
            "雙側呼吸音清晰，無囉音。",
        },
        heart: {
          area: "Heart",
          finding:
            "Heart sounds distant / muffled。心跳快但規律。S1/S2 diminished。Pulsus paradoxus > 15mmHg（A-line 可測量）。",
        },
        abdomen: {
          area: "Abdomen",
          finding: "Soft, non-tender, non-distended。Bowel sounds present but diminished。",
        },
        extremities: {
          area: "Extremities",
          finding:
            "四肢冰冷、蒼白。Bilateral pedal pulses barely palpable。Cap refill > 4 秒。",
        },
        tubes_lines: {
          area: "Tubes & Lines",
          finding:
            "雙側 CT in situ。Suction at -20 cmH\u2082O。CT 引流管內可見暗紅色 clot 堵塞\u2014\u2014用手擠壓（milk）無法通過。Central line site clean。",
        },
        back: {
          area: "Back",
          finding:
            "Sacrum intact。Posterior lung fields clear。",
        },
      },
      availableImaging: {
        cxr_portable: `
**Portable CXR\uFF08\u5E8A\u908A\uFF09**
- 縱膈腔明顯變寬（較前一張明顯增加）
- Heart silhouette 呈 "water-bottle" shape
- 雙側肺野清晰，無明顯 pulmonary edema
- 氣管位居中線
- Sternotomy wires intact
- Bilateral chest tubes in situ
        `,
        ecg_12lead: `Low voltage QRS. Electrical alternans (alternating QRS amplitude). Sinus tachycardia. No acute ST changes.`,
      },
    },
  },

  // ── Outcomes ──
  outcomes: [
    {
      condition: "survived_good",
      emoji: "\uD83C\uDF1F",
      title: "病人成功搶救",
      narrative:
        "你在 CT output 突降時沒有被「好消息」騙到，立刻 strip/milk CT 並做 POCUS 確認 tamponade。學長被緊急叫回來後，根據你的 SBAR 報告迅速決定 emergent re-sternotomy。手術中發現心包腔 300cc 血塊壓迫右心房，同時找到一條 IMA branch 出血點。清除血塊 + 止血後病人穩定。你在兩個 phase 的關鍵時刻都做出了正確判斷 \u2014 這是高水準的 ICU 值班表現。",
    },
    {
      condition: "survived_poor",
      emoji: "\u26A0\uFE0F",
      title: "病人存活，但差點失去",
      narrative:
        "Phase 2 的 tamponade 診斷延遲了 \u2014 你在 CT 減少時短暫相信了出血改善的假象。等到 CVP 急升、Beck triad 完全形成才意識到不對。學長被叫回來時病人已接近 PEA arrest，在 bedside 緊急做了 subxiphoid pericardiotomy。病人雖然存活，但經歷了一段嚴重的低灌流期。這次經驗的教訓是：在出血病人身上，CT 突然不出是危險信號，不是好消息。",
    },
    {
      condition: "died",
      emoji: "\uD83D\uDC80",
      title: "病人因心包填塞過世",
      narrative:
        "Phase 1 的出血處理消耗了你大部分注意力。當 CT output 突然減少時，你鬆了一口氣。心包腔內的血液持續壓迫心臟，最終導致 PEA arrest。即使進行了 CPR 和緊急開胸，心臟已經在長時間低灌流下受損嚴重，無法恢復有效節律。出血和 tamponade 的雙重打擊 \u2014 這是心外術後最致命的組合。讓我們回顧整個過程，找出 Phase 2 可以更早辨識的線索。",
    },
  ],
};

export default bleedingToTamponade;
