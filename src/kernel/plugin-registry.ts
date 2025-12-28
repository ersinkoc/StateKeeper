import type { Plugin, PluginInfo, Kernel, HistoryEntry } from '../types'

/**
 * Plugin registry for managing kernel plugins
 */
export class PluginRegistry<T> {
  private plugins: Map<string, Plugin<T>> = new Map()
  private kernel: Kernel<T>

  constructor(kernel: Kernel<T>) {
    this.kernel = kernel
  }

  /**
   * Register a plugin
   * @param plugin - Plugin to register
   */
  register(plugin: Plugin<T>): void {
    // Check for duplicate names
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`)
    }

    // Install the plugin
    plugin.install(this.kernel)

    // Store the plugin
    this.plugins.set(plugin.name, plugin)

    // Emit plugin-registered event
    this.kernel.emit({
      type: 'plugin-registered',
      pluginName: plugin.name,
      timestamp: Date.now(),
    })
  }

  /**
   * Unregister a plugin
   * @param name - Plugin name to unregister
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`)
    }

    // Uninstall the plugin
    plugin.uninstall()

    // Remove from registry
    this.plugins.delete(name)

    // Emit plugin-unregistered event
    this.kernel.emit({
      type: 'plugin-unregistered',
      pluginName: name,
      timestamp: Date.now(),
    })
  }

  /**
   * Get a plugin by name
   * @param name - Plugin name
   * @returns Plugin instance or undefined
   */
  get<P extends Plugin<T>>(name: string): P | undefined {
    return this.plugins.get(name) as P | undefined
  }

  /**
   * Check if a plugin is registered
   * @param name - Plugin name
   * @returns True if plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * List all registered plugins
   * @returns Array of plugin info
   */
  list(): PluginInfo[] {
    const plugins: PluginInfo[] = []

    this.plugins.forEach((plugin) => {
      plugins.push({
        name: plugin.name,
        version: plugin.version,
        type: plugin.type,
        enabled: true,
      })
    })

    return plugins
  }

  /**
   * Execute beforePush hooks
   * @param state - New state
   * @param prevState - Previous state
   * @returns Modified state or false to cancel
   */
  executeBeforePush(state: T, prevState: T): T | false {
    let modifiedState = state

    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.beforePush) {
        const result = plugin.hooks.beforePush(modifiedState, prevState)
        if (result === false) {
          return false // Cancel the push
        }
        if (result !== undefined) {
          modifiedState = result
        }
      }
    }

    return modifiedState
  }

  /**
   * Execute afterPush hooks
   * @param entry - History entry that was pushed
   */
  executeAfterPush(entry: HistoryEntry<T>): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.afterPush) {
        try {
          plugin.hooks.afterPush(entry)
        } catch (error) {
          console.error(`[StateKeeper] Error in afterPush hook for ${plugin.name}:`, error)
        }
      }
    }
  }

  /**
   * Execute beforeUndo hooks
   * @param entry - History entry to undo
   * @returns False to cancel undo
   */
  executeBeforeUndo(entry: HistoryEntry<T>): boolean {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.beforeUndo) {
        const result = plugin.hooks.beforeUndo(entry)
        if (result === false) {
          return false // Cancel the undo
        }
      }
    }
    return true
  }

  /**
   * Execute afterUndo hooks
   * @param state - New state after undo
   * @param entry - History entry that was undone
   */
  executeAfterUndo(state: T, entry: HistoryEntry<T>): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.afterUndo) {
        try {
          plugin.hooks.afterUndo(state, entry)
        } catch (error) {
          console.error(`[StateKeeper] Error in afterUndo hook for ${plugin.name}:`, error)
        }
      }
    }
  }

  /**
   * Execute beforeRedo hooks
   * @param entry - History entry to redo
   * @returns False to cancel redo
   */
  executeBeforeRedo(entry: HistoryEntry<T>): boolean {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.beforeRedo) {
        const result = plugin.hooks.beforeRedo(entry)
        if (result === false) {
          return false // Cancel the redo
        }
      }
    }
    return true
  }

  /**
   * Execute afterRedo hooks
   * @param state - New state after redo
   * @param entry - History entry that was redone
   */
  executeAfterRedo(state: T, entry: HistoryEntry<T>): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.afterRedo) {
        try {
          plugin.hooks.afterRedo(state, entry)
        } catch (error) {
          console.error(`[StateKeeper] Error in afterRedo hook for ${plugin.name}:`, error)
        }
      }
    }
  }

  /**
   * Execute onStateChange hooks
   * @param state - New state
   * @param prevState - Previous state
   */
  executeOnStateChange(state: T, prevState: T): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.onStateChange) {
        try {
          plugin.hooks.onStateChange(state, prevState)
        } catch (error) {
          console.error(`[StateKeeper] Error in onStateChange hook for ${plugin.name}:`, error)
        }
      }
    }
  }

  /**
   * Execute onClear hooks
   */
  executeOnClear(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.hooks?.onClear) {
        try {
          plugin.hooks.onClear()
        } catch (error) {
          console.error(`[StateKeeper] Error in onClear hook for ${plugin.name}:`, error)
        }
      }
    }
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    // Uninstall all plugins
    const pluginNames = Array.from(this.plugins.keys())
    for (const name of pluginNames) {
      this.unregister(name)
    }
  }
}
