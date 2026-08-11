import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRecord, normalizeText } from "@/lib/validation";
import { slugify } from "@/lib/utils/slugify";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
    }
    const { name, address, city, hours, price, tags, lat, lng } = body;
    const normalizedName = normalizeText(name, 120);
    const normalizedAddress = normalizeText(address, 240);
    const normalizedCity = normalizeText(city, 100);

    if (!normalizedName || !normalizedAddress || !normalizedCity) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta: name, address, city" },
        { status: 400 }
      );
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from("users")
      .select("barbershop_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[ONBOARDING_PROFILE_CHECK_FAIL]", profileError);
      return NextResponse.json({ error: "Não foi possível validar a conta." }, { status: 503 });
    }

    if (currentProfile?.barbershop_id) {
      return NextResponse.json({ error: "Esta conta já tem uma barbearia associada." }, { status: 409 });
    }

    let openTime = "09:00:00";
    let closeTime = "19:00:00";

    if (typeof hours === "string" && hours.includes("-")) {
      const parts = hours.split("-").map((h) => h.trim());
      if (parts[0]) openTime = parts[0].length === 5 ? `${parts[0]}:00` : parts[0];
      if (parts[1]) closeTime = parts[1].length === 5 ? `${parts[1]}:00` : parts[1];
    }

    const generatedSlug = `${slugify(normalizedName)}-${crypto.randomUUID().slice(0, 8)}`;
    const numericPrice = typeof price === "number" ? price : Number(price);
    const latitude = typeof lat === "number" ? lat : Number(lat);
    const longitude = typeof lng === "number" ? lng : Number(lng);

    if (
      !Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 10_000 ||
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180
    ) {
      return NextResponse.json({ error: "Os dados de preço ou localização são inválidos." }, { status: 400 });
    }

    const { data: barbershop, error: barbershopError } = await supabase
      .from("barbershops")
      .insert({
        name: normalizedName,
        address: normalizedAddress,
        opening_time: openTime,
        closing_time: closeTime,
        allow_online_bookings: true,
        auto_reminders: false,
      })
      .select("id")
      .single();

    if (barbershopError || !barbershop) {
      console.error("[ONBOARDING_BARBERSHOP_FAIL]", barbershopError);
      return NextResponse.json({ error: "Falha ao criar barbearia" }, { status: 500 });
    }

    const barbershopId = barbershop.id;

    const { error: shopError } = await supabase
      .from("shops")
      .insert({
        barbershop_id: barbershopId,
        slug: generatedSlug,
        city: normalizedCity,
        price: numericPrice,
        tags: Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === "string").slice(0, 12) : [],
        lat: latitude,
        lng: longitude,
        is_active: true,
      });

    if (shopError) {
      console.error("[ONBOARDING_SHOP_FAIL]", shopError);
      await supabase.from("barbershops").delete().eq("id", barbershopId);
      return NextResponse.json({ error: "Falha ao criar listing no marketplace" }, { status: 500 });
    }

    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ barbershop_id: barbershopId, role: "owner" })
      .eq("id", user.id);

    if (userUpdateError) {
      console.error("[ONBOARDING_USER_LINK_FAIL]", userUpdateError);
      await supabase.from("shops").delete().eq("barbershop_id", barbershopId);
      await supabase.from("barbershops").delete().eq("id", barbershopId);
      return NextResponse.json(
        { error: "Falha ao associar barbearia ao utilizador" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      barbershopId,
      role: "owner",
    });
  } catch (error) {
    console.error("[ONBOARDING_CRITICAL_ERROR]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}