import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { getContrastTextColor } from "@/lib/color-contrast"
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

export function ServiceGridBlock({ business, services, settings, onBookService }: BlockRenderProps<"service-grid">) {
  const accentColor = business.accent_color || business.theme_color
  if (services.length === 0) return null
  return (
    <section id="storefront-services" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Book</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{settings.title}</h2></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <article key={service.id} className="group overflow-hidden rounded-2xl border bg-background transition-shadow hover:shadow-xl">
            {service.image_url ? <div className="aspect-[4/3] overflow-hidden"><img src={service.image_url} alt={service.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div> : <div className="grid aspect-[4/3] place-items-center bg-muted"><CalendarDays className="h-8 w-8 text-muted-foreground" /></div>}
            <div className="p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-semibold">{service.name}</h3><span className="text-sm font-semibold">${money(service.price)}</span></div>{service.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>}{service.duration_minutes != null && <p className="mt-3 text-xs text-muted-foreground">{service.duration_minutes} min</p>}<Button onClick={() => onBookService(service)} style={{ backgroundColor: accentColor, color: getContrastTextColor(accentColor) }} className="mt-5 w-full rounded-full">Book service</Button></div>
          </article>
        ))}
      </div>
    </section>
  )
}
