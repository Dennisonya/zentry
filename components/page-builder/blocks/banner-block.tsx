import { Button } from "@/components/ui/button"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"
import { StoreImage } from "@/components/store-image"

export function BannerBlock({ business, settings }: BlockRenderProps<"banner">) {
  const accentColor = business.accent_color || business.theme_color

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="relative min-h-[320px] overflow-hidden rounded-3xl">
        {settings.mediaUrl ? (
          settings.mediaType === "video" ? (
            <video
              src={settings.mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <StoreImage src={settings.mediaUrl} alt="" sizes="(min-width: 1280px) 1280px, 100vw" className="object-cover" />
          )
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: accentColor }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="relative flex min-h-[320px] max-w-xl flex-col justify-center p-8 text-white sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{settings.heading}</h2>
          {settings.description && <p className="mt-3 max-w-md text-white/85">{settings.description}</p>}
          {settings.ctaText && (
            <Button asChild size="lg" className="mt-6 w-fit bg-white text-foreground hover:bg-white/90">
              <a href={settings.ctaLink || "#storefront-products"}>{settings.ctaText}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
