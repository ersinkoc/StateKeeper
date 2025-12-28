/**
 * Deep clone a value, handling special types and circular references
 * @param value - The value to clone
 * @returns A deep clone of the value
 */
export function deepClone<T>(value: T): T {
  // Try structuredClone first (modern browsers and Node 17+)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // Fall through to manual implementation
    }
  }

  // Handle primitives and null
  if (value === null || typeof value !== 'object') {
    return value
  }

  return cloneWithCircularCheck(value, new WeakMap())
}

/**
 * Clone with circular reference detection
 */
function cloneWithCircularCheck<T>(value: T, seen: WeakMap<object, unknown>): T {
  // Check for circular reference
  if (typeof value === 'object' && value !== null) {
    const cached = seen.get(value as object)
    if (cached !== undefined) {
      return cached as T
    }
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    const flags = value.flags
    const result = new RegExp(value.source, flags) as T
    seen.set(value as object, result)
    return result
  }

  // Handle Map
  if (value instanceof Map) {
    const result = new Map()
    seen.set(value as object, result)
    value.forEach((val, key) => {
      result.set(cloneWithCircularCheck(key, seen), cloneWithCircularCheck(val, seen))
    })
    return result as T
  }

  // Handle Set
  if (value instanceof Set) {
    const result = new Set()
    seen.set(value as object, result)
    value.forEach((val) => {
      result.add(cloneWithCircularCheck(val, seen))
    })
    return result as T
  }

  // Handle ArrayBuffer
  if (value instanceof ArrayBuffer) {
    const result = value.slice(0)
    seen.set(value as object, result)
    return result as T
  }

  // Handle TypedArrays
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const TypedArrayConstructor = (value as typeof value).constructor as new (
      buffer: ArrayBuffer
    ) => typeof value
    const result = new TypedArrayConstructor(
      (value as unknown as { buffer: ArrayBuffer }).buffer.slice(0)
    )
    seen.set(value as object, result)
    return result as T
  }

  // Handle DataView
  if (value instanceof DataView) {
    const result = new DataView(value.buffer.slice(0))
    seen.set(value as object, result)
    return result as T
  }

  // Handle Array
  if (Array.isArray(value)) {
    const result: unknown[] = []
    seen.set(value as object, result)
    for (let i = 0; i < value.length; i++) {
      result[i] = cloneWithCircularCheck(value[i], seen)
    }
    return result as T
  }

  // Handle plain objects
  if (typeof value === 'object') {
    const result: Record<string, unknown> = Object.create(Object.getPrototypeOf(value) as object)
    seen.set(value as object, result)

    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = cloneWithCircularCheck((value as Record<string, unknown>)[key], seen)
      }
    }

    return result as T
  }

  // Fallback
  return value
}
