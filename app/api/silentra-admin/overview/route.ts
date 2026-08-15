import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/internal/platform-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Plan = "free" | "pro" | "enterprise";
type UserShop = { id: string; barbershop_id: string | null };
type Subscription = { user_id: string; plan: string | null; plan_override: string | null; status: string; updated_at: string | null };

export async function GET(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin();
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() || "";
    const now = new Date().toISOString();

    const [shopsCount, usersCount, ownersCount, barbersCount, clientsCount, appointmentsCount, upcomingCount, activeSubscriptionsCount, assignmentsCount, allShops, shops, users, assignments, subscriptions] = await Promise.all([
      admin.from("barbershops").select("id", { count: "exact", head: true }),
      admin.from("users").select("id", { count: "exact", head: true }),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "owner"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "barber"),
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
      admin.from("appointments").select("id", { count: "exact", head: true }),
      admin.from("appointments").select("id", { count: "exact", head: true }).in("status", ["pending", "scheduled"]).gte("date_hour", now),
      admin.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
      admin.from("barbershop_plan_assignments").select("barbershop_id", { count: "exact", head: true }).or(`expires_at.is.null,expires_at.gt.${now}`),
      admin.from("barbershops").select("id"),
      query
        ? UUID_RE.test(query)
          ? admin.from("barbershops").select("id,name,slug,created_at").or(`name.ilike.%${query}%,slug.ilike.%${query}%`).eq("id", query).limit(30)
          : admin.from("barbershops").select("id,name,slug,created_at").or(`name.ilike.%${query}%,slug.ilike.%${query}%`).order("created_at", { ascending: false }).limit(30)
        : admin.from("barbershops").select("id,name,slug,created_at").order("created_at", { ascending: false }).limit(30),
      admin.from("users").select("id,barbershop_id"),
      admin.from("barbershop_plan_assignments").select("barbershop_id,plan,expires_at").or(`expires_at.is.null,expires_at.gt.${now}`),
      admin.from("subscriptions").select("user_id,plan,plan_override,status,updated_at").order("updated_at", { ascending: false }),
    ]);

    for (const result of [shopsCount, usersCount, ownersCount, barbersCount, clientsCount, appointmentsCount, upcomingCount, activeSubscriptionsCount, assignmentsCount, allShops, shops, users, assignments, subscriptions]) {
      if (result.error) throw result.error;
    }

    const userShopById = new Map<string, string>(
      ((users.data ?? []) as UserShop[]).filter((user) => user.barbershop_id).map((user) => [user.id, user.barbershop_id as string]),
    );

    const assignmentByShop = new Map((assignments.data ?? []).map((item) => [item.barbershop_id, item]));
    const subscriptionByShop = new Map<string, Subscription>();

    for (const subscription of (subscriptions.data ?? []) as Subscription[]) {
      const barbershopId = userShopById.get(subscription.user_id);
      if (!barbershopId || subscriptionByShop.has(barbershopId)) continue;
      subscriptionByShop.set(barbershopId, subscription);
    }

    const effectivePlan = (shopId: string): Plan => {
      const assignment = assignmentByShop.get(shopId);
      if (assignment) return assignment.plan as Plan;
      const subscription = subscriptionByShop.get(shopId);
      if (subscription?.plan_override && ["free", "pro", "enterprise"].includes(subscription.plan_override)) return subscription.plan_override as Plan;
      if (subscription?.plan && ["pro", "enterprise"].includes(subscription.plan) && ["active", "trialing"].includes(subscription.status)) return subscription.plan as Plan;
      return "free";
    };

    const plans = (allShops.data ?? []).reduce((acc, shop) => {
      acc[effectivePlan(shop.id)] += 1;
      return acc;
    }, { free: 0, pro: 0, enterprise: 0 });

    const rows = (shops.data ?? []).map((shop) => {
      const assignment = assignmentByShop.get(shop.id);
      return { ...shop, plan: effectivePlan(shop.id), assigned: Boolean(assignment), expires_at: assignment?.expires_at ?? null };
    });

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
    if (error instanceof Error && error.name === "PlatformAdminError") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("[SILENTRA_ADMIN_OVERVIEW]", error);
    return NextResponse.json({ error: "Não foi possível carregar o overview interno." }, { status: 500 });
  }
}
