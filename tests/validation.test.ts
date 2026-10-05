import { describe, expect, it } from "vitest"
import {
  businessDetailsSchema,
  checkoutSchema,
  productSchema,
  serviceSchema,
  stockSchema,
  validate,
} from "@/lib/validation"

describe("productSchema", () => {
  it("parses a price string and trims text", () => {
    const r = validate(productSchema, { name: " Tee ", description: "", price: "12.50", category: "" })
    expect(r).toEqual({ ok: true, data: { name: "Tee", description: null, price: 12.5, category: null } })
  })

  it.each(["-5", "abc", "1.234", ""])("rejects price %j", (price) => {
    const r = validate(productSchema, { name: "Tee", description: "", price, category: "" })
    expect(r.ok).toBe(false)
  })

  it("requires a name", () => {
    const r = validate(productSchema, { name: "  ", description: "", price: "1", category: "" })
    expect(r).toEqual({ ok: false, error: "Name is required." })
  })
})

describe("serviceSchema", () => {
  it("treats an empty duration as none", () => {
    const r = validate(serviceSchema, { name: "Cut", description: "", price: "20", category: "", durationMinutes: "", location: "" })
    expect(r.ok && r.data.durationMinutes).toBeNull()
  })

  it("rejects a zero duration", () => {
    const r = validate(serviceSchema, { name: "Cut", description: "", price: "20", category: "", durationMinutes: "0", location: "" })
    expect(r.ok).toBe(false)
  })
})

describe("stockSchema", () => {
  it("rejects negative stock", () => {
    expect(validate(stockSchema, { stockQuantity: "-1", lowStockThreshold: "" }).ok).toBe(false)
  })

  it("defaults the low-stock level to 5", () => {
    expect(validate(stockSchema, { stockQuantity: "4", lowStockThreshold: "" })).toEqual({
      ok: true,
      data: { stockQuantity: 4, lowStockThreshold: 5 },
    })
  })
})

describe("checkoutSchema", () => {
  const base = { fullName: "Ann", address: "Lagos", notes: "" }

  it("accepts international phone formats", () => {
    expect(validate(checkoutSchema, { ...base, phone: "+234 803 123 4567" }).ok).toBe(true)
    expect(validate(checkoutSchema, { ...base, phone: "(0803) 123-4567" }).ok).toBe(true)
  })

  it.each(["abc", "12345", "1234567890123456"])("rejects phone %j", (phone) => {
    expect(validate(checkoutSchema, { ...base, phone }).ok).toBe(false)
  })
})

describe("businessDetailsSchema", () => {
  const base = { businessName: "Shop", phone: "", email: "", whatsappNumber: "", instagramHandle: "", address: "", description: "" }

  it("turns empty optional fields into null", () => {
    const r = validate(businessDetailsSchema, base)
    expect(r.ok && r.data).toMatchObject({ phone: null, email: null, whatsappNumber: null, instagramHandle: null })
  })

  it("rejects a bad email and a bad Instagram handle", () => {
    expect(validate(businessDetailsSchema, { ...base, email: "nope" }).ok).toBe(false)
    expect(validate(businessDetailsSchema, { ...base, instagramHandle: "https://instagram.com/x" }).ok).toBe(false)
  })
})
