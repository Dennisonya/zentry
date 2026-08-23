import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>
}

export function ToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
