/**
 * Payment provider constants
 */

// Currency conversion
export const CENTS_PER_DOLLAR = 100;

// Unix timestamp conversion
export const MILLISECONDS_PER_SECOND = 1000;

// Provider names
export enum PaymentProviderName {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  SQUARE = "square",
  AUTHORIZE_NET = "authorize_net",
}

// Request timeout (30 seconds)
export const PAYMENT_API_TIMEOUT_MS = 30000;

// Environment variables
export const PAYPAL_BASE_URL_SANDBOX = "https://api-m.sandbox.paypal.com";
export const PAYPAL_BASE_URL_LIVE = "https://api-m.paypal.com";
