import { SnapshotStrategy, createSnapshotStrategy } from '../../../src/strategies/snapshot'

describe('SnapshotStrategy', () => {
  it('should have correct name', () => {
    const strategy = new SnapshotStrategy()
    expect(strategy.name).toBe('snapshot')
  })

  it('should create entry with cloned state', () => {
    const strategy = new SnapshotStrategy()
    const state = { count: 1 }
    const entry = strategy.createEntry(state, { count: 0 })

    expect(entry.state).toEqual(state)
    expect(entry.state).not.toBe(state)
    expect(entry.id).toBeTruthy()
    expect(entry.timestamp).toBeGreaterThan(0)
  })

  it('should create entry with metadata', () => {
    const strategy = new SnapshotStrategy()
    const metadata = { name: 'test action' }
    const entry = strategy.createEntry({ count: 1 }, { count: 0 }, metadata)

    expect(entry.metadata).toEqual(metadata)
  })

  it('should apply undo', () => {
    const strategy = new SnapshotStrategy()
    const entry = strategy.createEntry({ count: 1 }, { count: 0 })
    const undone = strategy.applyUndo(entry, { count: 2 })

    expect(undone).toEqual({ count: 1 })
  })

  it('should apply redo', () => {
    const strategy = new SnapshotStrategy()
    const entry = strategy.createEntry({ count: 2 }, { count: 1 })
    const redone = strategy.applyRedo(entry, { count: 1 })

    expect(redone).toEqual({ count: 2 })
  })

  it('should serialize and deserialize', () => {
    const strategy = new SnapshotStrategy()
    const entry = strategy.createEntry({ count: 1 }, { count: 0 }, { name: 'test' })

    const serialized = strategy.serialize(entry)
    const deserialized = strategy.deserialize(serialized)

    expect(deserialized.state).toEqual(entry.state)
    expect(deserialized.metadata).toEqual(entry.metadata)
  })

  it('should support custom clone function', () => {
    const customClone = <T>(val: T) => ({ ...val as object } as T)
    const strategy = new SnapshotStrategy({ cloneFunction: customClone })
    const state = { count: 1 }
    const entry = strategy.createEntry(state, { count: 0 })

    expect(entry.state).toEqual(state)
    expect(entry.state).not.toBe(state)
  })

  it('should support shallow clone', () => {
    const strategy = new SnapshotStrategy({ deepClone: false })
    const state = { count: 1, nested: { value: 2 } }
    const entry = strategy.createEntry(state, { count: 0 })

    expect(entry.state).toEqual(state)
    expect(entry.state).not.toBe(state)
  })
})

describe('createSnapshotStrategy', () => {
  it('should create snapshot strategy', () => {
    const strategy = createSnapshotStrategy()
    expect(strategy.name).toBe('snapshot')
  })

  it('should pass options', () => {
    const strategy = createSnapshotStrategy({ deepClone: false })
    expect(strategy).toBeInstanceOf(SnapshotStrategy)
  })
})
