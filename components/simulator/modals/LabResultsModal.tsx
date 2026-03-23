"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/simulator/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/simulator/ui/card";
import { ScrollArea } from "@/components/simulator/ui/scroll-area";
import { Badge } from "@/components/simulator/ui/badge";
import { useGameStore } from "@/lib/simulator/store";
import { ClipboardList, AlertTriangle, Clock, Microscope } from "lucide-react";

// Normal ranges for highlighting abnormal values
const normalRanges: Record<string, { min: number; max: number; unit: string }> = {
  // CBC
  wbc: { min: 4.5, max: 11.0, unit: "x10³/μL" },
  hb: { min: 12.0, max: 16.0, unit: "g/dL" },
  hct: { min: 36, max: 48, unit: "%" },
  platelet: { min: 150, max: 400, unit: "x10³/μL" },
  // Biochemistry
  bun: { min: 7, max: 20, unit: "mg/dL" },
  cr: { min: 0.6, max: 1.2, unit: "mg/dL" },
  na: { min: 136, max: 145, unit: "mEq/L" },
  k: { min: 3.5, max: 5.0, unit: "mEq/L" },
  cl: { min: 98, max: 106, unit: "mEq/L" },
  ca: { min: 8.5, max: 10.5, unit: "mg/dL" },
  mg: { min: 1.7, max: 2.2, unit: "mg/dL" },
  phosphate: { min: 2.5, max: 4.5, unit: "mg/dL" },
  ast: { min: 0, max: 40, unit: "U/L" },
  alt: { min: 0, max: 40, unit: "U/L" },
  alk_p: { min: 44, max: 147, unit: "U/L" },
  t_bil: { min: 0.1, max: 1.2, unit: "mg/dL" },
  d_bil: { min: 0, max: 0.3, unit: "mg/dL" },
  albumin: { min: 3.5, max: 5.0, unit: "g/dL" },
  glucose: { min: 70, max: 100, unit: "mg/dL" },
  ammonia: { min: 15, max: 45, unit: "μg/dL" },
  // Cardiac
  troponin_i: { min: 0, max: 0.04, unit: "ng/mL" },
  troponin_t: { min: 0, max: 0.01, unit: "ng/mL" },
  nt_probnp: { min: 0, max: 125, unit: "pg/mL" },
  bnp: { min: 0, max: 100, unit: "pg/mL" },
  ck_mb: { min: 0, max: 25, unit: "U/L" },
  // Infection
  procalcitonin: { min: 0, max: 0.5, unit: "ng/mL" },
  lactate: { min: 0.5, max: 2.0, unit: "mmol/L" },
  crp: { min: 0, max: 1.0, unit: "mg/dL" },
  esr: { min: 0, max: 20, unit: "mm/hr" },
  // ABG
  ph: { min: 7.35, max: 7.45, unit: "" },
  pco2: { min: 35, max: 45, unit: "mmHg" },
  po2: { min: 80, max: 100, unit: "mmHg" },
  hco3: { min: 22, max: 26, unit: "mEq/L" },
  be: { min: -2, max: 2, unit: "mEq/L" },
  sao2: { min: 95, max: 100, unit: "%" },
  // Coagulation
  pt_inr: { min: 0.9, max: 1.1, unit: "" },
  aptt: { min: 25, max: 35, unit: "sec" },
  d_dimer: { min: 0, max: 0.5, unit: "mg/L" },
  fibrinogen: { min: 200, max: 400, unit: "mg/dL" },
  // Urinalysis
  urine_osm: { min: 300, max: 900, unit: "mOsm/kg" },
  urine_na: { min: 40, max: 220, unit: "mEq/L" },
  urine_cr: { min: 20, max: 275, unit: "mg/dL" },
  // Others
  tsh: { min: 0.4, max: 4.0, unit: "mIU/L" },
  free_t4: { min: 0.8, max: 1.8, unit: "ng/dL" },
  cortisol: { min: 6, max: 23, unit: "μg/dL" },
  lipase: { min: 0, max: 160, unit: "U/L" },
  amylase: { min: 28, max: 100, unit: "U/L" },
  ldh: { min: 140, max: 280, unit: "U/L" },
  ferritin: { min: 12, max: 300, unit: "ng/mL" },
  iron: { min: 60, max: 170, unit: "μg/dL" },
  tibc: { min: 250, max: 370, unit: "μg/dL" },
};

const labDisplayNames: Record<string, string> = {
  // CBC
  wbc: "WBC",
  hb: "Hb",
  hct: "Hct",
  platelet: "Platelet",
  // Biochemistry
  bun: "BUN",
  cr: "Creatinine",
  na: "Na",
  k: "K",
  cl: "Cl",
  ca: "Ca",
  mg: "Mg",
  phosphate: "Phosphate",
  ast: "AST",
  alt: "ALT",
  alk_p: "Alk-P",
  t_bil: "T-Bil",
  d_bil: "D-Bil",
  albumin: "Albumin",
  glucose: "Glucose",
  ammonia: "Ammonia",
  // Cardiac
  troponin_i: "Troponin-I",
  troponin_t: "Troponin-T",
  nt_probnp: "NT-proBNP",
  bnp: "BNP",
  ck_mb: "CK-MB",
  // Infection
  procalcitonin: "Procalcitonin",
  lactate: "Lactate",
  crp: "CRP",
  esr: "ESR",
  // ABG
  ph: "pH",
  pco2: "pCO2",
  po2: "pO2",
  hco3: "HCO3",
  be: "BE",
  sao2: "SaO2",
  // Coagulation
  pt_inr: "PT (INR)",
  aptt: "aPTT",
  d_dimer: "D-dimer",
  fibrinogen: "Fibrinogen",
  // Cultures
  blood_culture: "Blood Culture",
  urine_culture: "Urine Culture",
  sputum_culture: "Sputum Culture",
  wound_culture: "Wound Culture",
  // Urinalysis
  ua_routine: "U/A Routine",
  ua_sediment: "U/A Sediment",
  urine_osm: "Urine Osmolality",
  urine_na: "Urine Na",
  urine_cr: "Urine Creatinine",
  // Others
  tsh: "TSH",
  free_t4: "Free T4",
  cortisol: "Cortisol",
  lipase: "Lipase",
  amylase: "Amylase",
  ldh: "LDH",
  ferritin: "Ferritin",
  iron: "Iron",
  tibc: "TIBC",
};

const categoryNames: Record<string, string> = {
  cbc: "CBC (全血球計數)",
  biochemistry: "Biochemistry (生化)",
  cardiac: "Cardiac Markers (心臟標記)",
  infection: "Infection Markers (感染指標)",
  abg: "ABG (動脈血氣分析)",
  coagulation: "Coagulation (凝血功能)",
  cultures: "Cultures (培養)",
  urinalysis: "Urinalysis (尿液檢查)",
  others: "Others (其他)",
};

// Culture items don't have numeric values
const cultureItems = ["blood_culture", "urine_culture", "sputum_culture", "wound_culture"];
const qualitativeItems = ["ua_routine", "ua_sediment"];

function isAbnormal(key: string, value: number): boolean {
  const range = normalRanges[key];
  if (!range) return false;
  return value < range.min || value > range.max;
}

function getAbnormalDirection(key: string, value: number): "high" | "low" | null {
  const range = normalRanges[key];
  if (!range) return null;
  if (value > range.max) return "high";
  if (value < range.min) return "low";
  return null;
}

export function LabResultsModal() {
  const activeModal = useGameStore((state) => state.activeModal);
  const setActiveModal = useGameStore((state) => state.setActiveModal);
  const scenario = useGameStore((state) => state.scenario);
  const orderedLabs = useGameStore((state) => state.orderedLabs);

  const isOpen = activeModal === "lab-results";

  const availableLabs = orderedLabs.filter((lab) => lab.resultsAvailable);

  if (!scenario) return null;

  const labResults = scenario.lab_results;

  const getLabValue = (category: string, item: string): number | string | undefined => {
    // Handle cultures and qualitative results
    if (cultureItems.includes(item)) {
      const cultureResults = (labResults as unknown as Record<string, Record<string, string>>).cultures;
      return cultureResults?.[item] || "Pending...";
    }
    if (qualitativeItems.includes(item)) {
      const urinalysisResults = (labResults as unknown as Record<string, Record<string, string>>).urinalysis;
      return urinalysisResults?.[item] || "Pending...";
    }

    // Handle numeric results - check in the base category first
    const baseCategory = category.split("_")[0]; // Handle category_timestamp format
    const categoryData = labResults[baseCategory as keyof typeof labResults];
    if (categoryData && typeof categoryData === "object") {
      const value = (categoryData as unknown as Record<string, number>)[item];
      if (value !== undefined) return value;
    }

    // Also check in other categories (for individual items)
    for (const cat of Object.values(labResults)) {
      if (cat && typeof cat === "object") {
        const value = (cat as unknown as Record<string, number | string>)[item];
        if (value !== undefined) return value;
      }
    }

    return undefined;
  };

  const isCultureItem = (item: string) => cultureItems.includes(item);
  const isQualitativeItem = (item: string) => qualitativeItems.includes(item);

  // Collect all abnormal values
  const abnormalValues: { item: string; value: number; direction: "high" | "low" }[] = [];
  availableLabs.forEach((lab) => {
    lab.items.forEach((item) => {
      if (!isCultureItem(item) && !isQualitativeItem(item)) {
        const value = getLabValue(lab.category, item);
        if (typeof value === "number" && isAbnormal(item, value)) {
          const direction = getAbnormalDirection(item, value);
          if (direction) {
            abnormalValues.push({ item, value, direction });
          }
        }
      }
    });
  });

  return (
    <Dialog open={isOpen} onOpenChange={() => setActiveModal(null)}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            檢驗報告 (Lab Results)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {availableLabs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              尚無檢驗報告，請先開立檢驗。
            </div>
          ) : (
            <div className="space-y-4">
              {availableLabs.map((lab) => {
                const baseCategory = lab.category.split("_")[0];
                const hasCultures = lab.items.some(isCultureItem);

                return (
                  <Card key={lab.category}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {hasCultures && <Microscope className="h-4 w-4" />}
                        {categoryNames[baseCategory] || baseCategory}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {hasCultures ? (
                        // Culture results display
                        <div className="space-y-2">
                          {lab.items.map((item) => {
                            const value = getLabValue(lab.category, item);
                            const isPending = value === "Pending..." || value === undefined;

                            return (
                              <div
                                key={item}
                                className="flex items-center justify-between p-2 rounded bg-muted/50"
                              >
                                <span className="font-medium">
                                  {labDisplayNames[item] || item}
                                </span>
                                {isPending ? (
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    培養中...
                                  </Badge>
                                ) : (
                                  <span className="text-sm">{String(value)}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Numeric results table
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">項目</th>
                              <th className="text-right py-2 font-medium">數值</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">
                                參考值
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {lab.items.map((item) => {
                              if (isQualitativeItem(item)) {
                                const value = getLabValue(lab.category, item);
                                return (
                                  <tr key={item} className="border-b last:border-0">
                                    <td className="py-2">{labDisplayNames[item] || item}</td>
                                    <td className="text-right py-2" colSpan={2}>
                                      <span className="text-sm">
                                        {value !== undefined ? String(value) : "-"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              }

                              const value = getLabValue(lab.category, item);
                              const numericValue = typeof value === "number" ? value : undefined;
                              const range = normalRanges[item];
                              const abnormal = numericValue !== undefined && isAbnormal(item, numericValue);
                              const direction = numericValue !== undefined ? getAbnormalDirection(item, numericValue) : null;

                              return (
                                <tr
                                  key={item}
                                  className={`border-b last:border-0 ${
                                    abnormal ? "bg-red-50 dark:bg-red-950/30" : ""
                                  }`}
                                >
                                  <td className="py-2">
                                    {labDisplayNames[item] || item}
                                  </td>
                                  <td className="text-right py-2">
                                    <span
                                      className={`font-medium ${
                                        abnormal
                                          ? "text-red-600 dark:text-red-400"
                                          : ""
                                      }`}
                                    >
                                      {numericValue !== undefined ? numericValue : "-"}
                                      {abnormal && (
                                        <span className="ml-1 text-xs">
                                          {direction === "high" ? "↑" : "↓"}
                                        </span>
                                      )}
                                    </span>
                                    {range && (
                                      <span className="text-muted-foreground ml-1">
                                        {range.unit}
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-right py-2 text-muted-foreground">
                                    {range ? `${range.min}-${range.max}` : "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Summary of abnormal values */}
              {abnormalValues.length > 0 && (
                <Card className="border-orange-200 dark:border-orange-800">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="h-4 w-4" />
                      異常值摘要
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm space-y-1">
                      {abnormalValues.map(({ item, value, direction }) => (
                        <div key={item}>
                          <span className="font-medium">
                            {labDisplayNames[item] || item}
                          </span>
                          : {value}{" "}
                          <span className="text-red-600 dark:text-red-400">
                            ({direction === "high" ? "偏高" : "偏低"})
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {availableLabs.length > 0 && abnormalValues.length === 0 && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                      檢驗結果
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground">
                      目前報告無明顯異常
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
