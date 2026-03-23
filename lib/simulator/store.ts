import { create } from "zustand";
import type {
  Scenario,
  VitalSigns,
  CurrentStatus,
  Message,
  OrderedLab,
  OrderedMedication,
  ExaminedItem,
  POCUSExamined,
  ModalType,
  HandoffReport,
  HandoffFeedback,
  PlayerAction,
  PlayerActionType,
} from "@/lib/simulator/types";

interface GameStore {
  // Scenario
  scenario: Scenario | null;
  isLoading: boolean;
  loadError: string | null;

  // Current state
  vitals: VitalSigns | null;
  status: CurrentStatus | null;

  // Interaction history
  messages: Message[];
  orderedLabs: OrderedLab[];
  orderedMedications: OrderedMedication[];
  examinedItems: ExaminedItem[];
  pocusExamined: POCUSExamined[];

  // Player action tracking
  playerActions: PlayerAction[];

  // Game progress
  gameStarted: boolean;
  gameEnded: boolean;
  submittedDiagnosis: string | null;

  // Handoff
  handoffReport: HandoffReport | null;
  handoffFeedback: HandoffFeedback | null;

  // UI state
  activeModal: ModalType;

  // Actions
  setScenario: (scenario: Scenario) => void;
  setLoading: (loading: boolean) => void;
  setLoadError: (error: string | null) => void;
  setVitals: (vitals: VitalSigns) => void;
  setStatus: (status: CurrentStatus) => void;

  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  addOrderedLab: (lab: Omit<OrderedLab, "orderedAt" | "resultsAvailable">) => void;
  setLabResultsAvailable: (category: string) => void;
  addOrderedMedication: (med: Omit<OrderedMedication, "id" | "orderedAt">) => void;
  addExaminedItem: (item: Omit<ExaminedItem, "examinedAt">) => void;
  addPOCUSExamined: (pocus: Omit<POCUSExamined, "examinedAt">) => void;

  // Player action tracking
  addPlayerAction: (type: PlayerActionType, detail: string, data?: Record<string, unknown>) => void;

  startGame: () => void;
  endGame: (diagnosis: string) => void;
  resetGame: () => void;

  // Handoff actions
  setHandoffReport: (report: HandoffReport) => void;
  setHandoffFeedback: (feedback: HandoffFeedback) => void;

  setActiveModal: (modal: ModalType) => void;
}

const initialState = {
  scenario: null,
  isLoading: false,
  loadError: null as string | null,
  vitals: null,
  status: null,
  messages: [],
  orderedLabs: [],
  orderedMedications: [],
  examinedItems: [],
  pocusExamined: [],
  playerActions: [] as PlayerAction[],
  gameStarted: false,
  gameEnded: false,
  submittedDiagnosis: null,
  handoffReport: null,
  handoffFeedback: null,
  activeModal: null as ModalType,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setScenario: (scenario) =>
    set({
      scenario,
      vitals: scenario.initial_vitals,
      status: scenario.current_status,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setLoadError: (loadError) => set({ loadError }),

  setVitals: (vitals) => set({ vitals }),

  setStatus: (status) => set({ status }),

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),

  addOrderedLab: (lab) =>
    set((state) => ({
      orderedLabs: [
        ...state.orderedLabs,
        {
          ...lab,
          orderedAt: new Date(),
          resultsAvailable: false,
        },
      ],
    })),

  setLabResultsAvailable: (category) =>
    set((state) => ({
      orderedLabs: state.orderedLabs.map((lab) =>
        lab.category === category ? { ...lab, resultsAvailable: true } : lab
      ),
    })),

  addOrderedMedication: (med) =>
    set((state) => ({
      orderedMedications: [
        ...state.orderedMedications,
        {
          ...med,
          id: crypto.randomUUID(),
          orderedAt: new Date(),
        },
      ],
    })),

  addExaminedItem: (item) =>
    set((state) => ({
      examinedItems: [
        ...state.examinedItems,
        {
          ...item,
          examinedAt: new Date(),
        },
      ],
    })),

  addPOCUSExamined: (pocus) =>
    set((state) => ({
      pocusExamined: [
        ...state.pocusExamined,
        {
          ...pocus,
          examinedAt: new Date(),
        },
      ],
    })),

  addPlayerAction: (type, detail, data) =>
    set((state) => ({
      playerActions: [
        ...state.playerActions,
        {
          id: crypto.randomUUID(),
          type,
          timestamp: new Date(),
          detail,
          data,
        },
      ],
    })),

  startGame: () => {
    const { scenario, addPlayerAction } = get();
    if (scenario) {
      set({
        gameStarted: true,
        messages: [
          {
            id: crypto.randomUUID(),
            role: "nurse",
            content: scenario.opening.message,
            timestamp: new Date(),
          },
        ],
        playerActions: [
          {
            id: crypto.randomUUID(),
            type: "game_start",
            timestamp: new Date(),
            detail: `開始情境: ${scenario.title}`,
            data: { scenarioId: scenario.id },
          },
        ],
      });
    }
  },

  endGame: (diagnosis) => {
    const { addPlayerAction } = get();
    set((state) => ({
      gameEnded: true,
      submittedDiagnosis: diagnosis,
      playerActions: [
        ...state.playerActions,
        {
          id: crypto.randomUUID(),
          type: "game_end",
          timestamp: new Date(),
          detail: `提交診斷: ${diagnosis}`,
          data: { diagnosis },
        },
      ],
    }));
  },

  resetGame: () => set(initialState),

  setHandoffReport: (handoffReport) => set({ handoffReport }),

  setHandoffFeedback: (handoffFeedback) => set({ handoffFeedback }),

  setActiveModal: (activeModal) => set({ activeModal }),
}));
