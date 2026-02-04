import Header from './components/Header'
import PhotoEditor from './components/PhotoEditor'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <PhotoEditor />
      </main>
    </div>
  )
}

export default App
