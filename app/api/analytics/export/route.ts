import { NextResponse } from "next/server";
import { requireModuleContext } from "@/services/modules/authorization";
import { PLANS } from "@/lib/stripe/constants";

function csvEscape(value: unknown) { const text = value === null || value === undefined ? "" : String(value); return `"${text.replace(/"/g, '""')}"`; }
function date(value: string | null, fallback: Date) { const parsed = value ? new Date(value) : fallback; return Number.isNaN(parsed.getTime()) ? fallback : parsed; }
function start(value: Date) { const d = new Date(value); d.setHours(0,0,0,0); return d; }
function end(value: Date) { const d = new Date(value); d.setHours(23,59,59,999); return d; }

type RowRecord = Record<string, unknown>;

function relationRecord(value: unknown): RowRecord | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" ? first as RowRecord : null;
  }
  return value && typeof value === "object" ? value as RowRecord : null;
}

export async function GET(request: Request) {
  try {
    const { admin, barbershopId, plan } = await requireModuleContext("advanced_analytics", "analytics");
    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "appointments";
    const now = new Date();
    const from = start(date(url.searchParams.get("from"), new Date(now.getTime() - 29 * 86400000)));
    const to = end(date(url.searchParams.get("to"), now));
    if (to < from || to.getTime() - from.getTime() > 366 * 86400000) return NextResponse.json({ error: "Invalid date range" }, { status: 400 });

    if (type === "clients") {
      const { data, error } = await admin.from("users").select("id,name_complete,email,num_phone,birth_date,created_at,role").eq("barbershop_id", barbershopId).eq("role", "client").order("created_at", { ascending: false }).limit(10000);
      if (error) throw error;
      const lines = [["id","name","email","phone","birth_date","created_at"], ...(data ?? []).map((row) => [row.id,row.name_complete,row.email,row.num_phone,row.birth_date,row.created_at])].map((row) => row.map(csvEscape).join(","));
      return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="silentra-clients-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv"`, "Cache-Control": "no-store" } });
    }

    if (type === "appointments") {
      const { data, error } = await admin.from("appointments").select("id,date_hour,status,manual_name,manual_email,manual_phone,value_products,payment_method,service:services(name,price),professional:professionals(name)").eq("barbershop_id", barbershopId).gte("date_hour", from.toISOString()).lte("date_hour", to.toISOString()).order("date_hour", { ascending: true }).limit(20000);
      if (error) throw error;
      const rows = data ?? [];
      const lines = [
        ["id","date_hour","status","client","email","phone","service","service_price","products","payment_method","professional"],
        ...rows.map((row: RowRecord) => {
          const service = relationRecord(row.service);
          const professional = relationRecord(row.professional);
          return [
            row.id,
            row.date_hour,
            row.status,
            row.manual_name,
            row.manual_email,
            row.manual_phone,
            service?.name,
            service?.price,
            row.value_products,
            row.payment_method,
            professional?.name,
          ];
        }),
      ].map((row) => row.map(csvEscape).join(","));
      return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="silentra-appointments-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv"`, "Cache-Control": "no-store" } });
    }

    if (type === "pos") {
      if (plan !== PLANS.ENTERPRISE) return NextResponse.json({ error: "POS export requires Enterprise." }, { status: 403 });
      const { data, error } = await admin.from("pos_transactions").select("id,created_at,subtotal,discount,total,payment_method,status,location_id,appointment_id,client_id").eq("barbershop_id", barbershopId).gte("created_at", from.toISOString()).lte("created_at", to.toISOString()).order("created_at", { ascending: true }).limit(20000);
      if (error) throw error;
      const lines = [["id","created_at","subtotal","discount","total","payment_method","status","location_id","appointment_id","client_id"], ...(data ?? []).map((row) => [row.id,row.created_at,row.subtotal,row.discount,row.total,row.payment_method,row.status,row.location_id,row.appointment_id,row.client_id])].map((row) => row.map(csvEscape).join(","));
      return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="silentra-pos-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv"`, "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ error: "Unsupported export type" }, { status: 400 });
  } catch (error) {
    console.error("[ANALYTICS_EXPORT]", error);
    return NextResponse.json({ error: "Unable to export analytics" }, { status: 500 });
  }
}