import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIDebriefResponse } from "@/lib/simulator/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Rate limiter (shared pattern with chat endpoint) ────────────────────────
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 10; // stricter than chat — debrief is heavier

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

// ── Types for request body ──────────────────────────────────────────────────

interface DebriefRequestBody {
  timeline: Array<{
    id: string;
    gameTime: number;
    type: string;
    content: string;
    sender?: string;
    isImportant?: boolean;
  }>;
  scoreResult: {
    totalScore: number;
    stars: number;
    overall: string;
    criticalActions: Array<{
      id: string;
      description: string;
      met: boolean;
      timeToComplete: number | null;
      critical: boolean;
      hint: string;
    }>;
    escalationTiming: string;
    correctDiagnosis: boolean;
    harmfulOrders: string[];
    sbar: {
      completeness: number;
      prioritization: number;
      quantitative: boolean;
      anticipatory: boolean;
    };
    lethalTriadManaged: boolean;
    lethalTriadCount?: number;
    keyLessons: string[];
    patientDied: boolean;
  };
  scenarioMeta: {
    pathology: string;
    correctDiagnosis: string;
    keyPoints: string[];
    pitfalls: string[];
    expectedActions: Array<{
      id: string;
      action: string;
      description: string;
      deadline: number;
      critical: boolean;
    }>;
    exampleSBAR?: {
      situation: string;
      background: string;
      assessment: string;
      recommendation: string;
    };
    patientInfo: {
      age: number;
      sex: string;
      surgery: string;
      postOpDay: string;
      history: string;
    };
    /** Present only for multi-phase scenarios — tells which phase the player was in at game end */
    rescuePhase?: {
      currentPathology: string;
      isInitialPhase: boolean;
      phaseLabel: string;
    };
  };
  playerSBAR: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  } | null;
  playerSBARPhase1?: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  } | null;
  patientOutcome: {
    survived: boolean;
    deathCause: string | null;
  };
}

// ── Build system prompt ─────────────────────────────────────────────────────

function buildSystemPrompt(body: DebriefRequestBody): string {
  const { scoreResult, scenarioMeta, patientOutcome } = body;

  // Build phase-awareness section for multi-phase scenarios
  let phaseSection = "";
  if (scenarioMeta.rescuePhase) {
    const { phaseLabel, isInitialPhase, currentPathology } = scenarioMeta.rescuePhase;
    phaseSection = `
## 重要：Multi-phase 情境的 Phase 限制
此情境有多個 phase。玩家在 **${phaseLabel}** 結束遊戲（pathology: ${currentPathology}）。
${isInitialPhase
  ? `- 病人在初始階段（${phaseLabel}）就被搶救或死亡，**尚未進展至後續 phase**。
- 病人此時的問題是「${scenarioMeta.correctDiagnosis}」，不是 cardiac tamponade。
- 病人並未發展出 tamponade — 沒有 pericardial effusion、沒有 RV collapse、沒有 Beck triad。
- 你的所有評論、keyMoments、feedback 都必須只討論 timeline 中實際出現的事件。
- **絕對不要**提及以下任何內容（這些是後續 phase 才會發生的事）：
  - POCUS 顯示 pericardial effusion 或 RV diastolic collapse
  - Beck triad（低血壓 + JVD + muffled heart sounds 的組合）
  - 心包填塞（cardiac tamponade）
  - Re-sternotomy 或手術中發現血塊
  - CT output 突然停止（如果 timeline 中沒有這個事件）
  - 300cc 血塊壓迫心臟`
  : `- 病人已進展至 ${phaseLabel}，從初始 pathology 轉變為 ${currentPathology}。
- 請完整評論兩個 phase 的處置。`}
`;
  }

  return `你是一位資深心臟外科主治醫師（VS），正在 M&M conference 或 debrief session 中回顧這個 case。
你的角色是教育住院醫師（學員），語氣專業但有教育性——像一位嚴格但關心後輩的學長。

## 情境
- 病人：${scenarioMeta.patientInfo.age}歲${scenarioMeta.patientInfo.sex === "M" ? "男" : "女"}性
- 手術：${scenarioMeta.patientInfo.surgery}，${scenarioMeta.patientInfo.postOpDay}
- 病史：${scenarioMeta.patientInfo.history}
- 正確診斷：${scenarioMeta.correctDiagnosis}
- 病理機轉：${scenarioMeta.pathology}
- 結局：${patientOutcome.survived ? "存活" : `死亡（${patientOutcome.deathCause ?? "不明"}）`}
- 得分：${scoreResult.totalScore}/100，${scoreResult.stars} 星
${phaseSection}
## 教學重點（scenario 設計者定義）
${scenarioMeta.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## 常見陷阱
${scenarioMeta.pitfalls.map((p, i) => `- ${p}`).join("\n")}

## 規則
1. 所有回饋必須基於實際 timeline 事件，不要虛構任何行為
2. 死亡案例：用「如果當時...可能會...」而非「你做錯了...」
3. 存活案例：直接指出做得好和需改進的地方
4. 語言：繁體中文
5. keyMoments 從 timeline 挑 5-8 個最關鍵的節點
6. attendingFeedback 的 positive 1-3 點，improvement 2-4 點
7. sbarReview 基於比較 player 的 SBAR 和 example SBAR
8. keyLessons 2-3 個核心教學點，要具體且 actionable
9. 如果病人死亡，一定要有 criticalMoment 指出關鍵轉折點
10. **只引用 timeline 中實際出現的事件。不要描述玩家從未經歷的事件。**

## 重要：避免內容重複
- Guideline Compliance（各 action 是否完成的 checklist）已在另一個 section 獨立顯示
- attendingFeedback 不要重複列出哪些 action 做了 / 沒做（那是 checklist 的工作）
- attendingFeedback 要聚焦在：臨床判斷品質、時機掌握、決策邏輯、團隊合作
- 例如：不要寫「你有 order CBC ✓」，要寫「你在第一時間就想到量化出血，這個 mindset 很好」
- 例如：不要寫「你沒有叫學長 ✗」，要寫「以這個情境的嚴重度，更早 escalate 可以讓 VS 提前準備 OR」

## 回傳格式
你必須回傳嚴格的 JSON，格式如下（不要加 markdown code fence）：
{
  "keyMoments": [
    {
      "gameTime": <number>,
      "event": "<描述該時間點發生的事>",
      "annotation": "<你的點評>",
      "type": "good" | "missed" | "critical" | "neutral"
    }
  ],
  "attendingFeedback": {
    "positive": ["<做得好的點>"],
    "improvement": ["<需改進的點>"],
    "dangerous": ["<危險行為，如果有>"]
  },
  "sbarReview": {
    "overall": "<整體評價 1-2 句>",
    "missingElements": ["<缺少的關鍵資訊>"],
    "goodPoints": ["<做得好的地方>"]
  },
  "keyLessons": ["<教學點>"],
  "criticalMoment": {
    "gameTime": <number>,
    "description": "<如果當時做了 X，結果可能會...>"
  }
}`;
}

// ── Build user message ──────────────────────────────────────────────────────

function buildUserMessage(body: DebriefRequestBody): string {
  const { timeline, scoreResult, scenarioMeta, playerSBAR, patientOutcome } = body;

  // Format timeline (compact)
  const timelineText = timeline
    .map((t) => `[${String(Math.floor(t.gameTime / 60)).padStart(2, "0")}:${String(Math.round(t.gameTime % 60)).padStart(2, "0")}] [${t.type}] ${t.sender ? `(${t.sender}) ` : ""}${t.content}`)
    .join("\n");

  // Critical actions status
  const criticalActionsText = scoreResult.criticalActions
    .map((ca) => `- ${ca.description}: ${ca.met ? `Done @${ca.timeToComplete}min` : "MISSED"} ${ca.critical ? "[CRITICAL]" : "[BONUS]"}`)
    .join("\n");

  // Expected actions
  const expectedText = scenarioMeta.expectedActions
    .map((ea) => `- ${ea.description} (deadline: ${ea.deadline}min) ${ea.critical ? "[CRITICAL]" : "[BONUS]"}`)
    .join("\n");

  // Player SBAR (Phase 2 / final)
  const sbarText = playerSBAR
    ? `S: ${playerSBAR.situation}\nB: ${playerSBAR.background}\nA: ${playerSBAR.assessment}\nR: ${playerSBAR.recommendation}`
    : "(Player did not submit final SBAR)";

  // Player SBAR Phase 1 (if multi-phase scenario)
  const sbarPhase1Text = body.playerSBARPhase1
    ? `S: ${body.playerSBARPhase1.situation}\nB: ${body.playerSBARPhase1.background}\nA: ${body.playerSBARPhase1.assessment}\nR: ${body.playerSBARPhase1.recommendation}`
    : null;

  // Example SBAR
  const exampleSbarText = scenarioMeta.exampleSBAR
    ? `S: ${scenarioMeta.exampleSBAR.situation}\nB: ${scenarioMeta.exampleSBAR.background}\nA: ${scenarioMeta.exampleSBAR.assessment}\nR: ${scenarioMeta.exampleSBAR.recommendation}`
    : "(No example SBAR available)";

  return `## Full Timeline
${timelineText}

## Score Result
- Total: ${scoreResult.totalScore}/100, ${scoreResult.stars} stars, ${scoreResult.overall}
- Escalation: ${scoreResult.escalationTiming}
- Correct Diagnosis: ${scoreResult.correctDiagnosis ? "Yes" : "No"}
- Lethal Triad Managed: ${scoreResult.lethalTriadManaged ? "Yes" : "No"} (${scoreResult.lethalTriadCount ?? 0}/3)
- Harmful Orders: ${scoreResult.harmfulOrders.length > 0 ? scoreResult.harmfulOrders.join(", ") : "None"}
- SBAR Score: completeness ${scoreResult.sbar.completeness}/100, prioritization ${scoreResult.sbar.prioritization}/100

## Critical Actions
${criticalActionsText}

## Expected Actions
${expectedText}

## Patient Outcome
${patientOutcome.survived ? "Survived" : `Died: ${patientOutcome.deathCause ?? "Unknown"}`}

${sbarPhase1Text ? `## Player's SBAR — Phase 1（給學長的初始報告）
${sbarPhase1Text}

## Player's SBAR — Phase 2（最終交班）
${sbarText}

注意：比較兩份 SBAR 的差異。Phase 1 的 SBAR 反映玩家在出血階段的判斷；Phase 2 應該更新為包含 tamponade 的診斷。如果 Phase 2 的 SBAR 沒有提到 tamponade/心包填塞，這是一個需要改進的地方。` : `## Player's SBAR
${sbarText}`}

## Example SBAR (Gold Standard)
${exampleSbarText}

Please generate the debrief analysis as JSON.`;
}

// ── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting another debrief." },
      { status: 429 },
    );
  }

  try {
    const body: DebriefRequestBody = await request.json();

    // Basic validation
    if (!body.timeline || !body.scoreResult || !body.scenarioMeta) {
      return NextResponse.json(
        { error: "Missing required fields: timeline, scoreResult, scenarioMeta" },
        { status: 400 },
      );
    }

    const systemPrompt = buildSystemPrompt(body);
    const userMessage = buildUserMessage(body);

    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      },
      { timeout: 30_000 },
    );

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON — strip markdown fences if present
    let parsed: AIDebriefResponse;
    try {
      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();
      parsed = JSON.parse(cleaned);

      // Validate required fields
      if (!Array.isArray(parsed.keyMoments)) throw new Error("missing keyMoments");
      if (!parsed.attendingFeedback) throw new Error("missing attendingFeedback");
      if (!parsed.sbarReview) throw new Error("missing sbarReview");
      if (!Array.isArray(parsed.keyLessons)) throw new Error("missing keyLessons");
    } catch (parseError) {
      console.error("[Debrief AI] JSON parse failed:", responseText?.slice(0, 300), parseError);
      return NextResponse.json(
        { error: "AI response parsing failed" },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[Debrief AI] Error:", error);
    return NextResponse.json(
      { error: "Internal server error during debrief generation" },
      { status: 500 },
    );
  }
}
