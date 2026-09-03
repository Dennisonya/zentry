import { PLANS, isPlanId, type Plan, type PlanFeatures, type PlanId } from "@/lib/plans"

/** The subset of a business row this module needs. Works with the full Business type too. */
export interface BusinessSubscriptionFields {
  subscription_plan?: string | null
  subscription_status?: string | null
}

/** Statuses that count as "the business currently has paid access." */
const ACTIVE_STATUSES = new Set(["active", "trial"])

export function normalizePlanId(value?: string | null): PlanId {
  return isPlanId(value) ? value : "Starter"
}

export function isSubscriptionActive(business: BusinessSubscriptionFields): boolean {
  return ACTIVE_STATUSES.has(business.subscription_status || "trial")
}

/**
 * The plan that should actually govern feature access right now.
 *
 * Deliberately falls back to Starter if the subscription isn't active
 * (past_due / canceled / incomplete) even if `subscription_plan` still
 * says "Pro" — a lapsed payment should silently revoke paid features
 * immediately in the app, without waiting on a webhook or trigger to
 * clean up the plan column itself. Always check access through this
 * function rather than reading `subscription_plan` directly.
 */
export function getEffectivePlan(business: BusinessSubscriptionFields): Plan {
  if (!isSubscriptionActive(business)) return PLANS.Starter
  return PLANS[normalizePlanId(business.subscription_plan)]
}

export function hasFeature(business: BusinessSubscriptionFields, feature: keyof PlanFeatures): boolean {
  return !!getEffectivePlan(business).features[feature]
}

export function getProductLimit(business: BusinessSubscriptionFields): number | null {
  return null
}

/** True if `target` is a strictly higher tier than the business's current plan. */
export function isUpgrade(business: BusinessSubscriptionFields, target: PlanId): boolean {
  return PLANS[target].rank > PLANS[normalizePlanId(business.subscription_plan)].rank
}
