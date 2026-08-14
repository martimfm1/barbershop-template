import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessPlanForRequest } from "@/services/billing/plan-access.guard";
import { assertFeature } from "@/lib/billing/entitlements";
import type { FeatureKey } from "@/lib/billing/plan-features";

export class ModuleAuthorizationError extends Error {
  constructor(public readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "FEATURE_NOT_INCLUDED" | "PERMISSION_DENIED") {
    super(code);
  }
}

const PERMISSION_ALIASES: Record<string, readonly string[]> = {
  manage_professionals: ["team", "manage_professionals", "team_management", "manage_team", "professionals"],
  manage_messages: ["messages", "manage_messages", "send_messages"],
};

const ROLE_DEFAULT_PERMISSIONS: Record<string, readonly string[]> = {
  manager: ["appointments", "clients", "services", "analytics", "messages", "manage_professionals", "team"],
  barber: ["appointments", "clients", "services"],
  receptionist: ["appointments", "clients", "messages"],
};

function jsonPermissionGranted(permissions: unknown, acceptedPermissions: readonly string[]) {
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) return false;
  const record = permissions as Record<string, unknown>;
  return acceptedPermissions.some((permission) => record[permission] === true);
}

export async function requireModuleContext(feature: FeatureKey, permission?: string) {
  const access = await getAccessPlanForRequest();
  if (!access.ok) throw new ModuleAuthorizationError("UNAUTHORIZED");

  try {
    assertFeature(access.plan, feature);
  } catch {
    throw new ModuleAuthorizationError("FEATURE_NOT_INCLUDED");
  }

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("users")
    .select("id, barbershop_id, role")
    .eq("id", access.userId)
    .maybeSingle();

  if (error || !profile?.barbershop_id) throw new ModuleAuthorizationError("FORBIDDEN");

  const role = String(profile.role ?? "barber").toLowerCase();

  if (permission && !["admin", "owner"].includes(role)) {
    const rolePermissions = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
    const acceptedPermissions = PERMISSION_ALIASES[permission] ?? [permission];
    const roleAllows = acceptedPermissions.some((candidate) => rolePermissions.includes(candidate));

    if (!roleAllows) {
      let granted = false;
      const { data: staffGrant, error: staffPermissionError } = await admin
        .from("staff_permissions")
        .select("allowed")
        .eq("barbershop_id", profile.barbershop_id)
        .eq("user_id", access.userId)
        .in("permission", acceptedPermissions)
        .eq("allowed", true)
        .limit(1)
        .maybeSingle();

      if (staffPermissionError) {
        console.error("[MODULE_STAFF_PERMISSION_LOOKUP]", staffPermissionError);
      } else {
        granted = Boolean(staffGrant?.allowed);
      }

      if (!granted) {
        const { data: memberGrant, error: memberPermissionError } = await admin
          .from("barbershop_member_permissions")
          .select("permissions")
          .eq("barbershop_id", profile.barbershop_id)
          .eq("user_id", access.userId)
          .maybeSingle();

        if (memberPermissionError) {
          console.error("[MODULE_MEMBER_PERMISSION_LOOKUP]", memberPermissionError);
        } else {
          granted = jsonPermissionGranted(memberGrant?.permissions, acceptedPermissions);
        }
      }

      if (!granted) throw new ModuleAuthorizationError("PERMISSION_DENIED");
    }
  }

  return {
    userId: access.userId,
    barbershopId: profile.barbershop_id as string,
    role: profile.role ?? "barber",
    plan: access.plan,
    admin,
  };
}

export function moduleErrorResponse(error: unknown) {
  if (!(error instanceof ModuleAuthorizationError)) return null;
  const status = error.code === "UNAUTHORIZED" ? 401 : 403;
  return Response.json({ error: error.code }, { status });
}
