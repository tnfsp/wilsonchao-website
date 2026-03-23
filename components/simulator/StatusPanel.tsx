"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/simulator/ui/card";
import { useGameStore } from "@/lib/simulator/store";
import { User, Eye } from "lucide-react";

export function StatusPanel() {
  const status = useGameStore((state) => state.status);
  const scenario = useGameStore((state) => state.scenario);

  if (!status || !scenario) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Patient Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">載入中...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Patient Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">病人資訊</div>
          <div className="font-medium">
            {scenario.patient.age}歲 {scenario.patient.gender === "M" ? "男" : "女"}性
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Bed {scenario.patient.bed}
          </div>
        </div>

        {/* Brief History */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">簡要病史</div>
          <div className="text-sm">{scenario.patient.brief_history}</div>
        </div>

        {/* Consciousness */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">意識狀態</span>
          </div>
          <div className="font-medium">{status.consciousness}</div>
        </div>

        {/* Appearance */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">外觀</div>
          <div className="text-sm">{status.appearance}</div>
        </div>
      </CardContent>
    </Card>
  );
}
