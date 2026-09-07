import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

export function AboutBlock({ business, settings }: BlockRenderProps<"about">) {
  const body = settings.body || business.description
  const accentColor = business.accent_color || business.theme_color
  if (!body) return null

  const imageUrl = settings.imageUrl || business.hero_image_url
  const showImage = settings.alignment !== "center" && !!imageUrl
  const imageOnRight = settings.alignment === "right"

  return (
    <section id="storefront-about" className="container mx-auto px-4 py-14">
      <div
        className={`grid gap-8 overflow-hidden rounded-3xl border md:grid-cols-2 md:items-center ${
          showImage && imageOnRight ? "md:[&>*:first-child]:order-2" : ""
        }`}
      >
        {showImage ? (
          <div className="aspect-square overflow-hidden md:aspect-auto md:h-full">
            <img src={imageUrl!} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className={`p-7 sm:p-10 ${!showImage ? "mx-auto max-w-2xl text-center md:col-span-2" : ""}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Our Story</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{settings.title}</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-7 text-muted-foreground">{body}</p>
          {settings.ctaText && (
            <Button asChild className="mt-6 text-white hover:opacity-90" style={{ backgroundColor: accentColor }}>
              <a href={settings.ctaLink || "#storefront-contact"}>
                {settings.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
