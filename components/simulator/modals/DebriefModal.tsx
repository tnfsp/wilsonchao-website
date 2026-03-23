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
import {
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Stethoscope,
  TestTube,
  Monitor,
  Pill,
  Clock,
  MessageCircle,
} from "lucide-react";

const diagnosisLabels: Record<string, string> = {
  cardiogenic_shock: "Cardiogenic Shock",
  septic_shock: "Septic Shock",
  hypovolemic_shock: "Hypovolemic Shock",
  distributive_shock: "Distributive Shock",
  obstructive_shock: "Obstructive Shock",
  mixed_shock: "Mixed Shock",
};

export function DebriefModal() {
  const activeModal = useGameStore((state) => state.activeModal);
  const setActiveModal = useGameStore((state) => state.setActiveModal);
  const scenario = useGameStore((state) => state.scenario);
  const submittedDiagnosis = useGameStore((state) => state.submittedDiagnosis);
  const examinedItems = useGameStore((state) => state.examinedItems);
  const pocusExamined = useGameStore((state) => state.pocusExamined);
  const orderedLabs = useGameStore((state) => state.orderedLabs);
  const orderedMedications = useGameStore((state) => state.orderedMedications);
  const playerActions = useGameStore((state) => state.playerActions);
  const handoffFeedback = useGameStore((state) => state.handoffFeedback);
  const resetGame = useGameStore((state) => state.resetGame);

  const isOpen = activeModal === "debrief";

  if (!scenario || !submittedDiagnosis) return null;

  const correctDiagnosis = scenario.diagnosis.primary
    .toLowerCase()
    .replace(/\s+/g, "_");
  const isCorrect = submittedDiagnosis === correctDiagnosis;

  // Check which key findings were discovered
  const keyFindings = scenario.diagnosis.key_differentiators;
  const discoveredFindings: string[] = [];
  const missedFindings: string[] = [];

  keyFindings.forEach((finding) => {
    const findingLower = finding.toLowerCase();

    // Check if related PE was done
    const peDiscovered =
      (findingLower.includes("jvp") &&
        examinedItems.some((e) => e.item === "cardiac-jvp")) ||
      (findingLower.includes("cold") &&
        examinedItems.some((e) => e.item === "extremities-temp")) ||
      (findingLower.includes("s3") &&
        examinedItems.some((e) => e.item === "cardiac-heart"));

    // Check if related POCUS was done
    const pocusDiscovered =
      (findingLower.includes("echo") ||
        findingLower.includes("lv") ||
        findingLower.includes("ivc")) &&
      pocusExamined.length > 0;

    // Check if related labs were ordered
    const labDiscovered =
      findingLower.includes("procalcitonin") &&
      orderedLabs.some((l) => l.category === "infection");

    if (peDiscovered || pocusDiscovered || labDiscovered) {
      discoveredFindings.push(finding);
    } else {
      missedFindings.push(finding);
    }
  });

  // Check for wrong treatments
  const wrongTreatments: string[] = [];
  const correctTreatments: string[] = [];

  orderedMedications.forEach((med) => {
    const medLower = med.name.toLowerCase();

    // Check if fluid was given (wrong for cardiogenic shock)
    if (
      (medLower.includes("saline") ||
        medLower.includes("ringer") ||
        medLower.includes("albumin")) &&
      correctDiagnosis === "cardiogenic_shock"
    ) {
      wrongTreatments.push(
        `${med.name} - Cardiogenic shock 給輸液會加重肺水腫`
      );
    }

    // Check if appropriate vasopressor/inotrope was given
    if (
      medLower.includes("norepinephrine") ||
      medLower.includes("dobutamine")
    ) {
      correctTreatments.push(med.name);
    }
  });

  const handleClose = () => {
    setActiveModal(null);
  };

  const handleRestart = () => {
    resetGame();
    setActiveModal(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Debrief - 案例回顧
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-4">
            {/* Diagnosis Result */}
            <Card
              className={
                isCorrect
                  ? "border-green-300 dark:border-green-700"
                  : "border-red-300 dark:border-red-700"
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  診斷結果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground">您的診斷：</span>
                    <span
                      className={`ml-2 font-medium ${
                        isCorrect ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {diagnosisLabels[submittedDiagnosis] || submittedDiagnosis}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">正確診斷：</span>
                    <span className="ml-2 font-medium text-green-600">
                      {scenario.diagnosis.primary}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Findings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  關鍵發現
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {discoveredFindings.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-1">
                        您發現了：
                      </div>
                      <ul className="text-sm space-y-1">
                        {discoveredFindings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {missedFindings.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-orange-600 mb-1">
                        您可能遺漏：
                      </div>
                      <ul className="text-sm space-y-1">
                        {missedFindings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Treatment Review */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  處置回顧
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {correctTreatments.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-600 mb-1">
                        適當處置：
                      </div>
                      <ul className="text-sm space-y-1">
                        {correctTreatments.map((t, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {wrongTreatments.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-1">
                        需要注意：
                      </div>
                      <ul className="text-sm space-y-1">
                        {wrongTreatments.map((t, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {orderedMedications.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      您尚未開立任何醫囑
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optimal Management */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  建議處置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-green-600 mb-1">
                      建議：
                    </div>
                    <ul className="text-sm space-y-1">
                      {scenario.optimal_management.recommended.map((r, i) => (
                        <li key={i}>
                          <span className="font-medium">{r.action}</span>
                          {r.detail && (
                            <span className="text-muted-foreground">
                              {" "}
                              - {r.detail}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {scenario.optimal_management.avoid.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-red-600 mb-1">
                        避免：
                      </div>
                      <ul className="text-sm space-y-1">
                        {scenario.optimal_management.avoid.map((a, i) => (
                          <li key={i}>
                            <span className="font-medium">{a.action}</span>
                            {a.reason && (
                              <span className="text-muted-foreground">
                                {" "}
                                - {a.reason}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Handoff Score */}
            {handoffFeedback && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    交班報告評分
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">學長評價</span>
                    <span className="text-2xl font-bold">{handoffFeedback.score}<span className="text-sm text-muted-foreground">/100</span></span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Timeline */}
            {playerActions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    操作歷程
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {playerActions
                      .filter((a) => a.type !== "game_start" && a.type !== "game_end")
                      .map((action, i) => (
                        <div
                          key={action.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-muted-foreground min-w-[50px]">
                            {new Date(action.timestamp).toLocaleTimeString("zh-TW", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          <span>{action.detail}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning Points */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Lightbulb className="h-5 w-5" />
                  學習重點
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2">
                  {scenario.learning_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            關閉
          </Button>
          <Button onClick={handleRestart}>再試一次</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
