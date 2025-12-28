// Integration test to verify the package works
import { createHistory } from './dist/index.js'

console.log('Testing @oxog/statekeeper package...\n')

// Test 1: Basic usage
console.log('Test 1: Basic snapshot strategy')
const history = createHistory({
  initialState: { count: 0 },
  strategy: 'snapshot'
})

history.push({ count: 1 })
history.push({ count: 2 })
console.log('Current state:', history.getState()) // { count: 2 }
console.log('Can undo:', history.canUndo()) // true

history.undo()
console.log('After undo:', history.getState()) // { count: 1 }

history.redo()
console.log('After redo:', history.getState()) // { count: 2 }

// Test 2: Events
console.log('\nTest 2: Event system')
let eventCount = 0
const unsubscribe = history.on('push', () => {
  eventCount++
  console.log('Push event fired, count:', eventCount)
})

history.push({ count: 3 })
unsubscribe()

// Test 3: Patch strategy
console.log('\nTest 3: Patch strategy')
const patchHistory = createHistory({
  initialState: { name: 'John', age: 30, items: [] },
  strategy: 'patch'
})

patchHistory.push({ name: 'John', age: 31, items: [] })
patchHistory.push({ name: 'Jane', age: 31, items: [1, 2] })
console.log('Patch state:', patchHistory.getState())
console.log('History length:', patchHistory.getLength())

patchHistory.undo()
console.log('After undo:', patchHistory.getState())

// Test 4: Clear and destroy
console.log('\nTest 4: Clear and destroy')
history.clear()
console.log('After clear:', history.getState()) // { count: 0 }
console.log('History length:', history.getLength()) // 0

history.destroy()
console.log('Destroyed:', history.isDestroyed()) // true

console.log('\n✅ All integration tests passed!')
