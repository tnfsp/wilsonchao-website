# ICU Simulator — Roadmap

> 最後更新：2026-03-25
> 來源：DESIGN-DIFFICULTY-SYSTEM.md + 2026-03-25-fix-plan.md + 2026-03-25-standard-walkthrough.md

---

## 目前完成的功能

### ✅ Core Engine（Phase 1-5）

- **Patient Engine**：vitals 計算、severity curve、死亡三角（hypothermia/acidosis/coagulopathy）、A-line waveform 推算、I/O balance、chest tube 管理
- **BioGears C++ 整合**：port 8770 WebSocket，動態生理數據（Pro mode）
- **Fog of War**：SpO₂ 假警報、A-line dampening、Lab hemolysis（light/full level）
- **Time Engine**：事件驅動 + 快轉，支援 `EventCondition`（AND/OR 複合條件）
- **Urgency Engine**：玩家閒置 N 分鐘 → 護理師催促
- **Guidance Engine**：7 種 trigger（idle/wrong_action/missed_action/vitals_critical/phase_start/duplicate_order/dose_error）

### ✅ Pro 模式

- **3 個完整情境**：Postop Bleeding、Cardiac Tamponade、Septic Shock
- **36 種藥物**：含 guardRail、drug interactions、vasopressor guard rails
- **完整 OrderModal**：自選劑量、頻次、護理師確認
- **Hemostatics**：Protamine、TXA、Aminocaproic acid、DDAVP、Vitamin K
- **Transfusion**：pRBC / FFP / Platelet / Cryo，可選單位數
- **MTP**（大量輸血 Protocol）：啟動後 1:1:1 自動送
- **Electrolytes**：Ca gluconate、Ca Cl、KCl、MgSO4
- **Lab OrderModal**：CBC、Coag、ABG、Lactate、iCa、ACT、TEG/ROTEM 等
- **POCUS Modal**：cardiac / lung / IVC（含真實 Echo MP4 影片）
- **CXR Modal**：含真實 CXR 圖片（cardiac tamponade water-bottle sign, pulmonary edema）
- **Ventilator Panel**：FiO2 / PEEP / RR / TV 設定，影響 SpO₂ / CVP / EtCO2
- **Chest Tube Milking**：milk / strip，有 clot-burst 機制
- **ACLS Defibrillator**：120/150/200/360J，sync/async
- **Keyboard shortcuts**：1-5, Space, F, Esc
- **Score Engine**：7 維度評分（100 pts），SBAR 評分，escalation timing 評估
- **Guideline Bundle**：SSC 2026 Hour-1、STS/EACTS、Pericardiocentesis
- **Debrief Panel**：完整分析 + What-if 分支 + guideline compliance %
- **hiddenTitle 系統**：遊戲中不爆雷診斷
- **護理師 AI 對話**（Phase 3 preview）：`/api/simulator/chat`，Claude Sonnet

### ✅ Standard 模式（架構完成）

- **3 個 Standard Overlay**：postop-bleeding、cardiac-tamponade、septic-shock
- **StandardGameLayout**：Desktop 雙欄 / Mobile 堆疊
- **ColorVitalsPanel**：顏色標示（綠/黃/紅）+ trend arrow + 正常值
- **SimplifiedActionBar**：7 個 preset 按鈕
- **PresetOrderPanel**：一鍵 preset order（正確 + 干擾選項）
- **GuidanceBubble**：護理師引導提示
- **RescueCountdown**：60 秒搶救窗口
- **StandardImagingModal**：CXR + Echo，含真實圖片 + teaching notes
- **StandardDebriefPanel**：GuidedReview（rationale + howTo）+ checklist + progress 持久化（localStorage）
- **Standard Score Engine**：checklist-based，stars 1-3
- **Fog of War `light`**：Standard 模式用

### ✅ 其他

- **Diagnostic Accuracy Panel**：6-step checklist + weighted scoring
- **SSC 2026 指引更新**：MAP age-specific、qSOFA downgrade、peripheral vasopressor、beta-lactam infusion
- **護理師台詞拆分**：cardiac tamponade 的 CT/CVP 分開報（不直接洩題）
- **Scenario-aware death messages**：依 pathology 顯示不同死亡原因

---

## 已知問題

> 來源：2026-03-25-fix-plan.md + 2026-03-25-standard-walkthrough.md

### 🔴 P1（需立即修）

| # | 問題 | 檔案 | 工作量 |
|---|------|------|--------|
| Fix-01 | `route.ts` JSON parse 失敗靜默，護理師 AI 所有 actions 消失 | `app/api/simulator/chat/route.ts` | 5 min |
| Fix-03 | `MessageInput.tsx` 的 `definition!` 非空斷言在 AI 幻覺 ID 時 crash | `components/simulator/pro/MessageInput.tsx` | 10 min |

### 🟠 P2（近期修）

| # | 問題 | 檔案 | 工作量 |
|---|------|------|--------|
| Fix-04 | `pendingConfirm` 只支援單一 pending（Claude 回傳 2 個 confirm_order 時第一個被吞）| MessageInput.tsx | 20 min |
| Fix-05 | `isConfirmReply` 匹配過窄（「好的」「沒問題」等不匹配，玩家卡住）| MessageInput.tsx | 10 min |
| Fix-06 | `SimplifiedActionBar` 7 個按鈕在 `grid-cols-4` 視覺不對稱（第二行空白）| SimplifiedActionBar.tsx | 10 min |
| Fix-07 | `lastGuidanceRef` Set 只增不減，同一 guidance trigger 整場只觸發一次（phase 切換後無法重觸發）| StandardPageClient.tsx | 15 min |
| Fix-08 | Scenario wrong preset 用了不存在的 definitionId（warfarin, hold_transfusion 等），penalty 生效但 timeline 無視覺確認 | medications.ts + scenarios | 20 min |

### 🔴 P0 UX（手機版 + Onboarding）

| # | 問題 | 狀態 |
|---|------|------|
| P0-5 | **手機版 Vitals 不可見**（缺 MiniVitalsBar sticky header）| ❌ 未修 |
| P0-6 | **缺乏 Onboarding / Tutorial**（3-5 步互動式 overlay，首次自動觸發）| ❌ 未修 |

### 🟠 P1 UX

| # | 問題 |
|---|------|
| P1-7 | PE Modal 手機版 finding 不可見 |
| P1-8 | Vital 異常標示太小（6px 紅點 → 應整 tile 半透明紅 + 脈衝）|
| P1-9 | Ventilator 預設展開佔空間（應預設收合）|
| P1-10 | I/O Balance 手機版截斷 |
| P1-11 | SBAR placeholder 太像真實輸入 |
| P1-12 | Debrief 紅色 ✗ 無解釋（應展開 + 正確做法 + 臨床依據）|

### ⚠️ 已知設計缺陷（不 crash 但教學有缺）

| 問題 | 位置 |
|------|------|
| `call_senior` 等 non-order critical actions 在 Standard Debrief checklist 永遠 ❌ | StandardDebriefWrapper + standard-score-engine.ts |
| 死亡後 Standard Score 可能顯示高星（無 `patientDied` 保護）| StandardDebriefWrapper |
| `handlePresetOrder` loop 中多 sub-orders 可能有 state race condition | StandardPageClient.tsx |
| 快進 5 分時病人可能「跳過」死亡閾值（一次 tick 5 分鐘）| useStandardGameTick |

---

## 待開發

### 🔴 Phase 0 — 基礎架構（已部分完成）

- [x] DifficultySelect 路由架構（`/[id]/standard`、`/[id]/pro`）
- [x] Store `difficulty` field
- [x] StandardOverlay types
- [ ] Landing page 三級模式身份選擇卡（UI 改版）

### 🟡 Phase 1 — Standard 模式打磨

- [ ] 修完 P0/P1 bug（見上方清單）
- [ ] `call_senior` scoring gap 修復
- [ ] 死亡後 Standard stars 保護（patientDied → max 1⭐）
- [ ] StandardDebriefPanel：CTA 改進（Try Again / Choose Another / Challenge Pro）
- [ ] Standard 模式的 Tutorial Overlay（首次進入自動觸發）
- [ ] Micro Survey 收集（satisfaction 1-5, difficulty）

### 🟢 Phase 2 — Lite 互動故事（一般民眾版）

**目標用戶**：IG 粉絲、一般民眾、醫學院學生

- [ ] `LiteGameLayout.tsx`（視覺小說 StoryReader UI）
- [ ] Story beat state machine（15-25 beats，3-5 個選擇點）
- [ ] 3 個 Lite scenarios（auto-derive 60% + 手寫 40%）
  - `postop-bleeding.lite.ts`
  - `cardiac-tamponade.lite.ts`
  - `septic-shock.lite.ts`
- [ ] 三種結局（🌟英雄 / 📚學到一課 / 😰驚險）
- [ ] End screen：分享卡（OG image 自動生成）+ email capture（source=`simulator-lite`）+ CTA → Standard
- [ ] Disclaimer：「本模擬僅供教育體驗，不構成醫療建議」

**設計原則**（`DESIGN-DIFFICULTY-SYSTEM.md`）：
- 不需醫學知識，用常識就能選
- 5 分鐘可玩完
- 隱藏分數 → 決定結局（不顯示「你選對了」）

### 🔵 Phase 3 — Pro 模式改進

- [ ] **AI 護理師升級**：Claude API 驅動，可回應玩家具體行為（不只腳本 trigger）
- [ ] **Dynamic Labs**：BioGears + derived formulas（Hgb/Hct、INR/Fib/Plt、iCa、ACT、TEG）
  - 詳見 `DESIGN-BIOGEARS-LABS-IMAGING.md` — 公式已設計好，待實作
- [ ] **Dynamic POCUS Canvas**：cardiac（4-chamber 動畫）、IVC（直徑 + collapsibility）、lung（A-lines / B-lines）
- [ ] **ECG 系統**：文字描述 → 靜態 ECG 圖庫 → Canvas 渲染 → Animated strip
- [ ] **Ventilator 教學**：完整 VC/PC/PS/SIMV 設定，weaning failure scenario
- [ ] Wave detail（dicrotic notch）+ 數值跳動效果
- [ ] 進度追蹤（localStorage 儲存完成狀態 + best stars）
- [ ] What-If 跳轉重玩（debrief 中點某個 what-if → 從該時間點重玩）
- [ ] 音效系統（monitor 警報聲、心跳聲，Web Audio API, < 50KB）

### 🟣 Tier 2 Scenarios（新增情境）

| Tier | 情境 | 狀態 |
|------|------|------|
| 2 — 值班住院醫師 | Acute AF post-CABG | ❌ 待建 |
| 2 — 值班住院醫師 | CHB（Complete Heart Block）| ❌ 待建 |
| 2 — 值班住院醫師 | ACLS Megacode（VF/VT → ROSC）| ❌ 待建 |
| 2 — 值班住院醫師 | Hypertensive Crisis | ❌ 待建 |
| 2 — 值班住院醫師 | Pulmonary Embolism | ❌ 待建 |
| 2 — 值班住院醫師 | LCOS（Low Cardiac Output）| ❌ 待建 |
| 2 — 值班住院醫師 | Massive Transfusion Protocol | ❌ 待建 |
| 3 — 心外 Senior | VA-ECMO Management | ❌ 待建 |
| 3 — 心外 Senior | RV Failure post-CABG | ❌ 待建 |
| 3 — 心外 Senior | Aortic Dissection Postop | ❌ 待建 |
| Basic / Lite | Chest Tube Management Teaching | ❌ 待建 |
| Basic / Lite | Ventilator Weaning Teaching | ❌ 待建 |

**新 Scenario 原則**：所有醫學內容必須 Wilson sign-off 才可上線。

---

## 未來考慮

### 拆 Repo（現階段不拆）

**現狀**：ICU Simulator 維持在 `new_website` repo 內（`/teaching/simulator` 路由）。

**不拆的理由**：
- 共用 Next.js 框架、auth、Claude API key
- 拆 repo 的 CI/CD overhead 目前不值得
- Teaching 系統與 Simulator 有深度整合（課程末尾「練習這個主題」CTA）

**將來觸發拆 repo 的條件**：
- Simulator 有獨立付費 / 訂閱功能
- 需要獨立的 staging / production 部署流程
- 情境數量超過 20 個，需要獨立的 content management
- 開放外部機構使用（醫學院採購）

### Analytics（待做）

- 哪些情境玩家最多在哪一步放棄（funnel analysis）
- 護理師哪些 guidance 最常被觸發（→ 課程設計依據）
- Standard vs Pro 的完成率
- 建議工具：Plausible（privacy-friendly）或 GA4

### 一般民眾版特殊考量

- **Disclaimer 更新**：若針對非醫護大眾，需更顯著的「This is a simulation, not medical advice」聲明
- **授權再確認**：LITFL CC-BY-NC-SA 在商業教育環境的適用性
- **語言**：目前全中文，若要國際化需要 i18n 架構

---

## 醫學內容審核流程

| 項目 | 審核者 | 時機 |
|------|--------|------|
| 新 Scenario 上線 | Wilson 親自 sign-off | 上線前必審 |
| 藥物劑量 / guardRail | Wilson + 查 UpToDate | 新增藥物時 |
| GuidelineBundle 引用 | Wilson | 建立時 + guideline 更新時 |
| Guideline 年度更新 | Wilson | 每年 1 月（SSC/AHA/STS 更新後）|
| LITFL 素材授權確認 | Wilson | 網站商業化前 |

---

*Roadmap 由 Owl 整理，2026-03-25。*
