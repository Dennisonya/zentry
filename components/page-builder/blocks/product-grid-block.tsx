import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { groupByCategory } from "@/lib/product-categories"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

const alignmentClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

export function ProductGridBlock({ products, settings, onOrderProduct }: BlockRenderProps<"product-grid">) {
  const groups = settings.groupByCategory ? groupByCategory(products) : [{ category: "", items: products }]

  return (
    <section className="container mx-auto px-4 py-12">
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
                  <Card key={product.id} className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    {product.image_url && (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h3 className="mb-1 text-lg font-semibold">{product.name}</h3>
                      {product.description && <p className="mb-3 text-sm text-muted-foreground">{product.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">${money(product.price)}</span>
                        <Button size="sm" onClick={() => onOrderProduct(product)}>Order</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
