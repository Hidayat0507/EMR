import { headers } from "next/headers";

type ChatMessageRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
};

export type ChatCompletionOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_TITLE = process.env.OPENROUTER_APP_NAME || "EMR SOAP Enhancer";

if (!OPENROUTER_API_KEY) {
  console.warn("[openrouter] Missing OPENROUTER_API_KEY environment variable");
}

export type ChatCompletionResponse = {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: { role: ChatMessageRole; content: string };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export async function createChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResponse> {
  if (!OPENROUTER_API_KEY) {
    throw Object.assign(new Error("OpenRouter API key is not configured"), { code: "MISSING_API_KEY" });
  }

  const model = options.model || DEFAULT_MODEL;
  const hdrs = await headers();
  const referer = hdrs.get("referer") || undefined;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": referer || "https://emr.local",
      "X-Title": OPENROUTER_TITLE,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 800,
    }),
  });

  if (!response.ok) {
    const body = await safeJson(response);
    const errorMessage =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : response.statusText) || "OpenRouter request failed";
    const err = new Error(errorMessage);
    (err as any).status = response.status;
    (err as any).body = body;
    throw err;
  }

  return (await response.json()) as ChatCompletionResponse;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
