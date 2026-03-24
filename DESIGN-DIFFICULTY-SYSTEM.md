# ICU 模擬器 — 三級難度系統 SPEC

> 2026-03-24 | Status: Reviewed by Opus → Patched → 開工中

---

## 現況

### ✅ 已完成（Phase 1-5）
- BioGears C++ engine (port 8770) + WSS tunnel
- 3 Pro scenarios: Postop Bleeding, Cardiac Tamponade, Septic Shock
- 36 medications + guardRail + drug interactions
- Ventilator OrderModal (read-only panel + OrderModal 🫁 tab)
- Score engine: guideline bundles (SSC 2026, STS, pericardiocentesis)
- Debrief: diagnostic accuracy + guideline compliance
- Phase 5 infra: hint system (3/session), chest tube milking, ACLS defibrillator, medication filter
- Scenario-aware death messages + nurse refactor (numbers only, no escalation)
- hiddenTitle 系統（遊戲中不爆雷）

### 📁 Key Paths
- **Repo**: `/Users/zhaoyixiang/Project/_brand/new_website`
- **Live**: `wilsonchao.com/teaching/simulator`
- **Engine**: `lib/simulator/` (~8k LOC)
- **Pro UI**: `components/simulator/pro/`
- **Scenarios**: `lib/simulator/scenarios/pro/*.ts`

---

## 問題

Pro 模式是 R/Fellow 等級，太難。Clerk 不會玩，一般人更看不懂。
但心臟外科 ICU 模擬器本身很有教學和品牌價值 → 需要分級。

---

## 三級架構

| 級別 | 目標用戶 | 一句話描述 | 路由 |
|------|----------|-----------|------|
| **Lite** | 一般民眾、IG 粉絲 | 5 分鐘互動故事，選擇影響結局 | `/teaching/simulator/[id]/lite` |
| **Standard** | Clerk / PGY | 簡化版遊戲引擎，有教學引導 | `/teaching/simulator/[id]/standard` |
| **Pro** | R / Fellow | 現有版本，不改 | `/teaching/simulator/[id]/pro` |

### 入口 UX：身份選擇（不叫「難度選擇」）

```
你是誰？

[👥 我是一般民眾]     → Lite（互動故事）
[🩺 我是醫學生]       → Standard（教學模式）
[⚔️ 我是住院醫師/Fellow] → Pro（實戰模式）
```

路由：`/teaching/simulator/[id]` → DifficultySelect 頁 → 導向對應路由

---

## Lite 模式（互動故事）

### 概念
- **視覺小說風格**：故事自動推進，到決策點暫停
- **15-25 beats**，**3-5 個選擇點**
- **隱藏分數** → 決定 3 種結局
- **5 分鐘**可玩完
- **不需醫學知識**，用常識就能選

### 結局
| 結局 | 條件 | 情緒 |
|------|------|------|
| 🌟 英雄結局 | 所有選擇正確 | 「你的直覺救了病人一命」|
| 📚 學到一課 | 部分正確 | 「雖然有波折，但最終穩定了」|
| 😰 驚險結局 | 多數錯誤 | 「團隊合作最終穩定了狀況——ICU 永遠是團隊作戰」|

### Disclaimer（開場）
> 「本模擬僅供教育體驗，不構成醫療建議。真實 ICU 情境遠比此複雜。」

### End Screen（3-in-1 轉換漏斗）
1. **分享卡** — OG image 自動生成，一鍵分享 IG Story
2. **Email 訂閱** — 用現有 `SubscribeForm` + `/api/subscribe`（source=`simulator-lite`）
3. **CTA** — 「一個心外值班醫師要同時處理數十種變數，想體驗看看嗎？→ Standard」

### 結尾 Guideline 呈現（定性，不用百分比）
- 🌟：「你的直覺和現行醫學指引高度一致！但在真正的 ICU，醫師還需要考慮更多細節。」
- 📚：「你做了幾個好選擇！想知道醫師在這種情況下會怎麼決定嗎？→ Standard」
- 😰：「ICU 的決策真的很不容易。看看專業醫師的思考過程 → Standard」

### 技術
- **新 UI**：`components/simulator/lite/LiteGameLayout.tsx`（StoryReader）
- **資料**：從 Pro scenario 自動衍生 60% + 手寫 40% 故事敘述
- **不用 game engine**，純 state machine（beats + choices + score）

---

## Standard 模式（教學版）

### 概念
- **同一個 game engine**，但簡化操作 + 加教學輔助
- 護理師是「教學助理」，會主動引導
- 時間壓力降低（0.5x）
- 不會死 — vitals 到 threshold 自動穩定

### 與 Pro 差異

| 維度 | Standard | Pro |
|------|----------|-----|
| 操作 | Preset 藥物組合，一鍵下單 | 完整 OrderModal，自選劑量 |
| 護理師 | 主動引導 + idle/錯誤提示 | 只報數字 |
| Vitals 顯示 | 顏色標示（綠/黃/紅）+ 正常值 | 純數字 |
| 時間 | 0.75x 速度 | 1x |
| 死亡 | 延遲死亡（60s 搶救窗口）| 會死 |
| 評分 | 簡單 checklist（✅/❌）| 完整 guideline compliance |
| Hint | 無限 | 3 次 |

### 護理師引導 Trigger（7 種）
| 情境 | 護理師反應 |
|------|-----------|
| Idle 30s | 「學長，要不要先...」+ 建議按鈕 pulse |
| 做錯 | 「學長，這個劑量是不是...」+ 解釋 |
| 漏掉關鍵 | 「學長，我覺得 XX 好像也需要注意...」|
| Vitals 臨界 | 「學長！XX 掉很快！」+ highlight 對應動作 |
| Phase 轉換 | 「目前狀況穩了，接下來可能要考慮...」|
| **重複下單** | 「學長，這個剛剛已經給過了耶，要再追加嗎？」|
| **劑量離譜** | 「學長，這個劑量我再確認一下喔...」+ 顯示正常劑量範圍 |

### 延遲死亡 + 搶救窗口（取代原「不死」設計）
- Vitals 到 critical threshold → 觸發 **60 秒搶救視窗**
- 畫面：紅色脈衝閃爍 + 護理師大喊「學長！」
- 60s 內做對關鍵動作 → vitals 穩住
- 60s 沒做或做錯 → 死亡
- 保留 urgency 教學價值，同時比 Pro 寬容

### 技術
- **共用 engine**：`lib/simulator/engine/*`
- **新 UI**：`components/simulator/standard/StandardGameLayout.tsx`
- **Overlay JSON**：每個 scenario 多一個 `standard.json`，覆蓋 Pro 的部分設定
- **共用 ~40% Pro 的 component code**

---

## 資料架構：Overlay System

### 原則
**Single Source of Truth = Pro scenario**。Standard/Lite 不重寫整個 scenario，用 overlay 覆蓋。

```
lib/simulator/scenarios/
├── pro/
│   ├── postop-bleeding.ts        ← 唯一 canonical source
│   ├── cardiac-tamponade.ts
│   └── septic-shock.ts
├── standard/
│   ├── postop-bleeding.standard.ts  ← overlay（簡化事件、加引導）
│   ├── cardiac-tamponade.standard.ts
│   └── septic-shock.standard.ts
└── lite/
    ├── postop-bleeding.lite.ts      ← story beats（60% auto-derive + 40% 手寫）
    ├── cardiac-tamponade.lite.ts
    └── septic-shock.lite.ts
```

### Standard Overlay 結構
```typescript
interface StandardOverlay {
  // 覆蓋 nurse messages（加引導語）
  eventOverrides: Record<string, Partial<ScriptedEvent>>;
  // 簡化 medication 選項（preset combos）
  presetOrders: PresetOrder[];
  // 引導步驟
  guidanceSteps: GuidanceStep[];
  // 時間倍率
  timeScale: number; // 0.75
  // 搶救窗口 threshold（到此觸發 60s rescue window）
  rescueThreshold: { sbp: number; hr: number; spo2: number };
  rescueWindowSeconds: number; // 60
}
```

### Lite Story 結構
```typescript
interface LiteScenario {
  id: string;
  title: string;
  beats: StoryBeat[];      // 15-25 個
  choices: StoryChoice[];   // 3-5 個
  endings: StoryEnding[];   // 3 種
  shareCard: { template: string; dynamicFields: string[] };
}

interface StoryBeat {
  id: string;
  type: "narration" | "dialogue" | "choice" | "vital_change" | "reveal";
  speaker?: "narrator" | "nurse" | "patient" | "senior";
  text: string;
  duration?: number; // auto-advance 秒數
}

interface StoryChoice {
  id: string;
  prompt: string;
  options: { text: string; score: number; feedback: string }[];
}
```

---

## 路由架構

```
/teaching/simulator                    → ScenarioList（所有可選情境）
/teaching/simulator/[id]               → DifficultySelect（身份選擇）
/teaching/simulator/[id]/lite          → LiteGameLayout
/teaching/simulator/[id]/standard      → StandardGameLayout
/teaching/simulator/[id]/pro           → ProGameLayout（現有）
```

### Store 改動
```typescript
// store.ts 新增
difficulty: "lite" | "standard" | "pro";
setDifficulty(d: DifficultyLevel): void;
```

---

## 建造順序

### Phase 0：基礎架構（1 week）
- [ ] 路由重構：建 DifficultySelect 頁 + `/standard` `/lite` 路由
- [ ] Store 新增 `difficulty` field
- [ ] Types 新增 `DifficultyLevel`, `StandardOverlay`, `LiteScenario`
- [ ] Landing page 改版（顯示三級模式的說明卡）

### Phase 1：Standard 模式（2 weeks）← 最高 ROI
- [ ] StandardGameLayout.tsx（簡化 ActionBar + color-coded vitals）
- [ ] 護理師引導系統（GuidanceEngine + 5 種 trigger）
- [ ] Preset order 系統（一鍵下單，不用自選劑量）
- [ ] 不死機制（stabilize at threshold）
- [ ] 簡化評分 checklist
- [ ] 第一個 Standard overlay：`postop-bleeding.standard.ts`
- [ ] 第二、三：tamponade + septic shock

### Phase 2：Lite 模式（2 weeks）← 品牌漏斗
- [ ] LiteGameLayout.tsx（StoryReader UI）
- [ ] Story beat engine（state machine）
- [ ] 第一個 Lite scenario：`postop-bleeding.lite.ts`
- [ ] End screen：share card + email capture + CTA
- [ ] OG image 動態生成
- [ ] 第二、三 Lite scenario

### Phase 3：Polish + 更多 Scenario
- [ ] 音效系統
- [ ] Standard/Lite 的 Debrief 美化
- [ ] Tier 2 scenarios（Acute AF, CHB, ACLS Megacode...）
- [ ] Analytics（哪些人在哪一步放棄）

---

## 關鍵決策

| 決策 | 選項 | 結論 | 理由 |
|------|------|------|------|
| 先做哪個 | Standard vs Lite | **Standard** | 教學價值最高，overlay 架構驗證 |
| 資料結構 | 三份獨立 vs overlay | **Overlay** | 維護成本低，Pro 改了自動帶動 |
| 死亡機制 | 不死 vs 延遲死亡 | **延遲死亡（60s 搶救窗口）** | 保留 urgency + 比 Pro 寬容 |
| 時間 | 即時 vs 0.75x | **0.75x** | 給思考時間但不失節奏 |
| Email | 新服務 vs 現有 | **現有 /api/subscribe** | 已驗證可用，source 參數區分 |

---

## Guideline 整合（跨難度）

### 現況（已完成）
- ✅ `GuidelineBundle` type + `evaluateGuidelineBundles()` in score-engine
- ✅ 三個 Pro scenario 都有 bundle（SSC 2026, STS/EACTS, Pericardiocentesis）
- ✅ Debrief UI：compliance % + progress bar + item status（✅/⚠️/❌）+ evidence level + source link
- ✅ SSC 2026 更新完成（MAP age-specific, qSOFA downgrade, peripheral vasopressor, beta-lactam infusion）

### 各難度 Guideline 呈現

| 維度 | Lite | Standard | Pro |
|------|------|----------|-----|
| 遊戲中 | 不顯示 | 選擇後即時回饋「根據 SSC 2026...」| 不顯示（自己判斷）|
| 結尾 | 定性描述（見 Lite End Screen 段落）| Checklist（✅/❌）+ guideline 原文摘要 | 完整 bundle breakdown + compliance % + 引用 |
| 教學深度 | 科普等級 | 教科書等級 | 實戰等級（知道 guideline 但要臨場判斷）|

### 待做
- [ ] Standard debrief：簡化版 guideline checklist（不需 evidence level，只需 ✅/❌ + 一句話解釋）
- [ ] Standard 遊戲中：選擇後 inline feedback 引用 guideline（例如「SSC 2026 建議 1 小時內給抗生素 ✅」）
- [ ] Lite end screen：定性 guideline 描述（不用百分比）
- [ ] 新 scenario 的 guideline bundle（隨 Tier 2 scenario 逐一建立）

---

## 完整待辦清單（ALL — 按優先序）

---

### 🔴 P0 — Bug / 必修（立即）

| # | 項目 | 狀態 | 備註 |
|---|------|------|------|
| 1 | 護理師對話重複 bug（02:00/02:01） | ✅ 已修 | |
| 2 | 系統訊息外洩（debug text in timeline） | ✅ 已修 | |
| 3 | 標題爆雷（左上角顯示診斷） | ✅ 已修 | hiddenTitle |
| 4 | 護理師台詞直接給答案（cardiac tamponade CT+CVP 同句） | ✅ 已修 | 拆成 5min/7min 兩段 |
| 5 | **手機版 Vitals 不可見** | ❌ 未修 | 需 Mini Vitals Bar 固定 Header |
| 6 | **缺乏 Onboarding / Tutorial** | ❌ 未修 | 3-5 步互動式 overlay，首次自動觸發 |

### 🟠 P1 — UX 改善（重要）

| # | 項目 | 狀態 | 備註 |
|---|------|------|------|
| 7 | PE Modal 手機版 finding 不可見 | ❌ 未修 | 改上下堆疊 accordion |
| 8 | Vital 異常標示太小（6px 紅點） | ❌ 未修 | 整個 tile 半透明紅 + 脈衝 |
| 9 | Ventilator 預設展開佔空間 | ❌ 未修 | 預設收合，只顯示摘要行 |
| 10 | I/O Balance 手機版截斷 | ❌ 未修 | 只顯示 net balance |
| 11 | SBAR placeholder 太像真實輸入 | ❌ 未修 | 加「✍️ 請自行填寫」標記 |
| 12 | Debrief 紅色 ✗ 無解釋 | ❌ 未修 | 展開按鈕 + 正確做法 + 臨床依據 |

### 🔴 Phase 0 — 難度系統基礎架構（1 week）

- [ ] 路由重構：DifficultySelect 頁 `/teaching/simulator/[id]`
- [ ] 新路由：`/[id]/standard`、`/[id]/lite`
- [ ] Store 新增 `difficulty` field + `setDifficulty()`
- [ ] Types 新增 `DifficultyLevel`, `StandardOverlay`, `LiteScenario`
- [ ] Landing page 改版（三級模式身份選擇卡）

### 🟡 Phase 1 — Standard 教學模式（2 weeks）

- [ ] `StandardGameLayout.tsx`（簡化 UI）
- [ ] 護理師引導系統 `GuidanceEngine`（5 種 trigger：idle / 做錯 / 漏掉 / vitals 臨界 / phase 轉換）
- [ ] Preset order 系統（一鍵下單，不用自選劑量）
- [ ] 不死機制（stabilize at threshold）
- [ ] Color-coded vitals（綠/黃/紅 + 正常值顯示）
- [ ] 0.5x 時間速度
- [ ] 簡化 checklist 評分 + guideline inline feedback
- [ ] Standard overlay × 3 scenarios

### 🟢 Phase 2 — Lite 互動故事（2 weeks）

- [ ] `LiteGameLayout.tsx`（StoryReader UI）
- [ ] Story beat engine（state machine）
- [ ] 3 個 Lite scenarios（auto-derive 60% + 手寫 40%）
- [ ] End screen：share card + email capture（source=`simulator-lite`）+ CTA
- [ ] OG image 動態生成

### 🔵 Phase 3 — 擴充 + 打磨（ongoing）

**UX 加分項（P2）：**
- [ ] 波形細節（dicrotic notch）+ 數值跳動效果
- [ ] 進度追蹤（localStorage 儲存完成狀態）
- [ ] 快轉 toast 反饋（「⏩ 已快轉至 02:10 AM」）
- [ ] Disabled 按鈕 tooltip（「CT 目前通暢，無需處理」）
- [ ] 隱藏網站主 nav bar（遊戲中只保留遊戲 header）
- [ ] What-If 按鈕（debrief 跳到時間點重玩）
- [ ] 音效系統（Web Audio API, < 50KB）

**新 Scenarios：**

| Tier | Scenarios | 狀態 |
|------|-----------|------|
| Tier 2 值班 | Acute AF, CHB, ACLS Megacode, HTN Crisis, PE, Aortic Dissection, ACS, Acute Abdomen, LCOS, Massive Transfusion | ❌ |
| Tier 3 心外 Senior | VA-ECMO, RV Failure, Aortic Dissection Postop | ❌ |
| Basic/Lite | Postop Routine Monitoring, Chest Tube Management, Ventilator Teaching | ❌ |

**其他：**
- [ ] Analytics（哪些人在哪一步放棄、流失率）
- [ ] Standard/Lite debrief 的 guideline 呈現
- [ ] 新 scenario 各自的 GuidelineBundle

### ✅ 已完成

- [x] BioGears C++ engine + WSS tunnel
- [x] 3 Pro scenarios（Postop Bleeding, Cardiac Tamponade, Septic Shock）
- [x] 36 medications + guardRail + drug interactions
- [x] Ventilator OrderModal（read-only panel + OrderModal 🫁 tab）
- [x] Score engine + GuidelineBundle（SSC 2026, STS, Pericardiocentesis）
- [x] Debrief UI（diagnostic accuracy + guideline compliance % + item status）
- [x] Hint system（3/session）
- [x] Chest tube milking（3 cases with clot-burst）
- [x] ACLS defibrillator（120/150/200/360J, sync/async）
- [x] Medication filter by scenario tags
- [x] Scenario-aware death messages
- [x] hiddenTitle（遊戲中不爆雷）
- [x] 護理師台詞拆開（cardiac tamponade — CT/CVP 分開報）
- [x] Type narrowing（PendingEventData discriminated union）
- [x] Diagnostic accuracy panel（6-step checklist + weighted scoring）
- [x] 鍵盤快捷鍵（1-5, Space, F, Esc）
- [x] SSC 2026 guideline 更新（MAP age-specific, qSOFA downgrade, peripheral vasopressor）
- [x] 護理師行為 refactor（numbers only, no escalation suggestions）

---

## 醫學內容審核流程

| 項目 | 審核者 | 時機 |
|------|--------|------|
| 新 Scenario 上線 | Wilson 親自 sign-off | 上線前必審 |
| 藥物劑量 / guardRail | Wilson + 查 UpToDate | 新增藥物時 |
| GuidelineBundle 引用 | Wilson | 建立時 + guideline 更新時 |
| 護理師台詞（Standard 教學語） | Wilson 快速過目 | Phase 1 完成時 |
| Lite 故事敘述 | Wilson 確認醫學正確 + 品牌調性 | Phase 2 完成時 |
| Guideline 年度更新 | Wilson | 每年 1 月（SSC/AHA/STS 更新後）|

**原則**：所有醫學內容最終由 Wilson sign-off。Owl/CC 可以初稿，但不自行上線。

---

## 色盲 / 無障礙

- Color-coded vitals（綠/黃/紅）必須加 icon 或 pattern 輔助，不純靠顏色
  - ✅ 正常 → 綠 + 無 icon
  - ⚠️ 警告 → 黃 + ⚠️ icon + 虛線邊框
  - 🔴 危險 → 紅 + 脈衝動畫 + 實線邊框
- ARIA labels on all interactive elements
- Keyboard navigation 已有（1-5, Space, F, Esc）

---

## Standard Inline Guideline 觸發時機

不是每個 order 都跳（會打斷節奏）。只在：
1. 完成了一個 guideline bundle item → 正向回饋 toast
2. 做了和 guideline 矛盾的動作 → 教學回饋 toast
3. Phase 轉換時 → summary panel

其餘留到 debrief。

---

## 效能注意事項

- DifficultySelect 頁不載入 scenario 資料
- Standard overlay 用 `dynamic import`，不 bundle 在一起
- 9 modules（3 scenario × 3 difficulty）全部 lazy load
- BioGears WSS 斷線 → Pro 顯示 graceful fallback（「引擎離線，使用內建模擬」）
- localStorage 進度加版本 hash，scenario 更新後提示重玩

---

## 不做的事

- ❌ 帳號系統 / 登入
- ❌ 排行榜
- ❌ Standard/Lite 的 BioGears 整合（Pro only）
- ❌ AI 對話護理師（Phase 3+ 才考慮）
- ❌ 多語言

---

*Wilson 確認後按 Phase 0 → 1 → 2 開工。*
