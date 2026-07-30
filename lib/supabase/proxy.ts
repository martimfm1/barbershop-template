import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getUserBarbershopId } from "@/lib/db";

export async function proxySupabase(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 1. Bloqueio de segurança se não estiver autenticado
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Fluxo para utilizadores autenticados
  if (user) {
    const profile = await getUserBarbershopId(supabase, user.id);

    // console.log("Profile loaded in Proxy:", profile);
    const hasBarbershop = !!profile?.barbershop_id;

    // Gerir o cookie da barbearia
    if (profile?.barbershop_id) {
      response.cookies.set("barbershop_id", profile.barbershop_id, {
        path: "/",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    } else {
      response.cookies.delete("barbershop_id");
    }

    // Redirecionamentos inteligentes do Onboarding / Dashboard
    if (pathname.startsWith("/dashboard") && !hasBarbershop) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    if (pathname.startsWith("/onboarding") && hasBarbershop) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}