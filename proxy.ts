import { type NextRequest, NextResponse } from "next/server";
import { proxySupabase } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isWhatsAppStatusRoute = 
    pathname.endsWith('/whatsapp/status') || 
    pathname === '/api/whatsapp/status';

  if (isWhatsAppStatusRoute) {
    return NextResponse.json({
      status: "NOT_INITIALIZED",
      connected: false,
      logs: [],
      qrCodeUrl: null
    });
  }

  const isWhatsAppRoute = 
    pathname.startsWith('/api/whatsapp') || 
    /\/api\/barbershops\/[^/]+\/whatsapp/.test(pathname);

  if (isWhatsAppRoute) {
    return new NextResponse(
      JSON.stringify({
        error: "WhatsApp integration is temporarily disabled. System is routed to Email notifications.",
        code: "WHATSAPP_DISABLED"
      }),
      {
        status: 503,
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  return await proxySupabase(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/onboarding/:path*",
    "/api/whatsapp/:path*",
    "/api/barbershops/:path*"
  ],
};