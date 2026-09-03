import { Badge } from "@/components/ui/badge"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const horizontalClass = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
} as const

const verticalClass = {
  top: "justify-start",
  center: "justify-center",
  bottom: "justify-end",
} as const

export function HeroBlock({ business, settings }: BlockRenderProps<"hero">) {
  const accentColor = business.accent_color || business.theme_color
  const heroImage = settings.heroImageUrl || business.hero_image_url
  const heading = settings.heading || business.business_name
  const description = settings.description || business.description

  return (
    <section className="relative h-[60vh] overflow-hidden rounded-b-3xl shadow-md">
      {heroImage ? (
        <img src={heroImage} alt="Hero" className="absolute inset-0 h-full w-full object-cover brightness-75" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: accentColor }} />
      )}
      <div className={`relative z-10 flex h-full flex-col px-6 py-12 ${horizontalClass[settings.contentAlignment]} ${verticalClass[settings.contentVerticalAlignment]}`}>
        {settings.showLogo && business.logo_url && (
          <div className="mb-4 flex justify-center">
            <div className="h-24 w-24 overflow-hidden rounded-xl bg-white/20 backdrop-blur-md shadow-lg">
              <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
            </div>
          </div>
        )}
        <h1 className="mb-2 max-w-4xl text-4xl font-bold text-white drop-shadow-md md:text-5xl">{heading}</h1>
        <Badge className="mb-4 bg-white/20 text-white backdrop-blur-sm">{business.business_type}</Badge>
        {settings.showDescription && description && (
          <p className="max-w-xl text-lg text-white/90">{description}</p>
        )}
      </div>
    </section>
  )
}
