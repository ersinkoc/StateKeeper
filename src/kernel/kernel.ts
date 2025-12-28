import type {
  Kernel,
  KernelOptions,
  CreateHistoryOptions,
  Plugin,
  PluginInfo,
  Strategy,
  HistoryStack,
  EntryMetadata,
  EventType,
  EventHandler,
  KernelEvent,
  Unsubscribe,
} from '../types'
import { EventBus } from './event-bus'
import { PluginRegistry } from './plugin-registry'
import { HistoryStackManager } from './history-stack'

/**
 * StateKeeper Kernel - Core history manager
 */
export class StateKeeperKernel<T> implements Kernel<T> {
  private state: T
  private initialState: T
  private historyStack: HistoryStackManager<T>
  private strategy: Strategy<T>
  private eventBus: EventBus<T>
  private pluginRegistry: PluginRegistry<T>
  private options: KernelOptions<T>
  private destroyed = false

  constructor(strategy: Strategy<T>, options: KernelOptions<T>) {
    this.initialState = options.initialState
    this.state = options.initialState
    this.strategy = strategy
    this.options = options

    // Initialize components
    this.eventBus = new EventBus<T>()
    this.historyStack = new HistoryStackManager<T>(options.limit)
    this.pluginRegistry = new PluginRegistry<T>(this)

    // Register plugins
    if (options.plugins) {
      options.plugins.forEach((plugin) => {
        this.register(plugin)
      })
    }
  }

  // ============================================================================
  // State Management
  // ============================================================================

  getState(): T {
    this.checkDestroyed()
    return this.state
  }

  setState(state: T): void {
    this.checkDestroyed()
    const prevState = this.state
    this.state = state

    this.emit({
      type: 'state-change',
      state,
      prevState,
      source: 'set',
      timestamp: Date.now(),
    })

    this.pluginRegistry.executeOnStateChange(state, prevState)
  }

  getInitialState(): T {
    return this.initialState
  }

  // ============================================================================
  // History Operations
  // ============================================================================

  push(state: T, metadata?: EntryMetadata): void {
    this.checkDestroyed()

    const prevState = this.state

    // Execute beforePush hooks
    const modifiedState = this.pluginRegistry.executeBeforePush(state, prevState)
    if (modifiedState === false) {
      return // Cancelled by plugin
    }

    // Create history entry
    const entry = this.strategy.createEntry(modifiedState, prevState, metadata)

    // Push to stack
    const droppedEntry = this.historyStack.push(entry)

    // Update current state
    this.state = modifiedState

    // Emit events
    this.emit({
      type: 'push',
      entry,
      state: modifiedState,
      prevState,
      timestamp: Date.now(),
    })

    this.emit({
      type: 'state-change',
      state: modifiedState,
      prevState,
      source: 'push',
      timestamp: Date.now(),
    })

    // Execute afterPush hooks
    this.pluginRegistry.executeAfterPush(entry)

    // Emit limit-reached if entry was dropped
    if (droppedEntry) {
      this.emit({
        type: 'limit-reached',
        limit: this.historyStack.getLimit(),
        droppedEntry,
        timestamp: Date.now(),
      })
    }

    // Execute onStateChange hooks
    this.pluginRegistry.executeOnStateChange(modifiedState, prevState)
  }

  undo(): T | null {
    this.checkDestroyed()

    if (!this.canUndo()) {
      return null
    }

    const entry = this.historyStack.getCurrent()!
    const prevState = this.state

    // Execute beforeUndo hooks
    if (!this.pluginRegistry.executeBeforeUndo(entry)) {
      return null // Cancelled by plugin
    }

    // Apply undo
    this.historyStack.undo()
    const newPosition = this.historyStack.getPosition()
    const newState = newPosition === -1 ? this.initialState : this.reconstructState(newPosition)
    this.state = newState

    // Emit events
    this.emit({
      type: 'undo',
      entry,
      state: newState,
      prevState,
      position: this.historyStack.getPosition(),
      timestamp: Date.now(),
    })

    this.emit({
      type: 'state-change',
      state: newState,
      prevState,
      source: 'undo',
      timestamp: Date.now(),
    })

    // Execute afterUndo hooks
    this.pluginRegistry.executeAfterUndo(newState, entry)

    // Execute onStateChange hooks
    this.pluginRegistry.executeOnStateChange(newState, prevState)

    return newState
  }

  redo(): T | null {
    this.checkDestroyed()

    if (!this.canRedo()) {
      return null
    }

    // Get next entry (before moving position)
    const nextEntry = this.historyStack.getAt(this.historyStack.getPosition() + 1)!
    const prevState = this.state

    // Execute beforeRedo hooks
    if (!this.pluginRegistry.executeBeforeRedo(nextEntry)) {
      return null // Cancelled by plugin
    }

    // Apply redo
    this.historyStack.redo()
    const newState = this.strategy.applyRedo(nextEntry, prevState)
    this.state = newState

    // Emit events
    this.emit({
      type: 'redo',
      entry: nextEntry,
      state: newState,
      prevState,
      position: this.historyStack.getPosition(),
      timestamp: Date.now(),
    })

    this.emit({
      type: 'state-change',
      state: newState,
      prevState,
      source: 'redo',
      timestamp: Date.now(),
    })

    // Execute afterRedo hooks
    this.pluginRegistry.executeAfterRedo(newState, nextEntry)

    // Execute onStateChange hooks
    this.pluginRegistry.executeOnStateChange(newState, prevState)

    return newState
  }

  canUndo(): boolean {
    this.checkDestroyed()
    return this.historyStack.canUndo()
  }

  canRedo(): boolean {
    this.checkDestroyed()
    return this.historyStack.canRedo()
  }

  // ============================================================================
  // History Access
  // ============================================================================

  getHistory(): HistoryStack<T> {
    this.checkDestroyed()
    return this.historyStack.getStack()
  }

  getPosition(): number {
    this.checkDestroyed()
    return this.historyStack.getPosition()
  }

  getLength(): number {
    this.checkDestroyed()
    return this.historyStack.getLength()
  }

  clear(): void {
    this.checkDestroyed()

    // Execute onClear hooks
    this.pluginRegistry.executeOnClear()

    // Clear history
    this.historyStack.clear()

    // Reset to initial state
    const prevState = this.state
    this.state = this.initialState

    // Emit events
    this.emit({
      type: 'clear',
      timestamp: Date.now(),
    })

    this.emit({
      type: 'state-change',
      state: this.state,
      prevState,
      source: 'clear',
      timestamp: Date.now(),
    })

    // Execute onStateChange hooks
    this.pluginRegistry.executeOnStateChange(this.state, prevState)
  }

  goTo(position: number): T | null {
    this.checkDestroyed()

    const entry = this.historyStack.goTo(position)
    if (!entry && position !== -1) {
      return null
    }

    const prevState = this.state

    // If position is -1, go to initial state
    if (position === -1) {
      this.state = this.initialState
    } else {
      // Reconstruct state up to this position
      this.state = this.reconstructState(position)
    }

    // Emit event
    this.emit({
      type: 'state-change',
      state: this.state,
      prevState,
      source: 'goto',
      timestamp: Date.now(),
    })

    // Execute onStateChange hooks
    this.pluginRegistry.executeOnStateChange(this.state, prevState)

    return this.state
  }

  /**
   * Reconstruct state at a specific position
   */
  private reconstructState(position: number): T {
    // For snapshot strategy, just return the state at that position
    if (this.strategy.name === 'snapshot') {
      const entry = this.historyStack.getAt(position)
      return entry ? entry.state : this.initialState
    }

    // For command/patch strategies, replay all entries up to position
    let state = this.initialState
    for (let i = 0; i <= position; i++) {
      const entry = this.historyStack.getAt(i)
      if (entry) {
        state = this.strategy.applyRedo(entry, state)
      }
    }
    return state
  }

  // ============================================================================
  // Strategy
  // ============================================================================

  setStrategy(strategy: Strategy<T>): void {
    this.checkDestroyed()
    this.strategy = strategy
  }

  getStrategy(): Strategy<T> {
    this.checkDestroyed()
    return this.strategy
  }

  // ============================================================================
  // Plugin Management
  // ============================================================================

  register(plugin: Plugin<T>): void {
    this.checkDestroyed()
    this.pluginRegistry.register(plugin)
  }

  unregister(pluginName: string): void {
    this.checkDestroyed()
    this.pluginRegistry.unregister(pluginName)
  }

  getPlugin<P extends Plugin<T>>(name: string): P | undefined {
    this.checkDestroyed()
    return this.pluginRegistry.get<P>(name)
  }

  listPlugins(): PluginInfo[] {
    this.checkDestroyed()
    return this.pluginRegistry.list()
  }

  // ============================================================================
  // Event System
  // ============================================================================

  emit(event: KernelEvent<T>): void {
    if (this.destroyed) return
    this.eventBus.emit(event)
  }

  on(eventType: EventType, handler: EventHandler<T>): Unsubscribe {
    this.checkDestroyed()
    return this.eventBus.on(eventType, handler)
  }

  off(eventType: EventType, handler: EventHandler<T>): void {
    this.checkDestroyed()
    this.eventBus.off(eventType, handler)
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  configure(options: Partial<KernelOptions<T>>): void {
    this.checkDestroyed()

    if (options.limit !== undefined) {
      this.options.limit = options.limit
      this.historyStack.setLimit(options.limit)
    }

    if (options.strategy !== undefined) {
      this.options.strategy = options.strategy
    }

    if (options.plugins !== undefined) {
      this.options.plugins = options.plugins
    }
  }

  getOptions(): KernelOptions<T> {
    this.checkDestroyed()
    return { ...this.options }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  destroy(): void {
    if (this.destroyed) return

    // Emit destroy event
    this.emit({
      type: 'destroy',
      timestamp: Date.now(),
    })

    // Unregister all plugins
    this.pluginRegistry.clear()

    // Clear event handlers
    this.eventBus.clear()

    // Mark as destroyed
    this.destroyed = true
  }

  isDestroyed(): boolean {
    return this.destroyed
  }

  /**
   * Check if kernel is destroyed and throw error
   */
  private checkDestroyed(): void {
    if (this.destroyed) {
      throw new Error('Cannot use destroyed kernel')
    }
  }
}

/**
 * Create a history kernel with default options
 * @param options - Creation options
 * @returns Kernel instance
 */
export function createKernel<T>(
  strategy: Strategy<T>,
  options: CreateHistoryOptions<T>
): Kernel<T> {
  const kernelOptions: KernelOptions<T> = {
    initialState: options.initialState,
    strategy: options.strategy ?? 'snapshot',
    limit: options.limit ?? 100,
    plugins: options.plugins ?? [],
  }

  return new StateKeeperKernel<T>(strategy, kernelOptions)
}
