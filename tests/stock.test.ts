import { beforeEach, describe, expect, it, vi } from "vitest"
import { getStorefrontStock } from "@/lib/product-categories"

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

describe("getStorefrontStock", () => {
  it("is not tracked when inventory is off", () => {
    expect(getStorefrontStock({ track_inventory: false, stock_quantity: 0 })).toEqual({ status: "not-tracked", remaining: null })
  })

  it("is sold out at zero and low at or under the threshold", () => {
    expect(getStorefrontStock({ track_inventory: true, stock_quantity: 0, low_stock_threshold: 5 })).toEqual({ status: "out", remaining: 0 })
    expect(getStorefrontStock({ track_inventory: true, stock_quantity: 5, low_stock_threshold: 5 })).toEqual({ status: "low", remaining: 5 })
    expect(getStorefrontStock({ track_inventory: true, stock_quantity: 6, low_stock_threshold: 5 })).toEqual({ status: "in-stock", remaining: 6 })
  })

  it("rolls up variants: sold out only when every variant is", () => {
    const v = (n: number) => ({ stock_quantity: n, low_stock_threshold: null })
    expect(getStorefrontStock({ has_variants: true, product_variants: [v(0), v(0)] }).status).toBe("out")
    expect(getStorefrontStock({ has_variants: true, product_variants: [v(0), v(20)] })).toEqual({ status: "low", remaining: 20 })
    expect(getStorefrontStock({ has_variants: true, product_variants: [v(10), v(20)] }).status).toBe("in-stock")
  })
})

describe("store cart stock cap", () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
      dispatchEvent: () => true,
    })
  })

  const product = { id: "p1", name: "Tee", description: null, price: 10, image_url: null, category: null }

  it("never adds past the stock left", async () => {
    const { addToStoreCart, readStoreCart, updateStoreCartQuantity } = await import("@/lib/store-cart")
    expect(addToStoreCart("b1", product, 1, null, 2)).toBe(1)
    expect(addToStoreCart("b1", product, 1, null, 2)).toBe(1)
    expect(addToStoreCart("b1", product, 1, null, 2)).toBe(0)
    updateStoreCartQuantity("b1", "p1", 5)
    expect(readStoreCart("b1")[0].quantity).toBe(2)
  })

  it("adds nothing when sold out, and anything when untracked", async () => {
    const { addToStoreCart } = await import("@/lib/store-cart")
    expect(addToStoreCart("b2", product, 1, null, 0)).toBe(0)
    expect(addToStoreCart("b2", product, 3, null, null)).toBe(3)
  })
})
