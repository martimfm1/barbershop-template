import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerPortalCodeEmail } from "@/lib/brevo/customer-booking-portal";
import { requireTenantAuthorization } from "@/lib/security/tenant-guard";
import { consumePublicRateLimit } from "@/lib/security/public-rate-limit";
import { getLoyaltyTenantBySlug } from "@/lib/loyalty/public-tenant";
import { generateLoyaltyCode, hashLoyaltyValue, loyaltyCodeExpiry, normalizeLoyaltyEmail } from "@/lib/loyalty/session";

export const runtime = "nodejs";
const EMAIL_RATE_LIMIT = 3;
const EMAIL_RATE_WINDOW_SECONDS = 15 * 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: unknown; email?: unknown };
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const email = normalizeLoyaltyEmail(body.email);
    if (!slug || !email) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    const tenant = await getLoyaltyTenantBySlug(slug);
    if (!tenant) return NextResponse.json({ error: "A fidelização não está disponível para esta barbearia." }, { status: 404 });

    await requireTenantAuthorization({ barbershopId: tenant.barbershopId, allowPublicTenant: true });

    const allowed = await consumePublicRateLimit(request, "loyalty-otp-request", `${tenant.barbershopId}:${email}`, EMAIL_RATE_LIMIT, EMAIL_RATE_WINDOW_SECONDS);
    if (!allowed) return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });

    const admin = createAdminClient();
    const code = generateLoyaltyCode();
    const expiresAt = loyaltyCodeExpiry();
    const codeHash = hashLoyaltyValue(code);

    const { error: cleanupError } = await admin.from("loyalty_verifications").delete().eq("barbershop_id", tenant.barbershopId).eq("email", email).is("consumed_at", null);
    if (cleanupError) throw cleanupError;

    const { error: insertError } = await admin.from("loyalty_verifications").insert({ barbershop_id: tenant.barbershopId, email, code_hash: codeHash, expires_at: expiresAt });
    if (insertError) throw insertError;

    try {
      await sendCustomerPortalCodeEmail(email, code);
    } catch (emailError) {
      await admin.from("loyalty_verifications").delete().eq("barbershop_id", tenant.barbershopId).eq("email", email).eq("code_hash", codeHash).is("consumed_at", null);
      console.error("[LOYALTY_OTP_EMAIL_ERROR]", emailError instanceof Error ? emailError.name : "UnknownError");
      return NextResponse.json({ error: "Não foi possível enviar o código." }, { status: 503 });
    }

    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar o código." }, { status: 503 });
  }
}
