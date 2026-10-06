import Image from "next/image"
import type { CSSProperties } from "react"
import { cn } from "@/lib/utils"

/**
 * Storefront image that fills its (position: relative) parent.
 *
 * Images uploaded to Supabase Storage go through next/image, so visitors get
 * a resized, modern-format copy sized to `sizes` instead of the full-size
 * upload. Any other URL (a pasted link from elsewhere) falls back to a plain
 * <img>, because next/image only accepts hosts listed in next.config.mjs.
 */
export function StoreImage({
  src,
  alt,
  sizes,
  className,
  style,
  priority,
}: {
  src: string
  alt: string
  /** Rendered width hint, e.g. "(min-width: 768px) 33vw, 100vw". */
  sizes: string
  className?: string
  style?: CSSProperties
  priority?: boolean
}) {
  if (isOptimizable(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} style={style} priority={priority} />
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn("absolute inset-0 h-full w-full", className)}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  )
}

/** Matches the remotePatterns entry in next.config.mjs. */
export function isOptimizable(src: string) {
  try {
    const url = new URL(src)
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    )
  } catch {
    return false
  }
}
