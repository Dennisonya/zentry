"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Check, CalendarDays } from "lucide-react"
import { getContrastTextColor } from "@/lib/color-contrast"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"
import type { Product, Service } from "@/components/business-layouts"
import { StoreImage } from "@/components/store-image"
import { StockBadge } from "@/components/storefront/product-card"
import { getStorefrontStock } from "@/lib/product-categories"

function money(n: number) {
  const x = Number(n)
  return Number.isFinite(x) ? x.toFixed(2) : "0.00"
}

type Entry = ({ kind: "product" } & Product) | ({ kind: "service" } & Service)

const headerLayoutClass = {
  left: "sm:flex-row sm:items-center sm:justify-between text-left",
  center: "sm:flex-col sm:items-center text-center",
  right: "sm:flex-row sm:items-center sm:justify-end text-right",
} as const

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

  const viewAllHref = entries.some((e) => e.kind === "product") ? `/${business.slug}/products` : `/${business.slug}/services`
  const alignment = settings.titleAlignment ?? "left"
  const buttonTextColor = getContrastTextColor(accentColor)

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
          <Link href={viewAllHref}>View all</Link>
        </Button>
      </div>

      <div className="grid snap-x grid-flow-col grid-rows-1 gap-6 overflow-x-auto pb-2 sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {entries.map((entry) => (
          <Card
            key={`${entry.kind}-${entry.id}`}
            className="w-[70vw] shrink-0 snap-start overflow-hidden border-border/60 shadow-none transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:w-auto"
          >
            {entry.image_url && (
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted">
                <StoreImage src={entry.image_url} alt={entry.name} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 70vw" className={`object-contain ${entry.kind === "product" && getStorefrontStock(entry).status === "out" ? "opacity-50 grayscale" : ""}`} />
                {entry.kind === "product" && (
                  <StockBadge status={getStorefrontStock(entry).status} remaining={getStorefrontStock(entry).remaining} hasVariants={!!entry.has_variants} />
                )}
              </div>
            )}
            <CardContent className="p-4">
              <h3 className="mb-1 truncate font-semibold">{entry.name}</h3>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">${money(entry.price)}</span>
                {entry.kind === "product" && getStorefrontStock(entry).status === "out" ? (
                  <Button size="sm" variant="outline" disabled>
                    Sold out
                  </Button>
                ) : entry.kind === "product" && entry.has_variants ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${business.slug}/products/${entry.id}`}>Select</Link>
                  </Button>
                ) : entry.kind === "product" ? (
                  <Button
                    size="sm"
                    style={{ backgroundColor: accentColor, color: buttonTextColor }}
                    onClick={() => {
                      if (onAddToCart(entry) === false) return
                      setAddedId(entry.id)
                      window.setTimeout(() => setAddedId((c) => (c === entry.id ? null : c)), 1200)
                    }}
                  >
                    {addedId === entry.id ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                  </Button>
                ) : (
                  <Button size="sm" style={{ backgroundColor: accentColor, color: buttonTextColor }} onClick={() => onBookService(entry)}>
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
