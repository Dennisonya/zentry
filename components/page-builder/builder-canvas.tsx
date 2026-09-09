"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import { Loader2, LayoutList, Settings2 } from "lucide-react"

import type { Business, Product, Service } from "@/components/dashboard-content"
import type { Block, BlockType, PageSchema } from "@/lib/page-builder/types"
import { convertLayoutToSchema } from "@/lib/page-builder/layout-to-blocks"
import { blockRegistry } from "@/lib/page-builder/block-registry"
import { generateBlockId, cloneSettings } from "@/lib/page-builder/block-utils"
import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { AddBlockDialog } from "./add-block-dialog"
import { SettingsInspector } from "./settings-inspector"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { getSupabaseClient } from "@/lib/supabase"

interface BuilderCanvasProps {
  business: Business
  products: Product[]
  services: Service[]
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
  const [mobilePanel, setMobilePanel] = useState<"sections" | "settings" | null>(null)

  useEffect(() => {
    const schema = startingSchema(business)
    setBlocks(schema.blocks)
    setSelectedBlockId(schema.blocks[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business.id, business.page_schema_updated_at])

  const sensors = useSensors(
    useSensor(PointerSensor),
    // Without this, dragging a block in the sidebar on a touchscreen fights
    // the browser's native scroll gesture instead of reordering.
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
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
    setBlocks((items) => items.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)))
  }

  const addBlock = (type: BlockType) => {
    const def = blockRegistry[type]
    const newBlock = {
      id: generateBlockId(),
      type,
      visible: true,
      settings: cloneSettings(def.defaultSettings),
    } as Block
    setBlocks((items) => [...items, newBlock])
    setSelectedBlockId(newBlock.id)
    setMobilePanel("settings")
  }

  const removeBlock = (id: string) => {
    setBlocks((items) => items.filter((b) => b.id !== id))
    setSelectedBlockId((current) => (current === id ? null : current))
  }

  const updateBlockSettings = (id: string, settings: Block["settings"]) => {
    setBlocks((items) =>
      items.map((block) => (block.id === id ? ({ ...block, settings } as Block) : block)),
    )
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

  const selectBlock = (id: string) => {
    setSelectedBlockId(id)
    // On mobile, choosing a section from the "Sections" sheet should hand
    // off straight to "Settings" rather than closing back to the canvas.
    setMobilePanel((current) => (current === "sections" ? "settings" : current))
  }

  const sectionsPanelContent = (
    <>
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
              onSelect={selectBlock}
              onToggleVisibility={toggleVisibility}
              onRemove={removeBlock}
            />
          ))}
        </SortableContext>
      </DndContext>
      <AddBlockDialog onAddBlock={addBlock} />
    </>
  )

  const settingsPanelContent = selectedBlock ? (
    <SettingsInspector
      block={selectedBlock}
      businessId={business.id}
      products={products}
      services={services}
      onChange={(settings) => updateBlockSettings(selectedBlock.id, settings)}
    />
  ) : (
    <div className="mt-10 text-center text-sm text-muted-foreground">Select a section to edit its settings.</div>
  )

  return (
    <div className="flex h-full w-full flex-col bg-muted/20">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobilePanel("sections")}>
            <LayoutList className="mr-2 h-3.5 w-3.5" /> Sections
          </Button>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobilePanel("settings")}>
            <Settings2 className="mr-2 h-3.5 w-3.5" /> Settings
          </Button>
          <div className="hidden text-sm text-muted-foreground sm:block">
            {business.page_schema_updated_at
              ? `Last saved ${new Date(business.page_schema_updated_at).toLocaleString()}`
              : "Not saved yet"}
            {error && <span className="ml-3 text-destructive">{error}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={discardChanges} disabled={saving !== null}>Discard changes</Button>
          <Button variant="outline" size="sm" onClick={() => persist("draft")} disabled={saving !== null}>
            {saving === "draft" && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save draft
          </Button>
          <Button size="sm" onClick={() => persist("publish")} disabled={saving !== null}>
            {saving === "publish" && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1">
        <aside className="hidden w-72 shrink-0 flex-col border-r bg-background lg:flex">
          <div className="border-b p-4"><h2 className="text-sm font-semibold">Page Sections</h2></div>
          <div className="flex-1 overflow-y-auto p-4">{sectionsPanelContent}</div>
        </aside>

        <main className="relative flex flex-1 items-start justify-center overflow-y-auto p-4 sm:p-8">
          <div className="min-h-[800px] w-full max-w-[1200px] overflow-hidden rounded-lg border bg-background shadow-sm">
            <BlockRenderer
              schema={{ schemaVersion: 1, blocks }}
              business={business}
              products={products}
              services={services}
              showHidden
              onAddToCart={() => {}}
              cartItemCount={0}
              onCartOpen={() => {}}
            />
          </div>
        </main>

        <aside className="hidden w-80 shrink-0 flex-col border-l bg-background lg:flex">
          <div className="border-b p-4">
            <h2 className="text-sm font-semibold">
              {selectedBlock ? blockRegistry[selectedBlock.type]?.label : "Settings"}
            </h2>
            {selectedBlock && (
              <p className="mt-1 text-xs text-muted-foreground">
                Edit this section and changes will appear instantly in the preview.
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">{settingsPanelContent}</div>
        </aside>
      </div>

      <Sheet open={mobilePanel === "sections"} onOpenChange={(open) => setMobilePanel(open ? "sections" : null)}>
        <SheetContent side="left" className="w-[85vw] max-w-sm lg:hidden">
          <SheetTitle className="px-4 pt-4">Page Sections</SheetTitle>
          <div className="flex-1 overflow-y-auto p-4">{sectionsPanelContent}</div>
        </SheetContent>
      </Sheet>

      <Sheet open={mobilePanel === "settings"} onOpenChange={(open) => setMobilePanel(open ? "settings" : null)}>
        <SheetContent side="right" className="w-[85vw] max-w-sm lg:hidden">
          <SheetTitle className="px-4 pt-4">{selectedBlock ? blockRegistry[selectedBlock.type]?.label : "Settings"}</SheetTitle>
          <div className="flex-1 overflow-y-auto p-4">{settingsPanelContent}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
