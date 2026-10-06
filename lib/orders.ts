import type { SupabaseClient } from "@supabase/supabase-js"

export interface PlaceOrderLine {
  productId: string
  variantId?: string | null
  quantity: number
}

export interface PlacedOrderItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
  image_url: string | null
  variant_id: string | null
  variant_label: string | null
  original_price: number | null
  promotion_badge: string | null
}

export interface PlacedOrder {
  order_id: string
  total_amount: number
  items: PlacedOrderItem[]
}

/**
 * Creates an order through the `place_order` database function
 * (scripts/023). The browser only sends which products and how many — prices,
 * promotions, the total and the stock decrement all happen in the database in
 * one transaction, so a tampered cart can't change what the order costs.
 */
export async function placeOrder(
  supabase: SupabaseClient,
  params: {
    businessId: string
    lines: PlaceOrderLine[]
    customerName: string
    customerPhone: string
    deliveryAddress: string
    notes?: string | null
  },
): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc("place_order", {
    p_business_id: params.businessId,
    p_items: params.lines.map((line) => ({
      product_id: line.productId,
      variant_id: line.variantId ?? null,
      quantity: line.quantity,
    })),
    p_customer_name: params.customerName,
    p_customer_phone: params.customerPhone,
    p_delivery_address: params.deliveryAddress,
    p_notes: params.notes?.trim() ? params.notes : null,
  })

  // place_order raises customer-readable messages ("Only 2 left of …").
  if (error) throw new Error(error.message || "Could not place your order. Please try again.")

  const placed = data as PlacedOrder
  return {
    ...placed,
    total_amount: Number(placed.total_amount),
    items: (placed.items || []).map((item) => ({ ...item, price: Number(item.price) })),
  }
}
