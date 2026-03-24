// Guidance Engine — Unit Tests
// Framework-agnostic: run with `npx tsx lib/simulator/engine/__tests__/guidance-engine.test.ts`

import {
  evaluateGuidance,
  checkIdle,
  checkWrongAction,
  checkMissedAction,
  checkVitalsCritical,
  checkPhaseStart,
  checkDuplicateOrder,
  checkDoseError,
} from "../guidance-engine";
import type {
  PatientState,
  TrackedAction,
  SimScenario,
  DifficultyConfig,
  VitalSigns,
} from "../../types";

// ============================================================
// Minimal Test Harness
// ============================================================

let passed = 0;
let failed = 0;

function describe(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  fn();
}

function it(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (e) {
    failed++;
    console.error(`  \u2717 ${name}: ${(e as Error).message}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected)
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeNull() {
      if (actual !== null)
        throw new Error(`expected null, got ${JSON.stringify(actual)}`);
    },
    not: {
      toBeNull() {
        if (actual === null) throw new Error("expected non-null, got null");
      },
    },
    toHaveLength(len: number) {
      if (!Array.isArray(actual))
        throw new Error(`expected array, got ${typeof actual}`);
      if (actual.length !== len)
        throw new Error(`expected length ${len}, got ${actual.length}`);
    },
  };
}

// ============================================================
// Mock Data Factories
// ============================================================

function makeVitals(overrides: Partial<VitalSigns> = {}): VitalSigns {
  return {
    hr: 90,
    sbp: 120,
    dbp: 70,
    map: 85,
    spo2: 98,
    cvp: 8,
    temperature: 36.5,
    rr: 16,
    aLineWaveform: "normal",
    rhythmStrip: "nsr",
    ...overrides,
  };
}

function makeState(overrides: Partial<PatientState> = {}): PatientState {
  return {
    vitals: makeVitals(),
    baselineVitals: makeVitals(),
    chestTube: {
      currentRate: 50,
      totalOutput: 200,
      color: "serosanguineous",
      hasClots: false,
      isPatent: true,
      airLeak: false,
    },
    pathology: "surgical_bleeding",
    severity: 50,
    activeEffects: [],
    ioBalance: {
      totalInput: 500,
      totalOutput: 300,
      netBalance: 200,
      breakdown: {
        input: { iv: 300, blood: 200, oral: 0 },
        output: { chestTube: 200, urine: 100, ngo: 0 },
      },
    },
    lethalTriad: {
      hypothermia: false,
      acidosis: false,
      coagulopathy: false,
      count: 0,
    },
    ...overrides,
  };
}

function makeScenario(overrides: Partial<SimScenario> = {}): SimScenario {
  return {
    id: "test-scenario",
    title: "Test",
    subtitle: "Test scenario",
    difficulty: "intermediate",
    duration: "15min",
    tags: [],
    patient: {
      age: 65,
      sex: "M",
      bed: "ICU-1",
      weight: 70,
      surgery: "CABG",
      postOpDay: "POD#0",
      history: "HTN, DM",
      allergies: [],
      keyMeds: [],
    },
    initialVitals: makeVitals(),
    initialChestTube: {
      currentRate: 50,
      totalOutput: 100,
      color: "serosanguineous",
      hasClots: false,
      isPatent: true,
      airLeak: false,
    },
    initialLabs: {},
    pathology: "surgical_bleeding",
    startHour: 2,
    nurseProfile: { name: "Nurse Lin", experience: "senior" },
    events: [],
    expectedActions: [],
    availableLabs: {},
    availableImaging: {},
    availablePOCUS: {},
    physicalExam: {},
    debrief: {
      correctDiagnosis: "Surgical Bleeding",
      keyPoints: [],
      pitfalls: [],
      guidelines: [],
      whatIf: [],
    },
    ...overrides,
  };
}

const standardConfig: DifficultyConfig = {
  canDie: true,
  rescueThreshold: { sbp: 60, hr: 30, spo2: 70 },
  rescueWindowSeconds: 60,
  timeScale: 0.75,
  hintLimit: 0, // Infinity in practice, 0 here for simplicity
};

const proConfig: DifficultyConfig = {
  canDie: true,
  timeScale: 1,
  hintLimit: 3,
};

function action(act: string, gameTime: number, category?: string): TrackedAction {
  return { action: act, gameTime, category };
}

// ============================================================
// Tests
// ============================================================

describe("evaluateGuidance — mode gating", () => {
  it("returns empty in Pro mode", () => {
    const msgs = evaluateGuidance(makeState(), [], makeScenario(), proConfig, 5);
    expect(msgs).toHaveLength(0);
  });

  it("returns messages in Standard mode when triggers fire", () => {
    // No actions + gameTime=2 → idle trigger fires
    const msgs = evaluateGuidance(makeState(), [], makeScenario(), standardConfig, 2);
    expect(msgs.length > 0).toBe(true);
  });
});

describe("checkIdle", () => {
  it("fires when no actions and gameTime >= 1 min", () => {
    const msg = checkIdle([], 1);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("idle");
    expect(msg!.severity).toBe("info");
  });

  it("fires when last action was >1 min ago", () => {
    const actions = [action("order:medication:ns:500", 2)];
    const msg = checkIdle(actions, 3.5);
    expect(msg).not.toBeNull();
  });

  it("does not fire when action is recent", () => {
    const actions = [action("order:medication:ns:500", 2)];
    const msg = checkIdle(actions, 2.5);
    expect(msg).toBeNull();
  });
});

describe("checkWrongAction", () => {
  it("detects anticoagulant in bleeding scenario", () => {
    const actions = [action("order:medication:heparin:5000", 3)];
    const scenario = makeScenario({ pathology: "surgical_bleeding" });
    const msg = checkWrongAction(actions, scenario);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("wrong_action");
  });

  it("detects diuretic in bleeding scenario", () => {
    const actions = [action("order:medication:lasix:40", 3)];
    const scenario = makeScenario({ pathology: "surgical_bleeding" });
    const msg = checkWrongAction(actions, scenario);
    expect(msg).not.toBeNull();
  });

  it("detects vasopressor without prior volume", () => {
    const actions = [action("order:medication:norepinephrine:0.1", 3)];
    const scenario = makeScenario({ pathology: "septic_shock" });
    const msg = checkWrongAction(actions, scenario);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("wrong_action");
  });

  it("does not fire for vasopressor if volume was given", () => {
    const actions = [
      action("order:fluid:ns:500", 1, "fluid"),
      action("order:medication:norepinephrine:0.1", 3),
    ];
    const scenario = makeScenario({ pathology: "septic_shock" });
    const msg = checkWrongAction(actions, scenario);
    expect(msg).toBeNull();
  });

  it("returns null for non-order actions", () => {
    const actions = [action("pocus:cardiac", 3)];
    const msg = checkWrongAction(actions, makeScenario());
    expect(msg).toBeNull();
  });
});

describe("checkMissedAction", () => {
  it("fires when critical action deadline is within 2 min", () => {
    const scenario = makeScenario({
      expectedActions: [
        {
          id: "order_prbc",
          action: "Transfuse pRBC",
          description: "Give blood",
          deadline: 10,
          critical: true,
          hint: "病人 Hb 在掉，要不要輸血？",
        },
      ],
    });
    // gameTime = 8.5 → deadline 10 → timeLeft = 1.5 (< 2)
    const msg = checkMissedAction([], scenario, 8.5);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("missed_action");
  });

  it("does not fire if action already taken", () => {
    const scenario = makeScenario({
      expectedActions: [
        {
          id: "order_prbc",
          action: "Transfuse pRBC",
          description: "Give blood",
          deadline: 10,
          critical: true,
          hint: "輸血",
        },
      ],
    });
    const actions = [action("order:transfusion:order_prbc:2", 5)];
    const msg = checkMissedAction(actions, scenario, 8.5);
    expect(msg).toBeNull();
  });

  it("does not fire for non-critical actions", () => {
    const scenario = makeScenario({
      expectedActions: [
        {
          id: "order_warming",
          action: "Warming blanket",
          description: "Warm patient",
          deadline: 10,
          critical: false,
          hint: "溫度",
        },
      ],
    });
    const msg = checkMissedAction([], scenario, 8.5);
    expect(msg).toBeNull();
  });
});

describe("checkVitalsCritical", () => {
  it("fires on low SBP", () => {
    const state = makeState({ vitals: makeVitals({ sbp: 70 }) });
    const msg = checkVitalsCritical(state);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("vitals_critical");
    expect(msg!.severity).toBe("critical");
  });

  it("fires on high HR", () => {
    const state = makeState({ vitals: makeVitals({ hr: 160 }) });
    const msg = checkVitalsCritical(state);
    expect(msg).not.toBeNull();
  });

  it("fires on low HR", () => {
    const state = makeState({ vitals: makeVitals({ hr: 35 }) });
    const msg = checkVitalsCritical(state);
    expect(msg).not.toBeNull();
  });

  it("fires on low SpO2", () => {
    const state = makeState({ vitals: makeVitals({ spo2: 85 }) });
    const msg = checkVitalsCritical(state);
    expect(msg).not.toBeNull();
  });

  it("fires on low MAP", () => {
    const state = makeState({ vitals: makeVitals({ map: 50 }) });
    const msg = checkVitalsCritical(state);
    expect(msg).not.toBeNull();
  });

  it("does not fire when vitals are normal", () => {
    const msg = checkVitalsCritical(makeState());
    expect(msg).toBeNull();
  });
});

describe("checkPhaseStart", () => {
  it("fires when a severity-shifting event just triggered", () => {
    const scenario = makeScenario({
      events: [
        {
          id: "phase2",
          triggerTime: 10,
          type: "vitals_change",
          severityChange: 15,
        },
      ],
    });
    const msg = checkPhaseStart(scenario, 10.2);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("phase_start");
  });

  it("does not fire for minor severity changes", () => {
    const scenario = makeScenario({
      events: [
        {
          id: "minor",
          triggerTime: 10,
          type: "vitals_change",
          severityChange: 5,
        },
      ],
    });
    const msg = checkPhaseStart(scenario, 10.2);
    expect(msg).toBeNull();
  });

  it("does not fire if event is not near current time", () => {
    const scenario = makeScenario({
      events: [
        {
          id: "phase2",
          triggerTime: 10,
          type: "vitals_change",
          severityChange: 20,
        },
      ],
    });
    const msg = checkPhaseStart(scenario, 12);
    expect(msg).toBeNull();
  });
});

describe("checkDuplicateOrder", () => {
  it("fires when same drug ordered twice within 5 min", () => {
    const actions = [
      action("order:medication:norepinephrine:0.1", 3),
      action("order:medication:norepinephrine:0.1", 5),
    ];
    const msg = checkDuplicateOrder(actions);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("duplicate_order");
  });

  it("does not fire if orders are >5 min apart", () => {
    const actions = [
      action("order:medication:norepinephrine:0.1", 1),
      action("order:medication:norepinephrine:0.1", 7),
    ];
    const msg = checkDuplicateOrder(actions);
    expect(msg).toBeNull();
  });

  it("does not fire for different drugs", () => {
    const actions = [
      action("order:medication:norepinephrine:0.1", 3),
      action("order:medication:dobutamine:5", 4),
    ];
    const msg = checkDuplicateOrder(actions);
    expect(msg).toBeNull();
  });
});

describe("checkDoseError", () => {
  it("fires when dose is >5x typical", () => {
    // Typical norepinephrine: 0.1, giving 1.0 = 10x
    const actions = [action("order:medication:norepinephrine:1.0", 3)];
    const msg = checkDoseError(actions);
    expect(msg).not.toBeNull();
    expect(msg!.trigger).toBe("dose_error");
  });

  it("does not fire for normal dose", () => {
    const actions = [action("order:medication:norepinephrine:0.1", 3)];
    const msg = checkDoseError(actions);
    expect(msg).toBeNull();
  });

  it("does not fire for unknown medication", () => {
    const actions = [action("order:medication:unknown_drug:9999", 3)];
    const msg = checkDoseError(actions);
    expect(msg).toBeNull();
  });
});

// ============================================================
// Summary
// ============================================================

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
