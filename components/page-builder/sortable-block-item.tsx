"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Eye, EyeOff, Trash2 } from "lucide-react"
import type { Block } from "@/lib/page-builder/types"
import { blockRegistry } from "@/lib/page-builder/block-registry"

interface Props {
  block: Block
  isSelected: boolean
  onSelect: (id: string) => void
  onToggleVisibility: (id: string) => void
  onRemove: (id: string) => void
}

export function SortableBlockItem({ block, isSelected, onSelect, onToggleVisibility, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const config = blockRegistry[block.type]
  const Icon = config?.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 mb-2 bg-background border rounded-md cursor-pointer transition-colors ${
        isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
      } ${!block.visible ? "opacity-50" : ""}`}
      onClick={() => onSelect(block.id)}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </div>

      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}

      {/* Block Name */}
      <span className="flex-1 text-sm font-medium truncate">{config?.label || "Unknown Block"}</span>

      {/* Visibility Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleVisibility(block.id)
        }}
        className="text-muted-foreground hover:text-foreground p-1"
        title={block.visible ? "Hide section" : "Show section"}
      >
        {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>

      {/* Remove */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(block.id)
        }}
        className="text-muted-foreground hover:text-destructive p-1"
        title="Remove section"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
