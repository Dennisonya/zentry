import { describe, expect, it } from "vitest"
import { errorMessage } from "@/lib/errors"

describe("errorMessage", () => {
  it("joins a Supabase error's message, details and hint", () => {
    const err = { message: "new row violates check constraint", details: "Failing row contains (-1)", hint: "" }
    expect(errorMessage(err)).toBe("new row violates check constraint — Failing row contains (-1)")
  })

  it("reads Error objects and strings", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom")
    expect(errorMessage("plain")).toBe("plain")
  })

  it("falls back when there is nothing useful", () => {
    expect(errorMessage(null)).toBe("Something went wrong. Please try again.")
    expect(errorMessage({}, "Custom")).toBe("Custom")
  })
})
