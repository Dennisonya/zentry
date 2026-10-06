"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"
import { getSupabaseClient } from "@/lib/supabase"

/**
 * Favorites ("saved items", scripts/017): a customer can save a business,
 * a product or a service. The whole set of the signed-in user's saved ids is
 * loaded once per page and shared by every heart button, so a grid of
 * product cards costs one query rather than one per card.
 */
export type SavedKind = "business" | "product" | "service"

const COLUMN: Record<SavedKind, "business_id" | "product_id" | "service_id"> = {
  business: "business_id",
  product: "product_id",
  service: "service_id",
}

type Snapshot = { ready: boolean; userId: string | null; keys: ReadonlySet<string> }

let snapshot: Snapshot = { ready: false, userId: null, keys: new Set() }
let loading: Promise<void> | null = null
let authSubscribed = false
const listeners = new Set<() => void>()

const keyOf = (kind: SavedKind, id: string) => `${kind}:${id}`

function setSnapshot(next: Snapshot) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

function load() {
  if (loading) return loading
  loading = (async () => {
    const supabase = getSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSnapshot({ ready: true, userId: null, keys: new Set() })
      return
    }
    const { data, error } = await supabase
      .from("saved_items")
      .select("business_id, product_id, service_id")
      .eq("user_id", user.id)
    const keys = new Set<string>()
    if (!error) {
      for (const row of (data as { business_id: string | null; product_id: string | null; service_id: string | null }[]) || []) {
        if (row.business_id) keys.add(keyOf("business", row.business_id))
        if (row.product_id) keys.add(keyOf("product", row.product_id))
        if (row.service_id) keys.add(keyOf("service", row.service_id))
      }
    }
    setSnapshot({ ready: true, userId: user.id, keys })
  })()
  return loading
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!authSubscribed) {
    authSubscribed = true
    getSupabaseClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        loading = null
        void load()
      }
    })
  }
  void load()
  return () => {
    listeners.delete(listener)
  }
}

const serverSnapshot: Snapshot = { ready: false, userId: null, keys: new Set() }

/** Adds or removes one saved item. Returns the new saved state. */
export async function setSaved(kind: SavedKind, id: string, saved: boolean): Promise<boolean> {
  await load()
  const { userId, keys } = snapshot
  if (!userId) {
    const next = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = `/auth/login?next=${next}`
    return false
  }

  const key = keyOf(kind, id)
  const optimistic = new Set(keys)
  if (saved) optimistic.add(key)
  else optimistic.delete(key)
  setSnapshot({ ...snapshot, keys: optimistic })

  const supabase = getSupabaseClient()
  const { error } = saved
    ? await supabase.from("saved_items").insert({ user_id: userId, [COLUMN[kind]]: id } as never)
    : await supabase.from("saved_items").delete().eq("user_id", userId).eq(COLUMN[kind], id)

  // 23505 = already saved (e.g. from another tab) — that's the state we wanted.
  if (error && error.code !== "23505") {
    const reverted = new Set(snapshot.keys)
    if (saved) reverted.delete(key)
    else reverted.add(key)
    setSnapshot({ ...snapshot, keys: reverted })
    throw new Error(error.message)
  }
  return saved
}

export function useSavedItem(kind: SavedKind, id: string) {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot)
  const saved = state.keys.has(keyOf(kind, id))

  useEffect(() => {
    void load()
  }, [])

  const toggle = useCallback(() => setSaved(kind, id, !saved), [kind, id, saved])
  return { saved, ready: state.ready, toggle }
}
