"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CategoryFieldProps {
  value: string
  onChange: (value: string) => void
  existingCategories: string[]
  id?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Free-text category input with autocomplete suggestions drawn from the
 * business's existing product categories, so owners don't accidentally
 * fragment the storefront with near-duplicate categories ("Shoes" vs "shoe").
 * Typing a brand-new value is always allowed — this never restricts you to
 * a fixed list.
 */
export function CategoryField({
  value,
  onChange,
  existingCategories,
  id = "category",
  disabled,
  required,
}: CategoryFieldProps) {
  const listId = `${id}-suggestions`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Category {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        list={listId}
        placeholder="e.g., Man Shoes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        autoComplete="off"
      />
      <datalist id={listId}>
        {existingCategories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <p className="text-xs text-muted-foreground">
        Products with the same category are grouped together on your storefront.
      </p>
    </div>
  )
}
