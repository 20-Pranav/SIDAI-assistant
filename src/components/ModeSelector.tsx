import { Brain, Code, GraduationCap, User } from 'lucide-react'

type AppMode = 'personal' | 'study' | 'coding'

interface ModeSelectorProps {
  currentMode: AppMode
  onModeChange: (mode: AppMode) => void
}

const modes = [
  { id: 'personal' as AppMode, name: 'General', icon: User, description: 'Anything and everything' },
  { id: 'study' as AppMode, name: 'Learning', icon: GraduationCap, description: 'Deep explanations & guidance' },
  { id: 'coding' as AppMode, name: 'Development', icon: Code, description: 'Code help & best practices' },
]

export default function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5" />
        Conversation Style
      </h2>
      <div className="space-y-3">
        {modes.map((mode) => {
          const Icon = mode.icon
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`w-full p-4 rounded-lg text-left transition-all ${
                currentMode === mode.id
                  ? 'bg-blue-600 border-2 border-blue-400'
                  : 'bg-gray-700 border-2 border-transparent hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{mode.name}</div>
                  <div className="text-sm text-gray-300">{mode.description}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}