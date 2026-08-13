import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateVerificationCode, getVerificationExpiry, hashPortalValue, normalizePortalEmail } from "@/lib/customer-booking-portal";
import { sendCustomerPortalCodeEmail } from "@/lib/brevo/customer-booking-portal";

export async function POST(request: Request) {
  const genericResponse = NextResponse.json({
    success: true,
    message: "Se o endereço for válido, vais receber um código de confirmação por email.",
  });

  try {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown };
    const email = normalizePortalEmail(body.email);
    if (!email) {
      return NextResponse.json({ success: false, error: "Indica um email válido." }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date();
    const recentCutoff = new Date(now.getTime() - 60_000).toISOString();
    const { count, error: recentError } = await admin
      .from("booking_portal_verifications")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("requested_at", recentCutoff);

    if (recentError) {
      console.error("[CUSTOMER_PORTAL_RATE_CHECK_ERROR]", recentError);
      return genericResponse;
    }

    if ((count ?? 0) >= 1) return genericResponse;

    const code = generateVerificationCode();
    await admin.from("booking_portal_verifications").delete().eq("email", email).is("consumed_at", null);

    const { error: insertError } = await admin.from("booking_portal_verifications").insert({
      email,
      code_hash: hashPortalValue(code),
      expires_at: getVerificationExpiry(),
    });

    if (insertError) {
      console.error("[CUSTOMER_PORTAL_CODE_INSERT_ERROR]", insertError);
      return genericResponse;
    }

    try {
      await sendCustomerPortalCodeEmail(email, code);
    } catch (error) {
      console.error("[CUSTOMER_PORTAL_EMAIL_ERROR]", error);
      return genericResponse;
    }

    return genericResponse;
  } catch (error) {
    console.error("[CUSTOMER_PORTAL_REQUEST_CODE_ERROR]", error);
    return genericResponse;
  }
}
