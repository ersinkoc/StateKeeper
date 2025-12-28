import { PatchStrategy } from '../../../src/strategies/patch'
import type { Patch } from '../../../src/types'

interface TestState {
  name: string
  age: number
  items: number[]
}

describe('PatchStrategy', () => {
  describe('basic operations', () => {
    it('should create patch strategy', () => {
      const strategy = new PatchStrategy<TestState>()
      expect(strategy.name).toBe('patch')
    })

    it('should create with custom diff function', () => {
      const customDiff = <T>(prev: T, next: T): Patch[] => {
        return [{ op: 'replace', path: '/', value: next }]
      }

      const strategy = new PatchStrategy<TestState>({ diffFunction: customDiff })
      expect(strategy.name).toBe('patch')
    })

    it('should create with custom patch function', () => {
      const customPatch = <T>(state: T, patches: Patch[]): T => {
        return state
      }

      const strategy = new PatchStrategy<TestState>({ patchFunction: customPatch })
      expect(strategy.name).toBe('patch')
    })
  })

  describe('createEntry', () => {
    it('should create entry with patches', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)

      expect(entry.id).toBeTruthy()
      expect(entry.timestamp).toBeTruthy()
      expect(entry.state).toEqual(nextState)
      expect(entry.patches).toBeDefined()
      expect(entry.inversePatches).toBeDefined()
    })

    it('should create entry with metadata', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState, { description: 'test' })

      expect(entry.metadata).toEqual({ description: 'test' })
    })

    it('should not include metadata when not provided', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)

      expect(entry.metadata).toBeUndefined()
    })

    it('should generate correct patches for simple change', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)

      expect(entry.patches).toHaveLength(1)
      expect(entry.patches?.[0]?.op).toBe('replace')
      expect(entry.patches?.[0]?.path).toBe('/age')
      expect(entry.patches?.[0]?.value).toBe(31)
    })
  })

  describe('applyUndo', () => {
    it('should apply inverse patches to undo changes', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)
      const result = strategy.applyUndo(entry, nextState)

      expect(result.age).toBe(30)
    })

    it('should throw error when entry has no inverse patches', () => {
      const strategy = new PatchStrategy<TestState>()
      const entry: any = {
        id: '1',
        timestamp: Date.now(),
        state: { name: 'John', age: 30, items: [] },
        patches: [],
      }

      expect(() => strategy.applyUndo(entry, entry.state)).toThrow(
        'Entry does not have inverse patches'
      )
    })
  })

  describe('applyRedo', () => {
    it('should apply patches to redo changes', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)
      const result = strategy.applyRedo(entry, prevState)

      expect(result.age).toBe(31)
    })

    it('should throw error when entry has no patches', () => {
      const strategy = new PatchStrategy<TestState>()
      const entry: any = {
        id: '1',
        timestamp: Date.now(),
        state: { name: 'John', age: 30, items: [] },
        inversePatches: [],
      }

      expect(() => strategy.applyRedo(entry, entry.state)).toThrow(
        'Entry does not have patches'
      )
    })
  })

  describe('serialization', () => {
    it('should serialize patch entry', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)
      const serialized = strategy.serialize(entry)
      const parsed = JSON.parse(serialized)

      expect(parsed.id).toBe(entry.id)
      expect(parsed.timestamp).toBe(entry.timestamp)
      expect(parsed.patches).toEqual(entry.patches)
      expect(parsed.inversePatches).toEqual(entry.inversePatches)
    })

    it('should serialize with metadata', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState, { description: 'test' })
      const serialized = strategy.serialize(entry)
      const parsed = JSON.parse(serialized)

      expect(parsed.metadata).toEqual({ description: 'test' })
    })

    it('should deserialize patch entry', () => {
      const strategy = new PatchStrategy<TestState>()
      const data = JSON.stringify({
        id: 'test-id',
        timestamp: 12345,
        patches: [{ op: 'replace', path: '/age', value: 31 }],
        inversePatches: [{ op: 'replace', path: '/age', value: 30 }],
        metadata: { description: 'test' },
      })

      const entry = strategy.deserialize(data)

      expect(entry.id).toBe('test-id')
      expect(entry.timestamp).toBe(12345)
      expect(entry.patches).toHaveLength(1)
      expect(entry.inversePatches).toHaveLength(1)
      expect(entry.metadata).toEqual({ description: 'test' })
    })

    it('should deserialize without metadata', () => {
      const strategy = new PatchStrategy<TestState>()
      const data = JSON.stringify({
        id: 'test-id',
        timestamp: 12345,
        patches: [{ op: 'replace', path: '/age', value: 31 }],
        inversePatches: [{ op: 'replace', path: '/age', value: 30 }],
      })

      const entry = strategy.deserialize(data)

      expect(entry.metadata).toBeUndefined()
    })
  })

  describe('helper methods', () => {
    it('should get patches from entry', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)
      const patches = strategy.getPatches(entry)

      expect(patches).toEqual(entry.patches)
    })

    it('should get inverse patches from entry', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const entry = strategy.createEntry(nextState, prevState)
      const inversePatches = strategy.getInversePatches(entry)

      expect(inversePatches).toEqual(entry.inversePatches)
    })

    it('should return empty array when no patches', () => {
      const strategy = new PatchStrategy<TestState>()
      const entry: any = {
        id: '1',
        timestamp: Date.now(),
        state: { name: 'John', age: 30, items: [] },
      }

      const patches = strategy.getPatches(entry)
      expect(patches).toEqual([])
    })

    it('should apply patches to state', () => {
      const strategy = new PatchStrategy<TestState>()
      const state = { name: 'John', age: 30, items: [] }
      const patches: Patch[] = [{ op: 'replace', path: '/age', value: 31 }]

      const result = strategy.applyPatches(state, patches)

      expect(result.age).toBe(31)
    })

    it('should create patch between two states', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 31, items: [] }

      const patches = strategy.createPatch(prevState, nextState)

      expect(patches).toHaveLength(1)
      expect(patches[0]?.op).toBe('replace')
      expect(patches[0]?.path).toBe('/age')
    })
  })

  describe('complex state changes', () => {
    it('should handle array additions', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'John', age: 30, items: [1, 2, 3] }

      const entry = strategy.createEntry(nextState, prevState)
      const result = strategy.applyRedo(entry, prevState)

      expect(result.items).toEqual([1, 2, 3])
    })

    it('should handle multiple property changes', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'Jane', age: 31, items: [1] }

      const entry = strategy.createEntry(nextState, prevState)

      expect(entry.patches).toBeDefined()
      expect(entry.patches!.length).toBeGreaterThan(0)
    })

    it('should handle undo of complex changes', () => {
      const strategy = new PatchStrategy<TestState>()
      const prevState = { name: 'John', age: 30, items: [] }
      const nextState = { name: 'Jane', age: 31, items: [1, 2] }

      const entry = strategy.createEntry(nextState, prevState)
      const result = strategy.applyUndo(entry, nextState)

      expect(result).toEqual(prevState)
    })
  })
})
