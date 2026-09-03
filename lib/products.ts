// Subscription plan data used to live here as a standalone, unused config
// that had already drifted from the real pricing page (different names,
// different prices). It's now defined once in lib/plans.ts and re-exported
// here for backward compatibility with any existing imports.
export { PLANS as SUBSCRIPTION_PLANS_BY_ID, PLAN_ORDER, type Plan as SubscriptionPlan } from "@/lib/plans"
