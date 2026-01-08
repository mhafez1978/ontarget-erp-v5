/**
 * Dynamic Model Fetcher
 * Fetches available models from provider APIs and keeps them updated
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ModelInfo } from "./model-config.ts";

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;

interface ModelCache {
  models: ModelInfo[];
  timestamp: number;
}

const modelCache = new Map<string, ModelCache>();

/**
 * Fetch available models from OpenAI
 */
async function fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    // Filter for GPT models and map to our format - dynamically handle all GPT models
    const gptModels = data.data
      .filter(
        (model: { id: string }) =>
          model.id.startsWith("gpt-") &&
          !model.id.includes("instruct") &&
          !model.id.includes("vision") &&
          !model.id.includes("realtime")
      )
      .map((model: { id: string }): ModelInfo => {
        const modelId = model.id.toLowerCase();

        // Determine context window and costs based on model - dynamic detection
        let contextWindow = 128000; // Default for modern models
        let inputCost = 2.5;
        let outputCost = 10.0;
        let description = "OpenAI model";
        let recommended = false;

        // GPT-4.5 models (future-proof)
        if (modelId.includes("gpt-4.5") || modelId.includes("gpt-5")) {
          contextWindow = 128000;
          inputCost = 5.0;
          outputCost = 15.0;
          description = "Next generation GPT model";
          recommended = true;
        }
        // GPT-4o models
        else if (modelId.includes("gpt-4o")) {
          contextWindow = 128000;
          if (modelId.includes("mini")) {
            inputCost = 0.15;
            outputCost = 0.6;
            description = "Affordable and fast, great for most tasks";
          } else {
            inputCost = 2.5;
            outputCost = 10.0;
            description = "Latest GPT-4 model, best quality";
            recommended =
              !modelId.includes("4.5") && !modelId.includes("gpt-5");
          }
        }
        // GPT-4 Turbo models
        else if (
          modelId.includes("gpt-4-turbo") ||
          modelId.includes("gpt-4-1106") ||
          modelId.includes("gpt-4-0125")
        ) {
          contextWindow = 128000;
          inputCost = 10.0;
          outputCost = 30.0;
          description = "Previous generation GPT-4 Turbo";
        }
        // GPT-4 base models
        else if (modelId.includes("gpt-4")) {
          contextWindow = 8192;
          inputCost = 30.0;
          outputCost = 60.0;
          description = "Original GPT-4 model";
        }
        // GPT-3.5 models
        else if (modelId.includes("gpt-3.5")) {
          contextWindow = 16385;
          inputCost = 0.5;
          outputCost = 1.5;
          description = "Fast and affordable, good for simple tasks";
        }

        return {
          id: model.id,
          name: formatModelName(model.id),
          provider: "openai",
          contextWindow,
          inputCostPer1M: inputCost,
          outputCostPer1M: outputCost,
          description,
          recommended,
        };
      });

    console.log(`[Model Fetcher] Fetched ${gptModels.length} OpenAI models`);

    // Sort by recommendation and name
    gptModels.sort((a: ModelInfo, b: ModelInfo) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return a.name.localeCompare(b.name);
    });

    return gptModels;
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    return [];
  }
}

/**
 * Fetch available models from Anthropic
 */
async function fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    console.log("[Model Fetcher] Starting Anthropic model fetch with SDK...");

    const client = new Anthropic({
      apiKey: apiKey,
    });

    const models: ModelInfo[] = [];

    // Fetch models using SDK - convert to array first
    const modelList = await client.beta.models.list();
    const allModels = [];

    for await (const model of modelList) {
      allModels.push(model);
    }

    console.log(
      `[Model Fetcher] SDK returned ${allModels.length} models from Anthropic`
    );

    for (const betaModelInfo of allModels) {
      const modelId = betaModelInfo.id;
      const lowerModelId = modelId.toLowerCase();

      let contextWindow = 200000;
      let inputCost = 3.0;
      let outputCost = 15.0;
      let description = betaModelInfo.display_name || "Claude model";
      let recommended = false;

      // Determine costs and features based on model ID
      if (lowerModelId.includes("sonnet-4-5")) {
        description =
          "Claude Sonnet 4.5 - Latest and most capable, best balance";
        contextWindow = 200000;
        inputCost = 3.0;
        outputCost = 15.0;
        recommended = true;
      } else if (lowerModelId.includes("opus-4-5")) {
        description = "Claude Opus 4.5 - Most powerful, highest intelligence";
        contextWindow = 200000;
        inputCost = 15.0;
        outputCost = 75.0;
      } else if (lowerModelId.includes("haiku-4-5")) {
        description = "Claude Haiku 4.5 - Fastest and most affordable";
        contextWindow = 200000;
        inputCost = 0.8;
        outputCost = 4.0;
      } else if (lowerModelId.includes("sonnet-4")) {
        description =
          "Claude Sonnet 4 - Excellent balance of intelligence and speed";
        contextWindow = 200000;
        inputCost = 3.0;
        outputCost = 15.0;
        recommended = false;
      } else if (lowerModelId.includes("opus-4")) {
        description = "Claude Opus 4 - Highest intelligence, premium cost";
        contextWindow = 200000;
        inputCost = 15.0;
        outputCost = 75.0;
      } else if (lowerModelId.includes("haiku-4")) {
        description = "Claude Haiku 4 - Fast and affordable";
        contextWindow = 200000;
        inputCost = 0.8;
        outputCost = 4.0;
      } else if (lowerModelId.includes("3-5-sonnet")) {
        description =
          "Claude 3.5 Sonnet - Previous generation, still excellent";
        contextWindow = 200000;
        inputCost = 3.0;
        outputCost = 15.0;
      } else if (lowerModelId.includes("3-5-haiku")) {
        description =
          "Claude 3.5 Haiku - Previous generation, fast and affordable";
        contextWindow = 200000;
        inputCost = 0.8;
        outputCost = 4.0;
      } else if (lowerModelId.includes("3-opus")) {
        description = "Claude 3 Opus - Previous generation, most powerful";
        contextWindow = 200000;
        inputCost = 15.0;
        outputCost = 75.0;
      } else if (lowerModelId.includes("3-sonnet")) {
        description = "Claude 3 Sonnet - Previous generation, balanced";
        contextWindow = 200000;
        inputCost = 3.0;
        outputCost = 15.0;
      } else if (lowerModelId.includes("3-haiku")) {
        description = "Claude 3 Haiku - Previous generation, fastest";
        contextWindow = 200000;
        inputCost = 0.25;
        outputCost = 1.25;
      }

      models.push({
        id: modelId,
        name: betaModelInfo.display_name || formatModelName(modelId),
        provider: "anthropic",
        contextWindow,
        inputCostPer1M: inputCost,
        outputCostPer1M: outputCost,
        description,
        recommended,
      });
    }

    console.log(`[Model Fetcher] Fetched ${models.length} Anthropic models`);

    return models.length > 0 ? models : getFallbackAnthropicModels();
  } catch (error) {
    console.error("❌ Failed to fetch Anthropic models:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.error("Returning fallback models");
    return getFallbackAnthropicModels();
  }
}

/**
 * Fetch available models from DeepSeek
 */
async function fetchDeepSeekModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch("https://api.deepseek.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();

    const models = data.data.map((model: { id: string }): ModelInfo => {
      const modelId = model.id.toLowerCase();

      // Dynamic detection of DeepSeek models
      let contextWindow = 64000; // Default
      let inputCost = 0.14;
      let outputCost = 0.28;
      let description = "DeepSeek model";
      let recommended = false;

      // DeepSeek V3 models (latest)
      if (modelId.includes("v3") || modelId.includes("deepseek-v3")) {
        contextWindow = 128000;
        inputCost = 0.27;
        outputCost = 1.1;
        description = "Latest DeepSeek V3 - Best performance";
        recommended = true;
      }
      // DeepSeek V2.5 models
      else if (modelId.includes("v2.5") || modelId.includes("2.5")) {
        contextWindow = 64000;
        inputCost = 0.14;
        outputCost = 0.28;
        description = "DeepSeek V2.5 - Excellent balance";
        recommended = !modelId.includes("v3");
      }
      // DeepSeek V2 models
      else if (modelId.includes("v2") || modelId.includes("deepseek-v2")) {
        contextWindow = 64000;
        inputCost = 0.14;
        outputCost = 0.28;
        description = "DeepSeek V2 - Reliable and affordable";
      }
      // Chat models
      else if (modelId.includes("chat")) {
        description = "Optimized for conversations and complex reasoning";
        recommended = true;
      }
      // Coder models
      else if (modelId.includes("coder")) {
        description = "Specialized for code generation and analysis";
        contextWindow = 128000; // Coder models typically have larger context
      }

      return {
        id: model.id,
        name: formatModelName(model.id),
        provider: "deepseek",
        contextWindow,
        inputCostPer1M: inputCost,
        outputCostPer1M: outputCost,
        description,
        recommended,
      };
    });

    console.log(`[Model Fetcher] Fetched ${models.length} DeepSeek models`);

    // Sort by recommendation and name
    models.sort((a: ModelInfo, b: ModelInfo) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return a.name.localeCompare(b.name);
    });

    return models;
  } catch (error) {
    console.error("Failed to fetch DeepSeek models:", error);
    return [];
  }
}

/**
 * Format model ID into a human-readable name
 */
function formatModelName(modelId: string): string {
  // Remove date suffixes
  let name = modelId.replace(/-\d{8}$/, "");

  // Capitalize and format
  name = name
    .split("-")
    .map((part) => {
      if (part === "gpt") return "GPT";
      if (part === "claude") return "Claude";
      if (part === "deepseek") return "DeepSeek";
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");

  // Add date if present
  const dateMatch = modelId.match(/-(\d{8})$/);
  if (dateMatch) {
    const date = dateMatch[1];
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    name += ` (${monthNames[parseInt(month) - 1]} ${year})`;
  }

  return name;
}

/**
 * Fallback models if API fetch fails
 */
function getFallbackAnthropicModels(): ModelInfo[] {
  return [
    {
      id: "claude-3-5-sonnet-20240620",
      name: "Claude 3.5 Sonnet (Jun 2024)",
      provider: "anthropic",
      contextWindow: 200000,
      inputCostPer1M: 3.0,
      outputCostPer1M: 15.0,
      description: "Best balance of intelligence and speed",
      recommended: true,
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku (Oct 2024)",
      provider: "anthropic",
      contextWindow: 200000,
      inputCostPer1M: 0.8,
      outputCostPer1M: 4.0,
      description: "Fast and affordable, good quality",
    },
  ];
}

/**
 * Get models with caching
 */
export async function getAvailableModels(
  provider: "openai" | "anthropic" | "deepseek",
  apiKey: string
): Promise<ModelInfo[]> {
  const cacheKey = `${provider}-${apiKey.substring(0, 8)}`;
  const cached = modelCache.get(cacheKey);

  // Return cached if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.models;
  }

  // Fetch fresh models
  let models: ModelInfo[] = [];

  switch (provider) {
    case "openai":
      models = await fetchOpenAIModels(apiKey);
      break;
    case "anthropic":
      models = await fetchAnthropicModels(apiKey);
      break;
    case "deepseek":
      models = await fetchDeepSeekModels(apiKey);
      break;
  }

  // Cache the results
  if (models.length > 0) {
    modelCache.set(cacheKey, {
      models,
      timestamp: Date.now(),
    });
  }

  return models;
}

/**
 * Clear model cache (useful for testing or manual refresh)
 */
export function clearModelCache(provider?: string) {
  if (provider) {
    // Clear specific provider
    for (const key of modelCache.keys()) {
      if (key.startsWith(provider)) {
        modelCache.delete(key);
      }
    }
  } else {
    // Clear all
    modelCache.clear();
  }
}
