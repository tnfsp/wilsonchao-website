"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/simulator/ui/dialog";
import { Button } from "@/components/simulator/ui/button";
import { Card, CardContent } from "@/components/simulator/ui/card";
import { ScrollArea } from "@/components/simulator/ui/scroll-area";
import { useGameStore } from "@/lib/simulator/store";
import { Monitor, Check, Play, Image as ImageIcon } from "lucide-react";
import type { POCUSViewType } from "@/lib/simulator/types";

interface POCUSViewInfo {
  id: POCUSViewType;
  label: string;
  description: string;
}

const pocusViews: POCUSViewInfo[] = [
  {
    id: "plax",
    label: "Parasternal Long Axis (PLAX)",
    description: "評估 LV function、Pericardial effusion",
  },
  {
    id: "psax",
    label: "Parasternal Short Axis (PSAX)",
    description: "評估 LV function、RV strain",
  },
  {
    id: "a4c",
    label: "Apical 4 Chamber (A4C)",
    description: "評估 LV/RV function、MR/TR",
  },
  {
    id: "subcostal",
    label: "Subcostal View",
    description: "評估 Pericardial effusion、RV",
  },
  {
    id: "ivc",
    label: "IVC Assessment",
    description: "評估 Volume status、CVP 估計",
  },
  {
    id: "lung",
    label: "Lung Ultrasound",
    description: "評估 B-lines、Pleural effusion",
  },
];

export function POCUSModal() {
  const activeModal = useGameStore((state) => state.activeModal);
  const setActiveModal = useGameStore((state) => state.setActiveModal);
  const scenario = useGameStore((state) => state.scenario);
  const pocusExamined = useGameStore((state) => state.pocusExamined);
  const addPOCUSExamined = useGameStore((state) => state.addPOCUSExamined);
  const addMessage = useGameStore((state) => state.addMessage);
  const addPlayerAction = useGameStore((state) => state.addPlayerAction);

  const isOpen = activeModal === "pocus";

  const handleExamine = (viewId: POCUSViewType) => {
    if (!scenario) return;

    const alreadyExamined = pocusExamined.some((p) => p.view === viewId);
    if (alreadyExamined) return;

    const finding = scenario.pocus_findings[viewId];
    if (!finding) {
      addMessage({
        role: "system",
        content: `【POCUS - ${viewId.toUpperCase()}】\n此 view 目前無資料。`,
      });
      return;
    }

    addPOCUSExamined({
      view: viewId,
      finding: finding.finding,
    });

    const viewInfo = pocusViews.find((v) => v.id === viewId);

    // Track player action
    addPlayerAction("pocus", `POCUS: ${viewInfo?.label || viewId}`, {
      view: viewId,
      finding: finding.finding,
    });

    addMessage({
      role: "system",
      content: `【POCUS - ${viewInfo?.label || viewId}】\n${finding.finding}`,
    });
  };

  const isExamined = (viewId: POCUSViewType) => {
    return pocusExamined.some((p) => p.view === viewId);
  };

  const getExaminedFinding = (viewId: POCUSViewType) => {
    const examined = pocusExamined.find((p) => p.view === viewId);
    return examined?.finding;
  };

  const hasMedia = (viewId: POCUSViewType) => {
    if (!scenario) return false;
    const finding = scenario.pocus_findings[viewId];
    return finding?.video || finding?.image;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => setActiveModal(null)}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            床邊超音波 (POCUS)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {pocusViews.map((view) => {
              const examined = isExamined(view.id);
              const finding = getExaminedFinding(view.id);
              const hasAsset = hasMedia(view.id);

              return (
                <Card
                  key={view.id}
                  className={examined ? "border-green-200 dark:border-green-800" : ""}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {view.label}
                          {examined && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {view.description}
                        </div>

                        {examined && finding && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <div className="text-sm font-medium mb-1">
                              Findings:
                            </div>
                            <div className="text-sm">{finding}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant={examined ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleExamine(view.id)}
                          disabled={examined}
                          className="gap-1"
                        >
                          {hasAsset ? (
                            <>
                              <Play className="h-3 w-3" />
                              執行
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-3 w-3" />
                              執行
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Placeholder for video/image */}
                    {examined && hasAsset && (
                      <div className="mt-3 aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <div className="text-sm">
                            影像/影片素材待上傳
                          </div>
                          <div className="text-xs">
                            {scenario?.pocus_findings[view.id]?.video ||
                              scenario?.pocus_findings[view.id]?.image}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
