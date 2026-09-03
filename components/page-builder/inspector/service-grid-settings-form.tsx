import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BlockSettingsMap } from "@/lib/page-builder/types"
import { FieldGroup } from "@/components/page-builder/inspector/form-fields"

interface Props {
  settings: BlockSettingsMap["service-grid"]
  onChange: (settings: BlockSettingsMap["service-grid"]) => void
}

export function ServiceGridSettingsForm({ settings, onChange }: Props) {
  return (
    <FieldGroup>
      <div className="space-y-2">
        <Label htmlFor="service-grid-title">Section title</Label>
        <Input
          id="service-grid-title"
          value={settings.title}
          onChange={(e) => onChange({ ...settings, title: e.target.value })}
        />
      </div>
    </FieldGroup>
  )
}
