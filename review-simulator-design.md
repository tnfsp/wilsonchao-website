# ICU 值班模擬器 Pro — 設計審核

> Reviewer: 心臟外科主治醫師 + 醫學教育視角
> Date: 2026-03-23
> 審核文件: DESIGN-SIMULATOR-PRO.md
> 參考: 舊版 PRD, cardiogenic-shock-01 scenario, OrdersModal.tsx

---

## 必修（一定要改）

### 1. Transfusion 缺少 Massive Transfusion Protocol（MTP）

**問題**：術後出血情境中，pRBC/FFP/Plt/Cryo 是分開獨立選的，但心臟外科 ICU 真正致命的出血需要啟動 MTP。Clerk 必須學會「什麼時候該呼叫 MTP」，這是 high-yield 教學點。

**修改**：
- 新增一個「🚨 啟動 MTP」的 action button，跟個別輸血分開
- MTP 啟動條件提示：預估失血 > 1 blood volume、持續需要 ≥4U pRBC within 1hr、hemodynamically unstable despite resuscitation
- 啟動 MTP 後自動以 1:1:1 比例送血（pRBC : FFP : Plt）
- 評分：該啟動沒啟動 → 扣大分；太早啟動 → 小扣分但護理師會問「學長確定嗎？目前看起來還沒到 massive 的程度」

### 2. Vasopressor 劑量範圍需要 guard rail

**問題**：設計中 Levophed 預設 0.05 mcg/kg/min 沒問題，但沒有設上限。Clerk 可能開到 0.5 甚至 5（打錯小數點）。舊版 OrdersModal 有 `validateMedication` 但規則不明。

**修改**：每個 vasopressor/inotrope 必須定義：
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

### 3. 術後出血情境的 re-explore criteria 不完整

**問題**：設計寫了「>400cc/1hr, >200cc/hr × 2-4hr」，但這只是通則。心臟外科的判斷更複雜。

**修改**：
- 加入以下 re-explore 考量點（debrief 教學用）：
  - CT output 趨勢（是在加速還是穩定）
  - 血液性質：鮮紅色有血塊 → surgical bleeding 機率高
  - Coagulopathy 矯正後仍在出 → 更指向 surgical site
  - **Hemodynamic instability despite adequate resuscitation** → 最重要的回 OR 指標
  - CT 突然沒出 → 可能 clot 堵住，更危險（tamponade risk）
- 這些應該在 `debrief.keyPoints` 中涵蓋

### 4. 出血情境缺少 Protamine 和 Antifibrinolytic

**問題**：心臟外科術後出血，Protamine（reverse heparin）和 Tranexamic acid（TXA）/ Aminocaproic acid 是最常用的止血藥物，設計完全沒提到。

**修改**：Order 系統的 Medications 必須新增 Hemostatics 類別：
| 藥物 | 預設劑量 | 說明 |
|------|----------|------|
| Protamine | 50 mg IV slow push | Heparin reversal（術後常規追加） |
| Tranexamic acid (TXA) | 1g IV over 10min | Antifibrinolytic |
| Aminocaproic acid | 5g IV then 1g/hr | Antifibrinolytic（替代方案） |
| Desmopressin (DDAVP) | 0.3 mcg/kg IV | Platelet function enhancement |
| Vitamin K | 10 mg IV | Warfarin reversal（少用但要有） |

**評分影響**：出血情境中，沒有考慮 Protamine → 扣分（這是心臟外科特有的教學點）。

### 5. Chest tube 管理細節不足

**問題**：CT output 只顯示 cc/hr，但 clerk 需要學會的是更完整的 CT 管理。

**修改**：
- CT 監控應該顯示：
  - **累積量** vs **每小時量**（例：總量 850cc / 近1小時 280cc）
  - **顏色描述**（鮮紅、暗紅、漿液血性）
  - **有無 air leak**
  - CT 是否 patent（有沒有在出）
- 新增 action：「🔧 Milk/Strip chest tube」（通 CT 管）
- 教學點：CT 突然 output 減少不一定是好事 → 可能堵住 → tamponade

### 6. 評分系統的 `criticalOrdersMissed` 需要更精確的定義

**問題**：設計中說「出血沒 type & screen」會扣分，但沒說清楚什麼是 critical vs nice-to-have。

**修改**：術後出血情境的 critical actions（沒做 = 重大扣分）：
1. ✅ Order CBC stat（追蹤 Hb）
2. ✅ Order Coagulation panel（PT/INR/aPTT/Fibrinogen）
3. ✅ Type & Screen / Crossmatch
4. ✅ 開始 volume resuscitation（至少 IV fluid or blood）
5. ✅ 通知 senior/VS（在 severity 到一定程度時）

Nice-to-have（有加分，沒有不扣分）：
- ABG/Lactate（評估灌流）
- Thromboelastography (TEG) / ROTEM（如果有的話）
- 記錄 CT output trend

---

## 建議（改了更好）

### 1. 加入 Calcium 到 Transfusion 配套

心臟外科大量輸血後，**ionized calcium 會下降**（citrate in stored blood chelates calcium）。低 iCa → 心臟收縮力下降 → 更低血壓。這是常被忽略的教學點。

**建議**：
- 輸超過 4U pRBC 後，護理師提醒：「學長，輸了不少血，要不要追一下 iCa？」
- Labs 加入 ionized calcium
- Medications 加入 Calcium gluconate 1g IV 和 Calcium chloride 1g IV（CaCl₂ through central line only）
- 教學點：每輸 4U blood 追 iCa，< 1.0 mmol/L 需要補

### 2. Fibrinogen 閾值應該更明確

設計中 Lab 有 Fibrinogen 195，但沒有說 clerk 應該怎麼反應。

**建議**：
- Fibrinogen < 200 mg/dL → 考慮 Cryoprecipitate
- Fibrinogen < 150 mg/dL → 強烈建議 Cryoprecipitate
- 評分：Fib 195 → 開 Cryo = bonus（有臨床 sense），沒開 = 不扣分（borderline）
- Fib 如果掉到 < 150（後續 lab） → 沒開 Cryo = 扣分

### 3. 時間引擎應該支援「條件觸發」的複合邏輯

目前 `triggerCondition` 只有 `"severity > 70"` 這種簡單條件。

**建議**：支援複合條件：
```typescript
triggerCondition: {
  operator: "AND" | "OR",
  conditions: [
    { field: "severity", op: ">", value: 70 },
    { field: "elapsed_minutes", op: ">", value: 15 },
    { field: "action_not_taken", value: "call_senior" }
  ]
}
```

例：「severity > 70 AND 超過 15 分鐘 AND 還沒叫學長」→ 護理師主動說：「學長，我覺得應該通知 VS 了。」

### 4. POCUS 在出血情境中的角色應該更突出

**建議**：
- 出血情境的 POCUS findings 應包括：
  - **Cardiac**：看有無 pericardial effusion/tamponade（排除 tamponade 是 critical）
  - **IVC**：Collapsed IVC → hypovolemia confirmed
  - **Lung**：排除 hemothorax（單側 CT 沒出 + 同側 lung ultrasound 有 fluid）
- 沒做 cardiac POCUS → debrief 提醒「應排除 tamponade」

### 5. 護理師 AI 的個性應該更鮮明

**建議**：
- 資深護理師 vs 菜鳥護理師（不同情境不同個性）
- 資深的會主動提醒：「學長，上次類似的 case VS 有叫我們先準備好 protamine」
- 菜鳥的只會報數字，不會主動建議
- 這影響教學效果：clerk 學會不能完全依賴護理師提醒

### 6. 加入 Temperature 監控

心臟外科術後出血的另一個教學重點：**低體溫 → 凝血功能變差 → 出更多血**（lethal triad: hypothermia + acidosis + coagulopathy）。

**建議**：
- 初始體溫 35.8°C（術後常見低體溫）
- 大量輸冷的血品 → 體溫進一步下降
- 護理師：「學長，體溫 35.2 了」
- Order 加入 warming blanket / blood warmer
- 教學點：死亡三角（hypothermia + acidosis + coagulopathy）

### 7. ABG 解讀引導

**建議**：在 debrief 中加入 ABG 解讀教學：
- 術後出血的典型 ABG：metabolic acidosis（lactic acidosis from hypoperfusion）
- Base deficit 是 resuscitation adequacy 的良好指標
- Base deficit > -6 → 需要積極 resuscitation

### 8. 加入「暫停思考」機制

**建議**：在特定時機（如第一個 vitals 惡化事件後），提供一個可選的「⏸ 整理思緒」按鈕：
- 點了會出現 structured prompt：「你現在覺得最可能的問題是什麼？你接下來想做什麼？為什麼？」
- 不強制，但做了可以加分（shows clinical reasoning）
- 這對教學非常有價值：迫使 clerk 在壓力下 organize thoughts

---

## 亮點（做得好的）

### 1. 事件驅動 + 快轉的時間設計 ⭐⭐⭐

「不是 real-time，是事件驅動」— 這是最正確的決定。Real-time 會讓 clerk 無聊等待或壓力過大。事件驅動讓每個決策點都有意義，快轉避免空轉。這比大部分醫學模擬器做得好。

### 2. 護理師 call 作為入口 ⭐⭐⭐

用護理師打電話開場，完美模擬真實值班體驗。這個 framing 讓 clerk 從第一秒就進入角色。比「請閱讀以下病歷」好一百倍。

### 3. SBAR 交班作為結局 ⭐⭐

交班是臨床訓練中最被忽略的環節。讓 clerk 在處理完急性問題後還要報告，這是真實值班的完整循環。很多模擬器只做到「選對答案」就結束了。

### 4. 「不合理 order → 護理師質疑」⭐⭐

這是安全網 + 教學的雙贏設計。真實世界中好的護理師確實會這樣做，clerk 學到的不只是「什麼是對的」，還有「系統如何保護病人」。

### 5. Severity curve 的動態設計 ⭐⭐

「不治療 → severity 上升 → vitals 惡化」的連續性模型比「答對/答錯」的二元判斷好很多。這讓 clerk 感受到「時間在流逝，病人在變差」的壓力，接近真實感。

### 6. 第一個情境選「術後出血」⭐⭐

這是心臟外科 ICU 最 high-yield 的情境：常見、有時間壓力、需要 parallel processing、有明確的 escalation 標準。比 cardiogenic shock 更適合作為第一個情境（更直覺、更 action-oriented）。

### 7. Scope out 清單很理性 ⭐

不做多床同時、不做帳號排行榜、不做自動產生情境 — 每一個 scope out 都是對的。先把一個情境做到極致。

---

## 新增建議（設計沒想到的）

### 1. 🆕 Vital Signs Trend Graph

**提議**：除了即時數字，增加一個可展開的 trend graph。
- X 軸：模擬時間
- Y 軸：HR / BP / CT output
- 每次 vitals 更新時加一個點
- 讓 clerk 看到趨勢而不是只看快照
- 這強化教學點「趨勢比單一數字重要」

### 2. 🆕 Handoff 品質的 AI 評分維度擴充

**提議**：SBAR 評分不只看「有沒有提到」，還要看：
- **優先序**：最重要的事有沒有先說（先講出血量和血壓，而不是先講病史）
- **量化**：「出血很多」vs「CT output 280cc/hr, 近 4 小時累計 850cc, 鮮紅色」
- **anticipatory guidance**：有沒有告訴學長「我已經 type & screen 了，血品在準備中」
- 這些是區分 good 和 excellent 交班的關鍵

### 3. 🆕 Post-game 「如果你當時...」分支展示

**提議**：Debrief 結束後，展示 2-3 個 "what if" 分支：
- 「如果你一開始就叫學長」→ 結果如何
- 「如果你沒有輸血只給 fluid」→ 結果如何
- 「如果你在 15 分鐘時就回 OR」→ 結果如何
- 這對理解因果關係非常有教學價值

### 4. 🆕 I/O Balance 顯示

**提議**：ICU 最重要的監控之一是 I/O balance。
- Input：IV fluid + blood products + 口服
- Output：CT output + urine output + NGO drainage
- Net balance 即時計算
- 在出血情境中，net negative balance = 失血 > 補充 = 需要更積極 resuscitation
- 這是 clerk 最容易忽略但臨床最重要的觀念

### 5. 🆕 ACT (Activated Clotting Time) Lab

**提議**：心臟外科特有的 lab，術後常用來評估 heparin 殘留效果。
- 正常值 < 130 sec
- ACT 延長 → 考慮 Protamine
- 這在一般 ICU 模擬器不會有，但心臟外科 ICU 必備

### 6. 🆕 困難度自適應 Hint 系統

**提議**：如果 clerk 卡住超過 3 分鐘沒有動作：
- 第一次：護理師輕推「學長，要不要先看一下 lab？」
- 第二次：更直接「學長，血壓一直在掉欸，要不要考慮補一些 volume？」
- 第三次：「學長，我覺得可能需要通知 VS 了...」
- 可以在設定中開/關（教學模式 vs 考試模式）
- 使用 hint 會輕微影響評分（-5 per hint），但比卡住不動好

### 7. 🆕 Drug-Drug Interaction 警告

**提議**：如果 clerk 同時開了衝突的藥物：
- 例：同時開 Milrinone + 大量 IV fluid → 護理師提醒降壓風險
- 例：Protamine 給太快 → 護理師警告「學長，protamine 要慢慢推喔，太快會低血壓」
- 這是藥物安全教育的一部分

### 8. 🆕 考慮在 Vitals 加入 Arterial Line waveform 描述

**提議**：心臟外科術後幾乎都有 A-line。
- 顯示方式：文字描述（不需要真正畫波形）
- 例：「A-line waveform: dampened, low amplitude」→ 提示 hypovolemia 或 line issue
- 例：「A-line waveform: wide pulse pressure variation」→ 提示 volume responsive
- 教學點：A-line waveform 比 NIBP 更即時、更準確

---

## 整體評價

這份設計文件的品質很高。從舊版 PRD 到新版 Pro，最大的進步是：

1. **從「答題」變成「值班」**— 這是質的飛躍
2. **時間引擎的設計非常成熟** — 事件驅動 + 快轉是正確架構
3. **情境選擇精準** — 術後出血作為首發情境，比 cardiogenic shock 更適合入門

主要的 gap 在於心臟外科特有的處置（Protamine、TXA、MTP、ACT）和 ICU 常規監控（I/O balance、temperature、iCa）的缺失。這些是讓模擬器從「通用 ICU 模擬器」升級為「心臟外科 ICU 模擬器」的關鍵差異。

**建議的優先順序**：
1. 先補 Hemostatics 藥物類別（Protamine/TXA）和 MTP — 這是心外的核心
2. 補 CT 管理細節和 re-explore criteria — 這是教學核心
3. 加 vital signs trend graph 和 I/O balance — 這是 UX 核心
4. 其餘的都可以 v2 再加

做好這些，這會是台灣（甚至華語世界）最好的心臟外科 ICU 教學模擬器。
