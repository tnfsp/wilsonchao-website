import Anthropic from "@anthropic-ai/sdk";
import type { Message, HistoryContext } from "@/lib/simulator/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatParams {
  userMessage: string;
  historyContext: HistoryContext;
  conversationHistory: Message[];
}

const SYSTEM_PROMPT = `你是一位 ICU 護理師，正在照顧一位病人。你的角色是：

1. 回答住院醫師（學員）關於病人病史的詢問
2. 回答要基於提供的 history_context，不要編造不存在的資訊
3. 回答要簡潔、專業，使用臨床常見的表達方式
4. 如果學員問的問題你不知道答案，可以說「我不確定，可能要查一下病歷」或「這個我沒有注意到」
5. 語氣親切但專業，像真正的 ICU 護理師一樣

重要規則：
- 只回答與病人病史相關的問題
- 不要給醫療建議或診斷建議
- 如果學員問與病人無關的問題，委婉地將話題拉回病人照護
- 回答使用繁體中文，但醫學術語可以使用英文
- 回答完就結束，不要在最後加上任何提示、建議、或詢問（例如「還有什麼問題嗎？」「需要我...嗎？」）
- 不要主動提供額外資訊，只回答被問到的問題`;

export async function chat({ userMessage, historyContext, conversationHistory }: ChatParams): Promise<string> {
  // Build conversation context from history
  const contextPrompt = `
病人背景資訊：
${historyContext.description}

重要病史要點：
${historyContext.key_points.map((point) => `- ${point}`).join("\n")}
`;

  // Convert conversation history to Claude message format
  const messages: Anthropic.MessageParam[] = conversationHistory
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

  // Add current user message
  messages.push({
    role: "user",
    content: userMessage,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: `${SYSTEM_PROMPT}\n\n${contextPrompt}`,
      messages,
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    return textContent?.text || "抱歉，我現在無法回答。";
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}

export async function* chatStream({ userMessage, historyContext, conversationHistory }: ChatParams): AsyncGenerator<string> {
  const contextPrompt = `
病人背景資訊：
${historyContext.description}

重要病史要點：
${historyContext.key_points.map((point) => `- ${point}`).join("\n")}
`;

  const messages: Anthropic.MessageParam[] = conversationHistory
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

  messages.push({
    role: "user",
    content: userMessage,
  });

  try {
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: `${SYSTEM_PROMPT}\n\n${contextPrompt}`,
      messages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  } catch (error) {
    console.error("Claude API stream error:", error);
    throw error;
  }
}
