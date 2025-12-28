/**
 * StateKeeper - Zero-dependency undo/redo history manager
 * @packageDocumentation
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Core types
  UID,
  Unsubscribe,
  // History types
  EntryMetadata,
  HistoryEntry,
  CommandEntry,
  Branch,
  HistoryStack,
  // Patch types
  PatchOperation,
  Patch,
  // Command types
  Command,
  // Strategy types
  StrategyName,
  Strategy,
  // Event types
  EventType,
  BaseEvent,
  PushEvent,
  UndoEvent,
  RedoEvent,
  StateChangeSource,
  StateChangeEvent,
  ClearEvent,
  GroupStartEvent,
  GroupEndEvent,
  BranchCreateEvent,
  BranchSwitchEvent,
  LimitReachedEvent,
  PluginRegisteredEvent,
  PluginUnregisteredEvent,
  DestroyEvent,
  KernelEvent,
  EventHandler,
  // Plugin types
  PluginType,
  PluginHooks,
  Plugin,
  PluginInfo,
  // Kernel types
  CreateHistoryOptions,
  KernelOptions,
  Kernel,
  // Utility types
  DeepPartial,
  PluginAPI,
} from './types'

// ============================================================================
// Utility Exports
// ============================================================================

export {
  uid,
  deepClone,
  deepEqual,
  diff,
  escapeKey,
  unescapeKey,
  parsePath,
  applyPatch,
  createInversePatch,
  createInversePatches,
  compress,
  decompress,
  parseShortcut,
  matchShortcut,
  matchAnyShortcut,
  formatShortcut,
} from './utils'

export type { ShortcutDefinition } from './utils'

// ============================================================================
// Kernel Exports
// ============================================================================

export { StateKeeperKernel } from './kernel'

// ============================================================================
// Strategy Exports
// ============================================================================

export {
  SnapshotStrategy,
  createSnapshotStrategy,
  CommandStrategy,
  createCommandStrategy,
  defineCommand,
  PatchStrategy,
  createPatchStrategy,
} from './strategies'

export type {
  SnapshotStrategyOptions,
  CommandStrategyOptions,
  PatchStrategyOptions,
} from './strategies'

// ============================================================================
// Main Factory Function
// ============================================================================

import type { CreateHistoryOptions, Kernel } from './types'
import { StateKeeperKernel } from './kernel'
import { createSnapshotStrategy } from './strategies/snapshot'
import { createCommandStrategy } from './strategies/command'
import { createPatchStrategy } from './strategies/patch'

/**
 * Create a history manager instance
 *
 * @example
 * ```ts
 * // Snapshot strategy (default)
 * const history = createHistory({ initialState: { count: 0 } })
 *
 * // Command strategy
 * const history = createHistory({
 *   initialState: { count: 0 },
 *   strategy: 'command'
 * })
 *
 * // Patch strategy
 * const history = createHistory({
 *   initialState: { count: 0 },
 *   strategy: 'patch'
 * })
 * ```
 *
 * @param options - Creation options
 * @returns History kernel instance
 */
export function createHistory<T>(options: CreateHistoryOptions<T>): Kernel<T> {
  const strategyName = options.strategy ?? 'snapshot'
  const limit = options.limit ?? 100
  const plugins = options.plugins ?? []

  // Create strategy instance
  let strategy
  switch (strategyName) {
    case 'snapshot':
      strategy = createSnapshotStrategy<T>()
      break
    case 'command':
      strategy = createCommandStrategy<T>()
      break
    case 'patch':
      strategy = createPatchStrategy<T>()
      break
    default:
      throw new Error(`Unknown strategy: ${strategyName}`)
  }

  // Create kernel
  const kernel = new StateKeeperKernel<T>(strategy, {
    initialState: options.initialState,
    strategy: strategyName,
    limit,
    plugins,
  })

  return kernel
}

// ============================================================================
// Version
// ============================================================================

export const VERSION = '1.0.0'
