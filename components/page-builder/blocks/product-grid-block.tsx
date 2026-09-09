import { ShoppingCart } from "lucide-react"
import { groupByCategory } from "@/lib/product-categories"
import { ProductCard } from "@/components/storefront/product-card"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const alignmentClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

export function ProductGridBlock({ business, products, settings, onAddToCart }: BlockRenderProps<"product-grid">) {
  const accentColor = business.accent_color || business.theme_color
  const groups = settings.groupByCategory ? groupByCategory(products) : [{ category: "", items: products }]

  return (
    <section id="storefront-products" className="container mx-auto px-4 py-12">
      <h2 className={`mb-10 text-3xl font-bold ${alignmentClass[settings.titleAlignment]}`}>{settings.title}</h2>
      {products.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No products yet — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.category || "all"}>
              {settings.groupByCategory && groups.length > 1 && (
                <h3 className="mb-6 border-b pb-2 text-xl font-semibold">{group.category}</h3>
              )}
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.items.map((product) => (
                  <ProductCard key={product.id} product={product} accentColor={accentColor} onAddToCart={onAddToCart} businessSlug={business.slug} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
