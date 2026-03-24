import { useState } from 'react'
import ModeSelector from './components/ModeSelector'
import TodoPanel from './components/TodoPanel'
import ChatInterface from './components/ChatInterface'

type AppMode = 'personal' | 'study' | 'coding'

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('personal')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">SID AI Assistant</h1>
          <p className="text-gray-300">Your General-Purpose AI Companion</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="lg:col-span-1 space-y-6">
            <ModeSelector currentMode={currentMode} onModeChange={setCurrentMode} />
            {currentMode === 'personal' && <TodoPanel />}
          </div>
          <div className="lg:col-span-3">
            <ChatInterface currentMode={currentMode} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
