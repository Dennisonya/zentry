"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Calendar, Clock3, Instagram, Mail, MapPin, MessageCircle, Phone, ShoppingBag } from "lucide-react"
import { EnhancedOrderDialog } from "@/components/enhanced-order-dialog"
import { ServiceInquiryDialog } from "@/components/service-inquiry-dialog"
import type { Business, Product } from "../business-layouts"
import type { Service } from "./classic-card-layout"

function money(value: number) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : "0.00"
}

export function EditorialStorefrontLayout({
  business,
  products,
  services,
}: {
  business: Business
  products: Product[]
  services: Service[]
}) {
  const [category, setCategory] = useState("All")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const accent = business.accent_color || business.theme_color || "#171717"
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))], [products])
  const filteredProducts = category === "All" ? products : products.filter((p) => p.category === category)

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#171717] selection:bg-black selection:text-white">
      <nav className="fixed inset-x-0 top-0 z-40 px-4 pt-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/10 bg-[#f7f6f2]/85 px-5 py-3 shadow-sm backdrop-blur-xl">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
            {business.logo_url ? <img src={business.logo_url} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />}
            <span>{business.business_name}</span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-black/60 md:flex">
            <a href="#collection" className="transition hover:text-black">Collection</a>
            {services.length > 0 && <a href="#services" className="transition hover:text-black">Services</a>}
            <a href="#contact" className="transition hover:text-black">Contact</a>
          </div>
          <a href="#collection" className="flex items-center gap-2 rounded-full bg-[#171717] px-4 py-2 text-sm font-medium text-white transition hover:scale-[1.02]">Shop <ArrowRight className="h-4 w-4" /></a>
        </div>
      </nav>

      <section id="top" className="relative mx-auto grid min-h-[780px] max-w-[1500px] grid-cols-1 items-end gap-8 px-5 pb-12 pt-28 sm:px-8 lg:grid-cols-[1fr_1.08fr] lg:pb-20">
        <div className="relative z-10 max-w-xl pb-4 lg:pb-14">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-black/45">{business.business_type}</p>
          <h1 className="text-[clamp(4rem,9vw,8.5rem)] font-semibold leading-[.82] tracking-[-.075em]">{business.business_name}</h1>
          {business.description && <p className="mt-9 max-w-md text-base leading-7 text-black/60 sm:text-lg">{business.description}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#collection" className="rounded-full bg-[#171717] px-6 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5">Explore collection</a>
            {business.whatsapp_number && <button onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")} className="flex items-center gap-2 rounded-full border border-black/15 px-5 py-3 text-sm font-medium transition hover:bg-white"><MessageCircle className="h-4 w-4" /> WhatsApp</button>}
          </div>
        </div>
        <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] bg-black/5 lg:min-h-[650px]">
          {business.hero_image_url ? <img src={business.hero_image_url} alt={business.business_name} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, #171717)` }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white">
            <span className="text-sm tracking-wide">{products.length} products</span>
            <span className="text-xs uppercase tracking-[.2em] text-white/70">Est. locally · Zentry</span>
          </div>
        </div>
      </section>

      <section id="collection" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="mb-3 text-xs font-semibold uppercase tracking-[.25em] text-black/40">The collection</p><h2 className="text-4xl font-semibold tracking-[-.045em] sm:text-6xl">Made to be noticed.</h2></div>
          {categories.length > 1 && <div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-sm transition ${category === item ? "border-black bg-black text-white" : "border-black/10 bg-white hover:border-black/30"}`}>{item}</button>)}</div>}
        </div>
        {filteredProducts.length ? <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product, index) => <article key={product.id} className={index % 5 === 0 ? "sm:col-span-2 lg:col-span-2" : ""}>
          <button className="group block w-full text-left" onClick={() => { setSelectedProduct(product); setOrderOpen(true) }}>
            <div className={`relative overflow-hidden rounded-[1.5rem] bg-[#e9e7e1] ${index % 5 === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}>
              {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]" /> : <div className="flex h-full items-center justify-center text-black/25">No image</div>}
              {product.promotion_badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium backdrop-blur">{product.promotion_badge}</span>}
              <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100"><ShoppingBag className="h-4 w-4" /></span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4"><div><h3 className="font-medium">{product.name}</h3>{product.description && <p className="mt-1 line-clamp-2 text-sm leading-5 text-black/45">{product.description}</p>}</div><div className="whitespace-nowrap text-sm font-medium">${money(product.price)}</div></div>
          </button>
        </article>)}</div> : <p className="py-20 text-center text-black/40">Nothing here yet.</p>}
      </section>

      {services.length > 0 && <section id="services" className="border-y border-black/10 bg-white px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><div className="mb-12 max-w-xl"><p className="mb-3 text-xs font-semibold uppercase tracking-[.25em] text-black/40">Services</p><h2 className="text-4xl font-semibold tracking-[-.045em] sm:text-6xl">A little more personal.</h2></div><div className="divide-y divide-black/10">{services.map((service, i) => <button key={service.id} onClick={() => { setSelectedService(service); setServiceOpen(true) }} className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 py-7 text-left sm:grid-cols-[80px_1fr_auto_auto] sm:gap-8"><span className="text-sm text-black/30">0{i + 1}</span><div><h3 className="text-xl font-medium transition group-hover:translate-x-1 sm:text-2xl">{service.name}</h3>{service.description && <p className="mt-1 max-w-xl text-sm text-black/45">{service.description}</p>}</div>{service.duration_minutes != null && <span className="hidden items-center gap-2 text-sm text-black/45 sm:flex"><Clock3 className="h-4 w-4" /> {service.duration_minutes} min</span>}<span className="flex items-center gap-3 text-sm font-medium">${money(service.price)} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>)}</div></div></section>}

      <section id="contact" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28"><div className="rounded-[2rem] bg-[#171717] px-6 py-12 text-white sm:px-12 sm:py-16"><div className="grid gap-12 lg:grid-cols-[1fr_auto]"><div><p className="mb-4 text-xs font-semibold uppercase tracking-[.25em] text-white/40">Come say hello</p><h2 className="max-w-2xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Good things are better in person.</h2></div><div className="flex flex-col gap-4 text-sm text-white/65">{business.address && <span className="flex items-center gap-3"><MapPin className="h-4 w-4" />{business.address}</span>}{business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-3 hover:text-white"><Phone className="h-4 w-4" />{business.phone}</a>}{business.email && <a href={`mailto:${business.email}`} className="flex items-center gap-3 hover:text-white"><Mail className="h-4 w-4" />{business.email}</a>}{business.instagram_handle && <a href={`https://instagram.com/${business.instagram_handle}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white"><Instagram className="h-4 w-4" />@{business.instagram_handle}</a>}{business.whatsapp_number && <button onClick={() => window.open(`https://wa.me/${business.whatsapp_number!.replace(/[^0-9]/g, "")}`, "_blank")} className="mt-3 flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 font-medium text-black"><MessageCircle className="h-4 w-4" /> Start a conversation</button>}</div></div></div></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-black/10 px-5 py-8 text-xs text-black/40 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© {new Date().getFullYear()} {business.business_name}</span><span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Powered by Zentry</span></footer>

      {selectedProduct && <EnhancedOrderDialog open={orderOpen} onOpenChange={setOrderOpen} product={selectedProduct} businessId={business.id} businessName={business.business_name} whatsappNumber={business.whatsapp_number} instagramHandle={business.instagram_handle} />}
      <ServiceInquiryDialog open={serviceOpen} onOpenChange={setServiceOpen} businessId={business.id} businessName={business.business_name} serviceId={selectedService?.id ?? null} serviceName={selectedService?.name ?? null} whatsappNumber={business.whatsapp_number} instagramHandle={business.instagram_handle} />
    </main>
  )
}
