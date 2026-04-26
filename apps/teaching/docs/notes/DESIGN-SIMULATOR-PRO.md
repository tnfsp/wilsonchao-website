# ICU 值班模擬器 Pro — 設計文件 v2

> Wilson 確認的方向 + Opus 審核整合。動手前的藍圖。

---

## 一句話

Clerk 扮演值班住院醫師，在心臟外科 ICU 接電話、開 order、看 lab、處理病人惡化，30 分鐘內跑完一個完整情境。

---

## 核心體驗循環

```
📞 護理師打來
    ↓
🔍 你評估（看 vitals、問病史、查 chart、做 PE/POCUS）
    ↓
📋 你下決策（開 order、開 lab、開藥、輸血、啟動 MTP）
    ↓
⏰ 時間流逝（5-15 分鐘跳轉）
    ↓
📞 等待中插入事件（「學長，病人開始喘了」）
    ↓
📊 結果回來（lab data、vitals 變化）
    ↓
🔁 重複直到穩定或需要 escalate
    ↓
📝 交班（SBAR）
    ↓
📋 Debrief + 評分 + 「如果你當時...」分支展示
```

---

## 畫面 Layout

```
┌─────────────────────────────────────────────────────┐
│ [← 返回]  情境名稱  ⏰ 02:35 AM   I/O: +850/-1200 │
├────────────────────┬────────────────────────────────┤
│                    │                                │
│   VITAL SIGNS      │   對話 + 事件時間線            │
│   ┌──────────┐     │   ┌─ 02:00 護理師 call        │
│   │ HR  108↑ │     │   │  「學長，CT 突然出很多」   │
│   │ BP  92/58│     │   ├─ 02:03 你開了 CBC stat    │
│   │ SpO2  96 │     │   ├─ 02:05 你開了 NS 500 bolus│
│   │ CVP    6 │     │   ├─ 02:10 護理師            │
│   │ Temp 35.8│     │   │  「血壓又掉了...」        │
│   │ A-line:  │     │   └─ ...                      │
│   │  dampened│     │                                │
│   └──────────┘     │                                │
│                    │                                │
│   CHEST TUBE       │                                │
│   ┌──────────┐     │                                │
│   │ 280cc/hr │     │                                │
│   │ 累計850cc│     │                                │
│   │ 鮮紅 有塊│     │                                │
│   │ Patent ✓ │     │                                │
│   └──────────┘     │                                │
│                    │                                │
│   ACTION BAR       ├────────────────────────────────┤
│   [💊開藥] [🩸抽血]│  💬 輸入框                     │
│   [🔬PE]  [🩻影像] │  [跟護理師說話...]  [送出]     │
│   [🫁POCUS][📞叫人]│                                │
│   [🩸輸血] [🚨MTP] │                                │
│   [🔧通CT] [⏸思考] │                                │
│                    │                                │
│   ACTIVE ORDERS    │                                │
│   • Levophed 0.05  │                                │
│   • NS 500 running │                                │
│   • CBC pending... │                                │
│                    │                                │
├────────────────────┴────────────────────────────────┤
│  📋 Lab Results    📊 Vital Trend    📊 I/O Balance │
└─────────────────────────────────────────────────────┘
```

Mobile：上方 vitals + CT panel（可收合）→ 對話區 → 底部 action bar + 輸入。

---

## 模組設計

### 1. 時間引擎 (TimeEngine)

```typescript
interface GameClock {
  currentTime: Date;        // 模擬時間（例如 02:00 AM）
  realStartTime: Date;      // 真實開始時間
  speed: number;            // 時間倍率（預設 1x，等待時自動快轉）
  isPaused: boolean;
}

interface PendingEvent {
  id: string;
  triggerAt: Date;          // 模擬時間的觸發點
  type: "lab_result" | "nurse_call" | "vitals_change" | "escalation";
  triggerCondition?: EventCondition;  // 複合條件觸發
  data: any;
  fired: boolean;
}

interface EventCondition {
  operator: "AND" | "OR";
  conditions: SingleCondition[];
}

interface SingleCondition {
  field: string;           // "severity" | "elapsed_minutes" | "action_taken" | "action_not_taken" | "vitals.hr"
  op: ">" | "<" | "==" | "!=" | "exists" | "not_exists";
  value: number | string | boolean;
}
```

**運作方式：**
- Clerk 開了 CBC stat → 排一個 `lab_result` event 在 30 分鐘後
- 同時排一個 `nurse_call` event 在 10 分鐘後（「學長，病人開始喘了」）
- 畫面顯示時間快轉動畫：「⏰ 10 分鐘後...」
- 護理師事件觸發 → 時間暫停 → 等 clerk 處理
- 處理完 → 繼續快轉到下一個事件

**複合條件範例：**
- 「severity > 70 AND 超過 15 分鐘 AND 還沒叫學長」→ 護理師主動說：「學長，我覺得應該通知 VS 了...」
- 「已輸 ≥ 4U pRBC AND iCa 未追蹤」→ 護理師提醒：「學長，輸了不少血，要不要追一下 iCa？」

**不是 real-time。** 是事件驅動 + 快轉。Clerk 做決策的時候時間停止。

### 2. 病人引擎 (PatientEngine)

```typescript
interface PatientState {
  vitals: VitalSigns;
  pathology: string;          // "surgical_bleeding" | "tamponade" | "lcos" | ...
  severity: number;           // 0-100，越高越危急
  temperature: number;        // 獨立追蹤（死亡三角）
  activeEffects: Effect[];    // 正在生效的藥物/處置
  timeline: TimelineEvent[];  // 所有發生過的事
  ioBalance: IOBalance;       // I/O 即時計算
  chestTube: ChestTubeState;  // CT 詳細狀態
  aLineWaveform: string;      // "normal" | "dampened" | "wide_pp_variation" | "low_amplitude"
}

interface IOBalance {
  totalInput: number;         // mL（IV + blood + oral）
  totalOutput: number;        // mL（CT + UO + NGO）
  netBalance: number;         // input - output
  breakdown: {
    input: { iv: number; blood: number; oral: number };
    output: { chestTube: number; urine: number; ngo: number };
  };
}

interface ChestTubeState {
  currentRate: number;        // cc/hr
  totalOutput: number;        // 累計 cc
  color: "bright_red" | "dark_red" | "serosanguineous" | "serous";
  hasClots: boolean;
  isPatent: boolean;          // false = 堵住（tamponade risk!）
  airLeak: boolean;
}

interface Effect {
  source: string;
  startTime: Date;
  duration: number;           // 分鐘
  vitalChanges: Partial<VitalSigns>;
  temperatureChange?: number; // 冷血品 → 降溫
  isCorrectTreatment: boolean;
}
```

**Vitals 計算：**
```
新 vitals = 基礎 vitals 
          + pathology 影響（severity-dependent）
          + Σ(所有 active effects)
          + temperature 影響（< 35°C → coagulopathy → 更多出血）
          + 隨機噪音（±5%，真實感）
```

**死亡三角追蹤：**
- Hypothermia（< 36°C）+ Acidosis（BE < -6）+ Coagulopathy（INR > 1.5 or Fib < 150）
- 三角中有 2+ 項 → severity 加速上升
- 冷血品輸注 → 體溫下降（除非有 blood warmer）

### 3. Order 系統 (OrderSystem)

**類別：**

| 類別 | 內容 |
|------|------|
| 💊 Medications | Vasopressors, Inotropes, Diuretics, Antibiotics, Steroids, Sedation, Analgesics |
| 🩹 **Hemostatics** ← 新 | Protamine, TXA, Aminocaproic acid, DDAVP, Vitamin K |
| 💧 Fluids | NS, LR, Albumin |
| 🩸 Transfusion | pRBC, FFP, Platelet, Cryoprecipitate（可選單位數）|
| 🚨 **MTP** ← 新 | 啟動大量輸血 protocol（1:1:1 自動送）|
| 💉 **Electrolytes** ← 新 | Calcium gluconate, Calcium chloride, KCl, MgSO4 |
| 🔬 Labs | CBC, BCS, Coag (PT/INR/aPTT/Fib), ABG, Lactate, iCa, ACT, Cardiac markers, Blood culture, TEG/ROTEM |
| 🩻 Imaging | CXR (portable), Echo (bedside) |
| 🫁 POCUS | Cardiac, Lung, IVC |
| 📞 Consult/Call | 叫學長, Consult CV surgeon, Consult 其他科 |
| 📝 Note | On-call note（簡化 SOAP）|
| 🔧 **Procedures** ← 新 | Milk/Strip chest tube, Warming blanket |

**Hemostatics 細節（心外特有）：**
| 藥物 | 預設劑量 | 說明 |
|------|----------|------|
| Protamine | 50 mg IV slow push | Heparin reversal（術後常規追加）|
| Tranexamic acid (TXA) | 1g IV over 10min | Antifibrinolytic |
| Aminocaproic acid | 5g IV then 1g/hr | Antifibrinolytic（替代方案）|
| DDAVP | 0.3 mcg/kg IV | Platelet function enhancement |
| Vitamin K | 10 mg IV | Warfarin reversal |

**Transfusion 細節：**
```
pRBC     — 1U / 2U / 4U（預設 2U）
FFP      — 2U / 4U（預設 2U）
Platelet — 1 dose / 2 dose
Cryo     — 6U / 10U（預設 6U）
```

**MTP 啟動：**
- 獨立按鈕「🚨 啟動 MTP」
- 啟動條件提示：預估失血 > 1 blood volume、持續需要 ≥4U pRBC within 1hr、hemodynamically unstable despite resuscitation
- 啟動後自動以 1:1:1 送血（pRBC : FFP : Plt）
- 評分：該啟動沒啟動 → 扣大分；太早啟動 → 護理師確認「目前看起來還沒到 massive 的程度欸」

**Vasopressor Guard Rails：**
| 藥物 | 起始劑量 | 一般範圍 | 警告閾值 | 拒絕閾值 |
|------|----------|----------|----------|----------|
| Norepinephrine | 0.05 mcg/kg/min | 0.01-0.5 | >0.3 | >1.0 |
| Epinephrine | 0.05 mcg/kg/min | 0.01-0.3 | >0.2 | >0.5 |
| Vasopressin | 0.03 U/min | 0.01-0.04 | >0.04 | >0.06 |
| Dopamine | 5 mcg/kg/min | 2-20 | >15 | >25 |
| Dobutamine | 5 mcg/kg/min | 2.5-20 | >15 | >25 |
| Milrinone | 0.375 mcg/kg/min | 0.125-0.75 | >0.5 | >1.0 |

護理師反應：
- 警告閾值：「學長，這個劑量有點高欸，確定嗎？」（可 override）
- 拒絕閾值：「學長，這個劑量太高了，藥局不會配，要不要重開？」（不可 override）
- Drug interaction：同時開衝突藥物 → 提醒（如 Protamine 推太快 → 低血壓警告）

**Order 送出後：**
- 系統確認：「護理師：收到，馬上準備。」
- 排入時間引擎：Lab 30min、Transfusion 輸注 15min 後效果出現、藥物 5-10min 開始作用、ACT 10min
- CT 類操作（milk/strip）→ 即時結果

### 4. 護理師 AI (NurseAI)

**兩種模式混合：**

a) **腳本式事件**（scenario 定義好的）
  - 固定時間點的 call：「學長，chest tube 又出了 300」
  - 固定時間點的回報：「Lab 結果出來了」
  - 這些不靠 AI，確保劇情穩定

b) **AI 對話**（clerk 主動問 or 開 order 時）
  - Clerk 打字問：「病人現在看起來怎樣？」→ AI 根據當前 vitals + pathology 回答
  - Clerk 開 order → AI 確認 or 質疑
  - 用 Claude Sonnet，便宜又快

c) **自適應提示**（clerk 卡住時）
  - 卡住 3 分鐘沒動作：護理師輕推「學長，要不要先看一下 lab？」
  - 再卡住：更直接「學長，血壓一直在掉欸，要不要考慮補一些 volume？」
  - 第三次：「學長，我覺得可能需要通知 VS 了...」
  - 使用 hint 輕微影響評分（-5/hint），但比卡住好
  - 可在設定中開/關

### 5. 額外 UI 元素

**Vital Signs Trend Graph：**
- 可展開的趨勢圖
- X 軸：模擬時間，Y 軸：HR / BP / CT output
- 每次 vitals 更新加一個點
- 強化教學點「趨勢比單一數字重要」

**I/O Balance：**
- 即時計算 input vs output
- 顯示在頂部：`I/O: +850 / -1200 (Net: -350)`
- 出血情境中 net negative = 失血 > 補充

**A-line Waveform 描述：**
- 文字描述（不畫波形）
- 如：「dampened, low amplitude」→ hypovolemia
- 「wide pulse pressure variation」→ volume responsive

**⏸ 暫停思考：**
- 可選按鈕，跳出 structured prompt
- 「你覺得最可能的問題是什麼？接下來想做什麼？為什麼？」
- 做了可以加分（shows clinical reasoning），不做不扣分

### 6. 評分 + Debrief

```typescript
interface Score {
  // 自動算
  timeToFirstAction: number;      
  correctDiagnosis: boolean;      
  criticalActionsMet: CriticalAction[];   // 精確定義
  harmfulOrders: string[];        
  escalationTiming: "early" | "appropriate" | "late" | "never";
  lethalTriadManaged: boolean;    // 有沒有注意死亡三角
  
  // 交班
  sbar: {
    completeness: number;         // 各項有沒有涵蓋
    prioritization: number;       // 重要的事有沒有先說
    quantitative: boolean;        // 有量化（CT 280cc/hr）vs 模糊（出很多）
    anticipatory: boolean;        // 有沒有說「我已經準備了...」
  };
  
  // Hints
  hintsUsed: number;
  pauseThinkUsed: boolean;       // 用了暫停思考 = 加分
  
  // 整體
  overall: "excellent" | "good" | "needs_improvement";
  keyLessons: string[];
}

interface CriticalAction {
  id: string;
  description: string;
  met: boolean;
  timeToComplete: number | null;  // 幾分鐘完成，null = 沒做
  critical: boolean;              // true = 沒做扣大分
}
```

**術後出血情境 — Critical Actions：**

必做（沒做 = 重大扣分）：
1. ✅ Order CBC stat
2. ✅ Order Coag panel（PT/INR/aPTT/Fibrinogen）
3. ✅ Type & Screen / Crossmatch
4. ✅ Volume resuscitation（IV fluid or blood）
5. ✅ 通知 senior（severity 到一定程度時）

加分（有做 = bonus）：
- ABG / Lactate
- ACT（心外特有）
- Cardiac POCUS（排除 tamponade）
- iCa monitoring（大量輸血後）
- 考慮 Protamine / TXA
- 暫停思考

**Debrief 結構：**
1. **Timeline 回顧** — 你做了什麼、什麼時候做的（視覺化）
2. **關鍵決策分析** — 對的（✅）、錯的（❌）、漏的（⚠️）
3. **「如果你當時...」** — 展示 2-3 個分支：
   - 「如果你一開始就叫學長」→ 結果如何
   - 「如果你沒輸血只給 fluid」→ 結果如何
   - 「如果 CT 堵住你沒通」→ tamponade
4. **教學重點**（3 個 take-home）
5. **Guideline 連結**

---

## 情境 Schema

```typescript
interface SimScenario {
  id: string;
  title: string;
  subtitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: "15min" | "30min";
  tags: string[];
  
  patient: {
    age: number;
    sex: "M" | "F";
    bed: string;
    surgery: string;
    postOpDay: string;
    history: string;
    allergies: string[];
    weight: number;           // kg（藥物劑量計算用）
  };
  
  initialVitals: VitalSigns;
  initialChestTube: ChestTubeState;
  initialTemperature: number;
  initialLabs: Record<string, any>;
  pathology: string;
  
  events: ScriptedEvent[];
  expectedActions: ExpectedAction[];
  
  availableLabs: Record<string, LabResult>;
  availableImaging: Record<string, ImagingResult>;
  availablePOCUS: Record<string, POCUSResult>;
  physicalExam: Record<string, string>;
  
  // 護理師個性
  nurseProfile: {
    name: string;
    experience: "senior" | "junior";  // 資深會主動提醒，菜鳥只報數字
  };
  
  debrief: {
    correctDiagnosis: string;
    keyPoints: string[];
    pitfalls: string[];
    guidelines: string[];
    whatIf: WhatIfBranch[];   // 「如果你當時...」
  };
}

interface ScriptedEvent {
  triggerTime: number;
  triggerCondition?: EventCondition;
  type: "nurse_call" | "vitals_change" | "new_symptom" | "chest_tube_change";
  message?: string;
  vitalChanges?: Partial<VitalSigns>;
  chestTubeChanges?: Partial<ChestTubeState>;
  temperatureChange?: number;
  severityChange?: number;
}

interface WhatIfBranch {
  scenario: string;           // 「如果你一開始就叫學長」
  outcome: string;            // 結果描述
  lesson: string;             // 教學點
}
```

---

## 第一個情境：術後出血

**故事線：**

```
00:00  護理師（資深，林姐）call：
       「學長，bed 3 的 chest tube 突然出很多，血壓有點在掉。」
       Vitals: HR 98, BP 105/62, SpO2 97, CVP 7, Temp 35.8
       CT: 200cc/hr, 鮮紅色, patent, 無 air leak
       累計: 200cc（剛收 1 小時）
       A-line: mildly dampened
       I/O: +1500 / -450
       
       → Critical: 看 vitals、開 CBC/Coag stat、Type & Screen

05:00  CT output 持續增加
       Vitals: HR 108, BP 95/55, CVP 5, Temp 35.5
       CT: 280cc/hr, 鮮紅色有血塊
       累計: 480cc
       護理師：「血壓又掉了一點，chest tube 出的是鮮紅色的，有看到一些血塊。」
       
       → Critical: Volume resuscitation、考慮叫學長
       → Bonus: 考慮 Protamine / ACT

10:00  Lab 回來：
       Hb 8.2 (from 10.5), INR 1.3, aPTT 38, Fib 195, Plt 128k
       ACT 145 (if ordered)
       ABG: pH 7.32, BE -5.2, Lactate 3.1 (if ordered)
       iCa: 1.05 (if ordered)
       
       → Critical: Order pRBC（至少 2U）
       → Bonus: 分析 surgical vs coagulopathy、考慮 Cryo（Fib borderline）
       → Bonus: ACT 145 → 考慮 Protamine 追加

15:00  （如果還沒叫學長）
       Vitals: HR 118, BP 85/48, CVP 4, Temp 35.2
       CT: 320cc/hr, 累計 1100cc
       護理師：「學長，血壓掉到 85 了，這個量⋯我覺得要不要通知 VS？」
       
       → Critical: 立即 call senior
       → 教學：如果 CT 突然沒出 → 可能堵住 → tamponade risk
       → 教學：死亡三角 — Temp 35.2 + Lactate ↑ + INR 可能在惡化

18:00  第二套 Lab（如果有追蹤）：
       Hb 7.1, Fib 148, Plt 95k
       → Fib < 150 → 應該給 Cryo
       → 如果已輸 ≥4U pRBC 且沒追 iCa → 護理師提醒

20:00  （叫了學長後）學長來了：「跟我報告一下。」
       → SBAR 交班
       
25:00  學長決定回 OR re-explore
       → Debrief 開始

教學重點：
1. CT output 趨勢比單一數字重要
2. 鮮紅色 + 量大 + 有血塊 → surgical bleeding
3. CT 突然沒出 ≠ 改善，可能堵住（tamponade）
4. Parallel processing — 同時 resuscitate + 抽血 + 通知
5. Re-explore criteria 不只看數字 — hemodynamic instability despite resuscitation
6. 死亡三角：hypothermia + acidosis + coagulopathy
7. 心外特有：Protamine、ACT、MTP
8. 叫學長不丟臉，叫太晚才丟臉

「如果你當時...」：
- 一開始就叫學長 → 學長 5 分鐘到，15 分鐘就決定回 OR，少輸 4U 血
- 沒輸血只給 fluid → Hb 繼續掉，dilutional coagulopathy 惡化，25 分鐘後 arrest
- CT 堵住沒通 → output 假性減少，20 分鐘後 tamponade → PEA arrest
```

---

## 技術架構

```
/teaching/simulator/
├── [id]/
│   ├── ModeSelector.tsx         → 模式選擇（教師/自學/Pro）
│   └── pro/
│       └── page.tsx             → Pro 模式入口
│
components/simulator/
├── CasePlayer.tsx               → 教師模式（現有）
├── SelfStudyPlayer.tsx          → 自學模式（現有）
├── VitalsPanel.tsx              → 共用 vitals 顯示
├── pro/
│   ├── ProGameLayout.tsx        → 主 layout（左右分欄）
│   ├── ChestTubePanel.tsx       → CT 詳細狀態
│   ├── ChatTimeline.tsx         → 對話 + 事件時間線
│   ├── ActionBar.tsx            → 底部動作列（含 MTP、通 CT、暫停思考）
│   ├── ActiveOrders.tsx         → 進行中的 order
│   ├── OrderModal.tsx           → 開藥（含 Hemostatics + Transfusion + MTP）
│   ├── LabOrderModal.tsx        → 開 lab（含 ACT、iCa、TEG）
│   ├── LabResultPanel.tsx       → Lab 結果展示
│   ├── PEModal.tsx              → 理學檢查
│   ├── POCUSModal.tsx           → POCUS（Cardiac / Lung / IVC）
│   ├── VitalTrendGraph.tsx      → 趨勢圖
│   ├── IOBalancePanel.tsx       → I/O balance
│   ├── SBARModal.tsx            → SBAR 交班
│   ├── DebriefPanel.tsx         → 評分 + 回顧 + What-if
│   └── PauseThinkModal.tsx      → 暫停思考
│
lib/simulator/
├── types.ts                     → 所有型別
├── engine/
│   ├── time-engine.ts           → 時間 + 事件排程
│   ├── patient-engine.ts        → 病人狀態 + vitals 計算 + 死亡三角
│   ├── order-engine.ts          → Order 驗證 + guard rail
│   └── score-engine.ts          → 評分 + debrief 生成
├── scenarios/
│   ├── index.ts
│   ├── bleeding-vs-tamponade.ts → 教師模式用
│   └── pro/
│       └── postop-bleeding.ts   → Pro 第一情境
└── store.ts                     → zustand store
```

---

## 不做的事（scope out）

- ❌ 多床同時
- ❌ 真實 HIS 介面模擬
- ❌ 帳號 / 存檔 / 排行榜
- ❌ 粉絲 Lite 版（之後再做）
- ❌ 自動產生情境（手寫，確保醫學正確）
- ❌ 真正的波形圖（A-line 用文字描述）

---

## 開發順序

1. **型別系統** — types.ts 全部定好
2. **Engine 三件套** — time-engine + patient-engine + order-engine
3. **zustand store** — 串接 engine
4. **ProGameLayout + VitalsPanel + ChestTubePanel** — 主畫面骨架
5. **ChatTimeline + ActionBar** — 互動核心
6. **OrderModal**（含 Hemostatics + Transfusion + MTP + Guard Rails + Electrolytes）
7. **LabOrderModal + LabResultPanel**（含 ACT、iCa、TEG）
8. **PE / POCUS modal**
9. **VitalTrendGraph + IOBalancePanel**
10. **護理師 AI 對話 + 自適應提示**
11. **SBARModal** — 交班
12. **DebriefPanel + ScoreEngine** — 評分 + What-if
13. **PauseThinkModal**
14. **第一個情境完整資料：postop-bleeding.ts**
15. **整合測試 + deploy**

---

*v2 — 整合 Opus 審核建議。Wilson 確認後動手。*
