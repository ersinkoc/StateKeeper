import { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Undo, Redo, RotateCcw } from 'lucide-react'
import { createHistory } from '@oxog/statekeeper'

interface DrawState {
  points: { x: number; y: number; color: string }[]
}

export function Playground() {
  const [kernel] = useState(() => createHistory<DrawState>({
    initialState: { points: [] },
    strategy: 'snapshot',
    limit: 100
  }))
  const [state, setState] = useState(kernel.getState())
  const [currentColor, setCurrentColor] = useState('#f59e0b')
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    return kernel.on('state-change', (event: any) => {
      if (event.type === 'state-change') {
        setState(event.state)
      }
    })
  }, [kernel])

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDrawing(true)
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newState = {
      ...state,
      points: [...state.points, { x, y, color: currentColor }]
    }
    kernel.push(newState)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return

    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newState = {
      ...state,
      points: [...state.points, { x, y, color: currentColor }]
    }
    kernel.push(newState)
  }

  const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899']

  const historyData = kernel.getHistory()
  const historyEntries = historyData.entries
  const position = historyData.position

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Interactive Playground</h1>
          <p className="text-muted-foreground">
            Draw something and try undo/redo. Every stroke is a history entry!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Drawing Canvas</CardTitle>
                    <CardDescription>Click and drag to draw</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => kernel.undo()}
                      disabled={!kernel.canUndo()}
                    >
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => kernel.redo()}
                      disabled={!kernel.canRedo()}
                    >
                      <Redo className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => kernel.clear()}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <svg
                  className="w-full border rounded-lg bg-muted/20 cursor-crosshair"
                  style={{ height: '400px' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                >
                  {state.points.map((point: any, i: number) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r={3}
                      fill={point.color}
                    />
                  ))}
                </svg>

                <div className="flex gap-2 mt-4">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCurrentColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        currentColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>History Timeline</CardTitle>
                <CardDescription>
                  {historyEntries.length} entries • Position: {position + 1}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {/* Initial state entry */}
                  <div
                    className={`p-2 rounded border ${
                      position === -1
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted/50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Initial State</span>
                      <span className="text-xs text-muted-foreground">
                        0 points
                      </span>
                    </div>
                    {position === -1 && (
                      <div className="text-xs text-primary mt-1">← Current</div>
                    )}
                  </div>
                  {/* History entries */}
                  {historyEntries.map((entry: any, i: number) => (
                    <div
                      key={entry.id}
                      className={`p-2 rounded border ${
                        i === position
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Entry #{i + 1}</span>
                        <span className="text-xs text-muted-foreground">
                          {entry.state.points.length} points
                        </span>
                      </div>
                      {i === position && (
                        <div className="text-xs text-primary mt-1">← Current</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Code Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  <code>{`const history = createHistory({
  initialState: { points: [] }
})

// Draw
history.push({
  points: [...points, newPoint]
})

// Undo/Redo
history.undo()
history.redo()

// Check state
history.canUndo() // true
history.getState() // current state`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
