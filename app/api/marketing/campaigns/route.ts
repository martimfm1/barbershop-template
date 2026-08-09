import { NextRequest, NextResponse } from "next/server";
import { MARKETING_CHANNELS, isMarketingChannel } from "@/lib/marketing/campaigns";
import { moduleErrorResponse, requireModuleContext } from "@/services/modules/authorization";

const MAX_RECIPIENTS = 5000;

export async function GET() {
  try {
    const { admin, barbershopId } = await requireModuleContext("marketing_campaigns", "marketing");
    const { data, error } = await admin.from("marketing_campaigns").select("id,name,channel,subject,body,segment,status,scheduled_at,started_at,completed_at,created_at,updated_at").eq("barbershop_id", barbershopId).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ campaigns: data ?? [] });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "Unable to load campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, userId, barbershopId } = await requireModuleContext("marketing_campaigns", "marketing");
    const body = await request.json().catch(() => null) as { name?: unknown; channel?: unknown; subject?: unknown; body?: unknown; segment?: unknown; scheduledAt?: unknown } | null;
    if (typeof body?.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 120) return NextResponse.json({ error: "Invalid campaign name" }, { status: 400 });
    if (!isMarketingChannel(body.channel)) return NextResponse.json({ error: `Channel must be one of: ${MARKETING_CHANNELS.join(", ")}` }, { status: 400 });
    if (typeof body.body !== "string" || body.body.trim().length < 1 || body.body.length > 10000) return NextResponse.json({ error: "Invalid campaign body" }, { status: 400 });
    if (body.channel === "email" && (typeof body.subject !== "string" || body.subject.trim().length < 1 || body.subject.length > 200)) return NextResponse.json({ error: "Email subject is required" }, { status: 400 });

    const recipientField = body.channel === "email" ? "email" : "num_phone";
    const { count, error: countError } = await admin.from("users").select("id", { count: "exact", head: true }).eq("barbershop_id", barbershopId).eq("role", "client").not(recipientField, "is", null);
    if (countError) throw countError;
    if ((count ?? 0) > MAX_RECIPIENTS) return NextResponse.json({ error: `Audience exceeds the ${MAX_RECIPIENTS} recipient limit.` }, { status: 400 });

    const { data, error } = await admin.from("marketing_campaigns").insert({ barbershop_id: barbershopId, created_by: userId, name: body.name.trim(), channel: body.channel, subject: body.subject ?? null, body: body.body, segment: body.segment && typeof body.segment === "object" && !Array.isArray(body.segment) ? body.segment : {}, status: body.scheduledAt ? "scheduled" : "draft", scheduled_at: typeof body.scheduledAt === "string" ? body.scheduledAt : null }).select("id,name,channel,subject,body,segment,status,scheduled_at,created_at").single();
    if (error) throw error;
    return NextResponse.json({ campaign: data }, { status: 201 });
  } catch (error) {
    const response = moduleErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "Unable to create campaign" }, { status: 500 });
  }
}
