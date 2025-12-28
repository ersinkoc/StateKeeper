import type { Strategy, HistoryEntry, EntryMetadata } from '../types'
import { deepClone } from '../utils/deep-clone'
import { uid } from '../utils/uid'

/**
 * Snapshot strategy options
 */
export interface SnapshotStrategyOptions {
  /** Use deep clone (default: true) */
  deepClone?: boolean
  /** Custom clone function */
  cloneFunction?: <T>(state: T) => T
}

/**
 * Snapshot Strategy - stores complete state copies
 */
export class SnapshotStrategy<T> implements Strategy<T> {
  readonly name = 'snapshot' as const
  private cloneFunction: <T>(state: T) => T

  constructor(options: SnapshotStrategyOptions = {}) {
    const shouldDeepClone = options.deepClone ?? true

    if (options.cloneFunction) {
      this.cloneFunction = options.cloneFunction
    } else if (shouldDeepClone) {
      this.cloneFunction = deepClone
    } else {
      // Shallow clone
      this.cloneFunction = <T>(state: T): T => {
        if (Array.isArray(state)) {
          return [...state] as T
        }
        if (typeof state === 'object' && state !== null) {
          return { ...state }
        }
        return state
      }
    }
  }

  createEntry(state: T, _prevState: T, metadata?: EntryMetadata): HistoryEntry<T> {
    const entry: HistoryEntry<T> = {
      id: uid(),
      timestamp: Date.now(),
      state: this.cloneFunction(state),
    }
    if (metadata) {
      entry.metadata = metadata
    }
    return entry
  }

  applyUndo(entry: HistoryEntry<T>, _currentState: T): T {
    // For snapshot, we need to return the previous entry's state
    // This will be handled by the kernel
    return this.cloneFunction(entry.state)
  }

  applyRedo(entry: HistoryEntry<T>, _currentState: T): T {
    return this.cloneFunction(entry.state)
  }

  serialize(entry: HistoryEntry<T>): string {
    return JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      state: entry.state,
      metadata: entry.metadata,
    })
  }

  deserialize(data: string): HistoryEntry<T> {
    const parsed = JSON.parse(data) as HistoryEntry<T>
    const entry: HistoryEntry<T> = {
      id: parsed.id,
      timestamp: parsed.timestamp,
      state: parsed.state,
    }
    if (parsed.metadata) {
      entry.metadata = parsed.metadata
    }
    return entry
  }
}

/**
 * Create a snapshot strategy
 * @param options - Strategy options
 * @returns Snapshot strategy instance
 */
export function createSnapshotStrategy<T>(
  options?: SnapshotStrategyOptions
): SnapshotStrategy<T> {
  return new SnapshotStrategy<T>(options)
}
