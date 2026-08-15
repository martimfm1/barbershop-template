import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/internal/platform-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin();
    const barbershopId = new URL(request.url).searchParams.get("barbershopId")?.trim() ?? "";
    if (!UUID_RE.test(barbershopId)) {
      return NextResponse.json({ error: "barbershopId inválido." }, { status: 400 });
    }

    const [{ data: shop, error: shopError }, { data: owner, error: ownerError }, { count: memberCount, error: memberError }, { count: todayCount, error: todayError }, { count: upcomingCount, error: upcomingError }, { count: completedCount, error: completedError }, { count: cancelledCount, error: cancelledError }, { data: assignment, error: assignmentError }, { data: subscription, error: subscriptionError }] = await Promise.all([
      admin.from("barbershops").select("id,name,slug,created_at,address,phone,email,avatar_url,opening_hours,blocked_dates").eq("id", barbershopId).maybeSingle(),
      admin.from("users").select("id,email,name_complete,role").eq("barbershop_id", barbershopId).eq("role", "owner").maybeSingle(),
      admin.from("users").select("id", { count: "exact", head: true }).eq("barbershop_id", barbershopId),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("barbershop_id", barbershopId).gte("date_hour", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()).lt("date_hour", new Date(new Date().setHours(24, 0, 0, 0)).toISOString()),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("barbershop_id", barbershopId).in("status", ["pending", "scheduled"]).gte("date_hour", new Date().toISOString()),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("barbershop_id", barbershopId).eq("status", "completed"),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("barbershop_id", barbershopId).eq("status", "cancelled"),
      admin.from("barbershop_plan_assignments").select("plan,reason,assigned_at,expires_at,assigned_by").eq("barbershop_id", barbershopId).maybeSingle(),
      admin.from("subscriptions").select("plan,plan_override,status,current_period_end,cancel_at_period_end,stripe_price_id").eq("barbershop_id", barbershopId).maybeSingle(),
    ]);

    for (const error of [shopError, ownerError, memberError, todayError, upcomingError, completedError, cancelledError, assignmentError, subscriptionError]) {
      if (error) throw error;
    }
    if (!shop) return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });

    const effectivePlan = assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now())
      ? assignment.plan
      : subscription?.plan_override ?? (["pro", "enterprise"].includes(subscription?.plan ?? "") && ["active", "trialing"].includes(subscription?.status ?? "") ? subscription?.plan : "free");

    return NextResponse.json({
      ok: true,
      shop,
      owner: owner ?? null,
      plan: {
        effective: effectivePlan,
        source: assignment && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now()) ? "admin" : subscription?.plan_override ? "subscription_override" : subscription?.status ? "stripe" : "free",
        assignment: assignment ?? null,
        subscription: subscription ?? null,
      },
      metrics: {
        members: memberCount ?? 0,
        todayAppointments: todayCount ?? 0,
        upcomingAppointments: upcomingCount ?? 0,
        completedAppointments: completedCount ?? 0,
        cancelledAppointments: cancelledCount ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "PlatformAdminError") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("[SILENTRA_ADMIN_SHOP]", error);
    return NextResponse.json({ error: "Não foi possível carregar o tenant." }, { status: 500 });
  }
}
