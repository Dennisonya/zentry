import type { ComponentType } from "react"
import {
  Megaphone,
  Navigation,
  LayoutTemplate,
  TrendingUp,
  Tags,
  ShoppingBag,
  CalendarClock,
  Image as ImageIcon,
  Info,
  ShieldCheck,
  PanelBottom,
  Phone,
} from "lucide-react"
import {
  announcementBarSettingsSchema,
  navbarSettingsSchema,
  heroSettingsSchema,
  popularSettingsSchema,
  categoriesSettingsSchema,
  productGridSettingsSchema,
  serviceGridSettingsSchema,
  bannerSettingsSchema,
  aboutSettingsSchema,
  trustSettingsSchema,
  footerSettingsSchema,
  contactInfoSettingsSchema,
} from "@/lib/page-builder/block-schemas"
import type { BlockType, BlockSettingsMap } from "@/lib/page-builder/types"
import type { Business, Product, Service } from "@/components/business-layouts"
import { AnnouncementBarBlock } from "@/components/page-builder/blocks/announcement-bar-block"
import { NavbarBlock } from "@/components/page-builder/blocks/navbar-block"
import { HeroBlock } from "@/components/page-builder/blocks/hero-block"
import { PopularBlock } from "@/components/page-builder/blocks/popular-block"
import { CategoriesBlock } from "@/components/page-builder/blocks/categories-block"
import { ProductGridBlock } from "@/components/page-builder/blocks/product-grid-block"
import { ServiceGridBlock } from "@/components/page-builder/blocks/service-grid-block"
import { BannerBlock } from "@/components/page-builder/blocks/banner-block"
import { AboutBlock } from "@/components/page-builder/blocks/about-block"
import { TrustBlock } from "@/components/page-builder/blocks/trust-block"
import { FooterBlock } from "@/components/page-builder/blocks/footer-block"
import { ContactInfoBlock } from "@/components/page-builder/blocks/contact-info-block"

export interface BlockRenderProps<T extends BlockType> {
  settings: BlockSettingsMap[T]
  business: Business
  products: Product[]
  services: Service[]
  onAddToCart: (product: Product) => void
  onBookService: (service: Service) => void
  /** Total items currently in the storefront cart — drives the navbar's cart badge. */
  cartItemCount: number
  /** Opens the cart drawer — used by the navbar's cart icon. */
  onCartOpen: () => void
  /** Live search text — the navbar owns the input, product/service grids use it to filter. */
  onSearchChange: (value: string) => void
}

interface BlockDefinition<T extends BlockType> {
  type: T
  label: string
  icon: ComponentType<{ className?: string }>
  defaultSettings: BlockSettingsMap[T]
  Render: ComponentType<BlockRenderProps<T>>
}

// Each block's default settings come from its zod schema's own .parse({}),
// so the registry can never drift from the validation contract in
// block-schemas.ts — there's only one place that defines "what a hero
// block looks like by default."
export const blockRegistry: { [K in BlockType]: BlockDefinition<K> } = {
  "announcement-bar": {
    type: "announcement-bar",
    label: "Announcement Bar",
    icon: Megaphone,
    defaultSettings: announcementBarSettingsSchema.parse({}),
    Render: AnnouncementBarBlock,
  },
  navbar: {
    type: "navbar",
    label: "Navbar",
    icon: Navigation,
    defaultSettings: navbarSettingsSchema.parse({}),
    Render: NavbarBlock,
  },
  hero: {
    type: "hero",
    label: "Hero",
    icon: LayoutTemplate,
    defaultSettings: heroSettingsSchema.parse({}),
    Render: HeroBlock,
  },
  popular: {
    type: "popular",
    label: "Popular / Trending",
    icon: TrendingUp,
    defaultSettings: popularSettingsSchema.parse({}),
    Render: PopularBlock,
  },
  categories: {
    type: "categories",
    label: "Categories",
    icon: Tags,
    defaultSettings: categoriesSettingsSchema.parse({}),
    Render: CategoriesBlock,
  },
  "product-grid": {
    type: "product-grid",
    label: "Products",
    icon: ShoppingBag,
    defaultSettings: productGridSettingsSchema.parse({}),
    Render: ProductGridBlock,
  },
  "service-grid": {
    type: "service-grid",
    label: "Services",
    icon: CalendarClock,
    defaultSettings: serviceGridSettingsSchema.parse({}),
    Render: ServiceGridBlock,
  },
  banner: {
    type: "banner",
    label: "Promotional Banner",
    icon: ImageIcon,
    defaultSettings: bannerSettingsSchema.parse({}),
    Render: BannerBlock,
  },
  about: {
    type: "about",
    label: "About / Story",
    icon: Info,
    defaultSettings: aboutSettingsSchema.parse({}),
    Render: AboutBlock,
  },
  trust: {
    type: "trust",
    label: "Trust Section",
    icon: ShieldCheck,
    defaultSettings: trustSettingsSchema.parse({}),
    Render: TrustBlock,
  },
  footer: {
    type: "footer",
    label: "Footer",
    icon: PanelBottom,
    defaultSettings: footerSettingsSchema.parse({}),
    Render: FooterBlock,
  },
  "contact-info": {
    type: "contact-info",
    label: "Contact Info",
    icon: Phone,
    defaultSettings: contactInfoSettingsSchema.parse({}),
    Render: ContactInfoBlock,
  },
}

// Matches the requested storefront structure: Announcement, Navbar, Hero,
// Popular/Trending, Categories, Products/Services, Banner, About, Trust,
// Footer. Contact Info stays available via Add Section for businesses
// that want a dedicated contact page section, but isn't auto-included —
// contact details already live in the Footer by default.
export const BLOCK_TYPES: BlockType[] = [
  "announcement-bar",
  "navbar",
  "hero",
  "popular",
  "categories",
  "product-grid",
  "service-grid",
  "banner",
  "about",
  "trust",
  "footer",
]

export const ALL_BLOCK_TYPES: BlockType[] = [...BLOCK_TYPES, "contact-info"]
