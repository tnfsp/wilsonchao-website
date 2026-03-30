# Session 048 Handoff — ICU Simulator

**Date**: 2026-03-26
**Continuation of**: Session 047
**Commits**: 未 commit（所有改動在 working tree）

---

## What was done this session

### 工作模式：全 subagent 並行，不自己寫代碼

6 個 agents 並行，全部成功完成。

### 1. T0: Pharma PK/PD Report v2（Opus agent）

**檔案**: `_active/biogears-engine/docs/pharma-pkpd-report-v2.md` (2,077 lines)

12 drugs 的教科書等級 PK/PD 報告，每藥包含：
- Clinical Data Table（therapeutic plasma conc, ICU dose, expected effects, literature sources）
- Reverse-Engineering Math（從臨床數據反推 EMax/EC50，完整公式）
- Multi-dose Verification Table（low/mid/high dose vs clinical reality）
- Complete BioGears XML

**發現並修正 5 個 stock XML 錯誤**：

| Drug | Issue | Fix |
|------|-------|-----|
| Atropine | HR EC50=100 ug/L → 只有 4% effect at 1mg | EC50 corrected to 7 ug/L |
| Vasopressin | SBP EMax=1.0 → unrealistic BP rise | Reduced to 0.40 |
| Fentanyl | SystemicClearance=68（5x literature） | Corrected to 13 mL/min/kg |
| Fentanyl | FractionUnbound=0.30（should be 0.16） | Corrected |
| Ketamine | ke0=3.0/min → sub-second equilibration | Reduced to 0.5/min |

### 2. T1: biogears-client.ts（NEW file）

**檔案**: `_archived/claude-icu-simulator/lib/biogears-client.ts` (819 lines)

- `BioGearsClient` class — WebSocket 連線管理 + auto-reconnect + exponential backoff
- 所有 bridge commands 的 TypeScript 方法（drug bolus/infusion, fluid, hemorrhage, ventilator, cardiac arrest, CPR, chest tube, needle decompression, pericardial effusion）
- `BIOGEARS_DRUGS` 常數（19 ICU drugs with substance names, admin types, default concentrations）
- `BIOGEARS_FLUIDS` 常數（NS, LR, Blood O-neg）
- `HEMORRHAGE_COMPARTMENTS`（12 anatomical sites）
- Event callbacks: `onVitalsUpdate`, `onConnectionChange`, `onError`, `onStatus`
- Factory: `createBioGearsClient()` + `getSharedBioGearsClient()` singleton

### 3. T3: store.ts BioGears Wiring（MODIFIED）

**檔案**: `_archived/claude-icu-simulator/lib/store.ts` (594 lines, +~250 new)

- Import `getSharedBioGearsClient`, `BIOGEARS_DRUGS`, `BIOGEARS_FLUIDS`
- `connectBioGears(url?)` / `disconnectBioGears()` — WebSocket 生命週期
- `dispatchOrderToBioGears(order)` — 核心：medication order → BioGears command
  - `normalizeDrugName()` — case-insensitive + alias 解析（"levophed" → norepinephrine）
  - `normalizeFluidName()` — NS/LR/PRBC 別名
  - `parseDoseToMg()` — 單位轉換（g, mcg, mg, mL → mg）
- `mapBioGearsToVitals()` — BioGears state → VitalSigns interface
- `addOrderedMedication` 自動觸發 `dispatchOrderToBioGears`
- 未連線時 graceful degradation（order 照記、dispatch no-op）
- TypeScript zero errors

### 4. T4: MTP + Phase Engine + Ventilator（NEW file）

**檔案**: `_archived/claude-icu-simulator/lib/mtp-ventilator.ts` (826 lines)

**MTP（大量輸血 Protocol）**：
- `getMTPPhaseProducts(phase)` — ACS TQIP guideline 6:6:1 ratio
- `dispatchMTPToBioGears()` — pRBC as Blood_ONegative, TXA 1g with phase 1

**Phase Transition Engine**：
- 6 condition types: `severity_above/below`, `time_elapsed`, `medication_given`, `intervention_done`, `vitals_threshold`
- 5 action types: `update_severity_rate`, `trigger_event`, `update_vitals_target`, `send_biogears_command`, `add_message`
- `createPhaseEngine(scenario)` — 自動轉換 scenario 的 `vital_transitions` 和 `deterioration_thresholds`
- `evaluateTransitions()` + `applyTransition()` — pure evaluation + side-effect separation

**Ventilator**：
- 4 modes: PC, VC, SIMV, CPAP
- `getDefaultVentSettings(weight, gender)` — ARDSNet lung-protective defaults（6-8 mL/kg IBW）
- `dispatchVentilatorToBioGears()` — clinical mode → BioGears PC/VC mapping
- `validateVentSettings()` — clinical safety limits

### 5. T8: ACLS Algorithm（NEW file）

**檔案**: `_archived/claude-icu-simulator/lib/acls-algorithm.ts` (1,374 lines)

- `severityToRhythm(severity, context)` — 5 bands (0-100), context-aware pathway（shockable vs non-shockable based on etiology, K+, CAD）
- `ACLSEngine` class — 8-state machine (monitoring → arrest_detected → cpr → rhythm_check → shock_advised → shock_delivered → rosc/death)
- AHA 2020 VF/pVT protocol：CPR 2min → rhythm check → shock → epi after 2nd shock → amiodarone after 3rd
- `evaluateROSC()` — 8 multiplicative factors（time-to-CPR, CPR quality, meds, rhythm, shocks, reversible causes, age, duration）
- H's and T's reversible causes tracking + treatment
- `isShockableRhythm()`, `getACLSDrugProtocol()`, `createACLSEngine()` — integration exports
- Deterministic PRNG (xorshift32) for reproducible testing

### 6. T11: buildVitalsJson Expansion（MODIFIED）

**檔案**: `_active/biogears-engine/bridge/bg-bridge.cpp` (996 lines, was ~600)

80 → **279 physiologic parameters**, 12 JSON categories:

| Category | Count | Key Additions |
|----------|-------|---------------|
| `vitals` | 17 | etco2_mmHg |
| `hemodynamics` | 15 | Stroke volume, cardiac index, SVR, PVR, Swan-Ganz (PA/PCWP), CPP, ICP |
| `respiratory` | 23 | A-a gradient, compliance, dead space, driver/muscle pressures |
| `labs` | 30 | Native BUN, SvO2, HCO3 via Henderson-Hasselbalch |
| `renal` | 12 | GFR, renal blood flow, bladder pressure, urine osmolarity |
| `neuro` | 8 | GCS, RASS, Pain VAS, bilateral pupil size/reactivity |
| `drugs` | 14 | CNS response, antibiotic activity, tubular permeability |
| `metabolism` | 18 | VO2, VCO2, RER, fluid compartments, glycogen stores |
| `inflammatory` | 22 | IL-6, IL-10, TNF, NO, macrophage/neutrophil counts |
| `assessments` | 55 | CMP(14), CBC(10), SOFA(7), PT/INR, Urinalysis(12) |
| `patient` | 65 | +35 new event flags (ARDS, seizures, compartment syndromes, sepsis) |

也更新了 `ws-server.py` docstring。

---

## 未完成 / 下個 Session 任務

### 🔴 Priority 1: 編譯驗證 + XML 更新

| # | Task | Est | Notes |
|---|------|-----|-------|
| **V1** | `cmake --build` bg-bridge.cpp | 15min | 加了 6 個新 include + 大量 API call，可能有 header 缺失 |
| **V2** | 更新 5 個 substance XML（Atropine EC50, Vasopressin EMax, Fentanyl clearance/binding, Ketamine ke0） | 10min | 根據 pharma-report-v2 的修正值 |
| **V3** | TypeScript 全專案 build 驗證（`next build`） | 5min | store.ts 改動較大，需確認 import chain |

### 🟡 Priority 2: Session 045 遺留 Blockers

| # | Task | Impact | Est |
|---|------|--------|-----|
| **A3** | Severity rate 確認：5.0/min（14min death）vs 2.5（28min）| 遊戲節奏 — **需 Wilson 決定** | 5min |
| **C1** | Strip/Milk CT severity reduction（做對了但沒回饋） | 核心 gameplay | 20min |
| **F2** | Phase-aware correctDiagnosis（Phase 1 死亡仍顯示 tamponade） | Debrief 誤導 | 10min |
| **L5** | Lab display names（`hb` → `Hb`, `paco2` → `PaCO₂`） | UI 美觀 | 15min |

### 🟡 Priority 3: Echo Clips 整合

| # | Task | Est |
|---|------|-----|
| **E4** | 移動 echo clips 到 `public/assets/echo/cardiac-tamponade/` | 5min |
| **E5** | 更新 `ImagingModal.tsx` ECHO_CLIPS + severity-based display | 10min |

### 🔵 Priority 4: UI 接線（v2 Dynamic Patient）

| # | Task | Est | Depends |
|---|------|-----|---------|
| **U1** | BioGears 連線按鈕 + 狀態指示器 | 15min | V3 |
| **U2** | VitalSignsPanel 接 BioGears real-time vitals | 20min | V3 |
| **U3** | ACLS mini-game UI（arrest-intercept → ACLS modal） | 40min | T8 done |
| **U4** | Ventilator settings modal + dispatch | 20min | T4 done |
| **U5** | MTP activation button + phase progression UI | 15min | T4 done |
| **U6** | Phase Engine 接到 game tick loop | 20min | T4 done |

### 🔵 Priority 5: 進階整合

| # | Task | Notes |
|---|------|-------|
| **I1** | biogears-client.ts types 對齊 279-param buildVitalsJson | T11 加了很多新 category，client types 需更新 |
| **I2** | acls-algorithm 接 BioGears cardiac_arrest / start_cpr commands | 目前是純邏輯，需接 WebSocket dispatch |
| **I3** | Phase Engine 接 ACLS Engine（severity → rhythm → arrest intercept） | 兩個引擎的整合點 |

---

## Key Files（本次新增/修改）

```bash
# NEW — BioGears TypeScript integration layer
~/Project/_archived/claude-icu-simulator/lib/biogears-client.ts   # 819 lines
~/Project/_archived/claude-icu-simulator/lib/acls-algorithm.ts    # 1,374 lines
~/Project/_archived/claude-icu-simulator/lib/mtp-ventilator.ts    # 826 lines

# MODIFIED — Store wiring
~/Project/_archived/claude-icu-simulator/lib/store.ts             # 594 lines (+250)

# MODIFIED — C++ bridge expansion
~/Project/_active/biogears-engine/bridge/bg-bridge.cpp            # 996 lines (+400)

# NEW — Pharma PK/PD reference doc
~/Project/_active/biogears-engine/docs/pharma-pkpd-report-v2.md  # 2,077 lines

# Previous Opus reports (still valid for reference)
~/.claude/plans/glimmering-munching-umbrella-agent-a646d9b64d8c8356a.md  # BioGears Audit
~/.claude/plans/glimmering-munching-umbrella-agent-a57735f894f013f44.md  # Pharma v1 (superseded by v2)
```

---

## Architecture Diagram（Post-Session 048）

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js + React + Zustand)                    │
│                                                         │
│  store.ts ←→ biogears-client.ts (WebSocket)   [NEW]    │
│     ↕              ↕                                    │
│  acls-algorithm.ts   mtp-ventilator.ts        [NEW]    │
│     ↕                   ↕                               │
│  UI Components (TODO: U1-U6)                            │
└───────────────────────┬─────────────────────────────────┘
                        │ ws://localhost:PORT
┌───────────────────────┴─────────────────────────────────┐
│ BioGears Bridge                                         │
│  ws-server.py → bg-bridge.cpp (279 params)    [EXPANDED]│
│       ↕ stdio JSON                                      │
│  libBioGears physiology engine                          │
│  + 12 substance XMLs (5 need correction)      [TODO]   │
└─────────────────────────────────────────────────────────┘
```

**v2 "動態病人" 骨架已完成，下一步是驗證編譯 + UI 接線。**
