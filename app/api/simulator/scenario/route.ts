import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Scenario } from "@/lib/simulator/types";

// GET /api/scenario?id=cardiogenic-shock-01
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing scenario id parameter" },
      { status: 400 }
    );
  }

  try {
    // Build path to scenario JSON file
    const scenarioPath = path.join(
      process.cwd(),
      "lib",
      "scenarios",
      id,
      "scenario.json"
    );

    // Read and parse scenario file
    const fileContent = await fs.readFile(scenarioPath, "utf-8");
    const scenario: Scenario = JSON.parse(fileContent);

    return NextResponse.json(scenario);
  } catch (error) {
    // Check if file not found
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json(
        { error: `Scenario "${id}" not found` },
        { status: 404 }
      );
    }

    // Check if JSON parse error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: `Invalid scenario file format for "${id}"` },
        { status: 500 }
      );
    }

    console.error("Error loading scenario:", error);
    return NextResponse.json(
      { error: "Failed to load scenario" },
      { status: 500 }
    );
  }
}

// GET /api/scenario/list - Get available scenarios
export async function POST() {
  try {
    const scenariosDir = path.join(process.cwd(), "lib", "scenarios");
    const entries = await fs.readdir(scenariosDir, { withFileTypes: true });

    const scenarios = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const scenarioPath = path.join(scenariosDir, entry.name, "scenario.json");
        try {
          const fileContent = await fs.readFile(scenarioPath, "utf-8");
          const scenario = JSON.parse(fileContent);
          scenarios.push({
            id: scenario.id,
            title: scenario.title,
            difficulty: scenario.difficulty,
            author: scenario.author,
          });
        } catch {
          // Skip invalid scenarios
          continue;
        }
      }
    }

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error("Error listing scenarios:", error);
    return NextResponse.json(
      { error: "Failed to list scenarios" },
      { status: 500 }
    );
  }
}
