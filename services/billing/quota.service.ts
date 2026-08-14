import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanLimit, isUnlimited, type PlanLimitKey } from "@/lib/billing/plan-features";
import { PLANS, type BillingPlan } from "@/lib/stripe/constants";
import { SubscriptionService } from "./subscription.service";

/** Resources that are gated by quantitative plan limits. */
export type PlanResource = PlanLimitKey;

export class QuotaError extends Error {
  constructor(
    public readonly resource: PlanResource,
    public readonly current: number,
    public readonly limit: number,
    public readonly plan: BillingPlan,
    public readonly requiredPlan: BillingPlan,
  ) {
    super(`Limite atingido: ${resource} (${current}/${limit}) no plano ${plan}. Faz upgrade para ${requiredPlan}.`);
    this.name = "QuotaError";
  }
}

export function getRequiredPlanForResource(resource: PlanResource, count: number): BillingPlan {
  if (resource === "barbers") {
    if (count <= 1) return PLANS.FREE;
    if (count <= 5) return PLANS.PRO;
    return PLANS.ENTERPRISE;
  }
  return count <= 1 ? PLANS.FREE : PLANS.ENTERPRISE;
}

/** Counts active resources for the tenant. */
export async function getResourceUsage(barbershopId: string, resource: PlanResource): Promise<number> {
  const admin = createAdminClient();

  if (resource === "barbers") {
    const { count, error } = await admin
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId)
      .eq("active", true);

    if (error) throw new Error("Não foi possível contar os profissionais.");
    return count ?? 0;
  }

  return 0;
}

/**
 * Plan quotas are tenant-scoped. userId is retained for API compatibility but
 * is intentionally not used to resolve the plan.
 */
export async function assertWithinPlanLimit(
  barbershopId: string,
  resource: PlanResource,
  _userId?: string,
): Promise<void> {
  const plan = await SubscriptionService.getAccessPlanForBarbershop(barbershopId);
  const limit = getPlanLimit(plan, resource);
  if (isUnlimited(limit)) return;

  const current = await getResourceUsage(barbershopId, resource);
  if (current >= limit) {
    throw new QuotaError(resource, current, limit, plan, getRequiredPlanForResource(resource, current + 1));
  }
}
