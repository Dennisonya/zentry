export type Promotion = {
  id: string
  discount_type: "percentage" | "fixed" | string
  discount_value: number | string
  applies_to: "all" | "specific" | string
}

export type PromotionLinkRow = { promotion_id: string; product_id?: string; service_id?: string }

export function formatPromotionBadge(p: Promotion): string {
  const v = Number(p.discount_value)
  if (!Number.isFinite(v) || v <= 0) return ""
  if (p.discount_type === "fixed") return `$${v.toFixed(2)} OFF`
  const pct = Math.min(100, Math.max(0, v))
  return `${pct}% OFF`
}

export function applyBestPromotion(price: number, promotions: Promotion[]) {
  const base = Number(price)
  if (!Number.isFinite(base)) return null

  let best: { discounted: number; badge: string } | null = null
  for (const p of promotions) {
    const v = Number(p.discount_value)
    if (!Number.isFinite(v) || v <= 0) continue

    let discounted = base
    if (p.discount_type === "fixed") discounted = Math.max(0, base - v)
    else {
      const pct = Math.min(100, Math.max(0, v))
      discounted = Math.max(0, base * (1 - pct / 100))
    }
    discounted = Math.round(discounted * 100) / 100

    if (!best || discounted < best.discounted) {
      best = { discounted, badge: formatPromotionBadge(p) }
    }
  }
  if (!best || best.discounted >= base) return null
  return { original_price: base, price: best.discounted, promotion_badge: best.badge }
}

export async function fetchActivePromotionsForBusiness(supabase: any, businessId: string) {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from("promotions")
    .select("id, discount_type, discount_value, applies_to, start_date, end_date, is_active")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .lte("start_date", nowIso)
    .gt("end_date", nowIso)
  if (error) throw error
  return ((data as Promotion[]) || []).map((p: any) => ({
    ...p,
    discount_value: Number(p.discount_value),
  }))
}

export async function fetchPromotionLinks(supabase: any, promotionIds: string[]) {
  if (promotionIds.length === 0) {
    return { productLinks: [] as PromotionLinkRow[], serviceLinks: [] as PromotionLinkRow[] }
  }
  const [{ data: productLinks, error: ppErr }, { data: serviceLinks, error: psErr }] = await Promise.all([
    supabase.from("promotion_products").select("promotion_id, product_id").in("promotion_id", promotionIds),
    supabase.from("promotion_services").select("promotion_id, service_id").in("promotion_id", promotionIds),
  ])
  if (ppErr) throw ppErr
  // if promotion_services is missing, just return empty service links (products still work)
  if (psErr) return { productLinks: (productLinks as any[]) || [], serviceLinks: [] }
  return { productLinks: (productLinks as any[]) || [], serviceLinks: (serviceLinks as any[]) || [] }
}

export function applyPromotionsToCatalog<T extends { id: string; price: any }>(
  items: T[],
  promotions: Promotion[],
  links: PromotionLinkRow[],
  kind: "product" | "service",
) {
  const byPromoId = new Map<string, Promotion>()
  for (const p of promotions) byPromoId.set(p.id, p)

  const appliesAll = promotions.filter((p) => p.applies_to === "all")
  const itemToPromoIds = new Map<string, string[]>()

  for (const row of links) {
    const itemId = kind === "product" ? row.product_id : row.service_id
    if (!itemId) continue
    const arr = itemToPromoIds.get(itemId) || []
    arr.push(row.promotion_id)
    itemToPromoIds.set(itemId, arr)
  }

  return items.map((it) => {
    const original = Number(it.price)
    const applicable: Promotion[] = [...appliesAll]
    const promoIds = itemToPromoIds.get(it.id) || []
    for (const pid of promoIds) {
      const p = byPromoId.get(pid)
      if (p) applicable.push(p)
    }
    const best = applyBestPromotion(original, applicable)
    if (!best) return it
    return { ...(it as any), ...best }
  })
}

