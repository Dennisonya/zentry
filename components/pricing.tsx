import { Check } from "lucide-react"
import Link from "next/link"

export function Pricing() {
  const plans = [
    {
      name: "Basic",
      price: "$10",
      description: "For getting started",
      features: [
        "Custom Business Page",
        "Up to 20 Products",
        "WhatsApp Integration",
        "Basic Analytics",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$20",
      description: "For growing businesses",
      features: [
        "Everything in Basic",
        "Unlimited Products",
        "Instagram Integration",
        "Inventory Management",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Growth",
      price: "$80",
      description: "For established businesses",
      features: [
        "Everything in pro",
        "Multiple Locations",
        "Custom domain",
        "Product Bundles",
        "Dedicated account Manager",
      ],
      cta: "Get Started",
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-[#1a1f2e]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Decorative Pricing Text */}
        <div className="text-center mb-12">
          <div className="text-6xl sm:text-8xl font-bold text-white/10 tracking-wider">
            Pricing
          </div>
          <p className="mt-4 text-white/70 max-w-xl mx-auto text-sm sm:text-base">
            Personal accounts are free. Business plans below are for storefront owners — pick one at
            signup (no payment yet) when you choose Business.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl bg-[#252a3a] p-6 sm:p-8 flex flex-col"
            >
              <div className="mb-6">
                <span className="text-xs font-medium text-[#0066FF]">
                  {plan.name}
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-white/60 text-sm">/Month</span>
                </div>
                <p className="mt-1 text-sm text-white/60">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#0066FF] shrink-0 mt-0.5" />
                    <span className="text-sm text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
