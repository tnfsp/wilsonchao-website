# Session 058 Handoff — 2026-04-01

## 本次完成

### Standard 完全統一 Pro
- **Popover**: 處置 popover 跟 Pro 完全一致（含 MTP），移除所有 `isStandard` 過濾
- **OrderModal**: Standard 點「開藥」開 Pro 的完整 OrderModal（藥物列表 + 6 tabs + tag filter），DrugDetailPanel 偵測 `difficulty=standard` → 劑量/頻率鎖定為 read-only badge + 「一鍵開立」按鈕 + 隱藏 guard rail UI
- **PresetOrderPanel 移除**: 不再使用，Standard 完全用 Pro 的 OrderModal
- **BioGears**: Standard 也自動連 BioGears（同 Pro），fallback formula engine

### BioGears 自動連線修復（Pro + Standard 都修）
- **根因**: React Strict Mode double-mount → `connect()` 被呼叫兩次 → 第二次 `new WebSocket` 覆蓋第一次 → 第一次的 `onmessage` handler（等 ready signal）永遠不觸發 → 5 秒 timeout
- **修法**: `biogears-client.ts` 的 `connect()` 加 guard — 如果已有活的 ws（CONNECTING/OPEN），poll 等待 ready 而非新建
- **驗證**: Pro 模式 console 確認 `[BioGears] Patient ready, syncing initial vitals`

### Commits (5)
- `669ed6f` — Standard popover 與 Pro 完全一致（含 MTP）
- `661d423` — Standard 用 Pro OrderModal（鎖定劑量 + 一鍵開立）
- `b003949` — Standard 加入 BioGears 自動連線
- `f3435e2` — BioGears connect() Strict Mode guard 修復

## 下次要做
1. **Wilson 試玩** — Standard + Pro 都應該看起來一樣了，收集回饋
2. **Lite mode MVP** — 視覺小說模式（一般民眾版）
3. **Vercel deploy**

## 注意事項
- `PresetOrderPanel.tsx` 和 `GuidanceBubble.tsx` 仍在 `components/simulator/standard/` 但 PresetOrderPanel 不再被 import
- Standard overlay (`bleeding-to-tamponade.standard.ts`) 的 presetOrders 目前不被使用（OrderModal 取代），但 guidance/urgency/eventOverrides 仍生效
- BioGears server 需要在 port 8770 跑，否則 5 秒後 fallback formula
