import type { Strategy, HistoryEntry, EntryMetadata, Patch } from '../types'
import { uid } from '../utils/uid'
import { diff } from '../utils/diff'
import { applyPatch, createInversePatches } from '../utils/patch'

/**
 * Patch strategy options
 */
export interface PatchStrategyOptions {
  /** Custom diff function */
  diffFunction?: <T>(prev: T, next: T) => Patch[]
  /** Custom patch function */
  patchFunction?: <T>(state: T, patches: Patch[]) => T
}

/**
 * Patch Strategy - stores diffs using RFC 6902 JSON Patch
 */
export class PatchStrategy<T> implements Strategy<T> {
  readonly name = 'patch' as const
  private diffFunction: <T>(prev: T, next: T) => Patch[]
  private patchFunction: <T>(state: T, patches: Patch[]) => T

  constructor(options: PatchStrategyOptions = {}) {
    this.diffFunction = options.diffFunction || diff
    this.patchFunction = options.patchFunction || applyPatch
  }

  createEntry(state: T, prevState: T, metadata?: EntryMetadata): HistoryEntry<T> {
    const patches = this.diffFunction(prevState, state)
    const inversePatches = createInversePatches(patches, prevState)

    const entry: HistoryEntry<T> = {
      id: uid(),
      timestamp: Date.now(),
      state, // Store for quick access
      patches,
      inversePatches,
    }
    if (metadata) {
      entry.metadata = metadata
    }
    return entry
  }

  applyUndo(entry: HistoryEntry<T>, currentState: T): T {
    if (!entry.inversePatches) {
      throw new Error('Entry does not have inverse patches')
    }

    return this.patchFunction(currentState, entry.inversePatches)
  }

  applyRedo(entry: HistoryEntry<T>, currentState: T): T {
    if (!entry.patches) {
      throw new Error('Entry does not have patches')
    }

    return this.patchFunction(currentState, entry.patches)
  }

  serialize(entry: HistoryEntry<T>): string {
    return JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      patches: entry.patches,
      inversePatches: entry.inversePatches,
      metadata: entry.metadata,
    })
  }

  deserialize(data: string): HistoryEntry<T> {
    const parsed = JSON.parse(data) as {
      id: string
      timestamp: number
      patches: Patch[]
      inversePatches: Patch[]
      metadata?: EntryMetadata
    }

    const entry: HistoryEntry<T> = {
      id: parsed.id,
      timestamp: parsed.timestamp,
      state: undefined as unknown as T, // Will be reconstructed
      patches: parsed.patches,
      inversePatches: parsed.inversePatches,
    }
    if (parsed.metadata) {
      entry.metadata = parsed.metadata
    }
    return entry
  }

  /**
   * Get patches from an entry
   * @param entry - History entry
   * @returns Array of patches
   */
  getPatches(entry: HistoryEntry<T>): Patch[] {
    return entry.patches || []
  }

  /**
   * Get inverse patches from an entry
   * @param entry - History entry
   * @returns Array of inverse patches
   */
  getInversePatches(entry: HistoryEntry<T>): Patch[] {
    return entry.inversePatches || []
  }

  /**
   * Apply patches to a state
   * @param state - State to patch
   * @param patches - Patches to apply
   * @returns New state
   */
  applyPatches(state: T, patches: Patch[]): T {
    return this.patchFunction(state, patches)
  }

  /**
   * Create patches between two states
   * @param prev - Previous state
   * @param next - Next state
   * @returns Array of patches
   */
  createPatch(prev: T, next: T): Patch[] {
    return this.diffFunction(prev, next)
  }
}

/**
 * Create a patch strategy
 * @param options - Strategy options
 * @returns Patch strategy instance
 */
export function createPatchStrategy<T>(options?: PatchStrategyOptions): PatchStrategy<T> {
  return new PatchStrategy<T>(options)
}
