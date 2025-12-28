# StateKeeper - Complete Package Specification

**Version:** 1.0.0
**Author:** Ersin KOÇ
**License:** MIT
**Created:** December 28, 2025

---

## 1. Package Overview

### 1.1 Identity

| Property | Value |
|----------|-------|
| NPM Package | `@oxog/statekeeper` |
| GitHub Repository | `https://github.com/ersinkoc/StateKeeper` |
| Documentation Site | `https://statekeeper.oxog.dev` |
| License | MIT |
| Author | Ersin KOÇ |

### 1.2 Description

**Zero-dependency undo/redo history manager with micro-kernel plugin architecture.**

StateKeeper is a powerful and flexible history management library that provides undo/redo functionality for any JavaScript application. Built on a micro-kernel architecture, it supports:

- Three different strategies (snapshot, command, patch)
- Branching timelines
- Action grouping
- Persistence
- Time-travel debugging
- Keyboard shortcuts
- Framework-agnostic core with dedicated adapters for React, Vue, and Svelte

All without any runtime dependencies.

### 1.3 Key Features

| Feature | Description |
|---------|-------------|
| Zero Dependencies | No runtime dependencies - everything implemented from scratch |
| Multiple Strategies | Snapshot, Command, and Patch strategies for different use cases |
| Micro-Kernel Architecture | Core kernel with pluggable functionality |
| Framework Adapters | Native integrations for React, Vue, and Svelte |
| Type Safety | Full TypeScript support with strict mode |
| Branching | Git-like branching for alternative timelines |
| Persistence | Save/restore history to any storage |
| Time Travel UI | Visual debugging panel |
| Tree-Shakeable | Only bundle what you use |

---

## 2. Technical Requirements

### 2.1 Runtime Environment

| Requirement | Value |
|-------------|-------|
| Node.js (build/test) | >= 18.0.0 |
| Browser Support | ES2020+ (Chrome 80+, Firefox 74+, Safari 14+, Edge 80+) |
| TypeScript | >= 5.0 |
| Module Format | ESM + CJS (dual package) |

### 2.2 Non-Negotiable Rules

1. **ZERO DEPENDENCIES**: `dependencies: {}` must be empty
2. **100% TEST COVERAGE**: Every line and branch must be tested
3. **TYPESCRIPT STRICT MODE**: All strict compiler options enabled
4. **NO EXTERNAL LINKS**: Only GitHub repo and documentation site

### 2.3 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

---

## 3. Core Types

### 3.1 Kernel Interface

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

  // Lifecycle
  destroy(): void
}
```

### 3.2 History Types

```typescript
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
  command?: CommandEntry<T>   // For command
  patches?: Patch[]           // For patch
  inversePatches?: Patch[]    // For patch undo
  groupId?: string
  metadata?: EntryMetadata
}

interface EntryMetadata {
  name?: string
  description?: string
  custom?: Record<string, unknown>
}

interface Branch<T> {
  id: string
  name: string
  parentBranch: string | null
  forkPosition: number
  entries: HistoryEntry<T>[]
  createdAt: number
}
```

### 3.3 Plugin Interface

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
  hooks?: PluginHooks<T>

  // Plugin can expose its own API
  api?: Record<string, unknown>
}

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
  type: 'core' | 'optional'
  enabled: boolean
}
```

### 3.4 Strategy Interface

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
```

### 3.5 Command Types

```typescript
interface Command<T, P = unknown> {
  name: string
  execute: (state: T, payload: P) => T
  undo: (state: T, payload: P, previousState?: T) => T
  redo?: (state: T, payload: P) => T
}

interface CommandEntry<T> {
  name: string
  payload: unknown
  previousState?: T
}
```

### 3.6 Patch Types (RFC 6902)

```typescript
interface Patch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: unknown
  from?: string
}

type PatchPath = (string | number)[]
```

### 3.7 Event Types

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
  | 'plugin-registered'
  | 'plugin-unregistered'

interface BaseEvent {
  timestamp: number
}

interface PushEvent<T> extends BaseEvent {
  type: 'push'
  entry: HistoryEntry<T>
  state: T
  prevState: T
}

interface UndoEvent<T> extends BaseEvent {
  type: 'undo'
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

interface RedoEvent<T> extends BaseEvent {
  type: 'redo'
  entry: HistoryEntry<T>
  state: T
  prevState: T
  position: number
}

interface StateChangeEvent<T> extends BaseEvent {
  type: 'state-change'
  state: T
  prevState: T
  source: 'push' | 'undo' | 'redo' | 'set' | 'goto'
}

interface ClearEvent extends BaseEvent {
  type: 'clear'
}

interface GroupEvent extends BaseEvent {
  type: 'group-start' | 'group-end'
  groupId: string
  name?: string
}

interface BranchEvent extends BaseEvent {
  type: 'branch-create' | 'branch-switch'
  branchId: string
  branchName: string
  fromPosition: number
}

interface LimitReachedEvent<T> extends BaseEvent {
  type: 'limit-reached'
  limit: number
  droppedEntry: HistoryEntry<T>
}

interface PluginEvent extends BaseEvent {
  type: 'plugin-registered' | 'plugin-unregistered'
  pluginName: string
}

type KernelEvent<T> =
  | PushEvent<T>
  | UndoEvent<T>
  | RedoEvent<T>
  | StateChangeEvent<T>
  | ClearEvent
  | GroupEvent
  | BranchEvent
  | LimitReachedEvent<T>
  | PluginEvent

type EventHandler<T> = (event: KernelEvent<T>) => void
type Unsubscribe = () => void
```

### 3.8 Configuration Types

```typescript
interface CreateHistoryOptions<T> {
  initialState: T
  strategy?: 'snapshot' | 'command' | 'patch'
  limit?: number
  plugins?: Plugin<T>[]
}

interface KernelOptions<T> {
  initialState: T
  strategy: 'snapshot' | 'command' | 'patch'
  limit: number
  plugins: Plugin<T>[]
}
```

---

## 4. Strategies Specification

### 4.1 Snapshot Strategy

**Concept:** Store complete state copies on each change.

**Characteristics:**
- Simplest to understand and implement
- Memory usage: O(n × state_size)
- CPU usage: O(state_size) for clone
- Best for: Small to medium state, simple use cases

**Options:**
```typescript
interface SnapshotStrategyOptions {
  deepClone?: boolean                    // Default: true
  cloneFunction?: <T>(state: T) => T    // Custom clone function
}
```

**Implementation Notes:**
- Use `structuredClone` when available (modern browsers)
- Fallback to JSON.parse(JSON.stringify()) with special handling
- Handle special types: Date, Map, Set, RegExp, ArrayBuffer
- Detect and handle circular references

### 4.2 Command Strategy

**Concept:** Store actions with execute/undo functions.

**Characteristics:**
- Most memory efficient for complex state
- Memory usage: O(n × payload_size)
- Requires explicit command definitions
- Best for: Complex state, deterministic operations

**Options:**
```typescript
interface CommandStrategyOptions {
  storeInitialState?: boolean  // Store full state for first entry
}
```

**API:**
```typescript
interface CommandStrategyAPI<T> {
  execute<P>(command: Command<T, P>, payload: P): T
  registerCommand(command: Command<T>): void
  getCommand(name: string): Command<T> | undefined
  listCommands(): string[]
}
```

**Implementation Notes:**
- Commands must be pure functions
- Payload is serialized and stored
- Previous state stored optionally for complex undos
- Support command composition

### 4.3 Patch Strategy

**Concept:** Store diffs between states using JSON Patch (RFC 6902).

**Characteristics:**
- Efficient for large state with small changes
- Memory usage: O(n × changes_size)
- Automatic diff calculation
- Best for: Large state, frequent small updates

**Options:**
```typescript
interface PatchStrategyOptions {
  diffFunction?: <T>(prev: T, next: T) => Patch[]
  patchFunction?: <T>(state: T, patches: Patch[]) => T
}
```

**API:**
```typescript
interface PatchStrategyAPI<T> {
  getPatches(entryId: string): Patch[]
  getInversePatches(entryId: string): Patch[]
  applyPatches(patches: Patch[]): T
  createPatch(prev: T, next: T): Patch[]
}
```

**Implementation Notes:**
- Implement full RFC 6902 JSON Patch spec
- Generate inverse patches automatically for undo
- Optimize patch size (merge consecutive operations)
- Handle array operations efficiently

---

## 5. Core Plugins (5 Total)

### 5.1 Snapshot Strategy Plugin
- Name: `snapshot-strategy`
- Version: `1.0.0`
- Type: `core`
- Auto-loaded when `strategy: 'snapshot'`

### 5.2 Command Strategy Plugin
- Name: `command-strategy`
- Version: `1.0.0`
- Type: `core`
- Auto-loaded when `strategy: 'command'`

### 5.3 Patch Strategy Plugin
- Name: `patch-strategy`
- Version: `1.0.0`
- Type: `core`
- Auto-loaded when `strategy: 'patch'`

### 5.4 History Manager Plugin
- Name: `history-manager`
- Version: `1.0.0`
- Type: `core`
- Always loaded

**API:**
```typescript
interface HistoryManagerAPI<T> {
  goTo(position: number): T
  goToEntry(entryId: string): T
  getEntry(position: number): HistoryEntry<T> | undefined
  getEntryById(id: string): HistoryEntry<T> | undefined
  getEntries(): HistoryEntry<T>[]
  getUndoStack(): HistoryEntry<T>[]
  getRedoStack(): HistoryEntry<T>[]
  setLimit(limit: number): void
  getLimit(): number
  getStats(): HistoryStats
}

interface HistoryStats {
  totalEntries: number
  undoCount: number
  redoCount: number
  oldestEntry: number
  newestEntry: number
  memoryUsage: number
}
```

### 5.5 Grouping Plugin
- Name: `grouping`
- Version: `1.0.0`
- Type: `core`
- Always loaded

**API:**
```typescript
interface GroupingAPI {
  startGroup(name?: string): string
  endGroup(): void
  cancelGroup(): void
  isGrouping(): boolean
  getCurrentGroupId(): string | null
  group<R>(name: string, fn: () => R): R
  groupAsync<R>(name: string, fn: () => Promise<R>): Promise<R>
}
```

---

## 6. Optional Plugins (6 Total)

### 6.1 Branching Plugin

**Import:** `import { branching } from '@oxog/statekeeper/plugins'`

**Options:**
```typescript
interface BranchingOptions {
  autoBranch?: boolean        // Auto-create branch on push after undo
  maxBranches?: number        // Limit number of branches
  branchNaming?: 'auto' | 'timestamp' | 'sequential'
}
```

**API:**
```typescript
interface BranchingAPI<T> {
  createBranch(name?: string): string
  switchBranch(branchId: string): T
  deleteBranch(branchId: string): void
  renameBranch(branchId: string, name: string): void
  getCurrentBranch(): Branch<T>
  getBranches(): Branch<T>[]
  getBranch(branchId: string): Branch<T> | undefined
  mergeBranch(fromBranchId: string, strategy?: MergeStrategy): T
  getTree(): BranchTree
}

type MergeStrategy = 'ours' | 'theirs' | 'manual'

interface BranchTree {
  branches: Branch<T>[]
  nodes: BranchNode[]
  edges: BranchEdge[]
}
```

### 6.2 Persistence Plugin

**Import:** `import { persistence } from '@oxog/statekeeper/plugins'`

**Options:**
```typescript
interface PersistenceOptions {
  key: string
  storage: Storage | AsyncStorage
  debounce?: number
  maxSize?: number
  include?: string[]
  exclude?: string[]
  serialize?: (history: HistoryStack) => string
  deserialize?: (data: string) => HistoryStack
  onError?: (error: Error) => void
  version?: number
  migrate?: (data: unknown, fromVersion: number) => HistoryStack
}

interface AsyncStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}
```

**API:**
```typescript
interface PersistenceAPI {
  save(): Promise<void>
  load(): Promise<void>
  clear(): Promise<void>
  getStorageSize(): number
  isLoaded(): boolean
  setStorage(storage: Storage | AsyncStorage): void
}
```

### 6.3 Keyboard Shortcuts Plugin

**Import:** `import { keyboardShortcuts } from '@oxog/statekeeper/plugins'`

**Options:**
```typescript
interface KeyboardShortcutsOptions {
  undo?: string | string[]        // Default: ['ctrl+z', 'cmd+z']
  redo?: string | string[]        // Default: ['ctrl+y', 'cmd+shift+z']
  enabled?: boolean               // Default: true
  preventDefault?: boolean        // Default: true
  stopPropagation?: boolean       // Default: false
  scope?: EventTarget             // Default: document
  filter?: (event: KeyboardEvent) => boolean
}
```

**API:**
```typescript
interface KeyboardShortcutsAPI {
  enable(): void
  disable(): void
  isEnabled(): boolean
  setShortcuts(shortcuts: Partial<KeyboardShortcutsOptions>): void
  getShortcuts(): { undo: string[], redo: string[] }
}
```

**Shortcut Format:**
- Modifiers: `ctrl`, `alt`, `shift`, `meta`, `cmd` (alias for meta)
- Keys: Any KeyboardEvent.key value
- Examples: `ctrl+z`, `cmd+shift+z`, `ctrl+alt+u`

### 6.4 Time Travel UI Plugin

**Import:** `import { timeTravelUI } from '@oxog/statekeeper/plugins'`

**Options:**
```typescript
interface TimeTravelUIOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  shortcut?: string               // Toggle shortcut
  draggable?: boolean
  resizable?: boolean
  theme?: 'dark' | 'light' | 'auto'
  defaultCollapsed?: boolean
  showStatePreview?: boolean
  showTimeline?: boolean
  showBranches?: boolean
  maxPreviewDepth?: number
}
```

**API:**
```typescript
interface TimeTravelUIAPI {
  open(): void
  close(): void
  toggle(): void
  isOpen(): boolean
  setPosition(position: string): void
  setTheme(theme: 'dark' | 'light' | 'auto'): void
}
```

**Features:**
- Visual timeline with clickable points
- Entry list with timestamps and names
- State preview with JSON highlighting
- Branch selector dropdown
- Play/pause auto-replay
- Export history as JSON
- Search/filter entries
- Shadow DOM isolation for style encapsulation

### 6.5 Compression Plugin

**Import:** `import { compression } from '@oxog/statekeeper/plugins'`

**Options:**
```typescript
interface CompressionOptions {
  algorithm?: 'lz-string'
  threshold?: number              // Bytes, default 1024
  level?: 'fast' | 'balanced' | 'max'
  compress?: (data: string) => string
  decompress?: (data: string) => string
}
```

**API:**
```typescript
interface CompressionAPI {
  getCompressionRatio(): number
  getOriginalSize(): number
  getCompressedSize(): number
  compressEntry(entryId: string): void
  decompressEntry(entryId: string): void
  compressAll(): void
  decompressAll(): void
}
```

**Implementation Notes:**
- Implement LZ-string compression from scratch (no dependencies)
- Lazy decompression on access
- Configurable threshold
- Transparent to other plugins

### 6.6 Middleware Plugin

**Import:** `import { middleware } from '@oxog/statekeeper/plugins'`

**Types:**
```typescript
interface Middleware<T> {
  name: string
  priority?: number              // Higher = runs first
  before?: (action: Action<T>, state: T) => T | false
  after?: (action: Action<T>, state: T, prevState: T) => void
  error?: (action: Action<T>, error: Error) => void
}

interface Action<T> {
  type: 'push' | 'undo' | 'redo' | 'clear' | 'goto'
  payload?: unknown
  entry?: HistoryEntry<T>
}
```

**API:**
```typescript
interface MiddlewareAPI<T> {
  add(middleware: Middleware<T>): void
  remove(name: string): void
  list(): string[]
  get(name: string): Middleware<T> | undefined
}
```

---

## 7. Framework Adapters

### 7.1 React Adapter

**Import:** `import { ... } from '@oxog/statekeeper/react'`

**Exports:**
```typescript
// Hooks
export function useHistory<T>(options: UseHistoryOptions<T>): UseHistoryReturn<T>
export function useHistoryState<T, R>(selector: (state: T) => R): R
export function useHistoryActions<T>(): UseHistoryActionsReturn<T>
export function useHistoryContext<T>(): UseHistoryReturn<T>

// Provider
export function HistoryProvider<T>(props: HistoryProviderProps<T>): JSX.Element

// Types
export interface UseHistoryOptions<T> {
  initialState: T
  strategy?: 'snapshot' | 'command' | 'patch'
  limit?: number
  plugins?: Plugin<T>[]
}

export interface UseHistoryReturn<T> {
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

  // Navigation
  goTo: (position: number) => void
  clear: () => void
}
```

**Implementation Notes:**
- Use `useSyncExternalStore` for React 18+ concurrent mode compatibility
- Proper cleanup on unmount
- Memoized selectors for performance
- SSR compatible

### 7.2 Vue Adapter

**Import:** `import { ... } from '@oxog/statekeeper/vue'`

**Exports:**
```typescript
// Composables
export function useHistory<T>(options: UseHistoryOptions<T>): UseHistoryReturn<T>
export function useHistoryState<T, R>(selector: (state: T) => R): ComputedRef<R>

// Provide/Inject
export function provideHistory<T>(options: UseHistoryOptions<T>): void
export function injectHistory<T>(): UseHistoryReturn<T>

// Types (Vue-specific)
export interface UseHistoryReturn<T> {
  state: Ref<T>
  push: (state: T) => void
  undo: () => void
  redo: () => void
  canUndo: Ref<boolean>
  canRedo: Ref<boolean>
  position: Ref<number>
  length: Ref<number>
  history: Kernel<T>
  // ... rest
}
```

**Implementation Notes:**
- Use Vue 3 Composition API
- `ref()` and `computed()` for reactivity
- Proper cleanup with `onUnmounted`

### 7.3 Svelte Adapter

**Import:** `import { ... } from '@oxog/statekeeper/svelte'`

**Exports:**
```typescript
// Store factory
export function createHistoryStore<T>(options: CreateHistoryOptions<T>): HistoryStore<T>

// Types
export interface HistoryStore<T> extends Readable<HistoryStoreValue<T>> {
  push: (state: T) => void
  undo: () => void
  redo: () => void
  goTo: (position: number) => void
  clear: () => void
  startGroup: (name?: string) => string
  endGroup: () => void
  group: <R>(name: string, fn: () => R) => R
  destroy: () => void
}

export interface HistoryStoreValue<T> {
  state: T
  canUndo: boolean
  canRedo: boolean
  position: number
  length: number
}
```

**Implementation Notes:**
- Follow Svelte store contract
- Use `writable` internally
- Support `derived` stores

---

## 8. Utilities

### 8.1 Deep Clone

```typescript
function deepClone<T>(value: T): T
```

- Use `structuredClone` when available
- Handle: Date, Map, Set, RegExp, ArrayBuffer, TypedArrays
- Detect circular references
- Preserve prototype for plain objects

### 8.2 Deep Equal

```typescript
function deepEqual(a: unknown, b: unknown): boolean
```

- Value equality check
- Handle all JavaScript types
- Handle circular references

### 8.3 JSON Diff

```typescript
function diff<T>(prev: T, next: T): Patch[]
```

- Generate minimal RFC 6902 patches
- Optimize array operations
- Handle nested objects

### 8.4 JSON Patch

```typescript
function applyPatch<T>(target: T, patches: Patch[]): T
function createInversePatch(patch: Patch, target: unknown): Patch
```

- Apply RFC 6902 patches immutably
- Generate inverse patches for undo

### 8.5 LZ-String Compression

```typescript
function compress(input: string): string
function decompress(input: string): string
```

- Implement LZ-string algorithm from scratch
- UTF-16 safe encoding
- High compression ratio for JSON

### 8.6 UID Generator

```typescript
function uid(): string
```

- Generate unique identifiers
- Short, URL-safe format
- Collision resistant

### 8.7 Keyboard Parser

```typescript
function parseShortcut(shortcut: string): ShortcutDefinition
function matchShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean
```

---

## 9. Package Exports

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./plugins": {
      "import": "./dist/plugins/index.js",
      "require": "./dist/plugins/index.cjs",
      "types": "./dist/plugins/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs",
      "types": "./dist/react/index.d.ts"
    },
    "./vue": {
      "import": "./dist/vue/index.js",
      "require": "./dist/vue/index.cjs",
      "types": "./dist/vue/index.d.ts"
    },
    "./svelte": {
      "import": "./dist/svelte/index.js",
      "require": "./dist/svelte/index.cjs",
      "types": "./dist/svelte/index.d.ts"
    }
  }
}
```

---

## 10. Testing Requirements

### 10.1 Coverage Requirements

| Metric | Required |
|--------|----------|
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

### 10.2 Test Categories

1. **Unit Tests**
   - Kernel operations
   - Each strategy
   - Each plugin
   - Each utility function
   - Each adapter

2. **Integration Tests**
   - Strategy combinations
   - Plugin interactions
   - Framework adapter scenarios
   - Persistence round-trips

3. **Edge Cases**
   - Empty state
   - Circular references
   - Large state
   - Rapid operations
   - Error recovery

---

## 11. Documentation Site

### 11.1 Technology Stack

| Technology | Purpose |
|------------|---------|
| React | UI Framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router | Routing |
| Shiki | Syntax highlighting |

### 11.2 Site Structure

- **Landing Page** - Hero, features, quick install, interactive demo
- **Getting Started** - Installation, basic setup, first undo/redo
- **Strategies Guide** - Snapshot vs Command vs Patch comparison
- **API Reference** - Full documentation for kernel and plugins
- **Plugins** - Core and optional plugin documentation
- **Framework Guides** - React, Vue, Svelte integration
- **Examples** - Interactive code examples
- **Playground** - Interactive demo with all strategies

### 11.3 Design Theme

```css
:root {
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
}
```

---

## 12. Performance Targets

| Operation | Target |
|-----------|--------|
| push() | < 1ms for 1KB state |
| undo()/redo() | < 0.5ms |
| Patch diff | < 5ms for 100KB state |
| Compression | < 10ms for 100KB |
| Initial load | < 50KB gzipped (core) |

---

## 13. Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2025-12-28 | Initial release |

---

*This specification is the single source of truth for StateKeeper implementation.*
