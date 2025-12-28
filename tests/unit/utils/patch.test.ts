import { applyPatch, createInversePatch } from '../../../src/utils/patch'
import type { Patch } from '../../../src/types'

describe('applyPatch', () => {
  it('should apply add operation to object', () => {
    const target = { a: 1 }
    const patches: Patch[] = [{ op: 'add', path: '/b', value: 2 }]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ a: 1, b: 2 })
    expect(target).toEqual({ a: 1 }) // Original unchanged
  })

  it('should apply remove operation', () => {
    const target = { a: 1, b: 2 }
    const patches: Patch[] = [{ op: 'remove', path: '/b' }]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ a: 1 })
  })

  it('should apply replace operation', () => {
    const target = { a: 1 }
    const patches: Patch[] = [{ op: 'replace', path: '/a', value: 2 }]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ a: 2 })
  })

  it('should apply add to array', () => {
    const target = [1, 2]
    const patches: Patch[] = [{ op: 'add', path: '/2', value: 3 }]
    const result = applyPatch(target, patches)

    expect(result).toEqual([1, 2, 3])
  })

  it('should apply add to array with - index', () => {
    const target = [1, 2]
    const patches: Patch[] = [{ op: 'add', path: '/-', value: 3 }]
    const result = applyPatch(target, patches)

    expect(result).toEqual([1, 2, 3])
  })

  it('should apply remove from array', () => {
    const target = [1, 2, 3]
    const patches: Patch[] = [{ op: 'remove', path: '/1' }]
    const result = applyPatch(target, patches)

    expect(result).toEqual([1, 3])
  })

  it('should apply move operation', () => {
    const target = { a: 1, b: 2 }
    const patches: Patch[] = [{ op: 'move', from: '/a', path: '/c' }]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ b: 2, c: 1 })
  })

  it('should apply copy operation', () => {
    const target = { a: 1, b: 2 }
    const patches: Patch[] = [{ op: 'copy', from: '/a', path: '/c' }]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ a: 1, b: 2, c: 1 })
  })

  it('should apply test operation successfully', () => {
    const target = { a: 1 }
    const patches: Patch[] = [{ op: 'test', path: '/a', value: 1 }]

    expect(() => applyPatch(target, patches)).not.toThrow()
  })

  it('should throw on failed test operation', () => {
    const target = { a: 1 }
    const patches: Patch[] = [{ op: 'test', path: '/a', value: 2 }]

    expect(() => applyPatch(target, patches)).toThrow()
  })

  it('should apply multiple patches in order', () => {
    const target = { a: 1 }
    const patches: Patch[] = [
      { op: 'add', path: '/b', value: 2 },
      { op: 'replace', path: '/a', value: 10 },
      { op: 'add', path: '/c', value: 3 }
    ]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ a: 10, b: 2, c: 3 })
  })

  it('should handle nested paths', () => {
    const target = { a: { b: { c: 1 } } }
    const patches: Patch[] = [{ op: 'replace', path: '/a/b/c', value: 2 }]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ a: { b: { c: 2 } } })
  })

  it('should replace root', () => {
    const target = { a: 1 }
    const patches: Patch[] = [{ op: 'replace', path: '/', value: { b: 2 } }]
    const result = applyPatch(target, patches)

    expect(result).toEqual({ b: 2 })
  })
})

describe('createInversePatch', () => {
  it('should create inverse for add operation', () => {
    const patch: Patch = { op: 'add', path: '/b', value: 2 }
    const original = { a: 1 }
    const inverse = createInversePatch(patch, original)

    expect(inverse).toEqual({ op: 'remove', path: '/b' })
  })

  it('should create inverse for remove operation', () => {
    const patch: Patch = { op: 'remove', path: '/b' }
    const original = { a: 1, b: 2 }
    const inverse = createInversePatch(patch, original)

    expect(inverse).toEqual({ op: 'add', path: '/b', value: 2 })
  })

  it('should create inverse for replace operation', () => {
    const patch: Patch = { op: 'replace', path: '/a', value: 2 }
    const original = { a: 1 }
    const inverse = createInversePatch(patch, original)

    expect(inverse).toEqual({ op: 'replace', path: '/a', value: 1 })
  })

  it('should create inverse for move operation', () => {
    const patch: Patch = { op: 'move', from: '/a', path: '/c' }
    const original = { a: 1, b: 2 }
    const inverse = createInversePatch(patch, original)

    expect(inverse).toEqual({ op: 'move', from: '/c', path: '/a' })
  })

  it('should create inverse for copy operation', () => {
    const patch: Patch = { op: 'copy', from: '/a', path: '/c' }
    const original = { a: 1, b: 2 }
    const inverse = createInversePatch(patch, original)

    expect(inverse).toEqual({ op: 'remove', path: '/c' })
  })

  it('should keep test operation unchanged', () => {
    const patch: Patch = { op: 'test', path: '/a', value: 1 }
    const original = { a: 1 }
    const inverse = createInversePatch(patch, original)

    expect(inverse).toEqual(patch)
  })
})
