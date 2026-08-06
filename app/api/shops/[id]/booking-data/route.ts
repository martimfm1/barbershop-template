import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidDate, UUID_PATTERN } from "@/lib/validation";

// Converte "HH:MM" ou "HH:MM:SS" em minutos totais para facilitar comparações
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shopId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // Formato: YYYY-MM-DD

    if (!UUID_PATTERN.test(shopId) || !date || !isValidDate(date)) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Obter Barbershop_id, Horário de Funcionamento e Horário de Almoço
    const { data: shopRecord, error: shopError } = await supabase
      .from("shops")
      .select(`
        id,
        barbershop_id,
        barbershops (
          opening_time,
          closing_time,
          lunch_start,
          lunch_end
        )
      `)
      .eq("id", shopId)
      .single();

    if (shopError || !shopRecord) {
      console.error("[SHOP_FETCH_ERROR]", shopError);
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const barbershopId = shopRecord.barbershop_id;
    const relation = Array.isArray(shopRecord.barbershops)
      ? shopRecord.barbershops[0]
      : shopRecord.barbershops;

    const openTime = relation?.opening_time || "09:00:00";
    const closeTime = relation?.closing_time || "19:00:00";
    const lunchStart = relation?.lunch_start || null;
    const lunchEnd = relation?.lunch_end || null;

    // 2. Procurar Serviços da Barbearia
    let servicesData: any[] | null = null;

    if (barbershopId) {
      const resA = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", barbershopId);
      if (resA.data && resA.data.length > 0) servicesData = resA.data;
    }

    if (!servicesData || servicesData.length === 0) {
      const resB = await supabase
        .from("services")
        .select("*")
        .eq("shop_id", shopId);
      if (resB.data && resB.data.length > 0) servicesData = resB.data;
    }

    const services = (servicesData || []).map((s: any) => ({
      id: s.id,
      barbershopId: s.barbershop_id || s.shop_id || shopId,
      name: s.name || s.title || "Serviço",
      price: Number(s.price || s.cost || 0),
      durationMinutes: Number(s.duration || s.duration_minutes || 30),
    }));

    // 2.5. Procurar Profissionais (Barbeiros) na tabela 'professionals'
    let professionalsData: any[] | null = null;

    if (barbershopId) {
      const resProA = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", barbershopId);
      if (resProA.data && resProA.data.length > 0) professionalsData = resProA.data;
    }

    if (!professionalsData || professionalsData.length === 0) {
      const resProB = await supabase
        .from("professionals")
        .select("*")
        .eq("shop_id", shopId);
      if (resProB.data && resProB.data.length > 0) professionalsData = resProB.data;
    }

    const professionals = (professionalsData || []).map((p: any) => ({
      id: p.id,
      name: p.name || p.full_name || "Barbeiro",
      role: p.role || "Barbeiro Profissional",
    }));

    // 3. Obter agendamentos já marcados para esse dia
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    const { data: appointments } = await supabase
      .from("appointments")
      .select("date_hour")
      .eq("barbershop_id", barbershopId)
      .gte("date_hour", dayStart)
      .lte("date_hour", dayEnd);

    const bookedSlots = new Set(
      (appointments || []).map((a: { date_hour: string }) => {
        if (!a.date_hour) return "";
        return a.date_hour.includes("T")
          ? a.date_hour.split("T")[1].substring(0, 5)
          : a.date_hour.split(" ")[1]?.substring(0, 5) || "";
      })
    );

    // 4. Determinar a data e hora atual em Portugal
    const now = new Date();
    const todayPortugal = now.toLocaleDateString("en-CA", {
      timeZone: "Europe/Lisbon",
    });
    
    const timePortugal = now.toLocaleTimeString("pt-PT", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const isToday = date === todayPortugal;
    const currentMinutesNow = timeToMinutes(timePortugal);

    const lunchStartMinutes = lunchStart ? timeToMinutes(lunchStart) : null;
    const lunchEndMinutes = lunchEnd ? timeToMinutes(lunchEnd) : null;

    // 5. Gerar os Slots de 30 em 30 min
    const availableSlots: string[] = [];
    let [currentHour, currentMinute] = openTime.split(":").map(Number);
    const [endHour, endMinute] = closeTime.split(":").map(Number);

    const endTotalMinutes = endHour * 60 + endMinute;

    while (currentHour * 60 + currentMinute < endTotalMinutes) {
      const slotTotalMinutes = currentHour * 60 + currentMinute;
      const formattedSlot = `${String(currentHour).padStart(2, "0")}:${String(
        currentMinute
      ).padStart(2, "0")}`;

      if (isToday && slotTotalMinutes <= currentMinutesNow) {
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute -= 60;
        }
        continue;
      }

      if (
        lunchStartMinutes !== null &&
        lunchEndMinutes !== null &&
        slotTotalMinutes >= lunchStartMinutes &&
        slotTotalMinutes < lunchEndMinutes
      ) {
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute -= 60;
        }
        continue;
      }

      if (!bookedSlots.has(formattedSlot)) {
        availableSlots.push(formattedSlot);
      }

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    }

    return NextResponse.json({
      services,
      professionals, // <-- Retornado para o frontend
      availableSlots,
      isClosed: availableSlots.length === 0 && bookedSlots.size === 0,
    });
  } catch (error) {
    console.error("[BOOKING_DATA_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}