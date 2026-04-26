# ICU 值班模擬器 — v2 規劃文件

> 停下來想清楚再動手。v1 的 backend 很完整，但體驗需要重新設計。

---

## 問題診斷

v1 做了一個 R1-R2 等級的模擬器，給 clerk 用。結果：

- **10 個按鈕一次全丟** → clerk 愣住不知道先按什麼
- **沒有即時回饋** → 做對做錯要等到 Debrief 才知道
- **沒有重玩動機** → 跑完一次就結束了
- **太像工具，不像遊戲** → 教學有餘，體驗不足

**核心矛盾**：我們想教「值班處理流程」，但 clerk 連值班是什麼感覺都不知道。

---

## 目標用戶

| 層級 | 誰 | 他們要什麼 | 我們怎麼給 |
|------|-----|-----------|-----------|
| **主要** | Clerk（大五大六） | 「值班到底在幹嘛」的初體驗 | 引導模式 + 遊戲化 |
| **次要** | Intern / PGY | 複習、練手感 | 進階模式（關引導） |
| **未來** | 粉絲 / 一般人 | 「當醫生好酷」的娛樂 | Lite 版（v3 再做） |

**v2 鎖定 clerk。** 其他之後再說。

---

## 核心設計原則

### 1. 引導優先，開放其次

第一次玩 = **教學引導模式（預設開啟）**

不是限制按鈕，而是**護理師暗示下一步 + 建議按鈕發光**：

```
[遊戲開始]
  林姐：「學長，你要不要先來看一下病人？」
  → 🔬 PE 按鈕 pulse 動畫（綠色光暈）
  → 其他按鈕正常可按，不鎖

[PE 做完]
  林姐：「要不要先抽個血看看？」
  → 🩸 抽血按鈕 pulse
  
[抽血送出]
  林姐：「血壓還在掉，要不要先給個 fluid？」
  → 💊 開藥按鈕 pulse

[5 分鐘沒動作]
  林姐：「學長...病人看起來越來越不對...」
  → 📞 叫人按鈕 pulse
```

**進階模式** = 關掉引導，所有按鈕等權重，沒有提示。

### 2. 病人會好，病人會死

**最強的遊戲回饋不是分數，是因果。**

| 你做了 | 病人反應 | 視覺回饋 |
|--------|---------|---------|
| 給 NS 500cc bolus | BP 慢慢回升 | 數字變綠、↑ 箭頭 |
| 輸 pRBC 2U | Hb 上升、HR 下降 | vitals 面板綠光閃 |
| 開對 Protamine | CT output 開始減少 | CT 面板數字變小、顏色變淡 |
| 什麼都不做 | BP 持續掉、HR 飆 | 數字變紅、警報聲、螢幕邊緣紅色脈動 |
| 太晚處理 | Flatline | 螢幕變暗、「病人 cardiac arrest」|

**關鍵**：不是等到 Debrief 才說「你做錯了」，而是**即時看到因果**。

### 3. 星等 + 結局 = 重玩動機

**⭐⭐⭐ 三星制**

| 星等 | 條件 | 結局文字 |
|------|------|---------|
| ⭐⭐⭐ | 所有 critical actions 完成 + 及時叫學長 + SBAR 完整 | 「病人順利回 OR re-explore，術後穩定轉出 ICU。學長說：處理得很好。」 |
| ⭐⭐ | 大部分做對，但有延遲或遺漏 | 「病人回 OR re-explore，但因為延遲處理多輸了 6U 血。學長說：下次動作要快一點。」 |
| ⭐ | 關鍵遺漏（沒叫人 / 沒輸血） | 「病人因為持續出血和血流動力學不穩，緊急回 OR。學長被護理師叫來的。」 |
| 💀 | 病人死亡 | 「你沒有來得及...」（黑屏 + 教學反思） |

**死亡不是懲罰，是教學。** 死亡結局後顯示：
- 「回到 XX:XX 的時候，如果你做了 YY，結果會不同。」
- 一鍵「從那個時間點重玩」

### 4. UI 簡化

**現在 10 個按鈕 → 改成 2 層**

**主要（一直顯示，5 個）：**
```
[🔬 PE]  [🩸 抽血]  [💊 處置]  [📞 叫人]  [📋 SBAR]
```

**「處置」展開（點擊後）：**
```
開藥 | 輸血 | MTP | 通 CT | POCUS | 影像
```

**底部固定：**
```
[⏸ 暫停思考]  [⏩ 快轉]
```

這樣第一眼只有 5 個選擇，不會 overwhelm。

### 5. 音效與視覺

| 事件 | 視覺 | 音效（可關） |
|------|------|-------------|
| 開始 | 電話鈴聲圖示動畫 | 📞 ring |
| 開對 order | 護理師「收到」+ 綠色 flash | ✓ 叮 |
| 開錯/危險 order | 護理師質疑 + 黃色 flash | ⚠️ 嗡 |
| Lab 回來 | Timeline 彈入 + 異常值紅色 | 📊 通知音 |
| Vitals 惡化 | 數字變紅 + 邊框紅色脈動 | 🔴 警報 |
| 病人好轉 | 數字回綠 + 綠色波紋 | ✨ 和弦 |
| 病人 arrest | 螢幕變暗 + flatline 線 | — 長音 |
| 完成 SBAR | 星星飛入動畫 | ⭐ 成就音 |

音效用 Web Audio API，檔案 < 50KB 總計。預設開啟，可在設定中關。

---

## 分支結局系統

每個情境有 3-4 個**關鍵分歧點**，不同決策導向不同結局：

```
術後出血情境：

分歧點 1：有沒有及時輸血
  → 有：Hb 穩定，爭取到時間
  → 沒有：dilutional coagulopathy，進入惡性循環

分歧點 2：有沒有叫學長
  → 及時叫：學長 5 分鐘到，15 分鐘決定 re-explore
  → 太晚叫：學長被護理師叫來（扣分 + 不同結局文字）
  → 沒叫：病人持續惡化 → arrest

分歧點 3：CT 堵住了有沒有處理
  → 通了：繼續引流，避免 tamponade
  → 沒注意到：tamponade → PEA arrest

分歧點 4：死亡三角管理
  → 有注意（保溫 + 矯正 acidosis + 輸 Cryo）：出血減緩
  → 沒注意：coagulopathy 惡化 → 更多出血 → 更低溫 → 惡性循環
```

**Debrief 的「如果你當時...」展示這些分支。**

---

## 技術調整

### 保留（v1 已完成，不重做）
- ✅ types.ts（型別系統）
- ✅ time-engine.ts（時間引擎 — 改為事件驅動已完成）
- ✅ patient-engine.ts（病人引擎）
- ✅ order-engine.ts（Order 驗證 + guard rail）
- ✅ score-engine.ts（評分）
- ✅ store.ts（zustand store）
- ✅ medications.ts / labs.ts / transfusions.ts（資料）
- ✅ postop-bleeding.ts（第一個情境）
- ✅ 所有 Modal components（PE, POCUS, Lab, Order, Consult, etc.）

### 新增
- 🆕 **引導系統**（GuidanceEngine）
  - scenario 定義 `guidanceSteps[]`：每步有 trigger condition + hint message + highlight button
  - store 新增 `guidanceMode: boolean` + `currentGuidanceStep`
  - ActionBar 讀取 highlight state，加 pulse 動畫

- 🆕 **即時回饋系統**（FeedbackEngine）
  - order 送出 → 判斷 correct/incorrect/dangerous → 觸發視覺回饋
  - vitals 變化 → 數字顏色動態更新（綠/黃/紅）
  - 螢幕邊緣危急指示器（severity > 70 → 紅色脈動）

- 🆕 **結局系統**（OutcomeEngine）
  - 追蹤關鍵分歧點的決策
  - 根據決策組合選擇結局（3 星 / 2 星 / 1 星 / 死亡）
  - Debrief 頁面顯示結局文字 + 分支樹

- 🆕 **音效系統**（SoundManager）
  - 6-8 個短音效（< 50KB 總計）
  - Web Audio API，可靜音
  - 不依賴外部 library

- 🆕 **UI 重構**
  - ActionBar 改為 5 主按鈕 + 展開式「處置」
  - VitalsPanel 加顏色動態 + 趨勢箭頭動畫
  - 螢幕邊緣危急指示器
  - Debrief 加星星動畫 + 結局文字 + 分支樹

### 修改
- 🔧 ActionBar.tsx → 5 主按鈕 + 子選單
- 🔧 ProVitalsPanel.tsx → 即時顏色回饋
- 🔧 DebriefPanel.tsx → 星等 + 結局 + 分支
- 🔧 postop-bleeding.ts → 新增 guidanceSteps + outcomes + branchPoints

---

## 開發順序

### Phase 1：引導 + 即時回饋（讓 clerk 玩得起來）
1. GuidanceEngine + guidanceSteps 資料
2. ActionBar pulse 動畫
3. VitalsPanel 顏色動態（做對 → 綠，惡化 → 紅）
4. 螢幕邊緣危急指示器
5. 護理師暗示文字（scenario event 擴充）

### Phase 2：結局 + 星等（讓 clerk 想重玩）
6. OutcomeEngine + 分歧點追蹤
7. 結局文字（4 種）
8. Debrief 星等動畫
9. 「如果你當時...」分支展示
10. 「從那個時間點重玩」功能

### Phase 3：音效 + 打磨（體驗升級）
11. SoundManager + 音效素材
12. 死亡結局畫面（黑屏 + flatline + 教學反思）
13. 成功結局畫面（星星 + 結局文字）
14. 手機版排版優化
15. 整合測試 + deploy

### Phase 4：更多情境（擴充內容）
16. **情境 2：Septic vs Cardiogenic Shock**（Wilson 最想教的）
    - CABG POD#2，發燒 + 血壓掉
    - 表面像 sepsis（發燒、WBC↑、Lactate↑）
    - 其實是 cardiogenic（CVP 高、冷末梢、窄 pulse pressure）
    - 陷阱：灌 fluid → 肺水腫；正確：Echo → inotrope → 叫學長
    - 教學核心：鑑別靠 CVP、末梢溫度、Echo、mixed venous O₂
17. 情境 3：術後 Tamponade
18. 情境 4：術後 AF + hemodynamic compromise
19. 情境 5：Ventilator weaning failure

---

## 護理師 AI 對話（Phase 1）

**角色**：林姐，資深 ICU 護理師（15 年經驗）
**個性**：專業但親切、會委婉提醒但不會幫你做決定、報告精準有數字

**技術**：Anthropic API（Sonnet），~$0.003/次對話

**System prompt 核心規則**：
1. 你是護理師，不是醫生 → 不會說「我覺得應該開 XX 藥」
2. 只回答你能觀察到的 → vitals、外觀、CT output、病人反應
3. 用當前 game state（vitals、labs、orders、timeline）組合回答
4. 沒抽的 lab 不會有數字 → 「還沒抽欸，要不要開？」
5. 不會編造醫學建議，但會委婉暗示（「學長，這個量...我覺得要不要通知一下 VS？」）

**範例**：
```
你：「病人現在看起來怎樣？」
林姐：「看起來比較躁動，皮膚摸起來濕冷的。A-line 波形還是 dampened。」

你：「CT 現在出多少？」
林姐：「最近這一個小時 280cc，鮮紅色，有看到一些小血塊。」

你：「Lab 出來了嗎？」
林姐：「CBC 還在等，大概還要 10 分鐘。ABG 剛出來，要我念給你聽嗎？」
```

---

## 不做的事（v2 scope out）

- ❌ 帳號系統 / 排行榜 / 存檔
- ❌ 粉絲 Lite 版
- ❌ 多床同時
- ❌ 真正的波形圖
- ❌ 自動產生情境

---

## 成功指標

怎麼知道 v2 成功了？

1. **Clerk 能自己玩完** — 不需要 Wilson 在旁邊解釋按鈕
2. **Clerk 會玩第二次** — 想拿三星或看不同結局
3. **Wilson 上課用得到** — 引導模式可以帶著 clerk 走一遍
4. **醫學正確** — 不會教出錯誤的臨床判斷

---

*Wilson 看完後討論。確認後按 Phase 順序開工。*
