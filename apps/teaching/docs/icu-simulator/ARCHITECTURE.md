# ICU Simulator — 系統架構文件

> 最後更新：2026-03-25
> 目的：跨 session 知識延續，避免重複踩坑

---

## 一句話架構

心臟外科 ICU 值班模擬器。玩家扮演住院醫師，接護理師電話、開 order、看 lab、處理病人惡化，結束後 SBAR 交班。三個難度：Lite（5 分鐘互動故事）、Standard（教學版，有引導）、Pro（實戰版，full ICU）。

---

## 系統架構概覽

```
/teaching/simulator
├── page.tsx                        → ScenarioListClient（情境列表）
└── [id]/
    ├── page.tsx                    → DifficultySelect（身份選擇）
    ├── lite/page.tsx               → LiteGameLayout（Coming Soon）
    ├── standard/
    │   ├── page.tsx
    │   └── StandardPageClient.tsx  → 主控端（Standard 模式）
    └── pro/
        ├── page.tsx
        └── ProPageClient.tsx       → 主控端（Pro 模式）

lib/simulator/
├── types.ts                        → 所有共用型別（~600 行）
├── store.ts                        → Zustand store（唯一 state source）
├── useKeyboardShortcuts.ts         → 鍵盤快捷鍵（1-5, Space, F, Esc）
├── engine/
│   ├── patient-engine.ts           → vitals 計算、severity curve、死亡三角
│   ├── urgency-engine.ts           → 閒置觸發護理師催促
│   ├── fog-of-war.ts               → 顯示層雜訊（假警報、hemolysis）
│   ├── score-engine.ts             → Pro 評分系統
│   ├── standard-score-engine.ts    → Standard checklist 評分
│   ├── guidance-engine.ts          → Standard 模式護理師教學引導
│   ├── order-engine.ts             → Order 驗證 + guard rail
│   ├── lab-engine.ts               → Lab 結果處理
│   ├── time-engine.ts              → 時間引擎 + 事件排程
│   ├── rescue-engine.ts            → Standard 模式救援窗口
│   ├── biogears-client.ts          → BioGears WebSocket 客戶端
│   ├── biogears-engine.ts          → BioGears 整合（Pro only）
│   ├── ecg-generator.ts            → ECG 波形合成
│   ├── waveform-synth.ts           → 波形合成（A-line）
│   ├── cxr-selector.ts             → CXR 圖片選擇邏輯
│   ├── state-classifier.ts         → BioGears state → ClinicalState 分類
│   └── nurse-action-types.ts       → 護理師動作型別定義
├── data/
│   ├── medications.ts              → 36 種藥物定義（含 guardRail）
│   ├── labs.ts                     → Lab 面板定義
│   └── transfusions.ts             → 血品定義
└── scenarios/
    ├── index.ts                    → 情境索引（classic + pro）
    ├── bleeding-vs-tamponade.ts    → 教師模式 self-study 情境
    ├── pro/
    │   ├── index.ts
    │   ├── postop-bleeding.ts      → Pro Scenario 1: 術後出血
    │   ├── cardiac-tamponade.ts    → Pro Scenario 2: 心包填塞
    │   └── septic-shock.ts         → Pro Scenario 3: 敗血性休克
    └── standard/
        ├── index.ts
        ├── types.ts                → Standard overlay 專用型別
        ├── postop-bleeding.standard.ts
        ├── cardiac-tamponade.standard.ts
        └── septic-shock.standard.ts

components/simulator/
├── CasePlayer.tsx                  → 教師模式（classic scenarios）
├── SelfStudyPlayer.tsx             → 自學模式
├── VitalsPanel.tsx                 → 共用 vitals 顯示
├── pro/                            → Pro 模式專用 UI（~30 個 components）
└── standard/                       → Standard 模式專用 UI（~12 個 components）

app/api/simulator/
├── chat/route.ts                   → 護理師 AI（Claude API）
└── scenarios/[id]/route.ts         → Scenario 載入 API
```

---

## Engine 設計

### Patient Engine（`patient-engine.ts`）

**職責**：vitals 計算、severity curve、死亡三角追蹤、effect 管理、I/O balance、chest tube。

**核心原則**：純函數，無 React 依賴，所有輸出可測。

**Vitals 計算公式**：
```
newVitals = baselineVitals
          + pathologyModifier(severity)     // 病理對 vitals 的線性影響
          + Σ(activeEffects.vitalChanges)   // 所有藥物 / 處置疊加
          + temperatureModifier             // 低體溫 → 心搏過緩
          + ventilatorModifier              // FiO2/PEEP → SpO2/CVP/EtCO2
          + noise(±5%)                      // 真實感隨機雜訊
```

**Severity Curve**：
- 無治療：每分鐘 +0.25 ~ +0.8（依 pathology）
  - `surgical_bleeding: 0.4/min` | `cardiac_tamponade: 0.7/min` | `tension_pneumothorax: 0.8/min`
- Effect 的 `severityChange` 是**一次性 delta**，攤在 `duration` 分鐘內（非每分鐘）
- 死亡三角 ≥2 → 每分鐘額外 +0.5；3 → 再加 +0.5

**死亡三角（Lethal Triad）**：
```
Hypothermia：temperature < 36°C
Acidosis：   BE < -6
Coagulopathy：INR > 1.5 OR Fib < 150 mg/dL
```
三角中有 2+ 項 → severity 加速惡化。

**A-Line Waveform 推算**（依 pathology + severity + vitals）：
- `normal` / `dampened` / `low_amplitude` / `wide_pp_variation` / `pulsus_alternans`

**支援的 Pathologies（9 種）**：
`surgical_bleeding` | `coagulopathy` | `tamponade` | `cardiac_tamponade` | `lcos` | `vasoplegia` | `tension_pneumothorax` | `postop_af` | `septic_shock`

---

### Urgency Engine（`urgency-engine.ts`）

**職責**：玩家閒置超過 N 分鐘 → 觸發護理師催促。

**運作方式**：
- 輸入：`NurseUrgencyEvent[]`（定義在 scenario overlay），`idleMinutes`
- 每個 event 有 `triggerAfterIdleMinutes`，使用 `firedUrgencyIds` 去重（每場只觸發一次）
- 結果：toFire 的 events → push nurse_message 到 ChatTimeline

---

### Fog of War（`fog-of-war.ts`）

**職責**：讓顯示層的數據不完美，模擬真實 ICU 資訊不可靠性。

**三個 level**：

| Level | SpO₂ 假警報 | A-line dampening | Lab hemolysis |
|-------|------------|-----------------|--------------|
| `none` | 0% | 0 mmHg | 0% |
| `light` | 3% 機率降 5-12% | 無 | 5% K+ 升高 0.5-1.5 |
| `full` | 8% 機率降 5-12% | 12 mmHg（SBP 低估、DBP 高估）| 15% K+ 升高 |

**Standard 模式用 `light`，Pro 模式用 `full`。**

**重要設計**：Engine 內部永遠用 **true vitals**，fog 只在顯示層套用（`ColorVitalsPanel`）。
使用 seeded random（mulberry32），相同 tickSeed 輸出相同 → 避免每 render 閃爍。

---

### Score Engine

#### Pro Score（`score-engine.ts`）
**多維度評分，滿分 100**：

| 維度 | 分數 |
|------|------|
| Critical actions（全做） | 30 pts |
| Bonus actions（全做） | 10 pts |
| SBAR（completeness/prioritization/quantitative/anticipatory） | 20 pts |
| Escalation timing | 15 pts |
| Lethal triad 管理 | 10 pts |
| Correct diagnosis | 5 pts |
| Time to first action（≤3min = full） | 5 pts |
| Hint penalty | -5 pts/hint |
| Pause-think bonus | +10 pts |
| Harmful orders penalty | -5 pts/each |

**Stars**：3⭐ ≥80 / 2⭐ ≥50 / 1⭐ <50（死亡強制 1⭐）

**Guideline Bundle**：場景可定義 `GuidelineBundle[]`，評估各指引的 compliance %。

#### Standard Score（`standard-score-engine.ts`）
**簡化 checklist，基於 `scenario.expectedActions`**：
- `critical` → 沒做 → 不能 3⭐
- `important` → >80% 完成 + all critical → 3⭐
- `bonus` → deadline ≥ 20min 的非 critical actions

⚠️ **已知問題**：`call_senior` 等 non-order critical actions 永遠不會在 checklist 顯示為 completed（scoring gap）。死亡後 stars 計算沒有 `patientDied` 保護。

---

## Component 地圖

### Pro 模式（`components/simulator/pro/`）

| Component | 職責 |
|-----------|------|
| `ProGameLayout.tsx` | 主 layout（左側 vitals + 右側 chat + 底部 action bar） |
| `ProVitalsPanel.tsx` | Pro 版 vitals 顯示（純數字）|
| `WaveformMonitor.tsx` | ECG / A-line 波形顯示 |
| `EcgCanvas.tsx` | ECG 波形渲染 |
| `ChatTimeline.tsx` | 對話 + 事件時間線（Pro / Standard 共用）|
| `MessageInput.tsx` | 自由文字輸入 + AI 護理師確認流程 |
| `ActionBar.tsx` | 主 action bar（藥物、Lab、PE、影像、POCUS、叫人、MTP）|
| `MiniVitalsBar.tsx` | 手機版 sticky header vitals |
| `OrderModal.tsx` | 完整 order 介面（含劑量、guardRail）|
| `LabOrderModal.tsx` | Lab 開單 |
| `LabResultPanel.tsx` | Lab 結果展示 |
| `ActiveOrdersPanel.tsx` | 進行中的 orders |
| `IOBalanceBar.tsx` | I/O 即時顯示 |
| `ChestTubePanel.tsx` | Chest tube 詳細狀態 |
| `VentilatorPanel.tsx` | 呼吸器設定（read-only + OrderModal 設定）|
| `VitalTrendGraph.tsx` | Vitals 趨勢圖 |
| `PEModal.tsx` | 理學檢查 |
| `POCUSModal.tsx` | POCUS（cardiac/lung/IVC）|
| `ImagingModal.tsx` | CXR + Echo 影像 |
| `SBARModal.tsx` | SBAR 交班（Pro / Standard 共用）|
| `DebriefPanel.tsx` | Pro Debrief（完整評分 + What-if）|
| `LabOrderModal.tsx` | Lab 開單（含 ACT, iCa, TEG）|
| `ConsultModal.tsx` | 叫人 / 會診 |
| `DefibrillatorModal.tsx` | ACLS 電擊（120/150/200/360J, sync/async）|
| `DeathScreen.tsx` | 死亡畫面（Pro / Standard 共用）|
| `PauseThinkModal.tsx` | 暫停思考（有用 → +10 pts）|
| `FastForwardToast.tsx` | 快轉時間提示 |
| `TutorialOverlay.tsx` | 首次使用引導 |
| `PocusCanvas.tsx` | POCUS Canvas 渲染 |
| `CxrCanvas.tsx` | CXR 圖片顯示 |

### Standard 模式（`components/simulator/standard/`）

| Component | 職責 |
|-----------|------|
| `StandardGameLayout.tsx` | Desktop（左 vitals + 右 chat）/ Mobile（堆疊）|
| `ColorVitalsPanel.tsx` | 顏色標示 vitals（綠/黃/紅 + trend arrow）|
| `MiniWaveform.tsx` | 簡化 ECG 顯示 |
| `SimplifiedActionBar.tsx` | 7 按鈕（💊處置/🩸檢查/🩺PE/📸影像/📞叫人/📋SBAR/⚡電擊）|
| `PresetOrderPanel.tsx` | 一鍵 preset order（不需自選劑量）|
| `GuidanceBubble.tsx` | 護理師引導提示氣泡 |
| `RescueCountdown.tsx` | 60 秒搶救倒數（紅色脈衝）|
| `StandardGameLayout.tsx` | 主 layout（共用 ChatTimeline）|
| `StandardImagingModal.tsx` | CXR + Echo 影像（含真實圖片 + teaching notes）|
| `StandardPEModal.tsx` | 理學檢查（Standard 版）|
| `StandardDebriefPanel.tsx` | Standard Debrief（checklist + guided review）|
| `DefibrillatorModal.tsx` | 電擊（Standard 版簡化）|

---

## Standard vs Pro Mode 差異

| 維度 | Standard | Pro |
|------|----------|-----|
| **目標用戶** | Clerk / 醫學生 | R / Fellow |
| **Order 方式** | Preset 一鍵組合，不選劑量 | 完整 OrderModal，自選劑量 |
| **護理師** | 教學助理：主動引導、暗示、7 種 trigger | 只報數字，不引導 |
| **Vitals 顯示** | 顏色（綠/黃/紅）+ 正常值 + trend arrow | 純數字 |
| **Fog of War** | `light`：SpO₂ 假警報 3%，K+ hemolysis 5% | `full`：A-line dampening 12mmHg，fake alarm 8% |
| **時間速度** | 0.75x（20s real = 1 game min） | 1x |
| **死亡** | 延遲死亡（60s 搶救窗口）| 直接死 |
| **評分** | Checklist（✅/❌）+ 星級 | 多維度 0-100 + guideline compliance |
| **Hint** | 無限（guidanceSteps 自動觸發）| 最多 3 次（-5 pts/hint）|
| **BioGears** | 不使用（static labs）| 使用（dynamic 或 static fallback）|
| **Debrief** | GuidedReview：rationale + howTo 可展開 | 完整 What-if + guideline bundle |
| **Scenario 資料** | Pro scenario + StandardOverlay | Pro scenario 本體 |

**Overlay 系統**：Standard 以 Pro scenario 為 SSOT，overlay 只覆蓋部分設定（presetOrders、nurseUrgencyEvents、guidanceSteps、timeScale、rescueThreshold）。

---

## 時間引擎架構

- **事件驅動 + 快轉**，不是 real-time
- 玩家做決策時，時間暫停
- 快轉到下一個事件（ScriptedEvent 或 lab result）
- Standard 模式：`useStandardGameTick`，20 秒真實 = 1 遊戲分鐘
- 每 tick 順序：
  1. `advanceTime(1)` → 觸發 PendingEvents
  2. `tickPatient(1)` → `updatePatientState()`（patient-engine）
  3. `evaluateGuidance()` → Standard 護理師引導
  4. `evaluateUrgency()` → 閒置催促
  5. 死亡檢查 → severity ≥ 95 或 vitals 超限

---

## Zustand Store（`store.ts`）

唯一 state source。關鍵 state：
- `phase`：`not_started | playing | sbar | death | debrief`
- `patient`：`PatientState`（vitals, severity, activeEffects, ioBalance, chestTube, lethalTriad）
- `clock`：`GameClock`（currentTime, isPaused, speed）
- `scenario`：`SimScenario`
- `timeline`：`TimelineEntry[]`
- `placedOrders`：`PlacedOrder[]`
- `pendingEvents`：`PendingEvent[]`
- `score`：`GameScore | null`
- `difficulty`：`"lite" | "standard" | "pro"`
- `activeModal`：`ModalType | null`（開 modal 時暫停 tick）

---

## API 端點

| 端點 | 用途 |
|------|------|
| `GET /api/simulator/scenarios/[id]` | 載入 scenario + standard overlay |
| `POST /api/simulator/chat` | 護理師 AI 對話（Claude Sonnet）|

---

## 技術棧

Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Zustand（state management）。
BioGears C++ engine（port 8770）透過 WebSocket 提供動態生理數據（Pro mode）。
Claude API 驅動護理師 AI 對話（`app/api/simulator/chat/route.ts`）。

---

*文件由 Owl 整理，2026-03-25。*
