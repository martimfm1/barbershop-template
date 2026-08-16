import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";
import { sendCustomerPortalCodeEmail } from "@/lib/brevo/customer-booking-portal";
import { requireTenantAuthorization } from "@/lib/security/tenant-guard";
import {
  generateLoyaltyCode,
  hashLoyaltyValue,
  loyaltyCodeExpiry,
  normalizeLoyaltyEmail,
} from "@/lib/loyalty/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: unknown; email?: unknown };
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const email = normalizeLoyaltyEmail(body.email);
    if (!slug || !email) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    const profile = await getPublicProfileBySlug(slug);
    if (!profile || !profile.barbershop_id || !["pro", "enterprise"].includes(profile.plan)) {
      return NextResponse.json({ error: "A fidelização não está disponível para esta barbearia." }, { status: 404 });
    }

    // OTP delivery is the authentication step; this guard validates the public tenant boundary.
    await requireTenantAuthorization({ barbershopId: profile.barbershop_id, allowPublicTenant: true });

    const admin = createAdminClient();
    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const { count } = await admin
      .from("loyalty_verifications")
      .select("id", { count: "exact", head: true })
      .eq("barbershop_id", profile.barbershop_id)
      .eq("email", email)
      .gte("requested_at", cutoff);

    if ((count ?? 0) >= 1) {
      return NextResponse.json({ success: true });
    }

    const code = generateLoyaltyCode();
    await admin
      .from("loyalty_verifications")
      .delete()
      .eq("barbershop_id", profile.barbershop_id)
      .eq("email", email)
      .is("consumed_at", null);

    const { error: insertError } = await admin.from("loyalty_verifications").insert({
      barbershop_id: profile.barbershop_id,
      email,
      code_hash: hashLoyaltyValue(code),
      expires_at: loyaltyCodeExpiry(),
    });

    if (insertError) return NextResponse.json({ error: "Não foi possível iniciar a autenticação." }, { status: 503 });

    await sendCustomerPortalCodeEmail(email, code);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar o código." }, { status: 503 });
  }
}
