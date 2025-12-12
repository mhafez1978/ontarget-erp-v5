/**
 * Encryption utilities for sensitive data (payment credentials, API keys, etc.)
 * Uses AES-256-GCM for encryption
 */

import crypto from "crypto";

// Use environment variable for encryption key
// In production, this should be a secure, randomly generated key
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-key-change-me-in-production-32-chars";

// Ensure key is 32 bytes for AES-256
function getEncryptionKey(): Buffer {
  const key = ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0");
  return Buffer.from(key, "utf-8");
}

/**
 * Encrypt sensitive text data
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedData (base64 encoded)
 */
export function encrypt(text: string): string {
  if (!text) return "";

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString("base64")}:${authTag.toString(
      "base64"
    )}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt encrypted text data
 * @param encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(":");

    // Check if this is the old CBC format (2 parts) or new GCM format (3 parts)
    if (parts.length === 2) {
      // Legacy aes-256-cbc format from lib/crypto.ts
      const [ivHex, encryptedDataHex] = parts;
      const legacyKey = Buffer.from(
        ENCRYPTION_KEY.padEnd(32, "0").substring(0, 32)
      );
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", legacyKey, iv);

      let decrypted = decipher.update(encryptedDataHex, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    }

    // New aes-256-gcm format
    const [ivBase64, authTagBase64, encryptedData] = parts;

    if (!ivBase64 || !authTagBase64 || !encryptedData) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash sensitive data (one-way, cannot be decrypted)
 * Useful for comparing secrets without storing plain text
 */
export function hash(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Mask sensitive data for display (e.g., API keys, account numbers)
 * @param text - Text to mask
 * @param visibleChars - Number of characters to show at the end
 * @param maskChar - Character to use for masking
 */
export function maskSensitiveData(
  text: string,
  visibleChars: number = 4,
  maskChar: string = "*"
): string {
  if (!text || text.length <= visibleChars) return text;

  const maskedLength = text.length - visibleChars;
  const masked = maskChar.repeat(maskedLength);
  const visible = text.slice(-visibleChars);

  return masked + visible;
}

/**
 * Verify webhook signature (HMAC SHA256)
 * @param payload - Webhook payload
 * @param signature - Signature to verify
 * @param secret - Webhook secret
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

/**
 * Generate webhook signature (HMAC SHA256)
 * @param payload - Webhook payload
 * @param secret - Webhook secret
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
