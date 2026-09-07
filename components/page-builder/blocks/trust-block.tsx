import { ShieldCheck } from "lucide-react"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const PRODUCT_DEFAULTS = ["Secure checkout", "Fast delivery", "Quality guaranteed", "Customer support"]
const SERVICE_DEFAULTS = ["Verified business", "Easy booking", "Flexible scheduling", "Customer support"]

export function TrustBlock({ business, settings }: BlockRenderProps<"trust">) {
  const accentColor = business.accent_color || business.theme_color
  const items =
    settings.items.length > 0
      ? settings.items
      : business.business_type_mode === "services"
        ? SERVICE_DEFAULTS
        : PRODUCT_DEFAULTS

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid gap-4 border-y py-7 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2.5 px-3 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
            <span className="text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
