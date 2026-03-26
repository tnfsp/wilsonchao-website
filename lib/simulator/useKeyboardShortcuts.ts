"use client";

import { useEffect } from "react";
import { useProGameStore } from "@/lib/simulator/store";

/**
 * Keyboard shortcuts for the Pro simulator:
 *   1 = PE, 2 = 抽血, 3 = 處置, 4 = 通報/叫人/交班 (ConsultModal), 5 = 電擊
 *   6 = 影像
 *   L = Lab Overview
 *   Space = toggle pause (open/close pause_think modal)
 *   F = fast forward 5 min
 *   Escape = close any open modal
 *
 * Disabled when a text input/textarea is focused.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Skip when typing in an input field
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      const state = useProGameStore.getState();
      if (state.phase !== "playing" && state.phase !== "sbar" && state.phase !== "outcome") return;

      const key = e.key.toLowerCase();

      // Escape — close any modal
      if (e.key === "Escape") {
        if (state.activeModal) {
          e.preventDefault();
          state.closeModal();
        }
        return;
      }

      // Don't trigger shortcuts when a modal is open (except Escape)
      if (state.activeModal) return;
      if (state.phase !== "playing") return;

      switch (key) {
        case "1":
          e.preventDefault();
          state.openModal("pe");
          break;
        case "2":
          e.preventDefault();
          state.openModal("lab_order");
          break;
        case "3":
          e.preventDefault();
          state.openModal("order");
          break;
        case "4":
          e.preventDefault();
          // Always open ConsultModal — player chooses call senior / SBAR from there
          state.openModal("consult");
          break;
        case "5":
          e.preventDefault();
          state.openModal("defibrillator");
          break;
        case " ":
          e.preventDefault();
          state.openModal("pause_think");
          break;
        case "l":
          e.preventDefault();
          state.openModal("lab_overview");
          break;
        case "f":
          e.preventDefault();
          state.actionAdvance(5);
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
