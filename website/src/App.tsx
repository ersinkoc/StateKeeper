import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Home } from './pages/Home'
import { Playground } from './pages/Playground'
import { Button } from './components/ui/button'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
              StateKeeper
            </Link>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/playground">Playground</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://github.com/ersinkoc/StateKeeper" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Playground />} />
        </Routes>

        <footer className="border-t mt-20">
          <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
            <p>StateKeeper - Zero-dependency undo/redo history manager</p>
            <p className="mt-2">Made with ❤️ by <a href="https://github.com/ersinkoc" className="text-primary hover:underline">Ersin KOÇ</a></p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
