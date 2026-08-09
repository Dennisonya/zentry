/**
 * Utility functions for the OTP / delivery-code confirmation system.
 */

/** Generate a cryptographically random 6-digit OTP string. */
export function generateOTP(): string {
    const array = new Uint32Array(1)
    if (typeof window !== "undefined") {
      window.crypto.getRandomValues(array)
    } else {
      // Node / Edge runtime
      const { webcrypto } = require("crypto") as typeof import("crypto")
      ;(webcrypto as Crypto).getRandomValues(array)
    }
    // Map to 000000 – 999999
    return String(array[0] % 1_000_000).padStart(6, "0")
  }
  
  /** Generate a human-friendly 4-digit fallback delivery code. */
  export function generateDeliveryCode(): string {
    const array = new Uint32Array(1)
    if (typeof window !== "undefined") {
      window.crypto.getRandomValues(array)
    } else {
      const { webcrypto } = require("crypto") as typeof import("crypto")
      ;(webcrypto as Crypto).getRandomValues(array)
    }
    return String(array[0] % 10_000).padStart(4, "0")
  }
  
  /** Generate a UUID-style confirmation token. Falls back to Math.random in environments without crypto. */
  export function generateConfirmationToken(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    // Fallback
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
  
  /** Returns the expiry timestamp — now + minutes. */
  export function otpExpiresAt(minutes = 5): string {
    return new Date(Date.now() + minutes * 60 * 1_000).toISOString()
  }
  
  /** Returns true if the given ISO timestamp is still in the future. */
  export function isOTPValid(expiresAt: string | null): boolean {
    if (!expiresAt) return false
    return new Date(expiresAt) > new Date()
  }
  
  /** Mask a name for privacy: "Dennis Onya" → "D***s O***a" */
  export function maskName(name: string): string {
    return name
      .split(" ")
      .map((word) => {
        if (word.length <= 2) return word
        return word[0] + "*".repeat(word.length - 2) + word[word.length - 1]
      })
      .join(" ")
  }