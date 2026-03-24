import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, Circle } from 'lucide-react'

interface Todo {
  id: number
  task: string
  completed: boolean
}

export default function TodoPanel() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('sid-todos')
    if (saved) setTodos(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('sid-todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTask.trim()) {
      setTodos(prev => [{ id: Date.now(), task: newTask.trim(), completed: false }, ...prev])
      setNewTask('')
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">📝 To-Do List</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
        <button onClick={addTodo} className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {todos.map(todo => (
          <div key={todo.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700">
            <button onClick={() => setTodos(prev => prev.map(t => 
              t.id === todo.id ? { ...t, completed: !t.completed } : t
            ))}>
              {todo.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
            </button>
            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : ''}`}>{todo.task}</span>
            <button onClick={() => setTodos(prev => prev.filter(t => t.id !== todo.id))}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            No tasks yet. Add one above!
          </div>
        )}
      </div>
    </div>
  )
}

