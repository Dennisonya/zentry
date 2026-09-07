export interface StorefrontFont {
  id: string
  label: string
  /** Google Fonts family name to load, or null for a system-font-only stack. */
  googleFont: string | null
  /** CSS font-family stack, with sensible fallbacks per style. */
  stack: string
}

// A curated set rather than free text — an open font-name field risks
// broken or unsafe values reaching page_schema. Each entry pairs a
// Google Font with a same-vibe system fallback stack.
export const STOREFRONT_FONTS: StorefrontFont[] = [
  {
    id: "inter",
    label: "Inter (Default)",
    googleFont: null,
    stack: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "poppins",
    label: "Poppins — Modern & Friendly",
    googleFont: "Poppins:wght@400;500;600;700",
    stack: "'Poppins', ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "playfair",
    label: "Playfair Display — Elegant & Editorial",
    googleFont: "Playfair+Display:wght@400;600;700",
    stack: "'Playfair Display', ui-serif, Georgia, serif",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk — Bold & Contemporary",
    googleFont: "Space+Grotesk:wght@400;500;700",
    stack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: "dm-serif",
    label: "DM Serif Display — Refined & Classic",
    googleFont: "DM+Serif+Display",
    stack: "'DM Serif Display', ui-serif, Georgia, serif",
  },
]

const FONT_MAP = new Map(STOREFRONT_FONTS.map((f) => [f.id, f]))

export function getStorefrontFont(fontId?: string | null): StorefrontFont {
  return (fontId && FONT_MAP.get(fontId)) || STOREFRONT_FONTS[0]
}

export function getFontStack(fontId?: string | null): string {
  return getStorefrontFont(fontId).stack
}

/** Google Fonts CSS2 URL for the given font, or null when no external font needs loading. */
export function getGoogleFontUrl(fontId?: string | null): string | null {
  const font = getStorefrontFont(fontId)
  if (!font.googleFont) return null
  return `https://fonts.googleapis.com/css2?family=${font.googleFont}&display=swap`
}
