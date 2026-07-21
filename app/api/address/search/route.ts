import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const postalCode = searchParams.get("postalCode")?.trim();
  const houseNumber = searchParams.get("houseNumber")?.trim();
  const city = searchParams.get("city")?.trim();

  let searchQuery = "";

  if (postalCode && postalCode.length >= 4) {
    searchQuery = `${houseNumber ? houseNumber + " " : ""}${postalCode} ${city || ""}`.trim();
  } else if (query) {
    searchQuery = query;
  }

  if (!searchQuery || searchQuery.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const encodedQuery = encodeURIComponent(searchQuery);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&addressdetails=1&limit=5&countrycodes=pt`,
      {
        headers: {
          "User-Agent": "BarbershopApp/1.0",
          "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await response.json();

    const suggestions = data.map((item: any) => {
      const road = item.address?.road || item.address?.pedestrian || item.display_name.split(",")[0];
      const num = houseNumber || item.address?.house_number || "";
      const houseStr = num ? ` ${num}` : "";
      const detectedCity =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        city ||
        "";

      const pc = item.address?.postcode || postalCode || "";

      return {
        id: item.place_id,
        streetWithNumber: `${road}${houseStr}`.trim(),
        fullAddress: item.display_name,
        city: detectedCity,
        postalCode: pc,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[ADDRESS_SEARCH_ERROR]", error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}