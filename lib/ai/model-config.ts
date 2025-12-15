/**
 * AI Model Configuration
 * Defines available models for each provider with token limits and cost information
 */

export type ModelInfo = {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "deepseek";
  contextWindow: number; // Maximum tokens (input + output)
  inputCostPer1M: number; // Cost per 1M input tokens in USD
  outputCostPer1M: number; // Cost per 1M output tokens in USD
  description: string;
  recommended?: boolean;
};

export const OPENAI_MODELS: ModelInfo[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    contextWindow: 128000,
    inputCostPer1M: 2.5,
    outputCostPer1M: 10.0,
    description: "Latest GPT-4 model, best quality",
    recommended: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    contextWindow: 128000,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    description: "Affordable and fast, great for most tasks",
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    contextWindow: 128000,
    inputCostPer1M: 10.0,
    outputCostPer1M: 30.0,
    description: "Previous generation GPT-4",
  },
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "openai",
    contextWindow: 16385,
    inputCostPer1M: 0.5,
    outputCostPer1M: 1.5,
    description: "Fast and cheap, lower quality",
  },
];

export const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    contextWindow: 200000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    description: "Best balance of intelligence and speed",
    recommended: true,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    inputCostPer1M: 0.8,
    outputCostPer1M: 4.0,
    description: "Fast and affordable, good quality",
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "anthropic",
    contextWindow: 200000,
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
    description: "Most powerful, highest cost",
  },
  {
    id: "claude-3-sonnet-20240229",
    name: "Claude 3 Sonnet",
    provider: "anthropic",
    contextWindow: 200000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    description: "Previous generation, stable",
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    contextWindow: 200000,
    inputCostPer1M: 0.25,
    outputCostPer1M: 1.25,
    description: "Cheapest option, fast",
  },
];

export const DEEPSEEK_MODELS: ModelInfo[] = [
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "deepseek",
    contextWindow: 64000,
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    description: "DeepSeek's most capable model, extremely affordable",
    recommended: true,
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder",
    provider: "deepseek",
    contextWindow: 64000,
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    description: "Optimized for code generation and technical content",
  },
];

export const ALL_MODELS: ModelInfo[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...DEEPSEEK_MODELS,
];

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(
  provider: "openai" | "anthropic" | "deepseek"
): ModelInfo[] {
  if (provider === "openai") return OPENAI_MODELS;
  if (provider === "anthropic") return ANTHROPIC_MODELS;
  return DEEPSEEK_MODELS;
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId: string): ModelInfo | undefined {
  return ALL_MODELS.find((m) => m.id === modelId);
}

/**
 * Format cost for display
 */
export function formatCost(costPer1M: number): string {
  if (costPer1M < 1) {
    return `$${costPer1M.toFixed(2)}`;
  }
  return `$${costPer1M.toFixed(0)}`;
}

/**
 * Estimate cost for a generation (rough estimate)
 * Assumes ~3000 input tokens and ~2000 output tokens per storefront generation
 */
export function estimateGenerationCost(model: ModelInfo): string {
  const inputTokens = 3000;
  const outputTokens = 2000;
  const cost =
    (inputTokens / 1_000_000) * model.inputCostPer1M +
    (outputTokens / 1_000_000) * model.outputCostPer1M;

  if (cost < 0.01) {
    return `~$${cost.toFixed(3)}`;
  }
  return `~$${cost.toFixed(2)}`;
}

/**
 * Get relative cost multiplier compared to cheapest model in provider
 * Returns a string like "×1" (baseline), "×3.5", "×0.3", etc.
 */
export function getRelativeCostMultiplier(
  model: ModelInfo,
  models: ModelInfo[]
): string {
  const inputTokens = 3000;
  const outputTokens = 2000;

  const modelCost =
    (inputTokens / 1_000_000) * model.inputCostPer1M +
    (outputTokens / 1_000_000) * model.outputCostPer1M;

  const costs = models.map(
    (m) =>
      (inputTokens / 1_000_000) * m.inputCostPer1M +
      (outputTokens / 1_000_000) * m.outputCostPer1M
  );
  const cheapestCost = Math.min(...costs);

  const multiplier = modelCost / cheapestCost;

  if (multiplier === 1) {
    return "×1 (cheapest)";
  }
  if (multiplier < 1) {
    return `×${multiplier.toFixed(2)}`;
  }
  if (multiplier < 10) {
    return `×${multiplier.toFixed(1)}`;
  }
  return `×${Math.round(multiplier)}`;
}
