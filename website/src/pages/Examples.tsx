import { Card } from '../components/ui/card'

export function Examples() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Examples</h1>
        <p className="text-muted-foreground mb-8">
          Real-world examples of using StateKeeper in different scenarios
        </p>

        <div className="space-y-8">
          {/* Todo List */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Todo List with Undo/Redo</h2>
            <p className="text-muted-foreground mb-4">
              Track todos with full undo/redo support using snapshot strategy
            </p>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{`import { createHistory } from '@oxog/statekeeper'

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface TodoState {
  todos: Todo[]
}

const history = createHistory<TodoState>({
  initialState: { todos: [] },
  strategy: 'snapshot',
  limit: 50
})

// Add todo
function addTodo(text: string) {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text,
    completed: false
  }

  const current = history.getState()
  history.push({
    todos: [...current.todos, newTodo]
  })
}

// Toggle todo
function toggleTodo(id: string) {
  const current = history.getState()
  history.push({
    todos: current.todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  })
}

// Delete todo
function deleteTodo(id: string) {
  const current = history.getState()
  history.push({
    todos: current.todos.filter(todo => todo.id !== id)
  })
}

// Undo/Redo
function undo() {
  if (history.canUndo()) {
    history.undo()
  }
}

function redo() {
  if (history.canRedo()) {
    history.redo()
  }
}`}</code>
            </pre>
          </Card>

          {/* Form with Undo */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Form with Undo/Redo</h2>
            <p className="text-muted-foreground mb-4">
              Track form changes with patch strategy for memory efficiency
            </p>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{`import { createHistory } from '@oxog/statekeeper'

interface FormState {
  name: string
  email: string
  age: number
  bio: string
}

const history = createHistory<FormState>({
  initialState: {
    name: '',
    email: '',
    age: 0,
    bio: ''
  },
  strategy: 'patch', // Efficient for large objects
  limit: 100
})

// Update field
function updateField(field: keyof FormState, value: any) {
  const current = history.getState()
  history.push({
    ...current,
    [field]: value
  })
}

// Example: React integration
function FormComponent() {
  const [state, setState] = useState(history.getState())

  useEffect(() => {
    const unsubscribe = history.subscribe((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [])

  return (
    <form>
      <input
        value={state.name}
        onChange={(e) => updateField('name', e.target.value)}
      />
      {/* More fields... */}

      <button onClick={() => history.undo()}>Undo</button>
      <button onClick={() => history.redo()}>Redo</button>
    </form>
  )
}`}</code>
            </pre>
          </Card>

          {/* Canvas Drawing */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Canvas Drawing App</h2>
            <p className="text-muted-foreground mb-4">
              Drawing application with stroke-level undo/redo
            </p>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{`import { createHistory } from '@oxog/statekeeper'

interface Point {
  x: number
  y: number
  color: string
}

interface DrawingState {
  strokes: Point[][]
}

const history = createHistory<DrawingState>({
  initialState: { strokes: [] },
  strategy: 'snapshot'
})

let currentStroke: Point[] = []

function onMouseDown(x: number, y: number, color: string) {
  currentStroke = [{ x, y, color }]
}

function onMouseMove(x: number, y: number, color: string) {
  if (currentStroke.length > 0) {
    currentStroke.push({ x, y, color })
    redraw()
  }
}

function onMouseUp() {
  if (currentStroke.length > 0) {
    const current = history.getState()
    history.push({
      strokes: [...current.strokes, currentStroke]
    })
    currentStroke = []
  }
}

function redraw() {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw completed strokes
  const state = history.getState()
  state.strokes.forEach(stroke => {
    drawStroke(ctx, stroke)
  })

  // Draw current stroke
  if (currentStroke.length > 0) {
    drawStroke(ctx, currentStroke)
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Point[]) {
  if (stroke.length === 0) return

  ctx.strokeStyle = stroke[0].color
  ctx.beginPath()
  ctx.moveTo(stroke[0].x, stroke[0].y)

  for (let i = 1; i < stroke.length; i++) {
    ctx.lineTo(stroke[i].x, stroke[i].y)
  }

  ctx.stroke()
}`}</code>
            </pre>
          </Card>

          {/* Command Pattern */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Text Editor with Commands</h2>
            <p className="text-muted-foreground mb-4">
              Advanced text editor using command strategy for complex operations
            </p>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{`import { createHistory, defineCommand } from '@oxog/statekeeper'

interface EditorState {
  text: string
  selection: { start: number; end: number }
}

const insertText = defineCommand({
  name: 'insertText',
  execute: (state, { text, position }: { text: string; position: number }) => ({
    ...state,
    text: state.text.slice(0, position) + text + state.text.slice(position)
  }),
  undo: (state, { text, position }: { text: string; position: number }) => ({
    ...state,
    text: state.text.slice(0, position) + state.text.slice(position + text.length)
  })
})

const deleteText = defineCommand({
  name: 'deleteText',
  execute: (state, { start, end }: { start: number; end: number }) => {
    const deleted = state.text.slice(start, end)
    return {
      ...state,
      text: state.text.slice(0, start) + state.text.slice(end),
      _deleted: deleted // Store for undo
    }
  },
  undo: (state, { start }: { start: number }) => ({
    ...state,
    text: state.text.slice(0, start) + state._deleted + state.text.slice(start)
  })
})

const history = createHistory<EditorState>({
  initialState: { text: '', selection: { start: 0, end: 0 } },
  strategy: 'command'
})

history.registerCommand(insertText)
history.registerCommand(deleteText)

// Usage
history.executeCommand('insertText', { text: 'Hello', position: 0 })
history.executeCommand('deleteText', { start: 0, end: 5 })
history.undo() // Restores "Hello"
history.redo() // Deletes again`}</code>
            </pre>
          </Card>

          {/* State Machine */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">State Machine with History</h2>
            <p className="text-muted-foreground mb-4">
              Track state machine transitions with full history
            </p>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{`import { createHistory } from '@oxog/statekeeper'

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface Order {
  id: string
  status: OrderStatus
  items: string[]
  total: number
}

const history = createHistory<Order>({
  initialState: {
    id: '123',
    status: 'pending',
    items: ['Item 1', 'Item 2'],
    total: 100
  },
  strategy: 'snapshot'
})

function transition(newStatus: OrderStatus) {
  const current = history.getState()

  // Validate transition
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  }

  if (!validTransitions[current.status].includes(newStatus)) {
    throw new Error(\`Invalid transition from \${current.status} to \${newStatus}\`)
  }

  history.push({
    ...current,
    status: newStatus
  })
}

// Get full history of status changes
function getStatusHistory() {
  return history.getEntries().map(entry => ({
    status: entry.state.status,
    timestamp: entry.timestamp
  }))
}`}</code>
            </pre>
          </Card>
        </div>
      </div>
    </div>
  )
}
