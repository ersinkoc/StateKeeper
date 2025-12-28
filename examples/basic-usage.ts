/**
 * Basic usage example of StateKeeper
 */

import { createHistory } from '../src/index'

// Example 1: Simple counter with snapshot strategy
function counterExample() {
  console.log('\n=== Counter Example ===')

  const history = createHistory({
    initialState: { count: 0 },
    limit: 10
  })

  // Subscribe to state changes
  history.on('state-change', (event) => {
    console.log(`State changed: ${JSON.stringify(event.state)}`)
  })

  // Make changes
  history.push({ count: 1 })
  history.push({ count: 2 })
  history.push({ count: 3 })

  console.log('Current:', history.getState()) // { count: 3 }

  // Undo
  history.undo()
  console.log('After undo:', history.getState()) // { count: 2 }

  // Redo
  history.redo()
  console.log('After redo:', history.getState()) // { count: 3 }

  // Check capabilities
  console.log('Can undo?', history.canUndo()) // true
  console.log('Can redo?', history.canRedo()) // false
}

// Example 2: Todo list
function todoExample() {
  console.log('\n=== Todo List Example ===')

  interface TodoState {
    todos: Array<{ id: number; text: string; done: boolean }>
  }

  const history = createHistory<TodoState>({
    initialState: { todos: [] }
  })

  // Add todos
  history.push({
    todos: [{ id: 1, text: 'Learn StateKeeper', done: false }]
  })

  history.push({
    todos: [
      { id: 1, text: 'Learn StateKeeper', done: true },
      { id: 2, text: 'Build app', done: false }
    ]
  })

  console.log('Current todos:', history.getState().todos.length) // 2

  // Undo to previous state
  history.undo()
  console.log('After undo:', history.getState().todos.length) // 1

  // Get history info
  console.log('Position:', history.getPosition()) // 0
  console.log('Total entries:', history.getLength()) // 2
}

// Example 3: Using metadata
function metadataExample() {
  console.log('\n=== Metadata Example ===')

  const history = createHistory({ initialState: { count: 0 } })

  history.push({ count: 1 }, { name: 'Increment', description: 'Increased by 1' })
  history.push({ count: 2 }, { name: 'Increment', description: 'Increased by 1' })

  const historyStack = history.getHistory()
  historyStack.entries.forEach((entry, i) => {
    console.log(`Entry ${i}:`, entry.metadata?.name)
  })
}

// Example 4: Event handling
function eventsExample() {
  console.log('\n=== Events Example ===')

  const history = createHistory({ initialState: { value: 0 } })

  // Subscribe to specific events
  const unsubscribe = history.on('push', (event) => {
    console.log('Pushed:', event.state)
  })

  history.push({ value: 1 })
  history.push({ value: 2 })

  // Unsubscribe
  unsubscribe()

  history.push({ value: 3 }) // This won't trigger the handler
}

// Run all examples
if (require.main === module) {
  counterExample()
  todoExample()
  metadataExample()
  eventsExample()
}

export { counterExample, todoExample, metadataExample, eventsExample }
