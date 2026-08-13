import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type TenantRole = "owner" | "admin" | "manager" | "barber" | "receptionist" | "staff";

export type TenantAuthorizationResult =
  | { ok: true; userId: string; barbershopId: string; role: TenantRole; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; status: 401 | 403 };

/**
 * Server-side tenant boundary for internal routes. Request identifiers must
 * always be checked against the tenant returned here, never trusted directly.
 */
export async function requireTenantAuthorization(
  request: Request,
  allowedRoles: readonly TenantRole[],
): Promise<TenantAuthorizationResult> {
  const user = await getCurrentUser(request);
  if (!user) return { ok: false, status: 401 };

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("users")
    .select("barbershop_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role ?? "").toLowerCase() as TenantRole;
  if (error || !profile?.barbershop_id || !allowedRoles.includes(role)) {
    return { ok: false, status: 403 };
  }

  return { ok: true, userId: user.id, barbershopId: profile.barbershop_id, role, admin };
}
