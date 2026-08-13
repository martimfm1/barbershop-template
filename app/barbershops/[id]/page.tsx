import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export default async function LegacyBarbershopIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: shop, error } = await supabase
    .from("shops")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  if (error || !shop?.slug) {
    notFound();
  }

  redirect(`/barbershops/${encodeURIComponent(shop.slug)}`);
}
