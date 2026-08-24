function getBaseUrl(request?: Request): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const origin = request?.headers.get('origin')?.trim();
  if (origin) return origin.replace(/\/$/, '');

  const forwardedHost = request?.headers
    .get('x-forwarded-host')
    ?.split(',')[0]
    ?.trim();
  const forwardedProto =
    request?.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  throw new Error('Não foi possível determinar o URL público da aplicação.');
}

/**
 * URL único e estável usado pelo Supabase Auth para confirmação de email.
 * O destino final é decidido pelo callback server-side, evitando parâmetros
 * `next` aninhados e dupla codificação no link enviado por email.
 */
export function getAuthCallbackUrl(request?: Request): string {
  return new URL('/api/auth/callback', getBaseUrl(request)).toString();
}

export function getClientAuthCallbackUrl(): string {
  if (typeof window === 'undefined') {
    throw new Error('getClientAuthCallbackUrl só pode ser usado no browser.');
  }

  return new URL('/api/auth/callback', window.location.origin).toString();
}
