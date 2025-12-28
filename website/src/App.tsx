import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Home } from './pages/Home'
import { Playground } from './pages/Playground'
import { Docs } from './pages/Docs'
import { Examples } from './pages/Examples'
import { ApiReference } from './pages/ApiReference'
import { Button } from './components/ui/button'
import { ThemeProvider } from './contexts/ThemeContext'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
                StateKeeper
              </Link>
              <div className="flex gap-2 items-center">
                <Button variant="ghost" asChild>
                  <Link to="/">Home</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/docs">Docs</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/examples">Examples</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/api">API</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/playground">Playground</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://github.com/ersinkoc/StateKeeper" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/examples" element={<Examples />} />
            <Route path="/api" element={<ApiReference />} />
            <Route path="/playground" element={<Playground />} />
          </Routes>

          <footer className="border-t mt-20 bg-muted/50">
            <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
              <p>StateKeeper - Zero-dependency undo/redo history manager</p>
              <p className="mt-2">Made with ❤️ by <a href="https://github.com/ersinkoc" className="text-primary hover:underline">Ersin KOÇ</a></p>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
