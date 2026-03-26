# Session 045 Handoff — ICU Simulator

**Date**: 2026-03-26
**Continuation of**: Session 044
**Commits**: `8ea24ab` fix: lab system key normalization + unit consistency + chat route alignment

---

## What was done this session

### 1. Ralph Loop: Lab System Key Normalization (3 rounds, 6 CRITICALs fixed)

| # | Issue | Fix |
|---|-------|-----|
| R1-1 | Chat route system prompt uses old `bcs`/`coag` IDs | Updated to list individual lab IDs |
| R1-2 | Lactate unit mismatch (RANGES mg/dL vs scenario mmol/L) | Fixed RANGES to mmol/L + `/9.009` conversion |
| R1-3 | Fibrinogen key `"Fibrinogen"` vs scenario `"fib"` | Normalized to `fib` |
| R1-4 | Missing `co2` entry in RANGES | Added with mEq/L, 23-29 normal |
| R2-1 | Chat alias table maps BCS/Coag → invalid IDs | Updated aliases → individual orders |
| R2-2 | ALL dynamic engine result keys mismatched scenario static | Normalized ALL keys to lowercase |

Additional: `store.ts` updateOrderStatus null guard, `LabOverviewPanel.tsx` ph in ABG group.
Verified: `tsc` ✅ · `next build` ✅ · Preview ✅

### 2. Echo Clips Downloaded (parallel session)

| File | View | Source | Size |
|------|------|--------|------|
| `docs/a4c-tamponade-rv-collapse.mp4` | A4C, RV diastolic collapse | CoreUltrasound S3 | 2.5 MB |
| `docs/psax-dsign.mp4` | PSAX, D-shape sign | GrepMed | 1.4 MB |

**待做**: 移到 `public/assets/echo/cardiac-tamponade/` 並更新 `ImagingModal.tsx` 的 `ECHO_CLIPS`。
**注意**: D-shape clip 原始情境是 acute PE，但 sign 在 tamponade 相同可直接用。

---

## Opus 盤點結果（Session 044 完整任務表）

### ✅ 已完成（不需再動）

| ID | 項目 |
|----|------|
| A1 | 死亡機制 vitals-driven (severity>=95, MAP<25) |
| A2 | auto-death 重新啟用（無 bypass flag） |
| A4 | Phase 2 events condition-based（混合 time+condition） |
| A5 | evt-33-death 已移除 |
| A6 | evt-30-pre-arrest condition-based (severity>80)，無 severityChange |
| A7 | evt-25 severityChange 已移除 |
| C2 | Resternotomy = 叫學長 + 提到診斷 (`senior_call_correct_plan`) |
| C3 | 14 expectedActions 齊全（ACTION_PATTERNS 共 32 個，跨 scenario 共用） |
| D1/D2 | Echo phase 切換完整（severity>=40 顯示早期積液，phase 2 切換 tamponade clips） |
| E1 | Lab Overview 面板 |
| E2 | Lab 趨勢圖（6 指標 sparkline） |
| E3 | ImagingModal shrink-0 |
| F1 | Debrief 不重複 checklist |
| F3 | evt-18 已移除 |
| L1-L4 | Lab key normalization + lactate + co2 + chat route（Session 045） |
| L6 | Trends lowercase aliases |
| L7 | Scoring regex 匹配個別 lab ID |

### ❌ 真正未完成（4 項）

| # | 項目 | 影響 | 優先 |
|---|------|------|------|
| **A3** | severity rate 是 5.0/min（~14min 死亡），原計畫 2.5（~28min） | 遊戲節奏 — 需 Wilson 決定要哪個值 | ⚠️ 需確認 |
| **C1** | Strip/Milk CT 暫降 severity（買時間操作無效果） | 玩家做了對的事但沒回饋 | 🔴 High |
| **F2** | correctDiagnosis 不分 phase（Phase 1 死亡仍顯示 tamponade） | Debrief 誤導 | 🟡 Medium |
| **L5** | Lab key display name（`hb` → `Hb`, `paco2` → `PaCO₂`） | UI 美觀 | 🟢 Low |

### ⚠️ ACLS 基礎設施（B1-B3）

已意外建好的基礎：
- Defibrillator modal + shock 邏輯（store.ts 2064-2141）
- ACLS 藥物：Epinephrine 1mg IVP、Amiodarone 300mg IVP
- ECG generator 支援 `ventricular_fibrillation`
- 鍵盤快捷鍵開 defibrillator

**缺的只有 arrest-intercept**：目前 death → 直接結束，需改成 death → ACLS mini-game → ROSC or 真死。
已有 TODO 註解在 ProPageClient.tsx:272 和 scenario:311。

---

## Echo Clips 整合待做

新下載的 2 個 clip 需要：
1. 移動 `docs/a4c-tamponade-rv-collapse.mp4` → `public/assets/echo/cardiac-tamponade/a4c-rv-collapse.mp4`
2. 移動 `docs/psax-dsign.mp4` → `public/assets/echo/cardiac-tamponade/psax-d-shape.mp4`
3. 更新 `ImagingModal.tsx` 的 `ECHO_CLIPS.cardiac_tamponade.cardiac` array，加入新 clips
4. 考慮 severity-based 顯示：早期只顯示 effusion clips，晚期（severity>60?）顯示 RV collapse + D-shape

---

## 下個 Session 建議順序

1. **Echo clips 整合**（10min）— 移檔 + 更新 ImagingModal
2. **C1: Strip/Milk CT severity reduction**（20min）— 核心 gameplay
3. **F2: Phase-aware correctDiagnosis**（10min）— Phase 1 = surgical bleeding
4. **A3: 確認 severity rate**（5min）— Wilson 決定 5.0 or 2.5
5. **L5: Lab display names**（15min）— 美觀收尾

---

## Key files

```bash
cd ~/Project/_brand/new_website

# Scenario (events, severity, availableLabs)
lib/simulator/scenarios/pro/bleeding-to-tamponade.ts

# Death / severity / game tick
lib/simulator/engine/patient-engine.ts  # severity rates
app/teaching/simulator/[id]/pro/ProPageClient.tsx  # death check

# Echo / imaging
components/simulator/pro/ImagingModal.tsx  # ECHO_CLIPS map

# Scoring
lib/simulator/store.ts  # ACTION_PATTERNS (line 58-101)

# Lab display
components/simulator/pro/LabOverviewPanel.tsx
```
