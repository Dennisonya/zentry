// components/page-builder/add-block-dialog.tsx
import React from "react"
import { Plus, LayoutTemplate } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { blockRegistry } from "@/lib/page-builder/block-registry"
import { BlockType } from "@/lib/page-builder/types"

interface AddBlockDialogProps {
  onAddBlock: (type: BlockType) => void
}

export function AddBlockDialog({ onAddBlock }: AddBlockDialogProps) {
  const [open, setOpen] = React.useState(false)

  // Grab all available block types from your registry
  const availableBlocks = Object.values(blockRegistry)

  const handleSelect = (type: BlockType) => {
    onAddBlock(type)
    setOpen(false) // Close modal after selection
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Section
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a new section</DialogTitle>
          <DialogDescription>
            Choose a section type to append to your storefront page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-4">
          {availableBlocks.map((config) => (
            <div
              key={config.type}
              onClick={() => handleSelect(config.type)}
              className="flex items-center gap-4 p-3 border rounded-lg hover:border-primary hover:bg-muted/50 cursor-pointer transition-all"
            >
              <div className="bg-primary/10 p-2.5 rounded-md text-primary">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{config.label}</h4>
                <p className="text-xs text-muted-foreground">Add a customizable {config.label.toLowerCase()} section.</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}