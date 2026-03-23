/**
 * Medication dose validation
 * Returns warning messages for potentially inappropriate doses
 */

interface ValidationResult {
  isValid: boolean;
  warning?: string;
  suggestion?: string;
}

interface DoseRange {
  min: number;
  max: number;
  unit: string;
  warningHigh?: string;
  warningLow?: string;
}

const medicationRanges: Record<string, DoseRange> = {
  // Vasopressors
  norepinephrine: {
    min: 0.01,
    max: 0.5,
    unit: "mcg/kg/min",
    warningHigh: "Norepinephrine 劑量偏高，通常起始 0.05-0.1 mcg/kg/min",
    warningLow: "Norepinephrine 劑量偏低，可能無效",
  },
  dopamine: {
    min: 2,
    max: 20,
    unit: "mcg/kg/min",
    warningHigh: "Dopamine > 20 mcg/kg/min 可能增加心律不整風險",
    warningLow: "Dopamine < 2 mcg/kg/min 主要為 renal dose 效果",
  },
  vasopressin: {
    min: 0.01,
    max: 0.04,
    unit: "units/min",
    warningHigh: "Vasopressin 建議不超過 0.04 units/min",
  },
  epinephrine: {
    min: 0.01,
    max: 0.3,
    unit: "mcg/kg/min",
    warningHigh: "Epinephrine 劑量偏高，注意心律不整風險",
  },

  // Inotropes
  dobutamine: {
    min: 2.5,
    max: 20,
    unit: "mcg/kg/min",
    warningHigh: "Dobutamine > 20 mcg/kg/min 效果有限，可能增加副作用",
  },
  milrinone: {
    min: 0.25,
    max: 0.75,
    unit: "mcg/kg/min",
    warningHigh: "Milrinone 建議不超過 0.75 mcg/kg/min",
  },

  // Fluids
  ns: {
    min: 100,
    max: 2000,
    unit: "mL",
    warningHigh: "大量輸液需評估病人 volume status，cardiogenic shock 要小心",
  },
  lr: {
    min: 100,
    max: 2000,
    unit: "mL",
    warningHigh: "大量輸液需評估病人 volume status，cardiogenic shock 要小心",
  },
  albumin: {
    min: 100,
    max: 500,
    unit: "mL",
    warningHigh: "Albumin 單次建議不超過 500 mL",
  },

  // Diuretics
  furosemide: {
    min: 20,
    max: 200,
    unit: "mg",
    warningHigh: "Furosemide 單次 > 200 mg IV 需謹慎，考慮分次給予或 continuous infusion",
    warningLow: "Furosemide < 20 mg 對 ICU 病人可能效果有限",
  },

  // Antibiotics
  ceftriaxone: {
    min: 1,
    max: 4,
    unit: "g",
    warningHigh: "Ceftriaxone 一般不超過 4g/day",
  },
  piptazo: {
    min: 2.25,
    max: 4.5,
    unit: "g",
    warningHigh: "Piperacillin/Tazobactam 單次建議不超過 4.5g",
  },
  vancomycin: {
    min: 0.5,
    max: 2,
    unit: "g",
    warningHigh: "Vancomycin 單次 > 2g 需確認腎功能",
  },

  // Steroids
  hydrocortisone: {
    min: 25,
    max: 100,
    unit: "mg",
    warningHigh: "Hydrocortisone 單次 > 100 mg 較少見，確認適應症",
  },
};

export function validateMedication(
  medicationId: string,
  dose: number,
  unit: string
): ValidationResult {
  const range = medicationRanges[medicationId];

  if (!range) {
    return { isValid: true };
  }

  // Check if dose is outside range
  if (dose > range.max) {
    return {
      isValid: false,
      warning: range.warningHigh || `劑量偏高 (建議: ${range.min}-${range.max} ${range.unit})`,
      suggestion: `建議劑量: ${range.min}-${range.max} ${range.unit}`,
    };
  }

  if (dose < range.min) {
    return {
      isValid: false,
      warning: range.warningLow || `劑量偏低 (建議: ${range.min}-${range.max} ${range.unit})`,
      suggestion: `建議劑量: ${range.min}-${range.max} ${range.unit}`,
    };
  }

  return { isValid: true };
}

/**
 * Check for dangerous drug interactions or contraindications
 * based on the scenario context
 */
export function checkContraindications(
  medicationId: string,
  diagnosis: string
): string | null {
  // Fluid bolus in cardiogenic shock
  if (
    (medicationId === "ns" || medicationId === "lr") &&
    diagnosis.toLowerCase().includes("cardiogenic")
  ) {
    return "注意：Cardiogenic shock 給予大量輸液可能加重肺水腫";
  }

  return null;
}
