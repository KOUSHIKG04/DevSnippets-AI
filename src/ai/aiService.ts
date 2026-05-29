import { getAiApiKey } from "../storage/secureStore";
import { Snippet } from "../types/snippet";

export type AiInsightKind = "explain" | "summarize" | "improve";

type GeminiTextPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiTextPart[];
  };
};

type GeminiResponse = {
  error?: {
    message?: string;
  };
  candidates?: GeminiCandidate[];
};

const GEMINI_MODEL = "gemini-2.5-flash";

const insightPrompts: Record<AiInsightKind, string> = {
  explain:
    "Explain what this code does in practical terms. Mention the main flow and any important APIs or patterns.",
  summarize:
    "Summarize this code in a short developer-friendly overview. Keep it concise and scannable.",
  improve:
    "Suggest concrete improvements for this code. Focus on correctness, readability, performance, and edge cases.",
};

export async function generateSnippetInsight(
  snippet: Snippet,
  kind: AiInsightKind,
) {
  const apiKey = await getAiApiKey();

  if (!apiKey) {
    throw new Error("Add your Gemini API key in Settings first.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are a senior software engineer helping a developer understand stored code snippets. Be accurate, concise, and practical. Use markdown bullets when useful.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${insightPrompts[kind]}
                Title: ${snippet.title}
                Language: ${snippet.language}
                Tags: ${snippet.tags.join(", ") || "none"}
                Code:
                \`\`\`${snippet.language}
                ${snippet.code}
                \`\`\``,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 700,
          temperature: 0.2,
        },
      }),
    },
  );

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? "AI request failed.");
  }

  const text = extractResponseText(data).trim();

  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  return text;
}

function extractResponseText(data: GeminiResponse) {
  return (
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .flatMap((part) => (part.text ? [part.text] : []))
      .join("\n") ?? ""
  );
}
