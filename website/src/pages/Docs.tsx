import { Card } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Separator } from '../components/ui/separator'

export function Docs() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-muted-foreground mb-8">
          Complete guide to using StateKeeper in your applications
        </p>

        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>

              <h3 className="text-xl font-semibold mb-2 mt-6">Installation</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>npm install @oxog/statekeeper</code>
              </pre>

              <h3 className="text-xl font-semibold mb-2 mt-6">Quick Start</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`import { createHistory } from '@oxog/statekeeper'

// Create a history instance
const history = createHistory({
  initialState: { count: 0 },
  strategy: 'snapshot', // 'snapshot' | 'command' | 'patch'
  limit: 50 // Maximum history entries
})

// Update state
history.push({ count: 1 })
history.push({ count: 2 })

// Undo/Redo
history.undo() // Returns { count: 1 }
history.redo() // Returns { count: 2 }

// Check capabilities
history.canUndo() // true
history.canRedo() // false

// Get current state
const current = history.getState() // { count: 2 }`}</code>
              </pre>

              <h3 className="text-xl font-semibold mb-2 mt-6">Core Concepts</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">History Instance</h4>
                  <p className="text-muted-foreground">
                    The main object that manages your state history. Created with <code className="bg-muted px-1">createHistory()</code>.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Strategy</h4>
                  <p className="text-muted-foreground">
                    How state changes are stored. Choose between Snapshot, Command, or Patch strategies.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Entries</h4>
                  <p className="text-muted-foreground">
                    Each state change creates a history entry. Navigate through entries with undo/redo.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">History Strategies</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Snapshot Strategy</h3>
                  <p className="text-muted-foreground mb-4">
                    Stores complete state copies. Simple and fast, ideal for small to medium state objects.
                  </p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`const history = createHistory({
  initialState: { users: [], count: 0 },
  strategy: 'snapshot',
  limit: 50
})`}</code>
                  </pre>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <div className="font-semibold">Memory</div>
                      <div className="text-sm text-muted-foreground">●●●○○ Higher</div>
                    </div>
                    <div>
                      <div className="font-semibold">Speed</div>
                      <div className="text-sm text-muted-foreground">●●●●● Fastest</div>
                    </div>
                    <div>
                      <div className="font-semibold">Complexity</div>
                      <div className="text-sm text-muted-foreground">●○○○○ Simple</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-semibold mb-2">Command Strategy</h3>
                  <p className="text-muted-foreground mb-4">
                    Stores commands with execute/undo logic. Memory efficient, ideal for complex applications.
                  </p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`import { createHistory, defineCommand } from '@oxog/statekeeper'

const increment = defineCommand({
  name: 'increment',
  execute: (state, amount: number) => ({
    count: state.count + amount
  }),
  undo: (state, amount: number) => ({
    count: state.count - amount
  })
})

const history = createHistory({
  initialState: { count: 0 },
  strategy: 'command'
})

history.registerCommand(increment)
history.executeCommand('increment', 5) // { count: 5 }`}</code>
                  </pre>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <div className="font-semibold">Memory</div>
                      <div className="text-sm text-muted-foreground">●○○○○ Lowest</div>
                    </div>
                    <div>
                      <div className="font-semibold">Speed</div>
                      <div className="text-sm text-muted-foreground">●●●●○ Fast</div>
                    </div>
                    <div>
                      <div className="font-semibold">Complexity</div>
                      <div className="text-sm text-muted-foreground">●●●○○ Moderate</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-semibold mb-2">Patch Strategy</h3>
                  <p className="text-muted-foreground mb-4">
                    Stores diffs using JSON Patch (RFC 6902). Smart diffing, ideal for large state objects.
                  </p>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`const history = createHistory({
  initialState: { name: 'John', age: 30 },
  strategy: 'patch'
})

history.push({ name: 'John', age: 31 })
// Only stores: [{ op: 'replace', path: '/age', value: 31 }]`}</code>
                  </pre>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <div className="font-semibold">Memory</div>
                      <div className="text-sm text-muted-foreground">●●○○○ Efficient</div>
                    </div>
                    <div>
                      <div className="font-semibold">Speed</div>
                      <div className="text-sm text-muted-foreground">●●●○○ Good</div>
                    </div>
                    <div>
                      <div className="font-semibold">Complexity</div>
                      <div className="text-sm text-muted-foreground">●●○○○ Moderate</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="plugins" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Plugin System</h2>

              <p className="text-muted-foreground mb-6">
                Extend StateKeeper with plugins. The micro-kernel architecture allows you to add custom functionality.
              </p>

              <h3 className="text-xl font-semibold mb-2">Creating a Plugin</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-6">
                <code>{`import { HistoryPlugin } from '@oxog/statekeeper'

const loggerPlugin: HistoryPlugin = {
  name: 'logger',
  version: '1.0.0',

  onPush: (entry) => {
    console.log('State pushed:', entry.state)
  },

  onUndo: (entry) => {
    console.log('Undone:', entry.id)
  },

  onRedo: (entry) => {
    console.log('Redone:', entry.id)
  }
}`}</code>
              </pre>

              <h3 className="text-xl font-semibold mb-2">Using Plugins</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code>{`const history = createHistory({
  initialState: { count: 0 },
  plugins: [loggerPlugin]
})

// Or add later
history.use(loggerPlugin)`}</code>
              </pre>

              <h3 className="text-xl font-semibold mb-2 mt-6">Available Hooks</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border p-4 rounded">
                  <code className="font-semibold">onPush</code>
                  <p className="text-sm text-muted-foreground mt-2">Called when new entry is pushed</p>
                </div>
                <div className="border p-4 rounded">
                  <code className="font-semibold">onUndo</code>
                  <p className="text-sm text-muted-foreground mt-2">Called when undo is performed</p>
                </div>
                <div className="border p-4 rounded">
                  <code className="font-semibold">onRedo</code>
                  <p className="text-sm text-muted-foreground mt-2">Called when redo is performed</p>
                </div>
                <div className="border p-4 rounded">
                  <code className="font-semibold">onClear</code>
                  <p className="text-sm text-muted-foreground mt-2">Called when history is cleared</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="frameworks" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Framework Integration</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-2">React</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`import { useHistory } from '@oxog/statekeeper/react'

function Counter() {
  const [state, history] = useHistory({
    initialState: { count: 0 }
  })

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => history.push({ count: state.count + 1 })}>
        Increment
      </button>
      <button onClick={() => history.undo()} disabled={!history.canUndo()}>
        Undo
      </button>
      <button onClick={() => history.redo()} disabled={!history.canRedo()}>
        Redo
      </button>
    </div>
  )
}`}</code>
                  </pre>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-semibold mb-2">Vue</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`import { useHistory } from '@oxog/statekeeper/vue'

export default {
  setup() {
    const { state, history } = useHistory({
      initialState: { count: 0 }
    })

    const increment = () => {
      history.push({ count: state.value.count + 1 })
    }

    return { state, history, increment }
  }
}`}</code>
                  </pre>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-semibold mb-2">Svelte</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{`<script>
  import { createHistoryStore } from '@oxog/statekeeper/svelte'

  const history = createHistoryStore({ count: 0 })
</script>

<p>Count: {$history.count}</p>
<button on:click={() => history.push({ count: $history.count + 1 })}>
  Increment
</button>`}</code>
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
