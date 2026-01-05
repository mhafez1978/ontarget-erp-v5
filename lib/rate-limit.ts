/**
 * Simple in-memory rate limiter for payment endpoints
 *
 * Note: This implementation is suitable for single-instance deployments.
 * For multi-instance/serverless deployments, consider using:
 * - Upstash Rate Limit (@upstash/ratelimit)
 * - Redis-based rate limiting
 * - Edge/CDN-based rate limiting (Vercel Edge Config, Cloudflare Workers KV)
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Unique identifier for this endpoint (e.g., 'payment-create') */
  endpoint: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for the requester (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.endpoint}:${identifier}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, record);
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment counter
  record.count++;

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  PAYMENT_METHOD_CREATE: {
    endpoint: "payment-method-create",
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  OAUTH_COMPLETE: {
    endpoint: "oauth-complete",
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  PAYMENT_INTENT_CREATE: {
    endpoint: "payment-intent-create",
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
} as const;
