import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasModulePermission } from "@/services/modules/authorization-core";

export type TenantRole = "owner" | "admin" | "manager" | "barber" | "receptionist" | "staff";

export type TenantAuthorizationResult =
  | { ok: true; userId: string; barbershopId: string; role: TenantRole; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; status: 401 | 403 };

/**
 * Server-side tenant boundary for internal routes. Optional `permission` is
 * evaluated against the canonical Team & Permissions record after the tenant
 * and role have been resolved.
 */
export async function requireTenantAuthorization(
  request: Request,
  allowedRoles: readonly TenantRole[],
  permission?: string,
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

  if (permission && role !== "owner") {
    const granted = await hasModulePermission(admin, profile.barbershop_id, user.id, permission);
    if (!granted) return { ok: false, status: 403 };
  }

  return { ok: true, userId: user.id, barbershopId: profile.barbershop_id, role, admin };
}
