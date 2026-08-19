"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import { Plus, Loader2 } from "lucide-react"

import type { Business, Product, Service } from "@/components/dashboard-content"
import type { Block, PageSchema } from "@/lib/page-builder/types"
import { convertLayoutToSchema } from "@/lib/page-builder/layout-to-blocks"
import { blockRegistry } from "@/lib/page-builder/block-registry"
import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase"

interface BuilderCanvasProps {
  business: Business
  products: Product[]
  services: Service[]
  /** Called after a successful Save/Publish so the parent can refetch the business row. */
  onSaved?: () => void
}

function startingSchema(business: Business): PageSchema {
  return business.page_schema_draft || business.page_schema || convertLayoutToSchema()
}

export function BuilderCanvas({ business, products, services, onSaved }: BuilderCanvasProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => startingSchema(business).blocks)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id ?? null)
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Re-seed local state whenever the underlying business record changes
  // (e.g. after a Save/Publish round-trip refetches it via onSaved).
  useEffect(() => {
    const schema = startingSchema(business)
    setBlocks(schema.blocks)
    setSelectedBlockId(schema.blocks[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id, business.page_schema_updated_at])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleVisibility = (id: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)))
  }

  const discardChanges = () => {
    const schema = startingSchema(business)
    setBlocks(schema.blocks)
    setSelectedBlockId(schema.blocks[0]?.id ?? null)
    setError(null)
  }

  const persist = async (mode: "draft" | "publish") => {
    setSaving(mode)
    setError(null)
    try {
      const schema: PageSchema = { schemaVersion: 1, blocks }
      const supabase = getSupabaseClient() as any
      const payload =
        mode === "draft"
          ? { page_schema_draft: schema, page_schema_updated_at: new Date().toISOString() }
          : { page_schema_draft: schema, page_schema: schema, page_schema_updated_at: new Date().toISOString() }

      const { error: updateError } = await supabase.from("businesses").update(payload).eq("id", business.id)
      if (updateError) throw updateError
      onSaved?.()
    } catch (err: any) {
      setError(err.message || "Failed to save. Make sure your plan includes custom store design.")
    } finally {
      setSaving(null)
    }
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId)

  return (
    <div className="flex h-full w-full flex-col bg-muted/20">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-2.5 shrink-0">
        <div className="text-sm text-muted-foreground">
          {business.page_schema_updated_at
            ? `Last saved ${new Date(business.page_schema_updated_at).toLocaleString()}`
            : "Not saved yet"}
          {error && <span className="ml-3 text-destructive">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={discardChanges} disabled={saving !== null}>
            Discard changes
          </Button>
          <Button variant="outline" size="sm" onClick={() => persist("draft")} disabled={saving !== null}>
            {saving === "draft" && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Save draft
          </Button>
          <Button size="sm" onClick={() => persist("publish")} disabled={saving !== null}>
            {saving === "publish" && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 w-full">
        {/* LEFT COLUMN: Layers & Structure */}
        <aside className="w-72 bg-background border-r flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">Page Sections</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            >
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => (
                  <SortableBlockItem
                    key={block.id}
                    block={block}
                    isSelected={block.id === selectedBlockId}
                    onSelect={setSelectedBlockId}
                    onToggleVisibility={toggleVisibility}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button variant="outline" className="w-full mt-4 flex items-center gap-2" disabled>
              <Plus className="w-4 h-4" /> Add Section
            </Button>
          </div>
        </aside>

        {/* CENTER COLUMN: Live Preview Canvas */}
        <main className="flex-1 overflow-y-auto relative flex justify-center p-8">
          <div className="w-full max-w-[1200px] bg-white border shadow-sm rounded-lg overflow-hidden min-h-[800px]">
            {/* Same renderer the live storefront uses — what you see here is what publishing ships. */}
            <BlockRenderer
              schema={{ schemaVersion: 1, blocks }}
              business={business}
              products={products}
              services={services}
              showHidden
            />
          </div>
        </main>

        {/* RIGHT COLUMN: Settings Inspector */}
        <aside className="w-80 bg-background border-l flex flex-col shrink-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">
              {selectedBlock ? blockRegistry[selectedBlock.type]?.label : "Settings"}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedBlock ? (
              <div className="text-sm text-muted-foreground border-2 border-dashed p-4 rounded text-center">
                [Form for {selectedBlock.type} settings goes here]
                <br />
                <br />
                Next step: react-hook-form dynamically rendering inputs based on this block's zod schema.
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center mt-10">
                Select a section to edit its settings.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
