import { NextRequest, NextResponse } from "next/server";
import { chat, chatStream } from "@/lib/simulator/claude";
import type { ChatRequest } from "@/lib/simulator/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, historyContext, conversationHistory } = body;

    // Validate required fields
    if (!message || !historyContext) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if streaming is requested
    const useStream = request.headers.get("accept") === "text/event-stream";

    if (useStream) {
      // Streaming response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const generator = chatStream({
              userMessage: message,
              historyContext,
              conversationHistory: conversationHistory || [],
            });

            for await (const chunk of generator) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Stream error:", error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Non-streaming response
      const reply = await chat({
        userMessage: message,
        historyContext,
        conversationHistory: conversationHistory || [],
      });

      return NextResponse.json({ reply });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
