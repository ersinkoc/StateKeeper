import { CommandStrategy, defineCommand } from '../../../src/strategies/command'

interface Counter {
  count: number
}

describe('CommandStrategy', () => {
  describe('basic operations', () => {
    it('should create command strategy', () => {
      const strategy = new CommandStrategy<Counter>()
      expect(strategy.name).toBe('command')
    })

    it('should create with options', () => {
      const strategy = new CommandStrategy<Counter>({ storeInitialState: true })
      expect(strategy.name).toBe('command')
    })

    it('should throw error when createEntry is called', () => {
      const strategy = new CommandStrategy<Counter>()
      expect(() => {
        strategy.createEntry({ count: 1 }, { count: 0 })
      }).toThrow('Use executeCommand to create command entries')
    })
  })

  describe('command registration', () => {
    it('should register a command', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const cmd = strategy.getCommand('increment')
      expect(cmd).toBe(increment)
    })

    it('should get registered command', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const cmd = strategy.getCommand('increment')
      expect(cmd).toBe(increment)
    })

    it('should return undefined for non-existent command', () => {
      const strategy = new CommandStrategy<Counter>()
      expect(strategy.getCommand('nonexistent')).toBeUndefined()
    })
  })

  describe('command execution', () => {
    it('should execute a command', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const result = strategy.execute(increment, 5, { count: 0 })
      expect(result).toEqual({ count: 5 })
    })

    it('should create command entry', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const entry = strategy.createCommandEntry(
        increment,
        5,
        { count: 5 },
        { count: 0 }
      )

      expect(entry.id).toBeTruthy()
      expect(entry.timestamp).toBeTruthy()
      expect(entry.state).toEqual({ count: 5 })
      expect(entry.command).toBeDefined()
      expect(entry.command?.name).toBe('increment')
      expect(entry.command?.payload).toBe(5)
    })

    it('should create command entry with metadata', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const entry = strategy.createCommandEntry(
        increment,
        5,
        { count: 5 },
        { count: 0 },
        { description: 'test' }
      )

      expect(entry.metadata).toEqual({ description: 'test' })
    })

    it('should store initial state when option is enabled', () => {
      const strategy = new CommandStrategy<Counter>({ storeInitialState: true })
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const entry = strategy.createCommandEntry(
        increment,
        5,
        { count: 5 },
        { count: 0 }
      )

      expect(entry.command?.previousState).toEqual({ count: 0 })
    })
  })

  describe('undo/redo', () => {
    it('should undo a command', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const entry = strategy.createCommandEntry(increment, 5, { count: 5 }, { count: 0 })

      const result = strategy.applyUndo(entry, { count: 5 })
      expect(result).toEqual({ count: 0 })
    })

    it('should redo a command', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const entry = strategy.createCommandEntry(increment, 5, { count: 5 }, { count: 0 })

      const result = strategy.applyRedo(entry, { count: 0 })
      expect(result).toEqual({ count: 5 })
    })

    it('should use custom redo function if provided', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
        redo: (state, amount: number) => ({ count: state.count + amount * 2 }),
      })

      strategy.registerCommand(increment)
      const entry = strategy.createCommandEntry(increment, 5, { count: 5 }, { count: 0 })

      const result = strategy.applyRedo(entry, { count: 0 })
      expect(result).toEqual({ count: 10 })
    })

    it('should throw error when undoing non-command entry', () => {
      const strategy = new CommandStrategy<Counter>()
      const entry: any = { id: '1', timestamp: Date.now(), state: { count: 0 } }

      expect(() => strategy.applyUndo(entry, { count: 5 })).toThrow(
        'Entry is not a command entry'
      )
    })

    it('should throw error when redoing non-command entry', () => {
      const strategy = new CommandStrategy<Counter>()
      const entry: any = { id: '1', timestamp: Date.now(), state: { count: 0 } }

      expect(() => strategy.applyRedo(entry, { count: 0 })).toThrow(
        'Entry is not a command entry'
      )
    })

    it('should throw error when command not registered for undo', () => {
      const strategy = new CommandStrategy<Counter>()
      const entry: any = {
        id: '1',
        timestamp: Date.now(),
        state: { count: 5 },
        command: { name: 'increment', payload: 5 },
      }

      expect(() => strategy.applyUndo(entry, { count: 5 })).toThrow(
        'Command "increment" is not registered'
      )
    })

    it('should throw error when command not registered for redo', () => {
      const strategy = new CommandStrategy<Counter>()
      const entry: any = {
        id: '1',
        timestamp: Date.now(),
        state: { count: 5 },
        command: { name: 'increment', payload: 5 },
      }

      expect(() => strategy.applyRedo(entry, { count: 0 })).toThrow(
        'Command "increment" is not registered'
      )
    })
  })

  describe('serialization', () => {
    it('should serialize command entry', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const entry = strategy.createCommandEntry(increment, 5, { count: 5 }, { count: 0 })

      const serialized = strategy.serialize(entry)
      const parsed = JSON.parse(serialized)

      expect(parsed.id).toBe(entry.id)
      expect(parsed.timestamp).toBe(entry.timestamp)
      expect(parsed.command).toEqual(entry.command)
    })

    it('should deserialize command entry', () => {
      const strategy = new CommandStrategy<Counter>()
      const data = JSON.stringify({
        id: 'test-id',
        timestamp: 12345,
        command: { name: 'increment', payload: 5 },
        metadata: { description: 'test' },
      })

      const entry = strategy.deserialize(data)

      expect(entry.id).toBe('test-id')
      expect(entry.timestamp).toBe(12345)
      expect(entry.command?.name).toBe('increment')
      expect(entry.command?.payload).toBe(5)
      expect(entry.metadata).toEqual({ description: 'test' })
    })

    it('should deserialize without metadata', () => {
      const strategy = new CommandStrategy<Counter>()
      const data = JSON.stringify({
        id: 'test-id',
        timestamp: 12345,
        command: { name: 'increment', payload: 5 },
      })

      const entry = strategy.deserialize(data)

      expect(entry.metadata).toBeUndefined()
    })
  })

  describe('defineCommand helper', () => {
    it('should create command definition', () => {
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      expect(increment.name).toBe('increment')
      expect(increment.execute).toBeDefined()
      expect(increment.undo).toBeDefined()
    })

    it('should create command with redo', () => {
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
        redo: (state, amount: number) => ({ count: state.count + amount }),
      })

      expect(increment.redo).toBeDefined()
    })
  })

  describe('execute method', () => {
    it('should execute command with execute method', () => {
      const strategy = new CommandStrategy<Counter>()
      const increment = defineCommand({
        name: 'increment',
        execute: (state, amount: number) => ({ count: state.count + amount }),
        undo: (state, amount: number) => ({ count: state.count - amount }),
      })

      strategy.registerCommand(increment)
      const result = strategy.execute(increment, 5, { count: 0 })

      expect(result).toEqual({ count: 5 })
    })
  })
})
