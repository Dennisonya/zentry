/**
 * Normalise a stored phone number to E.164 (+2348012345678).
 * Numbers without a "+" are read as international when they don't start
 * with 0, and as national (leading 0 replaced by defaultCountryCode) when
 * they do. Returns null when the result isn't a plausible E.164 number.
 */
export function toE164(raw: string, defaultCountryCode?: string): string | null {
  const trimmed = raw.trim()
  let digits = trimmed.replace(/\D/g, "")
  if (!digits) return null

  if (trimmed.startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2)
  } else if (digits.startsWith("0")) {
    const cc = defaultCountryCode?.replace(/\D/g, "")
    if (!cc) return null
    digits = cc + digits.slice(1)
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null
}

/** "+2348012345678" → "+234 ••• ••• 5678" */
export function maskPhone(e164: string): string {
  const cc = e164.length > 11 ? e164.slice(0, e164.length - 10) : e164.slice(0, 2)
  return `${cc} ••• ••• ${e164.slice(-4)}`
}
