"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Heart, ShoppingBag, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { getContrastTextColor } from "@/lib/color-contrast"
import type { BlockRenderProps } from "@/lib/page-builder/block-registry"

interface NavLink {
  label: string
  href: string
}

export function NavbarBlock({
  business,
  products,
  services,
  settings,
  cartItemCount,
  onCartOpen,
  onSearchChange,
}: BlockRenderProps<"navbar">) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const accentColor = business.accent_color || business.theme_color

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    onSearchChange(query)
  }, [query, onSearchChange])

  const hasContactInfo = !!(business.phone || business.email || business.address || business.whatsapp_number)

  const links: NavLink[] = [
    products.length > 0 ? { label: "Shop", href: "#storefront-products" } : null,
    services.length > 0 ? { label: "Services", href: "#storefront-services" } : null,
    business.description ? { label: "About", href: "#storefront-about" } : null,
    hasContactInfo ? { label: "Contact", href: "#storefront-contact" } : null,
  ].filter((l): l is NavLink => l !== null)

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors ${
        scrolled ? "border-border bg-background/95 shadow-sm backdrop-blur-sm" : "border-transparent bg-background"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <button className="shrink-0 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        <a href="#" className="flex shrink-0 items-center gap-2 font-bold">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.business_name} className="h-9 w-9 rounded-lg object-cover" />
          ) : null}
          <span className="truncate">{business.business_name}</span>
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-foreground/70 hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {settings.showSearch && (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
                <Search className="h-[18px] w-[18px]" />
              </Button>
              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,90vw)] rounded-xl border bg-background p-3 shadow-lg">
                  <Input
                    autoFocus
                    placeholder="Search products & services..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">Filters the sections below as you type.</p>
                </div>
              )}
            </div>
          )}

          <Button variant="ghost" size="icon" asChild aria-label="Favorites">
            <Link href="/account/favorites">
              <Heart className="h-[18px] w-[18px]" />
            </Link>
          </Button>

          {settings.showCart && (
            <Button variant="ghost" size="icon" className="relative" onClick={onCartOpen} aria-label="Cart">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartItemCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: accentColor, color: getContrastTextColor(accentColor) }}
                >
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72">
          <SheetTitle className="flex items-center justify-between">
            {business.business_name}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <nav className="mt-6 flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
