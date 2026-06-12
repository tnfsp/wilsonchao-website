import Anthropic from "@anthropic-ai/sdk";

/**
 * Shared Anthropic client (singleton).
 *
 * All API routes should import `getAnthropicClient()` instead of calling
 * `new Anthropic({...})` themselves, so initialization and API-key validation
 * live in one place. Model / max_tokens / prompts remain per-route concerns.
 */

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment (e.g. .env.local " +
        "or the Vercel project settings) before calling AI-powered API routes.",
    );
  }

  client = new Anthropic({ apiKey });
  return client;
}
