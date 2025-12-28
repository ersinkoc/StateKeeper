/**
 * Deep equality check for any JavaScript values
 * @param a - First value
 * @param b - Second value
 * @returns True if values are deeply equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  return deepEqualWithCircularCheck(a, b, new WeakMap(), new WeakMap())
}

/**
 * Deep equal with circular reference detection
 */
function deepEqualWithCircularCheck(
  a: unknown,
  b: unknown,
  seenA: WeakMap<object, object>,
  seenB: WeakMap<object, object>
): boolean {
  // Same reference
  if (a === b) {
    return true
  }

  // Handle NaN (NaN === NaN is false, but they should be equal)
  if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
    return true
  }

  // Different types
  if (typeof a !== typeof b) {
    return false
  }

  // Null checks
  if (a === null || b === null) {
    return a === b
  }

  // Non-object primitives already handled by ===
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false
  }

  // Check for circular references
  if (seenA.has(a as object)) {
    return seenA.get(a as object) === b
  }
  if (seenB.has(b as object)) {
    return seenB.get(b as object) === a
  }

  seenA.set(a as object, b as object)
  seenB.set(b as object, a as object)

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // Handle RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags
  }

  // Handle Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false

    for (const [key, value] of a) {
      if (!b.has(key)) return false
      if (!deepEqualWithCircularCheck(value, b.get(key), seenA, seenB)) {
        return false
      }
    }
    return true
  }

  // Handle Set
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false

    for (const value of a) {
      let found = false
      for (const bValue of b) {
        if (deepEqualWithCircularCheck(value, bValue, seenA, seenB)) {
          found = true
          break
        }
      }
      if (!found) return false
    }
    return true
  }

  // Handle ArrayBuffer
  if (a instanceof ArrayBuffer && b instanceof ArrayBuffer) {
    if (a.byteLength !== b.byteLength) return false
    const viewA = new Uint8Array(a)
    const viewB = new Uint8Array(b)
    for (let i = 0; i < viewA.length; i++) {
      if (viewA[i] !== viewB[i]) return false
    }
    return true
  }

  // Handle TypedArrays
  if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
    if (a.constructor !== b.constructor) return false
    if ((a as Uint8Array).length !== (b as Uint8Array).length) return false

    const viewA = a as Uint8Array
    const viewB = b as Uint8Array

    for (let i = 0; i < viewA.length; i++) {
      if (viewA[i] !== viewB[i]) return false
    }
    return true
  }

  // Handle Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
      if (!deepEqualWithCircularCheck(a[i], b[i], seenA, seenB)) {
        return false
      }
    }
    return true
  }

  // Different array status
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }

  // Handle plain objects
  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)

  if (keysA.length !== keysB.length) {
    return false
  }

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false
    }

    if (
      !deepEqualWithCircularCheck(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        seenA,
        seenB
      )
    ) {
      return false
    }
  }

  return true
}
