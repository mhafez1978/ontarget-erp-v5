import type { ZodSchema } from "zod";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiProviderType =
  | "openai"
  | "openai-compatible"
  | "anthropic"
  | "xai";

export interface AiProviderConfig {
  provider?: AiProviderType;
  apiKey: string;
  model?: string;
  apiBase?: string;
}

/**
 * callStorefrontModel
 *
 * Thin wrapper around an LLM provider (e.g. OpenAI) that:
 * - Accepts chat messages
 * - Requests JSON-only output
 * - Validates it against a Zod schema
 *
 * If no API key is configured, returns null so callers can fall back to a
 * deterministic, non-AI spec.
 */
export async function callStorefrontModel<T>(
  messages: ChatMessage[],
  schema: ZodSchema<T>,
  providerConfig?: AiProviderConfig
): Promise<T | null> {
  const apiKey = providerConfig?.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn(
      "[AI Storefront] OPENAI_API_KEY not set; skipping remote model call"
    );
    return null;
  }

  const provider: AiProviderType =
    providerConfig?.provider ||
    (process.env.AI_STOREFRONT_PROVIDER as AiProviderType | undefined) ||
    "openai";

  // Anthropic Claude client (direct API)
  if (provider === "anthropic") {
    const model =
      providerConfig?.model ||
      process.env.ANTHROPIC_MODEL ||
      "claude-3-5-sonnet-latest";
    const endpoint =
      providerConfig?.apiBase ||
      process.env.ANTHROPIC_API_BASE ||
      "https://api.anthropic.com/v1/messages";

    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const system =
      systemMessages.length > 0
        ? systemMessages.map((m) => m.content).join("\n\n---\n\n") +
          "\n\nYou MUST respond with a single JSON object only. Do not add any extra text before or after the JSON."
        : "You are an assistant that responds ONLY with a single JSON object and nothing else.";

    const userContent = nonSystemMessages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        temperature: 0.7,
        system,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "[AI Storefront] Anthropic model call failed:",
        response.status,
        text
      );
      throw new Error(
        `AI storefront model call failed with status ${response.status}`
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const content =
      json?.content && Array.isArray(json.content)
        ? json.content
            .map((c: Record<string, unknown>) =>
              typeof c.text === "string" ? c.text : ""
            )
            .join("\n")
        : null;

    if (!content || typeof content !== "string") {
      throw new Error("[AI Storefront] Empty or invalid Anthropic response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error(
        "[AI Storefront] Failed to parse Anthropic JSON content:",
        content
      );
      throw new Error("[AI Storefront] Failed to parse model JSON output");
    }

    return schema.parse(parsed);
  }

  // Default: OpenAI / OpenAI-compatible (includes xAI Grok or proxy providers)
  const model =
    providerConfig?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const endpoint =
    providerConfig?.apiBase ||
    process.env.OPENAI_API_BASE ||
    "https://api.openai.com/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[AI Storefront] Model call failed:", response.status, text);
    throw new Error(
      `AI storefront model call failed with status ${response.status}`
    );
  }

  const json = (await response.json()) as Record<string, unknown>;
  const choices = Array.isArray(json?.choices) ? json.choices : [];
  const content =
    choices.length > 0 &&
    typeof (choices[0] as Record<string, unknown>)?.message === "object"
      ? (
          (choices[0] as Record<string, unknown>).message as Record<
            string,
            unknown
          >
        )?.content
      : null;

  if (!content || typeof content !== "string") {
    throw new Error("[AI Storefront] Empty or invalid model response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error("[AI Storefront] Failed to parse JSON content:", content);
    throw new Error("[AI Storefront] Failed to parse model JSON output");
  }

  return schema.parse(parsed);
}
