import crypto from "crypto";

const ALGO = "aes-256-gcm";

function normalizeKey(key: string): Buffer {
  const raw = Buffer.from(key, "base64");
  if (raw.length === 32) return raw;
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptString(plaintext: string, key: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, normalizeKey(key), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptString(payload: string, key: string): string {
  const bytes = Buffer.from(payload, "base64");
  const iv = bytes.subarray(0, 12);
  const tag = bytes.subarray(12, 28);
  const encrypted = bytes.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, normalizeKey(key), iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return out.toString("utf8");
}
