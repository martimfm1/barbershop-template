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
  manage_professionals: ["manage_professionals", "team_management", "manage_team"],
  manage_messages: ["manage_messages", "messages", "send_messages"],
};

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

  if (permission && !["admin", "owner"].includes(String(profile.role ?? "").toLowerCase())) {
    const acceptedPermissions = PERMISSION_ALIASES[permission] ?? [permission];
    const { data: grant } = await admin
      .from("staff_permissions")
      .select("allowed")
      .eq("barbershop_id", profile.barbershop_id)
      .eq("user_id", access.userId)
      .in("permission", acceptedPermissions)
      .eq("allowed", true)
      .limit(1)
      .maybeSingle();

    if (!grant?.allowed) throw new ModuleAuthorizationError("PERMISSION_DENIED");
  }

  return {
    userId: access.userId,
    barbershopId: profile.barbershop_id as string,
    role: profile.role ?? "staff",
    plan: access.plan,
    admin,
  };
}

export function moduleErrorResponse(error: unknown) {
  if (!(error instanceof ModuleAuthorizationError)) return null;
  const status = error.code === "UNAUTHORIZED" ? 401 : 403;
  return Response.json({ error: error.code }, { status });
}
