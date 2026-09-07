"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Check, CalendarDays, TrendingUp } from "lucide-react"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"
import type { Product, Service } from "@/components/business-layouts"

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

type Entry = ({ kind: "product" } & Product) | ({ kind: "service" } & Service)

export function PopularBlock({ business, products, services, settings, onAddToCart, onBookService }: BlockRenderProps<"popular">) {
  const [addedId, setAddedId] = useState<string | null>(null)
  const accentColor = business.accent_color || business.theme_color

  // Curated pick when the business chose specific items; otherwise fall
  // back to the first N as already ordered — useful with zero setup.
  const chosenProducts = settings.productIds.length
    ? settings.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p)
    : products.slice(0, settings.maxItems)
  const chosenServices = settings.serviceIds.length
    ? settings.serviceIds.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => !!s)
    : business.business_type_mode === "services"
      ? services.slice(0, settings.maxItems)
      : []

  const entries: Entry[] = [
    ...chosenProducts.map((p) => ({ kind: "product" as const, ...p })),
    ...chosenServices.map((s) => ({ kind: "service" as const, ...s })),
  ].slice(0, settings.maxItems)

  if (entries.length === 0) return null

  const viewAllHref = entries.some((e) => e.kind === "product") ? "#storefront-products" : "#storefront-services"

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-3xl font-bold">
          <TrendingUp className="h-6 w-6" style={{ color: accentColor }} /> {settings.title}
        </h2>
        <Link href={viewAllHref} className="shrink-0 text-sm font-medium hover:underline" style={{ color: accentColor }}>
          View all
        </Link>
      </div>

      <div className="grid snap-x grid-flow-col grid-rows-1 gap-6 overflow-x-auto pb-2 sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {entries.map((entry) => (
          <Card
            key={`${entry.kind}-${entry.id}`}
            className="w-[70vw] shrink-0 snap-start overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-auto"
          >
            {entry.image_url && (
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={entry.image_url} alt={entry.name} className="h-full w-full object-cover" />
              </div>
            )}
            <CardContent className="p-4">
              <h3 className="mb-1 truncate font-semibold">{entry.name}</h3>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">${money(entry.price)}</span>
                {entry.kind === "product" ? (
                  <Button
                    size="sm"
                    style={{ backgroundColor: accentColor }}
                    onClick={() => {
                      onAddToCart(entry)
                      setAddedId(entry.id)
                      window.setTimeout(() => setAddedId((c) => (c === entry.id ? null : c)), 1200)
                    }}
                  >
                    {addedId === entry.id ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  </Button>
                ) : (
                  <Button size="sm" style={{ backgroundColor: accentColor }} onClick={() => onBookService(entry)}>
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
