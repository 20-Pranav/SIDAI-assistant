import { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Trash2, Mic, MicOff } from 'lucide-react'
import { memoryManager } from '../utils/memoryManager'

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
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Check if browser supports speech recognition
  const isSpeechSupported = (): boolean => {
    return !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition))
  }

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || isLoading) return

    console.log('📤 Sending:', text)

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    memoryManager.addMessage({
      role: 'user',
      content: text,
      mode: currentMode
    })

    try {
      const recentHistory = memoryManager.getRecentHistory(10)
      
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
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
        
        memoryManager.addMessage({
          role: 'assistant',
          content: data.data.response,
          mode: currentMode
        })
        
        // Name detection
        if (!userName) {
          const namePatterns = [
            /my name is (\w+)/i,
            /i am (\w+)/i,
            /i'm (\w+)/i,
            /call me (\w+)/i,
            /name is (\w+)/i
          ]
          
          for (const pattern of namePatterns) {
            const match = text.match(pattern)
            if (match) {
              const newName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
              setUserName(newName)
              memoryManager.setName(newName)
              break
            }
          }
        }
      } else {
        throw new Error(data.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error:', error)
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

  const sendMessage = async () => {
    await sendMessageWithText(input)
  }

  const startVoiceInput = () => {
    if (!isSpeechSupported()) {
      alert('Voice input is not supported in this browser.\n\nFor best experience:\n1. Open on your phone: https://sidai-assistant.vercel.app\n2. Or use your phone\'s keyboard microphone')
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    
    try {
      const recognition = new SpeechRecognitionAPI()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.continuous = false
      
      recognition.onstart = () => {
        console.log('🎤 Listening...')
        setIsListening(true)
      }
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log('📝 Heard:', transcript)
        setInput(transcript)
        setIsListening(false)
        
        // Auto-send after voice
        setTimeout(() => {
          if (transcript.trim()) {
            sendMessageWithText(transcript)
          }
        }, 100)
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech error:', event.error)
        setIsListening(false)
        
        if (event.error === 'not-allowed') {
          alert('Please allow microphone access to use voice input.')
        } else if (event.error === 'network') {
          alert('Voice input works best on:\n\n📱 Your phone: https://sidai-assistant.vercel.app\n\nOn desktop, please type your message.')
        } else if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.')
        } else {
          alert(`Voice error: ${event.error}. Please type your message.`)
        }
      }
      
      recognition.onend = () => {
        console.log('🎤 Listening ended')
        setIsListening(false)
        recognitionRef.current = null
      }
      
      recognitionRef.current = recognition
      recognition.start()
      
    } catch (err) {
      console.error('Failed to start:', err)
      alert('Voice input failed. Please type your message.')
      setIsListening(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Could not stop recognition')
        }
        recognitionRef.current = null
      }
      setIsListening(false)
    } else {
      startVoiceInput()
    }
  }

  // Load memory on mount
  useEffect(() => {
    const savedName = memoryManager.getName()
    const history = memoryManager.getRecentHistory(20)
    
    if (savedName) {
      setUserName(savedName)
    }
    
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

      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={!userName ? "What's your name? (or tap the mic 🎤)" : "Tap mic to speak or type..."}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
            disabled={isLoading}
          />
          <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-purple-500 hover:bg-purple-600'
            }`}
            title={isListening ? "Listening..." : "Tap to speak"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
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
