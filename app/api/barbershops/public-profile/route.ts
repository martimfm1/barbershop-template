import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BarbershopStripeService } from "@/services/billing/barbershop-stripe.service";
import { planSupportsCustomSlug } from "@/lib/barbershops/public-profile";
import { validatePublicProfileSlug, normalizePublicProfileSlug } from "@/lib/barbershops/public-profile-slug";
import { BillingError } from "@/types/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return jsonError("Não autenticado.", 401);

    const tenant = await BarbershopStripeService.getTenantContext(user.id);
    const plan = await BarbershopStripeService.getEffectivePlan(user.id);
    const database = createAdminClient();
    const { data: shop, error: shopError } = await database
      .from("shops")
      .select("id, slug, custom_slug, public_profile_enabled, seo_title, seo_description, og_image_url, theme_config")
      .eq("barbershop_id", tenant.barbershopId)
      .maybeSingle();

    if (shopError) throw new BillingError("Não foi possível carregar o perfil público.", "DB_READ_FAILED");

    return NextResponse.json({
      data: {
        ...shop,
        plan,
        canCustomizeSlug: planSupportsCustomSlug(plan),
        canCustomizeEnterprise: plan === "enterprise",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BillingError) return jsonError(error.message, 400);
    return jsonError("Não foi possível carregar o perfil público.", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return jsonError("Não autenticado.", 401);

    const tenant = await BarbershopStripeService.getTenantContext(user.id);
    const plan = await BarbershopStripeService.getEffectivePlan(user.id);
    if (!planSupportsCustomSlug(plan)) {
      return jsonError("O link personalizado está disponível a partir do plano Pro.", 403);
    }

    const body = (await request.json().catch(() => ({}))) as { slug?: unknown };
    const rawSlug = typeof body.slug === "string" ? body.slug : "";
    const slug = normalizePublicProfileSlug(rawSlug);
    const validationError = validatePublicProfileSlug(slug);
    if (validationError) return jsonError(validationError, 400);

    const database = createAdminClient();
    const { data: currentShop, error: currentError } = await database
      .from("shops")
      .select("id, slug, custom_slug")
      .eq("barbershop_id", tenant.barbershopId)
      .maybeSingle();

    if (currentError) throw new BillingError("Não foi possível carregar a página pública.", "DB_READ_FAILED");
    if (!currentShop) return jsonError("A barbearia ainda não tem uma página pública configurada.", 404);

    const { data: conflictingShop } = await database
      .from("shops")
      .select("id")
      .or(`slug.eq.${slug},custom_slug.eq.${slug}`)
      .neq("id", currentShop.id)
      .maybeSingle();

    if (conflictingShop) return jsonError("Este link já está a ser utilizado por outra barbearia.", 409);

    if (currentShop.slug === slug && currentShop.custom_slug === slug) {
      return NextResponse.json({ success: true, slug }, { headers: { "Cache-Control": "no-store" } });
    }

    if (currentShop.slug && currentShop.slug !== slug) {
      await database.from("shop_slug_redirects").upsert(
        { shop_id: currentShop.id, old_slug: currentShop.slug },
        { onConflict: "shop_id,old_slug" },
      );
    }

    const { error: updateError } = await database
      .from("shops")
      .update({
        slug,
        custom_slug: slug,
        public_profile_updated_at: new Date().toISOString(),
      })
      .eq("id", currentShop.id)
      .eq("barbershop_id", tenant.barbershopId);

    if (updateError) throw new BillingError("Não foi possível guardar o link personalizado.", "DB_WRITE_FAILED");

    return NextResponse.json({ success: true, slug }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BillingError) return jsonError(error.message, 400);
    return jsonError("Não foi possível atualizar o link da barbearia.", 500);
  }
}
