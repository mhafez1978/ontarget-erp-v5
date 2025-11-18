import crypto from "crypto";

// Use environment variable for encryption key
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-32-character-secret-key!!"; // Must be 32 characters
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypts sensitive data using AES-256-CBC
 * @param text The text to encrypt
 * @returns Encrypted string in format: iv:encryptedData
 */
export function encrypt(text: string): string {
  if (!text) return "";

  try {
    // Ensure key is exactly 32 bytes
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").substring(0, 32));
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return IV and encrypted data separated by colon
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedText Encrypted string in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }

    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").substring(0, 32));
    const iv = Buffer.from(parts[0], "hex");
    const encryptedData = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Checks if a string is encrypted (contains iv:data format)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split(":");
  return parts.length === 2 && parts[0].length === IV_LENGTH * 2; // IV as hex is 32 chars
}
