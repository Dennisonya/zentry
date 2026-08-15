/**
 * Canonical subscription plan definitions.
 *
 * This is the ONE place plan names, pricing, and feature flags are defined.
 * The public pricing page, the sign-up plan picker, and every feature-gating
 * check (product limits, custom store design access, etc.) all read from
 * here — so the marketing page and the actual enforcement logic can never
 * drift apart again.
 *
 * Note: `stripePriceId` is intentionally left null until the Stripe billing
 * integration is built. It'll be filled in with real Stripe Price IDs at
 * that point (read from server-side env vars in the checkout API route,
 * not baked into this shared file).
 */

export type PlanId = "Starter" | "Pro"

export interface PlanFeatures {
  /** null = unlimited */
  /** maxProducts: number | null */
  instagramIntegration: boolean
  inventoryManagement: boolean
  advancedAnalytics: boolean
  customDomain: boolean
  productBundles: boolean
 /** multipleLocations: boolean */
 /** dedicatedAccountManager: boolean */
  /** Unlocks the drag-and-drop custom storefront design builder. */
  customStoreDesign: boolean
}

export interface Plan {
  id: PlanId
  /** Rank for upgrade/downgrade comparisons — higher is a better plan. */
  rank: number
  name: string
  priceCents: number
  priceLabel: string
  description: string
  stripePriceId: string | null
  features: PlanFeatures
  /** Display bullets for the pricing page. */
  highlights: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  Starter: {
    id: "Starter",
    rank: 0,
    name: "Starter",
    priceCents: 1999,
    priceLabel: "$19.99/mo",
    description: "For getting started",
    stripePriceId: null,
    features: {
      /** maxProducts: 20, */
      instagramIntegration: false,
      inventoryManagement: true,
      advancedAnalytics: true,
      customDomain: false,
      productBundles: false,
      /** multipleLocations: false, */
      /** dedicatedAccountManager: false, */
      customStoreDesign: false,
    },
    highlights: ["free store Templates", "zentry.site domain", "Inventory Management", "Basic analytics"],
  },
  Pro: {
    id: "Pro",
    rank: 1,
    name: "Pro",
    priceCents: 4999,
    priceLabel: "$49.99/mo",
    description: "For growing businesses",
    stripePriceId: null,
    features: {
      /** maxProducts: null, */
      instagramIntegration: true,
      inventoryManagement: true,
      advancedAnalytics: true,
      customDomain: true,
      productBundles: false,
      /** multipleLocations: false, */
      /** dedicatedAccountManager: false, */
      customStoreDesign: true,
    },
    highlights: ["Everything in Basic", "Instagram integration", "Custom domain", "Custom store design builder"],
  },
  /**growth: {
    id: "growth",
    rank: 2,
    name: "Growth",
    priceCents: 8000,
    priceLabel: "$80/mo",
    description: "For established businesses",
    stripePriceId: null,
    features: {
      maxProducts: null,
      instagramIntegration: true,
      inventoryManagement: true,
      advancedAnalytics: true,
      customDomain: true,
      productBundles: true,
      multipleLocations: true,
      dedicatedAccountManager: true,
      customStoreDesign: true,
    },
    highlights: [
      "Everything in Pro",
      "Custom store design builder",
      "Multiple locations",
      "Custom domain",
      "Product bundles",
      "Dedicated account manager",
    ],
  },*/
}

export const PLAN_ORDER: PlanId[] = ["Starter", "Pro"]

export function isPlanId(value: unknown): value is PlanId {
  return value === "Starter" || value === "Pro"
}
