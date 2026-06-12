import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { rateLimit } from "@/lib/rate-limit";

// ── Rate limit: per IP, 10 requests per 10 minutes ────────────────────────

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

// ── Types ─────────────────────────────────────────────────────────────────

interface HintRequestBody {
  unmetAction: {
    id: string;
    description: string;
    hint: string;
    rationale?: string;
    howTo?: string;
  };
  gameState: {
    vitals: Record<string, number | string>;
    chestTube?: { currentRate: number; totalOutput: number; color: string };
    elapsedMinutes: number;
    pathology: string;
  };
  playerActions: string[];
  recentTimeline: string[];
  labSummary: string;
  scenarioInfo: {
    correctDiagnosis: string;
    patientSummary: string;
  };
  allExpectedActions: Array<{
    id: string;
    description: string;
    met: boolean;
    critical: boolean;
  }>;
}

// ── Route Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await rateLimit(`simulator-hint:${ip}`, {
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });
  if (!allowed) {
    return NextResponse.json(
      { hint: null, error: "Rate limited" },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as HintRequestBody;
    const { unmetAction, gameState, recentTimeline, labSummary, scenarioInfo, allExpectedActions } = body;

    // Build context for AI
    const completedActions = allExpectedActions.filter((a) => a.met).map((a) => `- [DONE] ${a.description}`);
    const pendingActions = allExpectedActions.filter((a) => !a.met && a.critical).map((a) => `- [PENDING] ${a.description}`);

    const vitalsStr = Object.entries(gameState.vitals)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const systemPrompt = `You are a clinical teaching assistant for an ICU simulator game.
The player is a medical trainee managing a post-cardiac-surgery patient.

Your role: Give a concise, contextual teaching hint that guides the player toward the next critical action WITHOUT giving the answer directly. Think like a senior resident nudging an intern.

Rules:
- Write in Traditional Chinese (繁體中文)
- 2-4 sentences maximum
- Reference current vitals/labs to make the hint specific and contextual
- Do NOT say "you should order X" directly — instead, ask a guiding question or highlight a concerning finding
- If rationale/howTo context is provided, weave the clinical reasoning naturally
- Consider what the player has already done — acknowledge progress
- Be encouraging but maintain clinical urgency when appropriate`;

    const userMessage = `## Current Situation
Patient: ${scenarioInfo.patientSummary}
Diagnosis: ${scenarioInfo.correctDiagnosis}
Elapsed: ${gameState.elapsedMinutes} minutes
Vitals: ${vitalsStr}
${gameState.chestTube ? `Chest tube: ${gameState.chestTube.currentRate} mL/hr, total ${gameState.chestTube.totalOutput} mL, ${gameState.chestTube.color}` : ""}
${labSummary ? `Labs: ${labSummary}` : "No labs yet"}

## Player Progress
${completedActions.length > 0 ? completedActions.join("\n") : "No critical actions completed yet"}

## Still Needed
${pendingActions.join("\n")}

## Recent Events
${recentTimeline.slice(-5).join("\n")}

## Target Action (generate hint for this)
Action: ${unmetAction.description}
${unmetAction.rationale ? `Rationale: ${unmetAction.rationale}` : ""}
${unmetAction.howTo ? `How-to: ${unmetAction.howTo}` : ""}
Static hint: ${unmetAction.hint}

Generate a contextual teaching hint based on the current game state.`;

    const response = await getAnthropicClient().messages.create({
      model: "claude-opus-4-8",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const hint = textBlock?.text?.trim() ?? unmetAction.hint;

    return NextResponse.json({ hint });
  } catch (err) {
    console.error("[hint API] Error:", err);
    return NextResponse.json(
      { hint: null, error: "Failed to generate hint" },
      { status: 500 }
    );
  }
}
