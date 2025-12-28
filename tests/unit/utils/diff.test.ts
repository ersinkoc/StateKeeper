import { describe, it, expect } from 'vitest'
import { diff, escapeKey, unescapeKey, parsePath } from '../../../src/utils/diff'

describe('diff', () => {
  it('should return empty array for equal values', () => {
    expect(diff(42, 42)).toEqual([])
    expect(diff('hello', 'hello')).toEqual([])
    expect(diff({ a: 1 }, { a: 1 })).toEqual([])
  })

  it('should detect primitive changes', () => {
    const patches = diff(42, 43)
    expect(patches).toEqual([{ op: 'replace', path: '/', value: 43 }])
  })

  it('should detect object property additions', () => {
    const patches = diff({ a: 1 }, { a: 1, b: 2 })
    expect(patches).toContainEqual({ op: 'add', path: '/b', value: 2 })
  })

  it('should detect object property removals', () => {
    const patches = diff({ a: 1, b: 2 }, { a: 1 })
    expect(patches).toContainEqual({ op: 'remove', path: '/b' })
  })

  it('should detect object property changes', () => {
    const patches = diff({ a: 1 }, { a: 2 })
    expect(patches).toContainEqual({ op: 'replace', path: '/a', value: 2 })
  })

  it('should detect nested object changes', () => {
    const patches = diff(
      { a: { b: 1 } },
      { a: { b: 2 } }
    )
    expect(patches).toContainEqual({ op: 'replace', path: '/a/b', value: 2 })
  })

  it('should detect array element additions', () => {
    const patches = diff([1, 2], [1, 2, 3])
    expect(patches).toContainEqual({ op: 'add', path: '/2', value: 3 })
  })

  it('should detect array element removals', () => {
    const patches = diff([1, 2, 3], [1, 2])
    expect(patches).toContainEqual({ op: 'remove', path: '/2' })
  })

  it('should detect array element changes', () => {
    const patches = diff([1, 2, 3], [1, 5, 3])
    expect(patches).toContainEqual({ op: 'replace', path: '/1', value: 5 })
  })

  it('should handle null to object', () => {
    const patches = diff(null, { a: 1 })
    expect(patches).toEqual([{ op: 'replace', path: '/', value: { a: 1 } }])
  })

  it('should handle type changes', () => {
    const patches = diff('hello', 42)
    expect(patches).toEqual([{ op: 'replace', path: '/', value: 42 }])
  })
})

describe('escapeKey', () => {
  it('should escape tilde', () => {
    expect(escapeKey('~test')).toBe('~0test')
  })

  it('should escape forward slash', () => {
    expect(escapeKey('a/b')).toBe('a~1b')
  })

  it('should escape both tilde and slash', () => {
    expect(escapeKey('~/test')).toBe('~0~1test')
  })

  it('should not modify keys without special characters', () => {
    expect(escapeKey('test')).toBe('test')
  })
})

describe('unescapeKey', () => {
  it('should unescape tilde', () => {
    expect(unescapeKey('~0test')).toBe('~test')
  })

  it('should unescape forward slash', () => {
    expect(unescapeKey('a~1b')).toBe('a/b')
  })

  it('should unescape both', () => {
    expect(unescapeKey('~0~1test')).toBe('~/test')
  })
})

describe('parsePath', () => {
  it('should parse empty path', () => {
    expect(parsePath('')).toEqual([])
    expect(parsePath('/')).toEqual([])
  })

  it('should parse simple path', () => {
    expect(parsePath('/a')).toEqual(['a'])
  })

  it('should parse nested path', () => {
    expect(parsePath('/a/b/c')).toEqual(['a', 'b', 'c'])
  })

  it('should parse path with escaped characters', () => {
    expect(parsePath('/a~1b/c~0d')).toEqual(['a/b', 'c~d'])
  })
})
