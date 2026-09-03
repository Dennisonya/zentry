"use client"

import { DndContext, PointerSensor, useDraggable, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

type HorizontalAlignment = "left" | "center" | "right"
type VerticalAlignment = "top" | "center" | "bottom"

interface AlignmentControlProps {
  value: HorizontalAlignment
  vertical?: VerticalAlignment
  onChange: (value: HorizontalAlignment, vertical: VerticalAlignment) => void
  label?: string
}

const positions: Array<{ x: HorizontalAlignment; y: VerticalAlignment }> = [
  { x: "left", y: "top" }, { x: "center", y: "top" }, { x: "right", y: "top" },
  { x: "left", y: "center" }, { x: "center", y: "center" }, { x: "right", y: "center" },
  { x: "left", y: "bottom" }, { x: "center", y: "bottom" }, { x: "right", y: "bottom" },
]

function DraggableHandle({ x, y }: { x: HorizontalAlignment; y: VerticalAlignment }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: "alignment-handle",
  })

  const left = x === "left" ? "16.6667%" : x === "center" ? "50%" : "83.3333%"
  const top = y === "top" ? "16.6667%" : y === "center" ? "50%" : "83.3333%"

  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label="Drag to change alignment"
      {...listeners}
      {...attributes}
      className={cn(
        "absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm transition",
        isDragging && "scale-110 cursor-grabbing shadow-md",
      )}
      style={{
        left,
        top,
        transform: transform
          ? `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px))`
          : "translate(-50%, -50%)",
      }}
    />
  )
}

export function AlignmentControl({
  value,
  vertical = "center",
  onChange,
  label = "Alignment",
}: AlignmentControlProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const rect = event.active.rect.current.translated
    const parent = event.activatorEvent.currentTarget as HTMLElement | null
    const bounds = parent?.parentElement?.getBoundingClientRect()
    if (!rect || !bounds) return

    const px = Math.min(0.999, Math.max(0.001, (rect.left + rect.width / 2 - bounds.left) / bounds.width))
    const py = Math.min(0.999, Math.max(0.001, (rect.top + rect.height / 2 - bounds.top) / bounds.height))

    const x: HorizontalAlignment = px < 0.34 ? "left" : px > 0.66 ? "right" : "center"
    const y: VerticalAlignment = py < 0.34 ? "top" : py > 0.66 ? "bottom" : "center"
    onChange(x, y)
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="relative aspect-square w-full max-w-[180px] rounded-lg border bg-muted/30 p-1">
          <div className="grid h-full w-full grid-cols-3 grid-rows-3">
            {positions.map((position) => (
              <div
                key={`${position.x}-${position.y}`}
                className={cn(
                  "border border-border/40",
                  position.x === value && position.y === vertical && "bg-primary/10",
                )}
              />
            ))}
          </div>
          <DraggableHandle x={value} y={vertical} />
        </div>
      </DndContext>
      <p className="text-xs text-muted-foreground">
        Drag the dot to position the content, or use the grid as a quick target.
      </p>
      <div className="grid grid-cols-3 gap-1">
        {positions.map((position) => (
          <button
            key={`button-${position.x}-${position.y}`}
            type="button"
            onClick={() => onChange(position.x, position.y)}
            className={cn(
              "rounded border px-2 py-1 text-xs transition hover:bg-muted",
              position.x === value && position.y === vertical && "border-primary bg-primary/10",
            )}
          >
            {position.x[0].toUpperCase()}{position.y[0].toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
