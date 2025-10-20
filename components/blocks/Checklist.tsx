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
    <Card className="p-7">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-support-1 md:text-xl">✅ Checklist do Dia</h2>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-soft">
          {completed}/{items.length}
        </span>
      </div>

      <div className="mb-5 space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/50 bg-white/80 p-3 shadow-soft transition-all duration-300 hover:shadow-elevated"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(item.id)}
              className="h-5 w-5 rounded-full border-2 border-primary/40 bg-white accent-primary"
            />
            <span
              className={`flex-1 text-sm transition-colors ${
                item.completed ? 'text-support-2/80 line-through' : 'text-support-1'
              }`}
            >
              {item.text}
            </span>
          </label>
        ))}
      </div>

      <Progress value={progress} max={100} />
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.28em] text-support-2/80 text-right">
        {progress}% completo
      </p>
    </Card>
  )
}
