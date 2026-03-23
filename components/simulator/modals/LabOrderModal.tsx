"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/simulator/ui/dialog";
import { Button } from "@/components/simulator/ui/button";
import { Checkbox } from "@/components/simulator/ui/checkbox";
import { ScrollArea } from "@/components/simulator/ui/scroll-area";
import { Separator } from "@/components/simulator/ui/separator";
import { useGameStore } from "@/lib/simulator/store";
import { TestTube, Droplets, FlaskConical } from "lucide-react";

// Bundle items (ordered as a whole package)
const bundleItems = [
  {
    id: "cbc",
    name: "CBC (全血球計數)",
    icon: Droplets,
    items: ["wbc", "hb", "hct", "platelet"],
    description: "WBC, Hb, Hct, Platelet",
  },
  {
    id: "abg",
    name: "ABG (動脈血氣分析)",
    icon: FlaskConical,
    items: ["ph", "pco2", "po2", "hco3", "be", "sao2"],
    description: "pH, pCO2, pO2, HCO3, BE, SaO2",
  },
];

// Individual items grouped by category
const labCategories = [
  {
    category: "biochemistry",
    name: "Biochemistry (生化)",
    items: [
      { id: "bun", label: "BUN" },
      { id: "cr", label: "Creatinine" },
      { id: "na", label: "Na" },
      { id: "k", label: "K" },
      { id: "cl", label: "Cl" },
      { id: "ca", label: "Ca" },
      { id: "mg", label: "Mg" },
      { id: "phosphate", label: "Phosphate" },
      { id: "ast", label: "AST" },
      { id: "alt", label: "ALT" },
      { id: "alk_p", label: "Alk-P" },
      { id: "t_bil", label: "T-Bil" },
      { id: "d_bil", label: "D-Bil" },
      { id: "albumin", label: "Albumin" },
      { id: "glucose", label: "Glucose" },
      { id: "ammonia", label: "Ammonia" },
    ],
  },
  {
    category: "cardiac",
    name: "Cardiac Markers (心臟標記)",
    items: [
      { id: "troponin_i", label: "Troponin-I" },
      { id: "troponin_t", label: "Troponin-T" },
      { id: "nt_probnp", label: "NT-proBNP" },
      { id: "bnp", label: "BNP" },
      { id: "ck_mb", label: "CK-MB" },
    ],
  },
  {
    category: "infection",
    name: "Infection Markers (感染指標)",
    items: [
      { id: "procalcitonin", label: "Procalcitonin" },
      { id: "lactate", label: "Lactate" },
      { id: "crp", label: "CRP" },
      { id: "esr", label: "ESR" },
    ],
  },
  {
    category: "coagulation",
    name: "Coagulation (凝血功能)",
    items: [
      { id: "pt_inr", label: "PT/INR" },
      { id: "aptt", label: "aPTT" },
      { id: "d_dimer", label: "D-dimer" },
      { id: "fibrinogen", label: "Fibrinogen" },
    ],
  },
  {
    category: "cultures",
    name: "Cultures (培養)",
    items: [
      { id: "blood_culture", label: "Blood Culture (血液培養)" },
      { id: "urine_culture", label: "Urine Culture (尿液培養)" },
      { id: "sputum_culture", label: "Sputum Culture (痰液培養)" },
      { id: "wound_culture", label: "Wound Culture (傷口培養)" },
    ],
  },
  {
    category: "urinalysis",
    name: "Urinalysis (尿液檢查)",
    items: [
      { id: "ua_routine", label: "U/A Routine (尿液常規)" },
      { id: "ua_sediment", label: "U/A Sediment (尿沉渣)" },
      { id: "urine_osm", label: "Urine Osmolality" },
      { id: "urine_na", label: "Urine Na" },
      { id: "urine_cr", label: "Urine Creatinine" },
    ],
  },
  {
    category: "others",
    name: "Others (其他)",
    items: [
      { id: "tsh", label: "TSH" },
      { id: "free_t4", label: "Free T4" },
      { id: "cortisol", label: "Cortisol" },
      { id: "lipase", label: "Lipase" },
      { id: "amylase", label: "Amylase" },
      { id: "ldh", label: "LDH" },
      { id: "ferritin", label: "Ferritin" },
      { id: "iron", label: "Iron" },
      { id: "tibc", label: "TIBC" },
    ],
  },
];

export function LabOrderModal() {
  const activeModal = useGameStore((state) => state.activeModal);
  const setActiveModal = useGameStore((state) => state.setActiveModal);
  const orderedLabs = useGameStore((state) => state.orderedLabs);
  const addOrderedLab = useGameStore((state) => state.addOrderedLab);
  const setLabResultsAvailable = useGameStore(
    (state) => state.setLabResultsAvailable
  );
  const addMessage = useGameStore((state) => state.addMessage);
  const addPlayerAction = useGameStore((state) => state.addPlayerAction);

  // Selected bundles (e.g., "cbc", "abg")
  const [selectedBundles, setSelectedBundles] = useState<string[]>([]);
  // Selected individual items (e.g., "bun", "cr", "troponin_i")
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const isOpen = activeModal === "lab-order";

  // Check if a bundle is already ordered
  const isBundleOrdered = (bundleId: string) => {
    return orderedLabs.some((lab) => lab.category === bundleId);
  };

  // Check if an individual item is already ordered
  const isItemOrdered = (itemId: string) => {
    return orderedLabs.some((lab) => lab.items.includes(itemId));
  };

  // Toggle bundle selection
  const toggleBundle = (bundleId: string) => {
    if (isBundleOrdered(bundleId)) return;
    setSelectedBundles((prev) =>
      prev.includes(bundleId)
        ? prev.filter((id) => id !== bundleId)
        : [...prev, bundleId]
    );
  };

  // Toggle individual item selection
  const toggleItem = (itemId: string) => {
    if (isItemOrdered(itemId)) return;
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Get delay time based on item type (cultures take longer)
  const getResultDelay = (itemId: string): number => {
    if (itemId.includes("culture")) return 5000; // Cultures: 5 seconds (simulating longer wait)
    return 2000; // Regular labs: 2 seconds
  };

  const handleOrder = () => {
    const totalSelected = selectedBundles.length + selectedItems.length;
    if (totalSelected === 0) return;

    const orderedNames: string[] = [];

    // Process bundles
    selectedBundles.forEach((bundleId) => {
      const bundle = bundleItems.find((b) => b.id === bundleId);
      if (bundle) {
        addOrderedLab({
          category: bundleId,
          items: bundle.items,
        });
        orderedNames.push(bundle.name);

        setTimeout(() => {
          setLabResultsAvailable(bundleId);
        }, 2000);
      }
    });

    // Group individual items by category for ordering
    const itemsByCategory: Record<string, string[]> = {};
    selectedItems.forEach((itemId) => {
      for (const cat of labCategories) {
        const item = cat.items.find((i) => i.id === itemId);
        if (item) {
          if (!itemsByCategory[cat.category]) {
            itemsByCategory[cat.category] = [];
          }
          itemsByCategory[cat.category].push(itemId);
          orderedNames.push(item.label);
          break;
        }
      }
    });

    // Add individual items grouped by category
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      // Check if category already exists in orderedLabs
      const existingLab = orderedLabs.find((lab) => lab.category === category);

      if (existingLab) {
        // Merge with existing - this requires updating the store
        // For now, we'll create a new entry with just the new items
        addOrderedLab({
          category: `${category}_${Date.now()}`,
          items: items,
        });
      } else {
        addOrderedLab({
          category: category,
          items: items,
        });
      }

      // Set results available after delay
      const maxDelay = Math.max(...items.map(getResultDelay));
      setTimeout(() => {
        setLabResultsAvailable(category);
      }, maxDelay);
    });

    // Create message
    const isCultureOrdered = selectedItems.some((id) => id.includes("culture"));
    let message = `【檢驗開立】已開立：${orderedNames.join(", ")}`;
    if (isCultureOrdered) {
      message += "\n培養檢體請確認已正確採集。結果需較長時間。";
    } else {
      message += "\n報告約 2 秒後可查看。";
    }

    addMessage({
      role: "system",
      content: message,
    });

    // Track player action
    addPlayerAction("lab_order", `開立檢驗: ${orderedNames.join(", ")}`, {
      bundles: selectedBundles,
      items: selectedItems,
    });

    setSelectedBundles([]);
    setSelectedItems([]);
    setActiveModal(null);
  };

  const handleClose = () => {
    setSelectedBundles([]);
    setSelectedItems([]);
    setActiveModal(null);
  };

  const totalSelected = selectedBundles.length + selectedItems.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            開立檢驗 (Order Labs)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Bundle Items (CBC, ABG) */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                套組檢驗 (Package)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {bundleItems.map((bundle) => {
                  const isOrdered = isBundleOrdered(bundle.id);
                  const isSelected = selectedBundles.includes(bundle.id);
                  const Icon = bundle.icon;

                  return (
                    <div
                      key={bundle.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isOrdered
                          ? "bg-muted opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleBundle(bundle.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected || isOrdered}
                          disabled={isOrdered}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {bundle.name}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {bundle.description}
                          </div>
                          {isOrdered && (
                            <span className="text-xs text-green-600">(已開立)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Individual Items by Category */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                個別檢驗項目 (Individual Items)
              </h3>
              <div className="space-y-4">
                {labCategories.map((category) => (
                  <div key={category.category}>
                    <h4 className="text-sm font-medium mb-2">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {category.items.map((item) => {
                        const isOrdered = isItemOrdered(item.id);
                        const isSelected = selectedItems.includes(item.id);

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-2 p-2 rounded border text-sm cursor-pointer transition-colors ${
                              isOrdered
                                ? "bg-muted opacity-60 cursor-not-allowed"
                                : isSelected
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => toggleItem(item.id)}
                          >
                            <Checkbox
                              checked={isSelected || isOrdered}
                              disabled={isOrdered}
                              className="h-3.5 w-3.5"
                            />
                            <span className={`truncate ${isOrdered ? "line-through" : ""}`}>
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-muted-foreground">
            已選擇 {totalSelected} 項
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button onClick={handleOrder} disabled={totalSelected === 0}>
              開立檢驗
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
