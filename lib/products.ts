export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Perfect for getting started",
    priceInCents: 999, // $9.99/month
    features: [
      "Custom business page",
      "Up to 20 products",
      "WhatsApp integration",
      "Basic analytics",
      "Mobile responsive",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    priceInCents: 2999, // $29.99/month
    features: [
      "Everything in Basic",
      "Unlimited products",
      "Instagram integration",
      "Advanced analytics",
      "Custom domain",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For established businesses",
    priceInCents: 9999, // $99.99/month
    features: [
      "Everything in Pro",
      "Multiple locations",
      "API access",
      "White-label options",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
]
