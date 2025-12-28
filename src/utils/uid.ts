/**
 * Generate a unique identifier
 * @returns A unique string ID
 */
export function uid(): string {
  // Use crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback: timestamp + random
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  const randomPart2 = Math.random().toString(36).substring(2, 15)

  return `${timestamp}-${randomPart}${randomPart2}`
}
