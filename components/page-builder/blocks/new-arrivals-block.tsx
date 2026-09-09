import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/storefront/product-card"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const headerLayoutClass = {
  left: "sm:flex-row sm:items-center sm:justify-between text-left",
  center: "sm:flex-col sm:items-center text-center",
  right: "sm:flex-row sm:items-center sm:justify-end text-right",
} as const

export function NewArrivalsBlock({ business, products, settings, onAddToCart }: BlockRenderProps<"new-arrivals">) {
  const accentColor = business.accent_color || business.theme_color
  const alignment = settings.titleAlignment ?? "left"

  const latest = [...products]
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .slice(0, settings.limit)

  if (latest.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-12">
      <div className={`mb-8 flex flex-col gap-4 ${headerLayoutClass[alignment]}`}>
        <h2 className="text-4xl font-bold tracking-tight">{settings.title}</h2>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit shrink-0 rounded-full border-2 font-semibold"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          <Link href={`/${business.slug}/products`}>View all</Link>
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {latest.map((product) => (
          <ProductCard key={product.id} product={product} accentColor={accentColor} onAddToCart={onAddToCart} businessSlug={business.slug} />
        ))}
      </div>
    </section>
  )
}
