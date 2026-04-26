import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Rate limiter (10 requests per 10 minutes per IP) ──────────────────────

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

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
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { hint: null, error: "Rate limited" },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as HintRequestBody;
    const { unmetAction, gameState, playerActions, recentTimeline, labSummary, scenarioInfo, allExpectedActions } = body;

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

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
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
