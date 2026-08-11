const DEFAULT_CONFIRMATION_NEXT = "/login?status=confirmed";

function getBaseUrl(request?: Request): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  const origin = request?.headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");

  const forwardedHost = request?.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  throw new Error("Não foi possível determinar o URL público da aplicação.");
}

export function getAuthCallbackUrl(
  request?: Request,
  next = DEFAULT_CONFIRMATION_NEXT,
): string {
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : DEFAULT_CONFIRMATION_NEXT;
  const url = new URL("/api/auth/callback", getBaseUrl(request));
  url.searchParams.set("next", safeNext);
  return url.toString();
}

export function getClientAuthCallbackUrl(next = DEFAULT_CONFIRMATION_NEXT): string {
  if (typeof window === "undefined") {
    throw new Error("getClientAuthCallbackUrl só pode ser usado no browser.");
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : DEFAULT_CONFIRMATION_NEXT;
  const url = new URL("/api/auth/callback", window.location.origin);
  url.searchParams.set("next", safeNext);
  return url.toString();
}
