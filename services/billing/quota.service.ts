import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanLimit, isUnlimited, type PlanLimitKey } from "@/lib/billing/plan-features";
import { PLANS, type BillingPlan } from "@/lib/stripe/constants";
import { SubscriptionService } from "./subscription.service";

/**
 * Resources that are gated by quantitative plan limits.
 * Mirrors {@link PlanLimitKey} so the same vocabulary is used everywhere.
 */
export type PlanResource = PlanLimitKey;

/**
 * Structured error thrown when a tenant tries to exceed a plan limit.
 * Carries everything the frontend needs to render an upgrade prompt.
 */
export class QuotaError extends Error {
  constructor(
    public readonly resource: PlanResource,
    public readonly current: number,
    public readonly limit: number,
    public readonly plan: BillingPlan,
    public readonly requiredPlan: BillingPlan,
  ) {
    super(
      `Limite atingido: ${resource} (${current}/${limit}) no plano ${plan}. Faz upgrade para ${requiredPlan}.`,
    );
    this.name = "QuotaError";
  }
}

/**
 * Returns the cheapest plan that would allow `count` units of a resource.
 * Used to tell the user which plan they need to upgrade to.
 */
export function getRequiredPlanForResource(resource: PlanResource, count: number): BillingPlan {
  if (resource === "barbers") {
    if (count <= 1) return PLANS.FREE;
    if (count <= 5) return PLANS.PRO;
    return PLANS.ENTERPRISE;
  }
  // locations: Free = 1, Pro = 1, Enterprise = unlimited
  return count <= 1 ? PLANS.FREE : PLANS.ENTERPRISE;
}

/**
 * Counts the current usage of a resource for a given barbershop/tenant.
 * Server-side only — never trusts a count sent by the client.
 */
export async function getResourceUsage(barbershopId: string, resource: PlanResource): Promise<number> {
  const admin = createAdminClient();

  if (resource === "barbers") {
    const { count, error } = await admin
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("barbershop_id", barbershopId);

    if (error) throw new Error("Não foi possível contar os profissionais.");
    return count ?? 0;
  }

  // locations are not yet modeled as a table; usage is always 0 until then.
  return 0;
}

/**
 * Resolves the tenant's plan, current usage and plan limit, then throws a
 * structured {@link QuotaError} when the limit is already reached.
 *
 * The plan is always resolved server-side from Stripe sync state — never
 * accepted from the client.
 */
export async function assertWithinPlanLimit(
  barbershopId: string,
  resource: PlanResource,
  userId: string,
): Promise<void> {
  const plan = await SubscriptionService.getAccessPlan(userId);
  const limit = getPlanLimit(plan, resource);
  if (isUnlimited(limit)) return;

  const current = await getResourceUsage(barbershopId, resource);
  if (current >= limit) {
    throw new QuotaError(resource, current, limit, plan, getRequiredPlanForResource(resource, current + 1));
  }
}