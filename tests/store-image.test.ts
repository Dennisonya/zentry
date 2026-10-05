import { describe, expect, it } from "vitest"
import { isOptimizable } from "@/components/store-image"

describe("isOptimizable", () => {
  it("accepts public Supabase Storage URLs", () => {
    expect(isOptimizable("https://abc.supabase.co/storage/v1/object/public/images/a.jpg")).toBe(true)
  })

  it.each([
    "http://abc.supabase.co/storage/v1/object/public/images/a.jpg",
    "https://abc.supabase.co/storage/v1/object/sign/images/a.jpg",
    "https://example.com/a.jpg",
    "/placeholder.svg",
    "",
  ])("rejects %j", (src) => {
    expect(isOptimizable(src)).toBe(false)
  })
})
