# StateKeeper

> Zero-dependency undo/redo history manager with micro-kernel plugin architecture

[![npm version](https://img.shields.io/npm/v/@oxog/statekeeper.svg)](https://www.npmjs.com/package/@oxog/statekeeper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

StateKeeper is a powerful and flexible history management library that provides undo/redo functionality for any JavaScript application. Built on a micro-kernel architecture with **zero runtime dependencies**.

## 🎯 Features

- **Zero Dependencies** - No external runtime dependencies
- **Multiple Strategies** - Choose between Snapshot, Command, or Patch strategies
- **Micro-Kernel Architecture** - Extend with plugins
- **Framework Agnostic** - Works with vanilla JS, React, Vue, Svelte, or any framework
- **Full TypeScript Support** - Written in TypeScript with strict mode
- **Branching Support** - Git-like branching for alternative timelines (via plugin)
- **Persistence** - Save/restore history to any storage (via plugin)
- **Time Travel Debugging** - Visual timeline UI (via plugin)
- **Tree-Shakeable** - Only bundle what you use

## 📦 Installation

```bash
npm install @oxog/statekeeper
```

```bash
yarn add @oxog/statekeeper
```

```bash
pnpm add @oxog/statekeeper
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { createHistory } from '@oxog/statekeeper'

// Create a history manager
const history = createHistory({
  initialState: { count: 0 },
  limit: 100, // Maximum 100 history entries
})

// Make changes
history.push({ count: 1 })
history.push({ count: 2 })
history.push({ count: 3 })

console.log(history.getState()) // { count: 3 }

// Undo
history.undo()
console.log(history.getState()) // { count: 2 }

// Redo
history.redo()
console.log(history.getState()) // { count: 3 }
```

### React Integration

```tsx
import { createHistory } from '@oxog/statekeeper'
import { useState, useEffect } from 'react'

function Counter() {
  const [history] = useState(() =>
    createHistory({ initialState: { count: 0 } })
  )
  const [state, setState] = useState(history.getState())

  useEffect(() => {
    return history.on('state-change', (event) => {
      setState(event.state)
    })
  }, [history])

  const increment = () => {
    history.push({ count: state.count + 1 })
  }

  return (
    <div>
      <h1>{state.count}</h1>
      <button onClick={increment}>Increment</button>
      <button onClick={() => history.undo()} disabled={!history.canUndo()}>
        Undo
      </button>
      <button onClick={() => history.redo()} disabled={!history.canRedo()}>
        Redo
      </button>
    </div>
  )
}
```

## 📖 Strategies

StateKeeper supports three different strategies for managing history:

### Snapshot Strategy (Default)

Stores complete state copies. Simple and fast for small to medium state.

```typescript
const history = createHistory({
  initialState: { count: 0 },
  strategy: 'snapshot' // or omit (default)
})
```

**Pros:**
- Simple to understand
- Fast undo/redo
- Works with any state structure

**Cons:**
- Higher memory usage for large states

### Command Strategy

Stores executable commands with undo/redo logic. Most memory efficient.

```typescript
import { createHistory, defineCommand } from '@oxog/statekeeper'

// Define commands
const incrementCommand = defineCommand({
  name: 'increment',
  execute: (state, amount: number) => ({
    ...state,
    count: state.count + amount
  }),
  undo: (state, amount: number) => ({
    ...state,
    count: state.count - amount
  })
})

const history = createHistory({
  initialState: { count: 0 },
  strategy: 'command'
})

const commandStrategy = history.getStrategy()
commandStrategy.registerCommand(incrementCommand)

// Execute command
const newState = commandStrategy.execute(incrementCommand, 5, history.getState())
history.push(newState)
```

**Pros:**
- Memory efficient
- Explicit intent
- Easy to debug

**Cons:**
- Requires command definitions
- More setup code

### Patch Strategy

Stores diffs using RFC 6902 JSON Patch. Efficient for large states with small changes.

```typescript
const history = createHistory({
  initialState: { count: 0, name: 'John', items: [] },
  strategy: 'patch'
})
```

**Pros:**
- Memory efficient for large states
- Automatic diff calculation
- Small payload size

**Cons:**
- Slower than snapshot for small states
- Complex for debugging

## 🎨 API Reference

### Core API

#### `createHistory(options)`

Creates a history manager instance.

```typescript
const history = createHistory({
  initialState: T,        // Required: Initial state
  strategy?: StrategyName, // Optional: 'snapshot' | 'command' | 'patch'
  limit?: number,         // Optional: Max entries (default: 100)
  plugins?: Plugin[]      // Optional: Plugins to register
})
```

#### State Management

```typescript
history.getState()           // Get current state
history.setState(state)      // Set state directly (bypasses history)
history.getInitialState()    // Get initial state
```

#### History Operations

```typescript
history.push(state, metadata?)  // Push new state
history.undo()                  // Undo to previous state
history.redo()                  // Redo to next state
history.canUndo()               // Check if undo is possible
history.canRedo()               // Check if redo is possible
history.clear()                 // Clear all history
history.goTo(position)          // Jump to specific position
```

#### History Access

```typescript
history.getHistory()     // Get complete history stack
history.getPosition()    // Get current position
history.getLength()      // Get number of entries
```

#### Events

```typescript
// Subscribe to events
const unsubscribe = history.on('state-change', (event) => {
  console.log('State changed:', event.state)
})

// Unsubscribe
unsubscribe()

// Available events:
// - 'push'
// - 'undo'
// - 'redo'
// - 'state-change'
// - 'clear'
// - 'destroy'
```

#### Lifecycle

```typescript
history.destroy()         // Clean up and destroy instance
history.isDestroyed()     // Check if destroyed
```

## 🔌 Plugins

StateKeeper can be extended with plugins. Full plugin system with branching, persistence, keyboard shortcuts, compression, and time-travel UI will be available soon.

```typescript
import { createHistory } from '@oxog/statekeeper'
// Plugins coming soon:
// import { branching, persistence, keyboardShortcuts } from '@oxog/statekeeper/plugins'

const history = createHistory({
  initialState: { count: 0 },
  // plugins: [branching(), persistence({ key: 'my-app' }), keyboardShortcuts()]
})
```

## 📚 Documentation

Full documentation website coming soon at [statekeeper.oxog.dev](https://statekeeper.oxog.dev)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

MIT © 2025 Ersin KOÇ

## 🔗 Links

- [GitHub Repository](https://github.com/ersinkoc/StateKeeper)
- [NPM Package](https://www.npmjs.com/package/@oxog/statekeeper)
- [Documentation](https://statekeeper.oxog.dev) (Coming Soon)
- [Issue Tracker](https://github.com/ersinkoc/StateKeeper/issues)

---

Made with ❤️ by [Ersin KOÇ](https://github.com/ersinkoc)
