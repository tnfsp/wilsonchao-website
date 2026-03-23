"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/simulator/ui/dialog";
import { Button } from "@/components/simulator/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/simulator/ui/card";
import { ScrollArea } from "@/components/simulator/ui/scroll-area";
import { useGameStore } from "@/lib/simulator/store";
import { Stethoscope, Check } from "lucide-react";
import type { PhysicalExamCategory } from "@/lib/simulator/types";

interface ExamItem {
  id: string;
  label: string;
  category: PhysicalExamCategory;
  subCategory?: string;
}

const examItems: ExamItem[] = [
  { id: "general", label: "整體外觀 (General)", category: "general" },
  { id: "cardiac-jvp", label: "JVP", category: "cardiac", subCategory: "jvp" },
  {
    id: "cardiac-heart",
    label: "Heart sounds",
    category: "cardiac",
    subCategory: "heart_sound",
  },
  { id: "cardiac-pmi", label: "PMI", category: "cardiac", subCategory: "pmi" },
  {
    id: "pulmonary-breath",
    label: "Breath sounds",
    category: "pulmonary",
    subCategory: "breath_sounds",
  },
  {
    id: "pulmonary-percussion",
    label: "Percussion",
    category: "pulmonary",
    subCategory: "percussion",
  },
  { id: "abdomen", label: "腹部 (Abdomen)", category: "abdomen" },
  {
    id: "extremities-edema",
    label: "Edema",
    category: "extremities",
    subCategory: "edema",
  },
  {
    id: "extremities-pulse",
    label: "Peripheral pulse",
    category: "extremities",
    subCategory: "pulse",
  },
  {
    id: "extremities-cap",
    label: "Capillary refill",
    category: "extremities",
    subCategory: "capillary_refill",
  },
  {
    id: "extremities-temp",
    label: "四肢溫度",
    category: "extremities",
    subCategory: "temperature",
  },
];

export function PhysicalExamModal() {
  const activeModal = useGameStore((state) => state.activeModal);
  const setActiveModal = useGameStore((state) => state.setActiveModal);
  const scenario = useGameStore((state) => state.scenario);
  const examinedItems = useGameStore((state) => state.examinedItems);
  const addExaminedItem = useGameStore((state) => state.addExaminedItem);
  const addMessage = useGameStore((state) => state.addMessage);
  const addPlayerAction = useGameStore((state) => state.addPlayerAction);

  const isOpen = activeModal === "physical-exam";

  const handleExamine = (item: ExamItem) => {
    if (!scenario) return;

    // Check if already examined
    const alreadyExamined = examinedItems.some(
      (e) => e.category === item.category && e.item === item.id
    );
    if (alreadyExamined) return;

    // Get the result from scenario
    let result = "";
    const pe = scenario.physical_exam;

    if (item.category === "general") {
      result = pe.general;
    } else if (item.category === "abdomen") {
      result = pe.abdomen;
    } else if (item.category === "cardiac" && item.subCategory) {
      result = pe.cardiac[item.subCategory as keyof typeof pe.cardiac];
    } else if (item.category === "pulmonary" && item.subCategory) {
      result = pe.pulmonary[item.subCategory as keyof typeof pe.pulmonary];
    } else if (item.category === "extremities" && item.subCategory) {
      result = pe.extremities[item.subCategory as keyof typeof pe.extremities];
    }

    // Add to examined items
    addExaminedItem({
      category: item.category,
      item: item.id,
      result,
    });

    // Track player action
    addPlayerAction("physical_exam", `檢查: ${item.label}`, {
      category: item.category,
      item: item.id,
      result,
    });

    // Add system message
    addMessage({
      role: "system",
      content: `【理學檢查 - ${item.label}】\n${result}`,
    });
  };

  const isExamined = (itemId: string) => {
    return examinedItems.some((e) => e.item === itemId);
  };

  const getResult = (itemId: string) => {
    const examined = examinedItems.find((e) => e.item === itemId);
    return examined?.result;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setActiveModal(null)}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            理學檢查 (Physical Examination)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* General */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">General</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ExamButton
                  item={examItems[0]}
                  isExamined={isExamined(examItems[0].id)}
                  result={getResult(examItems[0].id)}
                  onExamine={handleExamine}
                />
              </CardContent>
            </Card>

            {/* Cardiac */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Cardiac</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {examItems
                  .filter((i) => i.category === "cardiac")
                  .map((item) => (
                    <ExamButton
                      key={item.id}
                      item={item}
                      isExamined={isExamined(item.id)}
                      result={getResult(item.id)}
                      onExamine={handleExamine}
                    />
                  ))}
              </CardContent>
            </Card>

            {/* Pulmonary */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Pulmonary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {examItems
                  .filter((i) => i.category === "pulmonary")
                  .map((item) => (
                    <ExamButton
                      key={item.id}
                      item={item}
                      isExamined={isExamined(item.id)}
                      result={getResult(item.id)}
                      onExamine={handleExamine}
                    />
                  ))}
              </CardContent>
            </Card>

            {/* Abdomen */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Abdomen</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ExamButton
                  item={examItems.find((i) => i.id === "abdomen")!}
                  isExamined={isExamined("abdomen")}
                  result={getResult("abdomen")}
                  onExamine={handleExamine}
                />
              </CardContent>
            </Card>

            {/* Extremities */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Extremities</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {examItems
                  .filter((i) => i.category === "extremities")
                  .map((item) => (
                    <ExamButton
                      key={item.id}
                      item={item}
                      isExamined={isExamined(item.id)}
                      result={getResult(item.id)}
                      onExamine={handleExamine}
                    />
                  ))}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ExamButtonProps {
  item: ExamItem;
  isExamined: boolean;
  result?: string;
  onExamine: (item: ExamItem) => void;
}

function ExamButton({ item, isExamined, result, onExamine }: ExamButtonProps) {
  return (
    <div className="space-y-1">
      <Button
        variant={isExamined ? "secondary" : "outline"}
        className="w-full justify-start"
        onClick={() => onExamine(item)}
        disabled={isExamined}
      >
        {isExamined && <Check className="h-4 w-4 mr-2 text-green-600" />}
        {item.label}
      </Button>
      {isExamined && result && (
        <div className="text-sm bg-muted p-2 rounded ml-6">{result}</div>
      )}
    </div>
  );
}
