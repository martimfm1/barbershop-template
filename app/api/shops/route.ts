import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MarketplaceShopRecord } from "@/_types/marketplace/shops";
import { mapRecordToMarketplaceShopResponse } from "@/lib/marketplace/shop-mappers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    const supabase = await createClient();

    let dbQuery = supabase
      .from("shops")
      .select(`
        id,
        barbershop_id,
        city,
        price,
        tags,
        lat,
        lng,
        is_active,
        barbershops (
          name,
          address,
          opening_time,
          closing_time,
          slug
        )
      `)
      .eq("is_active", true);

    if (query) {
      dbQuery = dbQuery.ilike("city", `%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("[SHOPS_GET_ERROR]", error);
      return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
    }

    const records = (data as unknown as MarketplaceShopRecord[]) || [];
    const shops = records.map((record) =>
      mapRecordToMarketplaceShopResponse(record)
    );

    return NextResponse.json({ data: shops });
  } catch (err) {
    console.error("[SHOPS_INTERNAL_ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
