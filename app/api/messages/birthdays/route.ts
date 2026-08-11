import { NextResponse } from "next/server";
import { moduleErrorResponse, requireModuleContext } from "@/services/modules/authorization";

export const runtime = "nodejs";

const DEFAULT_SUBJECT = "Feliz aniversário, {{nome}}! 🎉";
const DEFAULT_BODY = `Olá {{nome}},\n\nToda a equipa da {{barbearia}} deseja-te um excelente aniversário! 🎉\n\nEsperamos voltar a ver-te em breve.\n\nUm abraço,\n{{barbearia}}`;

function cleanTemplate(value: unknown, fallback: string, max: number) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.slice(0, max) || fallback;
}

export async function GET() {
  try {
    const { admin, barbershopId } = await requireModuleContext("automated_followups", "marketing");
    const { data, error } = await admin
      .from("birthday_email_automations")
      .select("id, enabled, subject, body, created_at, updated_at")
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      automation: data ?? {
        enabled: false,
        subject: DEFAULT_SUBJECT,
        body: DEFAULT_BODY,
      },
    });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    console.error("[Birthday Automation GET]", error);
    return NextResponse.json({ error: "Não foi possível carregar a automação de aniversários." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin, barbershopId } = await requireModuleContext("automated_followups", "marketing");
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;

    const subject = cleanTemplate(body?.subject, DEFAULT_SUBJECT, 180);
    const message = cleanTemplate(body?.body, DEFAULT_BODY, 8000);
    const enabled = body?.enabled === true;

    const { data, error } = await admin
      .from("birthday_email_automations")
      .upsert({
        barbershop_id: barbershopId,
        enabled,
        subject,
        body: message,
      }, { onConflict: "barbershop_id" })
      .select("id, enabled, subject, body, created_at, updated_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ automation: data });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    console.error("[Birthday Automation PATCH]", error);
    return NextResponse.json({ error: "Não foi possível guardar a automação de aniversários." }, { status: 500 });
  }
}
