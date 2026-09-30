"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useSavedItem, type SavedKind } from "@/lib/saved-items"

interface FavoriteButtonProps {
  kind: SavedKind
  id: string
  /** What is being saved, for the accessible label ("Save Nike Store"). */
  name: string
  className?: string
  iconClassName?: string
}

/** A heart toggle that saves a business, product or service to the customer's Favorites. */
export function FavoriteButton({ kind, id, name, className, iconClassName }: FavoriteButtonProps) {
  const { saved, toggle } = useSavedItem(kind, id)
  const [busy, setBusy] = useState(false)

  const handleClick = async (event: React.MouseEvent) => {
    // Hearts often sit on top of a card link; don't navigate.
    event.preventDefault()
    event.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      await toggle()
    } catch {
      toast.error(saved ? "Couldn't remove it from your favorites." : "Couldn't save it to your favorites.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from favorites` : `Save ${name} to favorites`}
      title={saved ? "Saved to favorites" : "Save to favorites"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-muted disabled:opacity-60",
        className,
      )}
      disabled={busy}
    >
      <Heart className={cn("h-[18px] w-[18px]", saved && "fill-rose-500 text-rose-500", iconClassName)} />
    </button>
  )
}
