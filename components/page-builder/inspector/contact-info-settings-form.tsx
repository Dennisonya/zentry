import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BlockSettingsMap } from "@/lib/page-builder/types"
import { FieldGroup, ToggleField } from "@/components/page-builder/inspector/form-fields"

interface Props {
  settings: BlockSettingsMap["contact-info"]
  onChange: (settings: BlockSettingsMap["contact-info"]) => void
}

export function ContactInfoSettingsForm({ settings, onChange }: Props) {
  return (
    <FieldGroup>
      <div className="space-y-2">
        <Label htmlFor="contact-title">Section title</Label>
        <Input
          id="contact-title"
          value={settings.title}
          onChange={(e) => onChange({ ...settings, title: e.target.value })}
        />
      </div>
      <ToggleField
        id="contact-phone"
        label="Show phone"
        checked={settings.showPhone}
        onChange={(showPhone) => onChange({ ...settings, showPhone })}
      />
      <ToggleField
        id="contact-email"
        label="Show email"
        checked={settings.showEmail}
        onChange={(showEmail) => onChange({ ...settings, showEmail })}
      />
      <ToggleField
        id="contact-address"
        label="Show address"
        checked={settings.showAddress}
        onChange={(showAddress) => onChange({ ...settings, showAddress })}
      />
      <ToggleField
        id="contact-whatsapp"
        label="Show WhatsApp button"
        checked={settings.showWhatsapp}
        onChange={(showWhatsapp) => onChange({ ...settings, showWhatsapp })}
      />
      <ToggleField
        id="contact-instagram"
        label="Show Instagram button"
        checked={settings.showInstagram}
        onChange={(showInstagram) => onChange({ ...settings, showInstagram })}
      />
    </FieldGroup>
  )
}
