import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, MessageCircle, Instagram } from "lucide-react"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const alignmentClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

const contentAlignmentClass = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const

export function ContactInfoBlock({ business, settings }: BlockRenderProps<"contact-info">) {
  const accentColor = business.accent_color || business.theme_color
  const hasAnyContact =
    (settings.showPhone && business.phone) ||
    (settings.showEmail && business.email) ||
    (settings.showAddress && business.address)
  const hasAnySocial =
    (settings.showWhatsapp && business.whatsapp_number) ||
    (settings.showInstagram && business.instagram_handle)

  if (!hasAnyContact && !hasAnySocial) return null

  return (
    <section className={`container mx-auto px-4 py-12 ${alignmentClass[settings.alignment]}`}>
      <h2 className="mb-8 text-3xl font-bold">{settings.title}</h2>

      {hasAnyContact && (
        <div className={`mb-6 flex flex-wrap gap-6 text-sm ${contentAlignmentClass[settings.alignment]}`}>
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
        <div className={`flex gap-4 ${contentAlignmentClass[settings.alignment]}`}>
          {settings.showWhatsapp && business.whatsapp_number && (
            <Button
              onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          )}
          {settings.showInstagram && business.instagram_handle && (
            <Button
              onClick={() => window.open(`https://instagram.com/${business.instagram_handle}`, "_blank")}
              className="bg-pink-600 text-white hover:bg-pink-700"
              style={{ backgroundColor: accentColor }}
            >
              <Instagram className="mr-2 h-4 w-4" /> Instagram
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
