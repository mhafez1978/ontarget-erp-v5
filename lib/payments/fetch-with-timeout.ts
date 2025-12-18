/**
 * Fetch wrapper with timeout support
 */

import { PAYMENT_API_TIMEOUT_MS } from "@/lib/payment-providers/constants";

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = PAYMENT_API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}
