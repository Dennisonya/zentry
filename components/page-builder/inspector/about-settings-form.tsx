import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BlockSettingsMap } from "@/lib/page-builder/types"
import { FieldGroup } from "@/components/page-builder/inspector/form-fields"

interface Props {
  settings: BlockSettingsMap["about"]
  onChange: (settings: BlockSettingsMap["about"]) => void
}

export function AboutSettingsForm({ settings, onChange }: Props) {
  return (
    <FieldGroup>
      <div className="space-y-2">
        <Label htmlFor="about-title">Section title</Label>
        <Input
          id="about-title"
          value={settings.title}
          onChange={(e) => onChange({ ...settings, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="about-body">Body text</Label>
        <Textarea
          id="about-body"
          rows={6}
          placeholder="Using your business description"
          value={settings.body ?? ""}
          onChange={(e) => onChange({ ...settings, body: e.target.value || null })}
        />
        <p className="text-xs text-muted-foreground">Leave blank to use your business description.</p>
      </div>
    </FieldGroup>
  )
}
