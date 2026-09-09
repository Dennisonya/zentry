/**
 * Picks readable black or white text for an arbitrary background color, using
 * the standard WCAG relative-luminance formula. Storefront accent colors are
 * chosen freely by business owners (including very light ones), so anywhere
 * text sits directly on an accent-colored background — with no dark image
 * scrim underneath — needs this instead of a hardcoded text-white.
 */
export function getContrastTextColor(hexColor: string | null | undefined): "#ffffff" | "#000000" {
  const hex = (hexColor || "").replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff"

  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)

  return luminance > 0.5 ? "#000000" : "#ffffff"
}
