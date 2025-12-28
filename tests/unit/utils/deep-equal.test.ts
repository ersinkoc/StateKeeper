import { describe, it, expect } from 'vitest'
import { deepEqual } from '../../../src/utils/deep-equal'

describe('deepEqual', () => {
  it('should return true for identical primitives', () => {
    expect(deepEqual(42, 42)).toBe(true)
    expect(deepEqual('hello', 'hello')).toBe(true)
    expect(deepEqual(true, true)).toBe(true)
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(undefined, undefined)).toBe(true)
  })

  it('should return false for different primitives', () => {
    expect(deepEqual(42, 43)).toBe(false)
    expect(deepEqual('hello', 'world')).toBe(false)
    expect(deepEqual(true, false)).toBe(false)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  it('should handle NaN correctly', () => {
    expect(deepEqual(NaN, NaN)).toBe(true)
  })

  it('should return true for same reference', () => {
    const obj = { a: 1 }
    expect(deepEqual(obj, obj)).toBe(true)
  })

  it('should compare Date objects', () => {
    const date1 = new Date('2025-12-28')
    const date2 = new Date('2025-12-28')
    const date3 = new Date('2025-12-29')

    expect(deepEqual(date1, date2)).toBe(true)
    expect(deepEqual(date1, date3)).toBe(false)
  })

  it('should compare RegExp objects', () => {
    expect(deepEqual(/test/gi, /test/gi)).toBe(true)
    expect(deepEqual(/test/gi, /test/g)).toBe(false)
    expect(deepEqual(/test/gi, /other/gi)).toBe(false)
  })

  it('should compare Map objects', () => {
    const map1 = new Map([['a', 1], ['b', 2]])
    const map2 = new Map([['a', 1], ['b', 2]])
    const map3 = new Map([['a', 1], ['b', 3]])

    expect(deepEqual(map1, map2)).toBe(true)
    expect(deepEqual(map1, map3)).toBe(false)
  })

  it('should compare Set objects', () => {
    const set1 = new Set([1, 2, 3])
    const set2 = new Set([1, 2, 3])
    const set3 = new Set([1, 2, 4])

    expect(deepEqual(set1, set2)).toBe(true)
    expect(deepEqual(set1, set3)).toBe(false)
  })

  it('should compare ArrayBuffer objects', () => {
    const buf1 = new ArrayBuffer(8)
    const buf2 = new ArrayBuffer(8)
    const buf3 = new ArrayBuffer(16)

    new Uint8Array(buf1)[0] = 255
    new Uint8Array(buf2)[0] = 255

    expect(deepEqual(buf1, buf2)).toBe(true)
    expect(deepEqual(buf1, buf3)).toBe(false)
  })

  it('should compare TypedArrays', () => {
    const arr1 = new Uint8Array([1, 2, 3])
    const arr2 = new Uint8Array([1, 2, 3])
    const arr3 = new Uint8Array([1, 2, 4])

    expect(deepEqual(arr1, arr2)).toBe(true)
    expect(deepEqual(arr1, arr3)).toBe(false)
  })

  it('should compare arrays', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it('should compare nested arrays', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true)
    expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false)
  })

  it('should compare objects', () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('should compare nested objects', () => {
    const obj1 = { a: 1, b: { c: 2, d: 3 } }
    const obj2 = { a: 1, b: { c: 2, d: 3 } }
    const obj3 = { a: 1, b: { c: 2, d: 4 } }

    expect(deepEqual(obj1, obj2)).toBe(true)
    expect(deepEqual(obj1, obj3)).toBe(false)
  })

  it('should handle circular references', () => {
    const obj1: any = { a: 1 }
    obj1.self = obj1

    const obj2: any = { a: 1 }
    obj2.self = obj2

    expect(deepEqual(obj1, obj2)).toBe(true)
  })

  it('should return false for different types', () => {
    expect(deepEqual(42, '42')).toBe(false)
    expect(deepEqual([], {})).toBe(false)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  it('should handle complex nested structures', () => {
    const obj1 = {
      num: 42,
      str: 'hello',
      arr: [1, 2, { nested: true }],
      obj: { deep: { value: 123 } },
      date: new Date('2025-12-28'),
      regex: /test/gi
    }

    const obj2 = {
      num: 42,
      str: 'hello',
      arr: [1, 2, { nested: true }],
      obj: { deep: { value: 123 } },
      date: new Date('2025-12-28'),
      regex: /test/gi
    }

    const obj3 = {
      ...obj2,
      num: 43
    }

    expect(deepEqual(obj1, obj2)).toBe(true)
    expect(deepEqual(obj1, obj3)).toBe(false)
  })
})
