'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import { Plus, Trash2, CheckCircle2, ListChecks } from 'lucide-react'

type TodoItem = {
  id: string
  text: string
  done: boolean
  template?: 'grocery' | 'lunchbox'
}

type MomInMotionProps = {
  enabled?: boolean
  storageKey: string
}

const TEMPLATES: Record<'grocery' | 'lunchbox', string[]> = {
  grocery: ['Leite', 'Ovos', 'Frutas', 'Iogurte'],
  lunchbox: ['Sanduíche', 'Fruta', 'Garrafa de água', 'Guardanapo'],
}

export function MomInMotion({ enabled = true, storageKey }: MomInMotionProps) {
  const [items, setItems] = React.useState<TodoItem[]>([])
  const [text, setText] = React.useState('')

  // Load
  React.useEffect(() => {
    if (!enabled) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [enabled, storageKey])

  // Persist
  React.useEffect(() => {
    if (!enabled) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {}
  }, [enabled, storageKey, items])

  const addItem = (value: string, template?: TodoItem['template']) => {
    const v = value.trim()
    if (!v) return
    const item: TodoItem = { id: crypto.randomUUID(), text: v, done: false, template }
    setItems((prev) => [item, ...prev])
    track('todos.add', { tab: 'meu-dia', template })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    track('todos.remove', { tab: 'meu-dia', id })
  }

  const toggleDone = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
    track('todos.complete', { tab: 'meu-dia', id })
  }

  const seedFromTemplate = (tpl: 'grocery' | 'lunchbox') => {
    const seed = TEMPLATES[tpl].map<TodoItem>((t) => ({
      id: crypto.randomUUID(),
      text: t,
      done: false,
      template: tpl,
    }))
    setItems((prev) => [...seed, ...prev])
    track('todos.add', { tab: 'meu-dia', template: tpl })
  }

  if (!enabled) return null

  const doneCount = items.filter((i) => i.done).length

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
          <ListChecks className="h-4 w-4 text-[#ff005e]" aria-hidden />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold">Mãe em Movimento</h3>
          <p className="text-[12px] text-[#545454]">Listas rápidas para o seu dia</p>
        </div>
        <div className="ml-auto text-[12px] text-[#545454]">
          {doneCount}/{items.length} concluídos
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          className="rounded-full border px-3 py-1 text-[12px] hover:bg-[#ffd8e6]/40"
          onClick={() => seedFromTemplate('grocery')}
        >
          + Mercado
        </button>
        <button
          type="button"
          className="rounded-full border px-3 py-1 text-[12px] hover:bg-[#ffd8e6]/40"
          onClick={() => seedFromTemplate('lunchbox')}
        >
          + Lancheira
        </button>
      </div>

      <form
        className="flex gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault()
          addItem(text)
          setText('')
        }}
      >
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#ffd8e6]"
          placeholder="Adicionar item…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          name="text"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 bg-[#ff005e] text-white font-medium hover:opacity-95 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Adicionar
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between rounded-xl border px-3 py-2"
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#ff005e]"
                checked={i.done}
                onChange={() => toggleDone(i.id)}
                aria-label={i.done ? 'Marcar como não concluído' : 'Marcar como concluído'}
              />
              <span className={`text-[14px] ${i.done ? 'line-through text-[#545454]' : ''}`}>
                {i.text}
              </span>
            </label>
            <div className="flex items-center gap-2">
              {i.done && <CheckCircle2 className="h-4 w-4 text-[#2f3a56]" aria-hidden />}
              <button
                type="button"
                className="rounded-lg border px-2 py-1 text-[12px] hover:bg-[#ffd8e6]/40"
                onClick={() => removeItem(i.id)}
                aria-label="Remover item"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
