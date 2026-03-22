# HANDOFF: ICU Simulator 整合到 Teaching 系統

## 背景

Wilson 的 clerk teaching 系統已在 wilsonchao.com 上線：
- `/teaching` — 11 套投影片（6 必修 + 5 選修）+ 講義模式
- `/clerk` — Orientation 頁面
- `/teaching/feedback` — Google Forms 回饋表單

下一步：把 `claude-icu-simulator` 整合進來，讓 clerk 上完課後用 simulator 練習。

---

## 現有 Simulator 專案

**路徑**：`/Users/zhaoyixiang/Project/_active/claude-icu-simulator/`
**Website 路徑**：`/Users/zhaoyixiang/Project/_brand/new_website/`

### 技術棧
- Next.js + TypeScript + Tailwind CSS + shadcn/ui
- JSON scenario files（情境驅動）
- Claude API 做 AI 學長回饋

### 已有元件
| 元件 | 功能 |
|------|------|
| `GameLayout.tsx` | 主遊戲框架 |
| `VitalSignsPanel.tsx` | 即時生命徵象顯示 |
| `ActionPanel.tsx` | 學員操作面板（開檢查/下醫囑） |
| `ChatArea.tsx` | 對話區（護理師 call、AI 回饋） |
| `StatusPanel.tsx` | 狀態總覽 |
| `modals/` | 各種互動彈窗 |

### 已有情境
- `cardiogenic-shock-01` — 68M, STEMI s/p PCI 3 天，Cardiogenic Shock Mimicking Sepsis
- Scenario JSON 結構完整：opening → vitals → PE → labs → POCUS → 處置分支 → debrief

### 設計完成但未實作
- Phase 1-4 遊戲流程（初始評估 → 動態觀察 → ACLS → Debrief/SBAR）
- 多情境支援
- 評分系統

---

## 整合方案

### 目標
把 simulator 搬進 `wilsonchao.com/teaching/simulator/[scenario]`，共用現有 Next.js 框架。

### 建議步驟

1. **搬元件**
   - `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/components/` → `/Users/zhaoyixiang/Project/_brand/new_website/components/simulator/`
   - `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/scenarios/` → `/Users/zhaoyixiang/Project/_brand/new_website/lib/scenarios/`
   - `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/app/api/` → `/Users/zhaoyixiang/Project/_brand/new_website/app/api/simulator/`

2. **建路由**
   - `/Users/zhaoyixiang/Project/_brand/new_website/app/teaching/simulator/page.tsx` — 情境選單
   - `/Users/zhaoyixiang/Project/_brand/new_website/app/teaching/simulator/[id]/page.tsx` — 遊戲畫面

3. **整合 Teaching 系統**
   - 每個投影片末尾加「🎮 練習這個主題」連結到對應 simulator scenario
   - Orientation 頁面加 simulator 介紹

4. **新增情境**（依 teaching modules）
   - 術後 bleeding re-explore 決策
   - Post-CABG hemodynamic management
   - Ventilator weaning failure
   - Post-op AF management
   - Tamponade 辨識

5. **注意事項**
   - 需要 Claude API key（目前用 ANTHROPIC_API_KEY）
   - 考慮是否改用 client-side LLM 或 server action 以減少 API cost
   - Wilson 對圖片很挑，UI 走純文字 + emoji 風格即可
   - 深色主題（跟 teaching slides 一致）

---

## Wilson 的教學哲學（必讀）

- **理解 > 背誦** — simulator 的回饋要解釋「為什麼」，不是對錯
- **不硬比喻** — 自然的就用，不自然的就直說
- **Case-based** — 每個 scenario 都是完整的臨床情境
- **互動性** — clerk 要「做決定」，不是被動看

---

## 相關檔案

| 檔案 | 用途 |
|------|------|
| `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/CLAUDE.md` | 原始專案說明 |
| `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/.claude/docs/PRD.md` | 完整 PRD |
| `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/.claude/docs/TECHSTACK.md` | 技術棧 |
| `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/scenarios/cardiogenic-shock-01/` | 已有情境 JSON |
| `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/components/` | 遊戲 UI 元件 |
| `/Users/zhaoyixiang/Project/_active/claude-icu-simulator/app/api/` | API routes |
| `/Users/zhaoyixiang/Project/_brand/new_website/lib/teaching-slides.ts` | 現有 11 套投影片 |
| `/Users/zhaoyixiang/Project/_brand/new_website/lib/teaching-handouts.ts` | 講義內容 |
| `/Users/zhaoyixiang/Project/_brand/new_website/app/teaching/` | Teaching 路由 |
