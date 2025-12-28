import type { Patch } from '../types'
import { deepEqual } from './deep-equal'

/**
 * Generate JSON Patch (RFC 6902) from two values
 * @param prev - Previous value
 * @param next - Next value
 * @param path - Current path (for recursion)
 * @returns Array of patch operations
 */
export function diff<T>(prev: T, next: T, path = ''): Patch[] {
  // Same reference or equal values
  if (prev === next || deepEqual(prev, next)) {
    return []
  }

  // Type changed or null/undefined
  if (
    prev === null ||
    prev === undefined ||
    next === null ||
    next === undefined ||
    typeof prev !== typeof next ||
    Array.isArray(prev) !== Array.isArray(next)
  ) {
    return [{ op: 'replace', path: path || '/', value: next }]
  }

  // Handle arrays
  if (Array.isArray(prev) && Array.isArray(next)) {
    return diffArrays(prev, next, path)
  }

  // Handle objects
  if (typeof prev === 'object' && typeof next === 'object') {
    return diffObjects(
      prev as Record<string, unknown>,
      next as Record<string, unknown>,
      path
    )
  }

  // Primitive value changed
  return [{ op: 'replace', path: path || '/', value: next }]
}

/**
 * Diff two arrays
 */
function diffArrays(prev: unknown[], next: unknown[], path: string): Patch[] {
  const patches: Patch[] = []

  // Remove items from the end first (to maintain indices)
  if (prev.length > next.length) {
    for (let i = prev.length - 1; i >= next.length; i--) {
      patches.unshift({ op: 'remove', path: `${path}/${i}` })
    }
  }

  // Compare existing items
  const minLength = Math.min(prev.length, next.length)
  for (let i = 0; i < minLength; i++) {
    const itemPath = `${path}/${i}`
    const itemPatches = diff(prev[i], next[i], itemPath)
    patches.push(...itemPatches)
  }

  // Add new items
  if (next.length > prev.length) {
    for (let i = prev.length; i < next.length; i++) {
      patches.push({ op: 'add', path: `${path}/${i}`, value: next[i] })
    }
  }

  return patches
}

/**
 * Diff two objects
 */
function diffObjects(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  path: string
): Patch[] {
  const patches: Patch[] = []
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  const allKeys = new Set([...prevKeys, ...nextKeys])

  for (const key of allKeys) {
    const keyPath = `${path}/${escapeKey(key)}`
    const hasPrev = key in prev
    const hasNext = key in next

    if (!hasPrev && hasNext) {
      // Added
      patches.push({ op: 'add', path: keyPath, value: next[key] })
    } else if (hasPrev && !hasNext) {
      // Removed
      patches.push({ op: 'remove', path: keyPath })
    } else if (hasPrev && hasNext) {
      // Potentially modified
      const nestedPatches = diff(prev[key], next[key], keyPath)
      patches.push(...nestedPatches)
    }
  }

  return patches
}

/**
 * Escape a key for JSON Pointer (RFC 6901)
 * @param key - The key to escape
 * @returns Escaped key
 */
export function escapeKey(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1')
}

/**
 * Unescape a key from JSON Pointer (RFC 6901)
 * @param key - The escaped key
 * @returns Unescaped key
 */
export function unescapeKey(key: string): string {
  return key.replace(/~1/g, '/').replace(/~0/g, '~')
}

/**
 * Parse a JSON Pointer path into segments
 * @param path - JSON Pointer path
 * @returns Array of path segments
 */
export function parsePath(path: string): string[] {
  if (path === '' || path === '/') {
    return []
  }

  return path
    .substring(1) // Remove leading /
    .split('/')
    .map(unescapeKey)
}
