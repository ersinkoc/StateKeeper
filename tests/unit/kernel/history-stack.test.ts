import { HistoryStackManager } from '../../../src/kernel/history-stack'
import type { HistoryEntry } from '../../../src/types'

interface TestState {
  count: number
}

describe('HistoryStackManager', () => {
  const createEntry = (id: string, count: number): HistoryEntry<TestState> => ({
    id,
    timestamp: Date.now(),
    state: { count },
  })

  describe('basic operations', () => {
    it('should create history stack with limit', () => {
      const stack = new HistoryStackManager<TestState>(10)
      expect(stack.getLimit()).toBe(10)
      expect(stack.getLength()).toBe(0)
      expect(stack.getPosition()).toBe(-1)
    })

    it('should start at position -1', () => {
      const stack = new HistoryStackManager<TestState>(10)
      expect(stack.getPosition()).toBe(-1)
      expect(stack.getCurrent()).toBeNull()
    })
  })

  describe('push', () => {
    it('should push entry to stack', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const entry = createEntry('1', 1)

      const dropped = stack.push(entry)

      expect(dropped).toBeNull()
      expect(stack.getLength()).toBe(1)
      expect(stack.getPosition()).toBe(0)
      expect(stack.getCurrent()).toEqual(entry)
    })

    it('should push multiple entries', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))

      expect(stack.getLength()).toBe(3)
      expect(stack.getPosition()).toBe(2)
    })

    it('should truncate future entries when pushing in middle', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.undo()
      stack.undo()

      // Now at position 0, should truncate entries 2 and 3
      stack.push(createEntry('4', 4))

      expect(stack.getLength()).toBe(2)
      expect(stack.getPosition()).toBe(1)
      expect(stack.getCurrent()?.id).toBe('4')
    })

    it('should enforce limit and drop oldest entry', () => {
      const stack = new HistoryStackManager<TestState>(3)

      const entry1 = createEntry('1', 1)
      stack.push(entry1)
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))

      // Should drop entry1 when pushing entry4
      const dropped = stack.push(createEntry('4', 4))

      expect(dropped).toEqual(entry1)
      expect(stack.getLength()).toBe(3)
      expect(stack.getPosition()).toBe(2)
    })

    it('should not enforce limit when limit is 0', () => {
      const stack = new HistoryStackManager<TestState>(0)

      for (let i = 1; i <= 100; i++) {
        const dropped = stack.push(createEntry(`${i}`, i))
        expect(dropped).toBeNull()
      }

      expect(stack.getLength()).toBe(100)
    })
  })

  describe('undo', () => {
    it('should undo and return entry', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const entry1 = createEntry('1', 1)
      const entry2 = createEntry('2', 2)

      stack.push(entry1)
      stack.push(entry2)

      const undone = stack.undo()

      expect(undone).toEqual(entry2)
      expect(stack.getPosition()).toBe(0)
      expect(stack.getCurrent()).toEqual(entry1)
    })

    it('should return null when at initial position', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const result = stack.undo()
      expect(result).toBeNull()
    })

    it('should return null when undoing past initial position', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))
      stack.undo()

      const result = stack.undo()

      expect(result).toBeNull()
      expect(stack.getPosition()).toBe(-1)
    })

    it('should undo multiple times', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))

      stack.undo()
      stack.undo()
      stack.undo()

      expect(stack.getPosition()).toBe(-1)
      expect(stack.getCurrent()).toBeNull()
    })
  })

  describe('redo', () => {
    it('should redo and return entry', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const entry1 = createEntry('1', 1)
      const entry2 = createEntry('2', 2)

      stack.push(entry1)
      stack.push(entry2)
      stack.undo()

      const redone = stack.redo()

      expect(redone).toEqual(entry2)
      expect(stack.getPosition()).toBe(1)
      expect(stack.getCurrent()).toEqual(entry2)
    })

    it('should return null when at end', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      const result = stack.redo()

      expect(result).toBeNull()
    })

    it('should redo multiple times', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.undo()
      stack.undo()
      stack.undo()

      stack.redo()
      stack.redo()

      expect(stack.getPosition()).toBe(1)
      expect(stack.getCurrent()?.id).toBe('2')
    })
  })

  describe('canUndo and canRedo', () => {
    it('should check if undo is possible', () => {
      const stack = new HistoryStackManager<TestState>(10)

      expect(stack.canUndo()).toBe(false)

      stack.push(createEntry('1', 1))
      expect(stack.canUndo()).toBe(true)

      stack.undo()
      expect(stack.canUndo()).toBe(false)
    })

    it('should check if redo is possible', () => {
      const stack = new HistoryStackManager<TestState>(10)

      expect(stack.canRedo()).toBe(false)

      stack.push(createEntry('1', 1))
      expect(stack.canRedo()).toBe(false)

      stack.undo()
      expect(stack.canRedo()).toBe(true)

      stack.redo()
      expect(stack.canRedo()).toBe(false)
    })
  })

  describe('getCurrent', () => {
    it('should get current entry', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const entry = createEntry('1', 1)

      stack.push(entry)

      expect(stack.getCurrent()).toEqual(entry)
    })

    it('should return null when at initial position', () => {
      const stack = new HistoryStackManager<TestState>(10)
      expect(stack.getCurrent()).toBeNull()
    })

    it('should return null when position is out of bounds', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      // Manually corrupt position to test bounds checking
      ;(stack as any).position = 10
      expect(stack.getCurrent()).toBeNull()
    })
  })

  describe('getAt', () => {
    it('should get entry at specific position', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const entry1 = createEntry('1', 1)
      const entry2 = createEntry('2', 2)

      stack.push(entry1)
      stack.push(entry2)

      expect(stack.getAt(0)).toEqual(entry1)
      expect(stack.getAt(1)).toEqual(entry2)
    })

    it('should return null for negative position', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      expect(stack.getAt(-1)).toBeNull()
    })

    it('should return null for position out of bounds', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      expect(stack.getAt(10)).toBeNull()
    })
  })

  describe('getById', () => {
    it('should get entry by ID', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const entry1 = createEntry('test-id', 1)
      const entry2 = createEntry('other-id', 2)

      stack.push(entry1)
      stack.push(entry2)

      expect(stack.getById('test-id')).toEqual(entry1)
      expect(stack.getById('other-id')).toEqual(entry2)
    })

    it('should return null for non-existent ID', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      expect(stack.getById('nonexistent')).toBeNull()
    })
  })

  describe('goTo', () => {
    it('should go to specific position', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))

      const entry = stack.goTo(1)

      expect(stack.getPosition()).toBe(1)
      expect(entry?.id).toBe('2')
    })

    it('should go to initial position (-1)', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      const entry = stack.goTo(-1)

      expect(stack.getPosition()).toBe(-1)
      expect(entry).toBeNull()
    })

    it('should return null for position before -1', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      const entry = stack.goTo(-2)

      expect(entry).toBeNull()
      expect(stack.getPosition()).toBe(0) // Position unchanged
    })

    it('should return null for position out of bounds', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      const entry = stack.goTo(10)

      expect(entry).toBeNull()
    })
  })

  describe('getEntries', () => {
    it('should get all entries', () => {
      const stack = new HistoryStackManager<TestState>(10)
      const entry1 = createEntry('1', 1)
      const entry2 = createEntry('2', 2)

      stack.push(entry1)
      stack.push(entry2)

      const entries = stack.getEntries()

      expect(entries).toHaveLength(2)
      expect(entries[0]).toEqual(entry1)
      expect(entries[1]).toEqual(entry2)
    })

    it('should return copy of entries array', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      const entries1 = stack.getEntries()
      const entries2 = stack.getEntries()

      expect(entries1).not.toBe(entries2)
      expect(entries1).toEqual(entries2)
    })
  })

  describe('getUndoStack', () => {
    it('should get undo stack', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.undo()

      const undoStack = stack.getUndoStack()

      expect(undoStack).toHaveLength(2)
      expect(undoStack[0]?.id).toBe('1')
      expect(undoStack[1]?.id).toBe('2')
    })

    it('should return empty array at initial position', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))
      stack.undo()

      expect(stack.getUndoStack()).toEqual([])
    })
  })

  describe('getRedoStack', () => {
    it('should get redo stack', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.undo()
      stack.undo()

      const redoStack = stack.getRedoStack()

      expect(redoStack).toHaveLength(2)
      expect(redoStack[0]?.id).toBe('2')
      expect(redoStack[1]?.id).toBe('3')
    })

    it('should return empty array at end position', () => {
      const stack = new HistoryStackManager<TestState>(10)
      stack.push(createEntry('1', 1))

      expect(stack.getRedoStack()).toEqual([])
    })
  })

  describe('clear', () => {
    it('should clear all entries', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))

      stack.clear()

      expect(stack.getLength()).toBe(0)
      expect(stack.getPosition()).toBe(-1)
      expect(stack.getEntries()).toEqual([])
    })
  })

  describe('setLimit', () => {
    it('should set new limit', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.setLimit(20)

      expect(stack.getLimit()).toBe(20)
    })

    it('should truncate entries when reducing limit', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.push(createEntry('4', 4))

      stack.setLimit(2)

      expect(stack.getLength()).toBe(2)
      expect(stack.getAt(0)?.id).toBe('3')
      expect(stack.getAt(1)?.id).toBe('4')
    })

    it('should adjust position when truncating', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.push(createEntry('4', 4))

      const positionBefore = stack.getPosition() // Should be 3
      stack.setLimit(2) // Remove first 2 entries
      const positionAfter = stack.getPosition() // Should be 1

      expect(positionBefore).toBe(3)
      expect(positionAfter).toBe(1)
    })

    it('should not set position below -1 after truncating', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.undo()
      stack.undo()
      stack.undo() // Now at position -1

      stack.setLimit(1) // Should remove first 2 entries and adjust position

      expect(stack.getPosition()).toBe(-1)
    })

    it('should not truncate when limit is 0', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))

      stack.setLimit(0)

      expect(stack.getLength()).toBe(2)
    })
  })

  describe('getStack and restoreStack', () => {
    it('should get complete stack', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))

      const historyStack = stack.getStack()

      expect(historyStack.entries).toHaveLength(2)
      expect(historyStack.position).toBe(1)
      expect(historyStack.currentBranch).toBe('main')
      expect(historyStack.branches).toHaveLength(1)
      expect(historyStack.branches[0]?.id).toBe('main')
    })

    it('should restore stack', () => {
      const stack1 = new HistoryStackManager<TestState>(10)
      stack1.push(createEntry('1', 1))
      stack1.push(createEntry('2', 2))

      const historyStack = stack1.getStack()

      const stack2 = new HistoryStackManager<TestState>(5)
      stack2.restoreStack(historyStack)

      expect(stack2.getLength()).toBe(2)
      expect(stack2.getPosition()).toBe(1)
      expect(stack2.getCurrent()?.id).toBe('2')
    })

    it('should preserve branches when restoring', () => {
      const stack1 = new HistoryStackManager<TestState>(10)
      stack1.push(createEntry('1', 1))

      const historyStack = stack1.getStack()

      const stack2 = new HistoryStackManager<TestState>(10)
      stack2.restoreStack(historyStack)

      const restoredStack = stack2.getStack()
      expect(restoredStack.branches).toHaveLength(1)
      expect(restoredStack.branches[0]?.name).toBe('main')
    })
  })

  describe('getStats', () => {
    it('should get statistics', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.undo()

      const stats = stack.getStats()

      expect(stats.totalEntries).toBe(3)
      expect(stats.undoCount).toBe(2)
      expect(stats.redoCount).toBe(1)
      expect(stats.currentPosition).toBe(1)
      expect(stats.limit).toBe(10)
    })

    it('should show correct stats at initial position', () => {
      const stack = new HistoryStackManager<TestState>(10)

      const stats = stack.getStats()

      expect(stats.totalEntries).toBe(0)
      expect(stats.undoCount).toBe(0)
      expect(stats.redoCount).toBe(0)
      expect(stats.currentPosition).toBe(-1)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid undo/redo cycles', () => {
      const stack = new HistoryStackManager<TestState>(10)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))

      for (let i = 0; i < 10; i++) {
        stack.undo()
        stack.redo()
      }

      expect(stack.getPosition()).toBe(1)
      expect(stack.getCurrent()?.id).toBe('2')
    })

    it('should handle large number of entries', () => {
      const stack = new HistoryStackManager<TestState>(1000)

      for (let i = 0; i < 1000; i++) {
        stack.push(createEntry(`${i}`, i))
      }

      expect(stack.getLength()).toBe(1000)
      expect(stack.getPosition()).toBe(999)
    })

    it('should maintain consistency after complex operations', () => {
      const stack = new HistoryStackManager<TestState>(5)

      stack.push(createEntry('1', 1))
      stack.push(createEntry('2', 2))
      stack.push(createEntry('3', 3))
      stack.undo() // position=1 (at '2')
      stack.push(createEntry('4', 4)) // truncates '3', adds '4', position=2 (at '4')
      stack.undo() // position=1 (at '2')
      stack.undo() // position=0 (at '1')
      stack.redo() // position=1 (at '2')

      const current = stack.getCurrent()
      expect(current?.id).toBe('2')
      expect(stack.getLength()).toBe(3)
    })
  })
})
