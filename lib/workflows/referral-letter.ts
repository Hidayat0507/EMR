import { createChatCompletion, type ChatMessage, type ChatCompletionResponse } from "@/lib/server/openrouter";

type ReferralLetterInput = {
  summary: string;
  model?: string;
};

export type ReferralLetterResult = {
  letter: string;
  modelUsed: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  rawResponse: string;
};

export async function generateReferralLetter({ summary, model }: ReferralLetterInput): Promise<ReferralLetterResult> {
  const prompt = buildPrompt(summary);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an assistant that drafts professional medical referral letters. Keep the tone formal, concise, and ready to paste into an EMR.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  const completion = await createChatCompletion(messages, { model, maxTokens: 700, temperature: 0.4 });
  const choice = completion.choices[0];
  const content = choice?.message?.content ?? "";
  const letter = sanitizeLetter(content);

  return {
    letter,
    modelUsed: completion.model,
    usage: normalizeUsage(completion),
    rawResponse: content,
  };
}

function buildPrompt(summary: string): string {
  return [
    "Draft a referral letter based on the following consultation summary.",
    "Include:",
    "- Patient presentation and relevant background",
    "- Key findings and investigations",
    "- Working diagnosis or differential if available",
    "- Reason for referral and requested actions",
    "- Closing with sender details placeholder",
    "Keep paragraphs short and clinically focused. If information is missing, note it politely.",
    "",
    summary.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function sanitizeLetter(content: string): string {
  let output = content.replace(/```(?:[a-z0-9_-]+)?/gi, "").trim();
  if (!output) {
    return "Referral Letter\n\nDraft could not be generated. Please summarise the case manually.";
  }

  // Strip duplicate greetings or sign-offs if the model includes markdown headings
  output = output.replace(/^(#|\*)\s*/gm, "");
  return output.trim();
}

function normalizeUsage(completion: ChatCompletionResponse) {
  const usage = completion.usage;
  if (!usage) return undefined;

  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}
