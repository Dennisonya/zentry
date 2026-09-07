"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, ShoppingBag, Menu, X, Instagram, MessageCircle, ArrowRight, Sparkles } from "lucide-react"
import type { Business, Product, Service } from "@/components/business-layouts"

interface StorefrontChromeProps {
  business: Business
  products: Product[]
  services: Service[]
  onCartOpen: () => void
  onSearchChange: (value: string) => void
  children: React.ReactNode
}

const money = (value: number) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00"
}

export function StorefrontChrome({
  business,
  products,
  services,
  onCartOpen,
  onSearchChange,
  children,
}: StorefrontChromeProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    onSearchChange(query)
  }, [query, onSearchChange])

  const categories = useMemo(() => {
    const values = [...products.map((p) => p.category), ...services.map((s) => s.category)]
    return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())))).slice(0, 8)
  }, [products, services])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const accent = business.accent_color || business.theme_color || "#111827"

  return (
    <div style={{ "--store-accent": accent } as React.CSSProperties} className="min-h-screen bg-background text-foreground">
      <div className="bg-foreground px-4 py-2 text-center text-[11px] font-medium tracking-[0.16em] text-background">
        {business.business_name} · {business.business_type}
      </div>

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled ? "bg-background/90 shadow-sm backdrop-blur-xl" : "bg-background/80 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button className="flex min-w-0 items-center gap-3" onClick={() => scrollTo("top")} aria-label="Go to top">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.business_name} className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                {business.business_name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="truncate text-sm font-semibold tracking-tight">{business.business_name}</span>
          </button>

          <nav className="hidden items-center gap-7 text-sm md:flex">
            <button onClick={() => scrollTo("products")} className="transition-opacity hover:opacity-60">Shop</button>
            {services.length > 0 && <button onClick={() => scrollTo("services")} className="transition-opacity hover:opacity-60">Services</button>}
            {business.description && <button onClick={() => scrollTo("about")} className="transition-opacity hover:opacity-60">About</button>}
            {(business.phone || business.email || business.whatsapp_number) && (
              <button onClick={() => scrollTo("contact")} className="transition-opacity hover:opacity-60">Contact</button>
            )}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={onCartOpen}
              className="relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted md:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t bg-background px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${business.business_name}...`}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && <button onClick={() => setQuery("")} className="text-xs text-muted-foreground">Clear</button>}
            </div>
          </div>
        )}

        {mobileOpen && (
          <nav className="border-t bg-background px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1 text-sm">
              <button onClick={() => scrollTo("products")} className="rounded-xl px-3 py-3 text-left hover:bg-muted">Shop</button>
              {services.length > 0 && <button onClick={() => scrollTo("services")} className="rounded-xl px-3 py-3 text-left hover:bg-muted">Services</button>}
              {business.description && <button onClick={() => scrollTo("about")} className="rounded-xl px-3 py-3 text-left hover:bg-muted">About</button>}
              <button onClick={() => scrollTo("contact")} className="rounded-xl px-3 py-3 text-left hover:bg-muted">Contact</button>
            </div>
          </nav>
        )}
      </header>

      <main id="top">
        {children}

        {categories.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button onClick={() => scrollTo("products")} className="shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted">All</button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setQuery(category)
                    scrollTo("products")
                  }}
                  className="shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted"
                >
                  {category}
                </button>
              ))}
            </div>
          </section>
        )}

        {(products.length > 0 || services.length > 0) && (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] bg-muted">
              {business.hero_image_url && <img src={business.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="relative flex min-h-[280px] max-w-xl flex-col justify-center p-8 text-white sm:p-12">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  <Sparkles className="h-3.5 w-3.5" /> Curated for you
                </div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Popular right now</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">Discover the products and services customers are loving from {business.business_name}.</p>
                <button onClick={() => scrollTo(products.length ? "products" : "services")} className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5">
                  Explore all <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}

        {business.description && (
          <section id="about" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 rounded-[2rem] border p-7 sm:p-10 md:grid-cols-[0.85fr_1.15fr] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Our story</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Made with intention.</h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">{business.description}</p>
            </div>
          </section>
        )}

        {(business.phone || business.email || business.address || business.whatsapp_number) && (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-3 border-y py-7 sm:grid-cols-3">
              <div className="rounded-2xl px-3 py-2"><p className="text-sm font-semibold">Easy to reach</p><p className="mt-1 text-xs text-muted-foreground">Connect directly with the business.</p></div>
              <div className="rounded-2xl px-3 py-2"><p className="text-sm font-semibold">Personal support</p><p className="mt-1 text-xs text-muted-foreground">Questions? Get help before you buy or book.</p></div>
              <div className="rounded-2xl px-3 py-2"><p className="text-sm font-semibold">Local business</p><p className="mt-1 text-xs text-muted-foreground">Support {business.business_name} directly.</p></div>
            </div>
          </section>
        )}

        <footer id="contact" className="scroll-mt-24 border-t bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                {business.logo_url && <img src={business.logo_url} alt="" className="h-9 w-9 rounded-full object-cover" />}
                <span className="font-semibold">{business.business_name}</span>
              </div>
              {business.description && <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">{business.description}</p>}
            </div>
            <div>
              <p className="text-sm font-semibold">Navigate</p>
              <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                <button className="w-fit hover:text-foreground" onClick={() => scrollTo("products")}>Shop</button>
                {services.length > 0 && <button className="w-fit hover:text-foreground" onClick={() => scrollTo("services")}>Services</button>}
                {business.description && <button className="w-fit hover:text-foreground" onClick={() => scrollTo("about")}>About</button>}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Connect</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                {business.email && <a href={`mailto:${business.email}`} className="hover:text-foreground">{business.email}</a>}
                {business.phone && <a href={`tel:${business.phone}`} className="hover:text-foreground">{business.phone}</a>}
                {business.address && <span>{business.address}</span>}
                <div className="flex gap-2 pt-1">
                  {business.instagram_handle && (
                    <a href={`https://instagram.com/${business.instagram_handle.replace(/^@/, "")}`} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full border hover:bg-background"><Instagram className="h-4 w-4" /></a>
                  )}
                  {business.whatsapp_number && (
                    <a href={`https://wa.me/${business.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full border hover:bg-background"><MessageCircle className="h-4 w-4" /></a>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t py-5 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {business.business_name}. Powered by Zentry.</div>
        </footer>
      </main>

      {(business.whatsapp_number || business.instagram_handle) && (
        <a
          href={business.whatsapp_number ? `https://wa.me/${business.whatsapp_number.replace(/\D/g, "")}` : `https://instagram.com/${business.instagram_handle?.replace(/^@/, "")}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border bg-background shadow-lg transition-transform hover:-translate-y-0.5"
          aria-label={business.whatsapp_number ? "Contact on WhatsApp" : "Open Instagram"}
        >
          {business.whatsapp_number ? <MessageCircle className="h-5 w-5" /> : <Instagram className="h-5 w-5" />}
        </a>
      )}
    </div>
  )
}
