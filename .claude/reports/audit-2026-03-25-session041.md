# Code Audit 報告 — ICU Simulator Pro Session 041

**審查時間**: 2026-03-25
**審查範圍**: ICU Simulator Pro 核心組件 + Session 041 修改
**檔案數量**: 10 個核心檔案

---

## 問題總覽

| 等級 | 數量 |
|------|------|
| Critical | 3 |
| Warning | 7 |
| Info | 5 |

---

## Critical 問題

### C1. `actionAdvance` 依賴 `window.__tickPatient` — 脆弱的全域耦合

- **位置**: `lib/simulator/store.ts:1325`
- **問題**: `actionAdvance` 呼叫 `(window as any).__tickPatient(minutes)`，如果註冊元件尚未掛載或已卸載，`__tickPatient` 為 undefined，patient state 靜默不更新
- **影響**: 所有 action-driven time advances 可能無法更新 patient vitals。遊戲時鐘前進但病人凍結
- **建議**: 用 store-level callback registration pattern 取代 window global

### C2. AI Chat endpoint 無 message sanitization — prompt injection 風險

- **位置**: `app/api/simulator/chat/route.ts:63`
- **問題**: message 僅驗證 type 和 length，直接傳入 LLM messages array
- **影響**: 攻擊者可注入指令讓 AI 返回任意 orders
- **建議**: 對 message 做基本 sanitization + 在 server-side 驗證返回的 medicationId 是否在 allowlist 中

### C3. AI Debrief fetch 無 timeout/abort

- **位置**: `app/api/simulator/debrief/route.ts:249`
- **問題**: Anthropic SDK call 無 timeout，可能無限掛起
- **影響**: Serverless 上最終 504，長運行伺服器上連線掛起
- **建議**: 加 AbortSignal + 30s timeout

---

## Warning 問題

### W1. ImagingModal setTimeout stale closure
- **位置**: `components/simulator/pro/ImagingModal.tsx:291`
- **建議**: 在 callback 內讀 `useProGameStore.getState().clock.currentTime`

### W2. OutcomeScreen criticalMet 匹配邏輯過寬
- **位置**: `components/simulator/pro/OutcomeScreen.tsx:88-95`
- **建議**: 使用更精確的 ID 匹配策略

### W3. AI Debrief rate limiter 在 serverless 無效
- **位置**: `app/api/simulator/debrief/route.ts:13-25`
- **建議**: 文件記錄此限制；生產環境用 Redis

### W4. rateLimitMap 無 eviction — unbounded memory growth
- **位置**: `app/api/simulator/debrief/route.ts:13`, `chat/route.ts:14`
- **建議**: 加 periodic cleanup 或用 LRU cache

### W5. ActionBar 用 sessionStorage 傳 ventilator tab
- **位置**: `components/simulator/pro/ActionBar.tsx:297`
- **建議**: 改用 store field

### W6. AI Chat conversationHistory 未驗證 shape
- **位置**: `app/api/simulator/chat/route.ts:255-263`
- **建議**: 驗證每個 entry 的 role 和 content 為 string

### W7. DefibrillatorModal render 中 imperative store read
- **位置**: `components/simulator/pro/DefibrillatorModal.tsx:49`
- **建議**: 改用 selector pattern

---

## Info 建議

- I1. ImagingModal 非選擇性 store destructure 導致不必要重渲染 (line 150)
- I2. Debrief JSON parsing regex 不處理所有 markdown fence 變體 (line 262)
- I3. ImagingModal event ID 用 Date.now() 而非 nextId() (line 266)
- I4. OutcomeScreen ea.action 無 null guard (line 89)
- I5. DefibrillatorModal getLastBioGearsState() 每次 render 呼叫 (line 48)

---

## Handoff Warning 驗證

| # | Warning | 狀態 |
|---|---------|------|
| 1 | ImagingModal setTimeout stale closure | ✅ 確認存在 (W1) |
| 2 | OutcomeScreen criticalMet 匹配脆弱 | ✅ 確認存在 (W2) |
| 3 | AI Debrief rate limiter serverless | ✅ 確認存在 (W3) |
| 4 | AI Debrief fetch 無 timeout | ✅ 確認存在，升級為 Critical (C3) |
| 5 | ActionBar sessionStorage 傳 tab | ✅ 確認存在 (W5) |
