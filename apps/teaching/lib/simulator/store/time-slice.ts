/**
 * Time slice — 遊戲時間推進與事件觸發核心
 *（從 store.ts 機械搬移，零行為改變）
 *
 * 唯一的機械替換：原 or_ready 事件 setTimeout 內的
 * `useProGameStore.getState()` / `useProGameStore.setState()`
 * 改為 slice 的 `get()` / `set()`（zustand 同一組函數，行為相同），
 * 以避免 slice ↔ store façade 循環引用。
 */

import {
  getLastBioGearsState,
  dispatchPericardialEffusion,
} from "@/lib/simulator/engine/biogears-engine";
import { computeLabSnapshot, buildLabContext } from "@/lib/simulator/engine/lab-engine";
import type { LabPanelId } from "@/lib/simulator/engine/lab-engine";
import {
  evaluateNurseTriggers,
  updateNurseTriggerState,
} from "@/lib/simulator/engine/nurse-trigger-engine";
import type { NurseEvalContext } from "@/lib/simulator/engine/nurse-trigger-engine";
import { getOrderEffect, getMTPRoundEffect } from "@/lib/simulator/engine/order-engine";
import { updatePatientState } from "@/lib/simulator/engine/patient-engine";
import {
  evaluateTransitions,
  markTransitionsFired,
} from "@/lib/simulator/engine/phase-engine";
import type { PhaseEvalState } from "@/lib/simulator/engine/phase-engine";
import { evaluateCondition } from "@/lib/simulator/engine/time-engine";
import type { GameStateSnapshot } from "@/lib/simulator/engine/time-engine";
import type {
  GamePhase,
  GameClock,
  PendingEvent,
  PlacedOrder,
  TimelineEntry,
  Pathology,
  TrackedAction,
  LabResultData,
  ScriptedEventData,
  OrderEffectData,
} from "../types";
import { isEffectCorrectForNewPathology, formatGameTime, nextId } from "./helpers";
import type { ProGameStore, StoreSlice } from "./types";

export type TimeSlice = Pick<
  ProGameStore,
  "registerTickPatient" | "advanceTime" | "actionAdvance"
>;

export const createTimeSlice: StoreSlice<TimeSlice> = (set, get) => ({
  // ----------------------------------------------------------
  // registerTickPatient — store-based callback for patient tick (replaces window.__tickPatient)
  // ----------------------------------------------------------
  registerTickPatient: (fn: ((minutes: number) => void) | null) => {
    set({ _tickPatientFn: fn });
  },

  // ----------------------------------------------------------
  // advanceTime
  // ----------------------------------------------------------
  advanceTime: (minutes: number) => {
    const { clock, pendingEvents, phase } = get();
    if (phase !== "playing") return;

    const newTime = clock.currentTime + minutes;
    const updatedClock: GameClock = { ...clock, currentTime: newTime };

    // M7: Clean up expired activeEffects
    {
      const pat = get().patient;
      if (pat) {
        const liveEffects = pat.activeEffects.filter(
          (e) => newTime < e.startTime + e.duration
        );
        if (liveEffects.length < pat.activeEffects.length) {
          set((state) => ({
            patient: state.patient ? {
              ...state.patient,
              activeEffects: liveEffects,
            } : state.patient,
          }));
        }
      }
    }

    // 找出所有應在 newTime 前觸發、且尚未觸發的事件
    // 同時處理條件型事件：時間到 AND 條件成立才觸發
    const currentState = get();
    if (!currentState.patient) return;
    const snapshot: GameStateSnapshot = {
      clock: { ...clock, currentTime: newTime },
      patient: currentState.patient,
      orders: currentState.placedOrders as PlacedOrder[],
      mtp: currentState.mtpState,
      severity: currentState.patient?.severity ?? 0,
      elapsedMinutes: newTime,
      actionsTaken: currentState.playerActions.map((pa) => pa.action),
      hintsUsed: currentState.hintsUsed ?? 0,
    };

    const toFire = pendingEvents.filter((e) => {
      if (e.fired || e.triggerAt > newTime) return false;
      // 無條件事件：時間到就觸發
      if (!e.triggerCondition) return true;
      // 條件事件：時間到 + 條件成立才觸發
      return evaluateCondition(e.triggerCondition, snapshot);
    });

    const nowFiredIds = new Set(toFire.map((e) => e.id));

    const updatedPending = pendingEvents.map((e) =>
      nowFiredIds.has(e.id) ? { ...e, fired: true } : e
    );
    const newlyFired = updatedPending.filter((e) => nowFiredIds.has(e.id));

    // ── STEP 1: 先套用 severityChange + chestTubeChanges ──
    // 這樣 patient-engine 下一次 tick 會算出正確的 vitals
    // 護理師對白在 STEP 2 讀 patient state 動態生成
    for (const ev of toFire) {
      const data = ev.data as ScriptedEventData | undefined;
      if (!data) continue;

      const chestTubeChanges = data.chestTubeChanges;
      const severityChange = data.severityChange;
      const pathologyChange = data.pathologyChange;
      const severitySet = data.severitySet;

      if (chestTubeChanges || severityChange || pathologyChange || severitySet !== undefined) {
        set((state) => {
          if (!state.patient) return {};

          const patientUpdate = { ...state.patient };

          // ── pathologyChange 先套用（影響後續 severity curve + vitals） ──
          if (pathologyChange) {
            patientUpdate.pathology = pathologyChange;
            // 重算 activeEffects 的 isCorrectTreatment：Phase 1 的藥在 Phase 2 可能不再 correct
            patientUpdate.activeEffects = patientUpdate.activeEffects.map(eff => ({
              ...eff,
              isCorrectTreatment: eff.isCorrectTreatment
                ? isEffectCorrectForNewPathology(eff, pathologyChange)
                : false,
            }));
          }

          // ── severity: severitySet（絕對值）優先於 severityChange（delta） ──
          // BioGears mode: skip scripted severity bumps — BioGears computes severity
          // from physiology (blood volume, lactate, pH). Scripted bumps would oscillate.
          const bioGearsActive = !!getLastBioGearsState();
          let newSeverity = patientUpdate.severity;
          if (!bioGearsActive) {
            if (severitySet !== undefined) {
              newSeverity = Math.max(0, Math.min(100, severitySet));
            } else if (severityChange) {
              newSeverity = Math.max(0, Math.min(100, newSeverity + severityChange));
            }
          }

          let newChestTube = patientUpdate.chestTube;
          if (chestTubeChanges) {
            newChestTube = { ...newChestTube, ...chestTubeChanges };
          }

          const ctOutputDiff = newChestTube.totalOutput - patientUpdate.chestTube.totalOutput;
          let newIO = patientUpdate.ioBalance;
          if (ctOutputDiff !== 0) {
            newIO = {
              ...newIO,
              totalOutput: newIO.totalOutput + ctOutputDiff,
              netBalance: newIO.netBalance - ctOutputDiff,
              breakdown: {
                ...newIO.breakdown,
                output: {
                  ...newIO.breakdown.output,
                  chestTube: newIO.breakdown.output.chestTube + ctOutputDiff,
                },
              },
            };
          }

          // 同時立即重算 vitals（用新 pathology + severity）讓 STEP 2 讀到最新數字
          const newPatient = updatePatientState(
            { ...patientUpdate, severity: newSeverity, chestTube: newChestTube, ioBalance: newIO },
            { minutesPassed: 0, currentGameMinutes: newTime, ventilator: state.ventilator }
          );

          return { patient: newPatient };
        });
      }
    }

    // ── STEP 2: 讀取最新 patient state，建 timeline entries ──
    // 護理師對白用模板 {{hr}} {{sbp}} {{dbp}} {{cvp}} {{ct_rate}} {{ct_total}} {{spo2}} {{map}} {{rr}}
    // 插值為當前 patient state 的真實數字
    const currentPatient = get().patient;
    const interpolateVitals = (text: string): string => {
      if (!currentPatient) {
        // Fallback: use scenario initialVitals if patient not yet hydrated
        const fallback = get().scenario;
        if (!fallback) return text;
        const v = fallback.initialVitals;
        const ct = fallback.initialChestTube ?? { currentRate: 0, totalOutput: 0 };
        return text
          .replace(/\{\{hr\}\}/g, String(Math.round(v.hr)))
          .replace(/\{\{sbp\}\}/g, String(Math.round(v.sbp)))
          .replace(/\{\{dbp\}\}/g, String(Math.round(v.dbp)))
          .replace(/\{\{map\}\}/g, String(Math.round(v.map)))
          .replace(/\{\{cvp\}\}/g, String(Math.round(v.cvp)))
          .replace(/\{\{spo2\}\}/g, String(Math.round(v.spo2)))
          .replace(/\{\{rr\}\}/g, String(Math.round(v.rr)))
          .replace(/\{\{temp\}\}/g, String(v.temperature))
          .replace(/\{\{ct_rate\}\}/g, String(ct.currentRate))
          .replace(/\{\{ct_total\}\}/g, String(ct.totalOutput));
      }
      const v = currentPatient.vitals;
      const ct = currentPatient.chestTube;
      return text
        .replace(/\{\{hr\}\}/g, String(Math.round(v.hr)))
        .replace(/\{\{sbp\}\}/g, String(Math.round(v.sbp)))
        .replace(/\{\{dbp\}\}/g, String(Math.round(v.dbp)))
        .replace(/\{\{map\}\}/g, String(Math.round(v.map)))
        .replace(/\{\{cvp\}\}/g, String(Math.round(v.cvp)))
        .replace(/\{\{spo2\}\}/g, String(Math.round(v.spo2)))
        .replace(/\{\{rr\}\}/g, String(Math.round(v.rr)))
        .replace(/\{\{temp\}\}/g, String(v.temperature))
        .replace(/\{\{ct_rate\}\}/g, String(ct.currentRate))
        .replace(/\{\{ct_total\}\}/g, String(ct.totalOutput));
    };

    const firedEntries: TimelineEntry[] = [];
    const scenario = get().scenario;
    const placedOrders = get().placedOrders;

    for (const ev of toFire) {
      if (ev.type === "lab_result" && (ev.data as LabResultData)?.orderId) {
        // Find the order and its lab panel results
        const labData = ev.data as LabResultData;
        const order = placedOrders.find((o) => o.id === labData.orderId);
        if (order && scenario) {
          const orderId = (order.definition as unknown as Record<string, unknown>).id as string | undefined;

          // === Try BioGears dynamic labs first ===
          const bgState = getLastBioGearsState();
          const labCtx = buildLabContext(placedOrders as Parameters<typeof buildLabContext>[0], newTime);
          const dynamicResults = bgState && orderId
            ? computeLabSnapshot(bgState, labCtx, orderId as LabPanelId)
            : null;

          let labResults: Record<string, { value: number | string; unit: string; normal?: string; flag?: string }> | null = dynamicResults;

          if (!labResults) {
            const orderName = order.definition.name.toLowerCase();
            const labKey = Object.keys(scenario.availableLabs).find((k) => {
              const panel = scenario.availableLabs[k];
              if (orderId && panel.id === orderId) return true;
              if (panel.name === order.definition.name) return true;
              if (panel.id === orderName) return true;
              return false;
            });
            const labPanel = labKey ? scenario.availableLabs[labKey] : null;
            labResults = labPanel?.results ?? null;
          }

          if (labResults) {
            const resultLines = Object.entries(labResults)
              .map(([key, r]) => {
                const flagStr = r.flag === "critical" ? " 🔴" : r.flag === "H" ? " ↑" : r.flag === "L" ? " ↓" : "";
                return `${key.padEnd(10)} ${String(r.value).padStart(7)}  ${r.unit}${flagStr}`;
              })
              .join("\n");

            firedEntries.push({
              id: nextId("tl"),
              gameTime: newTime,
              type: "lab_result" as TimelineEntry["type"],
              content: `📊 Lab 回報：${order.definition.name}\n${resultLines}`,
              sender: "system",
              isImportant: true,
            });

            const nurseName = scenario.nurseProfile.name ?? "護理師";
            firedEntries.push({
              id: nextId("tl"),
              gameTime: newTime,
              type: "nurse_message",
              content: `${nurseName}：醫師，${labData.orderName ?? order.definition.name} 結果出來了。`,
              sender: "nurse",
            });

            // Mark order as completed with results (for LabOverviewPanel)
            if (labData.orderId) {
              get().updateOrderStatus(labData.orderId, "completed", labResults);
            }

            // Auto-open lab results modal (clerk 拿報告來給你看)
            if (!get().activeModal) {
              set({ activeModal: "lab_results" });
            }
          }
        }
      } else if (ev.type === "vitals_change" || ev.type === "escalation" || ev.type === "chest_tube_change") {
        const scriptData = ev.data as ScriptedEventData;
        const rawContent = scriptData?.message ?? scriptData?.content ?? "";
        // vitals_change without message = silent update (no timeline entry)
        if (rawContent) {
          firedEntries.push({
            id: nextId("tl"),
            gameTime: newTime,
            type: ev.type === "escalation" ? "nurse_message" : "system_event",
            content: interpolateVitals(rawContent),
            sender: ev.type === "escalation" ? "nurse" : "system",
            isImportant: true,
          });
        }
      } else if (ev.type === "nurse_call") {
        const nurseData = ev.data as ScriptedEventData;
        const rawContent = nurseData?.message ?? `護理師：有事情需要你注意。`;
        const nurseName = scenario?.nurseProfile?.name ?? "護理師";
        const content = rawContent.startsWith(nurseName) ? rawContent : `${nurseName}：${rawContent}`;
        firedEntries.push({
          id: nextId("tl"),
          gameTime: newTime,
          type: "nurse_message",
          content: interpolateVitals(content),
          sender: "nurse",
          isImportant: true,
        });
      } else if (ev.type === "senior_arrives") {
        const seniorData = ev.data as ScriptedEventData;
        const content = seniorData?.message ?? "（學長到場）";
        firedEntries.push({
          id: nextId("tl"),
          gameTime: newTime,
          type: "nurse_message",
          content: interpolateVitals(content),
          sender: "senior",
          isImportant: true,
        });

        // Update senior presence state machine
        const currentPresence = get().seniorPresence;
        if (currentPresence === "en_route") {
          set({ seniorPresence: "present" });
        }

        // Open SeniorDialog if patient NOT in arrest
        const arrPat = get().patient;
        const arrRhythm = arrPat?.vitals.rhythmStrip ?? "nsr";
        const inArrest = arrPat?.vitals.hr === 0 ||
          ["vf", "vt_pulseless", "pea", "asystole"].includes(arrRhythm);
        if (!inArrest) {
          set({ activeModal: "senior_dialog" });
        }
        // If in arrest → ACLSModal will detect seniorPresence === "present"

      } else if (ev.type === "senior_rushback") {
        // Senior rushing back from OR after arrest
        set({ seniorPresence: "present" });
        firedEntries.push({
          id: nextId("tl"),
          gameTime: newTime,
          type: "nurse_message",
          content: "（學長衝進來）「Arrest 了？我來！開 resternotomy tray！」",
          sender: "senior",
          isImportant: true,
        });

      } else if (ev.type === "or_ready") {
        // OR is ready — senior returns, transport patient
        const orData = ev.data as ScriptedEventData;
        firedEntries.push({
          id: nextId("tl"),
          gameTime: newTime,
          type: "nurse_message",
          content: orData?.message ?? "學長回來了：「OR ready，走吧。」",
          sender: "senior",
          isImportant: true,
        });
        set({ seniorPresence: "present" });

        // If patient still alive → transition to outcome after brief delay
        const orPat = get().patient;
        const orRhythm = orPat?.vitals.rhythmStrip ?? "nsr";
        const orInArrest = orPat?.vitals.hr === 0 ||
          ["vf", "vt_pulseless", "pea", "asystole"].includes(orRhythm);
        if (!orInArrest && get().phase === "playing") {
          setTimeout(() => {
            const s = get();
            if (s.phase === "playing") {
              set({ phase: "outcome" as GamePhase, activeModal: null });
            }
          }, 3000);
        }
        // If in arrest → ACLSModal handles resternotomy (senior now present)
      }
    }

    // Only add time marker when events actually fire
    const newEntries: TimelineEntry[] = [];
    if (firedEntries.length > 0) {
      newEntries.push({
        id: nextId("tl"),
        gameTime: newTime,
        type: "system_event",
        content: `⏰ ${formatGameTime(newTime, clock.startHour)}`,
        sender: "system",
      });
      newEntries.push(...firedEntries);
    }

    set((state) => ({
      clock: updatedClock,
      pendingEvents: updatedPending,
      firedEvents: [...state.firedEvents, ...newlyFired],
      timeline: newEntries.length > 0 ? [...state.timeline, ...newEntries] : state.timeline,
    }));

    // 處理 order_effect 事件 — 藥物/輸血生效
    for (const ev of toFire) {
      if (ev.type === "order_effect") {
        const nurseName = get().scenario?.nurseProfile?.name ?? "護理師";
        const effectData = ev.data as OrderEffectData;

        if (effectData?.isMTP) {
          // MTP round effect
          const mtpEffect = getMTPRoundEffect(newTime);
          get().addActiveEffect(mtpEffect);
          set((state) => ({
            mtpState: {
              ...state.mtpState,
              roundsDelivered: state.mtpState.roundsDelivered + 1,
            },
            timeline: [
              ...state.timeline,
              {
                id: nextId("tl"),
                gameTime: newTime,
                type: "nurse_message" as TimelineEntry["type"],
                content: `${nurseName}：MTP Round ${(effectData.mtpRound ?? 1)} 血品到了！pRBC 2U + FFP 2U + Plt 1 dose 開始輸注。`,
                sender: "nurse" as const,
                isImportant: true,
              },
            ],
          }));

          // Schedule next MTP round (15 min intervals) — up to 4 rounds max
          const currentRound = get().mtpState.roundsDelivered;
          if (currentRound < 4) {
            set((state) => ({
              pendingEvents: [
                ...state.pendingEvents,
                {
                  id: nextId("evt"),
                  type: "order_effect" as PendingEvent["type"],
                  triggerAt: newTime + 15,
                  data: { isMTP: true, mtpRound: currentRound + 1 } as OrderEffectData,
                  fired: false,
                  priority: 0,
                },
              ],
            }));
          }
        } else if (effectData?.orderId) {
          const order = get().placedOrders.find((o) => o.id === effectData.orderId);
          if (order) {
            const weight = get().scenario?.patient?.weight ?? 70;
            const effect = getOrderEffect(order, weight, get().patient?.pathology);
            if (effect) {
              get().addActiveEffect(effect);
              // 更新 order 狀態為 in_progress
              get().updateOrderStatus(effectData.orderId, "in_progress");
              // 護理師確認藥物生效
              set((state) => ({
                timeline: [
                  ...state.timeline,
                  {
                    id: nextId("tl"),
                    gameTime: newTime,
                    type: "nurse_message" as TimelineEntry["type"],
                    content: `${nurseName}：${order.definition.name} 已開始作用了。`,
                    sender: "nurse" as const,
                  },
                ],
              }));
            }
          }
        }
      }
    }

    // 把觸發的事件記錄到 playerActions（供 score-engine 分析）
    if (toFire.length > 0) {
      const trackedActions: TrackedAction[] = toFire.map((e) => ({
        action: `event_fired:${e.id}:${e.type}`,
        gameTime: get().clock.currentTime,
      }));
      set((state) => ({
        playerActions: [...state.playerActions, ...trackedActions],
      }));
    }

    // ── Phase Transition Engine evaluation ──
    // After vitals/events are updated, evaluate condition-driven transitions.
    // Pure evaluation → collect actions → apply to store.
    {
      const latestState = get();
      const { phaseTransitions } = latestState;
      if (phaseTransitions.length > 0 && latestState.patient) {
        const evalState: PhaseEvalState = {
          elapsedMinutes: newTime,
          severity: latestState.patient.severity,
          vitals: latestState.patient.vitals,
          actionsTaken: latestState.playerActions.map((pa) => pa.action.toLowerCase()),
        };

        const matched = evaluateTransitions(phaseTransitions, evalState);

        if (matched.length > 0) {
          // Mark fired transitions (immutable update)
          const firedIds = matched.map((m) => m.transitionId);
          const updatedTransitions = markTransitionsFired(phaseTransitions, firedIds, newTime);
          set({ phaseTransitions: updatedTransitions });

          // Apply actions from all matched transitions
          const phaseEntries: TimelineEntry[] = [];
          for (const match of matched) {
            for (const action of match.actions) {
              switch (action.type) {
                case "update_severity_rate":
                  // Adjust severity via a synthetic effect or direct severity manipulation.
                  // For simplicity, apply as a severity delta rate change on patient state.
                  // The patient-engine's base severity rate is per-pathology, so we encode
                  // this as a tracked action that scenario scripts can use.
                  set((s) => ({
                    playerActions: [
                      ...s.playerActions,
                      { action: `phase_transition:severity_rate:${action.payload.rate}`, gameTime: newTime },
                    ],
                  }));
                  break;

                case "trigger_event": {
                  const eventStr = action.payload.event as string;
                  set((s) => ({
                    playerActions: [
                      ...s.playerActions,
                      { action: `phase_transition:event:${eventStr}`, gameTime: newTime },
                    ],
                  }));
                  // Handle pathology_change trigger events
                  if (eventStr.startsWith("pathology_change:")) {
                    const newPathology = eventStr.replace("pathology_change:", "") as Pathology;
                    set((s) => {
                      if (!s.patient) return {};
                      // Re-evaluate active effects for new pathology
                      const updatedEffects = s.patient.activeEffects.map(eff => ({
                        ...eff,
                        isCorrectTreatment: eff.isCorrectTreatment
                          ? isEffectCorrectForNewPathology(eff, newPathology)
                          : false,
                      }));

                      // Tamponade: CT becomes obstructed (clot in pericardium compresses drain)
                      const isTamponade = newPathology === "cardiac_tamponade" || newPathology === "tamponade";
                      const newChestTube = isTamponade
                        ? {
                            ...s.patient.chestTube,
                            hasClots: true,
                            isPatent: false,
                            currentRate: Math.max(10, Math.round(s.patient.chestTube.currentRate * 0.15)),
                            color: "dark_red" as const,
                          }
                        : s.patient.chestTube;

                      return {
                        patient: {
                          ...s.patient,
                          pathology: newPathology,
                          severity: 25, // Reset severity for new phase
                          activeEffects: updatedEffects,
                          chestTube: newChestTube,
                        },
                      };
                    });
                  }
                  break;
                }

                case "update_vitals_target":
                  // Apply vitals delta to current patient state
                  set((s) => {
                    if (!s.patient) return {};
                    const merged = { ...s.patient.vitals };
                    for (const [key, delta] of Object.entries(action.payload.vitals)) {
                      if (typeof delta === "number" && typeof (merged as Record<string, unknown>)[key] === "number") {
                        (merged as unknown as Record<string, number>)[key] += delta;
                      }
                    }
                    // Clamp BP/MAP to prevent negative values
                    if (typeof merged.sbp === "number") merged.sbp = Math.max(0, merged.sbp);
                    if (typeof merged.dbp === "number") merged.dbp = Math.max(0, merged.dbp);
                    if (typeof merged.map === "number") merged.map = Math.max(0, merged.map);
                    if (typeof merged.hr === "number") merged.hr = Math.max(0, merged.hr);
                    return { patient: { ...s.patient, vitals: merged } };
                  });
                  break;

                case "send_biogears_command": {
                  // Dispatch to BioGears engine (fire-and-forget async)
                  const bgCmd = action.payload;
                  set((s) => ({
                    playerActions: [
                      ...s.playerActions,
                      { action: `phase_transition:biogears:${JSON.stringify(bgCmd)}`, gameTime: newTime },
                    ],
                  }));
                  // Actually dispatch the BioGears command
                  if (bgCmd.cmd === "stop_hemorrhage") {
                    import("@/lib/simulator/engine/biogears-engine").then(m =>
                      m.stopBioGearsHemorrhage(bgCmd.compartment as string ?? "Aorta")
                    );
                  } else if (bgCmd.cmd === "pericardial_effusion") {
                    dispatchPericardialEffusion(bgCmd.rate_mL_per_min as number ?? 2.0);
                  } else if (bgCmd.cmd === "hemorrhage") {
                    import("@/lib/simulator/engine/biogears-engine").then(m =>
                      m.startBioGearsHemorrhage(bgCmd.compartment as string ?? "Aorta", bgCmd.rate_mL_per_min as number ?? 150)
                    );
                  }
                  break;
                }

                case "add_message": {
                  const nurseName = get().scenario?.nurseProfile?.name ?? "護理師";
                  const sender = action.payload.sender === "nurse" ? "nurse"
                    : action.payload.sender === "senior" ? "senior"
                    : "system";
                  phaseEntries.push({
                    id: nextId("tl"),
                    gameTime: newTime,
                    type: sender === "system" ? "system_event" : "nurse_message",
                    content: sender === "nurse" ? `${nurseName}：${action.payload.text}` : action.payload.text,
                    sender,
                    isImportant: true,
                  });
                  break;
                }
              }
            }
          }

          // Add phase transition timeline entries
          if (phaseEntries.length > 0) {
            set((s) => ({
              timeline: [...s.timeline, ...phaseEntries],
            }));
          }
        }
      }
    }

    // ── Nurse Trigger Engine evaluation ──
    // After all state updates, evaluate condition-driven nurse dialogue.
    {
      const latestState = get();
      const { nurseTriggers: nTriggers, nurseTriggerState: nState } = latestState;
      if (nTriggers.length > 0 && latestState.patient) {
        // Count blood units given
        const bloodUnitsGiven = latestState.placedOrders.filter(
          (o) => o.definition.category === "transfusion" && (o.status === "completed" || o.status === "in_progress")
        ).length;

        const nurseCtx: NurseEvalContext = {
          vitals: latestState.patient.vitals,
          chestTube: latestState.patient.chestTube,
          severity: latestState.patient.severity,
          pathology: latestState.patient.pathology,
          elapsedMinutes: newTime,
          actionsTaken: latestState.playerActions.map((pa) => pa.action.toLowerCase()),
          bloodUnitsGiven,
        };

        const firedNurse = evaluateNurseTriggers(nTriggers, nurseCtx, nState);

        if (firedNurse.length > 0) {
          const nurseName = latestState.scenario?.nurseProfile?.name ?? "護理師";
          const nurseEntries: TimelineEntry[] = firedNurse.map((f) => ({
            id: nextId("tl"),
            gameTime: newTime,
            type: (f.category === "escalation" ? "nurse_message" : "nurse_message") as TimelineEntry["type"],
            content: `${nurseName}：${f.message}`,
            sender: "nurse" as const,
            isImportant: f.category === "escalation" || f.category === "observation",
          }));

          const firedIds = firedNurse.map((f) => f.triggerId);
          const updatedNurseState = updateNurseTriggerState(nState, firedIds, newTime, nurseCtx);

          set((s) => ({
            timeline: [...s.timeline, ...nurseEntries],
            nurseTriggerState: updatedNurseState,
          }));
        } else {
          // Still update prev values for crossed_above/crossed_below tracking
          const updatedNurseState = updateNurseTriggerState(nState, [], newTime, nurseCtx);
          set({ nurseTriggerState: updatedNurseState });
        }
      }
    }
  },

  // ----------------------------------------------------------
  // actionAdvance — advance time + trigger events (patient update done by useGameTick)
  // Called by modals/actions to simulate time passing during an action.
  // ----------------------------------------------------------
  actionAdvance: (minutes: number) => {
    if (minutes <= 0) return;
    // Split into 1-minute sub-ticks to avoid skipping death thresholds
    // (e.g., fast-forward 5 min should detect death at minute 3, not skip to minute 5)
    for (let i = 0; i < minutes; i++) {
      get().advanceTime(1);
      const tick = get()._tickPatientFn;
      if (typeof tick === "function") {
        tick(1);
      }
      // Stop early if patient died or game ended during sub-tick
      if (get().phase !== "playing") break;
    }
  },
});
