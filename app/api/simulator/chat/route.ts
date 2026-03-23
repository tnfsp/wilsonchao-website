import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, gameState } = await request.json();

    const { vitals, chestTube, clock, labs, orders, timeline } = gameState ?? {};

    // Build context strings
    const vitalsContext = vitals
      ? `HR: ${vitals.hr} bpm | BP: ${vitals.sbp}/${vitals.dbp} mmHg (MAP ${vitals.map ?? Math.round(vitals.dbp + (vitals.sbp - vitals.dbp) / 3)}) | SpO₂: ${vitals.spo2}% | CVP: ${vitals.cvp} mmHg | Temp: ${vitals.temperature}°C | RR: ${vitals.rr}/min`
      : "Vitals 未知";

    const ctContext = chestTube
      ? `CT output: ${chestTube.currentRate} cc/hr，累計 ${chestTube.totalOutput} cc，顏色：${chestTube.color}，有血塊：${chestTube.hasClots ? "是" : "否"}，通暢：${chestTube.isPatent ? "是" : "否"}`
      : "CT 狀態未知";

    const clockContext = clock
      ? `遊戲時間 +${clock.currentTime} 分鐘（約 ${Math.floor(clock.currentTime / 60).toString().padStart(2, "0")}:${(clock.currentTime % 60).toString().padStart(2, "0")} 後半夜）`
      : "";

    const labsContext =
      labs && labs.length > 0
        ? `已有報告：${labs.map((l: { name: string; result?: string }) => l.name + (l.result ? ": " + l.result : "（待結果）")).join(", ")}`
        : "目前無 lab 報告";

    const ordersContext =
      orders && orders.length > 0
        ? `已開 orders：${orders.map((o: { name: string; dose?: string }) => o.name + (o.dose ? " " + o.dose : "")).join(", ")}`
        : "目前無 active orders";

    const recentTimeline =
      timeline && timeline.length > 0
        ? timeline
            .slice(-5)
            .map((t: { type: string; content: string }) => `[${t.type}] ${t.content}`)
            .join("\n")
        : "（無近期事件）";

    const systemPrompt = `你是心臟外科 ICU 的資深護理師林姐，在心臟外科 ICU 有 15 年經驗。
你正在值班，負責這位術後病人，並且學長（住院醫師）正在跟你溝通。

## 你的身份
- 你是護理師，不是醫生
- 你不說「我覺得應該開 XX 藥」或「建議使用 XX 治療」
- 你只報告你能觀察到的：生命徵象、外觀、CT 引流量和顏色、病人行為、水分平衡
- 你專業、有愛心、數字準確
- 你會委婉暗示，但不做醫療決策
  例如：「學長，這個量...我覺得要不要通知一下 VS？」
  例如：「血壓還是有點低，學長你看一下？」
- 如果 lab 還沒抽，你說「還沒抽欸，要不要開？」
- 如果有什麼值得注意，你會簡短提到，但讓學長決定

## 目前病人狀態
${vitalsContext}
${ctContext}
${clockContext}

## Labs 狀況
${labsContext}

## Active Orders
${ordersContext}

## 近期 Timeline
${recentTimeline}

## 回答規則
- 用繁體中文
- 1-3 句話，口語、像真的在 ICU 說話
- 不要帶 VITALS JSON 標籤（那是遊戲引擎管的，不是你）
- 不要提建議用什麼藥或治療方案
- 根據遊戲狀態組合回答，讓對話有邏輯`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "（林姐暫時沒有回應）";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Simulator chat error:", error);
    return NextResponse.json(
      { reply: "林姐：學長，系統好像有點問題，你稍等一下。" },
      { status: 200 }
    );
  }
}
