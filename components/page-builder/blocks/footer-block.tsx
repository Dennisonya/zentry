import { Instagram, MessageCircle } from "lucide-react"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"
import { StoreImage } from "@/components/store-image"

export function FooterBlock({ business, products, services, settings }: BlockRenderProps<"footer">) {
  return (
    <footer id="storefront-contact" className="scroll-mt-24 border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            {business.logo_url && <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full"><StoreImage src={business.logo_url} alt="" sizes="36px" className="object-cover" /></span>}
            <span className="font-semibold">{business.business_name}</span>
          </div>
          {business.description && (
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{business.description}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold">Navigate</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
            {products.length > 0 && (
              <a href="#storefront-products" className="w-fit hover:text-foreground">
                Shop
              </a>
            )}
            {services.length > 0 && (
              <a href="#storefront-services" className="w-fit hover:text-foreground">
                Services
              </a>
            )}
            {business.description && (
              <a href="#storefront-about" className="w-fit hover:text-foreground">
                About
              </a>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Connect</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {business.email && (
              <a href={`mailto:${business.email}`} className="hover:text-foreground">
                {business.email}
              </a>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="hover:text-foreground">
                {business.phone}
              </a>
            )}
            {business.address && <span>{business.address}</span>}
            {settings.showSocials && (
              <div className="flex gap-2 pt-1">
                {business.instagram_handle && (
                  <a
                    href={`https://instagram.com/${business.instagram_handle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="grid h-9 w-9 place-items-center rounded-full border hover:bg-background"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {business.whatsapp_number && (
                  <a
                    href={`https://wa.me/${business.whatsapp_number.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="grid h-9 w-9 place-items-center rounded-full border hover:bg-background"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {business.business_name}. Powered by Zentry.
      </div>
    </footer>
  )
}
