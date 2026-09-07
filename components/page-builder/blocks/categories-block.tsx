import { distinctCategories } from "@/lib/product-categories"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

export function CategoriesBlock({ business, products, services, settings }: BlockRenderProps<"categories">) {
  const accentColor = business.accent_color || business.theme_color
  const categories = distinctCategories([...products, ...services])

  // Gracefully disappears when there's nothing to categorize — per the
  // brief, a business with no categories shouldn't see a broken/empty nav.
  if (categories.length === 0) return null

  const targetAnchor = products.length > 0 ? "#storefront-products" : "#storefront-services"

  return (
    <section className="container mx-auto px-4 py-6">
      {settings.title && <h2 className="mb-4 text-lg font-semibold">{settings.title}</h2>}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <a
          href={targetAnchor}
          className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:text-white"
          style={{ borderColor: accentColor }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          All
        </a>
        {categories.map((category) => (
          <a
            key={category}
            href={targetAnchor}
            className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:text-white"
            style={{ borderColor: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {category}
          </a>
        ))}
      </div>
    </section>
  )
}
