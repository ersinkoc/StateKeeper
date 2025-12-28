import { ArrowRight, Zap, Package, Code, GitBranch } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            Zero Dependencies • 100% TypeScript • Production Ready
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">
            StateKeeper
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Powerful undo/redo history management with micro-kernel architecture
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/playground">
                Try Playground <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://github.com/ersinkoc/StateKeeper" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Example */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Get started in seconds</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code className="text-sm">{`npm install @oxog/statekeeper

import { createHistory } from '@oxog/statekeeper'

const history = createHistory({ initialState: { count: 0 } })

history.push({ count: 1 })
history.push({ count: 2 })

history.undo() // { count: 1 }
history.redo() // { count: 2 }`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why StateKeeper?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Zero Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No runtime dependencies. Everything implemented from scratch for maximum performance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Package className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Multiple Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Choose between Snapshot, Command, or Patch strategies based on your needs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Type Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Full TypeScript support with strict mode. Catch errors at compile time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <GitBranch className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Micro-Kernel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Extend with plugins. Only bundle what you use with tree-shaking.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Strategies */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Strategy</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
              <CardDescription>Simple & Fast</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Store complete state copies. Best for small to medium state.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Memory</span>
                  <span className="text-amber-500">●●●○○</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed</span>
                  <span className="text-green-500">●●●●●</span>
                </div>
                <div className="flex justify-between">
                  <span>Complexity</span>
                  <span className="text-green-500">●○○○○</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Command</CardTitle>
              <CardDescription>Memory Efficient</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Store commands with undo logic. Best for complex apps.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Memory</span>
                  <span className="text-green-500">●○○○○</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed</span>
                  <span className="text-amber-500">●●●●○</span>
                </div>
                <div className="flex justify-between">
                  <span>Complexity</span>
                  <span className="text-amber-500">●●●○○</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patch</CardTitle>
              <CardDescription>Smart Diffing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Store diffs using JSON Patch (RFC 6902). Best for large state.
              </p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Memory</span>
                  <span className="text-green-500">●●○○○</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed</span>
                  <span className="text-amber-500">●●●○○</span>
                </div>
                <div className="flex justify-between">
                  <span>Complexity</span>
                  <span className="text-amber-500">●●○○○</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Try StateKeeper in our interactive playground or install it in your project.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/playground">Try Playground</Link>
            </Button>
            <Button size="lg" variant="outline">
              <a href="https://www.npmjs.com/package/@oxog/statekeeper" target="_blank" rel="noopener noreferrer">
                Install Package
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
