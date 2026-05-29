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
    code?: number;
    message?: string;
    status?: string;
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
    "Review this exact snippet and suggest improvements only for this code. Return: 1) Bugs or risks, 2) Readability improvements, 3) Performance or edge-case improvements, 4) A short improved code example only if a concrete rewrite is useful. Do not explain unrelated concepts.",
};

export async function generateSnippetInsight(
  snippet: Snippet,
  kind: AiInsightKind,
) {
  const apiKey = await getAiApiKey();

  if (!apiKey) {
    throw new Error("Add your Gemini API key in Settings first.");
  }

  let response: Response;

  try {
    response = await fetch(
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
                text: "You are a senior software engineer helping a developer understand stored code snippets. Be accurate, concise, and practical. Ground every answer in the provided snippet. Use markdown headings and bullets when useful.",
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
            maxOutputTokens: 900,
            temperature: 0.2,
          },
        }),
      },
    );
  } catch {
    throw new Error(
      "Could not reach Gemini. Check your internet connection and try again.",
    );
  }

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(getGeminiErrorMessage(response.status, data));
  }

  const text = extractResponseText(data).trim();

  if (!text) {
    throw new Error("AI returned an empty response.");
  }

  return text;
}

function getGeminiErrorMessage(status: number, data: GeminiResponse) {
  const providerMessage = data.error?.message;
  const providerStatus = data.error?.status;

  if (status === 400 || status === 401 || status === 403) {
    return "Gemini rejected the API key. Check that you saved a valid Gemini API key in Settings.";
  }

  if (status === 429 || providerStatus === "RESOURCE_EXHAUSTED") {
    return "Gemini quota or rate limit was reached. Wait a bit and try again.";
  }

  if (status >= 500) {
    return "Gemini is temporarily unavailable. Try again shortly.";
  }

  return providerMessage ?? "Gemini request failed. Try again.";
}

function extractResponseText(data: GeminiResponse) {
  return (
    data.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .flatMap((part) => (part.text ? [part.text] : []))
      .join("\n") ?? ""
  );
}
