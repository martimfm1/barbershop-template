import {
  getPlanFeatures,
  hasPlanFeature as hasPlanFeaturePure,
  type FeatureKey,
} from '@/lib/billing/plan-features';
import { PLANS, type BillingPlan } from '@/lib/stripe/constants';
import { SubscriptionService } from './subscription.service';

/**
 * Centralized feature entitlement checks.
 *
 * The backend must resolve the plan through SubscriptionService (which uses
 * Stripe sync state) — never trust a plan sent by the client.
 */
export class FeatureAccessService {
  /** Resolves the effective plan for a user. */
  static async getPlan(userId: string): Promise<BillingPlan> {
    return SubscriptionService.getAccessPlan(userId);
  }

  /** Returns the full list of feature keys the user's plan grants. */
  static async getFeatures(userId: string): Promise<readonly FeatureKey[]> {
    const plan = await this.getPlan(userId);
    return getPlanFeatures(plan);
  }

  /** Checks whether a user's plan includes a specific feature. */
  static async hasFeature(
    userId: string,
    feature: FeatureKey,
  ): Promise<boolean> {
    const plan = await this.getPlan(userId);
    return this.hasPlanFeature(plan, feature);
  }

  /** Pure check — does a given plan include this feature? */
  static hasPlanFeature(plan: BillingPlan, feature: FeatureKey): boolean {
    return hasPlanFeaturePure(plan, feature);
  }

  /**
   * Backend guard: throws if the user's plan does not include the feature.
   * Use inside API routes that serve paid features.
   */
  static async requireFeature(
    userId: string,
    feature: FeatureKey,
  ): Promise<void> {
    const plan = await this.getPlan(userId);
    if (!this.hasPlanFeature(plan, feature)) {
      throw new FeatureAccessError(feature);
    }
  }
}

export class FeatureAccessError extends Error {
  constructor(public readonly feature: FeatureKey) {
    super(`O teu plano atual não inclui esta funcionalidade: ${feature}`);
    this.name = 'FeatureAccessError';
  }
}

/** Free users always have access to Free-plan features. */
export const FREE_FEATURES = getPlanFeatures(PLANS.FREE);
