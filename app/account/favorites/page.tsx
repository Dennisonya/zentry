"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Package, Sparkles, Store } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { setSaved } from "@/lib/saved-items"
import { AccountShell } from "@/components/account/account-shell"
import { MobileAccountNav } from "@/components/account/account-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

type StoreRef = { business_name: string; slug: string } | null

type SavedRow = {
  id: string
  created_at: string
  business_id: string | null
  product_id: string | null
  service_id: string | null
  businesses: { id: string; business_name: string; slug: string; logo_url: string | null; business_type: string | null; description: string | null } | null
  products: { id: string; name: string; price: number; image_url: string | null; businesses: StoreRef } | null
  services: { id: string; name: string; price: number; businesses: StoreRef } | null
}

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`

export default function FavoritesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<SavedRow[]>([])

  useEffect(() => {
    ;(async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login?next=/account/favorites")
        return
      }
      const { data, error: loadError } = await supabase
        .from("saved_items")
        .select(
          "id, created_at, business_id, product_id, service_id, businesses(id, business_name, slug, logo_url, business_type, description), products(id, name, price, image_url, businesses(business_name, slug)), services(id, name, price, businesses(business_name, slug))",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (loadError) setError("We couldn't load your favorites. Please refresh to try again.")
      setRows((data as unknown as SavedRow[]) || [])
      setLoading(false)
    })()
  }, [router])

  const remove = async (row: SavedRow) => {
    const kind = row.business_id ? "business" : row.product_id ? "product" : "service"
    const id = (row.business_id || row.product_id || row.service_id) as string
    setRows((current) => current.filter((r) => r.id !== row.id))
    try {
      await setSaved(kind, id, false)
    } catch {
      setRows((current) => [row, ...current])
      toast.error("Couldn't remove it from your favorites.")
    }
  }

  const stores = rows.filter((r) => r.business_id)
  const items = rows.filter((r) => r.product_id || r.service_id)

  return (
    <AccountShell>
      <main className="mx-auto max-w-5xl px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8 flex items-center gap-3">
          <MobileAccountNav />
          <div>
            <p className="text-sm text-muted-foreground">Stores and products you love</p>
            <h1 className="text-3xl font-bold">Favorites</h1>
          </div>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading favorites...</p>
        ) : error ? (
          <Card className="border-destructive/40">
            <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <div className="space-y-10">
            {stores.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Stores</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {stores.map((row) => {
                    const b = row.businesses
                    return (
                      <Card key={row.id} className="shadow-sm">
                        <CardContent className="flex items-center gap-4 p-5">
                          {b?.logo_url ? (
                            <img src={b.logo_url} alt={b.business_name} className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                              <Store className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {b ? (
                              <>
                                <Link href={`/${b.slug}`} className="font-semibold hover:underline">
                                  {b.business_name}
                                </Link>
                                <p className="truncate text-sm text-muted-foreground">{b.business_type || b.description}</p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">This store is no longer on Zentry.</p>
                            )}
                          </div>
                          <UnsaveButton onClick={() => remove(row)} name={b?.business_name || "store"} />
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )}

            {items.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Products & services</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((row) => {
                    const item = row.products || row.services
                    const store = item?.businesses
                    const href = row.products && store ? `/${store.slug}/products/${row.products.id}` : store ? `/${store.slug}/services` : null
                    const image = row.products?.image_url
                    return (
                      <Card key={row.id} className="overflow-hidden shadow-sm">
                        <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
                          {image ? (
                            <img src={image} alt={item?.name || ""} className="h-full w-full object-contain" />
                          ) : row.service_id ? (
                            <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground/50" />
                          )}
                          <UnsaveButton
                            onClick={() => remove(row)}
                            name={item?.name || "item"}
                            className="absolute right-2 top-2 bg-background/85 shadow-sm backdrop-blur"
                          />
                        </div>
                        <CardContent className="p-4">
                          {item ? (
                            <>
                              {href ? (
                                <Link href={href} className="block truncate font-medium hover:underline">
                                  {item.name}
                                </Link>
                              ) : (
                                <p className="truncate font-medium">{item.name}</p>
                              )}
                              <p className="mt-1 truncate text-xs text-muted-foreground">{store?.business_name}</p>
                              <p className="mt-2 font-semibold">{money(item.price)}</p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No longer available.</p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </AccountShell>
  )
}

function UnsaveButton({ onClick, name, className = "" }: { onClick: () => void; name: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Remove ${name} from favorites`}
      title="Remove from favorites"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-muted ${className}`}
    >
      <Heart className="h-[18px] w-[18px] fill-rose-500 text-rose-500" />
    </button>
  )
}

function EmptyFavorites() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center py-24 text-center">
        <div className="rounded-2xl bg-purple-100 p-4 text-purple-700">
          <Heart className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-semibold">No favorites yet</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Tap the heart on a store or product to save it here and come back to it anytime.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link href="/marketplace">Discover businesses</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
