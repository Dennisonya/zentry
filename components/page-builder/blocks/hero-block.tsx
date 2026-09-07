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
    <section className="relative min-h-[72vh] overflow-hidden sm:min-h-[78vh]">
      {heroImage ? (
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: `${settings.imagePositionX}% ${settings.imagePositionY}%` }} />
      ) : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accentColor}, #111827)` }} />}
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className={`relative z-10 mx-auto flex min-h-[72vh] max-w-7xl flex-col px-5 py-20 sm:min-h-[78vh] sm:px-8 sm:py-24 lg:px-12 ${horizontalClass[settings.contentAlignment]} ${verticalClass[settings.contentVerticalAlignment]}`}>
        {settings.showLogo && business.logo_url && <img src={business.logo_url} alt={business.business_name} className="mb-6 h-14 w-14 rounded-full border border-white/30 object-cover shadow-2xl" />}
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/75">{business.business_type}</p>
        <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.04em] text-white drop-shadow-sm sm:text-6xl lg:text-8xl">{heading}</h1>
        {settings.showDescription && description && <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{description}</p>}
        <button onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })} className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5">Explore</button>
      </div>
    </section>
  )
}
