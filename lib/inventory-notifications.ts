import { getSupabaseClient } from "@/lib/supabase"

/**
 * Fires a low-stock/out-of-stock notification exactly once per threshold
 * crossing — `stockBefore > threshold && stockAfter <= threshold` for
 * low_stock, `stockBefore > 0 && stockAfter === 0` for out_of_stock. That
 * edge-check is inherently idempotent (repeat sales while already low don't
 * re-fire), so no separate dedup/time-window bookkeeping is needed.
 *
 * Called from every place stock actually changes: checkout, and the manual
 * +/- stepper on the Inventory page.
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

interface OrderedItem {
  productId: string
  variantId: string | null
  name: string
  variantLabel?: string | null
  quantity: number
}

/**
 * Decrements stock for each purchased line item after an order is placed —
 * the first place this app reduces inventory on a sale, for both variant
 * and non-variant products — then checks for a low/out-of-stock crossing.
 *
 * Reads-then-writes per item rather than an atomic RPC: this app does all
 * its data access from client-side Supabase calls with no server routes, and
 * traffic is low enough that a lost update on the very last unit of a very
 * popular item is an accepted, documented limitation rather than something
 * worth a Postgres function for.
 *
 * Best-effort — failures here must never block order confirmation, so every
 * call site should fire this after the order insert succeeds and swallow
 * its own errors.
 */
export async function decrementStockForOrder(businessId: string, items: OrderedItem[]) {
  const supabase = getSupabaseClient() as any

  for (const item of items) {
    if (item.variantId) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock_quantity, low_stock_threshold, product_id")
        .eq("id", item.variantId)
        .maybeSingle()
      if (!variant) continue

      const { data: product } = await supabase
        .from("products")
        .select("low_stock_threshold")
        .eq("id", variant.product_id)
        .maybeSingle()

      const stockBefore = Number(variant.stock_quantity) || 0
      const stockAfter = Math.max(0, stockBefore - item.quantity)
      await supabase.from("product_variants").update({ stock_quantity: stockAfter }).eq("id", item.variantId)

      await checkAndNotifyLowStock({
        businessId,
        productId: variant.product_id,
        productName: item.name,
        variantId: item.variantId,
        variantLabel: item.variantLabel ?? null,
        stockBefore,
        stockAfter,
        threshold: variant.low_stock_threshold ?? product?.low_stock_threshold ?? 5,
      })
    } else {
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity, track_inventory, low_stock_threshold")
        .eq("id", item.productId)
        .maybeSingle()
      if (!product || !product.track_inventory || product.stock_quantity == null) continue

      const stockBefore = Number(product.stock_quantity) || 0
      const stockAfter = Math.max(0, stockBefore - item.quantity)
      await supabase.from("products").update({ stock_quantity: stockAfter }).eq("id", item.productId)

      await checkAndNotifyLowStock({
        businessId,
        productId: item.productId,
        productName: item.name,
        stockBefore,
        stockAfter,
        threshold: product.low_stock_threshold ?? 5,
      })
    }
  }
}
