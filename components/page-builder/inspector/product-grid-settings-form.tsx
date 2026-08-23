import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BlockSettingsMap } from "@/lib/page-builder/types"
import { FieldGroup, ToggleField } from "@/components/page-builder/inspector/form-fields"

interface Props {
  settings: BlockSettingsMap["product-grid"]
  onChange: (settings: BlockSettingsMap["product-grid"]) => void
}

export function ProductGridSettingsForm({ settings, onChange }: Props) {
  return (
    <FieldGroup>
      <div className="space-y-2">
        <Label htmlFor="product-grid-title">Section title</Label>
        <Input
          id="product-grid-title"
          value={settings.title}
          onChange={(e) => onChange({ ...settings, title: e.target.value })}
        />
      </div>
      <ToggleField
        id="product-grid-group"
        label="Group by category"
        description="Products are shown under category headers instead of one flat grid."
        checked={settings.groupByCategory}
        onChange={(groupByCategory) => onChange({ ...settings, groupByCategory })}
      />
    </FieldGroup>
  )
}
