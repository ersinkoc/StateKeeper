import { Card } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

export function ApiReference() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
        <p className="text-muted-foreground mb-8">
          Complete API documentation for StateKeeper
        </p>

        <Tabs defaultValue="history" className="w-full">
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="commands">Commands</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">createHistory()</h2>
              <p className="text-muted-foreground mb-4">
                Creates a new history instance
              </p>

              <h3 className="text-lg font-semibold mb-2">Parameters</h3>
              <div className="bg-muted p-4 rounded-md space-y-2">
                <div>
                  <code className="font-semibold">initialState: T</code>
                  <p className="text-sm text-muted-foreground">Initial state object</p>
                </div>
                <div>
                  <code className="font-semibold">strategy?: 'snapshot' | 'command' | 'patch'</code>
                  <p className="text-sm text-muted-foreground">History strategy (default: 'snapshot')</p>
                </div>
                <div>
                  <code className="font-semibold">limit?: number</code>
                  <p className="text-sm text-muted-foreground">Maximum history entries (default: 50)</p>
                </div>
                <div>
                  <code className="font-semibold">plugins?: HistoryPlugin[]</code>
                  <p className="text-sm text-muted-foreground">Array of plugins to use</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2 mt-4">Returns</h3>
              <code className="bg-muted px-2 py-1 rounded">History&lt;T&gt;</code>

              <h3 className="text-lg font-semibold mb-2 mt-4">Example</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`const history = createHistory({
  initialState: { count: 0 },
  strategy: 'snapshot',
  limit: 100
})`}</code>
              </pre>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">History Methods</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">push(state: T): void</h3>
                  <p className="text-muted-foreground">Adds a new state to history</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>history.push({'{ count: 1 }'})</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">undo(): T | null</h3>
                  <p className="text-muted-foreground">Undo to previous state. Returns new current state or null.</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>const previousState = history.undo()</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">redo(): T | null</h3>
                  <p className="text-muted-foreground">Redo to next state. Returns new current state or null.</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>const nextState = history.redo()</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">canUndo(): boolean</h3>
                  <p className="text-muted-foreground">Check if undo is possible</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>if (history.canUndo()) {'{ /* ... */ }'}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">canRedo(): boolean</h3>
                  <p className="text-muted-foreground">Check if redo is possible</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>if (history.canRedo()) {'{ /* ... */ }'}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">getState(): T</h3>
                  <p className="text-muted-foreground">Get current state</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>const currentState = history.getState()</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">getEntries(): HistoryEntry&lt;T&gt;[]</h3>
                  <p className="text-muted-foreground">Get all history entries</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>const entries = history.getEntries()</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">goTo(position: number): T | null</h3>
                  <p className="text-muted-foreground">Jump to specific position in history</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>history.goTo(5) // Jump to 6th entry</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">clear(): void</h3>
                  <p className="text-muted-foreground">Clear all history entries</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>history.clear()</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">subscribe(callback: (state: T) =&gt; void): () =&gt; void</h3>
                  <p className="text-muted-foreground">Subscribe to state changes. Returns unsubscribe function.</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>{`const unsubscribe = history.subscribe((state) => {
  console.log('State changed:', state)
})

// Later...
unsubscribe()`}</code>
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="commands" className="mt-6 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">defineCommand()</h2>
              <p className="text-muted-foreground mb-4">
                Define a command for the command strategy
              </p>

              <h3 className="text-lg font-semibold mb-2">Parameters</h3>
              <div className="bg-muted p-4 rounded-md space-y-2">
                <div>
                  <code className="font-semibold">name: string</code>
                  <p className="text-sm text-muted-foreground">Unique command name</p>
                </div>
                <div>
                  <code className="font-semibold">execute: (state: T, payload: P) =&gt; T</code>
                  <p className="text-sm text-muted-foreground">Execute function to apply command</p>
                </div>
                <div>
                  <code className="font-semibold">undo: (state: T, payload: P) =&gt; T</code>
                  <p className="text-sm text-muted-foreground">Undo function to reverse command</p>
                </div>
                <div>
                  <code className="font-semibold">redo?: (state: T, payload: P) =&gt; T</code>
                  <p className="text-sm text-muted-foreground">Optional custom redo function</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2 mt-4">Example</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`const increment = defineCommand({
  name: 'increment',
  execute: (state, amount: number) => ({
    ...state,
    count: state.count + amount
  }),
  undo: (state, amount: number) => ({
    ...state,
    count: state.count - amount
  })
})`}</code>
              </pre>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Command Methods</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">registerCommand(command: Command): void</h3>
                  <p className="text-muted-foreground">Register a command</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>history.registerCommand(increment)</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">executeCommand(name: string, payload: any): T</h3>
                  <p className="text-muted-foreground">Execute a registered command</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>history.executeCommand('increment', 5)</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">getCommand(name: string): Command | undefined</h3>
                  <p className="text-muted-foreground">Get a registered command by name</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>const cmd = history.getCommand('increment')</code>
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="plugins" className="mt-6 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">HistoryPlugin Interface</h2>

              <div className="bg-muted p-4 rounded-md">
                <pre><code>{`interface HistoryPlugin {
  name: string
  version: string

  onPush?: (entry: HistoryEntry) => void
  onUndo?: (entry: HistoryEntry) => void
  onRedo?: (entry: HistoryEntry) => void
  onClear?: () => void
  onStateChange?: (state: any) => void
}`}</code></pre>
              </div>

              <h3 className="text-lg font-semibold mb-2 mt-6">Example Plugin</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`const persistencePlugin: HistoryPlugin = {
  name: 'persistence',
  version: '1.0.0',

  onPush: (entry) => {
    localStorage.setItem('history', JSON.stringify(entry))
  },

  onClear: () => {
    localStorage.removeItem('history')
  }
}`}</code>
              </pre>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Plugin Methods</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">use(plugin: HistoryPlugin): void</h3>
                  <p className="text-muted-foreground">Add a plugin to the history instance</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>history.use(persistencePlugin)</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">getPlugins(): HistoryPlugin[]</h3>
                  <p className="text-muted-foreground">Get all registered plugins</p>
                  <pre className="bg-muted p-3 rounded-md mt-2">
                    <code>const plugins = history.getPlugins()</code>
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="mt-6 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Type Definitions</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">HistoryEntry&lt;T&gt;</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto mt-2">
                    <code>{`interface HistoryEntry<T> {
  id: string
  timestamp: number
  state: T
  metadata?: Record<string, any>

  // For patch strategy
  patches?: Patch[]
  inversePatches?: Patch[]

  // For command strategy
  command?: {
    name: string
    payload: any
    previousState?: T
  }
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Patch</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto mt-2">
                    <code>{`interface Patch {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: any
  from?: string // for move and copy
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">HistoryOptions&lt;T&gt;</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto mt-2">
                    <code>{`interface HistoryOptions<T> {
  initialState: T
  strategy?: 'snapshot' | 'command' | 'patch'
  limit?: number
  plugins?: HistoryPlugin[]
  compress?: boolean
}`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Command&lt;T, P&gt;</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto mt-2">
                    <code>{`interface Command<T, P = any> {
  name: string
  execute: (state: T, payload: P) => T
  undo: (state: T, payload: P) => T
  redo?: (state: T, payload: P) => T
}`}</code>
                  </pre>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
