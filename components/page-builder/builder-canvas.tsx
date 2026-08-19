// components/page-builder/builder-canvas.tsx
"use client"

import React, { useState, useEffect } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers"
import { Plus } from "lucide-react"

import { Business } from "@/components/dashboard-content"
import { Block, PageSchema } from "@/lib/page-builder/types"
import { convertLayoutToSchema } from "@/lib/page-builder/layout-to-blocks"
import { blockRegistry } from "@/lib/page-builder/block-registry"
import { BlockRenderer } from "@/components/page-builder/block-renderer"
import { SortableBlockItem } from "./sortable-block-item"
import { Button } from "@/components/ui/button"

interface BuilderCanvasProps {
  business: Business;
}

export function BuilderCanvas({ business }: BuilderCanvasProps) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // 1. Initialize State
  useEffect(() => {
    // If they have a draft, load it. If not, load the live schema. 
    // If neither, generate the starter layout.
    const initialSchema: PageSchema = 
      business.page_schema_draft || 
      business.page_schema || 
      convertLayoutToSchema(business)
      
    setBlocks(initialSchema.blocks)
    // Select the first block by default
    if (initialSchema.blocks.length > 0) {
      setSelectedBlockId(initialSchema.blocks[0].id)
    }
  }, [business])

  // 2. DnD Sensors Setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 3. Handle Drag & Drop
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
    setBlocks(blocks.map(b => b.id === id ? { ...b, isVisible: !b.isVisible } : b))
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)
  const draftSchema: PageSchema = { version: "1.0", blocks }

  return (
    <div className="flex h-full w-full bg-muted/20">
      
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
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
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
          
          <Button variant="outline" className="w-full mt-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Section
          </Button>
        </div>
      </aside>

      {/* CENTER COLUMN: Live Preview Canvas */}
      <main className="flex-1 overflow-y-auto relative flex justify-center p-8">
        <div className="w-full max-w-[1200px] bg-white border shadow-sm rounded-lg overflow-hidden min-h-[800px]">
          {/* We reuse the exact same renderer the live site will use! */}
          <BlockRenderer schema={draftSchema} business={business} />
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
              <br/><br/>
              Next step: We will use react-hook-form to dynamically render inputs based on the Zod schema for this block.
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center mt-10">
              Select a section to edit its settings.
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}