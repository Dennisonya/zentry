"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { blockSettingsSchemas } from "@/lib/page-builder/block-schemas"
import type { Block, BlockType, BlockSettingsMap } from "@/lib/page-builder/types"
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
  onChange: (settings: Block["settings"]) => void
}

const textAlignClass = (value: "left" | "center" | "right") =>
  value === "left" ? "text-left" : value === "right" ? "text-right" : "text-center"

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

function AlignmentSelect({
  value,
  onChange,
}: {
  value: "left" | "center" | "right"
  onChange: (value: "left" | "center" | "right") => void
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as "left" | "center" | "right")}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="left">Left</SelectItem>
        <SelectItem value="center">Center</SelectItem>
        <SelectItem value="right">Right</SelectItem>
      </SelectContent>
    </Select>
  )
}

function ImageField({
  value,
  businessId,
  onChange,
}: {
  value: string | null
  businessId: string
  onChange: (value: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5MB or smaller.")
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
      <FieldLabel>Image</FieldLabel>
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
      {error && <p className="text-xs text-destructive">{error}</p>}
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
        <Input value={settings.heading} placeholder="Uses business name by default" onChange={(e) => onChange({ ...settings, heading: e.target.value })} />
      </div>
      <div className="space-y-2">
        <FieldLabel>Description</FieldLabel>
        <Textarea value={settings.description} placeholder="Uses business description by default" rows={4} onChange={(e) => onChange({ ...settings, description: e.target.value })} />
      </div>
      <ToggleField label="Show logo" value={settings.showLogo} onChange={(showLogo) => onChange({ ...settings, showLogo })} />
      <ToggleField label="Show description" value={settings.showDescription} onChange={(showDescription) => onChange({ ...settings, showDescription })} />
      <ImageField value={settings.heroImageUrl} businessId={businessId} onChange={(heroImageUrl) => onChange({ ...settings, heroImageUrl })} />
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

export function SettingsInspector({ block, businessId, onChange }: SettingsInspectorProps) {
  const schema = blockSettingsSchemas[block.type]
  const result = schema.safeParse(block.settings)
  if (!result.success) {
    return <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">This section has invalid settings. Reset or remove it before publishing.</div>
  }

  const update = (settings: Block["settings"]) => {
    const validated = schema.safeParse(settings)
    if (validated.success) onChange(validated.data as Block["settings"])
  }

  switch (block.type) {
    case "hero":
      return <HeroInspector settings={block.settings} businessId={businessId} onChange={(value) => update(value)} />

    case "product-grid":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Section title</FieldLabel>
            <Input value={block.settings.title} onChange={(e) => update({ ...block.settings, title: e.target.value })} />
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
            <Input value={block.settings.title} onChange={(e) => update({ ...block.settings, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Title alignment</FieldLabel>
            <AlignmentSelect value={block.settings.titleAlignment} onChange={(titleAlignment) => update({ ...block.settings, titleAlignment })} />
          </div>
        </div>
      )

    case "about":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Title</FieldLabel>
            <Input value={block.settings.title} onChange={(e) => update({ ...block.settings, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Body</FieldLabel>
            <Textarea value={block.settings.body ?? ""} rows={7} placeholder="Uses business description by default" onChange={(e) => update({ ...block.settings, body: e.target.value || null })} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Alignment</FieldLabel>
            <AlignmentSelect value={block.settings.alignment} onChange={(alignment) => update({ ...block.settings, alignment })} />
          </div>
        </div>
      )

    case "contact-info":
      return (
        <div className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Title</FieldLabel>
            <Input value={block.settings.title} onChange={(e) => update({ ...block.settings, title: e.target.value })} />
          </div>
          {([
            ["showPhone", "Show phone"],
            ["showEmail", "Show email"],
            ["showAddress", "Show address"],
            ["showWhatsapp", "Show WhatsApp"],
            ["showInstagram", "Show Instagram"],
          ] as const).map(([key, label]) => (
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
