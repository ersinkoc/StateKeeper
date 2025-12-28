import type { Strategy, HistoryEntry, EntryMetadata, Command } from '../types'
import { uid } from '../utils/uid'
import { deepClone } from '../utils/deep-clone'

/**
 * Command strategy options
 */
export interface CommandStrategyOptions {
  /** Store initial state for first entry (default: true) */
  storeInitialState?: boolean
}

/**
 * Command Strategy - stores commands with execute/undo functions
 */
export class CommandStrategy<T> implements Strategy<T> {
  readonly name = 'command' as const
  private commands: Map<string, Command<T, unknown>> = new Map()
  private storeInitialState: boolean

  constructor(options: CommandStrategyOptions = {}) {
    this.storeInitialState = options.storeInitialState ?? true
  }

  /**
   * Register a command
   * @param command - Command to register
   */
  registerCommand(command: Command<T, unknown>): void {
    this.commands.set(command.name, command)
  }

  /**
   * Get a registered command
   * @param name - Command name
   * @returns Command or undefined
   */
  getCommand(name: string): Command<T, unknown> | undefined {
    return this.commands.get(name)
  }

  /**
   * List all registered commands
   * @returns Array of command names
   */
  listCommands(): string[] {
    return Array.from(this.commands.keys())
  }

  /**
   * Execute a command and create history entry
   * @param command - Command to execute
   * @param payload - Command payload
   * @param currentState - Current state
   * @returns New state
   */
  execute<P>(command: Command<T, P>, payload: P, currentState: T): T {
    return command.execute(currentState, payload)
  }

  createEntry(_state: T, _prevState: T, _metadata?: EntryMetadata): HistoryEntry<T> {
    // This method is not used for command strategy
    // Commands are created via executeCommand
    throw new Error('Use executeCommand to create command entries')
  }

  /**
   * Create command entry
   * This is a special method for command strategy
   */
  createCommandEntry<P>(
    command: Command<T, P>,
    payload: P,
    state: T,
    prevState: T,
    metadata?: EntryMetadata
  ): HistoryEntry<T> {
    const entry: HistoryEntry<T> = {
      id: uid(),
      timestamp: Date.now(),
      state, // Store final state for quick access
      command: {
        name: command.name,
        payload,
        previousState: this.storeInitialState ? deepClone(prevState) : undefined,
      },
    }
    if (metadata) {
      entry.metadata = metadata
    }
    return entry
  }

  applyUndo(entry: HistoryEntry<T>, currentState: T): T {
    if (!entry.command) {
      throw new Error('Entry is not a command entry')
    }

    const command = this.commands.get(entry.command.name)
    if (!command) {
      throw new Error(`Command "${entry.command.name}" is not registered`)
    }

    return command.undo(currentState, entry.command.payload, entry.command.previousState as T | undefined)
  }

  applyRedo(entry: HistoryEntry<T>, currentState: T): T {
    if (!entry.command) {
      throw new Error('Entry is not a command entry')
    }

    const command = this.commands.get(entry.command.name)
    if (!command) {
      throw new Error(`Command "${entry.command.name}" is not registered`)
    }

    const redoFn = command.redo || command.execute
    return redoFn(currentState, entry.command.payload)
  }

  serialize(entry: HistoryEntry<T>): string {
    return JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      command: entry.command,
      metadata: entry.metadata,
    })
  }

  deserialize(data: string): HistoryEntry<T> {
    const parsed = JSON.parse(data) as {
      id: string
      timestamp: number
      command: HistoryEntry<T>['command']
      metadata?: EntryMetadata
    }

    const entry: HistoryEntry<T> = {
      id: parsed.id,
      timestamp: parsed.timestamp,
      state: undefined as unknown as T, // Will be reconstructed
    }
    if (parsed.command) {
      entry.command = parsed.command
    }
    if (parsed.metadata) {
      entry.metadata = parsed.metadata
    }
    return entry
  }
}

/**
 * Create a command strategy
 * @param options - Strategy options
 * @returns Command strategy instance
 */
export function createCommandStrategy<T>(
  options?: CommandStrategyOptions
): CommandStrategy<T> {
  return new CommandStrategy<T>(options)
}

/**
 * Helper to define a command with type safety
 * @param command - Command definition
 * @returns The command
 */
export function defineCommand<T, P = unknown>(command: Command<T, P>): Command<T, P> {
  return command
}
