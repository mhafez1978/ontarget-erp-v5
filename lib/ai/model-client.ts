import type { ZodSchema } from "zod";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiProviderType =
  | "openai"
  | "openai-compatible"
  | "anthropic"
  | "xai"
  | "deepseek";

export interface AiProviderConfig {
  provider?: AiProviderType;
  apiKey: string;
  model?: string;
  apiBase?: string;
}

/**
 * Get the maximum output tokens for a given provider and model
 */
function getMaxTokensForModel(provider: AiProviderType, model: string): number {
  const modelLower = model.toLowerCase();

  switch (provider) {
    case "anthropic":
      // Claude 3.5 models
      // Note: Free tier has 8,000 tokens/min limit
      // Using 5000 tokens with 38s delays = ~1.58 sections/min = ~7900 tokens/min (under limit)
      if (modelLower.includes("claude-3-5-haiku")) return 5000;
      if (modelLower.includes("claude-3-5-sonnet")) return 5000;
      if (modelLower.includes("claude-3-5")) return 5000;
      // Claude 3 models
      if (modelLower.includes("claude-3-opus")) return 4096;
      if (modelLower.includes("claude-3-sonnet")) return 4096;
      if (modelLower.includes("claude-3-haiku")) return 4096;
      // Default for unknown Claude models (safe for free tier)
      return 5000;

    case "openai":
    case "openai-compatible":
      if (modelLower.includes("gpt-4o")) return 16384;
      if (modelLower.includes("gpt-4-turbo")) return 4096;
      if (modelLower.includes("gpt-4")) return 8192;
      if (modelLower.includes("gpt-3.5-turbo-16k")) return 16385;
      if (modelLower.includes("gpt-3.5")) return 4096;
      // Default for unknown OpenAI models
      return 4096;

    case "deepseek":
      if (modelLower.includes("deepseek-chat")) return 8192;
      if (modelLower.includes("deepseek-reasoner")) return 8192;
      // Default for unknown DeepSeek models
      return 8192;

    case "xai":
      // Grok models typically support 8192
      return 8192;

    default:
      // Safe default
      return 4096;
  }
}

/**
 * Embeddings support helper (returns embeddings for each input text)
 */
export async function callEmbeddings(
  inputs: string[],
  providerConfig?: AiProviderConfig
): Promise<number[][]> {
  const provider: AiProviderType =
    providerConfig?.provider ||
    (process.env.AI_STOREFRONT_PROVIDER as AiProviderType | undefined) ||
    "openai";

  let apiKey: string | undefined;
  if (provider === "anthropic") {
    apiKey = providerConfig?.apiKey || process.env.ANTHROPIC_API_KEY;
  } else if (provider === "deepseek") {
    apiKey = providerConfig?.apiKey || process.env.DEEPSEEK_API_KEY;
  } else {
    apiKey = providerConfig?.apiKey || process.env.OPENAI_API_KEY;
  }

  if (!apiKey) {
    throw new Error("No API key configured for embeddings");
  }

  if (provider === "openai" || provider === "openai-compatible") {
    const model =
      providerConfig?.model ||
      process.env.OPENAI_EMBEDDING_MODEL ||
      "text-embedding-3-small";
    const endpoint =
      (providerConfig?.apiBase ||
        process.env.OPENAI_API_BASE ||
        "https://api.openai.com/v1") + "/embeddings";
    const body = {
      model,
      input: inputs,
    };
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Embedding request failed: ${resp.status} ${txt}`);
    }
    const json = await resp.json();
    const data = Array.isArray(json.data)
      ? json.data.map((d: any) => d.embedding as number[])
      : [];
    return data;
  }

  // Default: not supported
  throw new Error(`Embeddings not implemented for provider: ${provider}`);
}

/**
 * callStorefrontModel
 *
 * Thin wrapper around an LLM provider (e.g. OpenAI) that:
 * - Accepts chat messages
 * - Requests JSON-only output
 * - Validates it against a Zod schema
 * - Retries on rate limits and overload errors
 *
 * If no API key is configured, returns null so callers can fall back to a
 * deterministic, non-AI spec.
 */
export async function callStorefrontModel<T>(
  messages: ChatMessage[],
  schema: ZodSchema<T>,
  providerConfig?: AiProviderConfig,
  maxRetries = 3
): Promise<T | null> {
  const provider: AiProviderType =
    providerConfig?.provider ||
    (process.env.AI_STOREFRONT_PROVIDER as AiProviderType | undefined) ||
    "openai";

  // Get API key based on provider
  let apiKey: string | undefined;
  if (provider === "anthropic") {
    apiKey = providerConfig?.apiKey || process.env.ANTHROPIC_API_KEY;
  } else if (provider === "deepseek") {
    apiKey = providerConfig?.apiKey || process.env.DEEPSEEK_API_KEY;
  } else {
    apiKey = providerConfig?.apiKey || process.env.OPENAI_API_KEY;
  }

  console.log(`[AI Storefront] Provider: ${provider}`);
  console.log(`[AI Storefront] Has providerConfig: ${!!providerConfig}`);
  console.log(
    `[AI Storefront] Has providerConfig.apiKey: ${!!providerConfig?.apiKey}`
  );
  console.log(`[AI Storefront] API Key length: ${apiKey?.length || 0}`);
  console.log(
    `[AI Storefront] API Key first 8 chars: ${
      apiKey?.substring(0, 8) || "none"
    }`
  );

  if (!apiKey) {
    console.warn(
      `[AI Storefront] ${provider.toUpperCase()}_API_KEY not set; skipping remote model call`
    );
    return null;
  }

  // Anthropic Claude client (direct API)
  if (provider === "anthropic") {
    const model =
      providerConfig?.model ||
      process.env.ANTHROPIC_MODEL ||
      "claude-3-5-sonnet-20241022";
    const endpoint =
      providerConfig?.apiBase ||
      process.env.ANTHROPIC_API_BASE ||
      "https://api.anthropic.com/v1/messages";

    console.log(
      `[AI Storefront] Using ANTHROPIC provider with model: ${model}`
    );
    console.log(`[AI Storefront] Endpoint: ${endpoint}`);

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

    const maxTokens = getMaxTokensForModel("anthropic", model);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.8,
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

      // Handle authentication errors
      if (response.status === 401) {
        throw new Error(
          "Invalid Anthropic API key. Please check your API key at console.anthropic.com and update it in Settings > AI Provider"
        );
      }

      // Retry on rate limits (429) or overload (529)
      if (
        (response.status === 429 || response.status === 529) &&
        maxRetries > 0
      ) {
        const retryDelay = Math.pow(2, 4 - maxRetries) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(
          `[AI Storefront] Retrying after ${retryDelay}ms (${maxRetries} retries left)...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return callStorefrontModel(
          messages,
          schema,
          providerConfig,
          maxRetries - 1
        );
      }

      throw new Error(
        `AI storefront model call failed with status ${response.status}${
          response.status === 529 ? " (API overloaded - try again later)" : ""
        }`
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

    // Trim any whitespace from content first
    let trimmedContent = content.trim();

    // Remove markdown code fences if present (```json ... ``` or ``` ... ```)
    if (trimmedContent.startsWith("```")) {
      console.log("[AI Storefront] Removing markdown code fences...");
      // Remove opening fence (```json or ```)
      trimmedContent = trimmedContent.replace(/^```(?:json)?\s*\n?/, "");
      // Remove closing fence
      trimmedContent = trimmedContent.replace(/\n?```\s*$/, "");
      trimmedContent = trimmedContent.trim();
      console.log(
        "[AI Storefront] Content after fence removal starts with:",
        trimmedContent.substring(0, 100)
      );
    }

    try {
      // First try direct parsing
      parsed = JSON.parse(trimmedContent);
      console.log(
        "[AI Storefront] Successfully parsed Anthropic JSON directly"
      );
    } catch (directParseError) {
      console.log(
        "[AI Storefront] Direct JSON parse failed, trying extraction..."
      );
      console.log(
        "[AI Storefront] Content starts with:",
        trimmedContent.substring(0, 100)
      );
      console.log("[AI Storefront] Parse error:", directParseError);

      // Helper to attempt continuation requests when output appears truncated
      async function attemptContinuation(previous: string, attempts = 2) {
        let accumulated = previous;
        for (let i = 0; i < attempts; i++) {
          console.log(
            `[AI Storefront] Attempting continuation request (${
              i + 1
            }/${attempts})`
          );
          const contResp = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey || "",
              "anthropic-version": "2023-06-01",
            } as Record<string, string>,
            body: JSON.stringify({
              model,
              max_tokens: maxTokens,
              temperature: 0.8,
              system,
              messages: [
                {
                  role: "user",
                  content: `CONTINUATION REQUEST: The previous response was truncated. Continue the JSON object from where it left off. Previous content (truncated):\n\n${accumulated}\n\nReturn ONLY the continuation text required to complete the JSON object (do not repeat previously returned text, and do not include backticks or markdown).`,
                },
              ],
            }),
          });

          if (!contResp.ok) {
            console.log(
              `[AI Storefront] Continuation request failed with status ${contResp.status}`
            );
            continue;
          }

          const contJson = (await contResp.json()) as Record<string, unknown>;
          const contContent =
            contJson?.content && Array.isArray(contJson.content)
              ? contJson.content
                  .map((c: Record<string, unknown>) =>
                    typeof c.text === "string" ? c.text : ""
                  )
                  .join("\n")
              : null;

          if (!contContent) {
            console.log("[AI Storefront] Continuation response empty");
            continue;
          }

          // Append and try to parse again
          accumulated = accumulated + contContent;
          try {
            const attemptParsed = JSON.parse(accumulated.trim());
            console.log(
              "[AI Storefront] Successfully parsed after continuation"
            );
            return attemptParsed;
          } catch (e) {
            // keep looping to try another continuation
            console.log(
              "[AI Storefront] Continuation parse still failed, trying again..."
            );
            continue;
          }
        }

        throw new Error("Failed to recover truncated JSON via continuation");
      }

      // If direct parsing fails, try extracting JSON from markdown or text first
      try {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = trimmedContent.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1].trim());
          console.log(
            "[AI Storefront] Extracted JSON from markdown code block"
          );
        } else {
          // Try to find JSON object in text (between { and })
          const jsonStart = trimmedContent.indexOf("{");
          const jsonEnd = trimmedContent.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            let jsonStr = trimmedContent.substring(jsonStart, jsonEnd + 1);

            // Sanitize control characters by removing/replacing them
            // This is necessary because Claude sometimes includes raw newlines in explanation strings
            jsonStr = jsonStr.replace(
              /[\u0000-\u001F\u007F-\u009F]/g,
              (char) => {
                const code = char.charCodeAt(0);
                // Convert actual control characters to escaped versions
                if (code === 0x0a || code === 0x0d) return " "; // Replace newlines with spaces
                if (code === 0x09) return " "; // Replace tabs with spaces
                return ""; // Remove other control chars
              }
            );

            parsed = JSON.parse(jsonStr);
            console.log(
              "[AI Storefront] Extracted and sanitized JSON from text"
            );
          } else {
            // If we suspect truncation (no closing brace or ends with ellipsis), try continuation
            const likelyTruncated =
              trimmedContent.endsWith("...") ||
              trimmedContent.trim().endsWith("`") ||
              trimmedContent.indexOf("{") === -1 ||
              trimmedContent.lastIndexOf("}") < trimmedContent.indexOf("{");

            if (likelyTruncated) {
              parsed = await attemptContinuation(trimmedContent, 2);
            } else {
              throw new Error("No JSON found in content");
            }
          }
        }
      } catch (error) {
        console.log(
          error instanceof Error ? error.message : JSON.stringify(error)
        );
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to parse model JSON output"
        );
      }
    }

    // Validate with schema - z.unknown() will accept anything
    try {
      const validated = schema.parse(parsed);
      console.log("[AI Storefront] Schema validation passed");
      return validated;
    } catch (validationError) {
      console.error(
        "[AI Storefront] Schema validation failed:",
        validationError
      );
      console.error(
        "[AI Storefront] Parsed content keys:",
        Object.keys(parsed as object)
      );
      throw validationError;
    }
  }

  // DeepSeek API (OpenAI-compatible)
  if (provider === "deepseek") {
    const model =
      providerConfig?.model || process.env.DEEPSEEK_MODEL || "deepseek-chat";
    const endpoint =
      providerConfig?.apiBase ||
      process.env.DEEPSEEK_API_BASE ||
      "https://api.deepseek.com/v1/chat/completions";

    console.log(`[AI Storefront] Using DEEPSEEK provider with model: ${model}`);
    console.log(`[AI Storefront] Endpoint: ${endpoint}`);

    // DeepSeek requires the word "json" in the prompt when using json_object response format
    const messagesWithJsonPrompt = messages.map((msg, index) => {
      if (index === 0 && msg.role === "system") {
        return {
          ...msg,
          content:
            msg.content +
            "\n\nIMPORTANT: You MUST respond with valid JSON format only. Return a single JSON object.",
        };
      }
      return msg;
    });

    console.log(`[AI Storefront] Request body:`, {
      model,
      messageCount: messagesWithJsonPrompt.length,
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: getMaxTokensForModel("deepseek", model),
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messagesWithJsonPrompt,
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: getMaxTokensForModel("deepseek", model),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        "[AI Storefront] DeepSeek model call failed:",
        response.status,
        response.statusText
      );
      console.error("[AI Storefront] DeepSeek error response:", text);
      throw new Error(
        `AI storefront model call failed with status ${response.status}`
      );
    }

    const json = (await response.json()) as Record<string, unknown>;
    const content =
      json?.choices &&
      Array.isArray(json.choices) &&
      json.choices[0] &&
      typeof json.choices[0] === "object"
        ? (
            (json.choices[0] as Record<string, unknown>).message as Record<
              string,
              unknown
            >
          )?.content
        : null;

    if (!content || typeof content !== "string") {
      throw new Error("[AI Storefront] Empty or invalid DeepSeek response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error(
        "[AI Storefront] Failed to parse DeepSeek JSON content:",
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

  console.log(`[AI Storefront] Using OPENAI provider with model: ${model}`);
  console.log(`[AI Storefront] Endpoint: ${endpoint}`);

  const maxTokens = getMaxTokensForModel(provider, model);

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
      temperature: 0.8,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[AI Storefront] Model call failed:", response.status, text);

    // Parse error details
    let errorDetails: { error?: { code?: string; message?: string } } = {};
    try {
      errorDetails = JSON.parse(text);
    } catch {
      // Ignore parse errors
    }

    // Create user-friendly error with code for graceful handling
    const error = new Error(
      `AI storefront model call failed with status ${response.status}`
    ) as Error & { status?: number; code?: string; details?: string };
    error.status = response.status;
    error.code = errorDetails.error?.code;
    error.details = errorDetails.error?.message;
    throw error;
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

/**
 * streamStorefrontModel
 *
 * Minimal streaming helper (OpenAI compatible). Calls the chat completions
 * endpoint with stream=true and emits token deltas via onToken. Returns the
 * final parsed JSON when complete, or throws on error.
 */
export async function streamStorefrontModel(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  providerConfig?: AiProviderConfig
): Promise<string> {
  const apiKey = providerConfig?.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("No API key configured for streaming model");

  const endpoint =
    providerConfig?.apiBase ||
    process.env.OPENAI_API_BASE ||
    "https://api.openai.com/v1/chat/completions";
  const model =
    providerConfig?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.8 }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Streaming model call failed:", response.status, text);
    throw new Error("Streaming model call failed");
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    buffer += chunk;

    // OpenAI streaming often uses lines prefixed with 'data: '
    const parts = buffer.split(/\n/);
    buffer = parts.pop() || "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed === "data: [DONE]") {
        // done
        break;
      }
      const m = trimmed.startsWith("data:")
        ? trimmed.replace(/^data:\s*/, "")
        : trimmed;
      try {
        const parsed = JSON.parse(m) as Record<string, unknown>;
        // OpenAI delta tokens path
        const choice = Array.isArray(parsed.choices) ? parsed.choices[0] : null;
        const delta = choice?.delta?.content || choice?.message?.content;
        if (typeof delta === "string") {
          full += delta;
          onToken(delta);
        }
      } catch (e: unknown) {
        console.error("Failed to parse streaming chunk:", e);
        // not JSON, maybe partial chunk - treat as raw
        full += m;
        onToken(m);
      }
    }
  }

  return full;
}
