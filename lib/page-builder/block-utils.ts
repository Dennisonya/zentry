export function generateBlockId(): string {
    if(typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
    return Math.random().toString(36).slice(2,10)
}
/**
 * Registry `defaultSettings` objects are created once, at module load, and
 * reused as the literal starting value for every new block. Without cloning,
 * two blocks of the same type would share one settings object in memory —
 * editing one could silently corrupt the other. Always clone before handing
 * default settings to a new block instance.
 */

export function cloneSettings<T>(settings: T): T {
    if (typeof structuredClone === "function") return structuredClone(settings)
    return JSON.parse(JSON.stringify(settings))
}