import { getSupabaseClient } from "@/lib/supabase"

/**
 * Fires a low-stock/out-of-stock notification exactly once per threshold
 * crossing — `stockBefore > threshold && stockAfter <= threshold` for
 * low_stock, `stockBefore > 0 && stockAfter === 0` for out_of_stock. That
 * edge-check is inherently idempotent (repeat sales while already low don't
 * re-fire), so no separate dedup/time-window bookkeeping is needed.
 *
 * Called by the manual +/- stepper on the Inventory page (the owner's own
 * session). Checkout decrements stock and raises the same alerts inside the
 * place_order database function (scripts/023).
 */
export async function checkAndNotifyLowStock(params: {
  businessId: string
  productId: string
  productName: string
  variantId?: string | null
  variantLabel?: string | null
  stockBefore: number
  stockAfter: number
  threshold: number
}) {
  const { businessId, productId, productName, variantId = null, variantLabel = null, stockBefore, stockAfter, threshold } = params

  const itemLabel = variantLabel ? `${productName} (${variantLabel})` : productName
  let type: "low_stock" | "out_of_stock" | null = null
  let title = ""
  let body = ""

  if (stockBefore > 0 && stockAfter === 0) {
    type = "out_of_stock"
    title = "Out of stock"
    body = `${itemLabel} just sold out.`
  } else if (stockBefore > threshold && stockAfter <= threshold && stockAfter > 0) {
    type = "low_stock"
    title = "Running low"
    body = `Only ${stockAfter} left of ${itemLabel}.`
  }

  if (!type) return

  const supabase = getSupabaseClient() as any
  await supabase.from("notifications").insert({
    business_id: businessId,
    type,
    title,
    body,
    data: { productId, variantId, productName, variantLabel, remaining: stockAfter },
  })
}
