import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Rate limiter (15 requests per 10 minutes per IP) ──────────────────────

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

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

// ── System prompts by mode ────────────────────────────────────────────────

function buildSystemPrompt(
  mode: "phone" | "in_person" | "arrival_greeting",
  context: {
    vitalsStr: string;
    ctStr: string;
    labStr: string;
    orderStr: string;
    pathology: string;
    patientInfo: string;
    clockTime: number;
    severity?: number;
    playerActions?: string[];
    sbarPhase1?: string;
  },
): string {
  const stateBlock = `## 目前病人狀態
Patient: ${context.patientInfo}
Pathology: ${context.pathology}
Severity: ${context.severity ?? "unknown"}
${context.vitalsStr}
${context.ctStr}
Labs: ${context.labStr}
Orders: ${context.orderStr}
Game time: +${context.clockTime} min
${context.playerActions?.length ? `Recent actions: ${context.playerActions.join(", ")}` : ""}
${context.sbarPhase1 ? `Phase 1 SBAR (電話報告): ${context.sbarPhase1}` : ""}`;

  if (mode === "arrival_greeting") {
    return `你是心臟外科 ICU 的主治醫師 / Fellow（學長），你剛走進 ICU 來看這個病人。

## 你的任務
生成到場的開場白（1-2 句）。你能看到床邊的監視器、CT output、病人。
根據你看到的狀況，用一句話表達你的第一反應。

## 風格
- 如果狀況危急（MAP < 60, 大量出血）→ 語氣急切但冷靜：「血壓這麼低？CT 多少了？」
- 如果還可以 → 沉穩：「怎麼了，跟我報告一下。」
- 繁體中文，口語化，1-2 句
- 不用 markdown

${stateBlock}`;
  }

  const basePersonality = `你是心臟外科 ICU 的主治醫師 / Fellow（學長）。

## 你的身份與風格
- 你是資深學長，有豐富臨床經驗
- 你的語氣是：沉穩、直接、有教學意味但不囉嗦
- 你會問關鍵問題來評估嚴重度
- 你會根據報告給出即時處置指導
- 你的回答簡短有力（1-3 句）
- 你用繁體中文，口語化

## 教學風格
- 如果住院醫師報告不完整，你會追問：「CT 量多少？顏色呢？」「有抽 CBC 嗎？Hb 多少？」
- 如果狀況嚴重，你會直接下指令：「先 bolus NS 500，Norepi 掛上去」
- 如果住院醫師做得好，你會簡短肯定：「嗯，做得對」
- 你會引導住院醫師思考鑑別診斷，而不是直接給答案`;

  if (mode === "in_person") {
    return `${basePersonality}

## 重要：你現在在現場
- 你在 ICU 床邊，能看到監視器、CT、病人
- 你不只聽報告，你也在自己看、自己評估
- 你可以加入動作描述：（看了一眼 CT 引流袋）、（翻開被子檢查傷口）
- 你的回應可以結合你觀察到的和住院醫師報告的
- 2-4 輪對話後，你需要做出臨床決定（回 OR / bedside procedure / 繼續觀察）
- 做決定時要明確說出來，讓住院醫師知道下一步

${stateBlock}

## 回答規則
- 只回傳純文字（不用 JSON）
- 1-3 句話
- 不要用 markdown 格式
- 可以穿插動作描述用括號：（檢查了 CT output）`;
  }

  // mode === "phone"
  return `${basePersonality}

## 重要：你不在現場
- 你不在現場，只能透過電話了解情況
- 如果情況危急，語氣更急切但仍然冷靜

${stateBlock}

## 回答規則
- 只回傳純文字（不用 JSON）
- 1-3 句話，像電話對話一樣簡短
- 不要用 markdown 格式
- 根據住院醫師報告的完整度和緊急度調整回應
- 如果是第一次接電話，先聽完再回應`;
}

// ── Route Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { reply: "（學長正在處理其他事，稍後再打。）" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { message, gameState, conversationHistory, mode = "phone" } = body;

    if (!message || typeof message !== "string" || message.length > 2000) {
      return NextResponse.json(
        { reply: "（聽不清楚，再說一次。）" },
        { status: 400 }
      );
    }

    const { vitals, chestTube, clock, labs, orders, pathology, scenario, severity, playerActions, sbarPhase1 } = gameState ?? {};

    const vitalsStr = vitals
      ? `HR ${vitals.hr} | BP ${vitals.sbp}/${vitals.dbp} (MAP ${vitals.map ?? Math.round(vitals.dbp + (vitals.sbp - vitals.dbp) / 3)}) | SpO₂ ${vitals.spo2}% | CVP ${vitals.cvp} | Temp ${vitals.temperature}°C | RR ${vitals.rr}`
      : "Vitals unknown";

    const ctStr = chestTube
      ? `CT: ${chestTube.currentRate} cc/hr, total ${chestTube.totalOutput} cc, color: ${chestTube.color}`
      : "";

    const labStr = labs && labs.length > 0
      ? labs.map((l: { name: string; summary?: string }) => `${l.name}${l.summary ? ": " + l.summary : ""}`).join(", ")
      : "No labs yet";

    const orderStr = orders && orders.length > 0
      ? orders.map((o: { name: string }) => o.name).join(", ")
      : "No orders yet";

    const systemPrompt = buildSystemPrompt(mode, {
      vitalsStr,
      ctStr,
      labStr,
      orderStr,
      pathology: pathology ?? "unknown",
      patientInfo: scenario?.patientInfo ?? "post-cardiac surgery",
      clockTime: clock?.currentTime ?? 0,
      severity,
      playerActions,
      sbarPhase1,
    });

    // Build conversation messages
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (Array.isArray(conversationHistory)) {
      const recent = conversationHistory.slice(-10);
      for (const msg of recent) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: "user", content: message });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: mode === "arrival_greeting" ? 100 : 200,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock?.text?.trim() ?? "嗯，我聽到了。繼續。";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[senior-chat API] Error:", err);
    return NextResponse.json(
      { reply: "（訊號不太好，再說一次。）" },
      { status: 500 }
    );
  }
}
