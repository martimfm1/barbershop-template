import type { FeatureKey } from "@/lib/billing/plan-features";
import { FeatureAccessService } from "./feature-access.service";
import { getAccessPlanForRequest } from "./plan-access.guard";

/**
 * Server-side authorization boundary for paid modules.
 * Never accept a plan from request parameters, headers or the browser.
 */
export async function requireModuleFeature(feature: FeatureKey) {
  const access = await getAccessPlanForRequest();
  if (!access.ok) return access;

  const allowed = await FeatureAccessService.hasFeature(access.userId, feature);
  if (!allowed) {
    return {
      ok: false as const,
      status: 403 as const,
      error: "FEATURE_NOT_AVAILABLE" as const,
      plan: access.plan,
      feature,
    };
  }

  return {
    ok: true as const,
    userId: access.userId,
    plan: access.plan,
  };
}
