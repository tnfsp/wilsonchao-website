import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { EvaluateHandoffRequest, HandoffFeedback } from "@/lib/simulator/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SENIOR_PROMPT = `你是一位資深的 ICU 主治醫師（學長），一位住院醫師正在打電話給你交班報告病人。

你的任務是評估這份口頭交班報告的品質，並給予建設性的回饋。

一份好的交班報告應該包含：
1. 病人身份與目前主要問題
2. 相關病史、入院原因
3. 重要的理學檢查發現
4. 關鍵的檢驗/影像結果
5. 你的臨床判斷（診斷、鑑別診斷）
6. 目前已做的處置
7. 後續計畫或需要學長協助的事項

請根據以下資訊評估這份報告：

【病人實際情況】
診斷：{diagnosis}
關鍵鑑別點：{key_differentiators}

【學員進行的檢查/處置】
- 理學檢查：{exams}
- 開立檢驗：{labs}
- POCUS：{pocus}
- 醫囑：{medications}

【學員的電話交班內容】
{report_content}

請以 JSON 格式回覆，格式如下：
{
  "overall": "excellent" | "good" | "needs_improvement",
  "score": 0-100,
  "strengths": ["做得好的地方1", "做得好的地方2"],
  "missedPoints": ["遺漏的重點1", "遺漏的重點2"],
  "suggestions": ["改善建議1", "改善建議2"],
  "seniorComment": "學長的口頭回饋（像真的在電話裡回應，口語化、鼓勵但有建設性）"
}

評分標準：
- 90-100：優秀 (excellent) - 完整、準確、有條理，像資深住院醫師
- 70-89：良好 (good) - 大致完整但有小遺漏
- 0-69：需加強 (needs_improvement) - 有重要遺漏或判斷錯誤

請用繁體中文回覆，但醫學術語可用英文。seniorComment 要像真的在電話裡回應，口語化，可以用「嗯」「好」「那個...」這類詞。`;

export async function POST(request: NextRequest) {
  try {
    const body: EvaluateHandoffRequest = await request.json();
    const { report, scenario, actions } = body;

    // Format the data for the prompt
    const exams = actions.examinedItems.length > 0
      ? actions.examinedItems.map(e => `${e.category}: ${e.item}`).join(", ")
      : "未進行";

    const labs = actions.orderedLabs.length > 0
      ? actions.orderedLabs.map(l => l.category).join(", ")
      : "未開立";

    const pocus = actions.pocusExamined.length > 0
      ? actions.pocusExamined.map(p => p.view).join(", ")
      : "未執行";

    const medications = actions.orderedMedications.length > 0
      ? actions.orderedMedications.map(m => `${m.name} ${m.dose}${m.unit}`).join(", ")
      : "未開立";

    const prompt = SENIOR_PROMPT
      .replace("{diagnosis}", scenario.diagnosis.primary)
      .replace("{key_differentiators}", scenario.diagnosis.key_differentiators.join(", "))
      .replace("{exams}", exams)
      .replace("{labs}", labs)
      .replace("{pocus}", pocus)
      .replace("{medications}", medications)
      .replace("{report_content}", report.content);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    const responseText = textContent?.text || "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse feedback JSON");
    }

    const feedback: HandoffFeedback = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Evaluate handoff error:", error);

    // Return a default feedback on error
    const defaultFeedback: HandoffFeedback = {
      overall: "good",
      score: 70,
      strengths: ["完成了交班報告的撰寫"],
      missedPoints: ["無法取得詳細評估"],
      suggestions: ["請確認網路連線後再試一次"],
      seniorComment: "辛苦了！系統暫時無法完成評估，但你願意練習交班報告這點很好。繼續加油！",
    };

    return NextResponse.json({ feedback: defaultFeedback });
  }
}
