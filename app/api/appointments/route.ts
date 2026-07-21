import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopId, serviceId, date, date_hour, clientName, clientPhone } = body;

    if (!shopId || !serviceId || !date || !date_hour) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar o barbershop_id correspondente
    const { data: shop } = await supabase
      .from("shops")
      .select("barbershop_id")
      .eq("id", shopId)
      .single();

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Inserir agendamento
    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        barbershop_id: shop.barbershop_id,
        service_id: serviceId,
        date,
        date_hour: `${date_hour}:00`,
        client_name: clientName || "Cliente Marketplace",
        client_phone: clientPhone || "",
        status: "confirmed",
      })
      .select()
      .single();

    if (error) {
      console.error("[APPOINTMENT_CREATE_ERROR]", error);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("[APPOINTMENT_INTERNAL_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}