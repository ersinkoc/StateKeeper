import type { Patch } from '../types'
import { deepClone } from './deep-clone'
import { parsePath } from './diff'

/**
 * Apply JSON Patch operations to a value (RFC 6902)
 * @param target - The target value to patch
 * @param patches - Array of patch operations
 * @returns New patched value (immutable)
 */
export function applyPatch<T>(target: T, patches: Patch[]): T {
  let result = deepClone(target)

  for (const patch of patches) {
    result = applyOperation(result, patch)
  }

  return result
}

/**
 * Apply a single patch operation
 */
function applyOperation<T>(target: T, patch: Patch): T {
  switch (patch.op) {
    case 'add':
      return applyAdd(target, patch.path, patch.value)
    case 'remove':
      return applyRemove(target, patch.path)
    case 'replace':
      return applyReplace(target, patch.path, patch.value)
    case 'move':
      return applyMove(target, patch.from!, patch.path)
    case 'copy':
      return applyCopy(target, patch.from!, patch.path)
    case 'test':
      applyTest(target, patch.path, patch.value)
      return target
    default:
      throw new Error(`Unknown patch operation: ${(patch as Patch).op}`)
  }
}

/**
 * Apply 'add' operation
 */
function applyAdd<T>(target: T, path: string, value: unknown): T {
  const segments = parsePath(path)

  if (segments.length === 0) {
    return value as T
  }

  const result = deepClone(target)
  const parent = getParent(result, segments)
  const key = segments[segments.length - 1]!

  if (Array.isArray(parent)) {
    const index = key === '-' ? parent.length : parseInt(key, 10)
    parent.splice(index, 0, value)
  } else if (typeof parent === 'object' && parent !== null) {
    ;(parent as Record<string, unknown>)[key] = value
  } else {
    throw new Error(`Cannot add to non-object/array at path: ${path}`)
  }

  return result
}

/**
 * Apply 'remove' operation
 */
function applyRemove<T>(target: T, path: string): T {
  const segments = parsePath(path)

  if (segments.length === 0) {
    throw new Error('Cannot remove root')
  }

  const result = deepClone(target)
  const parent = getParent(result, segments)
  const key = segments[segments.length - 1]!

  if (Array.isArray(parent)) {
    const index = parseInt(key, 10)
    parent.splice(index, 1)
  } else if (typeof parent === 'object' && parent !== null) {
    delete (parent as Record<string, unknown>)[key]
  } else {
    throw new Error(`Cannot remove from non-object/array at path: ${path}`)
  }

  return result
}

/**
 * Apply 'replace' operation
 */
function applyReplace<T>(target: T, path: string, value: unknown): T {
  const segments = parsePath(path)

  if (segments.length === 0) {
    return value as T
  }

  const result = deepClone(target)
  const parent = getParent(result, segments)
  const key = segments[segments.length - 1]!

  if (Array.isArray(parent)) {
    const index = parseInt(key, 10)
    parent[index] = value
  } else if (typeof parent === 'object' && parent !== null) {
    ;(parent as Record<string, unknown>)[key] = value
  } else {
    throw new Error(`Cannot replace in non-object/array at path: ${path}`)
  }

  return result
}

/**
 * Apply 'move' operation
 */
function applyMove<T>(target: T, from: string, path: string): T {
  const value = getValue(target, from)
  let result = applyRemove(target, from)
  result = applyAdd(result, path, value)
  return result
}

/**
 * Apply 'copy' operation
 */
function applyCopy<T>(target: T, from: string, path: string): T {
  const value = getValue(target, from)
  return applyAdd(target, path, deepClone(value))
}

/**
 * Apply 'test' operation
 */
function applyTest<T>(target: T, path: string, value: unknown): void {
  const actual = getValue(target, path)

  if (!deepEqual(actual, value)) {
    throw new Error(`Test failed at path ${path}`)
  }
}

/**
 * Get parent object/array for a path
 */
function getParent(target: unknown, segments: string[]): unknown {
  let current = target

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]!

    if (Array.isArray(current)) {
      const index = parseInt(segment, 10)
      current = current[index]
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      throw new Error(`Invalid path: cannot traverse through ${typeof current}`)
    }
  }

  return current
}

/**
 * Get value at a path
 */
function getValue(target: unknown, path: string): unknown {
  const segments = parsePath(path)

  if (segments.length === 0) {
    return target
  }

  let current = target

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10)
      current = current[index]
    } else if (typeof current === 'object' && current !== null) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      throw new Error(`Invalid path: ${path}`)
    }
  }

  return current
}

/**
 * Deep equal check (imported from deep-equal, but inlined here to avoid circular deps during build)
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)
  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
      return false
    }
  }

  return true
}

/**
 * Create an inverse patch for undo operations
 * @param patch - The original patch
 * @param originalTarget - The target before the patch was applied
 * @returns Inverse patch
 */
export function createInversePatch(patch: Patch, originalTarget: unknown): Patch {
  switch (patch.op) {
    case 'add':
      return { op: 'remove', path: patch.path }

    case 'remove': {
      const value = getValue(originalTarget, patch.path)
      return { op: 'add', path: patch.path, value }
    }

    case 'replace': {
      const value = getValue(originalTarget, patch.path)
      return { op: 'replace', path: patch.path, value }
    }

    case 'move':
      return { op: 'move', from: patch.path, path: patch.from! }

    case 'copy':
      return { op: 'remove', path: patch.path }

    case 'test':
      return patch

    default:
      throw new Error(`Unknown patch operation: ${(patch as Patch).op}`)
  }
}

/**
 * Create inverse patches for an array of patches
 * @param patches - Original patches
 * @param originalTarget - Target before patches were applied
 * @returns Array of inverse patches in reverse order
 */
export function createInversePatches(patches: Patch[], originalTarget: unknown): Patch[] {
  const inversePatches: Patch[] = []
  let currentTarget = originalTarget

  for (const patch of patches) {
    const inverse = createInversePatch(patch, currentTarget)
    inversePatches.unshift(inverse) // Add to beginning (reverse order)
    currentTarget = applyOperation(currentTarget, patch)
  }

  return inversePatches
}
