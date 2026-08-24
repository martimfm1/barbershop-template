import { type NextRequest, NextResponse } from 'next/server';
import { proxySupabase } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep the existing onboarding client contract while routing the legacy
  // endpoint through the server-side, hashed and expiring invite flow.
  if (pathname === '/api/onboarding/join') {
    const target = request.nextUrl.clone();
    target.pathname = '/api/onboarding/join-v2';
    return NextResponse.rewrite(target);
  }

  return await proxySupabase(request);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/api/barbershops/:path*',
    '/api/onboarding/join',
  ],
};
