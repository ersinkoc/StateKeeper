# StateKeeper - Implementation Architecture

**Version:** 1.0.0
**Author:** Ersin KOÇ
**Created:** December 28, 2025

---

## 1. Architecture Overview

StateKeeper follows a **micro-kernel architecture** where the core is minimal and all features are implemented as plugins.

```
┌────────────────────────────────────────────────────────────────┐
│                        Application                              │
├────────────────────────────────────────────────────────────────┤
│  Framework Adapters (React / Vue / Svelte)                     │
├────────────────────────────────────────────────────────────────┤
│  Optional Plugins                                               │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────────────┐   │
│  │Branching │ │Persistence│ │Keyboard  │ │Time Travel UI  │   │
│  └──────────┘ └───────────┘ └──────────┘ └────────────────┘   │
│  ┌────────────┐ ┌───────────┐                                  │
│  │Compression │ │Middleware │                                  │
│  └────────────┘ └───────────┘                                  │
├────────────────────────────────────────────────────────────────┤
│  Core Plugins (Auto-loaded)                                     │
│  ┌──────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │History Mgr   │ │  Grouping      │ │ Strategy Plugin│       │
│  └──────────────┘ └────────────────┘ └────────────────┘       │
├────────────────────────────────────────────────────────────────┤
│                     KERNEL CORE                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐  │
│  │HistoryStack │ │  EventBus   │ │   Plugin Registry       │  │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                      Utilities                                  │
│  deep-clone │ deep-equal │ diff │ patch │ compress │ uid      │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Design Decisions

### 2.1 Why Micro-Kernel?

| Benefit | Description |
|---------|-------------|
| Modularity | Each feature is isolated in its own plugin |
| Tree-Shaking | Unused plugins are not bundled |
| Extensibility | Easy to add custom plugins |
| Testability | Each plugin can be tested in isolation |
| Maintainability | Changes to one plugin don't affect others |

### 2.2 Why Three Strategies?

Different use cases have different needs:

| Strategy | Use Case | Memory | CPU |
|----------|----------|--------|-----|
| Snapshot | Simple apps, small state | High | Low |
| Command | Complex apps, explicit actions | Low | Medium |
| Patch | Large state, small changes | Medium | Medium |

### 2.3 Immutability Approach

All state operations return new objects. The kernel never mutates state directly.

```typescript
// CORRECT
const newState = { ...state, count: state.count + 1 }

// WRONG
state.count++ // Never do this
```

### 2.4 Event-Driven Communication

Plugins communicate via events, not direct calls. This provides:
- Loose coupling
- Easy debugging
- Plugin independence

---

## 3. Kernel Core Implementation

### 3.1 Kernel Class Structure

```typescript
class StateKeeperKernel<T> implements Kernel<T> {
  private state: T
  private initialState: T
  private historyStack: HistoryStack<T>
  private strategy: Strategy<T>
  private eventBus: EventBus<T>
  private pluginRegistry: PluginRegistry<T>
  private options: KernelOptions<T>
  private destroyed: boolean = false
}
```

### 3.2 History Stack Design

```typescript
interface InternalHistoryStack<T> {
  entries: HistoryEntry<T>[]  // All entries
  position: number             // Current position (0-indexed)
  branches: Map<string, Branch<T>>
  currentBranch: string
  groupStack: GroupContext[]   // Nested groups
}

interface GroupContext {
  id: string
  name?: string
  startPosition: number
  entries: HistoryEntry<T>[]
}
```

**Position Logic:**
- `position = -1`: At initial state, no history
- `position = 0`: First entry
- `position = entries.length - 1`: Latest entry
- Undo decrements position
- Redo increments position

### 3.3 Event Bus Implementation

```typescript
class EventBus<T> {
  private handlers: Map<EventType, Set<EventHandler<T>>>

  emit(event: KernelEvent<T>): void {
    const handlers = this.handlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Event handler error:`, error)
        }
      })
    }
  }

  on(type: EventType, handler: EventHandler<T>): Unsubscribe {
    // Add handler, return cleanup function
  }

  off(type: EventType, handler: EventHandler<T>): void {
    // Remove handler
  }
}
```

### 3.4 Plugin Registry Design

```typescript
class PluginRegistry<T> {
  private plugins: Map<string, Plugin<T>>
  private kernel: Kernel<T>

  register(plugin: Plugin<T>): void {
    // 1. Check for duplicate names
    // 2. Call plugin.install(kernel)
    // 3. Register hooks
    // 4. Emit 'plugin-registered' event
  }

  unregister(name: string): void {
    // 1. Get plugin
    // 2. Call plugin.uninstall()
    // 3. Remove from registry
    // 4. Emit 'plugin-unregistered' event
  }

  // Hook execution
  executeBeforePush(state: T, prevState: T): T | false {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.beforePush) {
        const result = plugin.hooks.beforePush(state, prevState)
        if (result === false) return false
        if (result !== undefined) state = result
      }
    }
    return state
  }
}
```

---

## 4. Strategy Implementation

### 4.1 Snapshot Strategy

```typescript
class SnapshotStrategy<T> implements Strategy<T> {
  name = 'snapshot' as const
  private cloneFunction: (state: T) => T

  constructor(options: SnapshotStrategyOptions = {}) {
    this.cloneFunction = options.cloneFunction || deepClone
  }

  createEntry(state: T, prevState: T, metadata?: EntryMetadata): HistoryEntry<T> {
    return {
      id: uid(),
      timestamp: Date.now(),
      state: this.cloneFunction(state),
      metadata
    }
  }

  applyUndo(entry: HistoryEntry<T>): T {
    // Previous entry's state
    return this.cloneFunction(entry.state)
  }

  applyRedo(entry: HistoryEntry<T>): T {
    // Current entry's state
    return this.cloneFunction(entry.state)
  }
}
```

### 4.2 Command Strategy

```typescript
class CommandStrategy<T> implements Strategy<T> {
  name = 'command' as const
  private commands: Map<string, Command<T, unknown>> = new Map()

  execute<P>(command: Command<T, P>, payload: P, currentState: T): T {
    const newState = command.execute(currentState, payload)
    // Store command entry
    return newState
  }

  createEntry(state: T, prevState: T, metadata?: EntryMetadata): HistoryEntry<T> {
    // Command entries are created differently - via execute()
    throw new Error('Use execute() for command strategy')
  }

  applyUndo(entry: HistoryEntry<T>, currentState: T): T {
    const cmd = entry.command!
    const command = this.commands.get(cmd.name)!
    return command.undo(currentState, cmd.payload, cmd.previousState)
  }

  applyRedo(entry: HistoryEntry<T>, currentState: T): T {
    const cmd = entry.command!
    const command = this.commands.get(cmd.name)!
    const redoFn = command.redo || command.execute
    return redoFn(currentState, cmd.payload)
  }
}
```

### 4.3 Patch Strategy

```typescript
class PatchStrategy<T> implements Strategy<T> {
  name = 'patch' as const

  createEntry(state: T, prevState: T, metadata?: EntryMetadata): HistoryEntry<T> {
    const patches = diff(prevState, state)
    const inversePatches = patches.map(p => createInversePatch(p, prevState))

    return {
      id: uid(),
      timestamp: Date.now(),
      state: state, // Reference for quick access
      patches,
      inversePatches,
      metadata
    }
  }

  applyUndo(entry: HistoryEntry<T>, currentState: T): T {
    return applyPatch(currentState, entry.inversePatches!)
  }

  applyRedo(entry: HistoryEntry<T>, currentState: T): T {
    return applyPatch(currentState, entry.patches!)
  }
}
```

---

## 5. Utility Implementations

### 5.1 Deep Clone

```typescript
function deepClone<T>(value: T): T {
  // 1. Try structuredClone (modern browsers)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch {
      // Fall through to manual implementation
    }
  }

  // 2. Handle primitives
  if (value === null || typeof value !== 'object') {
    return value
  }

  // 3. Handle special types
  if (value instanceof Date) return new Date(value.getTime()) as T
  if (value instanceof RegExp) return new RegExp(value.source, value.flags) as T
  if (value instanceof Map) return new Map(deepClone([...value])) as T
  if (value instanceof Set) return new Set(deepClone([...value])) as T
  if (ArrayBuffer.isView(value)) {
    return new (value.constructor as any)(value) as T
  }

  // 4. Handle arrays
  if (Array.isArray(value)) {
    return value.map(deepClone) as T
  }

  // 5. Handle objects (with circular reference detection)
  const seen = new WeakMap()
  return cloneObject(value, seen)
}
```

### 5.2 JSON Diff (RFC 6902)

```typescript
function diff<T>(prev: T, next: T, path: string = ''): Patch[] {
  const patches: Patch[] = []

  // Same reference or equal primitives
  if (prev === next) return patches

  // Type changed
  if (typeof prev !== typeof next || Array.isArray(prev) !== Array.isArray(next)) {
    return [{ op: 'replace', path, value: next }]
  }

  // Handle arrays
  if (Array.isArray(prev) && Array.isArray(next)) {
    return diffArrays(prev, next, path)
  }

  // Handle objects
  if (typeof prev === 'object' && prev !== null) {
    return diffObjects(prev as object, next as object, path)
  }

  // Primitive value changed
  return [{ op: 'replace', path, value: next }]
}

function diffObjects(prev: object, next: object, path: string): Patch[] {
  const patches: Patch[] = []
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)

  // Removed keys
  for (const key of prevKeys) {
    if (!(key in next)) {
      patches.push({ op: 'remove', path: `${path}/${escapeKey(key)}` })
    }
  }

  // Added/changed keys
  for (const key of nextKeys) {
    const keyPath = `${path}/${escapeKey(key)}`
    if (!(key in prev)) {
      patches.push({ op: 'add', path: keyPath, value: next[key] })
    } else if (!deepEqual(prev[key], next[key])) {
      patches.push(...diff(prev[key], next[key], keyPath))
    }
  }

  return patches
}
```

### 5.3 LZ-String Compression

```typescript
// Implement LZ-string compression from scratch
// Based on LZ77 algorithm with UTF-16 encoding

class LZString {
  private static keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

  static compress(input: string): string {
    if (input === '') return ''

    // Dictionary-based compression
    const dictionary: Map<string, number> = new Map()
    let dictSize = 256
    let w = ''
    const result: number[] = []

    for (let i = 0; i < input.length; i++) {
      const c = input.charAt(i)
      const wc = w + c

      if (dictionary.has(wc)) {
        w = wc
      } else {
        result.push(w.length > 1 ? dictionary.get(w)! : w.charCodeAt(0))
        dictionary.set(wc, dictSize++)
        w = c
      }
    }

    if (w !== '') {
      result.push(w.length > 1 ? dictionary.get(w)! : w.charCodeAt(0))
    }

    return this.encodeToBase64(result)
  }

  static decompress(compressed: string): string {
    if (compressed === '') return ''

    const data = this.decodeFromBase64(compressed)
    // Reverse the compression process
    // ... implementation
  }
}
```

---

## 6. Plugin Implementations

### 6.1 Grouping Plugin

```typescript
class GroupingPlugin<T> implements Plugin<T> {
  name = 'grouping'
  version = '1.0.0'
  type = 'core' as const

  private kernel!: Kernel<T>
  private groupStack: GroupContext[] = []
  private groupEntries: Map<string, HistoryEntry<T>[]> = new Map()

  install(kernel: Kernel<T>): void {
    this.kernel = kernel
  }

  api = {
    startGroup: (name?: string): string => {
      const groupId = uid()
      this.groupStack.push({ id: groupId, name, entries: [] })
      this.kernel.emit({
        type: 'group-start',
        groupId,
        name,
        timestamp: Date.now()
      })
      return groupId
    },

    endGroup: (): void => {
      const context = this.groupStack.pop()
      if (!context) return

      // Merge all entries in the group into one
      if (context.entries.length > 1) {
        this.mergeGroupEntries(context)
      }

      this.kernel.emit({
        type: 'group-end',
        groupId: context.id,
        name: context.name,
        timestamp: Date.now()
      })
    },

    group: <R>(name: string, fn: () => R): R => {
      this.api.startGroup(name)
      try {
        return fn()
      } finally {
        this.api.endGroup()
      }
    }
  }

  hooks = {
    afterPush: (entry: HistoryEntry<T>): void => {
      const currentGroup = this.groupStack[this.groupStack.length - 1]
      if (currentGroup) {
        entry.groupId = currentGroup.id
        currentGroup.entries.push(entry)
      }
    }
  }
}
```

### 6.2 Branching Plugin

```typescript
class BranchingPlugin<T> implements Plugin<T> {
  name = 'branching'
  version = '1.0.0'
  type = 'optional' as const

  private kernel!: Kernel<T>
  private branches: Map<string, Branch<T>> = new Map()
  private currentBranch: string = 'main'

  install(kernel: Kernel<T>): void {
    this.kernel = kernel
    // Initialize main branch
    this.branches.set('main', {
      id: 'main',
      name: 'main',
      parentBranch: null,
      forkPosition: 0,
      entries: [],
      createdAt: Date.now()
    })
  }

  hooks = {
    beforePush: (state: T, prevState: T): T | false => {
      const history = this.kernel.getHistory()
      const position = this.kernel.getPosition()

      // If not at the end, auto-create branch
      if (position < history.entries.length - 1 && this.options.autoBranch) {
        this.api.createBranch()
      }

      return state
    }
  }

  api = {
    createBranch: (name?: string): string => {
      const branchId = uid()
      const branchName = name || `branch-${this.branches.size}`
      const position = this.kernel.getPosition()

      const branch: Branch<T> = {
        id: branchId,
        name: branchName,
        parentBranch: this.currentBranch,
        forkPosition: position,
        entries: [],
        createdAt: Date.now()
      }

      this.branches.set(branchId, branch)
      this.currentBranch = branchId

      this.kernel.emit({
        type: 'branch-create',
        branchId,
        branchName,
        fromPosition: position,
        timestamp: Date.now()
      })

      return branchId
    },

    switchBranch: (branchId: string): T => {
      const branch = this.branches.get(branchId)
      if (!branch) throw new Error(`Branch not found: ${branchId}`)

      // Restore branch state
      this.currentBranch = branchId
      // ... apply branch entries

      return this.kernel.getState()
    }
  }
}
```

### 6.3 Persistence Plugin

```typescript
class PersistencePlugin<T> implements Plugin<T> {
  name = 'persistence'
  version = '1.0.0'
  type = 'optional' as const

  private kernel!: Kernel<T>
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private loaded = false

  constructor(private options: PersistenceOptions) {}

  install(kernel: Kernel<T>): void {
    this.kernel = kernel

    // Auto-load on install
    this.api.load()

    // Setup auto-save on changes
    kernel.on('push', () => this.debouncedSave())
    kernel.on('undo', () => this.debouncedSave())
    kernel.on('redo', () => this.debouncedSave())
    kernel.on('clear', () => this.api.clear())
  }

  private debouncedSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => {
      this.api.save()
    }, this.options.debounce || 500)
  }

  api = {
    save: async (): Promise<void> => {
      const history = this.kernel.getHistory()
      const serialized = this.options.serialize
        ? this.options.serialize(history)
        : JSON.stringify({
            version: this.options.version || 1,
            history
          })

      // Check size limit
      if (this.options.maxSize && serialized.length > this.options.maxSize) {
        this.options.onError?.(new Error('History exceeds max size'))
        return
      }

      try {
        await this.options.storage.setItem(this.options.key, serialized)
      } catch (error) {
        this.options.onError?.(error as Error)
      }
    },

    load: async (): Promise<void> => {
      try {
        const data = await this.options.storage.getItem(this.options.key)
        if (!data) return

        let parsed = JSON.parse(data)

        // Handle migrations
        if (this.options.migrate && parsed.version !== this.options.version) {
          parsed = this.options.migrate(parsed, parsed.version)
        }

        // Restore history
        // ... restore logic

        this.loaded = true
      } catch (error) {
        this.options.onError?.(error as Error)
      }
    },

    clear: async (): Promise<void> => {
      await this.options.storage.removeItem(this.options.key)
    },

    isLoaded: (): boolean => this.loaded
  }
}
```

---

## 7. Framework Adapter Implementation

### 7.1 React Adapter

```typescript
// useSyncExternalStore for React 18+ compatibility
import { useSyncExternalStore, useMemo, useCallback } from 'react'

export function useHistory<T>(options: UseHistoryOptions<T>): UseHistoryReturn<T> {
  // Create kernel once
  const kernel = useMemo(() => createHistory(options), [])

  // Subscribe to state changes
  const state = useSyncExternalStore(
    useCallback(
      (callback) => {
        return kernel.on('state-change', callback)
      },
      [kernel]
    ),
    () => kernel.getState(),
    () => kernel.getState() // SSR
  )

  // Memoize status
  const canUndo = useSyncExternalStore(
    (cb) => kernel.on('state-change', cb),
    () => kernel.canUndo(),
    () => kernel.canUndo()
  )

  const canRedo = useSyncExternalStore(
    (cb) => kernel.on('state-change', cb),
    () => kernel.canRedo(),
    () => kernel.canRedo()
  )

  // Memoize actions
  const push = useCallback((s: T) => kernel.push(s), [kernel])
  const undo = useCallback(() => kernel.undo(), [kernel])
  const redo = useCallback(() => kernel.redo(), [kernel])

  // Cleanup on unmount
  useEffect(() => {
    return () => kernel.destroy()
  }, [kernel])

  return {
    state,
    push,
    undo,
    redo,
    canUndo,
    canRedo,
    position: kernel.getPosition(),
    length: kernel.getLength(),
    history: kernel,
    // ... other methods
  }
}
```

### 7.2 Vue Adapter

```typescript
import { ref, computed, onUnmounted, shallowRef } from 'vue'

export function useHistory<T>(options: UseHistoryOptions<T>) {
  const kernel = createHistory(options)

  const state = shallowRef(kernel.getState())
  const canUndo = ref(kernel.canUndo())
  const canRedo = ref(kernel.canRedo())
  const position = ref(kernel.getPosition())
  const length = ref(kernel.getLength())

  // Subscribe to changes
  const unsubscribe = kernel.on('state-change', (event) => {
    state.value = event.state
    canUndo.value = kernel.canUndo()
    canRedo.value = kernel.canRedo()
    position.value = kernel.getPosition()
    length.value = kernel.getLength()
  })

  // Cleanup
  onUnmounted(() => {
    unsubscribe()
    kernel.destroy()
  })

  return {
    state,
    canUndo,
    canRedo,
    position,
    length,
    push: (s: T) => kernel.push(s),
    undo: () => kernel.undo(),
    redo: () => kernel.redo(),
    history: kernel
  }
}
```

### 7.3 Svelte Adapter

```typescript
import { writable, derived } from 'svelte/store'

export function createHistoryStore<T>(options: CreateHistoryOptions<T>): HistoryStore<T> {
  const kernel = createHistory(options)

  const { subscribe, set } = writable<HistoryStoreValue<T>>({
    state: kernel.getState(),
    canUndo: kernel.canUndo(),
    canRedo: kernel.canRedo(),
    position: kernel.getPosition(),
    length: kernel.getLength()
  })

  // Subscribe to kernel changes
  kernel.on('state-change', () => {
    set({
      state: kernel.getState(),
      canUndo: kernel.canUndo(),
      canRedo: kernel.canRedo(),
      position: kernel.getPosition(),
      length: kernel.getLength()
    })
  })

  return {
    subscribe,
    push: (s: T) => kernel.push(s),
    undo: () => kernel.undo(),
    redo: () => kernel.redo(),
    goTo: (pos: number) => kernel.goTo(pos),
    clear: () => kernel.clear(),
    destroy: () => kernel.destroy()
  }
}
```

---

## 8. Time Travel UI Implementation

### 8.1 Shadow DOM Isolation

```typescript
class TimeTravelUI {
  private container: HTMLElement
  private shadowRoot: ShadowRoot
  private root: Root // React root

  constructor(private kernel: Kernel<unknown>, private options: TimeTravelUIOptions) {
    // Create container
    this.container = document.createElement('div')
    this.container.id = 'statekeeper-time-travel'
    document.body.appendChild(this.container)

    // Create shadow root for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' })

    // Inject styles
    const style = document.createElement('style')
    style.textContent = this.getStyles()
    this.shadowRoot.appendChild(style)

    // Create React mount point
    const mountPoint = document.createElement('div')
    this.shadowRoot.appendChild(mountPoint)

    // Render React app
    this.root = createRoot(mountPoint)
    this.root.render(
      <TimeTravelPanel kernel={kernel} options={options} />
    )
  }

  private getStyles(): string {
    return `
      :host {
        position: fixed;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      /* ... all styles scoped to shadow DOM */
    `
  }
}
```

### 8.2 Panel Component Structure

```tsx
function TimeTravelPanel({ kernel, options }: Props) {
  const [isOpen, setIsOpen] = useState(!options.defaultCollapsed)
  const [entries, setEntries] = useState(kernel.getHistory().entries)
  const [position, setPosition] = useState(kernel.getPosition())

  useEffect(() => {
    return kernel.on('state-change', () => {
      setEntries([...kernel.getHistory().entries])
      setPosition(kernel.getPosition())
    })
  }, [kernel])

  return (
    <div className="panel" style={getPositionStyle(options.position)}>
      <Header onToggle={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      {isOpen && (
        <>
          <Timeline entries={entries} position={position} onSelect={goTo} />
          <EntryList entries={entries} position={position} onSelect={goTo} />
          <StatePreview state={kernel.getState()} />
          <Controls kernel={kernel} />
        </>
      )}
    </div>
  )
}
```

---

## 9. Testing Strategy

### 9.1 Test Structure

```
tests/
├── unit/                    # Unit tests (fast, isolated)
│   ├── kernel/
│   │   ├── kernel.test.ts
│   │   ├── history-stack.test.ts
│   │   ├── event-bus.test.ts
│   │   └── plugin-registry.test.ts
│   ├── strategies/
│   │   ├── snapshot.test.ts
│   │   ├── command.test.ts
│   │   └── patch.test.ts
│   ├── plugins/
│   │   ├── grouping.test.ts
│   │   ├── branching.test.ts
│   │   ├── persistence.test.ts
│   │   └── ...
│   └── utils/
│       ├── deep-clone.test.ts
│       ├── diff.test.ts
│       └── ...
├── integration/             # Integration tests
│   ├── strategy-switching.test.ts
│   ├── plugin-interactions.test.ts
│   └── full-workflow.test.ts
└── adapters/               # Framework adapter tests
    ├── react.test.tsx
    ├── vue.test.ts
    └── svelte.test.ts
```

### 9.2 Coverage Requirements

Every code path must be tested:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
})
```

---

## 10. Build Configuration

### 10.1 Multiple Entry Points

```typescript
// tsup.config.ts
export default defineConfig([
  // Main entry
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true
  },
  // Plugins entry
  {
    entry: ['src/plugins/index.ts'],
    outDir: 'dist/plugins',
    format: ['esm', 'cjs'],
    dts: true
  },
  // React adapter
  {
    entry: ['src/adapters/react/index.ts'],
    outDir: 'dist/react',
    format: ['esm', 'cjs'],
    dts: true,
    external: ['react']
  },
  // Vue adapter
  {
    entry: ['src/adapters/vue/index.ts'],
    outDir: 'dist/vue',
    format: ['esm', 'cjs'],
    dts: true,
    external: ['vue']
  },
  // Svelte adapter
  {
    entry: ['src/adapters/svelte/index.ts'],
    outDir: 'dist/svelte',
    format: ['esm', 'cjs'],
    dts: true,
    external: ['svelte']
  }
])
```

---

## 11. Error Handling

### 11.1 Error Types

```typescript
class StateKeeperError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'StateKeeperError'
  }
}

// Specific errors
class PluginError extends StateKeeperError {}
class StrategyError extends StateKeeperError {}
class ValidationError extends StateKeeperError {}
```

### 11.2 Error Recovery

- Plugin errors don't crash the kernel
- Failed hooks are logged and skipped
- Persistence errors are caught and reported via callback

---

## 12. Performance Optimizations

### 12.1 Lazy Evaluation

- Entries are not cloned until needed
- Patches are computed lazily
- Compression happens in background

### 12.2 Memory Management

- Enforce entry limit
- Drop oldest entries when limit reached
- WeakMap for cached computations

### 12.3 Batch Updates

- Grouping prevents intermediate states
- Event batching for rapid changes

---

*This document describes the implementation architecture. See TASKS.md for implementation order.*
