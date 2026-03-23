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
import { Input } from "@/components/simulator/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/simulator/ui/card";
import { ScrollArea } from "@/components/simulator/ui/scroll-area";
import { useGameStore } from "@/lib/simulator/store";
import { Pill, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { validateMedication } from "@/lib/simulator/validators";

interface MedicationCategory {
  id: string;
  name: string;
  medications: Medication[];
}

interface Medication {
  id: string;
  name: string;
  defaultDose: string;
  defaultUnit: string;
  route: string;
  frequencies: string[];
}

const medicationCategories: MedicationCategory[] = [
  {
    id: "vasopressors",
    name: "Vasopressors",
    medications: [
      {
        id: "norepinephrine",
        name: "Norepinephrine",
        defaultDose: "0.05",
        defaultUnit: "mcg/kg/min",
        route: "IV",
        frequencies: ["Continuous"],
      },
      {
        id: "dopamine",
        name: "Dopamine",
        defaultDose: "5",
        defaultUnit: "mcg/kg/min",
        route: "IV",
        frequencies: ["Continuous"],
      },
      {
        id: "vasopressin",
        name: "Vasopressin",
        defaultDose: "0.03",
        defaultUnit: "units/min",
        route: "IV",
        frequencies: ["Continuous"],
      },
      {
        id: "epinephrine",
        name: "Epinephrine",
        defaultDose: "0.05",
        defaultUnit: "mcg/kg/min",
        route: "IV",
        frequencies: ["Continuous"],
      },
    ],
  },
  {
    id: "inotropes",
    name: "Inotropes",
    medications: [
      {
        id: "dobutamine",
        name: "Dobutamine",
        defaultDose: "5",
        defaultUnit: "mcg/kg/min",
        route: "IV",
        frequencies: ["Continuous"],
      },
      {
        id: "milrinone",
        name: "Milrinone",
        defaultDose: "0.375",
        defaultUnit: "mcg/kg/min",
        route: "IV",
        frequencies: ["Continuous"],
      },
    ],
  },
  {
    id: "fluids",
    name: "Fluids",
    medications: [
      {
        id: "ns",
        name: "0.9% Normal Saline",
        defaultDose: "500",
        defaultUnit: "mL",
        route: "IV",
        frequencies: ["Bolus", "Over 1hr", "Over 4hr"],
      },
      {
        id: "lr",
        name: "Lactated Ringer's",
        defaultDose: "500",
        defaultUnit: "mL",
        route: "IV",
        frequencies: ["Bolus", "Over 1hr", "Over 4hr"],
      },
      {
        id: "albumin",
        name: "5% Albumin",
        defaultDose: "250",
        defaultUnit: "mL",
        route: "IV",
        frequencies: ["Over 1hr", "Over 2hr"],
      },
    ],
  },
  {
    id: "diuretics",
    name: "Diuretics",
    medications: [
      {
        id: "furosemide",
        name: "Furosemide (Lasix)",
        defaultDose: "40",
        defaultUnit: "mg",
        route: "IV",
        frequencies: ["STAT", "Q8H", "Q12H"],
      },
    ],
  },
  {
    id: "antibiotics",
    name: "Antibiotics",
    medications: [
      {
        id: "ceftriaxone",
        name: "Ceftriaxone",
        defaultDose: "2",
        defaultUnit: "g",
        route: "IV",
        frequencies: ["Q24H", "Q12H"],
      },
      {
        id: "piptazo",
        name: "Piperacillin/Tazobactam",
        defaultDose: "4.5",
        defaultUnit: "g",
        route: "IV",
        frequencies: ["Q6H", "Q8H"],
      },
      {
        id: "vancomycin",
        name: "Vancomycin",
        defaultDose: "1",
        defaultUnit: "g",
        route: "IV",
        frequencies: ["Q12H", "Q24H"],
      },
    ],
  },
  {
    id: "steroids",
    name: "Steroids",
    medications: [
      {
        id: "hydrocortisone",
        name: "Hydrocortisone",
        defaultDose: "50",
        defaultUnit: "mg",
        route: "IV",
        frequencies: ["Q6H", "Q8H"],
      },
    ],
  },
];

interface PendingOrder {
  medication: Medication;
  dose: string;
  frequency: string;
  warning?: string;
}

export function OrdersModal() {
  const activeModal = useGameStore((state) => state.activeModal);
  const setActiveModal = useGameStore((state) => state.setActiveModal);
  const addOrderedMedication = useGameStore((state) => state.addOrderedMedication);
  const orderedMedications = useGameStore((state) => state.orderedMedications);
  const addMessage = useGameStore((state) => state.addMessage);
  const addPlayerAction = useGameStore((state) => state.addPlayerAction);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

  const isOpen = activeModal === "orders";

  const handleSelectMedication = (med: Medication) => {
    const existingOrder = pendingOrders.find(
      (o) => o.medication.id === med.id
    );
    if (existingOrder) return;

    const validation = validateMedication(
      med.id,
      parseFloat(med.defaultDose),
      med.defaultUnit
    );

    setPendingOrders([
      ...pendingOrders,
      {
        medication: med,
        dose: med.defaultDose,
        frequency: med.frequencies[0],
        warning: validation.warning,
      },
    ]);
  };

  const handleDoseChange = (medId: string, dose: string) => {
    setPendingOrders((orders) =>
      orders.map((o) => {
        if (o.medication.id === medId) {
          const validation = validateMedication(
            medId,
            parseFloat(dose),
            o.medication.defaultUnit
          );
          return { ...o, dose, warning: validation.warning };
        }
        return o;
      })
    );
  };

  const handleFrequencyChange = (medId: string, frequency: string) => {
    setPendingOrders((orders) =>
      orders.map((o) =>
        o.medication.id === medId ? { ...o, frequency } : o
      )
    );
  };

  const handleRemoveOrder = (medId: string) => {
    setPendingOrders((orders) =>
      orders.filter((o) => o.medication.id !== medId)
    );
  };

  const handleSubmitOrders = () => {
    if (pendingOrders.length === 0) return;

    pendingOrders.forEach((order) => {
      addOrderedMedication({
        name: order.medication.name,
        dose: order.dose,
        unit: order.medication.defaultUnit,
        frequency: order.frequency,
        route: order.medication.route,
        warning: order.warning,
      });
    });

    const orderSummary = pendingOrders
      .map(
        (o) =>
          `• ${o.medication.name} ${o.dose} ${o.medication.defaultUnit} ${o.medication.route} ${o.frequency}${
            o.warning ? ` ⚠️` : ""
          }`
      )
      .join("\n");

    addMessage({
      role: "system",
      content: `【醫囑開立】\n${orderSummary}`,
    });

    // Track player action
    addPlayerAction(
      "medication",
      `開立醫囑: ${pendingOrders.map((o) => o.medication.name).join(", ")}`,
      {
        orders: pendingOrders.map((o) => ({
          name: o.medication.name,
          dose: o.dose,
          unit: o.medication.defaultUnit,
          frequency: o.frequency,
          warning: o.warning,
        })),
      }
    );

    setPendingOrders([]);
    setSelectedCategory(null);
    setActiveModal(null);
  };

  const handleClose = () => {
    setPendingOrders([]);
    setSelectedCategory(null);
    setActiveModal(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            醫囑開立 (Orders)
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 min-h-[400px]">
          {/* Left: Medication selection */}
          <div className="border rounded-lg p-3">
            <div className="text-sm font-medium mb-2">選擇藥物</div>
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-2">
                {medicationCategories.map((category) => (
                  <Card key={category.id} className="overflow-hidden">
                    <CardHeader
                      className="py-2 px-3 cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category.id ? null : category.id
                        )
                      }
                    >
                      <CardTitle className="text-sm">{category.name}</CardTitle>
                    </CardHeader>
                    {selectedCategory === category.id && (
                      <CardContent className="pt-0 pb-2 px-3">
                        <div className="space-y-1">
                          {category.medications.map((med) => {
                            const isPending = pendingOrders.some(
                              (o) => o.medication.id === med.id
                            );
                            const isOrdered = orderedMedications.some(
                              (o) => o.name === med.name
                            );

                            return (
                              <Button
                                key={med.id}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs h-8"
                                onClick={() => handleSelectMedication(med)}
                                disabled={isPending || isOrdered}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {med.name}
                                {isOrdered && (
                                  <span className="ml-auto text-muted-foreground">
                                    (已開)
                                  </span>
                                )}
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Pending orders */}
          <div className="border rounded-lg p-3">
            <div className="text-sm font-medium mb-2">
              待開立醫囑 ({pendingOrders.length})
            </div>
            <ScrollArea className="h-[350px] pr-2">
              {pendingOrders.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  請從左側選擇藥物
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <Card
                      key={order.medication.id}
                      className={
                        order.warning
                          ? "border-orange-300 dark:border-orange-700"
                          : ""
                      }
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-sm">
                            {order.medication.name}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleRemoveOrder(order.medication.id)
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex gap-2 items-center">
                          <Input
                            type="text"
                            value={order.dose}
                            onChange={(e) =>
                              handleDoseChange(
                                order.medication.id,
                                e.target.value
                              )
                            }
                            className="w-20 h-8 text-sm"
                          />
                          <span className="text-sm text-muted-foreground">
                            {order.medication.defaultUnit}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {order.medication.route}
                          </span>
                          <select
                            value={order.frequency}
                            onChange={(e) =>
                              handleFrequencyChange(
                                order.medication.id,
                                e.target.value
                              )
                            }
                            className="h-8 text-sm rounded border px-2"
                          >
                            {order.medication.frequencies.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                        </div>

                        {order.warning && (
                          <div className="mt-2 flex items-start gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{order.warning}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button
            onClick={handleSubmitOrders}
            disabled={pendingOrders.length === 0}
          >
            開立醫囑 ({pendingOrders.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
