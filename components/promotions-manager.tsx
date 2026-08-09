"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, Pencil, Plus, Tag, Trash2 } from "lucide-react"

type PromotionRow = {
  id: string
  business_id: string
  title: string
  description: string | null
  discount_type: string
  discount_value: number
  start_date: string
  end_date: string
  is_active: boolean
  applies_to: string
  created_at?: string
  promotion_products?: { product_id: string }[] | null
  promotion_services?: { service_id: string }[] | null
}

type CatalogProduct = { id: string; name: string; is_available: boolean }
type CatalogService = { id: string; name: string; is_available: boolean }

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Parse `datetime-local` value as local wall time (avoids UTC bugs from `new Date("YYYY-MM-DDTHH:mm")`). */
function parseDatetimeLocalInput(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s.trim())
  if (!m) return new Date(NaN)
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const h = Number(m[4])
  const mi = Number(m[5])
  return new Date(y, mo - 1, d, h, mi, 0, 0)
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function normalizePromotionRow(row: Record<string, unknown>): PromotionRow {
  const discountRaw = row.discount_value
  const discountNum =
    typeof discountRaw === "number"
      ? discountRaw
      : typeof discountRaw === "string"
        ? Number.parseFloat(discountRaw)
        : Number.NaN

  return {
    id: String(row.id),
    business_id: String(row.business_id),
    title: String(row.title ?? ""),
    description: row.description != null ? String(row.description) : null,
    discount_type: String(row.discount_type ?? "percentage"),
    discount_value: Number.isFinite(discountNum) ? discountNum : 0,
    start_date: String(row.start_date ?? ""),
    end_date: String(row.end_date ?? ""),
    is_active: Boolean(row.is_active),
    applies_to: String(row.applies_to ?? "all"),
    created_at: row.created_at != null ? String(row.created_at) : undefined,
  }
}

function supabaseErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>
    const msg = typeof o.message === "string" ? o.message : ""
    const details = typeof o.details === "string" ? o.details : ""
    const hint = typeof o.hint === "string" ? o.hint : ""
    const parts = [msg, details, hint].filter(Boolean)
    if (parts.length > 0) return parts.join(" — ")
  }
  if (err instanceof Error) return err.message
  return "Something went wrong."
}

function emptyForm() {
  return {
    title: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    start_local: "",
    end_local: "",
    is_active: true,
    applies_to: "specific" as "all" | "specific",
    product_ids: new Set<string>(),
    service_ids: new Set<string>(),
  }
}

export function PromotionsManager({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  /** Promotions query failed — list cannot load */
  const [fatalLoadError, setFatalLoadError] = useState<string | null>(null)
  /** Junction / optional table issues — promotions may still display */
  const [loadWarning, setLoadWarning] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promotions, setPromotions] = useState<PromotionRow[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [services, setServices] = useState<CatalogService[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async () => {
    setFatalLoadError(null)
    setLoadWarning(null)
    const supabase = getSupabaseClient()

    const { data: promoRows, error: promoErr } = await supabase
      .from("promotions")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })

    if (promoErr) {
      setFatalLoadError(promoErr.message)
      setPromotions([])
      setProducts([])
      setServices([])
      setLoading(false)
      return
    }

    const rawList = (promoRows || []) as Record<string, unknown>[]
    const ids = rawList.map((r) => String(r.id))

    let ppRows: { promotion_id: string; product_id: string }[] = []
    let psRows: { promotion_id: string; service_id: string }[] = []

    if (ids.length > 0) {
      const warnings: string[] = []
      const ppRes = await supabase.from("promotion_products").select("promotion_id, product_id").in("promotion_id", ids)
      if (ppRes.error) {
        warnings.push(`Product links: ${ppRes.error.message}`)
        ppRows = []
      } else {
        ppRows = (ppRes.data || []) as { promotion_id: string; product_id: string }[]
      }

      const psRes = await supabase.from("promotion_services").select("promotion_id, service_id").in("promotion_id", ids)
      if (psRes.error) {
        psRows = []
        const missing =
          psRes.error.code === "42P01" ||
          psRes.error.message.toLowerCase().includes("promotion_services") ||
          psRes.error.message.toLowerCase().includes("does not exist")
        warnings.push(
          missing
            ? "Service links: apply scripts/007-promotion-services.sql in Supabase for service-level promo targets."
            : `Service links: ${psRes.error.message}`,
        )
      } else {
        psRows = (psRes.data || []) as { promotion_id: string; service_id: string }[]
      }
      if (warnings.length > 0) setLoadWarning(warnings.join(" "))
    }

    const merged: PromotionRow[] = rawList.map((row) => {
      const id = String(row.id)
      const base = normalizePromotionRow(row)
      return {
        ...base,
        promotion_products: ppRows.filter((x) => x.promotion_id === id).map((x) => ({ product_id: x.product_id })),
        promotion_services: psRows.filter((x) => x.promotion_id === id).map((x) => ({ service_id: x.service_id })),
      }
    })

    const [{ data: prodData }, { data: svcData }] = await Promise.all([
      supabase.from("products").select("id, name, is_available").eq("business_id", businessId).order("name"),
      supabase.from("services").select("id, name, is_available").eq("business_id", businessId).order("name"),
    ])

    setPromotions(merged)
    setProducts((prodData as CatalogProduct[]) || [])
    setServices((svcData as CatalogService[]) || [])
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
    setDialogOpen(true)
  }

  const openEdit = (p: PromotionRow) => {
    setEditingId(p.id)
    const pp = new Set((p.promotion_products || []).map((x) => x.product_id))
    const ps = new Set((p.promotion_services || []).map((x) => x.service_id))
    setForm({
      title: p.title,
      description: p.description || "",
      discount_type: p.discount_type === "fixed" ? "fixed" : "percentage",
      discount_value: String(p.discount_value),
      start_local: isoToDatetimeLocal(p.start_date),
      end_local: isoToDatetimeLocal(p.end_date),
      is_active: p.is_active,
      applies_to: p.applies_to === "all" ? "all" : "specific",
      product_ids: pp,
      service_ids: ps,
    })
    setError(null)
    setDialogOpen(true)
  }

  const toggleProduct = (id: string, checked: boolean) => {
    setForm((f) => {
      const next = new Set(f.product_ids)
      if (checked) next.add(id)
      else next.delete(id)
      return { ...f, product_ids: next }
    })
  }

  const toggleService = (id: string, checked: boolean) => {
    setForm((f) => {
      const next = new Set(f.service_ids)
      if (checked) next.add(id)
      else next.delete(id)
      return { ...f, service_ids: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const discountVal = Number.parseFloat(form.discount_value)
    if (!form.title.trim()) {
      setError("Please enter a title.")
      return
    }
    if (!Number.isFinite(discountVal) || discountVal <= 0) {
      setError("Discount value must be a positive number.")
      return
    }
    if (form.discount_type === "percentage" && discountVal > 100) {
      setError("Percentage discounts cannot exceed 100%.")
      return
    }
    if (!form.start_local || !form.end_local) {
      setError("Please set both start and end dates.")
      return
    }
    const startDate = parseDatetimeLocalInput(form.start_local)
    const endDate = parseDatetimeLocalInput(form.end_local)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError("Invalid dates.")
      return
    }
    if (endDate <= startDate) {
      setError("End date must be after start date.")
      return
    }
    const productIds = [...form.product_ids]
    const serviceIds = [...form.service_ids]
    if (form.applies_to === "specific" && productIds.length === 0 && serviceIds.length === 0) {
      setError("Select at least one product or service, or choose “All catalog items”.")
      return
    }

    setSaving(true)
    try {
      const supabase = getSupabaseClient() as any
      const roundedDiscount = roundMoney(discountVal)
      const rowPayload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: roundedDiscount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: form.is_active,
        applies_to: form.applies_to,
      }

      let promotionId = editingId

      if (editingId) {
        const { error: upErr } = await supabase.from("promotions").update(rowPayload).eq("id", editingId)
        if (upErr) throw upErr
        await supabase.from("promotion_products").delete().eq("promotion_id", editingId)
        await supabase.from("promotion_services").delete().eq("promotion_id", editingId)
      } else {
        const insertPayload = { ...rowPayload, business_id: businessId }
        const { data: inserted, error: insErr } = await supabase
          .from("promotions")
          .insert(insertPayload)
          .select("id")
          .single()
        if (insErr) throw insErr
        promotionId = inserted?.id ?? null
      }

      if (!promotionId) throw new Error("Could not save promotion.")

      if (form.applies_to === "specific") {
        if (productIds.length > 0) {
          const { error: pjErr } = await supabase.from("promotion_products").insert(
            productIds.map((product_id) => ({ promotion_id: promotionId, product_id })),
          )
          if (pjErr) throw pjErr
        }
        if (serviceIds.length > 0) {
          const { error: sjErr } = await supabase.from("promotion_services").insert(
            serviceIds.map((service_id) => ({ promotion_id: promotionId, service_id })),
          )
          if (sjErr) throw sjErr
        }
      }

      setDialogOpen(false)
      await load()
      router.refresh()
    } catch (err: unknown) {
      setError(supabaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return
    setSaving(true)
    try {
      const supabase = getSupabaseClient() as any
      const { error: delErr } = await supabase.from("promotions").delete().eq("id", id)
      if (delErr) throw delErr
      await load()
      router.refresh()
    } catch (err: unknown) {
      alert(supabaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const formatDiscount = (p: PromotionRow) => {
    const v = Number(p.discount_value)
    if (p.discount_type === "fixed") return `$${Number.isFinite(v) ? v.toFixed(2) : "0"} off`
    return `${Number.isFinite(v) ? v : 0}% off`
  }

  const formatRange = (p: PromotionRow) => {
    const a = new Date(p.start_date)
    const b = new Date(p.end_date)
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return ""
    return `${a.toLocaleString()} → ${b.toLocaleString()}`
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading promotions...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={openCreate} disabled={saving}>
          <Plus className="h-4 w-4 mr-2" />
          New promotion
        </Button>
      </div>

      {fatalLoadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fatalLoadError}</AlertDescription>
        </Alert>
      )}
      {loadWarning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadWarning}</AlertDescription>
        </Alert>
      )}

      {promotions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Tag className="h-10 w-10 mx-auto mb-3 opacity-60" />
            <p>
              {fatalLoadError
                ? "Promotions could not be loaded. Review the alert above and refresh after fixing permissions."
                : "No promotions yet. Create one to offer timed discounts on your catalog."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promotions.map((p) => {
            const now = Date.now()
            const ended = new Date(p.end_date).getTime() < now
            const notStarted = new Date(p.start_date).getTime() > now
            const status =
              !p.is_active ? (
                <Badge variant="secondary">Inactive</Badge>
              ) : ended ? (
                <Badge variant="outline">Ended</Badge>
              ) : notStarted ? (
                <Badge variant="outline">Scheduled</Badge>
              ) : (
                <Badge className="bg-green-600 hover:bg-green-600">Live</Badge>
              )
            const targetSummary =
              p.applies_to === "all"
                ? "All catalog items"
                : `${(p.promotion_products || []).length} product(s), ${(p.promotion_services || []).length} service(s)`

            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                    {status}
                  </div>
                  <CardDescription className="line-clamp-2">{p.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatDiscount(p)}</Badge>
                    <Badge variant="outline">{p.applies_to === "all" ? "Entire catalog" : "Specific items"}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{formatRange(p)}</p>
                  <p className="text-muted-foreground text-xs">{targetSummary}</p>
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(p)} disabled={saving}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit promotion" : "New promotion"}</DialogTitle>
            <DialogDescription>Set discount, schedule, and which catalog items are included.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="promo-title">Title</Label>
              <Input
                id="promo-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Spring sale"
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-desc">Description</Label>
              <Textarea
                id="promo-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                disabled={saving}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discount type</Label>
                <RadioGroup
                  value={form.discount_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v as "percentage" | "fixed" }))}
                  className="flex gap-3"
                  disabled={saving}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="percentage" id="dt-pct" />
                    <Label htmlFor="dt-pct" className="font-normal">
                      Percent
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="fixed" id="dt-fix" />
                    <Label htmlFor="dt-fix" className="font-normal">
                      Fixed ($)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo-val">Discount value</Label>
                <Input
                  id="promo-val"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount_value}
                  onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                  disabled={saving}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-dt">Starts</Label>
                <Input
                  id="start-dt"
                  type="datetime-local"
                  value={form.start_local}
                  onChange={(e) => setForm((f) => ({ ...f, start_local: e.target.value }))}
                  disabled={saving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-dt">Ends</Label>
                <Input
                  id="end-dt"
                  type="datetime-local"
                  value={form.end_local}
                  onChange={(e) => setForm((f) => ({ ...f, end_local: e.target.value }))}
                  disabled={saving}
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="promo-active">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive promotions stay hidden from timed deals logic.</p>
              </div>
              <Switch
                id="promo-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>Applies to</Label>
              <RadioGroup
                value={form.applies_to}
                onValueChange={(v) => setForm((f) => ({ ...f, applies_to: v as "all" | "specific" }))}
                className="flex flex-col gap-2"
                disabled={saving}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="app-all" />
                  <Label htmlFor="app-all" className="font-normal">
                    All catalog items (products and services)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="app-spec" />
                  <Label htmlFor="app-spec" className="font-normal">
                    Specific products and/or services
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {form.applies_to === "specific" && (
              <div className="space-y-4 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium mb-2">Products</p>
                  {products.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No products in your catalog.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                      {products.map((prod) => (
                        <label
                          key={prod.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={form.product_ids.has(prod.id)}
                            onCheckedChange={(c) => toggleProduct(prod.id, c === true)}
                            disabled={saving}
                          />
                          <span className={!prod.is_available ? "text-muted-foreground" : ""}>
                            {prod.name}
                            {!prod.is_available ? " (hidden)" : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Services</p>
                  {services.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No services in your catalog.</p>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                      {services.map((svc) => (
                        <label key={svc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={form.service_ids.has(svc.id)}
                            onCheckedChange={(c) => toggleService(svc.id, c === true)}
                            disabled={saving}
                          />
                          <span className={!svc.is_available ? "text-muted-foreground" : ""}>
                            {svc.name}
                            {!svc.is_available ? " (hidden)" : ""}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save changes" : "Create promotion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
