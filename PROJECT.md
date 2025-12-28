# StateKeeper - Zero-Dependency Undo/Redo History Manager

## Package Identity

- **NPM Package**: `@oxog/statekeeper`
- **GitHub Repository**: `https://github.com/ersinkoc/statekeeper`
- **Documentation Site**: `https://statekeeper.oxog.dev`
- **License**: MIT
- **Author**: ersinkoc

**NO social media, Discord, email, or external links.**

## Package Description

Zero-dependency undo/redo history manager with micro-kernel plugin architecture.

StateKeeper is a powerful and flexible history management library that provides undo/redo functionality for any JavaScript application. Built on a micro-kernel architecture, it supports three different strategies (snapshot, command, patch), branching timelines, action grouping, persistence, time-travel debugging, and keyboard shortcuts. Framework-agnostic core with dedicated adapters for React, Vue, and Svelte—all without any runtime dependencies.

---

## NON-NEGOTIABLE RULES

These rules are ABSOLUTE and must be followed without exception:

### 1. ZERO DEPENDENCIES
```json
{
  "dependencies": {}  // MUST BE EMPTY - NO EXCEPTIONS
}
```
Implement EVERYTHING from scratch. No runtime dependencies allowed.

### 2. 100% TEST COVERAGE
- Every line of code must be tested
- Every branch must be tested
- All tests must pass (100% success rate)
- Use Vitest for testing

### 3. DEVELOPMENT WORKFLOW
Create these documents FIRST, before any code:
1. **SPECIFICATION.md** - Complete package specification
2. **IMPLEMENTATION.md** - Architecture and design decisions
3. **TASKS.md** - Ordered task list with dependencies

Only after these documents are complete, implement the code following TASKS.md sequentially.

### 4. TYPESCRIPT STRICT MODE
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### 5. NO EXTERNAL LINKS
- ❌ No social media (Twitter, LinkedIn, etc.)
- ❌ No Discord/Slack links
- ❌ No email addresses
- ❌ No donation/sponsor links
- ✅ Only GitHub repo and documentation site allowed

---

## ARCHITECTURE: MICRO-KERNEL + PLUGIN SYSTEM

### Kernel Responsibilities

```typescript
interface Kernel<T = unknown> {
  // State management
  getState(): T
  setState(state: T): void
  getInitialState(): T
  
  // History operations
  push(state: T): void
  undo(): T | null
  redo(): T | null
  canUndo(): boolean
  canRedo(): boolean
  
  // History access
  getHistory(): HistoryStack<T>
  getPosition(): number
  getLength(): number
  clear(): void
  
  // Strategy
  setStrategy(strategy: Strategy<T>): void
  getStrategy(): Strategy<T>
  
  // Plugin management
  register(plugin: Plugin<T>): void
  unregister(pluginName: string): void
  getPlugin<P extends Plugin<T>>(name: string): P | undefined
  listPlugins(): PluginInfo[]
  
  // Event system
  emit(event: KernelEvent<T>): void
  on(eventType: EventType, handler: EventHandler<T>): Unsubscribe
  off(eventType: EventType, handler: EventHandler<T>): void
  
  // Configuration
  configure(options: KernelOptions<T>): void
  getOptions(): KernelOptions<T>
}

interface HistoryStack<T> {
  entries: HistoryEntry<T>[]
  position: number
  branches: Branch<T>[]
  currentBranch: string
}

interface HistoryEntry<T> {
  id: string
  timestamp: number
  state: T                    // For snapshot
  command?: Command<T>        // For command
  patches?: Patch[]           // For patch
  groupId?: string
  metadata?: Record<string, unknown>
}

interface KernelOptions<T> {
  initialState: T
  strategy: 'snapshot' | 'command' | 'patch'
  limit?: number              // Max history entries
  plugins?: Plugin<T>[]
}
```

### Plugin Interface

```typescript
interface Plugin<T = unknown> {
  // Identity
  name: string
  version: string
  type: 'core' | 'optional'
  
  // Lifecycle
  install(kernel: Kernel<T>): void
  uninstall(): void
  
  // Hooks (all optional)
  hooks?: {
    beforePush?: (state: T, prevState: T) => T | false  // Can modify or cancel
    afterPush?: (entry: HistoryEntry<T>) => void
    beforeUndo?: (entry: HistoryEntry<T>) => boolean    // Can cancel
    afterUndo?: (state: T, entry: HistoryEntry<T>) => void
    beforeRedo?: (entry: HistoryEntry<T>) => boolean    // Can cancel
    afterRedo?: (state: T, entry: HistoryEntry<T>) => void
    onStateChange?: (state: T, prevState: T) => void
    onClear?: () => void
  }
  
  // Plugin can expose its own API
  api?: Record<string, unknown>
}

interface PluginInfo {
  name: string
  version: string
  type: 'core' | 'optional'
  enabled: boolean
}
```

### Strategy Interface

```typescript
interface Strategy<T> {
  name: 'snapshot' | 'command' | 'patch'
  
  // Create history entry
  createEntry(state: T, prevState: T, metadata?: EntryMetadata): HistoryEntry<T>
  
  // Apply entry (for undo/redo)
  applyUndo(entry: HistoryEntry<T>, currentState: T): T
  applyRedo(entry: HistoryEntry<T>, currentState: T): T
  
  // Serialize/deserialize for persistence
  serialize(entry: HistoryEntry<T>): string
  deserialize(data: string): HistoryEntry<T>
}

interface EntryMetadata {
  name?: string
  groupId?: string
  custom?: Record<string, unknown>
}
```

### Event Types

```typescript
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

type KernelEvent<T> =
  | PushEvent<T>
  | UndoEvent<T>
  | RedoEvent<T>
  | StateChangeEvent<T>
  | ClearEvent
  | GroupEvent
  | BranchEvent
  | LimitReachedEvent<T>

interface PushEvent<T> {
  type: 'push'
  entry: HistoryEntry<T>
  state: T
  prevState: T
  timestamp: number
}

interface UndoEvent<T> {
  type: 'undo'
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

interface RedoEvent<T> {
  type: 'redo'
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

interface StateChangeEvent<T> {
  type: 'state-change'
  state: T
  prevState: T
  source: 'push' | 'undo' | 'redo' | 'set'
}

interface ClearEvent {
  type: 'clear'
  timestamp: number
}

interface GroupEvent {
  type: 'group-start' | 'group-end'
  groupId: string
  name?: string
}

interface BranchEvent {
  type: 'branch-create' | 'branch-switch'
  branchId: string
  branchName: string
  fromPosition: number
}

interface LimitReachedEvent<T> {
  type: 'limit-reached'
  limit: number
  droppedEntry: HistoryEntry<T>
}
```

---

## CORE PLUGINS (5 Total - Always Loaded)

### 1. snapshot-strategy

Full state snapshot on each change.

```typescript
interface SnapshotStrategyOptions {
  deepClone?: boolean          // Deep clone state (default: true)
  cloneFunction?: <T>(state: T) => T  // Custom clone function
}

// Usage
const history = createHistory({
  initialState: { count: 0, items: [] },
  strategy: 'snapshot',
})

history.push({ count: 1, items: [] })
history.push({ count: 1, items: ['a'] })

history.undo() // { count: 1, items: [] }
history.undo() // { count: 0, items: [] }
```

**Implementation Notes:**
- Default deep clone using structured clone algorithm
- Custom clone function for special objects (Date, Map, Set, etc.)
- Memory usage: O(n * state_size)
- Best for: Small to medium state, simple use cases

### 2. command-strategy

Action-based with explicit do/undo functions.

```typescript
interface Command<T, P = unknown> {
  name: string
  execute: (state: T, payload: P) => T
  undo: (state: T, payload: P) => T
  redo?: (state: T, payload: P) => T  // Optional, defaults to execute
}

// Define commands
const increment = defineCommand<State, number>({
  name: 'increment',
  execute: (state, amount) => ({ ...state, count: state.count + amount }),
  undo: (state, amount) => ({ ...state, count: state.count - amount }),
})

const setText = defineCommand<State, string>({
  name: 'setText',
  execute: (state, text) => ({ ...state, text }),
  undo: (state, _, prevState) => ({ ...state, text: prevState.text }),
})

// Usage
const history = createHistory({
  initialState: { count: 0, text: '' },
  strategy: 'command',
})

history.execute(increment, 5)    // count: 5
history.execute(setText, 'hi')   // text: 'hi'
history.undo()                   // text: ''
history.undo()                   // count: 0

// Command registry API
interface CommandStrategyAPI {
  execute<P>(command: Command<T, P>, payload: P): T
  registerCommand(command: Command<T>): void
  getCommand(name: string): Command<T> | undefined
  listCommands(): string[]
}
```

**Implementation Notes:**
- Commands must be pure functions
- Payload is stored in history entry
- Memory usage: O(n * payload_size) - very efficient
- Best for: Complex state, deterministic operations

### 3. patch-strategy

Diff/patch based using JSON patches.

```typescript
interface Patch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy'
  path: string[]
  value?: unknown
  from?: string[]  // For move/copy
}

interface PatchStrategyOptions {
  diffFunction?: <T>(prev: T, next: T) => Patch[]
  patchFunction?: <T>(state: T, patches: Patch[]) => T
}

// Usage
const history = createHistory({
  initialState: { 
    user: { name: 'John', age: 25 },
    items: ['a', 'b', 'c']
  },
  strategy: 'patch',
})

history.push({ 
  user: { name: 'John', age: 26 },  // Only age changed
  items: ['a', 'b', 'c']
})
// Stored patch: [{ op: 'replace', path: ['user', 'age'], value: 26 }]

// Patch strategy API
interface PatchStrategyAPI {
  getPatches(entryId: string): Patch[]
  applyPatches(patches: Patch[]): T
  createPatch(prev: T, next: T): Patch[]
}
```

**Implementation Notes:**
- Implements RFC 6902 JSON Patch format
- Automatic diff calculation
- Inverse patches for undo
- Memory usage: O(n * changes_size) - efficient for large state
- Best for: Large state with small changes

### 4. history-manager

Core history stack management.

```typescript
interface HistoryManagerAPI<T> {
  // Navigation
  goTo(position: number): T
  goToEntry(entryId: string): T
  
  // Access
  getEntry(position: number): HistoryEntry<T> | undefined
  getEntryById(id: string): HistoryEntry<T> | undefined
  getEntries(): HistoryEntry<T>[]
  getUndoStack(): HistoryEntry<T>[]
  getRedoStack(): HistoryEntry<T>[]
  
  // Modification
  setLimit(limit: number): void
  getLimit(): number
  
  // Stats
  getStats(): HistoryStats
}

interface HistoryStats {
  totalEntries: number
  undoCount: number
  redoCount: number
  oldestEntry: number  // timestamp
  newestEntry: number  // timestamp
  memoryUsage: number  // estimated bytes
}

interface HistoryManagerOptions {
  limit: number              // Max entries (default: 100)
  dropStrategy: 'oldest' | 'largest'  // When limit reached
}
```

### 5. grouping

Group multiple operations into single undo/redo.

```typescript
interface GroupingAPI {
  startGroup(name?: string): string  // Returns groupId
  endGroup(): void
  cancelGroup(): void
  isGrouping(): boolean
  getCurrentGroupId(): string | null
  
  // Automatic grouping
  group<R>(name: string, fn: () => R): R
  
  // Async grouping
  groupAsync<R>(name: string, fn: () => Promise<R>): Promise<R>
}

// Usage
history.startGroup('batch-edit')
history.push({ a: 1 })
history.push({ a: 2 })
history.push({ a: 3 })
history.endGroup()

history.undo() // Single undo reverts all 3 changes

// Or using helper
history.group('batch-edit', () => {
  history.push({ a: 1 })
  history.push({ a: 2 })
  history.push({ a: 3 })
})

// Nested groups
history.group('outer', () => {
  history.push({ a: 1 })
  history.group('inner', () => {
    history.push({ a: 2 })
    history.push({ a: 3 })
  })
  history.push({ a: 4 })
})
// Results in single undo for all 4 changes
```

---

## OPTIONAL PLUGINS (6 Total)

### 6. branching

Git-like branching for alternative timelines.

```typescript
import { branching } from '@oxog/statekeeper/plugins'

const history = createHistory({
  plugins: [branching()],
})

interface BranchingAPI {
  // Branch management
  createBranch(name?: string): string  // Returns branchId
  switchBranch(branchId: string): T
  deleteBranch(branchId: string): void
  renameBranch(branchId: string, name: string): void
  
  // Branch info
  getCurrentBranch(): Branch
  getBranches(): Branch[]
  getBranch(branchId: string): Branch | undefined
  
  // Merge
  mergeBranch(fromBranchId: string, strategy?: MergeStrategy): T
  
  // Visualization
  getTree(): BranchTree
}

interface Branch {
  id: string
  name: string
  parentBranch: string | null
  forkPosition: number
  entries: HistoryEntry<T>[]
  createdAt: number
}

interface BranchTree {
  branches: Branch[]
  nodes: BranchNode[]
  edges: BranchEdge[]
}

type MergeStrategy = 'ours' | 'theirs' | 'manual'

// Usage
history.push({ v: 1 })
history.push({ v: 2 })
history.undo()           // v: 1, position: 1
history.push({ v: 3 })   // Auto-creates new branch!

const branches = history.getBranches()
// [
//   { id: 'main', entries: [{ v: 1 }, { v: 2 }] },
//   { id: 'branch-1', entries: [{ v: 1 }, { v: 3 }] }
// ]

history.switchBranch('main')  // v: 2
```

**Implementation Notes:**
- Auto-branch on push after undo (configurable)
- Branch from any position
- Merge strategies for conflict resolution
- Visual tree representation

### 7. persistence

Save/restore history to storage.

```typescript
import { persistence } from '@oxog/statekeeper/plugins'

const history = createHistory({
  plugins: [persistence({
    key: 'my-app-history',
    storage: localStorage,  // or sessionStorage, or custom
    debounce: 500,
    maxSize: 5 * 1024 * 1024,  // 5MB limit
  })],
})

interface PersistenceOptions {
  key: string
  storage: Storage | AsyncStorage
  debounce?: number           // ms, default 500
  maxSize?: number            // bytes, default unlimited
  include?: string[]          // State paths to include
  exclude?: string[]          // State paths to exclude
  serialize?: (history: HistoryStack) => string
  deserialize?: (data: string) => HistoryStack
  onError?: (error: Error) => void
  version?: number            // For migrations
  migrate?: (data: unknown, fromVersion: number) => HistoryStack
}

interface PersistenceAPI {
  save(): Promise<void>
  load(): Promise<void>
  clear(): Promise<void>
  getStorageSize(): number
  isLoaded(): boolean
  setStorage(storage: Storage): void
}

// Async storage interface (for React Native, IndexedDB, etc.)
interface AsyncStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
```

### 8. keyboard-shortcuts

Global keyboard shortcuts for undo/redo.

```typescript
import { keyboardShortcuts } from '@oxog/statekeeper/plugins'

const history = createHistory({
  plugins: [keyboardShortcuts({
    undo: 'ctrl+z',
    redo: ['ctrl+y', 'ctrl+shift+z'],
    enabled: true,
    preventDefault: true,
    scope: document,  // or specific element
  })],
})

interface KeyboardShortcutsOptions {
  undo: string | string[]
  redo: string | string[]
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  scope?: EventTarget
  filter?: (event: KeyboardEvent) => boolean
}

interface KeyboardShortcutsAPI {
  enable(): void
  disable(): void
  isEnabled(): boolean
  setShortcuts(shortcuts: Partial<KeyboardShortcutsOptions>): void
  getShortcuts(): { undo: string[], redo: string[] }
}

// Shortcut format: 'ctrl+z', 'cmd+z', 'ctrl+shift+z', 'meta+z'
// Supports: ctrl, alt, shift, meta, cmd (alias for meta)
```

### 9. time-travel-ui

Visual debugging panel with timeline.

```typescript
import { timeTravelUI, TimeTravelPanel } from '@oxog/statekeeper/plugins'

const history = createHistory({
  plugins: [timeTravelUI({
    position: 'bottom-right',
    shortcut: 'ctrl+shift+h',
    theme: 'dark',
  })],
})

// React component
<TimeTravelPanel />

interface TimeTravelUIOptions {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  shortcut: string
  draggable: boolean
  resizable: boolean
  theme: 'dark' | 'light' | 'auto'
  defaultCollapsed: boolean
  showStatePreview: boolean
  showTimeline: boolean
  showBranches: boolean
  maxPreviewDepth: number
}

interface TimeTravelUIAPI {
  open(): void
  close(): void
  toggle(): void
  isOpen(): boolean
  setPosition(position: string): void
  jumpTo(position: number): void
}
```

**Time Travel Panel Layout:**

```
┌─ StateKeeper ─────────────────────── [_] [□] [×]
├─────────────────────────────────────────────────
│  Timeline                      Branch: main ▼
│  ┌─────────────────────────────────────────┐
│  │ ●───●───●───●───◆───○───○               │
│  │ 0   1   2   3   4   5   6               │
│  └─────────────────────────────────────────┘
│                     ▲ Current (position 4)
├─────────────────────────────────────────────────
│  History Stack
│  ┌──────────────────────────────────────────┐
│  │ #4 ◆ increment(5)          12:34:56.789 │
│  │ #3 ● setText("hello")      12:34:55.123 │
│  │ #2 ● increment(1)          12:34:54.456 │
│  │ #1 ● setUser({...})        12:34:53.789 │
│  │ #0 ● initial               12:34:53.000 │
│  └──────────────────────────────────────────┘
├─────────────────────────────────────────────────
│  State Preview
│  ┌──────────────────────────────────────────┐
│  │ {                                        │
│  │   "count": 5,                            │
│  │   "text": "hello",                       │
│  │   "user": { "name": "John" }             │
│  │ }                                        │
│  └──────────────────────────────────────────┘
├─────────────────────────────────────────────────
│  [⏮️] [◀️ Undo] [Redo ▶️] [⏭️]  │ 4/6 │ main
└─────────────────────────────────────────────────
```

**Features:**
- Visual timeline with clickable points
- Entry list with timestamps and names
- State preview with JSON highlighting
- Branch selector dropdown
- Play/pause auto-replay
- Export history as JSON
- Search/filter entries

### 10. compression

Compress history for memory efficiency.

```typescript
import { compression } from '@oxog/statekeeper/plugins'

const history = createHistory({
  plugins: [compression({
    algorithm: 'lz-string',
    threshold: 1024,  // Only compress entries > 1KB
    level: 'balanced',
  })],
})

interface CompressionOptions {
  algorithm: 'lz-string' | 'custom'
  threshold?: number           // bytes, default 1024
  level?: 'fast' | 'balanced' | 'max'
  compress?: (data: string) => string
  decompress?: (data: string) => string
}

interface CompressionAPI {
  getCompressionRatio(): number
  getOriginalSize(): number
  getCompressedSize(): number
  compressAll(): void
  decompressAll(): void
}
```

**Implementation Notes:**
- Implements LZ-string compression from scratch
- Lazy decompression on access
- Configurable threshold (don't compress small entries)
- Significant memory savings for large state

### 11. middleware

Custom logic injection points.

```typescript
import { middleware } from '@oxog/statekeeper/plugins'

const logger = createMiddleware({
  name: 'logger',
  before: (action, state) => {
    console.log('Before:', action.type, state)
    return state  // Can modify
  },
  after: (action, state, prevState) => {
    console.log('After:', action.type, state)
  },
})

const validator = createMiddleware({
  name: 'validator',
  before: (action, state) => {
    if (!isValid(state)) {
      throw new Error('Invalid state')
    }
    return state
  },
})

const history = createHistory({
  plugins: [middleware([logger, validator])],
})

interface Middleware<T> {
  name: string
  before?: (action: Action, state: T) => T | false  // Return false to cancel
  after?: (action: Action, state: T, prevState: T) => void
  error?: (action: Action, error: Error) => void
}

interface Action {
  type: 'push' | 'undo' | 'redo' | 'clear' | 'goto'
  payload?: unknown
}

// Helper
function createMiddleware<T>(config: Middleware<T>): Middleware<T>
```

---

## FRAMEWORK ADAPTERS

### 12. React Adapter (`@oxog/statekeeper/react`)

```tsx
import {
  useHistory,
  useHistoryState,
  useHistoryActions,
  HistoryProvider,
  useHistoryContext,
} from '@oxog/statekeeper/react'

// Hook API
function Counter() {
  const {
    state,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
  } = useHistory({
    initialState: { count: 0 },
    strategy: 'snapshot',
    limit: 50,
    plugins: [persistence({ key: 'counter' })],
  })

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => push({ count: state.count + 1 })}>+</button>
      <button onClick={() => push({ count: state.count - 1 })}>-</button>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </div>
  )
}

// Provider API (shared history)
function App() {
  return (
    <HistoryProvider
      initialState={{ count: 0, text: '' }}
      strategy="patch"
    >
      <Counter />
      <TextInput />
      <UndoRedoButtons />
    </HistoryProvider>
  )
}

function Counter() {
  const { state, push } = useHistoryContext()
  // ...
}

// Selector hook (optimized re-renders)
function CountDisplay() {
  const count = useHistoryState((state) => state.count)
  return <p>Count: {count}</p>
}

// Actions only (no state subscription)
function UndoRedoButtons() {
  const { undo, redo, canUndo, canRedo } = useHistoryActions()
  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
    </>
  )
}

// Command strategy with React
function CommandExample() {
  const { state, execute } = useHistory({
    initialState: { count: 0 },
    strategy: 'command',
  })

  const increment = defineCommand({
    name: 'increment',
    execute: (s, n: number) => ({ ...s, count: s.count + n }),
    undo: (s, n: number) => ({ ...s, count: s.count - n }),
  })

  return (
    <button onClick={() => execute(increment, 5)}>+5</button>
  )
}

// Types
interface UseHistoryOptions<T> {
  initialState: T
  strategy?: 'snapshot' | 'command' | 'patch'
  limit?: number
  plugins?: Plugin<T>[]
}

interface UseHistoryReturn<T> {
  state: T
  push: (state: T) => void
  execute: <P>(command: Command<T, P>, payload: P) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  position: number
  length: number
  history: Kernel<T>
  
  // Grouping
  startGroup: (name?: string) => string
  endGroup: () => void
  group: <R>(name: string, fn: () => R) => R
  
  // Direct access
  goTo: (position: number) => void
  clear: () => void
}
```

### 13. Vue Adapter (`@oxog/statekeeper/vue`)

```typescript
import {
  useHistory,
  useHistoryState,
  provideHistory,
  injectHistory,
} from '@oxog/statekeeper/vue'

// Composition API
const {
  state,        // Ref<T>
  push,
  undo,
  redo,
  canUndo,      // Ref<boolean>
  canRedo,      // Ref<boolean>
} = useHistory({
  initialState: { count: 0 },
})

// Template
<template>
  <p>Count: {{ state.count }}</p>
  <button @click="push({ count: state.count + 1 })">+</button>
  <button @click="undo" :disabled="!canUndo">Undo</button>
  <button @click="redo" :disabled="!canRedo">Redo</button>
</template>

// Provider pattern
// Parent component
provideHistory({
  initialState: { count: 0 },
})

// Child component
const { state, push } = injectHistory()

// Computed selector
const count = useHistoryState((state) => state.count)
```

### 14. Svelte Adapter (`@oxog/statekeeper/svelte`)

```typescript
import {
  createHistoryStore,
  historyStore,
} from '@oxog/statekeeper/svelte'

// Store API
const history = createHistoryStore({
  initialState: { count: 0 },
})

// Svelte component
<script>
  import { history } from './stores'
  
  function increment() {
    history.push({ count: $history.state.count + 1 })
  }
</script>

<p>Count: {$history.state.count}</p>
<button on:click={increment}>+</button>
<button on:click={history.undo} disabled={!$history.canUndo}>Undo</button>
<button on:click={history.redo} disabled={!$history.canRedo}>Redo</button>

// Derived stores
const count = derived(history, ($h) => $h.state.count)

// Store interface
interface HistoryStore<T> extends Readable<HistoryStoreValue<T>> {
  push: (state: T) => void
  undo: () => void
  redo: () => void
  // ... all Kernel methods
}

interface HistoryStoreValue<T> {
  state: T
  canUndo: boolean
  canRedo: boolean
  position: number
  length: number
}
```

---

## PUBLIC API (Vanilla JS)

```typescript
// Main exports
import {
  // Factory
  createHistory,
  
  // Command helpers
  defineCommand,
  
  // Plugin helpers
  createPlugin,
  createMiddleware,
  
  // Types
  type Kernel,
  type Plugin,
  type Command,
  type HistoryEntry,
  type Strategy,
} from '@oxog/statekeeper'

// Create history instance
const history = createHistory<MyState>({
  initialState: { count: 0, text: '' },
  strategy: 'snapshot',  // or 'command' or 'patch'
  limit: 100,
  plugins: [],
})

// Basic operations
history.push({ count: 1, text: '' })
history.undo()   // Returns previous state or null
history.redo()   // Returns next state or null
history.canUndo()  // boolean
history.canRedo()  // boolean

// State access
history.getState()
history.getInitialState()

// History access
history.getPosition()    // Current position in stack
history.getLength()      // Total entries
history.getHistory()     // Full history stack

// Navigation
history.goTo(position)   // Jump to specific position

// Grouping
history.startGroup('name')
history.endGroup()
history.group('name', () => { /* operations */ })

// Events
history.on('push', (event) => { })
history.on('undo', (event) => { })
history.on('redo', (event) => { })
history.on('state-change', (event) => { })

// Cleanup
history.clear()
history.destroy()
```

---

## TYPE DEFINITIONS

```typescript
// Core types
export interface Kernel<T> { /* as defined above */ }
export interface Plugin<T> { /* as defined above */ }
export interface Strategy<T> { /* as defined above */ }
export interface Command<T, P = unknown> { /* as defined above */ }

export interface HistoryEntry<T> {
  id: string
  timestamp: number
  state: T
  command?: Command<T>
  patches?: Patch[]
  groupId?: string
  metadata?: Record<string, unknown>
}

export interface HistoryStack<T> {
  entries: HistoryEntry<T>[]
  position: number
  branches: Branch<T>[]
  currentBranch: string
}

export interface Branch<T> {
  id: string
  name: string
  parentBranch: string | null
  forkPosition: number
  entries: HistoryEntry<T>[]
  createdAt: number
}

export interface Patch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy'
  path: string[]
  value?: unknown
  from?: string[]
}

// Event types
export type EventType = /* as defined above */
export type KernelEvent<T> = /* as defined above */
export type EventHandler<T> = (event: KernelEvent<T>) => void
export type Unsubscribe = () => void

// Options types
export interface CreateHistoryOptions<T> {
  initialState: T
  strategy?: 'snapshot' | 'command' | 'patch'
  limit?: number
  plugins?: Plugin<T>[]
}

// Plugin options
export interface BranchingOptions { /* ... */ }
export interface PersistenceOptions { /* ... */ }
export interface KeyboardShortcutsOptions { /* ... */ }
export interface TimeTravelUIOptions { /* ... */ }
export interface CompressionOptions { /* ... */ }
```

---

## TECHNICAL REQUIREMENTS

- **Runtime**: Universal (Browser + Node.js)
- **Module Format**: ESM + CJS (dual package)
- **Node.js Version**: >= 18 (for build/test)
- **TypeScript Version**: >= 5.0, strict mode
- **Full Generic Support**: All types properly generic

### Package Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./plugins": {
      "import": "./dist/plugins/index.js",
      "require": "./dist/plugins/index.cjs"
    },
    "./react": {
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    },
    "./vue": {
      "import": "./dist/vue/index.js",
      "require": "./dist/vue/index.cjs"
    },
    "./svelte": {
      "import": "./dist/svelte/index.js",
      "require": "./dist/svelte/index.cjs"
    }
  }
}
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "react": ">=17.0.0",
    "vue": ">=3.0.0",
    "svelte": ">=3.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "vue": { "optional": true },
    "svelte": { "optional": true }
  }
}
```

---

## PROJECT STRUCTURE

```
statekeeper/
├── src/
│   ├── index.ts                    # Main entry, exports
│   ├── types.ts                    # All type definitions
│   │
│   ├── kernel/                     # Micro-kernel core
│   │   ├── index.ts
│   │   ├── kernel.ts               # Kernel implementation
│   │   ├── history-stack.ts        # History stack management
│   │   ├── event-bus.ts            # Event system
│   │   └── plugin-registry.ts      # Plugin management
│   │
│   ├── strategies/                 # History strategies
│   │   ├── index.ts
│   │   ├── snapshot.ts             # Snapshot strategy
│   │   ├── command.ts              # Command strategy
│   │   └── patch.ts                # Patch strategy
│   │
│   ├── plugins/                    # All plugins
│   │   ├── index.ts                # Optional plugins export
│   │   ├── core/                   # Core plugins (bundled)
│   │   │   ├── index.ts
│   │   │   ├── snapshot-strategy.ts
│   │   │   ├── command-strategy.ts
│   │   │   ├── patch-strategy.ts
│   │   │   ├── history-manager.ts
│   │   │   └── grouping.ts
│   │   │
│   │   └── optional/               # Optional plugins
│   │       ├── index.ts
│   │       ├── branching.ts
│   │       ├── persistence.ts
│   │       ├── keyboard-shortcuts.ts
│   │       ├── compression.ts
│   │       ├── middleware.ts
│   │       └── time-travel-ui/
│   │           ├── index.ts
│   │           ├── panel.tsx
│   │           ├── components/
│   │           │   ├── timeline.tsx
│   │           │   ├── entry-list.tsx
│   │           │   ├── state-preview.tsx
│   │           │   ├── branch-selector.tsx
│   │           │   └── controls.tsx
│   │           ├── styles/
│   │           │   └── panel.css
│   │           └── utils/
│   │               ├── shadow-dom.ts
│   │               ├── draggable.ts
│   │               └── resizable.ts
│   │
│   ├── adapters/                   # Framework adapters
│   │   ├── react/
│   │   │   ├── index.ts
│   │   │   ├── use-history.ts
│   │   │   ├── use-history-state.ts
│   │   │   ├── use-history-actions.ts
│   │   │   ├── provider.tsx
│   │   │   └── context.ts
│   │   │
│   │   ├── vue/
│   │   │   ├── index.ts
│   │   │   ├── use-history.ts
│   │   │   ├── use-history-state.ts
│   │   │   ├── provide-inject.ts
│   │   │   └── plugin.ts
│   │   │
│   │   └── svelte/
│   │       ├── index.ts
│   │       ├── store.ts
│   │       └── derived.ts
│   │
│   └── utils/                      # Internal utilities
│       ├── index.ts
│       ├── deep-clone.ts
│       ├── deep-equal.ts
│       ├── diff.ts                 # JSON diff implementation
│       ├── patch.ts                # JSON patch implementation
│       ├── compress.ts             # LZ-string implementation
│       ├── uid.ts
│       └── keyboard.ts             # Key combo parser
│
├── tests/
│   ├── unit/
│   │   ├── kernel/
│   │   ├── strategies/
│   │   ├── plugins/
│   │   │   ├── core/
│   │   │   └── optional/
│   │   ├── adapters/
│   │   │   ├── react/
│   │   │   ├── vue/
│   │   │   └── svelte/
│   │   └── utils/
│   ├── integration/
│   │   ├── snapshot.test.ts
│   │   ├── command.test.ts
│   │   ├── patch.test.ts
│   │   ├── branching.test.ts
│   │   ├── persistence.test.ts
│   │   └── framework-adapters.test.ts
│   └── fixtures/
│       ├── test-states.ts
│       └── test-commands.ts
│
├── examples/
│   ├── vanilla/
│   │   ├── basic/
│   │   ├── command-pattern/
│   │   └── with-branching/
│   ├── react/
│   │   ├── counter/
│   │   ├── todo-app/
│   │   └── drawing-app/
│   ├── vue/
│   │   ├── counter/
│   │   └── form-editor/
│   └── svelte/
│       ├── counter/
│       └── notes-app/
│
├── website/                        # Documentation site
│   ├── index.html
│   ├── docs/
│   │   ├── index.html
│   │   ├── getting-started.html
│   │   ├── strategies/
│   │   │   ├── index.html
│   │   │   ├── snapshot.html
│   │   │   ├── command.html
│   │   │   └── patch.html
│   │   ├── api/
│   │   │   ├── index.html
│   │   │   ├── kernel.html
│   │   │   ├── plugins.html
│   │   │   └── events.html
│   │   ├── plugins/
│   │   │   ├── index.html
│   │   │   ├── core-plugins.html
│   │   │   ├── optional-plugins.html
│   │   │   └── custom-plugins.html
│   │   ├── frameworks/
│   │   │   ├── index.html
│   │   │   ├── react.html
│   │   │   ├── vue.html
│   │   │   └── svelte.html
│   │   ├── examples/
│   │   │   └── [examples].html
│   │   └── playground/
│   │       └── index.html
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── 404.html
│
├── SPECIFICATION.md
├── IMPLEMENTATION.md
├── TASKS.md
├── README.md
├── CHANGELOG.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

---

## DOCUMENTATION WEBSITE

Build documentation site for `https://statekeeper.oxog.dev`

### Technology Stack
- **Tailwind CSS** (via CDN)
- **Alpine.js** (via CDN)
- **Prism.js** for syntax highlighting
- **Static HTML** (no build step)

### Design Theme (Dark)
```css
--bg-primary: #0a0a0a;
--bg-secondary: #141414;
--bg-tertiary: #1f1f1f;
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--accent: #f59e0b;        /* Amber - history/time theme */
--accent-hover: #d97706;
--success: #22c55e;
--warning: #eab308;
--error: #ef4444;
--undo: #3b82f6;          /* Blue for undo */
--redo: #22c55e;          /* Green for redo */
```

### Required Pages

1. **Landing Page** - Hero, features, quick install, interactive demo
2. **Getting Started** - Installation, basic setup, first undo/redo
3. **Strategies Guide** - Snapshot vs Command vs Patch comparison
4. **API Reference** - Full documentation for kernel and plugins
5. **Plugins** - Core and optional plugin documentation
6. **Framework Guides** - React, Vue, Svelte integration
7. **Examples** - Counter, todo, drawing app, form editor
8. **Playground** - Interactive demo with all strategies

### Special Features

- Interactive timeline visualization
- Live strategy comparison demo
- Framework code tabs (React/Vue/Svelte)
- Copy-to-clipboard on all code blocks
- npm/yarn/pnpm tabs

---

## IMPLEMENTATION CHECKLIST

Before starting implementation:
- [ ] Create SPECIFICATION.md with complete package spec
- [ ] Create IMPLEMENTATION.md with architecture design
- [ ] Create TASKS.md with ordered task list

During implementation:
- [ ] Implement kernel first (foundation)
- [ ] Implement strategies (snapshot, command, patch)
- [ ] Implement core plugins (5)
- [ ] Implement optional plugins (6)
- [ ] Implement framework adapters (React, Vue, Svelte)
- [ ] Build Time Travel UI last
- [ ] Maintain 100% test coverage throughout
- [ ] Write JSDoc for all public APIs

Before completion:
- [ ] All tests passing (100% success)
- [ ] Coverage report shows 100%
- [ ] README.md complete
- [ ] CHANGELOG.md initialized
- [ ] Website functional
- [ ] Package builds without errors
- [ ] Tree-shaking works correctly
- [ ] Framework adapters tested with real apps

---

## CRITICAL IMPLEMENTATION NOTES

### Immutability
- Never mutate state directly
- Deep clone for snapshot strategy
- Return new objects always
- Handle circular references

### Memory Management
- Respect history limit
- Clean up old entries
- Compression for large states
- WeakMap for element references in UI

### TypeScript
- Full generic support throughout
- Proper type inference
- No `any` types
- Strict mode compliance

### Strategy Implementation

**Snapshot:**
- Use structuredClone when available
- Fallback to JSON.parse(JSON.stringify())
- Handle special types (Date, Map, Set, RegExp)

**Command:**
- Commands must be pure
- Store payload, not functions
- Support async commands (optional)

**Patch:**
- Implement RFC 6902 JSON Patch
- Generate inverse patches for undo
- Optimize for minimal patch size

### Framework Adapters
- React: useSyncExternalStore for concurrent mode
- Vue: ref() and computed() for reactivity
- Svelte: Writable store contract
- All: Proper cleanup on unmount

### Time Travel UI
- Shadow DOM isolation
- Render in portal/outside React tree
- Handle large histories efficiently
- Virtual scrolling for entry list

---

## BEGIN IMPLEMENTATION

Start by creating SPECIFICATION.md with the complete package specification. Then proceed with IMPLEMENTATION.md and TASKS.md before writing any actual code.

Remember: This package will be published to NPM. It must be production-ready, zero-dependency, fully tested, and professionally documented.

The three strategies (snapshot, command, patch) are the core differentiator - each must be robust and well-documented. Framework adapters should feel native to each framework.