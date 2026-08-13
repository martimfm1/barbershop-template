import { NextResponse } from "next/server";
import { isRecord, UUID_PATTERN } from "@/lib/validation";
import { requireTenantAuthorization } from "@/services/modules/tenant-authorization";

const APPOINTMENT_WRITE_ROLES = ["owner", "admin", "manager", "barber", "receptionist", "staff"] as const;

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantAuthorization(request, APPOINTMENT_WRITE_ROLES);
    if (!tenant.ok) {
      return NextResponse.json(
        { error: tenant.status === 401 ? "NÃ£o autenticado." : "Sem permissÃ£o para criar marcaÃ§Ãµes." },
        { status: tenant.status },
      );
    }

    const body: unknown = await request.json();
    if (!isRecord(body)) return NextResponse.json({ error: "Pedido invÃ¡lido." }, { status: 400 });
    const { shopId, serviceId, date, date_hour, clientName, clientPhone } = body;

    if (
      typeof shopId !== "string" || !UUID_PATTERN.test(shopId) ||
      typeof serviceId !== "string" || !UUID_PATTERN.test(serviceId) ||
      typeof date !== "string" || typeof date_hour !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { admin, barbershopId } = tenant;
    const { data: shop } = await admin
      .from("shops")
      .select("barbershop_id")
      .eq("id", shopId)
      .eq("barbershop_id", barbershopId)
      .single();

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const { data: service } = await admin
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const { data: appointment, error } = await admin
      .from("appointments")
      .insert({
        barbershop_id: barbershopId,
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
