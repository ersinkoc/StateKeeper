# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-28

### Added

#### Core Features
- 🎯 **Zero-dependency** history management system
- ✅ **Full TypeScript** support with strict mode
- 🔄 **Three strategies**: Snapshot, Command, and Patch
- 🏗️ **Micro-kernel architecture** with plugin system
- 📦 **Tree-shakeable** - only bundle what you use

#### Strategies
- **Snapshot Strategy**: Complete state copies for simple use cases
- **Command Strategy**: Memory-efficient command pattern with explicit undo/redo
- **Patch Strategy**: RFC 6902 JSON Patch for large states with small changes

#### Core API
- `createHistory()` - Factory function to create history instances
- `push()` - Add new state to history
- `undo()` / `redo()` - Navigate through history
- `canUndo()` / `canRedo()` - Check operation availability
- `getState()` / `setState()` - State access and manipulation
- `clear()` - Reset history
- `goTo()` - Jump to specific position
- `getHistory()` - Access complete history stack
- `destroy()` - Cleanup and destroy instance

#### Event System
- Event bus for state changes
- Support for custom event handlers
- Events: `push`, `undo`, `redo`, `state-change`, `clear`, `destroy`
- Unsubscribe mechanism for memory cleanup

#### Utilities
- `deepClone()` - Deep clone with circular reference support
- `deepEqual()` - Deep equality comparison
- `diff()` - RFC 6902 JSON Patch generation
- `applyPatch()` - Apply JSON Patch operations
- `createInversePatch()` - Generate inverse patches for undo
- `compress()` / `decompress()` - LZ-string compression
- `uid()` - Unique ID generation
- `parseShortcut()` / `matchShortcut()` - Keyboard shortcut utilities

#### Type Safety
- Full TypeScript definitions for all APIs
- Strict mode compliance
- Generic types for custom state
- Comprehensive type exports

#### Documentation
- Complete README with examples
- Detailed SPECIFICATION.md
- IMPLEMENTATION.md with architecture details
- TASKS.md with development roadmap
- Inline JSDoc documentation

### Security
- No runtime dependencies
- No external links except GitHub and documentation
- Sandboxed execution
- No eval or Function constructor usage

### Performance
- Efficient memory management with configurable limits
- Lazy evaluation where possible
- Optimized patch generation
- Minimal bundle size

---

## Future Roadmap

### [1.1.0] - Planned

#### Plugins (Optional)
- **Branching Plugin**: Git-like branching for alternative timelines
- **Persistence Plugin**: Save/restore to localStorage, IndexedDB, or custom storage
- **Keyboard Shortcuts Plugin**: Built-in undo/redo shortcuts
- **Compression Plugin**: Automatic history compression
- **Middleware Plugin**: Intercept and transform operations
- **Time Travel UI Plugin**: Visual debugging panel

#### Framework Adapters
- **React Adapter**: Hooks and providers
  - `useHistory()` hook
  - `useHistoryState()` selector hook
  - `<HistoryProvider>` component
- **Vue Adapter**: Composables
  - `useHistory()` composable
  - `provideHistory()` / `injectHistory()`
- **Svelte Adapter**: Stores
  - `createHistoryStore()` factory

#### Documentation Website
- Interactive examples
- API reference
- Strategy comparison
- Plugin documentation
- Framework integration guides
- Playground with live editor

### [1.2.0] - Planned
- Group operations (batch multiple changes)
- Enhanced metadata support
- Advanced compression algorithms
- Performance profiling tools
- DevTools integration

---

[1.0.0]: https://github.com/ersinkoc/StateKeeper/releases/tag/v1.0.0
