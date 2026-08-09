import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MARKETING_CHANNELS, isMarketingChannel } from "@/lib/marketing/campaigns";

const MAX_RECIPIENTS = 5000;

async function getStaffContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, barbershopId: null };

  const { data: profile } = await supabase
    .from("users")
    .select("barbershop_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.barbershop_id || !["admin", "owner", "staff"].includes(profile.role ?? "")) {
    return { supabase, user, barbershopId: null };
  }

  return { supabase, user, barbershopId: profile.barbershop_id };
}

export async function GET() {
  const { supabase, user, barbershopId } = await getStaffContext();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!barbershopId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .select("id,name,channel,subject,body,segment,status,scheduled_at,started_at,completed_at,created_at,updated_at")
    .eq("barbershop_id", barbershopId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Unable to load campaigns" }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(request: NextRequest) {
  const { supabase, user, barbershopId } = await getStaffContext();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!barbershopId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null) as {
    name?: unknown; channel?: unknown; subject?: unknown; body?: unknown; segment?: unknown; scheduledAt?: unknown;
  } | null;

  if (typeof body?.name !== "string" || body.name.length < 1 || body.name.length > 120) {
    return NextResponse.json({ error: "Invalid campaign name" }, { status: 400 });
  }
  if (!isMarketingChannel(body.channel)) {
    return NextResponse.json({ error: `Channel must be one of: ${MARKETING_CHANNELS.join(", ")}` }, { status: 400 });
  }
  if (typeof body.body !== "string" || body.body.length < 1 || body.body.length > 10000) {
    return NextResponse.json({ error: "Invalid campaign body" }, { status: 400 });
  }
  if (body.channel === "email" && (typeof body.subject !== "string" || body.subject.length < 1 || body.subject.length > 200)) {
    return NextResponse.json({ error: "Email subject is required" }, { status: 400 });
  }

  const { count, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("barbershop_id", barbershopId)
    .not(body.channel === "email" ? "email" : "num_phone", "is", null);

  if (countError) return NextResponse.json({ error: "Unable to validate audience" }, { status: 500 });
  if ((count ?? 0) > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `Audience exceeds the ${MAX_RECIPIENTS} recipient limit.` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      barbershop_id: barbershopId,
      created_by: user.id,
      name: body.name,
      channel: body.channel,
      subject: body.subject ?? null,
      body: body.body,
      segment: body.segment && typeof body.segment === "object" ? body.segment : {},
      status: body.scheduledAt ? "scheduled" : "draft",
      scheduled_at: body.scheduledAt ?? null,
    })
    .select("id,name,channel,subject,body,segment,status,scheduled_at,created_at")
    .single();

  if (error) return NextResponse.json({ error: "Unable to create campaign" }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
