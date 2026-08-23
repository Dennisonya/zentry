import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
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

export function ServiceGridBlock({ services, settings, onBookService }: BlockRenderProps<"service-grid">) {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className={`mb-10 text-3xl font-bold ${alignmentClass[settings.titleAlignment]}`}>{settings.title}</h2>
      {services.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No services listed yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden transition-all hover:shadow-xl">
              {service.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                </div>
              )}
              <CardContent className="p-5">
                <h3 className="mb-2 text-lg font-semibold">{service.name}</h3>
                {service.description && <p className="mb-3 text-sm text-muted-foreground">{service.description}</p>}
                {service.duration_minutes != null && (
                  <p className="mb-3 text-sm text-muted-foreground">{service.duration_minutes} min</p>
                )}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-bold">${money(service.price)}</span>
                </div>
                <Button onClick={() => onBookService(service)} className="w-full">Book Service</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
