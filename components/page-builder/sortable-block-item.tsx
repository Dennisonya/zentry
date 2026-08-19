// components/page-builder/sortable-block-item.tsx
import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Eye, EyeOff } from "lucide-react"
import { Block } from "@/lib/page-builder/types"
import { blockRegistry } from "@/lib/page-builder/block-registry"

interface Props {
  block: Block;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function SortableBlockItem({ block, isSelected, onSelect, onToggleVisibility }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const config = blockRegistry[block.type]

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
      
      {/* Block Name */}
      <span className="flex-1 text-sm font-medium">
        {config?.label || "Unknown Block"}
      </span>

      {/* Visibility Toggle */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Don't trigger block selection
          onToggleVisibility(block.id);
        }}
        className="text-muted-foreground hover:text-foreground p-1"
      >
        {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  )
}