import { Badge } from "@/components/ui/badge"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const horizontal: Record<"left" | "center" | "right", string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
}

const vertical: Record<"top" | "center" | "bottom", string> = {
  top: "justify-start pt-12 md:pt-20",
  center: "justify-center",
  bottom: "justify-end pb-12 md:pb-20",
}

export function HeroBlock({ business, settings }: BlockRenderProps<"hero">) {
  const accentColor = business.accent_color || business.theme_color
  const heroImage = settings.heroImageUrl || business.hero_image_url
  const heading = settings.heading.trim() || business.business_name
  const description = settings.description.trim() || business.description

  return (
    <section className="relative flex h-[60vh] min-h-[420px] overflow-hidden rounded-b-3xl shadow-md">
      {heroImage ? (
        <img
          src={heroImage}
          alt="Hero"
          className="absolute inset-0 h-full w-full object-cover brightness-75"
          style={{ objectPosition: `${settings.imagePositionX}% ${settings.imagePositionY}%` }}
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: accentColor }} />
      )}

      <div className={`relative z-10 flex h-full w-full flex-col px-6 md:px-12 ${horizontal[settings.contentAlignment]} ${vertical[settings.contentVerticalAlignment]}`}>
        {settings.showLogo && business.logo_url && (
          <div className="mb-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-white/20 shadow-lg backdrop-blur-md">
              <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        <h1 className="mb-2 text-4xl font-bold text-white drop-shadow-md md:text-5xl">{heading}</h1>
        <Badge className="mb-4 w-fit bg-white/20 text-white backdrop-blur-sm">{business.business_type}</Badge>

        {settings.showDescription && description && (
          <p className={`text-lg text-white/90 ${settings.contentAlignment === "center" ? "max-w-xl" : "max-w-2xl"}`}>
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
