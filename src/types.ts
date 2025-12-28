/**
 * StateKeeper - Type Definitions
 * @packageDocumentation
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Unique identifier type
 */
export type UID = string

/**
 * Unsubscribe function returned by event subscriptions
 */
export type Unsubscribe = () => void

// ============================================================================
// History Entry Types
// ============================================================================

/**
 * Metadata associated with a history entry
 */
export interface EntryMetadata {
  /** Human-readable name for the entry */
  name?: string
  /** Description of what changed */
  description?: string
  /** Custom metadata */
  custom?: Record<string, unknown>
}

/**
 * Represents a single entry in the history stack
 */
export interface HistoryEntry<T> {
  /** Unique identifier for this entry */
  id: UID
  /** Timestamp when the entry was created */
  timestamp: number
  /** The state snapshot (for snapshot strategy) */
  state: T
  /** Command information (for command strategy) */
  command?: CommandEntry
  /** Patches to apply (for patch strategy) */
  patches?: Patch[]
  /** Inverse patches for undo (for patch strategy) */
  inversePatches?: Patch[]
  /** Group ID if this entry is part of a group */
  groupId?: string
  /** Additional metadata */
  metadata?: EntryMetadata
}

/**
 * Command entry stored in history
 */
export interface CommandEntry {
  /** Name of the command */
  name: string
  /** Payload passed to the command */
  payload: unknown
  /** Previous state (optional, for complex undos) */
  previousState?: unknown
}

// ============================================================================
// Branch Types
// ============================================================================

/**
 * Represents a branch in the history tree
 */
export interface Branch<T> {
  /** Unique identifier for this branch */
  id: UID
  /** Human-readable name */
  name: string
  /** ID of the parent branch (null for main) */
  parentBranch: string | null
  /** Position in parent branch where this branch forked */
  forkPosition: number
  /** Entries in this branch */
  entries: HistoryEntry<T>[]
  /** Timestamp when branch was created */
  createdAt: number
}

/**
 * The complete history stack
 */
export interface HistoryStack<T> {
  /** All entries in the current branch */
  entries: HistoryEntry<T>[]
  /** Current position in the stack (-1 = initial state) */
  position: number
  /** All branches */
  branches: Branch<T>[]
  /** Current branch ID */
  currentBranch: string
}

// ============================================================================
// Patch Types (RFC 6902)
// ============================================================================

/**
 * JSON Patch operation types
 */
export type PatchOperation = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'

/**
 * JSON Patch as defined in RFC 6902
 */
export interface Patch {
  /** The operation to perform */
  op: PatchOperation
  /** JSON Pointer to the target location */
  path: string
  /** Value to use (for add, replace, test) */
  value?: unknown
  /** Source location (for move, copy) */
  from?: string
}

// ============================================================================
// Command Types
// ============================================================================

/**
 * A command that can be executed and undone
 */
export interface Command<T, P = unknown> {
  /** Unique name for this command */
  name: string
  /** Execute the command and return new state */
  execute: (state: T, payload: P) => T
  /** Undo the command and return previous state */
  undo: (state: T, payload: P, previousState?: T) => T
  /** Optional custom redo (defaults to execute) */
  redo?: (state: T, payload: P) => T
}

// ============================================================================
// Strategy Types
// ============================================================================

/**
 * Strategy names
 */
export type StrategyName = 'snapshot' | 'command' | 'patch'

/**
 * Strategy interface for creating and applying history entries
 */
export interface Strategy<T> {
  /** Strategy name */
  readonly name: StrategyName
  /** Create a history entry from state change */
  createEntry(state: T, prevState: T, metadata?: EntryMetadata): HistoryEntry<T>
  /** Apply undo operation */
  applyUndo(entry: HistoryEntry<T>, currentState: T): T
  /** Apply redo operation */
  applyRedo(entry: HistoryEntry<T>, currentState: T): T
  /** Serialize entry for persistence */
  serialize(entry: HistoryEntry<T>): string
  /** Deserialize entry from persistence */
  deserialize(data: string): HistoryEntry<T>
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * All possible event types
 */
export type EventType =
  | 'push'
  | 'undo'
  | 'redo'
  | 'state-change'
  | 'clear'
  | 'group-start'
  | 'group-end'
  | 'branch-create'
  | 'branch-switch'
  | 'limit-reached'
  | 'plugin-registered'
  | 'plugin-unregistered'
  | 'destroy'

/**
 * Base event interface
 */
export interface BaseEvent {
  /** Event timestamp */
  timestamp: number
}

/**
 * Push event - emitted when state is pushed
 */
export interface PushEvent<T> extends BaseEvent {
  type: 'push'
  entry: HistoryEntry<T>
  state: T
  prevState: T
}

/**
 * Undo event - emitted when undo is performed
 */
export interface UndoEvent<T> extends BaseEvent {
  type: 'undo'
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

/**
 * Redo event - emitted when redo is performed
 */
export interface RedoEvent<T> extends BaseEvent {
  type: 'redo'
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

/**
 * State change sources
 */
export type StateChangeSource = 'push' | 'undo' | 'redo' | 'set' | 'goto' | 'clear'

/**
 * State change event - emitted on any state change
 */
export interface StateChangeEvent<T> extends BaseEvent {
  type: 'state-change'
  state: T
  prevState: T
  source: StateChangeSource
}

/**
 * Clear event - emitted when history is cleared
 */
export interface ClearEvent extends BaseEvent {
  type: 'clear'
}

/**
 * Group event - emitted on group start/end
 */
export interface GroupStartEvent extends BaseEvent {
  type: 'group-start'
  groupId: string
  name?: string
}

export interface GroupEndEvent extends BaseEvent {
  type: 'group-end'
  groupId: string
  name?: string
}

/**
 * Branch event - emitted on branch operations
 */
export interface BranchCreateEvent extends BaseEvent {
  type: 'branch-create'
  branchId: string
  branchName: string
  fromPosition: number
}

export interface BranchSwitchEvent extends BaseEvent {
  type: 'branch-switch'
  branchId: string
  branchName: string
  fromPosition: number
}

/**
 * Limit reached event - emitted when history limit is reached
 */
export interface LimitReachedEvent<T> extends BaseEvent {
  type: 'limit-reached'
  limit: number
  droppedEntry: HistoryEntry<T>
}

/**
 * Plugin event - emitted on plugin registration
 */
export interface PluginRegisteredEvent extends BaseEvent {
  type: 'plugin-registered'
  pluginName: string
}

export interface PluginUnregisteredEvent extends BaseEvent {
  type: 'plugin-unregistered'
  pluginName: string
}

/**
 * Destroy event - emitted when kernel is destroyed
 */
export interface DestroyEvent extends BaseEvent {
  type: 'destroy'
}

/**
 * Union of all kernel events
 */
export type KernelEvent<T> =
  | PushEvent<T>
  | UndoEvent<T>
  | RedoEvent<T>
  | StateChangeEvent<T>
  | ClearEvent
  | GroupStartEvent
  | GroupEndEvent
  | BranchCreateEvent
  | BranchSwitchEvent
  | LimitReachedEvent<T>
  | PluginRegisteredEvent
  | PluginUnregisteredEvent
  | DestroyEvent

/**
 * Event handler function
 */
export type EventHandler<T> = (event: KernelEvent<T>) => void

// ============================================================================
// Plugin Types
// ============================================================================

/**
 * Plugin type
 */
export type PluginType = 'core' | 'optional'

/**
 * Plugin hooks interface
 */
export interface PluginHooks<T> {
  /** Called before push, can modify state or return false to cancel */
  beforePush?: (state: T, prevState: T) => T | false
  /** Called after push */
  afterPush?: (entry: HistoryEntry<T>) => void
  /** Called before undo, return false to cancel */
  beforeUndo?: (entry: HistoryEntry<T>) => boolean
  /** Called after undo */
  afterUndo?: (state: T, entry: HistoryEntry<T>) => void
  /** Called before redo, return false to cancel */
  beforeRedo?: (entry: HistoryEntry<T>) => boolean
  /** Called after redo */
  afterRedo?: (state: T, entry: HistoryEntry<T>) => void
  /** Called on any state change */
  onStateChange?: (state: T, prevState: T) => void
  /** Called when history is cleared */
  onClear?: () => void
}

/**
 * Plugin interface
 */
export interface Plugin<T = unknown> {
  /** Unique plugin name */
  readonly name: string
  /** Plugin version */
  readonly version: string
  /** Plugin type */
  readonly type: PluginType
  /** Called when plugin is installed */
  install(kernel: Kernel<T>): void
  /** Called when plugin is uninstalled */
  uninstall(): void
  /** Plugin hooks */
  hooks?: PluginHooks<T>
  /** Plugin API exposed to users */
  api?: Record<string, unknown>
}

/**
 * Plugin info returned by listPlugins
 */
export interface PluginInfo {
  name: string
  version: string
  type: PluginType
  enabled: boolean
}

// ============================================================================
// Kernel Types
// ============================================================================

/**
 * Options for creating a history instance
 */
export interface CreateHistoryOptions<T> {
  /** Initial state */
  initialState: T
  /** Strategy to use */
  strategy?: StrategyName
  /** Maximum number of history entries */
  limit?: number
  /** Plugins to register */
  plugins?: Plugin<T>[]
}

/**
 * Internal kernel options (with defaults applied)
 */
export interface KernelOptions<T> {
  initialState: T
  strategy: StrategyName
  limit: number
  plugins: Plugin<T>[]
}

/**
 * The main kernel interface
 */
export interface Kernel<T = unknown> {
  // State management
  /** Get current state */
  getState(): T
  /** Set state directly (use with caution) */
  setState(state: T): void
  /** Get the initial state */
  getInitialState(): T

  // History operations
  /** Push a new state to history */
  push(state: T, metadata?: EntryMetadata): void
  /** Undo to previous state */
  undo(): T | null
  /** Redo to next state */
  redo(): T | null
  /** Check if undo is possible */
  canUndo(): boolean
  /** Check if redo is possible */
  canRedo(): boolean

  // History access
  /** Get the complete history stack */
  getHistory(): HistoryStack<T>
  /** Get current position in history */
  getPosition(): number
  /** Get total number of entries */
  getLength(): number
  /** Clear all history */
  clear(): void
  /** Go to a specific position */
  goTo(position: number): T | null

  // Strategy
  /** Set the current strategy */
  setStrategy(strategy: Strategy<T>): void
  /** Get the current strategy */
  getStrategy(): Strategy<T>

  // Plugin management
  /** Register a plugin */
  register(plugin: Plugin<T>): void
  /** Unregister a plugin by name */
  unregister(pluginName: string): void
  /** Get a plugin by name */
  getPlugin<P extends Plugin<T>>(name: string): P | undefined
  /** List all registered plugins */
  listPlugins(): PluginInfo[]

  // Event system
  /** Emit an event */
  emit(event: KernelEvent<T>): void
  /** Subscribe to an event type */
  on(eventType: EventType, handler: EventHandler<T>): Unsubscribe
  /** Unsubscribe from an event type */
  off(eventType: EventType, handler: EventHandler<T>): void

  // Configuration
  /** Update configuration */
  configure(options: Partial<KernelOptions<T>>): void
  /** Get current configuration */
  getOptions(): KernelOptions<T>

  // Lifecycle
  /** Destroy the kernel and cleanup */
  destroy(): void
  /** Check if kernel is destroyed */
  isDestroyed(): boolean
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

/**
 * Extract API type from plugin
 */
export type PluginAPI<P extends Plugin> = P extends { api: infer A } ? A : never
