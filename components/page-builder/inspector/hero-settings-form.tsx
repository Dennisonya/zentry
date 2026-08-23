import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BlockSettingsMap } from "@/lib/page-builder/types"
import { FieldGroup, ToggleField } from "@/components/page-builder/inspector/form-fields"

interface Props {
  settings: BlockSettingsMap["hero"]
  onChange: (settings: BlockSettingsMap["hero"]) => void
}

export function HeroSettingsForm({ settings, onChange }: Props) {
  return (
    <FieldGroup>
      <ToggleField
        id="hero-show-logo"
        label="Show logo"
        checked={settings.showLogo}
        onChange={(showLogo) => onChange({ ...settings, showLogo })}
      />
      <ToggleField
        id="hero-show-description"
        label="Show description"
        checked={settings.showDescription}
        onChange={(showDescription) => onChange({ ...settings, showDescription })}
      />
      <div className="space-y-2">
        <Label htmlFor="hero-image">Hero image URL</Label>
        <Input
          id="hero-image"
          type="url"
          placeholder="Using your business hero image"
          value={settings.heroImageUrl ?? ""}
          onChange={(e) => onChange({ ...settings, heroImageUrl: e.target.value || null })}
        />
        <p className="text-xs text-muted-foreground">Leave blank to use your business's hero image.</p>
      </div>
    </FieldGroup>
  )
}
