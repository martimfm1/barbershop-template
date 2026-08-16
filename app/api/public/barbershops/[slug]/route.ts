import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicProfileBySlug } from "@/lib/barbershops/public-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound() {
  return NextResponse.json(
    { error: "Barbearia não encontrada." },
    { status: 404, headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) return notFound();

  const database = createAdminClient();
  const barbershopId = profile.barbershop_id ?? profile.id;

  const [{ data: services }, { data: reviews }] = await Promise.all([
    database
      .from("services")
      .select("id, name, price, duration, popular")
      .eq("barbershop_id", barbershopId)
      .order("popular", { ascending: false })
      .order("name", { ascending: true }),
    database
      .from("reviews")
      .select("id, client_name, rating, comment, created_at")
      .eq("barbershop_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const reviewItems = reviews ?? [];
  const ratingAverage = reviewItems.length
    ? Number((reviewItems.reduce((total, review) => total + Number(review.rating || 0), 0) / reviewItems.length).toFixed(1))
    : 0;

  return NextResponse.json(
    {
      data: {
        ...profile,
        services: (services ?? []).map((service) => ({
          ...service,
          popular: profile.plan !== "free" && service.popular === true,
        })),
        reviews: reviewItems,
        rating: ratingAverage,
        reviewsCount: reviewItems.length,
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
