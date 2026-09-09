import type { MouseEvent } from "react"
import { distinctCategories } from "@/lib/product-categories"
import { getContrastTextColor } from "@/lib/color-contrast"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

const alignmentClass = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const

const titleAlignmentClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

export function CategoriesBlock({ business, products, services, settings }: BlockRenderProps<"categories">) {
  const accentColor = business.accent_color || business.theme_color
  const categories = distinctCategories([...products, ...services])

  // Gracefully disappears when there's nothing to categorize — per the
  // brief, a business with no categories shouldn't see a broken/empty nav.
  if (categories.length === 0) return null

  const targetAnchor = products.length > 0 ? "#storefront-products" : "#storefront-services"
  const alignment = settings.titleAlignment ?? "left"
  const hoverTextColor = getContrastTextColor(accentColor)

  const handleEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.backgroundColor = accentColor
    e.currentTarget.style.color = hoverTextColor
  }
  const handleLeave = (e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.backgroundColor = "transparent"
    e.currentTarget.style.color = ""
  }

  return (
    <section className="container mx-auto px-4 py-6">
      {settings.title && <h2 className={`mb-4 text-lg font-semibold ${titleAlignmentClass[alignment]}`}>{settings.title}</h2>}
      <div className={`flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:flex-wrap ${alignmentClass[alignment]}`}>
        <a
          href={targetAnchor}
          className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
          style={{ borderColor: accentColor }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          All
        </a>
        {categories.map((category) => (
          <a
            key={category}
            href={targetAnchor}
            className="shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: accentColor }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            {category}
          </a>
        ))}
      </div>
    </section>
  )
}
