import crypto from "crypto";

// Derive a 32-byte key for AES-256-GCM. Prefer a 64-char hex key (recommended in docs).
function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || "default-32-character-secret-key!!";
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return Buffer.from(raw.padEnd(32, "0").slice(0, 32), "utf-8");
}

/**
 * Encrypt a binary payload for cold storage using AES-256-GCM.
 * Returns a compact base64 string: iv:authTag:ciphertext
 */
export function encryptBufferToString(plain: Buffer): string {
  if (!plain || plain.length === 0) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString(
    "base64"
  )}:${encrypted.toString("base64")}`;
}

/**
 * Decrypt a base64 payload produced by encryptBufferToString.
 */
export function decryptBufferFromString(serialized: string): Buffer {
  if (!serialized) return Buffer.alloc(0);
  const [ivB64, tagB64, dataB64] = serialized.split(":");
  if (!ivB64 || !tagB64 || !dataB64)
    throw new Error("Invalid encrypted data format");
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted;
}
