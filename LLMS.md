# @oxog/statekeeper - LLM Documentation

> Zero-dependency undo/redo history manager with micro-kernel plugin architecture

**Version:** 1.0.0
**License:** MIT
**Repository:** https://github.com/ersinkoc/StateKeeper
**Author:** Ersin KOC

---

## Quick Reference

### Installation

```bash
npm install @oxog/statekeeper
# or
yarn add @oxog/statekeeper
# or
pnpm add @oxog/statekeeper
```

### Quick Start

```typescript
import { createHistory } from '@oxog/statekeeper'

// Create a history manager
const history = createHistory({ initialState: { count: 0 } })

// Make changes
history.push({ count: 1 })
history.push({ count: 2 })

// Undo/Redo
history.undo() // { count: 1 }
history.redo() // { count: 2 }
```

---

## Package Overview

### Purpose

StateKeeper is a powerful and flexible history management library that provides undo/redo functionality for any JavaScript application. It enables developers to track state changes, navigate through history, and implement time-travel debugging. Built on a micro-kernel architecture with zero runtime dependencies.

### Key Features

- **Zero Dependencies**: No external runtime dependencies
- **Multiple Strategies**: Choose between Snapshot, Command, or Patch strategies
- **Micro-Kernel Architecture**: Extend functionality with plugins
- **Framework Agnostic**: Works with vanilla JS, React, Vue, Svelte, or any framework
- **Full TypeScript Support**: Written in TypeScript with strict mode
- **Tree-Shakeable**: Only bundle what you use
- **Event System**: Subscribe to state changes and history events
- **Configurable Limits**: Control memory usage with history limits

### Architecture

StateKeeper uses a micro-kernel architecture consisting of:
1. **Kernel**: Core history management and state tracking
2. **Strategies**: Pluggable history storage mechanisms (Snapshot, Command, Patch)
3. **Event Bus**: Event emission and subscription system
4. **Plugin Registry**: Plugin management and lifecycle hooks
5. **History Stack**: Entry storage with branching support

### Dependencies

- **Runtime:** Zero runtime dependencies
- **Peer (Optional):** React >=17.0.0, Vue >=3.0.0, Svelte >=3.0.0

---

## API Reference

### Exports Summary

| Export | Type | Description |
|--------|------|-------------|
| `createHistory` | function | Main factory function to create history instances |
| `StateKeeperKernel` | class | Core kernel class for advanced usage |
| `SnapshotStrategy` | class | Strategy that stores complete state copies |
| `CommandStrategy` | class | Strategy that stores executable commands |
| `PatchStrategy` | class | Strategy that stores JSON Patch diffs |
| `createSnapshotStrategy` | function | Factory for snapshot strategy |
| `createCommandStrategy` | function | Factory for command strategy |
| `createPatchStrategy` | function | Factory for patch strategy |
| `defineCommand` | function | Helper to define type-safe commands |
| `deepClone` | function | Deep clone with circular reference support |
| `deepEqual` | function | Deep equality comparison |
| `diff` | function | Generate RFC 6902 JSON Patch |
| `applyPatch` | function | Apply JSON Patch operations |
| `compress` | function | LZ-string compression |
| `decompress` | function | LZ-string decompression |
| `uid` | function | Generate unique IDs |
| `parseShortcut` | function | Parse keyboard shortcut strings |
| `matchShortcut` | function | Match keyboard events to shortcuts |
| `VERSION` | constant | Current package version |

---

### Functions

#### `createHistory<T>(options)`

Creates a history manager instance. This is the main entry point for using StateKeeper.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `options` | `CreateHistoryOptions<T>` | Yes | - | Configuration options |

**Options Interface:**

```typescript
interface CreateHistoryOptions<T> {
  /** Initial state (required) */
  initialState: T
  /** Strategy: 'snapshot' | 'command' | 'patch' */
  strategy?: StrategyName
  /** Maximum history entries (default: 100) */
  limit?: number
  /** Plugins to register */
  plugins?: Plugin<T>[]
}
```

**Returns:** `Kernel<T>` - The history kernel instance

**Examples:**

```typescript
// Basic usage with snapshot strategy (default)
const history = createHistory({ initialState: { count: 0 } })

// With command strategy
const history = createHistory({
  initialState: { count: 0 },
  strategy: 'command'
})

// With patch strategy and custom limit
const history = createHistory({
  initialState: { count: 0, items: [] },
  strategy: 'patch',
  limit: 50
})

// With plugins
const history = createHistory({
  initialState: { count: 0 },
  plugins: [myPlugin]
})
```

---

#### `defineCommand<T, P>(command)`

Helper function to define type-safe commands for the command strategy.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `command` | `Command<T, P>` | Yes | Command definition object |

**Command Interface:**

```typescript
interface Command<T, P = unknown> {
  /** Unique command name */
  name: string
  /** Execute and return new state */
  execute: (state: T, payload: P) => T
  /** Undo and return previous state */
  undo: (state: T, payload: P, previousState?: T) => T
  /** Optional custom redo (defaults to execute) */
  redo?: (state: T, payload: P) => T
}
```

**Returns:** `Command<T, P>` - The command object

**Example:**

```typescript
import { createHistory, defineCommand } from '@oxog/statekeeper'

interface State {
  count: number
}

const incrementCommand = defineCommand<State, number>({
  name: 'increment',
  execute: (state, amount) => ({
    ...state,
    count: state.count + amount
  }),
  undo: (state, amount) => ({
    ...state,
    count: state.count - amount
  })
})

const history = createHistory({
  initialState: { count: 0 },
  strategy: 'command'
})

// Register and use command
const strategy = history.getStrategy() as CommandStrategy<State>
strategy.registerCommand(incrementCommand)
const newState = strategy.execute(incrementCommand, 5, history.getState())
history.push(newState)
```

---

### Classes

#### `StateKeeperKernel<T>`

The core kernel class implementing the `Kernel<T>` interface. Usually created via `createHistory()`.

**Constructor:**

```typescript
new StateKeeperKernel<T>(strategy: Strategy<T>, options: KernelOptions<T>)
```

---

### Kernel Interface (Kernel<T>)

The main interface for history management operations.

#### State Management Methods

##### `.getState(): T`

Returns the current state.

```typescript
const state = history.getState()
console.log(state) // { count: 0 }
```

##### `.setState(state: T): void`

Sets state directly without creating a history entry. Use with caution.

```typescript
history.setState({ count: 10 })
// Note: This bypasses history tracking
```

##### `.getInitialState(): T`

Returns the initial state provided during creation.

```typescript
const initial = history.getInitialState()
```

#### History Operations

##### `.push(state: T, metadata?: EntryMetadata): void`

Pushes a new state to history.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | `T` | Yes | New state to push |
| `metadata` | `EntryMetadata` | No | Optional metadata |

**Metadata Interface:**

```typescript
interface EntryMetadata {
  name?: string
  description?: string
  custom?: Record<string, unknown>
}
```

**Example:**

```typescript
// Simple push
history.push({ count: 1 })

// With metadata
history.push({ count: 2 }, {
  name: 'Increment',
  description: 'User clicked increment button',
  custom: { userId: '123' }
})
```

##### `.undo(): T | null`

Undoes the last action and returns the new state, or `null` if cannot undo.

```typescript
if (history.canUndo()) {
  const newState = history.undo()
  console.log('Undone to:', newState)
}
```

##### `.redo(): T | null`

Redoes the next action and returns the new state, or `null` if cannot redo.

```typescript
if (history.canRedo()) {
  const newState = history.redo()
  console.log('Redone to:', newState)
}
```

##### `.canUndo(): boolean`

Returns `true` if undo is possible.

```typescript
const undoButton = document.getElementById('undo')
undoButton.disabled = !history.canUndo()
```

##### `.canRedo(): boolean`

Returns `true` if redo is possible.

```typescript
const redoButton = document.getElementById('redo')
redoButton.disabled = !history.canRedo()
```

##### `.clear(): void`

Clears all history and resets to initial state.

```typescript
history.clear()
console.log(history.getState()) // Initial state
console.log(history.getLength()) // 0
```

##### `.goTo(position: number): T | null`

Jumps to a specific position in history. Position -1 represents the initial state.

```typescript
history.push({ count: 1 })
history.push({ count: 2 })
history.push({ count: 3 })

history.goTo(1) // Go to position 1
console.log(history.getState()) // { count: 2 }

history.goTo(-1) // Go to initial state
console.log(history.getState()) // { count: 0 }
```

#### History Access

##### `.getHistory(): HistoryStack<T>`

Returns the complete history stack.

**HistoryStack Interface:**

```typescript
interface HistoryStack<T> {
  entries: HistoryEntry<T>[]
  position: number
  branches: Branch<T>[]
  currentBranch: string
}

interface HistoryEntry<T> {
  id: UID
  timestamp: number
  state: T
  command?: CommandEntry
  patches?: Patch[]
  inversePatches?: Patch[]
  groupId?: string
  metadata?: EntryMetadata
}
```

**Example:**

```typescript
const stack = history.getHistory()
console.log('Total entries:', stack.entries.length)
console.log('Current position:', stack.position)

stack.entries.forEach((entry, i) => {
  console.log(`[${i}] ${entry.metadata?.name || 'unnamed'} at ${new Date(entry.timestamp)}`)
})
```

##### `.getPosition(): number`

Returns current position in history (-1 = initial state, 0 = first entry).

```typescript
console.log(history.getPosition()) // -1 (no entries yet)
history.push({ count: 1 })
console.log(history.getPosition()) // 0
```

##### `.getLength(): number`

Returns total number of history entries.

```typescript
console.log(history.getLength()) // 0
history.push({ count: 1 })
history.push({ count: 2 })
console.log(history.getLength()) // 2
```

#### Event System

##### `.on(eventType: EventType, handler: EventHandler<T>): Unsubscribe`

Subscribes to events. Returns an unsubscribe function.

**Event Types:**

| Event | Description |
|-------|-------------|
| `push` | Emitted when state is pushed |
| `undo` | Emitted when undo is performed |
| `redo` | Emitted when redo is performed |
| `state-change` | Emitted on any state change |
| `clear` | Emitted when history is cleared |
| `limit-reached` | Emitted when history limit is reached |
| `destroy` | Emitted when kernel is destroyed |
| `plugin-registered` | Emitted when a plugin is registered |
| `plugin-unregistered` | Emitted when a plugin is unregistered |

**Example:**

```typescript
// Subscribe to state changes
const unsubscribe = history.on('state-change', (event) => {
  console.log('State changed:', event.state)
  console.log('Previous state:', event.prevState)
  console.log('Source:', event.source) // 'push' | 'undo' | 'redo' | 'set' | 'goto' | 'clear'
})

// Subscribe to push events
history.on('push', (event) => {
  console.log('New entry:', event.entry)
})

// Subscribe to limit reached
history.on('limit-reached', (event) => {
  console.log('Dropped entry due to limit:', event.droppedEntry)
})

// Unsubscribe when done
unsubscribe()
```

##### `.off(eventType: EventType, handler: EventHandler<T>): void`

Unsubscribes a handler from events.

```typescript
const handler = (event) => console.log(event)
history.on('state-change', handler)
// Later...
history.off('state-change', handler)
```

##### `.emit(event: KernelEvent<T>): void`

Emits an event. Primarily for internal use and plugins.

#### Strategy Management

##### `.getStrategy(): Strategy<T>`

Returns the current strategy instance.

```typescript
const strategy = history.getStrategy()
console.log(strategy.name) // 'snapshot' | 'command' | 'patch'
```

##### `.setStrategy(strategy: Strategy<T>): void`

Sets a new strategy. Use with caution - may require clearing history.

```typescript
import { createPatchStrategy } from '@oxog/statekeeper'

const newStrategy = createPatchStrategy()
history.setStrategy(newStrategy)
```

#### Plugin Management

##### `.register(plugin: Plugin<T>): void`

Registers a plugin.

```typescript
history.register(myPlugin)
```

##### `.unregister(pluginName: string): void`

Unregisters a plugin by name.

```typescript
history.unregister('my-plugin')
```

##### `.getPlugin<P>(name: string): P | undefined`

Gets a plugin by name.

```typescript
const plugin = history.getPlugin('my-plugin')
```

##### `.listPlugins(): PluginInfo[]`

Lists all registered plugins.

```typescript
const plugins = history.listPlugins()
plugins.forEach(p => {
  console.log(`${p.name} v${p.version} - ${p.enabled ? 'enabled' : 'disabled'}`)
})
```

#### Configuration

##### `.configure(options: Partial<KernelOptions<T>>): void`

Updates kernel configuration.

```typescript
// Change history limit
history.configure({ limit: 200 })
```

##### `.getOptions(): KernelOptions<T>`

Returns current configuration.

```typescript
const options = history.getOptions()
console.log('Limit:', options.limit)
console.log('Strategy:', options.strategy)
```

#### Lifecycle

##### `.destroy(): void`

Destroys the kernel and cleans up resources.

```typescript
history.destroy()
// All event handlers are removed
// All plugins are unregistered
```

##### `.isDestroyed(): boolean`

Checks if kernel is destroyed.

```typescript
if (history.isDestroyed()) {
  console.log('Kernel has been destroyed')
}
```

**Error Handling:**

After destruction, any method call will throw:
```typescript
history.destroy()
history.push({ count: 1 }) // Throws: "Cannot use destroyed kernel"
```

---

### Strategies

#### Snapshot Strategy

Stores complete state copies. Simple and fast for small to medium state.

```typescript
import { createSnapshotStrategy } from '@oxog/statekeeper'

const strategy = createSnapshotStrategy({
  deepClone: true,  // Use deep clone (default: true)
  cloneFunction: (state) => structuredClone(state) // Custom clone
})
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `deepClone` | `boolean` | `true` | Use deep cloning |
| `cloneFunction` | `function` | `deepClone` | Custom clone function |

**Pros:**
- Simple to understand and debug
- Fast undo/redo operations
- Works with any state structure

**Cons:**
- Higher memory usage for large states

---

#### Command Strategy

Stores executable commands with undo/redo logic. Most memory efficient.

```typescript
import { createCommandStrategy, defineCommand } from '@oxog/statekeeper'

const strategy = createCommandStrategy({
  storeInitialState: true // Store prev state for undo (default: true)
})

// Register commands
strategy.registerCommand(myCommand)

// Get registered commands
const commands = strategy.listCommands() // ['increment', 'decrement', ...]
const cmd = strategy.getCommand('increment')

// Execute command
const newState = strategy.execute(myCommand, payload, currentState)
```

**Additional Methods:**

| Method | Description |
|--------|-------------|
| `registerCommand(command)` | Register a command |
| `getCommand(name)` | Get command by name |
| `listCommands()` | List all command names |
| `execute(command, payload, state)` | Execute a command |
| `createCommandEntry(...)` | Create a history entry for a command |

**Pros:**
- Most memory efficient
- Explicit intent tracking
- Easy to debug and log

**Cons:**
- Requires command definitions
- More setup code

---

#### Patch Strategy

Stores diffs using RFC 6902 JSON Patch. Efficient for large states with small changes.

```typescript
import { createPatchStrategy } from '@oxog/statekeeper'

const strategy = createPatchStrategy({
  diffFunction: customDiff,   // Custom diff function
  patchFunction: customPatch  // Custom patch function
})

// Additional methods
const patches = strategy.getPatches(entry)
const inverse = strategy.getInversePatches(entry)
const result = strategy.applyPatches(state, patches)
const diff = strategy.createPatch(prevState, nextState)
```

**Patch Operations (RFC 6902):**

| Operation | Description |
|-----------|-------------|
| `add` | Add a value at a path |
| `remove` | Remove a value at a path |
| `replace` | Replace a value at a path |
| `move` | Move a value from one path to another |
| `copy` | Copy a value from one path to another |
| `test` | Test that a value equals expected |

**Pros:**
- Memory efficient for large states
- Automatic diff calculation
- Small payload for persistence

**Cons:**
- Slower than snapshot for small states
- More complex debugging

---

### Utility Functions

#### `deepClone<T>(value: T): T`

Deep clones any value, handling special types and circular references.

**Supported Types:**
- Primitives (string, number, boolean, null, undefined)
- Date, RegExp
- Map, Set
- ArrayBuffer, TypedArrays, DataView
- Arrays, Objects
- Circular references

```typescript
import { deepClone } from '@oxog/statekeeper'

const original = { a: 1, b: { c: 2 }, d: new Date() }
const cloned = deepClone(original)

cloned.b.c = 3
console.log(original.b.c) // Still 2
```

---

#### `deepEqual(a: unknown, b: unknown): boolean`

Deep equality comparison with circular reference support.

```typescript
import { deepEqual } from '@oxog/statekeeper'

deepEqual({ a: 1 }, { a: 1 }) // true
deepEqual([1, 2, 3], [1, 2, 3]) // true
deepEqual(NaN, NaN) // true (special case)
deepEqual(new Date('2024-01-01'), new Date('2024-01-01')) // true
```

---

#### `diff<T>(prev: T, next: T): Patch[]`

Generates RFC 6902 JSON Patch from two values.

```typescript
import { diff } from '@oxog/statekeeper'

const patches = diff(
  { count: 1, name: 'old' },
  { count: 2, name: 'old', added: true }
)
// [
//   { op: 'replace', path: '/count', value: 2 },
//   { op: 'add', path: '/added', value: true }
// ]
```

---

#### `applyPatch<T>(target: T, patches: Patch[]): T`

Applies JSON Patch operations to a value (immutable).

```typescript
import { applyPatch } from '@oxog/statekeeper'

const state = { count: 1 }
const newState = applyPatch(state, [
  { op: 'replace', path: '/count', value: 2 }
])
// newState: { count: 2 }
// state is unchanged
```

---

#### `createInversePatch(patch: Patch, originalTarget: unknown): Patch`

Creates an inverse patch for undo operations.

```typescript
import { createInversePatch } from '@oxog/statekeeper'

const patch = { op: 'replace', path: '/count', value: 2 }
const inverse = createInversePatch(patch, { count: 1 })
// { op: 'replace', path: '/count', value: 1 }
```

---

#### `createInversePatches(patches: Patch[], originalTarget: unknown): Patch[]`

Creates inverse patches for an array of patches (in reverse order for proper undo).

---

#### `compress(input: string): string`

Compresses a string using LZ-based compression.

```typescript
import { compress, decompress } from '@oxog/statekeeper'

const compressed = compress(JSON.stringify(largeState))
const original = decompress(compressed)
const state = JSON.parse(original)
```

---

#### `decompress(compressed: string): string`

Decompresses an LZ-compressed string.

---

#### `uid(): string`

Generates a unique identifier.

```typescript
import { uid } from '@oxog/statekeeper'

const id = uid() // e.g., "abc123xyz"
```

---

#### `parseShortcut(shortcut: string): ShortcutDefinition`

Parses a keyboard shortcut string.

```typescript
import { parseShortcut } from '@oxog/statekeeper'

const def = parseShortcut('ctrl+z')
// { ctrl: true, alt: false, shift: false, meta: false, key: 'z' }

const def2 = parseShortcut('cmd+shift+z')
// { ctrl: false, alt: false, shift: true, meta: true, key: 'z' }
```

**Recognized Modifiers:**
- `ctrl`, `control`
- `alt`, `option`
- `shift`
- `meta`, `cmd`, `command`, `win`

---

#### `matchShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition | string): boolean`

Checks if a keyboard event matches a shortcut.

```typescript
import { matchShortcut } from '@oxog/statekeeper'

document.addEventListener('keydown', (e) => {
  if (matchShortcut(e, 'ctrl+z')) {
    e.preventDefault()
    history.undo()
  }
  if (matchShortcut(e, 'ctrl+shift+z')) {
    e.preventDefault()
    history.redo()
  }
})
```

---

#### `matchAnyShortcut(event: KeyboardEvent, shortcuts: string[]): boolean`

Checks if an event matches any shortcut in the array.

```typescript
import { matchAnyShortcut } from '@oxog/statekeeper'

if (matchAnyShortcut(e, ['ctrl+z', 'cmd+z'])) {
  history.undo()
}
```

---

#### `formatShortcut(definition: ShortcutDefinition | string): string`

Formats a shortcut for display (platform-aware).

```typescript
import { formatShortcut } from '@oxog/statekeeper'

formatShortcut('ctrl+z') // "Ctrl+Z"
formatShortcut('meta+z') // "Cmd+Z" on Mac, "Win+Z" on Windows
```

---

#### Path Utilities

```typescript
import { escapeKey, unescapeKey, parsePath } from '@oxog/statekeeper'

// Escape special characters for JSON Pointer (RFC 6901)
escapeKey('a/b') // 'a~1b'
escapeKey('a~b') // 'a~0b'

// Unescape
unescapeKey('a~1b') // 'a/b'

// Parse path into segments
parsePath('/users/0/name') // ['users', '0', 'name']
```

---

### Types & Interfaces

#### Core Types

```typescript
/** Unique identifier type */
type UID = string

/** Unsubscribe function from events */
type Unsubscribe = () => void

/** Strategy names */
type StrategyName = 'snapshot' | 'command' | 'patch'

/** Event types */
type EventType =
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

/** State change sources */
type StateChangeSource = 'push' | 'undo' | 'redo' | 'set' | 'goto' | 'clear'
```

---

#### History Entry

```typescript
interface HistoryEntry<T> {
  /** Unique identifier */
  id: UID
  /** Creation timestamp */
  timestamp: number
  /** State snapshot */
  state: T
  /** Command info (command strategy) */
  command?: CommandEntry
  /** Patches (patch strategy) */
  patches?: Patch[]
  /** Inverse patches for undo */
  inversePatches?: Patch[]
  /** Group ID if part of a group */
  groupId?: string
  /** Additional metadata */
  metadata?: EntryMetadata
}

interface CommandEntry {
  name: string
  payload: unknown
  previousState?: unknown
}

interface EntryMetadata {
  name?: string
  description?: string
  custom?: Record<string, unknown>
}
```

---

#### Patch Types

```typescript
type PatchOperation = 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'

interface Patch {
  op: PatchOperation
  path: string
  value?: unknown
  from?: string
}
```

---

#### Plugin Types

```typescript
interface Plugin<T = unknown> {
  readonly name: string
  readonly version: string
  readonly type: PluginType
  install(kernel: Kernel<T>): void
  uninstall(): void
  hooks?: PluginHooks<T>
  api?: Record<string, unknown>
}

type PluginType = 'core' | 'optional'

interface PluginHooks<T> {
  beforePush?: (state: T, prevState: T) => T | false
  afterPush?: (entry: HistoryEntry<T>) => void
  beforeUndo?: (entry: HistoryEntry<T>) => boolean
  afterUndo?: (state: T, entry: HistoryEntry<T>) => void
  beforeRedo?: (entry: HistoryEntry<T>) => boolean
  afterRedo?: (state: T, entry: HistoryEntry<T>) => void
  onStateChange?: (state: T, prevState: T) => void
  onClear?: () => void
}

interface PluginInfo {
  name: string
  version: string
  type: PluginType
  enabled: boolean
}
```

---

#### Event Types

```typescript
interface PushEvent<T> {
  type: 'push'
  timestamp: number
  entry: HistoryEntry<T>
  state: T
  prevState: T
}

interface UndoEvent<T> {
  type: 'undo'
  timestamp: number
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

interface RedoEvent<T> {
  type: 'redo'
  timestamp: number
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

interface StateChangeEvent<T> {
  type: 'state-change'
  timestamp: number
  state: T
  prevState: T
  source: StateChangeSource
}

interface ClearEvent {
  type: 'clear'
  timestamp: number
}

interface LimitReachedEvent<T> {
  type: 'limit-reached'
  timestamp: number
  limit: number
  droppedEntry: HistoryEntry<T>
}

interface DestroyEvent {
  type: 'destroy'
  timestamp: number
}
```

---

## Usage Patterns

### Pattern 1: Basic Undo/Redo

**Use Case:** Simple state tracking with undo/redo capability.

```typescript
import { createHistory } from '@oxog/statekeeper'

interface AppState {
  count: number
  text: string
}

const history = createHistory<AppState>({
  initialState: { count: 0, text: '' }
})

// Track changes
function updateCount(newCount: number) {
  history.push({ ...history.getState(), count: newCount })
}

function updateText(newText: string) {
  history.push({ ...history.getState(), text: newText })
}

// Undo/redo
function undo() {
  if (history.canUndo()) {
    history.undo()
  }
}

function redo() {
  if (history.canRedo()) {
    history.redo()
  }
}
```

---

### Pattern 2: Command Pattern

**Use Case:** Explicit operations with type-safe payloads.

```typescript
import { createHistory, defineCommand, CommandStrategy } from '@oxog/statekeeper'

interface State {
  items: string[]
}

const addItem = defineCommand<State, string>({
  name: 'addItem',
  execute: (state, item) => ({
    items: [...state.items, item]
  }),
  undo: (state, item) => ({
    items: state.items.filter(i => i !== item)
  })
})

const removeItem = defineCommand<State, number>({
  name: 'removeItem',
  execute: (state, index) => ({
    items: state.items.filter((_, i) => i !== index)
  }),
  undo: (state, index, prevState) => prevState || state
})

const history = createHistory<State>({
  initialState: { items: [] },
  strategy: 'command'
})

const strategy = history.getStrategy() as CommandStrategy<State>
strategy.registerCommand(addItem)
strategy.registerCommand(removeItem)

// Execute commands
function executeAddItem(item: string) {
  const newState = strategy.execute(addItem, item, history.getState())
  history.push(newState)
}
```

---

### Pattern 3: Large State with Patches

**Use Case:** Large state objects where only small portions change.

```typescript
import { createHistory } from '@oxog/statekeeper'

interface LargeState {
  users: Record<string, { name: string; email: string }>
  products: Record<string, { title: string; price: number }>
  settings: Record<string, unknown>
}

const history = createHistory<LargeState>({
  initialState: {
    users: {},
    products: {},
    settings: {}
  },
  strategy: 'patch',
  limit: 100
})

// Only the diff is stored, not the entire state
function updateUserEmail(userId: string, email: string) {
  const state = history.getState()
  history.push({
    ...state,
    users: {
      ...state.users,
      [userId]: { ...state.users[userId], email }
    }
  })
}
```

---

### Pattern 4: Event-Driven UI Updates

**Use Case:** Reactively update UI based on state changes.

```typescript
import { createHistory } from '@oxog/statekeeper'

const history = createHistory({ initialState: { value: 0 } })

// Subscribe to all state changes
history.on('state-change', (event) => {
  updateUI(event.state)
  updateUndoRedoButtons(history.canUndo(), history.canRedo())
})

// Track specific events
history.on('push', (event) => {
  console.log('New action:', event.entry.metadata?.name)
})

history.on('limit-reached', (event) => {
  console.log('Oldest entry removed:', event.droppedEntry)
})
```

---

### Pattern 5: Keyboard Shortcuts

**Use Case:** Implement standard undo/redo keyboard shortcuts.

```typescript
import { createHistory, matchShortcut } from '@oxog/statekeeper'

const history = createHistory({ initialState: { count: 0 } })

document.addEventListener('keydown', (e) => {
  // Ctrl+Z or Cmd+Z for undo
  if (matchShortcut(e, 'ctrl+z') || matchShortcut(e, 'meta+z')) {
    e.preventDefault()
    history.undo()
  }

  // Ctrl+Shift+Z or Cmd+Shift+Z for redo
  if (matchShortcut(e, 'ctrl+shift+z') || matchShortcut(e, 'meta+shift+z')) {
    e.preventDefault()
    history.redo()
  }

  // Ctrl+Y for redo (Windows style)
  if (matchShortcut(e, 'ctrl+y')) {
    e.preventDefault()
    history.redo()
  }
})
```

---

### Pattern 6: Creating a Plugin

**Use Case:** Extend StateKeeper with custom functionality.

```typescript
import type { Plugin, Kernel, HistoryEntry } from '@oxog/statekeeper'

interface LoggerPluginAPI {
  getLogs(): string[]
  clearLogs(): void
}

function createLoggerPlugin<T>(): Plugin<T> & { api: LoggerPluginAPI } {
  const logs: string[] = []

  return {
    name: 'logger',
    version: '1.0.0',
    type: 'optional',

    install(kernel: Kernel<T>) {
      console.log('Logger plugin installed')
    },

    uninstall() {
      logs.length = 0
      console.log('Logger plugin uninstalled')
    },

    hooks: {
      afterPush(entry: HistoryEntry<T>) {
        logs.push(`[${new Date(entry.timestamp).toISOString()}] Push: ${entry.metadata?.name || 'unnamed'}`)
      },
      afterUndo(state: T, entry: HistoryEntry<T>) {
        logs.push(`[${new Date().toISOString()}] Undo: ${entry.metadata?.name || 'unnamed'}`)
      },
      afterRedo(state: T, entry: HistoryEntry<T>) {
        logs.push(`[${new Date().toISOString()}] Redo: ${entry.metadata?.name || 'unnamed'}`)
      }
    },

    api: {
      getLogs: () => [...logs],
      clearLogs: () => { logs.length = 0 }
    }
  }
}

// Usage
const logger = createLoggerPlugin()
const history = createHistory({
  initialState: { count: 0 },
  plugins: [logger]
})

// Access plugin API
const loggerPlugin = history.getPlugin<typeof logger>('logger')
console.log(loggerPlugin?.api.getLogs())
```

---

## Integration Examples

### With React

```tsx
import { createHistory } from '@oxog/statekeeper'
import { useState, useEffect, useCallback } from 'react'

interface State {
  count: number
}

function useStateKeeper<T>(initialState: T) {
  const [history] = useState(() => createHistory({ initialState }))
  const [state, setState] = useState(history.getState())
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    const unsubscribe = history.on('state-change', (event) => {
      setState(event.state)
      setCanUndo(history.canUndo())
      setCanRedo(history.canRedo())
    })
    return () => {
      unsubscribe()
      history.destroy()
    }
  }, [history])

  const push = useCallback((newState: T) => {
    history.push(newState)
  }, [history])

  const undo = useCallback(() => history.undo(), [history])
  const redo = useCallback(() => history.redo(), [history])

  return { state, push, undo, redo, canUndo, canRedo }
}

function Counter() {
  const { state, push, undo, redo, canUndo, canRedo } = useStateKeeper({ count: 0 })

  return (
    <div>
      <h1>{state.count}</h1>
      <button onClick={() => push({ count: state.count + 1 })}>+</button>
      <button onClick={() => push({ count: state.count - 1 })}>-</button>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  )
}
```

---

### With Vue 3

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createHistory, type Kernel } from '@oxog/statekeeper'

interface State {
  count: number
}

const history = createHistory<State>({ initialState: { count: 0 } })
const state = ref(history.getState())
const canUndo = ref(false)
const canRedo = ref(false)

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = history.on('state-change', (event) => {
    state.value = event.state
    canUndo.value = history.canUndo()
    canRedo.value = history.canRedo()
  })
})

onUnmounted(() => {
  unsubscribe?.()
  history.destroy()
})

const increment = () => history.push({ count: state.value.count + 1 })
const decrement = () => history.push({ count: state.value.count - 1 })
const undo = () => history.undo()
const redo = () => history.redo()
</script>

<template>
  <div>
    <h1>{{ state.count }}</h1>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
    <button @click="undo" :disabled="!canUndo">Undo</button>
    <button @click="redo" :disabled="!canRedo">Redo</button>
  </div>
</template>
```

---

### With Node.js

```typescript
import { createHistory, compress, decompress } from '@oxog/statekeeper'
import { readFile, writeFile } from 'fs/promises'

interface DocumentState {
  content: string
  version: number
}

const history = createHistory<DocumentState>({
  initialState: { content: '', version: 0 },
  limit: 50
})

// Auto-save to file
history.on('state-change', async (event) => {
  const serialized = JSON.stringify(history.getHistory())
  const compressed = compress(serialized)
  await writeFile('history-backup.dat', compressed)
})

// Restore from file
async function restoreHistory() {
  try {
    const compressed = await readFile('history-backup.dat', 'utf-8')
    const serialized = decompress(compressed)
    const stack = JSON.parse(serialized)
    // Restore logic here
  } catch {
    console.log('No backup found')
  }
}
```

---

## Error Reference

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot use destroyed kernel` | Calling methods after `destroy()` | Check `isDestroyed()` before operations |
| `Unknown strategy: X` | Invalid strategy name in options | Use 'snapshot', 'command', or 'patch' |
| `Use executeCommand to create command entries` | Using `createEntry` with command strategy | Use `createCommandEntry` method instead |
| `Command "X" is not registered` | Executing unregistered command | Register command with `registerCommand()` |
| `Entry is not a command entry` | Applying undo/redo on non-command entry | Ensure entry was created with command strategy |
| `Entry does not have patches` | Applying patch operations on non-patch entry | Ensure entry was created with patch strategy |
| `Cannot remove root` | Trying to remove root with JSON Patch | Use 'replace' operation for root changes |
| `Test failed at path X` | JSON Patch test operation failed | Value at path doesn't match expected |

---

## TypeScript Support

### Type Imports

```typescript
import type {
  // Core types
  Kernel,
  CreateHistoryOptions,
  KernelOptions,

  // History types
  HistoryStack,
  HistoryEntry,
  EntryMetadata,
  Branch,

  // Strategy types
  Strategy,
  StrategyName,
  Command,

  // Patch types
  Patch,
  PatchOperation,

  // Event types
  EventType,
  EventHandler,
  KernelEvent,
  StateChangeEvent,
  PushEvent,
  UndoEvent,
  RedoEvent,

  // Plugin types
  Plugin,
  PluginType,
  PluginHooks,
  PluginInfo,

  // Utility types
  UID,
  Unsubscribe,
  DeepPartial,
  PluginAPI,
  ShortcutDefinition
} from '@oxog/statekeeper'
```

### Generic Usage

```typescript
// Define your state type
interface MyState {
  user: { name: string; age: number }
  items: string[]
}

// History is fully typed
const history = createHistory<MyState>({
  initialState: { user: { name: '', age: 0 }, items: [] }
})

// TypeScript knows the state shape
const state = history.getState()
state.user.name // string
state.items // string[]

// Events are typed
history.on('state-change', (event) => {
  event.state.user.name // string
  event.prevState.items // string[]
})
```

---

## Performance Considerations

### Strategy Selection Guide

| Scenario | Recommended Strategy |
|----------|---------------------|
| Small state (< 100 properties) | Snapshot |
| Large state, small changes | Patch |
| Need explicit action tracking | Command |
| Debugging/logging important | Command |
| Memory constrained | Patch or Command |
| Simple use case | Snapshot |

### Optimization Tips

1. **Set appropriate limits:**
   ```typescript
   createHistory({ initialState, limit: 50 }) // Don't keep more than needed
   ```

2. **Use patch strategy for large state:**
   ```typescript
   createHistory({ initialState: largeState, strategy: 'patch' })
   ```

3. **Unsubscribe from events when done:**
   ```typescript
   const unsub = history.on('state-change', handler)
   // Later...
   unsub()
   ```

4. **Destroy when no longer needed:**
   ```typescript
   history.destroy() // Frees all resources
   ```

5. **Use metadata sparingly:**
   ```typescript
   // Only add metadata when useful for debugging
   history.push(state, { name: 'Critical Action' })
   ```

### Bundle Size

- **Full package:** ~15KB (minified)
- **Gzipped:** ~5KB
- **Tree-shakeable:** Yes

---

## Changelog (Recent)

### v1.0.0 (2025-12-28)

- Initial release
- Zero-dependency core
- Three strategies: Snapshot, Command, Patch
- Micro-kernel plugin architecture
- Full TypeScript support
- Event system for state tracking
- Utility functions (deepClone, diff, compress)
- Keyboard shortcut utilities

---

## Links

- **NPM:** https://www.npmjs.com/package/@oxog/statekeeper
- **GitHub:** https://github.com/ersinkoc/StateKeeper
- **Documentation:** https://statekeeper.oxog.dev
- **Issues:** https://github.com/ersinkoc/StateKeeper/issues
- **Changelog:** https://github.com/ersinkoc/StateKeeper/blob/main/CHANGELOG.md

---

## LLM Usage Notes

### Recommended Prompts

When helping users with this package, consider:

1. "Help me implement undo/redo using @oxog/statekeeper"
2. "What's the best strategy for my use case with StateKeeper?"
3. "How do I create a custom plugin for StateKeeper?"
4. "Debug this StateKeeper error: [error message]"
5. "How do I integrate StateKeeper with React/Vue/Svelte?"

### Common Misconceptions

1. **Misconception:** StateKeeper replaces state management libraries like Redux
   **Reality:** StateKeeper focuses on history/undo-redo, not state management. Use it alongside your state manager.

2. **Misconception:** Command strategy is always more efficient
   **Reality:** For small states with few changes, snapshot is faster. Command shines with memory constraints and explicit action tracking.

3. **Misconception:** You need the framework adapters to use StateKeeper
   **Reality:** The core API works with any framework. Adapters are convenience wrappers (coming in v1.1).

4. **Misconception:** `setState()` creates a history entry
   **Reality:** `setState()` bypasses history. Use `push()` to track changes.

### Code Generation Guidelines

When generating code for this package:

- Always import types separately with `import type { ... }`
- Use the latest API patterns (v1.0.0)
- Include error handling: check `canUndo()`/`canRedo()` before operations
- Always call `destroy()` when cleaning up
- Unsubscribe from events to prevent memory leaks
- Use appropriate strategy based on state size and use case

---

## Document Metadata

- **Generated:** 2025-12-28
- **Package Version:** 1.0.0
- **Documentation Version:** 1.0
- **Format:** LLM-Optimized Markdown
