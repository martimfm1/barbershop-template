import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.LOYALTY_REDEMPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("LOYALTY_REDEMPTION_SECRET must be configured with at least 32 characters.");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptRedemptionSecret(value: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptRedemptionSecret(payload: string): string {
  const raw = Buffer.from(payload, "base64url");
  if (raw.length <= IV_LENGTH + TAG_LENGTH) throw new Error("Invalid encrypted redemption secret.");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
