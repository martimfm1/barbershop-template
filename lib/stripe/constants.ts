export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

export const PLANS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type BillingPlan = (typeof PLANS)[keyof typeof PLANS];

const configuredPrices: Array<[BillingPlan, string | undefined]> = [
  [PLANS.PRO, process.env.STRIPE_PRICE_PRO_MONTHLY],
  [PLANS.PRO, process.env.STRIPE_PRICE_PRO_YEARLY],
  [PLANS.ENTERPRISE, process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY],
  [PLANS.ENTERPRISE, process.env.STRIPE_PRICE_ENTERPRISE_YEARLY],
] as const;

export const PRICE_ID_TO_PLAN = new Map<string, BillingPlan>();
for (const [plan, priceId] of configuredPrices) {
  if (priceId) PRICE_ID_TO_PLAN.set(priceId, plan);
}

export const TRIAL_PERIOD_DAYS = 14;

export function planForPrice(priceId: string): BillingPlan | undefined {
  return PRICE_ID_TO_PLAN.get(priceId);
}
