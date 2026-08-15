import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/internal/platform-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin();
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() || "";

    const [
      shopsCount,
      usersCount,
      ownersCount,
      barbersCount,
      clientsCount,
      appointmentsCount,
      upcomingCount,
      activeSubscriptionsCount,
      assignmentsCount,
      shops,
      assignments,
      subscriptions,
    ] = await Promise.all([
      admin.from("barbershops").select("id", { count: "exact", head: true }),
      admin.from("users").select("id", { count: "exact", head: true }),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "owner"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "barber"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
      admin.from("appointments").select("id", { count: "exact", head: true }),
      admin.from("appointments").select("id", { count: "exact", head: true }).in("status", ["pending", "scheduled"]).gte("date_hour", new Date().toISOString()),
      admin.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
      admin.from("barbershop_plan_assignments").select("barbershop_id", { count: "exact", head: true }).or("expires_at.is.null,expires_at.gt." + new Date().toISOString()),
      query
        ? admin.from("barbershops").select("id,name,slug,created_at").or(`name.ilike.%${query}%,slug.ilike.%${query}%,id.eq.${query}`).order("created_at", { ascending: false }).limit(30)
        : admin.from("barbershops").select("id,name,slug,created_at").order("created_at", { ascending: false }).limit(30),
      admin.from("barbershop_plan_assignments").select("barbershop_id,plan,expires_at").or("expires_at.is.null,expires_at.gt." + new Date().toISOString()),
      admin.from("subscriptions").select("barbershop_id,plan,plan_override,status,updated_at").not("barbershop_id", "is", null),
    ]);

    for (const result of [shopsCount, usersCount, ownersCount, barbersCount, clientsCount, appointmentsCount, upcomingCount, activeSubscriptionsCount, assignmentsCount, shops, assignments, subscriptions]) {
      if (result.error) throw result.error;
    }

    const assignmentByShop = new Map((assignments.data ?? []).map((item) => [item.barbershop_id, item]));
    const subscriptionByShop = new Map((subscriptions.data ?? []).map((item) => [item.barbershop_id, item]));

    const effectivePlan = (shopId: string) => {
      const assignment = assignmentByShop.get(shopId);
      if (assignment) return assignment.plan as "free" | "pro" | "enterprise";
      const subscription = subscriptionByShop.get(shopId);
      if (subscription?.plan_override && ["free", "pro", "enterprise"].includes(subscription.plan_override)) {
        return subscription.plan_override as "free" | "pro" | "enterprise";
      }
      if (subscription?.plan && ["pro", "enterprise"].includes(subscription.plan) && ["active", "trialing"].includes(subscription.status)) {
        return subscription.plan as "pro" | "enterprise";
      }
      return "free" as const;
    };

    const rows = (shops.data ?? []).map((shop) => {
      const assignment = assignmentByShop.get(shop.id);
      return {
        ...shop,
        plan: effectivePlan(shop.id),
        assigned: Boolean(assignment),
        expires_at: assignment?.expires_at ?? null,
      };
    });

    const plans = rows.reduce((acc, shop) => {
      acc[shop.plan] += 1;
      return acc;
    }, { free: 0, pro: 0, enterprise: 0 });

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      stats: {
        barbershops: shopsCount.count ?? 0,
        users: usersCount.count ?? 0,
        owners: ownersCount.count ?? 0,
        barbers: barbersCount.count ?? 0,
        clients: clientsCount.count ?? 0,
        appointments: appointmentsCount.count ?? 0,
        upcomingAppointments: upcomingCount.count ?? 0,
        activeSubscriptions: activeSubscriptionsCount.count ?? 0,
        planAssignments: assignmentsCount.count ?? 0,
      },
      plans,
      recentShops: rows,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "PlatformAdminError") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[SILENTRA_ADMIN_OVERVIEW]", error);
    return NextResponse.json({ error: "Não foi possível carregar o overview interno." }, { status: 500 });
  }
}
