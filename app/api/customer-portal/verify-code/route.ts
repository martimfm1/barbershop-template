import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateSessionToken,
  getSessionExpiry,
  getPortalSession,
  hashPortalToken,
  hashPortalValue,
  normalizePortalEmail,
  setPortalCookie,
} from "@/lib/customer-booking-portal";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown; code?: unknown };
    const email = normalizePortalEmail(body.email);
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: "Email ou código inválido." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: verification, error } = await admin
      .from("booking_portal_verifications")
      .select("id, code_hash, expires_at, attempts")
      .eq("email", email)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !verification) {
      return NextResponse.json({ success: false, error: "Código inválido ou expirado." }, { status: 401 });
    }

    if ((verification.attempts ?? 0) >= 8) {
      return NextResponse.json({ success: false, error: "Demasiadas tentativas. Pede um novo código." }, { status: 429 });
    }

    if (hashPortalValue(code) !== verification.code_hash) {
      await admin
        .from("booking_portal_verifications")
        .update({ attempts: (verification.attempts ?? 0) + 1 })
        .eq("id", verification.id);
      return NextResponse.json({ success: false, error: "Código inválido ou expirado." }, { status: 401 });
    }

    const token = generateSessionToken();
    const expiresAt = getSessionExpiry();

    const { error: sessionError } = await admin.from("booking_portal_sessions").insert({
      email,
      token_hash: hashPortalToken(token),
      expires_at: expiresAt,
    });

    if (sessionError) {
      console.error("[CUSTOMER_PORTAL_SESSION_ERROR]", sessionError);
      return NextResponse.json({ success: false, error: "Não foi possível iniciar a sessão." }, { status: 503 });
    }

    await admin
      .from("booking_portal_verifications")
      .update({ consumed_at: new Date().toISOString(), attempts: (verification.attempts ?? 0) + 1 })
      .eq("id", verification.id);

    await setPortalCookie(token, expiresAt);

    const existingSession = await getPortalSession();
    return NextResponse.json({ success: true, email: existingSession?.email ?? email });
  } catch (error) {
    console.error("[CUSTOMER_PORTAL_VERIFY_ERROR]", error);
    return NextResponse.json({ success: false, error: "Não foi possível verificar o código." }, { status: 500 });
  }
}
