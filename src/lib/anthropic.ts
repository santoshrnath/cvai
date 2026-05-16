import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: env.anthropic.apiKey() });
  }
  return _client;
}

export const MODEL = () => env.anthropic.model();

// Extract first text block from a Claude response. Tolerant of mixed content.
export function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text",
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}

// Extract JSON from a Claude response. Strips ```json fences and trims.
export function extractJson<T = unknown>(
  message: Anthropic.Messages.Message,
): T {
  const text = extractText(message);
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to locate the first JSON object/array in the text.
    const firstBrace = cleaned.search(/[{[]/);
    if (firstBrace >= 0) {
      return JSON.parse(cleaned.slice(firstBrace)) as T;
    }
    throw new Error("Claude did not return valid JSON:\n" + cleaned.slice(0, 500));
  }
}
