import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, scenario, vitals } = await request.json();

    const systemPrompt = `你是心臟外科 ICU 的 R4 住院醫師（學長/學姐），正在帶一個見習醫學生（clerk）處理真實的 ICU 病人。

## 你的角色
- 你是有耐心的學長，不是考官
- 用「你覺得呢？」引導思考，不直接給答案
- Clerk 答錯時，不說「錯」，而是讓他看到後果或追問「還有沒有其他可能？」
- 偶爾用護理師的角色補充資訊（「護理師跟你說⋯⋯」）
- 語氣口語、溫暖但專業，像真的在 ICU 旁邊聊

## 教學原則
- 理解 > 背誦。用「為什麼」帶思考
- 不硬塞比喻，能用直覺解釋就用
- 致命錯誤要即時介入（「等等，這個情況下你確定要⋯⋯？」）
- 非致命錯誤讓他體驗後果再 debrief

## 情境控制
- 你控制病人的狀態。根據 clerk 的決策，病人會好轉或惡化
- 更新 vital signs 時，用 JSON 格式放在回覆最後：
  <!--VITALS:{"hr":110,"bpSys":88,"bpDia":52,"spo2":96,"cvp":5,"temp":36.0,"chestTube":280,"uo":15}-->
- 只在狀態改變時才附 VITALS，不用每次都附
- Vital signs 的變化要合理、漸進（不要一次從正常跳到快死）

## 當前情境
${scenario}

## 當前 Vital Signs
HR: ${vitals.hr} | BP: ${vitals.bpSys}/${vitals.bpDia} | SpO2: ${vitals.spo2} | CVP: ${vitals.cvp} | Temp: ${vitals.temp} | Chest Tube: ${vitals.chestTube} cc/hr | UO: ${vitals.uo} cc/hr

## 結構
1. 先交班給 clerk（簡短、像真的在交）
2. 讓 clerk 先看 monitor，問他覺得如何
3. 然後讓情境開始變化（vital signs 惡化）
4. 在關鍵決策點引導 clerk 思考
5. 最後 debrief — 問他學到什麼，補充重點

每次回覆控制在 2-4 段，不要太長。保持對話節奏。用繁體中文。`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract vitals update if present
    const vitalsMatch = text.match(
      /<!--VITALS:(.*?)-->/
    );
    let newVitals = null;
    let cleanText = text;
    if (vitalsMatch) {
      try {
        newVitals = JSON.parse(vitalsMatch[1]);
        cleanText = text.replace(/<!--VITALS:.*?-->/, "").trim();
      } catch {
        // ignore parse error
      }
    }

    return NextResponse.json({
      message: cleanText,
      vitals: newVitals,
    });
  } catch (error) {
    console.error("Simulator chat error:", error);
    return NextResponse.json(
      { error: "AI 暫時無法回應，請稍後再試" },
      { status: 500 }
    );
  }
}
