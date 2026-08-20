import { createHmac } from "node:crypto";

function getSecret(): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) throw new Error("RATE_LIMIT_SECRET is not configured correctly.");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createCalendarToken(appointmentId: string): string {
  const payload = Buffer.from(appointmentId, "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyCalendarToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    return Buffer.from(payload, "base64url").toString("utf8") || null;
  } catch {
    return null;
  }
}

export function getPublicAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  throw new Error("NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL is required for email links.");
}
