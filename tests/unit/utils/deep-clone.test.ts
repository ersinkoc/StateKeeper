import { describe, it, expect, vi } from 'vitest'
import { deepClone } from '../../../src/utils/deep-clone'

describe('deepClone', () => {
  it('should clone primitives', () => {
    expect(deepClone(42)).toBe(42)
    expect(deepClone('hello')).toBe('hello')
    expect(deepClone(true)).toBe(true)
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
  })

  it('should use structuredClone when available', () => {
    const obj = { a: 1, b: { c: 2 } }
    const cloned = deepClone(obj)

    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.b).not.toBe(obj.b)
  })

  it('should clone Date objects', () => {
    const date = new Date('2025-12-28')
    const cloned = deepClone(date)

    expect(cloned).toEqual(date)
    expect(cloned).not.toBe(date)
    expect(cloned.getTime()).toBe(date.getTime())
  })

  it('should clone RegExp objects', () => {
    const regex = /test/gi
    const cloned = deepClone(regex)

    expect(cloned).toEqual(regex)
    expect(cloned).not.toBe(regex)
    expect(cloned.source).toBe(regex.source)
    expect(cloned.flags).toBe(regex.flags)
  })

  it('should clone Map objects', () => {
    const map = new Map([['a', 1], ['b', 2]])
    const cloned = deepClone(map)

    expect(cloned).toEqual(map)
    expect(cloned).not.toBe(map)
    expect(cloned.get('a')).toBe(1)
  })

  it('should clone Set objects', () => {
    const set = new Set([1, 2, 3])
    const cloned = deepClone(set)

    expect(cloned).toEqual(set)
    expect(cloned).not.toBe(set)
    expect(cloned.has(2)).toBe(true)
  })

  it('should clone ArrayBuffer', () => {
    const buffer = new ArrayBuffer(8)
    const view = new Uint8Array(buffer)
    view[0] = 255

    const cloned = deepClone(buffer)

    expect(cloned).not.toBe(buffer)
    expect(cloned.byteLength).toBe(buffer.byteLength)
    expect(new Uint8Array(cloned)[0]).toBe(255)
  })

  it('should clone TypedArrays', () => {
    const arr = new Uint8Array([1, 2, 3])
    const cloned = deepClone(arr)

    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
    expect(cloned[1]).toBe(2)
  })

  it('should clone arrays', () => {
    const arr = [1, 2, { a: 3 }]
    const cloned = deepClone(arr)

    expect(cloned).toEqual(arr)
    expect(cloned).not.toBe(arr)
    expect(cloned[2]).not.toBe(arr[2])
  })

  it('should clone nested objects', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      }
    }
    const cloned = deepClone(obj)

    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.b).not.toBe(obj.b)
    expect(cloned.b.d).not.toBe(obj.b.d)
  })

  it('should handle circular references', () => {
    const obj: any = { a: 1 }
    obj.self = obj

    const cloned = deepClone(obj)

    expect(cloned.a).toBe(1)
    expect(cloned.self).toBe(cloned)
  })

  it('should clone custom objects (note: structuredClone may not preserve prototypes)', () => {
    class Custom {
      value = 42
    }

    const obj = new Custom()
    const cloned = deepClone(obj)

    // structuredClone doesn't preserve prototypes, but values are cloned
    expect(cloned.value).toBe(42)
    expect(cloned).not.toBe(obj)
  })

  it('should handle mixed types', () => {
    const obj = {
      num: 42,
      str: 'hello',
      bool: true,
      null: null,
      date: new Date(),
      regex: /test/,
      arr: [1, 2, 3],
      nested: { a: 1 }
    }

    const cloned = deepClone(obj)

    expect(cloned).toEqual(obj)
    expect(cloned).not.toBe(obj)
    expect(cloned.date).not.toBe(obj.date)
    expect(cloned.regex).not.toBe(obj.regex)
    expect(cloned.arr).not.toBe(obj.arr)
    expect(cloned.nested).not.toBe(obj.nested)
  })
})
