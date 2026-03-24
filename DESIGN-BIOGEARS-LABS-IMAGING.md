# BioGears → Labs + Imaging 整合設計文件

> 最後更新：2026-03-24
> 目標：把 scenario-driven 的靜態 labs + 純文字 imaging 升級為 BioGears-driven 的動態系統

---

## Executive Summary

目前 Labs 和 Imaging 都是 scenario 裡 hardcoded 的靜態資料（`postop-bleeding.ts` 中的 `availableLabs` / `availablePOCUS`）。每次玩結果一模一樣，不管玩家做了什麼。

本設計將 Labs/Imaging 分為三個來源層：
1. **BioGears-native** — 直接從引擎取值（pH, Hgb, Lactate...）
2. **Derived** — 用 BioGears 輸出 + 公式推算（INR, Platelet, iCa, ACT, TEG...）
3. **Scenario-static** — BioGears 完全沒有的（Blood Culture, Troponin post-op...）

Imaging 分三層：L1 靜態圖庫（CXR）、L2 Canvas 動態（Echo/POCUS）、L3 ECG 合成。

---

## 1. Labs 整合方案

### 1.1 BioGears → Lab Item 對照表

#### A. 直接取值（BioGears Native）

| Lab Item | BioGears Field | 單位 | 說明 |
|----------|---------------|------|------|
| pH | `labs.pH` | — | 直接對應 |
| PaO2 | `respiratory.pao2_mmHg` | mmHg | 需 respiratory module |
| PaCO2 | `respiratory.paco2_mmHg` | mmHg | 需 respiratory module |
| SaO2 | `labs.spo2_fraction × 100` | % | fraction → percentage |
| Hemoglobin (Hgb) | `labs.hgb_g_per_dL` | g/dL | 直接對應 |
| Lactate | `labs.lactate_mg_per_dL` | mg/dL → mmol/L | ÷ 9.01 轉換 |
| Blood Volume | `vitals.blood_volume_mL` | mL | 間接用於推算 |
| Cardiac Output | `vitals.cardiac_output` | L/min | echo finding 用 |
| EF | `vitals.ejection_fraction` | fraction | echo finding 用 |
| Urine Output | `labs.urine_production_mL_per_min × 60` | mL/hr | 轉換單位 |
| Carrico Index | `respiratory.carrico_index` | mmHg | PaO2/FiO2 ratio |
| Temperature | `vitals.temperature` | °C | 直接對應 |

#### B. 推算值（Derived from BioGears）

| Lab Item | 推算公式 | 依賴的 BioGears 數據 | 教學合理性 |
|----------|---------|---------------------|-----------|
| **Hematocrit (Hct)** | `Hgb × 3` | `labs.hgb_g_per_dL` | 經典近似 |
| **HCO3** | Henderson-Hasselbalch 反推 | `labs.pH`, `respiratory.paco2_mmHg` | 見公式 D1 |
| **Base Excess (BE)** | Van Slyke equation | pH, HCO3, Hgb | 見公式 D2 |
| **Platelet (Plt)** | Dilution + consumption model | blood_volume, transfusion history | 見公式 D3 |
| **INR** | Coagulopathy model | temperature, blood_volume_loss%, dilution | 見公式 D4 |
| **aPTT** | Correlated with INR | INR | 見公式 D5 |
| **Fibrinogen** | Dilution + consumption model | blood_volume_loss%, cryo infused | 見公式 D6 |
| **iCa (Ionized Calcium)** | Citrate toxicity model | pRBC units transfused, Ca gluconate given | 見公式 D7 |
| **ACT** | Heparin/Protamine balance model | heparin_residual, protamine_given | 見公式 D8 |
| **TEG/ROTEM** | Composite from coag state | Plt, Fib, INR, temperature | 見公式 D9 |
| **WBC** | Scenario baseline ± stress response | severity, scenario_config | 見公式 D10 |
| **BUN/Creatinine** | Renal perfusion model | MAP, UOP, baseline | 見公式 D11 |
| **Na/K/Cl** | Dilution model | fluid_volume_infused, type | 見公式 D12 |
| **Glucose** | Stress hyperglycemia | severity, scenario_baseline | 簡化模型 |

#### C. 純 Scenario 層級（BioGears 無法提供）

| Lab Item | 為什麼是 scenario-level | 處理方式 |
|----------|----------------------|---------|
| **Blood Culture** | 微生物培養結果取決於情境設定 | scenario 定義 organism + 天數 |
| **Troponin** | 術後心肌損傷 marker，非即時生理 | scenario 定義 baseline + trend |
| **Blood Type & Screen** | 固定屬性 | scenario.patient.bloodType |
| **Procalcitonin** | Sepsis marker，BioGears 無免疫模型 | scenario-derived（severity） |

### 1.2 Derived Formulas

#### D1: HCO3（從 Henderson-Hasselbalch）
```
HCO3 = 0.03 × PaCO2 × 10^(pH - 6.1)
```
- 來源：Henderson-Hasselbalch equation
- 單位：mEq/L
- 正常：22-26 mEq/L

#### D2: Base Excess（Van Slyke）
```
BE = (HCO3 - 24.4 + (2.3 × Hgb + 7.7) × (pH - 7.4)) × (1 - 0.023 × Hgb)
```
- 簡化版（夠教學用）：`BE ≈ HCO3 - 24 + 10 × (pH - 7.4)`
- 單位：mEq/L
- 正常：-2 to +2

#### D3: Platelet Estimate
```typescript
function estimatePlatelet(state: DerivedLabState): number {
  const { baselinePlt, bloodVolumeLossPct, pRBCUnitsGiven, pltUnitsGiven } = state;
  
  // Dilutional loss: platelets drop proportional to blood volume replaced with non-plt products
  const dilutionFactor = Math.max(0.2, 1 - bloodVolumeLossPct * 0.8);
  
  // Consumption: ongoing bleeding consumes platelets
  const consumptionFactor = Math.max(0.3, 1 - bloodVolumeLossPct * 0.3);
  
  // Hypothermia effect: <35°C impairs plt function (doesn't change count but worsens bleeding)
  // Reflected in TEG MA, not here
  
  // Transfusion recovery: 1 platelet dose ≈ +30-50K
  const pltFromTransfusion = pltUnitsGiven * 40; // K/μL per dose
  
  // pRBC dilution: each unit of pRBC without plt further dilutes
  const pRBCDilution = pRBCUnitsGiven * 5; // K/μL loss per pRBC unit
  
  return Math.max(20, Math.round(
    baselinePlt * dilutionFactor * consumptionFactor - pRBCDilution + pltFromTransfusion
  ));
}
```
- 正常：150-400 K/μL
- 教學重點：大量輸血（>1 blood volume）→ dilutional thrombocytopenia

#### D4: INR Estimate
```typescript
function estimateINR(state: DerivedLabState): number {
  const { baselineINR, bloodVolumeLossPct, ffpUnitsGiven, temperature, vitK_given } = state;
  
  // Dilutional coagulopathy
  const dilutionEffect = 1 + bloodVolumeLossPct * 2.5;
  // 20% loss → INR × 1.5, 40% loss → INR × 2.0
  
  // Hypothermia effect: enzyme kinetics slow down
  const tempEffect = temperature < 35 
    ? 1 + (35 - temperature) * 0.15  // each °C below 35 → +15% INR
    : 1.0;
  
  // FFP correction: each 2U FFP ≈ -0.2 INR (diminishing returns)
  const ffpCorrection = Math.min(0.8, ffpUnitsGiven * 0.1);
  
  // Vitamin K (delayed effect, ~6-12h)
  const vitKCorrection = vitK_given ? 0.1 : 0;
  
  return Math.max(0.9, 
    baselineINR * dilutionEffect * tempEffect - ffpCorrection - vitKCorrection
  );
}
```
- 正常：0.9-1.1
- 教學重點：死亡三角（hypothermia → coagulopathy → more bleeding → more hypothermia）

#### D5: aPTT（correlated with INR）
```
aPTT = 25 + (INR - 1.0) × 30 + heparin_residual_effect
```
- 正常：25-35 sec
- Heparin residual：如果 ACT > 130，aPTT 額外 +10-20

#### D6: Fibrinogen
```typescript
function estimateFibrinogen(state: DerivedLabState): number {
  const { baselineFib, bloodVolumeLossPct, cryoUnitsGiven, txaGiven } = state;
  
  // Dilution + consumption
  const dilutionFactor = Math.max(0.15, 1 - bloodVolumeLossPct * 1.2);
  
  // Cryo correction: 10U cryo ≈ +100 mg/dL fibrinogen
  const cryoBoost = cryoUnitsGiven * 10; // mg/dL per unit
  
  // TXA effect: reduces fibrinolysis, slows fib consumption
  const txaProtection = txaGiven ? 0.9 : 1.0; // 10% less consumption
  
  return Math.max(50, Math.round(
    baselineFib * dilutionFactor * txaProtection + cryoBoost
  ));
}
```
- 正常：200-400 mg/dL
- < 150 → 考慮 Cryo
- < 100 → 必須 Cryo（critical bleeding threshold）

#### D7: Ionized Calcium（Citrate Toxicity Model）
```typescript
function estimateIonizedCalcium(state: DerivedLabState): number {
  const { baselineICa, pRBCUnitsGiven, ffpUnitsGiven, caGluconateGiven_g, caChlGiven_g } = state;
  
  // Citrate load: each unit of blood product ≈ 3g citrate → chelates Ca
  const totalCitrate = (pRBCUnitsGiven + ffpUnitsGiven) * 3; // grams
  
  // Citrate → iCa depression: ~0.03 mmol/L per gram citrate
  // Liver clears citrate at ~5g/hr normally (slower if hypothermic/shocked)
  const citrateEffect = totalCitrate * 0.03;
  
  // Calcium replacement
  const caGluconateEffect = caGluconateGiven_g * 0.05; // 1g Ca gluconate → +0.05 mmol/L
  const caChlEffect = caChlGiven_g * 0.15;             // 1g CaCl → +0.15 mmol/L (3× potency)
  
  return Math.max(0.6, Math.min(1.4,
    baselineICa - citrateEffect + caGluconateEffect + caChlEffect
  ));
}
```
- 正常：1.12-1.32 mmol/L
- < 1.0 → 嚴重，影響心肌收縮力 + 凝血
- 教學重點：大量輸血 → citrate toxicity → iCa ↓ → 心肌無力 + 出血加劇

#### D8: ACT（Heparin-Protamine Balance）
```typescript
function estimateACT(state: DerivedLabState): number {
  const { baselineACT, heparinResidualUnits, protamineGivenMg, timeSinceBypass_min } = state;
  
  // Heparin half-life ~60-90 min; residual after bypass
  const heparinDecay = heparinResidualUnits * Math.exp(-timeSinceBypass_min / 75);
  
  // Each 1mg protamine neutralizes ~100U heparin
  const neutralized = protamineGivenMg * 100;
  const remainingHeparin = Math.max(0, heparinDecay - neutralized);
  
  // ACT from remaining heparin: baseline + ~0.1 sec per unit
  const heparinContribution = remainingHeparin * 0.001; // sec per unit
  
  // Hypothermia slows all clotting assays
  const tempFactor = state.temperature < 35 ? 1.1 : 1.0;
  
  return Math.max(80, Math.round(
    (baselineACT + heparinContribution * 100) * tempFactor
  ));
}
```
- 正常：< 130 sec（post-protamine）
- \> 130 → 考慮追加 protamine
- \> 180 → 明顯 heparin residual
- 教學重點：ACT 是心外術後出血評估的第一線 POC test

#### D9: TEG/ROTEM（Composite）
```typescript
function deriveTEG(state: DerivedLabState): TEGResult {
  const inr = estimateINR(state);
  const fib = estimateFibrinogen(state);
  const plt = estimatePlatelet(state);
  const temp = state.temperature;
  
  // R-time: initiation phase (correlates with INR)
  const r = 5 + (inr - 1.0) * 8 + (temp < 35 ? 3 : 0);
  
  // K-time: amplification (correlates with fib + plt)
  const k = 1 + Math.max(0, (200 - fib) / 100) * 3 + (plt < 100 ? 2 : 0);
  
  // Alpha angle: fibrin build-up speed
  const alpha = Math.max(20, 65 - (inr - 1.0) * 20 - Math.max(0, (200 - fib) / 10));
  
  // MA: maximum amplitude (platelet + fibrin interaction)
  const ma = Math.max(15, 
    30 + plt * 0.15 + fib * 0.05 - (temp < 35 ? 10 : 0)
  );
  
  // LY30: fibrinolysis at 30 min
  const ly30 = state.txaGiven ? 1.5 : (state.bloodVolumeLossPct > 0.3 ? 12 : 3);
  
  return {
    r_time:  { value: +r.toFixed(1), unit: "min", normal: "5-10",  flag: r > 10 ? "H" : r < 5 ? "L" : undefined },
    k_time:  { value: +k.toFixed(1), unit: "min", normal: "1-3",   flag: k > 3 ? "H" : undefined },
    alpha:   { value: +alpha.toFixed(0), unit: "°", normal: "53-72", flag: alpha < 53 ? "L" : undefined },
    ma:      { value: +ma.toFixed(0), unit: "mm", normal: "51-69",  flag: ma < 51 ? "L" : undefined },
    ly30:    { value: +ly30.toFixed(1), unit: "%", normal: "< 8",   flag: ly30 > 8 ? "H" : undefined },
    ci:      { value: +((0.0605 * ma + 0.1516 * alpha - 0.8812 * r - 5.054).toFixed(1)), unit: "", normal: "-3 to +3" },
  };
}
```
- 教學重點：TEG 是心外 ICU 的「整合凝血圖」
  - MA 低 → platelet 問題 → 給 platelet
  - R 高 → 凝血因子不足 → 給 FFP
  - LY30 高 → 纖溶亢進 → 給 TXA

#### D10: WBC
```
WBC = scenario_baseline × (1 + severity × 0.005) ± random(0.5)
```
- 術後 stress response → 輕度升高正常
- Sepsis scenario → 由 scenario 驅動升高

#### D11: BUN/Creatinine
```typescript
function estimateRenal(state: DerivedLabState): { bun: number; cr: number } {
  const { baselineBUN, baselineCr, avgMAP_last30min, uopMlPerMin } = state;
  
  // Prerenal azotemia: MAP < 65 → BUN/Cr ratio rises
  const perfusionFactor = avgMAP_last30min < 65 
    ? 1 + (65 - avgMAP_last30min) * 0.02 
    : 1.0;
  
  return {
    bun: Math.round(baselineBUN * perfusionFactor),
    cr: +(baselineCr * (perfusionFactor * 0.3 + 0.7)).toFixed(1),
    // Cr rises slower than BUN in prerenal
  };
}
```

#### D12: Electrolytes（Na/K/Cl）
```typescript
function estimateElectrolytes(state: DerivedLabState) {
  const { baselineNa, baselineK, nsMlInfused, lrMlInfused, totalFluidMl } = state;
  
  // Dilutional hyponatremia from large fluid volumes
  const dilutionFactor = 1 - Math.min(0.1, totalFluidMl / 50000);
  
  // NS → hyperchloremic metabolic acidosis risk
  const nsChlorideLoad = nsMlInfused > 3000 ? 2 : 0; // Cl bump
  
  // K: drops with large fluid + diuresis; rises with acidosis + renal failure
  const kShift = (state.pH < 7.3 ? 0.5 : 0) - (totalFluidMl > 3000 ? 0.3 : 0);
  
  return {
    na: Math.round(baselineNa * dilutionFactor),
    k: +(baselineK + kShift).toFixed(1),
    cl: Math.round(104 + nsChlorideLoad),
  };
}
```

### 1.3 Dynamic Lab Results 架構

#### 核心概念：Lab Snapshot System

玩家下 lab order → 等 turnaround time → 系統在那個時間點**從 BioGears 當前狀態取一個 snapshot** → 用 formulas 計算所有值 → 顯示結果。

```typescript
// 新增 interface
interface DerivedLabState {
  // From BioGears
  pH: number;
  paCO2: number;
  paO2: number;
  hgb: number;
  lactateMgDL: number;
  spo2Fraction: number;
  bloodVolumeMl: number;
  temperature: number;
  cardiacOutput: number;
  ejectionFraction: number;
  uopMlPerMin: number;
  map: number;
  carricoIndex: number;
  
  // Tracked by simulator (cumulative actions)
  bloodVolumeLossPct: number;     // cumulative loss / baseline
  pRBCUnitsGiven: number;
  ffpUnitsGiven: number;
  pltUnitsGiven: number;
  cryoUnitsGiven: number;
  caGluconateGiven_g: number;
  caChlGiven_g: number;
  protamineGivenMg: number;
  heparinResidualUnits: number;
  timeSinceBypass_min: number;
  txaGiven: boolean;
  vitK_given: boolean;
  nsMlInfused: number;
  lrMlInfused: number;
  totalFluidMl: number;
  avgMAP_last30min: number;
  severity: number;
  
  // Scenario baseline
  baselinePlt: number;
  baselineINR: number;
  baselineFib: number;
  baselineICa: number;
  baselineACT: number;
  baselineBUN: number;
  baselineCr: number;
  baselineNa: number;
  baselineK: number;
  baselineWBC: number;
}

interface DynamicLabEngine {
  /** Take current BioGears state + cumulative actions → compute all lab values */
  computeLabPanel(panelId: string, bgState: BioGearsState, actionLog: ActionLog): LabPanel;
  
  /** Get the DerivedLabState at current moment */
  getCurrentDerivedState(bgState: BioGearsState, actionLog: ActionLog): DerivedLabState;
}
```

#### 臨床教學場景示範

| 玩家動作 | BioGears 變化 | Derived Lab 變化 | 教學目的 |
|---------|-------------|-----------------|---------|
| 持續出血 200mL/hr × 1hr | blood_volume ↓, pH ↓, Lactate ↑ | Hgb ↓, Plt ↓ (dilution), INR ↑, Fib ↓ | 出血→coagulopathy惡性循環 |
| 輸 pRBC 4U | blood_volume ↑, Hgb ↑ | iCa ↓ (citrate), Plt 不變(dilution offset) | Citrate toxicity |
| 給 Protamine 50mg | — | ACT ↓ → 正常化 | Heparin reversal |
| 給 TXA 1g | — | TEG LY30 ↓ | Anti-fibrinolysis |
| 給 Cryo 10U | — | Fib ↑ ~100, TEG MA ↑ | Fibrinogen replacement |
| 給 CaCl 1g | — | iCa ↑ 0.15 | Ca replacement potency |
| 體溫降至 34°C | temperature ↓ | INR ↑ (enzyme kinetics), ACT ↑, TEG all worse | 死亡三角 |
| 給 warming blanket | temperature slowly ↑ | INR improves if T > 35 | Temperature management |
| MAP < 60 持續 30min | MAP ↓, UOP ↓ | BUN/Cr ↑ (prerenal) | Organ perfusion |

### 1.4 與現有系統的相容性

#### 向下相容策略

```typescript
// In scenario definition:
interface ProScenario {
  // ... existing fields ...
  
  // NEW: lab generation mode
  labMode: "static" | "dynamic";
  // "static" = 使用現有 availableLabs（舊 scenario 不用改）
  // "dynamic" = 從 BioGears + derived formulas 生成
  
  // NEW: baseline values for derived formulas
  labBaselines?: {
    plt: number;     // K/μL
    inr: number;
    fib: number;     // mg/dL
    ica: number;     // mmol/L
    act: number;     // sec
    bun: number;     // mg/dL
    cr: number;      // mg/dL
    na: number;      // mEq/L
    k: number;       // mEq/L
    wbc: number;     // K/μL
    heparinResidualUnits: number;
    timeSinceBypass_min: number;
  };
  
  // Existing field — still works if labMode = "static"
  availableLabs: Record<string, LabPanel>;
}
```

Lab result 生成的決策流程：
```
lab order 下單
  ↓
labMode === "static"?
  → YES: 用 scenario.availableLabs[panelId] (現有行為)
  → NO: 等 turnaround time → 取 BioGears snapshot → computeLabPanel()
```

---

## 2. Imaging 整合方案

### 2.1 L1：靜態圖庫（CXR）

#### CXR 圖片分類

需要準備以下臨床狀態的 CXR 圖片：

| 臨床狀態 | 圖片描述 | BioGears Mapping Rule |
|---------|---------|---------------------|
| **Normal postop** | Median sternotomy wires, slight mediastinal widening, clear lungs | DEFAULT — baseline |
| **Hemothorax** | Unilateral or bilateral opacification, meniscus sign | `blood_volume_loss > 15%` AND `hemorrhage_compartment === "chest"` |
| **Widened mediastinum** | Mediastinal widening > 8cm | State: Tamponade（blood accumulating in pericardium） |
| **Pulmonary edema** | Bilateral perihilar infiltrates, Kerley B lines, cephalization | `carricoIndex < 200` OR fluid overload (I/O > +3000) |
| **Tension pneumothorax** | Unilateral hyperexpansion, mediastinal shift | Scenario event trigger |
| **Pleural effusion** | Blunted costophrenic angle, fluid level | Scenario + fluid balance |
| **ET tube malposition** | Tube too high/low | Scenario complication event |
| **Normal post-extubation** | Clear lungs, no tubes | Post-extubation scenario phase |

#### BioGears → CXR Selection Logic

```typescript
interface CXRSelector {
  selectCXR(state: BioGearsState, clinicalState: ClinicalState): CXRImage;
}

function selectCXR(bgState: BioGearsState, clinState: ClinicalState): string {
  const bv = bgState.vitals.blood_volume_mL;
  const baseline = 5500;
  const lossPercent = (baseline - bv) / baseline;
  const carrico = bgState.respiratory?.carrico_index ?? 400;
  
  // Priority order (most dangerous first)
  if (clinState === "tension_ptx")       return "cxr_tension_ptx";
  if (clinState === "tamponade")         return "cxr_widened_mediastinum";
  if (lossPercent > 0.15 && clinState === "hypovolemic") return "cxr_hemothorax";
  if (carrico < 200)                     return "cxr_pulmonary_edema";
  if (clinState === "pleural_effusion")  return "cxr_pleural_effusion";
  return "cxr_normal_postop";
}
```

#### 圖源建議

| 來源 | URL | 特點 | 授權 |
|------|-----|------|------|
| **Radiopaedia** | radiopaedia.org | 最大醫學影像庫，community-contributed | CC BY-NC-SA（教學可用） |
| **NIH Open-i** | openi.nlm.nih.gov | NIH 開放影像 | Public domain |
| **MIMIC-CXR** | physionet.org/content/mimic-cxr | 377K CXR images | PhysioNet Credentialed |
| **CheXpert** | stanfordmlgroup.github.io/competitions/chexpert | Stanford 標記 CXR | Research use |
| **手繪 / AI 生成** | — | 避免版權問題，風格一致 | Full ownership |

**推薦**：Phase 1 用 Radiopaedia 精選 8 張代表圖（教學用 fair use）；Phase 2 考慮 AI 生成一套統一風格的 CXR 教學圖。

### 2.2 L2：Canvas 動態（Echo / POCUS）

#### 2.2.1 Cardiac POCUS（簡化 4-Chamber View）

用 HTML Canvas / SVG 動畫呈現簡化的心臟超音波：

```typescript
interface CardiacPOCUSParams {
  ef: number;                    // 0-0.7, from BioGears
  pericardialEffusion: boolean;  // from ClinicalState
  effusionVolume: number;        // mL estimated (0-500+)
  rvlvRatio: number;             // RV:LV size ratio (normal ~0.6)
  wallMotion: "normal" | "hypokinetic" | "akinetic";
  hrBpm: number;                 // animation speed
}

// EF → 收縮幅度 mapping
function efToContraction(ef: number): number {
  // EF 0.55-0.70 → normal contraction amplitude (30-40% wall excursion)
  // EF 0.30-0.55 → reduced (15-30%)
  // EF < 0.30    → severely reduced (5-15%)
  // EF > 0.55    → hyperdynamic (hypovolemia!) (40-50%)
  if (ef > 0.55) return 0.35 + (ef - 0.55) * 1.0;  // hyperdynamic
  if (ef > 0.30) return 0.15 + (ef - 0.30) * 0.6;
  return 0.05 + ef * 0.33;
}

// Pericardial effusion 動態
function effusionAppearance(volume: number): EffusionVisual {
  if (volume < 50)  return { visible: false };
  if (volume < 200) return { visible: true, thickness: "trace", color: "anechoic_thin" };
  if (volume < 500) return { visible: true, thickness: "moderate", color: "anechoic", 
                              rvCollapse: false };
  return { visible: true, thickness: "large", color: "anechoic_with_fibrin",
           rvCollapse: true, // Tamponade physiology!
           swingingHeart: true };
}

// RV/LV ratio
function rvlvRatio(state: BioGearsState, clinState: ClinicalState): number {
  // Normal: 0.6
  // RV dilation (PE, RV failure): > 1.0
  // RV compression (tamponade): < 0.4
  if (clinState === "tamponade") return 0.3 + Math.random() * 0.1; // RV compressed
  if (clinState === "rv_failure") return 1.2;
  return 0.6;
}
```

**Canvas 動畫元素**：
1. 四腔室輪廓（LV, RV, LA, RA）— 簡化為橢圓
2. 心室壁在 systole/diastole 之間週期性移動（由 HR 控制速度，EF 控制幅度）
3. Pericardial effusion = 心臟外圍的暗色（anechoic）區域
4. Tamponade = 心臟搖擺（swinging heart）+ RV diastolic collapse
5. 整體加 ultrasound-like 灰階 noise 濾鏡

#### 2.2.2 IVC POCUS

```typescript
interface IVCParams {
  cvp: number;           // from BioGears (mmHg)
  rr: number;            // breaths/min → respiratory cycle
  isVentilated: boolean; // mechanical ventilation reverses collapsibility
}

// IVC 直徑 mapping
function ivcDiameter(cvp: number): { max: number; min: number } {
  // CVP < 5:  IVC < 1.0 cm, >50% collapse (hypovolemic)
  // CVP 5-10: IVC 1.0-2.0 cm, 30-50% collapse (euvolemic)
  // CVP > 10: IVC > 2.0 cm, <30% collapse (hypervolemic)
  // CVP > 15: IVC > 2.5 cm, minimal collapse (elevated RAP)
  
  const baseDiameter = Math.min(3.0, Math.max(0.5, 0.5 + cvp * 0.15));
  
  let collapsibility: number;
  if (cvp < 5) collapsibility = 0.55;       // >50% collapse
  else if (cvp < 10) collapsibility = 0.35;  // 30-50%
  else if (cvp < 15) collapsibility = 0.15;  // <30%
  else collapsibility = 0.05;                 // minimal

  return {
    max: baseDiameter,
    min: baseDiameter * (1 - collapsibility),
  };
}

// IVC 動畫
// Canvas 繪製一個管狀結構，直徑隨呼吸週期在 max/min 間變化
// 吸氣相 → IVC 變小（spontaneous breathing）或變大（mechanical ventilation）
// 呼氣相 → 反向

// Fluid responsiveness 指標
function ivcCollapsibilityIndex(params: IVCParams): {
  ci: number;        // collapsibility index (%)
  interpretation: string;
  fluidResponsive: boolean;
} {
  const { max, min } = ivcDiameter(params.cvp);
  const ci = ((max - min) / max) * 100;
  
  return {
    ci,
    interpretation: ci > 50 
      ? "IVC 高度塌陷 — 嚴重 volume depletion，fluid responsive"
      : ci > 30 
      ? "IVC 中度塌陷 — 可能 fluid responsive"
      : ci > 15
      ? "IVC 輕度塌陷 — 可能已 volume loaded"
      : "IVC 幾乎不塌陷 — volume overloaded 或 elevated RAP",
    fluidResponsive: ci > 40,
  };
}
```

#### 2.2.3 Lung POCUS

```typescript
interface LungPOCUSParams {
  carricoIndex: number;     // PaO2/FiO2 from BioGears
  fluidBalance: number;     // net I/O balance (mL)
  pleuralEffusion: boolean; // from ClinicalState
  pneumothorax: boolean;    // from scenario event
}

function lungPOCUSFindings(params: LungPOCUSParams): LungPOCUSResult {
  const { carricoIndex, fluidBalance, pleuralEffusion, pneumothorax } = params;
  
  // B-lines: correlate with pulmonary edema
  let bLineCount: number;
  if (carricoIndex > 300 && fluidBalance < 2000) {
    bLineCount = 0; // Normal A-lines
  } else if (carricoIndex > 200 || fluidBalance > 2000) {
    bLineCount = 3; // Mild pulmonary edema
  } else if (carricoIndex > 100) {
    bLineCount = 6; // Moderate
  } else {
    bLineCount = 10; // Severe — "white lung"
  }
  
  // Sliding sign
  const slidingSign = !pneumothorax; // absent in PTX
  
  // A-lines vs B-lines
  const pattern = bLineCount === 0 ? "A-lines" : `B-lines (${bLineCount} per field)`;
  
  return {
    pattern,
    bLineCount,
    slidingSign,
    pleuralEffusion,
    finding: buildLungFindingText(bLineCount, slidingSign, pleuralEffusion),
    interpretation: buildLungInterpretation(bLineCount, slidingSign, pleuralEffusion),
  };
}
```

**Canvas 動畫**：
1. A-lines：水平亮線，等距重複（正常）
2. B-lines：從 pleural line 向下延伸的垂直亮線（laser-like），數量隨水腫程度
3. Sliding sign：pleural line 的水平滑動動畫（present = 正常）
4. Pleural effusion：下方暗色（anechoic）液體區域

### 2.3 L3：12-Lead ECG 合成

#### ECG Morphology Database

```typescript
interface ECGMorphology {
  rhythm: string;
  rate: number;
  pWave: boolean;
  prInterval: number;
  qrsDuration: number;
  stSegment: "normal" | "elevated" | "depressed";
  tWave: "normal" | "inverted" | "peaked" | "flattened";
  qtc: number;
  leadSpecificChanges?: Record<string, LeadChange>;
}

// BioGears heart_rhythm → ECG mapping
const RHYTHM_TO_ECG: Record<string, Partial<ECGMorphology>> = {
  "NormalSinus": {
    rhythm: "Normal Sinus Rhythm",
    pWave: true,
    prInterval: 160,
    qrsDuration: 80,
    stSegment: "normal",
    tWave: "normal",
  },
  "SinusTachycardia": {
    rhythm: "Sinus Tachycardia",
    pWave: true,
    prInterval: 140, // shortened at high rates
    qrsDuration: 80,
    stSegment: "normal",
    tWave: "normal",
  },
  "SinusBradycardia": {
    rhythm: "Sinus Bradycardia",
    pWave: true,
    prInterval: 180,
    qrsDuration: 80,
    stSegment: "normal",
    tWave: "normal",
  },
  "AtrialFibrillation": {
    rhythm: "Atrial Fibrillation",
    pWave: false,
    prInterval: 0, // no discrete P waves
    qrsDuration: 80,
    stSegment: "normal",
    tWave: "normal",
  },
  "VentricularTachycardia": {
    rhythm: "Ventricular Tachycardia",
    pWave: false,
    prInterval: 0,
    qrsDuration: 160, // wide QRS
    stSegment: "normal",
    tWave: "inverted",
  },
  "VentricularFibrillation": {
    rhythm: "Ventricular Fibrillation",
    pWave: false,
    prInterval: 0,
    qrsDuration: 0, // chaotic
    stSegment: "normal",
    tWave: "normal",
  },
  "Asystole": {
    rhythm: "Asystole",
    pWave: false,
    prInterval: 0,
    qrsDuration: 0,
    stSegment: "normal",
    tWave: "normal",
  },
  "PulselessElectricalActivity": {
    rhythm: "PEA",
    pWave: true,    // organized rhythm but no pulse
    prInterval: 160,
    qrsDuration: 100, // slightly wide
    stSegment: "normal",
    tWave: "normal",
  },
};
```

#### Contextual ST/T Changes

```typescript
function applyContextualChanges(
  baseMorphology: ECGMorphology,
  bgState: BioGearsState,
  clinState: ClinicalState
): ECGMorphology {
  const result = { ...baseMorphology };
  
  // Hyperkalemia (K > 5.5)
  const k = estimateElectrolytes(deriveState(bgState)).k;
  if (k > 6.5) {
    result.tWave = "peaked";
    result.qrsDuration = Math.max(result.qrsDuration, 120); // widened QRS
    result.prInterval = Math.max(result.prInterval, 220);
  } else if (k > 5.5) {
    result.tWave = "peaked";
  }
  
  // Hypocalcemia (iCa < 1.0) → prolonged QTc
  const ica = estimateIonizedCalcium(deriveState(bgState));
  if (ica < 1.0) {
    result.qtc = 500 + (1.0 - ica) * 200; // prolonged
  }
  
  // Hypothermia → Osborn (J) waves
  if (bgState.vitals.temperature < 33) {
    result.leadSpecificChanges = {
      ...result.leadSpecificChanges,
      _global: { osbornWave: true },
    };
  }
  
  // Tamponade → low voltage + electrical alternans
  if (clinState === "tamponade") {
    result.leadSpecificChanges = {
      ...result.leadSpecificChanges,
      _global: { lowVoltage: true, electricalAlternans: true },
    };
  }
  
  // Post-op CABG → ST changes in grafted territory (scenario-defined)
  // This remains scenario-level
  
  return result;
}
```

**ECG 渲染方式**：
- Phase 1：文字描述（like current POCUS）+ 靜態 ECG 圖庫
- Phase 2：Canvas 繪製簡化 12-lead（用 ECG generation algorithm）
- Phase 3：animated real-time ECG strip（monitor view）

---

## 3. State Classifier 設計

### 3.1 Clinical State 分類器

BioGears 輸出連續數值，但 imaging findings 需要離散臨床狀態。State classifier 是橋接層。

```typescript
type ClinicalState = 
  | "normal"
  | "hypovolemic"
  | "tamponade"
  | "cardiogenic"
  | "septic"
  | "ards"
  | "tension_ptx"
  | "mixed";

interface StateClassifierInput {
  // From BioGears
  map: number;
  hr: number;
  cvp: number;
  cardiacOutput: number;
  ef: number;
  bloodVolumeMl: number;
  temperature: number;
  carricoIndex: number;
  
  // From scenario
  hemorrhageActive: boolean;
  pericardialEffusion: boolean;
  sepsisActive: boolean;
  pneumothorax: boolean;
}

function classifyClinicalState(input: StateClassifierInput): {
  primary: ClinicalState;
  secondary?: ClinicalState;
  confidence: number;
} {
  const scores: Record<ClinicalState, number> = {
    normal: 0,
    hypovolemic: 0,
    tamponade: 0,
    cardiogenic: 0,
    septic: 0,
    ards: 0,
    tension_ptx: 0,
    mixed: 0,
  };
  
  const baselineVolume = 5500;
  const volumeLoss = (baselineVolume - input.bloodVolumeMl) / baselineVolume;
  
  // ── Hypovolemic ──
  if (volumeLoss > 0.15) scores.hypovolemic += 30;
  if (volumeLoss > 0.25) scores.hypovolemic += 20;
  if (input.cvp < 5) scores.hypovolemic += 15;
  if (input.hr > 100 && input.map < 65) scores.hypovolemic += 15;
  if (input.hemorrhageActive) scores.hypovolemic += 20;
  
  // ── Tamponade ──
  if (input.pericardialEffusion) scores.tamponade += 40;
  if (input.cvp > 12 && input.map < 65) scores.tamponade += 20;
  // Beck's triad: hypotension + elevated JVP + muffled heart
  if (input.map < 60 && input.cvp > 15) scores.tamponade += 20;
  // Pulsus paradoxus (wide PP variation) — inferred
  if (input.ef < 0.35 && input.cvp > 12) scores.tamponade += 10;
  
  // ── Cardiogenic ──
  if (input.ef < 0.35) scores.cardiogenic += 30;
  if (input.cardiacOutput < 3.5) scores.cardiogenic += 20;
  if (input.cvp > 12 && !input.pericardialEffusion) scores.cardiogenic += 15;
  if (input.map < 65 && input.cvp > 10) scores.cardiogenic += 15;
  
  // ── Septic ──
  if (input.sepsisActive) scores.septic += 40;
  if (input.temperature > 38.5 || input.temperature < 36) scores.septic += 15;
  if (input.hr > 110 && input.map < 65) scores.septic += 10;
  // Warm shock: high CO + low SVR
  if (input.cardiacOutput > 6 && input.map < 65) scores.septic += 20;
  
  // ── ARDS ──
  if (input.carricoIndex < 200) scores.ards += 30;
  if (input.carricoIndex < 100) scores.ards += 30;
  
  // ── Tension PTX ──
  if (input.pneumothorax) scores.tension_ptx += 60;
  
  // ── Normal ──
  if (input.map > 65 && input.hr < 100 && input.cvp >= 5 && input.cvp <= 12) {
    scores.normal += 40;
  }
  
  // Find primary and secondary
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primary, primaryScore] = sorted[0];
  const [secondary, secondaryScore] = sorted[1];
  
  return {
    primary: primary as ClinicalState,
    secondary: secondaryScore > 20 ? secondary as ClinicalState : undefined,
    confidence: primaryScore / (primaryScore + secondaryScore + 1),
  };
}
```

### 3.2 State → Imaging Findings Mapping

| Clinical State | Cardiac POCUS | IVC | Lung | CXR | ECG |
|---------------|--------------|-----|------|-----|-----|
| **Normal** | EF >55%, no effusion | 1.5-2cm, 30-50% collapse | A-lines | Normal postop | NSR |
| **Hypovolemic** | Hyperdynamic LV, empty chambers | <1cm, >50% collapse | A-lines (dry) | ± Hemothorax | Sinus tachy |
| **Tamponade** | Pericardial effusion, RV collapse, swinging heart | >2.5cm, no collapse (elevated RAP) | A-lines | Widened mediastinum | Low voltage, electrical alternans |
| **Cardiogenic** | ↓ EF, dilated LV, ± MR | >2cm, <30% collapse | B-lines (edema) | Pulmonary edema | ± ST changes, wide QRS |
| **Septic** | Hyperdynamic (early) or ↓ EF (late) | Variable | ± B-lines | Variable | Sinus tachy, ± AF |
| **ARDS** | Normal or ↓ EF | Variable | Bilateral B-lines, white-out | Bilateral infiltrates | Sinus tachy |
| **Tension PTX** | ± RV dilation | Variable | No sliding sign, no B-lines | Hyperexpansion, shift | Sinus tachy, ± low voltage |

---

## 4. 實作優先順序

### Phase 1：Dynamic Labs（最高價值，2 週）

**為什麼第一**：Labs 是 ICU 模擬的核心 gameplay loop（抽血 → 看結果 → 做決策）。動態 lab 讓每次 playthrough 不同，直接提升教學價值。

| 項目 | 工作量 | 教學價值 |
|------|--------|---------|
| `DerivedLabState` interface + computation | 2 天 | ★★★★★ |
| ABG panel（pH, PaO2, PaCO2, HCO3, BE, Lactate）from BioGears | 1 天 | ★★★★★ |
| CBC panel（Hgb from BG, Hct/Plt/WBC derived） | 1 天 | ★★★★★ |
| Coag panel（INR/aPTT/Fib derived） | 1 天 | ★★★★★ |
| iCa（citrate toxicity model） | 0.5 天 | ★★★★★ |
| ACT（heparin-protamine model） | 0.5 天 | ★★★★★ |
| Action tracking system（累計 pRBC, FFP, Ca, protamine...） | 1 天 | 基礎 |
| `LabResultPanel` 改用 dynamic source | 1 天 | 基礎 |
| BCS + Electrolytes derived | 1 天 | ★★★☆☆ |
| TEG/ROTEM derived | 1 天 | ★★★★☆ |
| 向下相容 `labMode: "static"` | 0.5 天 | 基礎 |
| 測試 + 校準 | 2 天 | 品質 |

**Phase 1 交付物**：
- `lib/simulator/engine/dynamic-labs.ts` — 所有 derived formulas
- `lib/simulator/engine/action-tracker.ts` — 累計治療動作追蹤
- `lib/simulator/types.ts` — 新增 `DerivedLabState`, `labMode`, `labBaselines`
- 修改 `store.ts` — lab result 從 dynamic engine 取值
- 修改 `LabResultPanel.tsx` — 無需大改（接口不變）
- 修改 `postop-bleeding.ts` — 新增 `labMode: "dynamic"` + baselines

### Phase 2：Dynamic POCUS + IVC（高價值，2 週）

**為什麼第二**：POCUS 是心外 R 最需要練的技能。從純文字升級到 Canvas 動態，教學價值飛躍。

| 項目 | 工作量 | 教學價值 |
|------|--------|---------|
| State Classifier（`classifyClinicalState()`） | 2 天 | 基礎（POCUS 和 CXR 都需要） |
| Cardiac POCUS Canvas（4-chamber 簡化動畫） | 3 天 | ★★★★★ |
| IVC Canvas（直徑 + collapsibility 動畫） | 2 天 | ★★★★★ |
| Lung POCUS Canvas（A-lines / B-lines / sliding） | 2 天 | ★★★★☆ |
| POCUSModal.tsx 重構（整合 Canvas） | 1 天 | 基礎 |
| 測試 + 校準 | 2 天 | 品質 |

**Phase 2 交付物**：
- `lib/simulator/engine/state-classifier.ts`
- `components/simulator/pro/pocus/CardiacCanvas.tsx`
- `components/simulator/pro/pocus/IVCCanvas.tsx`
- `components/simulator/pro/pocus/LungCanvas.tsx`
- 修改 `POCUSModal.tsx` — 整合 Canvas 組件

### Phase 3：CXR 圖庫 + ECG + 打磨（Nice to have，2-3 週）

| 項目 | 工作量 | 教學價值 |
|------|--------|---------|
| CXR 圖庫蒐集 + mapping logic | 3 天 | ★★★☆☆ |
| ImagingModal CXR 圖片展示 | 1 天 | ★★★☆☆ |
| 12-Lead ECG 文字描述 + 圖庫 | 2 天 | ★★★☆☆ |
| ECG contextual changes（K+, Ca, temp） | 2 天 | ★★★★☆ |
| ECG Canvas rendering（簡化 12-lead） | 5 天 | ★★★☆☆ |
| Animated ECG strip（monitor view） | 3 天 | ★★☆☆☆ |

---

## 5. 技術架構

### 5.1 數據流

```
BioGears WS Server (8770)
    ↓ WebSocket stream (1 Hz)
BioGearsClient.ts
    ↓ BioGearsState
syncBioGearsToStore()
    ↓
┌─────────────────────────────────────────────┐
│              zustand store                   │
│                                              │
│  biogearsState ─→ ActionTracker              │
│       ↓              ↓                       │
│  DynamicLabEngine    │                       │
│       ↓              ↓                       │
│  computeLabPanel() ← DerivedLabState         │
│       ↓                                      │
│  LabResultPanel.tsx                           │
│                                              │
│  StateClassifier ─→ ClinicalState            │
│       ↓                                      │
│  ┌─── POCUS Canvas (Cardiac/IVC/Lung)        │
│  ├─── CXR Selector                           │
│  └─── ECG Generator                          │
│       ↓                                      │
│  POCUSModal / ImagingModal / ECGModal         │
└─────────────────────────────────────────────┘
```

### 5.2 新增 TypeScript Interfaces

```typescript
// ──── lib/simulator/types.ts 新增 ────

// Lab generation mode
export type LabMode = "static" | "dynamic";

// Scenario lab baselines (for derived formulas)
export interface LabBaselines {
  plt: number;        // K/μL (e.g., 185)
  inr: number;        // (e.g., 1.0)
  fib: number;        // mg/dL (e.g., 280)
  ica: number;        // mmol/L (e.g., 1.18)
  act: number;        // sec (e.g., 120)
  bun: number;        // mg/dL (e.g., 22)
  cr: number;         // mg/dL (e.g., 1.2)
  na: number;         // mEq/L (e.g., 140)
  k: number;          // mEq/L (e.g., 4.0)
  wbc: number;        // K/μL (e.g., 8.5)
  troponin: number;   // ng/mL (e.g., 0.45, postop baseline)
  glucose: number;    // mg/dL (e.g., 130)
  heparinResidualUnits: number;  // (e.g., 5000)
  timeSinceBypass_min: number;   // (e.g., 120)
}

// Action tracker — cumulative treatment actions
export interface ActionLog {
  pRBCUnitsGiven: number;
  ffpUnitsGiven: number;
  pltUnitsGiven: number;
  cryoUnitsGiven: number;
  caGluconateGiven_g: number;
  caChlGiven_g: number;
  protamineGivenMg: number;
  txaGiven: boolean;
  vitKGiven: boolean;
  nsMlInfused: number;
  lrMlInfused: number;
  totalFluidMl: number;
  totalBloodProductsMl: number;
  warmingBlanketActive: boolean;
}

// Clinical state classification
export type ClinicalState = 
  | "normal" | "hypovolemic" | "tamponade" 
  | "cardiogenic" | "septic" | "ards" | "tension_ptx" | "mixed";

export interface ClinicalStateResult {
  primary: ClinicalState;
  secondary?: ClinicalState;
  confidence: number;
}

// POCUS Canvas props (replacing text-only POCUSView)
export interface DynamicPOCUSView {
  type: "cardiac" | "lung" | "ivc";
  // Existing text fallback
  finding: string;
  interpretation: string;
  // NEW: dynamic params for Canvas rendering
  canvasParams?: CardiacCanvasParams | IVCCanvasParams | LungCanvasParams;
}

export interface CardiacCanvasParams {
  ef: number;
  pericardialEffusion: boolean;
  effusionVolumeMl: number;
  rvlvRatio: number;
  wallMotion: "normal" | "hypokinetic" | "akinetic";
  hrBpm: number;
}

export interface IVCCanvasParams {
  maxDiameterCm: number;
  minDiameterCm: number;
  collapsibilityIndex: number;
  rrPerMin: number;
  isVentilated: boolean;
}

export interface LungCanvasParams {
  bLineCount: number;
  slidingSign: boolean;
  pleuralEffusion: boolean;
  pattern: "A-lines" | "B-lines";
}

// ECG
export interface ECGResult {
  rhythm: string;
  rate: number;
  morphology: ECGMorphology;
  interpretation: string;
  // For canvas rendering
  waveformData?: number[];  // Phase 3
}
```

### 5.3 新增檔案結構

```
lib/simulator/
├── engine/
│   ├── biogears-client.ts        # (existing)
│   ├── biogears-engine.ts        # (existing)
│   ├── dynamic-labs.ts           # NEW — all derived lab formulas
│   ├── action-tracker.ts         # NEW — cumulative action logging
│   ├── state-classifier.ts       # NEW — BioGears → ClinicalState
│   ├── ecg-generator.ts          # NEW (Phase 3)
│   └── pocus-params.ts           # NEW — BioGears → POCUS Canvas params
├── types.ts                      # (modified — new interfaces)
├── store.ts                      # (modified — integrate dynamic labs)
└── scenarios/pro/
    └── postop-bleeding.ts        # (modified — labMode + baselines)

components/simulator/pro/
├── pocus/                        # NEW directory
│   ├── CardiacCanvas.tsx         # NEW (Phase 2)
│   ├── IVCCanvas.tsx             # NEW (Phase 2)
│   └── LungCanvas.tsx            # NEW (Phase 2)
├── POCUSModal.tsx                # (modified — integrate Canvas)
├── ImagingModal.tsx              # (modified — CXR images)
├── LabResultPanel.tsx            # (minimal changes — same interface)
├── LabOrderModal.tsx             # (unchanged)
└── ECGModal.tsx                  # NEW (Phase 3)

public/simulator/
├── cxr/                          # NEW — CXR image library
│   ├── normal_postop.webp
│   ├── hemothorax.webp
│   ├── widened_mediastinum.webp
│   ├── pulmonary_edema.webp
│   ├── tension_ptx.webp
│   ├── pleural_effusion.webp
│   └── et_malposition.webp
└── ecg/                          # NEW (Phase 3) — ECG templates
    ├── nsr.svg
    ├── afib.svg
    ├── vtach.svg
    └── ...
```

### 5.4 Store 整合

```typescript
// store.ts 修改重點

interface ProGameState {
  // ... existing ...
  
  // NEW
  actionLog: ActionLog;           // cumulative treatment actions
  clinicalState: ClinicalStateResult | null;
  
  // Modified
  computeLabResult: (panelId: string) => LabPanel;  // dynamic or static
}

// In the store:
computeLabResult: (panelId: string) => {
  const state = get();
  const scenario = state.scenario;
  
  if (!scenario || scenario.labMode === "static") {
    // Backward compatible: use hardcoded availableLabs
    return scenario?.availableLabs[panelId] ?? null;
  }
  
  // Dynamic mode: compute from BioGears + action log
  const bgState = getLastBioGearsState();
  if (!bgState) return scenario.availableLabs[panelId] ?? null; // fallback
  
  return computeLabPanel(panelId, bgState, state.actionLog, scenario.labBaselines!);
}
```

### 5.5 與現有 Scenario System 的向下相容

1. **`labMode` 默認 `"static"`** — 所有現有 scenario 不需改動
2. **`availableLabs` 依然存在** — 作為 static fallback 和 UI 參考
3. **`availablePOCUS` 增加 `canvasParams`** — optional field，沒有就用文字
4. **`availableImaging` 增加 `imageUrl`** — optional，沒有就用文字描述
5. **BioGears 離線** — 自動 fallback 到 static mode（graceful degradation）

```typescript
// Graceful degradation
function getLabResult(panelId: string): LabPanel {
  const bgState = getLastBioGearsState();
  const scenario = useProGameStore.getState().scenario;
  
  // BioGears available + dynamic mode → compute
  if (bgState && scenario?.labMode === "dynamic" && scenario.labBaselines) {
    try {
      return computeLabPanel(panelId, bgState, getActionLog(), scenario.labBaselines);
    } catch (e) {
      console.warn("[DynamicLabs] Computation failed, falling back to static:", e);
    }
  }
  
  // Fallback to scenario-defined static labs
  return scenario?.availableLabs[panelId] ?? createEmptyPanel(panelId);
}
```

---

## 附錄 A：BioGears Field 完整對照表

| BioGears WebSocket Field | 型別 | 單位 | 用途 |
|-------------------------|------|------|------|
| `vitals.hr` | number | bpm | ECG rate, Vital |
| `vitals.sbp` | number | mmHg | Vital |
| `vitals.dbp` | number | mmHg | Vital |
| `vitals.map` | number | mmHg | State classifier, Renal |
| `vitals.spo2` | number | fraction | Vital, ABG |
| `vitals.cvp` | number | mmHg | IVC diameter, State classifier |
| `vitals.rr` | number | /min | IVC animation, Vital |
| `vitals.temperature` | number | °C | Death triangle, INR modifier, TEG |
| `vitals.etco2` | number | fraction | Vital |
| `vitals.cardiac_output` | number | L/min | State classifier, Echo |
| `vitals.blood_volume_mL` | number | mL | Volume loss %, Plt/INR/Fib derivation |
| `vitals.ejection_fraction` | number | fraction | Cardiac POCUS, State classifier |
| `vitals.tidal_volume_mL` | number | mL | Vent monitoring |
| `vitals.total_lung_volume_mL` | number | mL | Respiratory |
| `labs.pH` | number | — | ABG, BE calculation |
| `labs.spo2_fraction` | number | fraction | ABG SaO2 |
| `labs.hgb_g_per_dL` | number | g/dL | CBC Hgb, Hct derivation |
| `labs.lactate_mg_per_dL` | number | mg/dL | ABG Lactate, Severity |
| `labs.urine_production_mL_per_min` | number | mL/min | UOP, Renal |
| `respiratory.pao2_mmHg` | number | mmHg | ABG PaO2 |
| `respiratory.paco2_mmHg` | number | mmHg | ABG PaCO2, HCO3 calc |
| `respiratory.carrico_index` | number | mmHg | ARDS classifier, Lung POCUS |
| `respiratory.alveolar_ventilation_L_per_min` | number | L/min | Vent adequacy |
| `patient.heart_rhythm` | string | — | ECG morphology |
| `patient.event_cardiac_arrest` | boolean | — | Death trigger |

## 附錄 B：教學價值矩陣

| 功能 | 教學價值 | 實作難度 | 優先度 |
|------|---------|---------|--------|
| Dynamic Hgb/Hct（輸血前後變化） | ★★★★★ | ★★☆☆☆ | 🔥 P1 |
| Dynamic Lactate/pH（灌流指標） | ★★★★★ | ★☆☆☆☆ | 🔥 P1 |
| Dynamic iCa（citrate toxicity 教學） | ★★★★★ | ★★☆☆☆ | 🔥 P1 |
| Dynamic ACT（protamine 教學） | ★★★★★ | ★★☆☆☆ | 🔥 P1 |
| Dynamic INR/Fib（coagulopathy 教學） | ★★★★★ | ★★★☆☆ | 🔥 P1 |
| Dynamic Plt（dilutional 教學） | ★★★★☆ | ★★☆☆☆ | 🔥 P1 |
| Dynamic TEG（goal-directed transfusion） | ★★★★☆ | ★★★☆☆ | 🔥 P1 |
| Cardiac POCUS Canvas（tamponade 教學） | ★★★★★ | ★★★★☆ | 🔥 P2 |
| IVC Canvas（volume status 教學） | ★★★★★ | ★★★☆☆ | 🔥 P2 |
| Lung POCUS Canvas（edema/PTX 教學） | ★★★★☆ | ★★★☆☆ | P2 |
| State Classifier | ★★★★☆ | ★★★☆☆ | P2（POCUS 基礎） |
| CXR 圖庫 | ★★★☆☆ | ★★☆☆☆ | P3 |
| 12-Lead ECG 文字 | ★★★☆☆ | ★★☆☆☆ | P3 |
| 12-Lead ECG Canvas | ★★☆☆☆ | ★★★★★ | P3 |
| Animated ECG strip | ★★☆☆☆ | ★★★★☆ | P3 |

---

*Design complete. Phase 1（Dynamic Labs）可立即動工 — 所有 formula 已定義，interface 已設計，只需實作 + 校準。*
