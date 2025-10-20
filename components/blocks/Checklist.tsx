'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', text: 'Desjejum em família', completed: true },
    { id: '2', text: 'Revisar mochila das crianças', completed: true },
    { id: '3', text: 'Preparar lanche', completed: false },
    { id: '4', text: 'Responder mensagens importantes', completed: false },
    { id: '5', text: 'Momento de pausa para mim', completed: false },
  ])

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const completed = items.filter(i => i.completed).length
  const progress = Math.round((completed / items.length) * 100)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-support-1">✅ Checklist do Dia</h2>
        <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full">
          {completed}/{items.length}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(item.id)}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
            <span className={`text-sm flex-1 ${item.completed ? 'line-through text-support-2' : 'text-support-1'}`}>
              {item.text}
            </span>
          </label>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-support-2 mt-2 text-right">{progress}% completo</p>
    </Card>
  )
}
