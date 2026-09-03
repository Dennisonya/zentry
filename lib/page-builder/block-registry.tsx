import type { ComponentType } from "react"
import { LayoutTemplate, ShoppingBag, CalendarClock, Info, Phone } from "lucide-react"
import {
  heroSettingsSchema,
  productGridSettingsSchema,
  serviceGridSettingsSchema,
  aboutSettingsSchema,
  contactInfoSettingsSchema,
} from "@/lib/page-builder/block-schemas"
import type { BlockType, BlockSettingsMap } from "@/lib/page-builder/types"
import type { Business, Product, Service } from "@/components/business-layouts"
import { HeroBlock } from "@/components/page-builder/blocks/hero-block"
import { ProductGridBlock } from "@/components/page-builder/blocks/product-grid-block"
import { ServiceGridBlock } from "@/components/page-builder/blocks/service-grid-block"
import { AboutBlock } from "@/components/page-builder/blocks/about-block"
import { ContactInfoBlock } from "@/components/page-builder/blocks/contact-info-block"

export interface BlockRenderProps<T extends BlockType> {
  settings: BlockSettingsMap[T]
  business: Business
  products: Product[]
  services: Service[]
  onAddToCart: (product: Product) => void
  onBookService: (service: Service) => void
}

interface BlockDefinition<T extends BlockType> {
  type: T
  label: string
  icon: ComponentType<{ className?: string }>
  defaultSettings: BlockSettingsMap[T]
  Render: ComponentType<BlockRenderProps<T>>
}

export const blockRegistry: { [K in BlockType]: BlockDefinition<K> } = {
  hero: {
    type: "hero",
    label: "Hero",
    icon: LayoutTemplate,
    defaultSettings: heroSettingsSchema.parse({}),
    Render: HeroBlock,
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
  about: {
    type: "about",
    label: "About",
    icon: Info,
    defaultSettings: aboutSettingsSchema.parse({}),
    Render: AboutBlock,
  },
  "contact-info": {
    type: "contact-info",
    label: "Contact Info",
    icon: Phone,
    defaultSettings: contactInfoSettingsSchema.parse({}),
    Render: ContactInfoBlock,
  },
}

export const BLOCK_TYPES: BlockType[] = ["hero", "product-grid", "service-grid", "about", "contact-info"]
