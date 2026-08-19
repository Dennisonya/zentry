import { Badge } from "@/components/ui/badge"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

export function HeroBlock({ business, settings }: BlockRenderProps<"hero">) {
  const accentColor = business.accent_color || business.theme_color
  const heroImage = settings.heroImageUrl || business.hero_image_url

  return (
    <section className="relative h-[60vh] flex items-center justify-center overflow-hidden rounded-b-3xl shadow-md">
      {heroImage ? (
        <img src={heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover brightness-75" />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: accentColor }} />
      )}
      <div className="relative z-10 text-center px-4">
        {settings.showLogo && business.logo_url && (
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden shadow-lg">
              <img src={business.logo_url} alt={business.business_name} className="h-full w-full object-cover" />
            </div>
          </div>
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-md">{business.business_name}</h1>
        <Badge className="bg-white/20 text-white backdrop-blur-sm mb-4">{business.business_type}</Badge>
        {settings.showDescription && business.description && (
          <p className="text-white/90 max-w-xl mx-auto text-lg">{business.description}</p>
        )}
      </div>
    </section>
  )
}
