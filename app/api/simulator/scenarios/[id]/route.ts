import { NextResponse } from "next/server";
import { proScenarios } from "@/lib/simulator/scenarios/pro";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scenario = proScenarios[id];

  if (!scenario) {
    return NextResponse.json(
      { error: `Scenario '${id}' not found` },
      { status: 404 }
    );
  }

  return NextResponse.json(scenario);
}
