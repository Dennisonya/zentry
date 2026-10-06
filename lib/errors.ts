/**
 * Turns a thrown value into a message a person can act on. Supabase errors
 * are plain objects with message/details/hint rather than Error instances,
 * so `String(err)` would show "[object Object]".
 */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>
    const parts = [o.message, o.details, o.hint].filter((p): p is string => typeof p === "string" && p.trim() !== "")
    if (parts.length > 0) return parts.join(" — ")
  }
  if (typeof err === "string" && err.trim()) return err
  return fallback
}
