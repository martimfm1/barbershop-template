import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";
import {
  generateLoyaltyToken,
  getLoyaltySession,
  hashLoyaltyToken,
  hashLoyaltyValue,
  loyaltySessionExpiry,
  normalizeLoyaltyEmail,
  setLoyaltyCookie,
} from "@/lib/loyalty/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: unknown; email?: unknown; code?: unknown };
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const email = normalizeLoyaltyEmail(body.email);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!slug || !email || !/^\d{6}$/.test(code)) return NextResponse.json({ error: "Email ou código inválido." }, { status: 400 });

    const profile = await getPublicProfileBySlug(slug);
    if (!profile?.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) return NextResponse.json({ error: "A fidelização não está disponível." }, { status: 404 });

    const admin = createAdminClient();
    const { data: verification } = await admin
      .from("loyalty_verifications")
      .select("id, code_hash, attempts")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("email", email)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!verification) return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 401 });
    if ((verification.attempts ?? 0) >= 8) return NextResponse.json({ error: "Demasiadas tentativas. Pede um novo código." }, { status: 429 });

    if (hashLoyaltyValue(code) !== verification.code_hash) {
      await admin.from("loyalty_verifications").update({ attempts: (verification.attempts ?? 0) + 1 }).eq("id", verification.id);
      return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 401 });
    }

    await admin.from("loyalty_members").upsert(
      { barbershop_id: profile.barbershop_id, email, updated_at: new Date().toISOString() },
      { onConflict: "barbershop_id,email" },
    );

    const token = generateLoyaltyToken();
    const expiresAt = loyaltySessionExpiry();
    const { error: sessionError } = await admin.from("loyalty_sessions").insert({
      barbershop_id: profile.barbershop_id,
      email,
      token_hash: hashLoyaltyToken(token),
      expires_at: expiresAt,
    });
    if (sessionError) return NextResponse.json({ error: "Não foi possível iniciar a sessão." }, { status: 503 });

    await admin.from("loyalty_verifications").update({ consumed_at: new Date().toISOString(), attempts: (verification.attempts ?? 0) + 1 }).eq("id", verification.id);
    await setLoyaltyCookie(token, expiresAt);

    const session = await getLoyaltySession(profile.barbershop_id);
    return NextResponse.json({ success: true, email: session?.email ?? email }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível verificar o código." }, { status: 503 });
  }
}
