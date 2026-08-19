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

export function ProductGridBlock({ products, settings, onOrderProduct }: BlockRenderProps<"product-grid">) {
  const groups = settings.groupByCategory ? groupByCategory(products) : [{ category: "", items: products }]

  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-center mb-10">{settings.title}</h2>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No products yet — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.category || "all"}>
              {settings.groupByCategory && groups.length > 1 && (
                <h3 className="text-xl font-semibold mb-6 pb-2 border-b">{group.category}</h3>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {group.items.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  >
                    {product.image_url && (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">${money(product.price)}</span>
                        <Button size="sm" onClick={() => onOrderProduct(product)}>
                          Order
                        </Button>
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
