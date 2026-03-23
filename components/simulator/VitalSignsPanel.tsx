"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/simulator/ui/card";
import { useGameStore } from "@/lib/simulator/store";
import { Heart, Wind, Thermometer, Activity, Droplets } from "lucide-react";

export function VitalSignsPanel() {
  const vitals = useGameStore((state) => state.vitals);

  if (!vitals) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">載入中...</p>
        </CardContent>
      </Card>
    );
  }

  const vitalItems = [
    {
      label: "HR",
      value: vitals.hr,
      unit: "bpm",
      icon: Heart,
      isAbnormal: vitals.hr > 100 || vitals.hr < 60,
      color: "text-red-500",
    },
    {
      label: "BP",
      value: `${vitals.bp_systolic}/${vitals.bp_diastolic}`,
      unit: "mmHg",
      icon: Activity,
      isAbnormal: vitals.bp_systolic < 90 || vitals.bp_systolic > 140,
      color: "text-blue-500",
    },
    {
      label: "RR",
      value: vitals.rr,
      unit: "/min",
      icon: Wind,
      isAbnormal: vitals.rr > 20 || vitals.rr < 12,
      color: "text-cyan-500",
    },
    {
      label: "SpO2",
      value: vitals.spo2,
      unit: "%",
      icon: Droplets,
      isAbnormal: vitals.spo2 < 94,
      color: "text-purple-500",
    },
    {
      label: "Temp",
      value: vitals.temperature.toFixed(1),
      unit: "°C",
      icon: Thermometer,
      isAbnormal: vitals.temperature > 38 || vitals.temperature < 36,
      color: "text-orange-500",
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Vital Signs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {vitalItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between p-2 rounded-lg ${
              item.isAbnormal ? "bg-red-50 dark:bg-red-950" : "bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="text-right">
              <span
                className={`text-lg font-bold ${
                  item.isAbnormal ? "text-red-600 dark:text-red-400" : ""
                }`}
              >
                {item.value}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                {item.unit}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
