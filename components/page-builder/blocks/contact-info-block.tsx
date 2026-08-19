import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, MessageCircle, Instagram } from "lucide-react"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

export function ContactInfoBlock({ business, settings }: BlockRenderProps<"contact-info">) {
  const accentColor = business.accent_color || business.theme_color
  const hasAnyContact =
    (settings.showPhone && business.phone) ||
    (settings.showEmail && business.email) ||
    (settings.showAddress && business.address)
  const hasAnySocial = (settings.showWhatsapp && business.whatsapp_number) || (settings.showInstagram && business.instagram_handle)

  if (!hasAnyContact && !hasAnySocial) return null

  return (
    <section className="container mx-auto px-4 py-12 text-center">
      <h2 className="text-3xl font-bold mb-8">{settings.title}</h2>

      {hasAnyContact && (
        <div className="flex flex-wrap justify-center gap-6 text-sm mb-6">
          {settings.showPhone && business.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-2 hover:text-primary">
              <Phone className="h-4 w-4" /> {business.phone}
            </a>
          )}
          {settings.showEmail && business.email && (
            <a href={`mailto:${business.email}`} className="flex items-center gap-2 hover:text-primary">
              <Mail className="h-4 w-4" /> {business.email}
            </a>
          )}
          {settings.showAddress && business.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {business.address}
            </div>
          )}
        </div>
      )}

      {hasAnySocial && (
        <div className="flex justify-center gap-4">
          {settings.showWhatsapp && business.whatsapp_number && (
            <Button
              onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
          )}
          {settings.showInstagram && business.instagram_handle && (
            <Button
              onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")}
              className="bg-pink-600 hover:bg-pink-700 text-white"
              style={{ backgroundColor: accentColor }}
            >
              <Instagram className="h-4 w-4 mr-2" /> Instagram
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
