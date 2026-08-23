"use client"

import { blockRegistry } from "@/lib/page-builder/block-registry"
import type { Block } from "@/lib/page-builder/types"
import { HeroSettingsForm } from "@/components/page-builder/inspector/hero-settings-form"
import { ProductGridSettingsForm } from "@/components/page-builder/inspector/product-grid-settings-form"
import { ServiceGridSettingsForm } from "@/components/page-builder/inspector/service-grid-settings-form"
import { AboutSettingsForm } from "@/components/page-builder/inspector/about-settings-form"
import { ContactInfoSettingsForm } from "@/components/page-builder/inspector/contact-info-settings-form"

interface BlockInspectorProps {
  block: Block | undefined
  onChange: (id: string, settings: Block["settings"]) => void
}

/**
 * Dispatches to the right settings form for the selected block's type.
 * Each form is typed against that block's exact settings shape (from
 * BlockSettingsMap), so there's no risk of e.g. the About form's fields
 * being applied to a Hero block's settings object.
 */
export function BlockInspector({ block, onChange }: BlockInspectorProps) {
  if (!block) {
    return <div className="text-sm text-muted-foreground text-center mt-10">Select a section to edit its settings.</div>
  }

  const label = blockRegistry[block.type]?.label ?? "Section"

  switch (block.type) {
    case "hero":
      return <HeroSettingsForm settings={block.settings} onChange={(settings) => onChange(block.id, settings)} />
    case "product-grid":
      return (
        <ProductGridSettingsForm settings={block.settings} onChange={(settings) => onChange(block.id, settings)} />
      )
    case "service-grid":
      return (
        <ServiceGridSettingsForm settings={block.settings} onChange={(settings) => onChange(block.id, settings)} />
      )
    case "about":
      return <AboutSettingsForm settings={block.settings} onChange={(settings) => onChange(block.id, settings)} />
    case "contact-info":
      return (
        <ContactInfoSettingsForm settings={block.settings} onChange={(settings) => onChange(block.id, settings)} />
      )
    default:
      return (
        <div className="text-sm text-muted-foreground text-center mt-10">
          No settings available for {label} yet.
        </div>
      )
  }
}
