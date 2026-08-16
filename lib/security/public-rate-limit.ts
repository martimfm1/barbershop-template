import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return forwarded || real || "unknown";
}

function getRateLimitSecret(): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("RATE_LIMIT_SECRET is not configured with sufficient entropy.");
  }
  return secret;
}

export async function consumePublicRateLimit(
  request: Request,
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const ip = getClientIp(request);
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const key = createHmac("sha256", getRateLimitSecret())
    .update(`${scope}:${normalizedIdentifier}:${ip}`)
    .digest("hex");

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_public_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error("Public rate limiter unavailable.");
  }

  return data === true;
}
