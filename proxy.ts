import { type NextRequest, NextResponse } from "next/server";
import { proxySupabase } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  return await proxySupabase(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/onboarding/:path*",
    "/api/barbershops/:path*"
  ],
};
