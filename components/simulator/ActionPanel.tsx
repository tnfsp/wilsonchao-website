"use client";

import { Button } from "@/components/simulator/ui/button";
import { Card, CardContent } from "@/components/simulator/ui/card";
import { useGameStore } from "@/lib/simulator/store";
import {
  Stethoscope,
  TestTube,
  Monitor,
  Pill,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import type { ModalType } from "@/lib/simulator/types";

interface ActionButton {
  id: ModalType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const actionButtons: ActionButton[] = [
  {
    id: "physical-exam",
    label: "理學檢查",
    icon: Stethoscope,
    description: "Physical Exam",
  },
  {
    id: "lab-order",
    label: "開立檢驗",
    icon: TestTube,
    description: "Order Labs",
  },
  {
    id: "pocus",
    label: "POCUS",
    icon: Monitor,
    description: "Bedside Echo",
  },
  {
    id: "orders",
    label: "醫囑開立",
    icon: Pill,
    description: "Orders",
  },
  {
    id: "lab-results",
    label: "檢驗報告",
    icon: ClipboardList,
    description: "Lab Results",
  },
  {
    id: "handoff",
    label: "交班報告",
    icon: FileCheck,
    description: "Handoff Report",
  },
];

export function ActionPanel() {
  const setActiveModal = useGameStore((state) => state.setActiveModal);
  const gameStarted = useGameStore((state) => state.gameStarted);
  const gameEnded = useGameStore((state) => state.gameEnded);
  const orderedLabs = useGameStore((state) => state.orderedLabs);

  const hasLabResults = orderedLabs.some((lab) => lab.resultsAvailable);
  const pendingLabs = orderedLabs.filter((lab) => !lab.resultsAvailable).length;

  const handleAction = (actionId: ModalType) => {
    if (!gameStarted || gameEnded) return;
    setActiveModal(actionId);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-3 md:p-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {actionButtons.map((action) => {
            const isDisabled =
              !gameStarted ||
              gameEnded ||
              (action.id === "lab-results" && !hasLabResults);

            const showBadge =
              action.id === "lab-results" && hasLabResults;

            return (
              <Button
                key={action.id}
                variant={action.id === "handoff" ? "default" : "outline"}
                className={`h-auto py-2 md:py-3 px-1 md:px-2 flex flex-col items-center gap-1 relative ${
                  action.id === "handoff"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : ""
                }`}
                onClick={() => handleAction(action.id)}
                disabled={isDisabled}
              >
                <action.icon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[10px] md:text-xs font-medium">{action.label}</span>
                {showBadge && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
