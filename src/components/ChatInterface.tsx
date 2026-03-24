import { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Trash2 } from 'lucide-react'
import { memoryManager } from '../utils/memoryManager'

// Test if memoryManager is working
console.log('🧪 Memory Manager loaded:', memoryManager)
memoryManager.debug()

type AppMode = 'personal' | 'study' | 'coding'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatInterfaceProps {
  currentMode: AppMode
}

export default function ChatInterface({ currentMode }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load memory on component mount
  useEffect(() => {
    const savedName = memoryManager.getName()
    const history = memoryManager.getRecentHistory(20)
    
    console.log('📀 Loading memory - Saved name:', savedName)
    memoryManager.debug()
    
    if (savedName) {
      setUserName(savedName)
    }
    
    // Load previous messages
    const loadedMessages: Message[] = history.map((msg, index) => ({
      id: index.toString(),
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      timestamp: new Date()
    }))
    
    if (loadedMessages.length === 0) {
      const greeting = savedName 
        ? `Welcome back, ${savedName}! How can I help you today?`
        : "Hello! I'm SID. What's your name?"
      loadedMessages.push({
        id: '1',
        content: greeting,
        role: 'assistant',
        timestamp: new Date()
      })
    }
    
    setMessages(loadedMessages)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    // Save to memory
    memoryManager.addMessage({
      role: 'user',
      content: input,
      mode: currentMode
    })

    try {
      // Get recent history for context
      const recentHistory = memoryManager.getRecentHistory(10)
      
      console.log('📤 Sending to backend:', {
        message: input,
        mode: currentMode,
        userName: userName,
        historyLength: recentHistory.length,
        memorySummary: memoryManager.getSummary()
      })
      
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          mode: currentMode,
          history: recentHistory,
          userName: userName,
          memorySummary: memoryManager.getSummary()
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data.response,
          role: 'assistant',
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Save to memory
        memoryManager.addMessage({
          role: 'assistant',
          content: data.data.response,
          mode: currentMode
        })
        
        // Check if user introduced themselves
        if (!userName) {
          // Name detection patterns
          const namePatterns = [
            /my name is (\w+)/i,
            /i am (\w+)/i,
            /i'm (\w+)/i,
            /call me (\w+)/i,
            /name is (\w+)/i,
            /this is (\w+)/i
          ]
          
          let detectedName = null
          for (const pattern of namePatterns) {
            const match = input.match(pattern)
            if (match) {
              detectedName = match[1]
              break
            }
          }
          
          // Also check if the message is just a name (like "Pranav")
          if (!detectedName && input.trim().length < 20 && !input.includes(' ')) {
            detectedName = input.trim()
          }
          
          if (detectedName) {
            const newName = detectedName.charAt(0).toUpperCase() + detectedName.slice(1).toLowerCase()
            console.log('🎯 Setting name to:', newName)
            setUserName(newName)
            memoryManager.setName(newName)
            memoryManager.debug()
          }
        }
      } else {
        throw new Error(data.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please make sure the backend is running.',
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const clearHistory = () => {
    if (confirm('Clear all conversation history?')) {
      memoryManager.clearHistory()
      setMessages([{
        id: '1',
        content: `History cleared. ${userName ? `Nice to see you again, ${userName}!` : 'How can I help you?'}`,
        role: 'assistant',
        timestamp: new Date()
      }])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg h-[600px] flex flex-col">
      {/* Header with memory controls */}
      <div className="border-b border-gray-700 p-3 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          {userName ? `👋 Hello, ${userName}` : '💭 New conversation'}
        </div>
        <button
          onClick={clearHistory}
          className="text-gray-400 hover:text-red-400 transition-colors"
          title="Clear memory"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`flex-1 max-w-[80%] ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {message.content}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-700 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={!userName ? "What's your name? (e.g., 'My name is Pranav')" : `Ask me anything in ${currentMode} mode...`}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
