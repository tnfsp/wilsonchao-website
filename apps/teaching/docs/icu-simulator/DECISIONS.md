# ICU Simulator — 設計決策紀錄

> 最後更新：2026-03-25
> 來源：code comments、6 份設計文件（DESIGN-SIMULATOR-PRO.md、DESIGN-DIFFICULTY-SYSTEM.md、DESIGN-GAME-EXPERIENCE.md、DESIGN-BIOGEARS-LABS-IMAGING.md、HANDOFF-SIMULATOR.md、ANALYSIS-PHYSIOLOGY-ENGINE.md）

---

## 1. 為什麼用 Fog of War

**決策**：顯示層的 vitals 刻意不完美。`fog-of-war.ts` 在顯示時加入 SpO₂ 假警報、A-line dampening、Lab hemolysis。

**理由**：
> 「讓 vitals 顯示不完美（假警報、A-line dampening、lab hemolysis）— 純函數模組，不依賴 store」
> — `fog-of-war.ts` 模組開頭 comment

真實 ICU 的資訊本來就不可靠：SpO₂ probe 接觸不良、A-line 波形 dampening、K+ hemolysis。玩家需要學習「判斷哪些數據可信」，這是 ICU 工作的核心技能。

**三個 Level 的設計邏輯**：
- `none`：教師模式 / 測試用
- `light`（Standard）：輕度不確定，讓初學者學習假警報的存在，但不至於迷失
- `full`（Pro）：完整不確定性，模擬真實值班條件

**Engine vs Display 分離**：內部永遠用 true vitals 計算，fog 只在顯示層套用 → 確保死亡判斷、scoring 不受假值影響。

---

## 2. Scoring 邏輯的設計理由

### 2a. Pro Score — 多維度設計

**決策**：評分分為 7 個維度（critical actions、SBAR、escalation、lethal triad、diagnosis、time、hints），而非單一數字。

**理由**（來自 `DESIGN-SIMULATOR-PRO.md`）：
> "多維度評分 → 讓玩家知道哪裡做得好，哪裡不足，不是只告訴你 60 分。"

臨床能力本來就是多維的：快速反應（time to first action）、溝通（SBAR）、系統思考（lethal triad）、escalation 判斷 — 每一個都是獨立的學習目標。

### 2b. SBAR 評分設計

**決策**：SBAR 評分看 `completeness`、`prioritization`、`quantitative`（有沒有數字）、`anticipatory`（「我已經準備了」）4 個維度。

**理由**：
> "數字勝過形容詞，「出很多」不如「cumulative 1100cc within 3 hours」。
> 說「我已輸了 2U pRBC、準備第二套」比只報問題更展示臨床主動性。"
> — `score-engine.ts` generateKeyLessons

`anticipatory` language 是 senior residents 和 junior 最大的差距。教學目標：讓玩家學習不只「報問題」而是「報問題 + 我已做了什麼 + 我需要什麼」。

### 2c. Hint Penalty vs Infinite Hints

**決策**：Pro = 最多 3 hint（-5 pts/hint）；Standard = 無限 hint（guidanceEngine 自動觸發）。

**理由**（來自 `DESIGN-DIFFICULTY-SYSTEM.md`）：
> "Standard：護理師主動引導；Pro：只報數字，不引導。"

Standard 的引導是真實資深護理師對 junior 的行為——護理師本來就會暗示。Pro 的 hint penalty 強調獨立判斷的責任。

### 2d. Pause-Think Bonus

**決策**：玩家使用暫停思考功能 → +10 pts。

**理由**（來自 `DESIGN-SIMULATOR-PRO.md`）：
> "做了可以加分（shows clinical reasoning），不做不扣分。"

ICU 工作中有意識地「暫停、思考、說出 differential」是高階臨床技能的表現。加分（而非不加也不扣）是為了鼓勵但不強迫。

### 2e. Standard Score — Checklist 設計

**決策**：Standard 模式用簡化 checklist，不用百分比或複雜算法。

**理由**：
> "Standard：簡單 checklist（✅/❌），和 Pro 的 compliance % 不同。"
> — `DESIGN-DIFFICULTY-SYSTEM.md`

目標用戶（Clerk）需要清楚的對錯回饋，不需要細緻的分數。Stars 系統（1-3 ⭐）直覺且可激勵重玩。

### 2f. Guideline Bundle 整合

**決策**：評分錨定臨床指引（SSC 2021 Hour-1 Bundle、STS/EACTS、Pericardiocentesis），而非只看玩家「開了什麼藥」。

**理由**：
> "用 GuidelineBundle 讓玩家知道做的事是否符合指引，而不只是符合腳本。"
> — `DESIGN-DIFFICULTY-SYSTEM.md`

教學目標是讓玩家理解「為什麼這樣做是對的」（指引依據），而不只是記憶「腳本說要做這個」。

---

## 3. Standard vs Pro 的分流原因

**決策**：同一個 game engine，但 Standard 模式透過 StandardOverlay 簡化操作 + 加教學輔助。

**理由**（來自 `DESIGN-DIFFICULTY-SYSTEM.md`）：
> "問題：Pro 模式是 R/Fellow 等級，太難。Clerk 不會玩，一般人更看不懂。
> 但心臟外科 ICU 模擬器本身很有教學和品牌價值 → 需要分級。"

**Overlay 系統的設計理由**：
> "Single Source of Truth = Pro scenario。Standard/Lite 不重寫整個 scenario，用 overlay 覆蓋。
> 維護成本低，Pro 改了自動帶動。"

保持醫學內容一致性。Pro 的 `expectedActions`、`guidelineBundles`、`debrief` 是 SSOT，Standard 只覆蓋操作體驗（presetOrders、nurseUrgencyEvents、timeScale）。

**「不死」→「延遲死亡」的決策**：
> "死亡機制：延遲死亡（60s 搶救窗口）— 保留 urgency + 比 Pro 寬容。"
> — `DESIGN-DIFFICULTY-SYSTEM.md`

完全不死 → 喪失緊迫感；直接死 → 初學者受挫太快。60 秒搶救窗口保留了「如果你現在做對，病人還救得回來」的教學張力。

---

## 4. 遊戲中不教學原則

**決策**：教學全部放 Debrief，遊戲中不顯示 guideline、不即時告知對錯。

**理由**（來自 `DESIGN-GAME-EXPERIENCE.md`）：
> "教學是完成之後的事情。
> ❌ 不要在 order 旁顯示「為什麼」
> ❌ 不要即時告訴玩家做對或做錯
> ✅ 後果本身就是教學 — 開錯藥 → vitals 惡化"

這與「真實 ICU」體驗一致：你開了藥，但不會有人立刻告訴你「這是對的，因為 SSC 2021 說...」。學習透過結果，而不是即時 feedback。

**唯一例外**：Standard 模式的護理師暗示（如「學長，這個劑量是不是...」）— 因為真實護理師確實會這樣說。

**決議**（`DESIGN-GAME-EXPERIENCE.md` 已記錄）：原本設計的「Standard inline guideline feedback」已被取消，改為護理師暗示系統。

---

## 5. 事件驅動時間 vs Real-time

**決策**：時間是事件驅動 + 快轉，不是 real-time。玩家做決策時時間停止。

**理由**（來自 `DESIGN-SIMULATOR-PRO.md`）：
> "不是 real-time。是事件驅動 + 快轉。Clerk 做決策的時候時間停止。"

Real-time 會讓玩家感到焦慮並強迫打字，而不是思考。教學模擬器的目標是讓玩家有機會完整思考 differential 和 plan，不是測試打字速度。

---

## 6. Severity 0-100 抽象層

**決策**：用 0-100 的抽象 `severity` 驅動 vitals 計算，而非直接操作 vitals 數字。

**理由**（`patient-engine.ts` 設計）：
> "新 vitals = 基礎 vitals + pathologyModifier(severity)"

好處：
- 每次 tick 從 `baselineVitals` 重新計算，避免 modifier 雙重累積
- Pathology 的嚴重程度用單一數字表示，容易理解和調試
- Effect 的 `severityChange` 可以直接說「這個藥讓病況改善 8 分」

---

## 7. BioGears 整合策略（Pro mode only）

**決策**：BioGears C++ physiological engine 只在 Pro 模式使用。Standard 用靜態 labs。

**理由**（來自 `DESIGN-BIOGEARS-LABS-IMAGING.md`）：
> "Standard/Lite 的 BioGears 整合 ❌（Pro only）"

原因：
1. Standard 用戶（Clerk）不需要動態 labs 的精確度
2. BioGears 是外部服務（port 8770），可能離線
3. Static labs 已足夠傳達教學重點
4. 保持 Standard 模式的可部署性（不依賴 BioGears）

**Graceful Degradation**：BioGears 離線 → Pro 顯示 fallback 提示「引擎離線，使用內建模擬」。

---

## 8. 護理師 AI 架構決策

**決策**：Phase 1-2 用腳本化 trigger（GuidanceEngine 7 種），Phase 3+ 才用 Claude AI 驅動。

**理由**（來自 `DESIGN-GAME-EXPERIENCE.md`）：
> "AI 護理師 Phase 3+ 才考慮 — 保持時間表，但提升優先級。這是系統最大的體驗提升點。"

Phase 1-2 的腳本方式：
- 劇情穩定可控，確保醫學正確性
- 不需要 API 費用
- 容易測試

Phase 3 升級理由：
- Claude 驅動的護理師可以回應玩家的具體行為
- 提升沉浸感（「為什麼你要問那個？你在想什麼？」）
- 最大的體驗差異化

---

## 9. Scenario 資料結構決策

**決策**：`hiddenTitle` / `hiddenSubtitle` 在遊戲中顯示，遮蔽診斷。

**理由**：
> "hiddenTitle 系統（遊戲中不爆雷）"
> — `DESIGN-DIFFICULTY-SYSTEM.md` ✅ 已完成

如果情境標題直接叫「Cardiac Tamponade」，診斷就不用想了。`hiddenTitle` = 「術後急變 Case B」讓玩家需要自己找診斷。

**決策**：`guidelineBundles` 是 optional field，舊 scenario 不需要改。

**理由**：向下相容。新加的 SSC / STS 指引評分不破壞現有 scenario。

---

## 10. 架構選擇：不拆 repo（現階段）

**決策**：ICU Simulator 維持在 `new_website` 的同一個 repo 內，不獨立拆 repo。

**理由**（從設計文件推斷）：
- Teaching 系統與 Simulator 共用路由 (`/teaching/simulator`)
- 共用 Next.js 框架、Tailwind、shadcn/ui
- 共用 Claude API key 和 server components
- 拆 repo 的 overhead（CI/CD、domain、API sharing）目前不值得

**未來考慮**：等 Simulator 有獨立的 auth、排行榜、analytics 需求時再評估拆 repo。

---

*決策紀錄由 Owl 整理，2026-03-25。*
