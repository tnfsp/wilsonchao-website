// ICU 值班模擬器 Pro — Patient Engine
// 純函數，不依賴 React。
// 負責：vitals 計算、severity curve、死亡三角、effect 管理、I/O balance、chest tube。

import type {
  VitalSigns,
  PatientState,
  ActiveEffect,
  ChestTubeState,
  IOBalance,
  LethalTriadState,
  Pathology,
} from "../types";

// ============================================================
// 隨機噪音（±5%）
// ============================================================

/** 加入 ±5% 的隨機噪音，讓 vitals 更真實 */
function addNoise(value: number, noiseFraction: number = 0.05): number {
  const noise = (Math.random() * 2 - 1) * noiseFraction * value;
  return Math.round((value + noise) * 10) / 10;
}

/** 對整組 VitalSigns 加噪音（排除 aLineWaveform、spo2 特殊限制） */
function applyVitalNoise(vitals: VitalSigns): VitalSigns {
  return {
    ...vitals,
    hr: Math.round(addNoise(vitals.hr)),
    sbp: Math.round(addNoise(vitals.sbp)),
    dbp: Math.round(addNoise(vitals.dbp)),
    map: Math.round(addNoise(vitals.map)),
    // spo2 噪音小一點，且不超過 100
    spo2: Math.min(100, Math.round(addNoise(vitals.spo2, 0.01))),
    cvp: Math.round(addNoise(vitals.cvp) * 10) / 10,
    rr: Math.max(8, Math.round(addNoise(vitals.rr))),
    temperature: Math.round(addNoise(vitals.temperature, 0.005) * 10) / 10,
    etco2: vitals.etco2 != null ? Math.round(addNoise(vitals.etco2)) : undefined,
  };
}

// ============================================================
// Severity curve
// ============================================================

/**
 * 計算每分鐘的 severity 變化量。
 * - 無治療：+0.5 ~ +1.5 / min（依 pathology）
 * - 正確治療中：-0.3 ~ -1.0 / min
 * - 錯誤治療：可能 +0.2 ~ +0.8 / min
 * - 死亡三角 2+：額外 +0.5 / min
 */
export function computeSeverityDelta(
  currentSeverity: number,
  pathology: Pathology,
  activeEffects: ActiveEffect[],
  lethalTriad: LethalTriadState,
  minutesPassed: number = 1
): number {
  // Rate = severity points per game-minute when untreated.
  // With event-driven time (~30 game-min scenario over ~10 real-min),
  // we want severity to rise from 30→70 in ~25 min without treatment.
  // Target: ~1.6 pts/min → use 0.4 for surgical bleeding (was 1.2).
  const baseRates: Record<Pathology, number> = {
    surgical_bleeding: 0.4,
    coagulopathy: 0.3,
    tamponade: 0.6,
    lcos: 0.25,
    vasoplegia: 0.3,
    tension_pneumothorax: 0.8,
    postop_af: 0.1,
  };

  const untreatedRate = baseRates[pathology] ?? 1.0;

  // 計算 effect 貢獻
  let effectDelta = 0;
  for (const effect of activeEffects) {
    const sc = effect.severityChange ?? 0;
    if (effect.isCorrectTreatment) {
      effectDelta += sc; // sc 應為負值（改善）
    } else {
      effectDelta += Math.abs(sc) * 0.5; // 錯誤治療輕微惡化
    }
  }

  // 基礎每分鐘變化
  let delta = untreatedRate + effectDelta;

  // 死亡三角加速
  if (lethalTriad.count >= 2) {
    delta += 0.5;
  }
  if (lethalTriad.count === 3) {
    delta += 0.5; // 三角全滿額外加速
  }

  // severity 上限 100、下限 0
  const projected = currentSeverity + delta * minutesPassed;
  return Math.min(100, Math.max(0, projected)) - currentSeverity;
}

// ============================================================
// 死亡三角追蹤
// ============================================================

export interface LethalTriadInput {
  temperature: number;     // °C
  be?: number;             // Base Excess（ABG）
  inr?: number;
  fibrinogen?: number;     // mg/dL
}

/**
 * 根據體溫與 lab 數值判斷死亡三角各項狀態
 * Hypothermia：temp < 36°C
 * Acidosis：BE < -6
 * Coagulopathy：INR > 1.5 OR Fib < 150
 */
export function checkLethalTriad(input: LethalTriadInput): LethalTriadState {
  const hypothermia = input.temperature < 36;
  const acidosis = input.be != null ? input.be < -6 : false;
  const coagulopathy =
    (input.inr != null && input.inr > 1.5) ||
    (input.fibrinogen != null && input.fibrinogen < 150);

  const count = [hypothermia, acidosis, coagulopathy].filter(Boolean).length;

  return { hypothermia, acidosis, coagulopathy, count };
}

// ============================================================
// Effect 管理
// ============================================================

/**
 * 套用一個新 Effect（回傳新的 activeEffects 陣列）
 * 若同 id 已存在則覆蓋（重複開藥 = 重新計時）
 */
export function applyEffect(
  activeEffects: ActiveEffect[],
  newEffect: ActiveEffect
): ActiveEffect[] {
  const filtered = activeEffects.filter((e) => e.id !== newEffect.id);
  return [...filtered, newEffect];
}

/**
 * 移除已到期的 effects（startTime + duration <= currentGameMinutes）
 * 回傳：{ updated: ActiveEffect[], expired: ActiveEffect[] }
 */
export function removeExpiredEffects(
  activeEffects: ActiveEffect[],
  currentGameMinutes: number
): { updated: ActiveEffect[]; expired: ActiveEffect[] } {
  const updated: ActiveEffect[] = [];
  const expired: ActiveEffect[] = [];

  for (const effect of activeEffects) {
    // duration === 0 means continuous (e.g. vasopressor drip) — never expires
    if (effect.duration > 0 && effect.startTime + effect.duration <= currentGameMinutes) {
      expired.push(effect);
    } else {
      updated.push(effect);
    }
  }

  return { updated, expired };
}

// ============================================================
// Vitals 計算（核心）
// ============================================================

/**
 * Pathology 對 vitals 的基礎影響（per severity unit）
 * 用 severity 0-100 線性插值
 */
function getPathologyVitalModifier(
  pathology: Pathology,
  severity: number
): Partial<VitalSigns> {
  // severity / 100 作為比例
  const s = severity / 100;

  const modifiers: Record<Pathology, Partial<VitalSigns>> = {
    surgical_bleeding: {
      hr: 40 * s,          // tachycardia
      sbp: -50 * s,        // hypotension
      dbp: -30 * s,
      map: -37 * s,
      cvp: -5 * s,         // low preload
      spo2: -3 * s,
    },
    coagulopathy: {
      hr: 20 * s,
      sbp: -25 * s,
      dbp: -15 * s,
      map: -18 * s,
      cvp: -3 * s,
      spo2: -2 * s,
    },
    tamponade: {
      hr: 30 * s,          // compensatory tachycardia
      sbp: -45 * s,
      dbp: -20 * s,
      map: -28 * s,
      cvp: 8 * s,          // elevated CVP（Beck's triad）
      spo2: -4 * s,
    },
    lcos: {
      hr: 25 * s,
      sbp: -35 * s,
      dbp: -20 * s,
      map: -25 * s,
      cvp: 6 * s,          // elevated（congestion）
      spo2: -5 * s,
    },
    vasoplegia: {
      hr: 20 * s,
      sbp: -40 * s,
      dbp: -30 * s,
      map: -33 * s,
      cvp: -4 * s,
      spo2: -2 * s,
    },
    tension_pneumothorax: {
      hr: 40 * s,
      sbp: -50 * s,
      dbp: -30 * s,
      map: -37 * s,
      cvp: 10 * s,
      spo2: -15 * s,       // severe hypoxia
      rr: 10 * s,
    },
    postop_af: {
      hr: 50 * s,          // rapid ventricular rate
      sbp: -15 * s,
      dbp: -8 * s,
      map: -10 * s,
      cvp: 2 * s,
      spo2: -1 * s,
    },
  };

  return modifiers[pathology] ?? {};
}

/** 溫度對 vitals 的影響（低體溫 → 心搏過緩、凝血障礙加速） */
function getTemperatureVitalModifier(temperature: number): Partial<VitalSigns> {
  if (temperature >= 36) return {};

  const deficit = 36 - temperature; // 每低 1°C 的倍率
  return {
    hr: -deficit * 5,      // bradycardia tendency
    sbp: -deficit * 3,
    map: -deficit * 2,
    spo2: -deficit * 0.5,
  };
}

/**
 * 主要 vitals 計算函數
 *
 * newVitals = baseVitals
 *           + pathologyModifier(severity)
 *           + Σ activeEffects.vitalChanges
 *           + temperatureModifier
 *           + noise(±5%)
 */
export function computeVitals(
  baseVitals: VitalSigns,
  pathology: Pathology,
  severity: number,
  activeEffects: ActiveEffect[],
  temperature: number
): VitalSigns {
  // 1. 從 base 開始
  let vitals: VitalSigns = { ...baseVitals };

  // 2. Pathology 影響
  const pathMod = getPathologyVitalModifier(pathology, severity);
  vitals = mergeVitalModifier(vitals, pathMod);

  // 3. 所有 active effects
  for (const effect of activeEffects) {
    vitals = mergeVitalModifier(vitals, effect.vitalChanges);
  }

  // 4. 溫度影響
  const tempMod = getTemperatureVitalModifier(temperature);
  vitals = mergeVitalModifier(vitals, tempMod);

  // 5. 計算 MAP（如果 sbp/dbp 有更新就重算）
  vitals.map = Math.round((vitals.sbp + 2 * vitals.dbp) / 3);

  // 6. 套用 aLineWaveform（依 severity 推斷）
  vitals.aLineWaveform = computeALineWaveform(pathology, severity, vitals);

  // 7. 加噪音
  vitals = applyVitalNoise(vitals);

  // 8. 安全限制
  vitals = clampVitals(vitals);

  return vitals;
}

/** 將 modifier 疊加到 vitals（只更新有值的欄位） */
function mergeVitalModifier(
  vitals: VitalSigns,
  modifier: Partial<VitalSigns>
): VitalSigns {
  const result = { ...vitals };
  for (const key of Object.keys(modifier) as Array<keyof VitalSigns>) {
    if (key === "aLineWaveform") continue;
    const mod = modifier[key] as number | undefined;
    if (mod != null) {
      (result[key] as number) = (result[key] as number) + mod;
    }
  }
  return result;
}

/** 根據 pathology + severity 推斷 A-line 波形 */
function computeALineWaveform(
  pathology: Pathology,
  severity: number,
  vitals: VitalSigns
): VitalSigns["aLineWaveform"] {
  if (pathology === "tamponade" && severity > 40) return "low_amplitude";
  if (pathology === "surgical_bleeding" || pathology === "coagulopathy") {
    if (severity > 60) return "low_amplitude";
    if (severity > 30) return "dampened";
    return "wide_pp_variation"; // volume responsive early on
  }
  if (pathology === "lcos" && severity > 50) return "pulsus_alternans";
  if (vitals.sbp - vitals.dbp < 20) return "dampened";
  return "normal";
}

/** 強制數值在生理範圍內 */
function clampVitals(vitals: VitalSigns): VitalSigns {
  return {
    ...vitals,
    hr: Math.max(20, Math.min(200, vitals.hr)),
    sbp: Math.max(40, Math.min(220, vitals.sbp)),
    dbp: Math.max(20, Math.min(130, vitals.dbp)),
    map: Math.max(30, Math.min(150, vitals.map)),
    spo2: Math.max(50, Math.min(100, vitals.spo2)),
    cvp: Math.max(-2, Math.min(25, vitals.cvp)),
    rr: Math.max(4, Math.min(40, vitals.rr)),
    temperature: Math.max(28, Math.min(42, vitals.temperature)),
    etco2: vitals.etco2 != null
      ? Math.max(10, Math.min(70, vitals.etco2))
      : undefined,
  };
}

// ============================================================
// I/O Balance
// ============================================================

export interface IOUpdate {
  /** Input 新增量（mL） */
  ivInput?: number;
  bloodInput?: number;
  oralInput?: number;
  /** Output 新增量（mL） */
  chestTubeOutput?: number;
  urineOutput?: number;
  ngoOutput?: number;
}

/**
 * 更新 I/O balance（immutable，回傳新的 IOBalance）
 */
export function updateIOBalance(
  current: IOBalance,
  update: IOUpdate
): IOBalance {
  const newInput = {
    iv: current.breakdown.input.iv + (update.ivInput ?? 0),
    blood: current.breakdown.input.blood + (update.bloodInput ?? 0),
    oral: current.breakdown.input.oral + (update.oralInput ?? 0),
  };
  const newOutput = {
    chestTube: current.breakdown.output.chestTube + (update.chestTubeOutput ?? 0),
    urine: current.breakdown.output.urine + (update.urineOutput ?? 0),
    ngo: current.breakdown.output.ngo + (update.ngoOutput ?? 0),
  };

  const totalInput = newInput.iv + newInput.blood + newInput.oral;
  const totalOutput = newOutput.chestTube + newOutput.urine + newOutput.ngo;
  const netBalance = totalInput - totalOutput;

  return {
    totalInput,
    totalOutput,
    netBalance,
    breakdown: { input: newInput, output: newOutput },
  };
}

/** 建立空的 IOBalance */
export function createEmptyIOBalance(): IOBalance {
  return {
    totalInput: 0,
    totalOutput: 0,
    netBalance: 0,
    breakdown: {
      input: { iv: 0, blood: 0, oral: 0 },
      output: { chestTube: 0, urine: 0, ngo: 0 },
    },
  };
}

// ============================================================
// Chest Tube
// ============================================================

export interface ChestTubeUpdateOptions {
  /** 手動 milk / strip：疏通堵塞、可能恢復 output */
  procedure?: "milk" | "strip";
  /** 每分鐘新增的 CT output（用 currentRate 計算） */
  minutesPassed?: number;
  /** 直接覆蓋部分欄位 */
  overrides?: Partial<ChestTubeState>;
}

/**
 * 更新 chest tube 狀態
 * - minutesPassed: 自動根據 currentRate 增加 totalOutput
 * - procedure=milk: isPatent → true，currentRate 可能小幅恢復
 * - procedure=strip: 同 milk，更強效，hasClots → false
 * - overrides: 直接覆蓋（場景腳本用）
 */
export function updateChestTube(
  current: ChestTubeState,
  options: ChestTubeUpdateOptions
): ChestTubeState {
  let state: ChestTubeState = { ...current };

  // 1. 時間推進：累加 output
  if (options.minutesPassed != null && options.minutesPassed > 0) {
    const addedOutput = (state.currentRate / 60) * options.minutesPassed;
    state = {
      ...state,
      totalOutput: Math.round(state.totalOutput + addedOutput),
    };
  }

  // 2. 手術操作
  if (options.procedure === "milk") {
    state = {
      ...state,
      isPatent: true,
      // 若堵住時 rate 為 0，milk 後恢復部分 rate
      currentRate: state.isPatent ? state.currentRate : state.currentRate * 0.5 + 50,
    };
  } else if (options.procedure === "strip") {
    state = {
      ...state,
      isPatent: true,
      hasClots: false,
      currentRate: state.isPatent ? state.currentRate : state.currentRate * 0.8 + 80,
    };
  }

  // 3. 腳本覆蓋
  if (options.overrides) {
    state = { ...state, ...options.overrides };
  }

  // 4. 安全限制
  state.currentRate = Math.max(0, state.currentRate);
  state.totalOutput = Math.max(0, state.totalOutput);

  return state;
}

/**
 * 判斷 CT 是否有 tamponade 風險
 * - output 突然從高 → 0（堵塞）+ isPatent=false
 * - 同時 CVP 上升 + BP 下降 → 高度懷疑
 */
export function assessTamponadeRisk(
  ct: ChestTubeState,
  vitals: VitalSigns,
  previousCTRate: number
): { risk: "low" | "moderate" | "high"; reasons: string[] } {
  const reasons: string[] = [];
  let riskScore = 0;

  if (!ct.isPatent) {
    reasons.push("Chest tube 堵塞（isPatent = false）");
    riskScore += 2;
  }

  if (previousCTRate > 100 && ct.currentRate < 20) {
    reasons.push(`CT output 驟降：${previousCTRate} → ${ct.currentRate} cc/hr`);
    riskScore += 2;
  }

  if (vitals.cvp > 14) {
    reasons.push(`CVP 升高：${vitals.cvp} mmHg`);
    riskScore += 1;
  }

  if (vitals.map < 60) {
    reasons.push(`MAP 低：${vitals.map} mmHg`);
    riskScore += 1;
  }

  if (vitals.aLineWaveform === "low_amplitude") {
    reasons.push("A-line: low amplitude");
    riskScore += 1;
  }

  const risk: "low" | "moderate" | "high" =
    riskScore >= 4 ? "high" : riskScore >= 2 ? "moderate" : "low";

  return { risk, reasons };
}

// ============================================================
// PatientState 整合更新
// ============================================================

export interface PatientUpdateOptions {
  minutesPassed: number;
  labValues?: LethalTriadInput;
  ctUpdate?: ChestTubeUpdateOptions;
  ioUpdate?: IOUpdate;
  newEffects?: ActiveEffect[];
  currentGameMinutes: number;
}

/**
 * 一次性更新完整 PatientState
 * 適合 store 呼叫，整合所有子引擎。
 */
export function updatePatientState(
  current: PatientState,
  options: PatientUpdateOptions
): PatientState {
  const {
    minutesPassed,
    labValues,
    ctUpdate,
    ioUpdate,
    newEffects,
    currentGameMinutes,
  } = options;

  // 1. 移除過期 effects
  const { updated: activeEffects } = removeExpiredEffects(
    current.activeEffects,
    currentGameMinutes
  );

  // 2. 套用新 effects
  let effects = activeEffects;
  for (const e of newEffects ?? []) {
    effects = applyEffect(effects, e);
  }

  // 3. 更新體溫（從 effects 累加）
  const tempChange = effects.reduce(
    (acc, e) => acc + (e.temperatureChange ?? 0),
    0
  );
  const newTemperature = Math.max(
    28,
    Math.min(42, current.vitals.temperature + tempChange)
  );

  // 4. 更新死亡三角
  const lethalTriad = labValues
    ? checkLethalTriad({ ...labValues, temperature: newTemperature })
    : checkLethalTriad({ temperature: newTemperature });

  // 5. Severity delta
  const severityDelta = computeSeverityDelta(
    current.severity,
    current.pathology,
    effects,
    lethalTriad,
    minutesPassed
  );
  const newSeverity = Math.max(
    0,
    Math.min(100, current.severity + severityDelta)
  );

  // 6. 計算 vitals（從 baseline 開始，避免 modifier 雙重累積）
  const newVitals = computeVitals(
    current.baselineVitals,
    current.pathology,
    newSeverity,
    effects,
    newTemperature
  );

  // 7. 更新 chest tube
  const newCT = ctUpdate
    ? updateChestTube(current.chestTube, ctUpdate)
    : updateChestTube(current.chestTube, { minutesPassed });

  // 8. 更新 I/O（自動累加 CT output）
  const ctOutputAdded =
    newCT.totalOutput - current.chestTube.totalOutput;
  const baseIOUpdate: IOUpdate = {
    chestTubeOutput: ctOutputAdded,
    ...(ioUpdate ?? {}),
  };
  const newIO = updateIOBalance(current.ioBalance, baseIOUpdate);

  return {
    ...current,
    vitals: { ...newVitals, temperature: newTemperature },
    severity: newSeverity,
    activeEffects: effects,
    lethalTriad,
    chestTube: newCT,
    ioBalance: newIO,
  };
}
