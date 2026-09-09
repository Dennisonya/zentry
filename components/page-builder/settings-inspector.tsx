"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2, Plus, X, Search } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { blockSettingsSchemas, TEXT_LIMITS, countWords } from "@/lib/page-builder/block-schemas"
import type { Block, BlockSettingsMap } from "@/lib/page-builder/types"
import type { Product, Service } from "@/components/dashboard-content"
import { AlignmentControl } from "./alignment-control"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SettingsInspectorProps {
  block: Block
  businessId: string
  products: Product[]
  services: Service[]
  onChange: (settings: Block["settings"]) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className="text-xs font-medium">{children}</Label>
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left hover:bg-muted/50"
      aria-pressed={value}
    >
      <span className="text-sm">{label}</span>
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", value ? "bg-primary" : "bg-muted")}>
        <span
          className={cn(
            "block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
            value ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
    </button>
  )
}

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length >= max
  return (
    <p className={cn("text-right text-[11px]", over ? "text-destructive" : "text-muted-foreground")}>
      {value.length}/{max}
    </p>
  )
}

function WordCount({ value, max, label }: { value: string; max: number; label: string }) {
  const count = countWords(value)
  const over = count > max
  return (
    <p className={cn("text-right text-[11px]", over ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
      {count}/{max} words {over ? `— consider trimming your ${label}` : ""}
    </p>
  )
}

function AlignmentSelect({
  value,
  onChange,
}: {
  value: "left" | "center" | "right"
  onChange: (value: "left" | "center" | "right") => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as "left" | "center" | "right")}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="left">Left</SelectItem>
        <SelectItem value="center">Center</SelectItem>
        <SelectItem value="right">Right</SelectItem>
      </SelectContent>
    </Select>
  )
}

/** Reads a File's pixel dimensions by decoding it in a throwaway <img>. */
function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not read image dimensions."))
    }
    img.src = url
  })
}

function ImageField({
  label = "Image",
  value,
  businessId,
  onChange,
  maxWidth = 3000,
  maxHeight = 3000,
  maxSizeMB = 5,
}: {
  label?: string
  value: string | null
  businessId: string
  onChange: (value: string | null) => void
  /** Different sections reasonably allow different sizes — a hero background
   *  can be much larger than an inline About-Us image — so callers pass
   *  their own caps instead of one global constant. */
  maxWidth?: number
  maxHeight?: number
  maxSizeMB?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.")
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be ${maxSizeMB}MB or smaller.`)
      return
    }
    try {
      const { width, height } = await readImageDimensions(file)
      if (width > maxWidth || height > maxHeight) {
        setError(`Image is ${width}×${height}px — please use ${maxWidth}×${maxHeight}px or smaller.`)
        return
      }
    } catch {
      setError("That file doesn't look like a valid image.")
      return
    }

    setUploading(true)
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const path = `${user.id}/design/${businessId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from("business-logos").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("business-logos").getPublicUrl(path)

      onChange(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {value ? (
        <div className="overflow-hidden rounded-lg border">
          <img src={value} alt="" className="aspect-video w-full object-cover" />
          <div className="flex gap-2 border-t p-2">
            <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
              Replace
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} disabled={uploading}>
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          Upload image
        </Button>
      )}
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ""
        }}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Up to {maxWidth}×{maxHeight}px, {maxSizeMB}MB.
        </p>
      )}
    </div>
  )
}

function ListField({
  items,
  onChange,
  max = 4,
  maxItemLength,
}: {
  items: string[]
  onChange: (items: string[]) => void
  max?: number
  maxItemLength?: number
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={item}
            maxLength={maxItemLength}
            onChange={(e) => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
          />
          <Button type="button" size="icon" variant="ghost" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {items.length < max && (
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, ""])}>
          <Plus className="mr-2 h-4 w-4" /> Add item
        </Button>
      )}
    </div>
  )
}

function HeroInspector({
  settings,
  businessId,
  onChange,
}: {
  settings: BlockSettingsMap["hero"]
  businessId: string
  onChange: (settings: BlockSettingsMap["hero"]) => void
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <FieldLabel>Heading</FieldLabel>
        <Input
          value={settings.heading}
          placeholder="Uses business name by default"
          maxLength={TEXT_LIMITS.hero.heading.chars}
          onChange={(e) => onChange({ ...settings, heading: e.target.value })}
        />
        <CharCount value={settings.heading} max={TEXT_LIMITS.hero.heading.chars} />
        <WordCount value={settings.heading} max={TEXT_LIMITS.hero.heading.words} label="heading" />
      </div>
      <div className="space-y-2">
        <FieldLabel>Description</FieldLabel>
        <Textarea
          value={settings.description}
          placeholder="Uses business description by default"
          rows={4}
          maxLength={TEXT_LIMITS.hero.description.chars}
          onChange={(e) => onChange({ ...settings, description: e.target.value })}
        />
        <CharCount value={settings.description} max={TEXT_LIMITS.hero.description.chars} />
      </div>
      <ToggleField label="Show logo" value={settings.showLogo} onChange={(showLogo) => onChange({ ...settings, showLogo })} />
      <ToggleField label="Show description" value={settings.showDescription} onChange={(showDescription) => onChange({ ...settings, showDescription })} />
      <ImageField
        value={settings.heroImageUrl}
        businessId={businessId}
        maxWidth={2400}
        maxHeight={1600}
        maxSizeMB={5}
        onChange={(heroImageUrl) => onChange({ ...settings, heroImageUrl })}
      />
      <AlignmentControl
        value={settings.contentAlignment}
        vertical={settings.contentVerticalAlignment}
        onChange={(contentAlignment, contentVerticalAlignment) =>
          onChange({ ...settings, contentAlignment, contentVerticalAlignment })
        }
      />
    </div>
  )
}

function ItemPicker({
  products,
  services,
  selectedProductIds,
  selectedServiceIds,
  onChange,
  max,
}: {
  products: Product[]
  services: Service[]
  selectedProductIds: string[]
  selectedServiceIds: string[]
  onChange: (productIds: string[], serviceIds: string[]) => void
  max: number
}) {
  const [query, setQuery] = useState("")
  const totalSelected = selectedProductIds.length + selectedServiceIds.length
  const q = query.trim().toLowerCase()

  const filteredProducts = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products
  const filteredServices = q ? services.filter((s) => s.name.toLowerCase().includes(q)) : services

  const toggleProduct = (id: string) => {
    const next = selectedProductIds.includes(id) ? selectedProductIds.filter((i) => i !== id) : [...selectedProductIds, id]
    onChange(next, selectedServiceIds)
  }
  const toggleService = (id: string) => {
    const next = selectedServiceIds.includes(id) ? selectedServiceIds.filter((i) => i !== id) : [...selectedServiceIds, id]
    onChange(selectedProductIds, next)
  }

  const atLimit = totalSelected >= max

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FieldLabel>Choose items ({totalSelected}/{max})</FieldLabel>
        {totalSelected > 0 && (
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => onChange([], [])}>
            Clear
          </button>
        )}
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
        {filteredProducts.length === 0 && filteredServices.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">No matches.</p>
        )}
        {filteredProducts.map((p) => {
          const checked = selectedProductIds.includes(p.id)
          const disabled = !checked && atLimit
          return (
            <label
              key={p.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleProduct(p.id)} className="shrink-0" />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">${Number(p.price).toFixed(2)}</span>
            </label>
          )
        })}
        {filteredServices.map((s) => {
          const checked = selectedServiceIds.includes(s.id)
          const disabled = !checked && atLimit
          return (
            <label
              key={s.id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleService(s.id)} className="shrink-0" />
              <span className="flex-1 truncate">{s.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">${Number(s.price).toFixed(2)}</span>
            </label>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {totalSelected === 0
          ? "Nothing chosen — shows your most recent items by default."
          : `Showing your ${totalSelected} chosen item${totalSelected === 1 ? "" : "s"}.`}
      </p>
    </div>
  )
}

export function SettingsInspector({ block, businessId, products, services, onChange }: SettingsInspectorProps) {
  const schema = blockSettingsSchemas[block.type]
  const result = schema.safeParse(block.settings)
  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        This section has invalid settings. Reset or remove it before publishing.
      </div>
    )
  }

  const update = (settings: Block["settings"]) => {
    const validated = schema.safeParse(settings)
    if (validated.success) onChange(validated.data as Block["settings"])
  }

  switch (block.type) {
    case "announcement-bar":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Text</FieldLabel>
            <Input
              value={block.settings.text}
              maxLength={TEXT_LIMITS.announcementBar.text.chars}
              onChange={(e) => update({ ...block.settings, text: e.target.value })}
            />
            <CharCount value={block.settings.text} max={TEXT_LIMITS.announcementBar.text.chars} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Link (optional)</FieldLabel>
            <Input
              value={block.settings.link}
              placeholder="https://... or #storefront-products"
              onChange={(e) => update({ ...block.settings, link: e.target.value })}
            />
          </div>
        </div>
      )

    case "navbar":
      return (
        <div className="space-y-5">
          <ToggleField label="Show search" value={block.settings.showSearch} onChange={(showSearch) => update({ ...block.settings, showSearch })} />
          <ToggleField label="Show cart" value={block.settings.showCart} onChange={(showCart) => update({ ...block.settings, showCart })} />
          <p className="text-xs text-muted-foreground">
            Nav links (Shop, Services, About, Contact) show up automatically based on what your business has —
            nothing to configure there.
          </p>
        </div>
      )

    case "hero":
      return <HeroInspector settings={block.settings} businessId={businessId} onChange={(value) => update(value)} />

    case "popular":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Section title</FieldLabel>
            <Input
              value={block.settings.title}
              maxLength={TEXT_LIMITS.popular.title.chars}
              onChange={(e) => update({ ...block.settings, title: e.target.value })}
            />
            <CharCount value={block.settings.title} max={TEXT_LIMITS.popular.title.chars} />
          </div>
          <ItemPicker
            products={products}
            services={services}
            selectedProductIds={block.settings.productIds}
            selectedServiceIds={block.settings.serviceIds}
            max={block.settings.maxItems}
            onChange={(productIds, serviceIds) => update({ ...block.settings, productIds, serviceIds })}
          />
          <div className="space-y-2">
            <FieldLabel>Max items shown</FieldLabel>
            <Input
              type="number"
              min={1}
              max={12}
              value={block.settings.maxItems}
              onChange={(e) => {
                const maxItems = Math.min(12, Math.max(1, Number(e.target.value) || 1))
                update({
                  ...block.settings,
                  maxItems,
                  productIds: block.settings.productIds.slice(0, maxItems),
                  serviceIds: block.settings.serviceIds.slice(0, maxItems),
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Title alignment</FieldLabel>
            <AlignmentSelect value={block.settings.titleAlignment} onChange={(titleAlignment) => update({ ...block.settings, titleAlignment })} />
          </div>
        </div>
      )

    case "categories":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Section title</FieldLabel>
            <Input
              value={block.settings.title}
              maxLength={TEXT_LIMITS.categories.title.chars}
              onChange={(e) => update({ ...block.settings, title: e.target.value })}
            />
            <CharCount value={block.settings.title} max={TEXT_LIMITS.categories.title.chars} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Title alignment</FieldLabel>
            <AlignmentSelect value={block.settings.titleAlignment} onChange={(titleAlignment) => update({ ...block.settings, titleAlignment })} />
          </div>
          <p className="text-xs text-muted-foreground">
            Categories are pulled automatically from your products and services — add a category to an item to have
            it show up here.
          </p>
        </div>
      )

    case "product-grid":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Section title</FieldLabel>
            <Input
              value={block.settings.title}
              maxLength={TEXT_LIMITS.productGrid.title.chars}
              onChange={(e) => update({ ...block.settings, title: e.target.value })}
            />
            <CharCount value={block.settings.title} max={TEXT_LIMITS.productGrid.title.chars} />
          </div>
          <ToggleField label="Group products by category" value={block.settings.groupByCategory} onChange={(groupByCategory) => update({ ...block.settings, groupByCategory })} />
          <div className="space-y-2">
            <FieldLabel>Title alignment</FieldLabel>
            <AlignmentSelect value={block.settings.titleAlignment} onChange={(titleAlignment) => update({ ...block.settings, titleAlignment })} />
          </div>
        </div>
      )

    case "service-grid":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Section title</FieldLabel>
            <Input
              value={block.settings.title}
              maxLength={TEXT_LIMITS.serviceGrid.title.chars}
              onChange={(e) => update({ ...block.settings, title: e.target.value })}
            />
            <CharCount value={block.settings.title} max={TEXT_LIMITS.serviceGrid.title.chars} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Title alignment</FieldLabel>
            <AlignmentSelect value={block.settings.titleAlignment} onChange={(titleAlignment) => update({ ...block.settings, titleAlignment })} />
          </div>
        </div>
      )

    case "new-arrivals":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Section title</FieldLabel>
            <Input
              value={block.settings.title}
              maxLength={TEXT_LIMITS.newArrivals.title.chars}
              onChange={(e) => update({ ...block.settings, title: e.target.value })}
            />
            <CharCount value={block.settings.title} max={TEXT_LIMITS.newArrivals.title.chars} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Products to show</FieldLabel>
            <Input
              type="number"
              min={1}
              max={24}
              value={block.settings.limit}
              onChange={(e) => update({ ...block.settings, limit: Math.min(24, Math.max(1, Number(e.target.value) || 1)) })}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Title alignment</FieldLabel>
            <AlignmentSelect value={block.settings.titleAlignment} onChange={(titleAlignment) => update({ ...block.settings, titleAlignment })} />
          </div>
        </div>
      )

    case "banner":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Heading</FieldLabel>
            <Input
              value={block.settings.heading}
              maxLength={TEXT_LIMITS.banner.heading.chars}
              onChange={(e) => update({ ...block.settings, heading: e.target.value })}
            />
            <CharCount value={block.settings.heading} max={TEXT_LIMITS.banner.heading.chars} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={block.settings.description}
              rows={3}
              maxLength={TEXT_LIMITS.banner.description.chars}
              onChange={(e) => update({ ...block.settings, description: e.target.value })}
            />
            <CharCount value={block.settings.description} max={TEXT_LIMITS.banner.description.chars} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel>Button text</FieldLabel>
              <Input
                value={block.settings.ctaText}
                maxLength={TEXT_LIMITS.banner.ctaText.chars}
                onChange={(e) => update({ ...block.settings, ctaText: e.target.value })}
              />
              <CharCount value={block.settings.ctaText} max={TEXT_LIMITS.banner.ctaText.chars} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Button link</FieldLabel>
              <Input value={block.settings.ctaLink} onChange={(e) => update({ ...block.settings, ctaLink: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel>Media type</FieldLabel>
            <Select value={block.settings.mediaType} onValueChange={(v) => update({ ...block.settings, mediaType: v as "image" | "video" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video (MP4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {block.settings.mediaType === "image" ? (
            <ImageField
              label="Banner image"
              value={block.settings.mediaUrl}
              businessId={businessId}
              maxWidth={2400}
              maxHeight={1600}
              maxSizeMB={5}
              onChange={(mediaUrl) => update({ ...block.settings, mediaUrl })}
            />
          ) : (
            <div className="space-y-2">
              <FieldLabel>Video URL (.mp4)</FieldLabel>
              <Input
                value={block.settings.mediaUrl ?? ""}
                placeholder="https://.../promo.mp4"
                onChange={(e) => update({ ...block.settings, mediaUrl: e.target.value || null })}
              />
              <p className="text-xs text-muted-foreground">Plays muted and looped, no upload — paste a hosted MP4 link.</p>
            </div>
          )}
        </div>
      )

    case "about":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Title</FieldLabel>
            <Input
              value={block.settings.title}
              maxLength={TEXT_LIMITS.about.title.chars}
              onChange={(e) => update({ ...block.settings, title: e.target.value })}
            />
            <CharCount value={block.settings.title} max={TEXT_LIMITS.about.title.chars} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Body</FieldLabel>
            <Textarea
              value={block.settings.body ?? ""}
              rows={6}
              placeholder="Uses business description by default"
              maxLength={TEXT_LIMITS.about.body.chars}
              onChange={(e) => update({ ...block.settings, body: e.target.value || null })}
            />
            <CharCount value={block.settings.body ?? ""} max={TEXT_LIMITS.about.body.chars} />
            <WordCount value={block.settings.body ?? ""} max={TEXT_LIMITS.about.body.words} label="story" />
          </div>
          <ImageField
            label="Story image"
            value={block.settings.imageUrl}
            businessId={businessId}
            maxWidth={1600}
            maxHeight={1600}
            maxSizeMB={3}
            onChange={(imageUrl) => update({ ...block.settings, imageUrl })}
          />
          <div className="space-y-2">
            <FieldLabel>Image position</FieldLabel>
            <Select value={block.settings.alignment} onValueChange={(v) => update({ ...block.settings, alignment: v as "left" | "center" | "right" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Image on left</SelectItem>
                <SelectItem value="right">Image on right</SelectItem>
                <SelectItem value="center">No image, centered text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel>Button text (optional)</FieldLabel>
              <Input
                value={block.settings.ctaText}
                maxLength={TEXT_LIMITS.about.ctaText.chars}
                onChange={(e) => update({ ...block.settings, ctaText: e.target.value })}
              />
              <CharCount value={block.settings.ctaText} max={TEXT_LIMITS.about.ctaText.chars} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Button link</FieldLabel>
              <Input value={block.settings.ctaLink} onChange={(e) => update({ ...block.settings, ctaLink: e.target.value })} />
            </div>
          </div>
        </div>
      )

    case "trust":
      return (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">Leave empty to use sensible defaults for your business type. Each item: {TEXT_LIMITS.trust.item.chars} characters max.</p>
          <ListField items={block.settings.items} max={4} maxItemLength={TEXT_LIMITS.trust.item.chars} onChange={(items) => update({ ...block.settings, items })} />
        </div>
      )

    case "footer":
      return (
        <div className="space-y-5">
          <ToggleField label="Show social links" value={block.settings.showSocials} onChange={(showSocials) => update({ ...block.settings, showSocials })} />
          <p className="text-xs text-muted-foreground">
            Everything else in the footer (logo, description, contact info) comes from your business profile —
            update it in Settings.
          </p>
        </div>
      )

    case "contact-info":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Title</FieldLabel>
            <Input
              value={block.settings.title}
              maxLength={TEXT_LIMITS.contactInfo.title.chars}
              onChange={(e) => update({ ...block.settings, title: e.target.value })}
            />
            <CharCount value={block.settings.title} max={TEXT_LIMITS.contactInfo.title.chars} />
          </div>
          {(
            [
              ["showPhone", "Show phone"],
              ["showEmail", "Show email"],
              ["showAddress", "Show address"],
              ["showWhatsapp", "Show WhatsApp"],
              ["showInstagram", "Show Instagram"],
            ] as const
          ).map(([key, label]) => (
            <ToggleField key={key} label={label} value={block.settings[key]} onChange={(value) => update({ ...block.settings, [key]: value })} />
          ))}
          <div className="space-y-2">
            <FieldLabel>Alignment</FieldLabel>
            <AlignmentSelect value={block.settings.alignment} onChange={(alignment) => update({ ...block.settings, alignment })} />
          </div>
        </div>
      )
  }
}

export function validateBlockSettings(block: Block) {
  return blockSettingsSchemas[block.type].safeParse(block.settings).success
}
