import type { HistoryEntry, HistoryStack, Branch } from '../types'

/**
 * Internal history stack management
 */
export class HistoryStackManager<T> {
  private entries: HistoryEntry<T>[] = []
  private position = -1 // -1 = at initial state
  private branches: Map<string, Branch<T>> = new Map()
  private currentBranch = 'main'
  private limit: number

  constructor(limit: number) {
    this.limit = limit

    // Initialize main branch
    this.branches.set('main', {
      id: 'main',
      name: 'main',
      parentBranch: null,
      forkPosition: 0,
      entries: [],
      createdAt: Date.now(),
    })
  }

  /**
   * Push a new entry to the stack
   * @param entry - Entry to push
   * @returns Dropped entry if limit was reached
   */
  push(entry: HistoryEntry<T>): HistoryEntry<T> | null {
    // Truncate future entries if we're not at the end
    if (this.position < this.entries.length - 1) {
      this.entries.splice(this.position + 1)
    }

    // Add the entry
    this.entries.push(entry)
    this.position++

    // Enforce limit
    let droppedEntry: HistoryEntry<T> | null = null
    if (this.limit > 0 && this.entries.length > this.limit) {
      droppedEntry = this.entries.shift()!
      this.position--
    }

    return droppedEntry
  }

  /**
   * Move position backward (undo)
   * @returns Entry that was undone or null
   */
  undo(): HistoryEntry<T> | null {
    if (this.position < 0) {
      return null
    }

    const entry = this.entries[this.position]!
    this.position--
    return entry
  }

  /**
   * Move position forward (redo)
   * @returns Entry that was redone or null
   */
  redo(): HistoryEntry<T> | null {
    if (this.position >= this.entries.length - 1) {
      return null
    }

    this.position++
    return this.entries[this.position]!
  }

  /**
   * Get entry at current position
   * @returns Current entry or null
   */
  getCurrent(): HistoryEntry<T> | null {
    if (this.position < 0 || this.position >= this.entries.length) {
      return null
    }
    return this.entries[this.position]!
  }

  /**
   * Get entry at specific position
   * @param position - Position to get
   * @returns Entry at position or null
   */
  getAt(position: number): HistoryEntry<T> | null {
    if (position < 0 || position >= this.entries.length) {
      return null
    }
    return this.entries[position]!
  }

  /**
   * Get entry by ID
   * @param id - Entry ID
   * @returns Entry with ID or null
   */
  getById(id: string): HistoryEntry<T> | null {
    return this.entries.find((e) => e.id === id) ?? null
  }

  /**
   * Go to a specific position
   * @param position - Target position
   * @returns Entry at position or null
   */
  goTo(position: number): HistoryEntry<T> | null {
    if (position < -1 || position >= this.entries.length) {
      return null
    }

    this.position = position
    return this.getCurrent()
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.position >= 0
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.position < this.entries.length - 1
  }

  /**
   * Get current position
   */
  getPosition(): number {
    return this.position
  }

  /**
   * Get all entries
   */
  getEntries(): HistoryEntry<T>[] {
    return [...this.entries]
  }

  /**
   * Get entries that can be undone
   */
  getUndoStack(): HistoryEntry<T>[] {
    if (this.position < 0) {
      return []
    }
    return this.entries.slice(0, this.position + 1)
  }

  /**
   * Get entries that can be redone
   */
  getRedoStack(): HistoryEntry<T>[] {
    if (this.position >= this.entries.length - 1) {
      return []
    }
    return this.entries.slice(this.position + 1)
  }

  /**
   * Get number of entries
   */
  getLength(): number {
    return this.entries.length
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = []
    this.position = -1
  }

  /**
   * Set entry limit
   * @param limit - New limit
   */
  setLimit(limit: number): void {
    this.limit = limit

    // Enforce new limit
    if (this.limit > 0 && this.entries.length > this.limit) {
      const toRemove = this.entries.length - this.limit
      this.entries.splice(0, toRemove)
      this.position -= toRemove
      if (this.position < -1) {
        this.position = -1
      }
    }
  }

  /**
   * Get current limit
   */
  getLimit(): number {
    return this.limit
  }

  /**
   * Get complete history stack (for serialization)
   */
  getStack(): HistoryStack<T> {
    return {
      entries: [...this.entries],
      position: this.position,
      branches: Array.from(this.branches.values()),
      currentBranch: this.currentBranch,
    }
  }

  /**
   * Restore history stack (from deserialization)
   * @param stack - History stack to restore
   */
  restoreStack(stack: HistoryStack<T>): void {
    this.entries = [...stack.entries]
    this.position = stack.position
    this.currentBranch = stack.currentBranch
    this.branches.clear()
    stack.branches.forEach((branch) => {
      this.branches.set(branch.id, branch)
    })
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number
    undoCount: number
    redoCount: number
    currentPosition: number
    limit: number
  } {
    return {
      totalEntries: this.entries.length,
      undoCount: this.position + 1,
      redoCount: this.entries.length - this.position - 1,
      currentPosition: this.position,
      limit: this.limit,
    }
  }
}
