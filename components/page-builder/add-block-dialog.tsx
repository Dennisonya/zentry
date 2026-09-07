"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { blockRegistry, ALL_BLOCK_TYPES } from "@/lib/page-builder/block-registry"
import type { BlockType } from "@/lib/page-builder/types"

const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  "announcement-bar": "A thin promo strip at the very top of your page.",
  navbar: "Sticky header with search, favorites, and cart.",
  hero: "Business name, logo, and description at the top of the page.",
  popular: "A curated highlight row — your most popular products or services.",
  categories: "Scrollable category pills, pulled from your products/services.",
  "product-grid": "Your products, optionally grouped by category.",
  "service-grid": "Your bookable services.",
  banner: "A large promotional banner — photo or MP4 video background.",
  about: "Your story, with an optional side image and call-to-action button.",
  trust: "A short row of trust signals — secure checkout, fast delivery, etc.",
  footer: "Logo, navigation, and contact links — reused from your business profile.",
  "contact-info": "A dedicated section with phone, email, address, WhatsApp, and Instagram.",
}

interface AddBlockDialogProps {
  onAddBlock: (type: BlockType) => void
}

export function AddBlockDialog({ onAddBlock }: AddBlockDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (type: BlockType) => {
    onAddBlock(type)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Section
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a section</DialogTitle>
          <DialogDescription>Choose a section type to add to your storefront page.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-2">
          {ALL_BLOCK_TYPES.map((type) => {
            const config = blockRegistry[type]
            const Icon = config.icon
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelect(type)}
                className="flex items-center gap-4 p-3 border rounded-lg hover:border-primary hover:bg-muted/50 cursor-pointer transition-all text-left"
              >
                <div className="bg-primary/10 p-2.5 rounded-md text-primary shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{config.label}</h4>
                  <p className="text-xs text-muted-foreground">{BLOCK_DESCRIPTIONS[type]}</p>
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
