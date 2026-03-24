interface Memory {
  userId: string
  name?: string
  preferences?: string[]
  conversationHistory: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number
    mode: string
  }>
  lastVisit: number
}

class MemoryManager {
  private memory: Memory
  private storageKey = 'sid-memory'

  constructor() {
    this.memory = this.loadMemory()
  }

  private loadMemory(): Memory {
    const saved = localStorage.getItem(this.storageKey)
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      userId: this.generateUserId(),
      conversationHistory: [],
      lastVisit: Date.now()
    }
  }

  private saveMemory() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.memory))
  }

  private generateUserId(): string {
    let id = localStorage.getItem('sid-user-id')
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('sid-user-id', id)
    }
    return id
  }

  getName(): string | undefined {
    return this.memory.name
  }

  setName(name: string) {
    this.memory.name = name
    this.saveMemory()
    console.log('✅ Memory saved - Name:', name)
  }

  addMessage(message: { role: 'user' | 'assistant', content: string, mode: string }) {
    this.memory.conversationHistory.push({
      id: Date.now().toString(),
      ...message,
      timestamp: Date.now()
    })
    
    // Keep only last 100 messages to prevent storage bloat
    if (this.memory.conversationHistory.length > 100) {
      this.memory.conversationHistory = this.memory.conversationHistory.slice(-100)
    }
    
    this.memory.lastVisit = Date.now()
    this.saveMemory()
  }

  getRecentHistory(limit: number = 20): Array<{ role: string, content: string }> {
    return this.memory.conversationHistory.slice(-limit).map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }

  getSummary(): string {
    const history = this.memory.conversationHistory
    if (history.length === 0) return ''
    
    const topics = new Set<string>()
    const keywords = ['learn', 'code', 'help', 'explain', 'about', 'tell me']
    
    history.forEach(msg => {
      keywords.forEach(keyword => {
        if (msg.content.toLowerCase().includes(keyword)) {
          topics.add(keyword)
        }
      })
    })
    
    let summary = `Previous conversation: ${history.length} messages exchanged.`
    if (topics.size > 0) {
      summary += ` Topics discussed: ${Array.from(topics).join(', ')}.`
    }
    return summary
  }

  clearHistory() {
    this.memory.conversationHistory = []
    this.saveMemory()
  }

  debug() {
    console.log('🧠 Memory Debug:', {
      name: this.memory.name,
      historyLength: this.memory.conversationHistory.length,
      lastVisit: new Date(this.memory.lastVisit).toLocaleString()
    })
  }
}

export const memoryManager = new MemoryManager()
