'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import { Bell, Clock } from 'lucide-react'

type Reminder = {
  id: string
  title: string
  when: string // ISO string
  notes?: string
}

type Props = {
  storageKey?: string
}

export function Reminders({ storageKey = 'meu-dia:reminders' }: Props) {
  const [list, setList] = React.useState<Reminder[]>([])
  const [title, setTitle] = React.useState('')
  const [when, setWhen] = React.useState<string>('')

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setList(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list))
    } catch {}
  }, [storageKey, list])

  const add = (r: Omit<Reminder, 'id'>) => {
    const rec: Reminder = { id: crypto.randomUUID(), ...r }
    setList((prev) => [rec, ...prev])
    track('reminder.created', { tab: 'meu-dia', id: rec.id, date: r.when })
  }

  const remove = (id: string) => {
    setList((prev) => prev.filter((r) => r.id !== id))
    track('reminder.deleted', { tab: 'meu-dia', id })
  }

  const now = Date.now()

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-3" role="group" aria-describedby="reminders-subtitle">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ffd8e6]/60">
          <Bell className="h-4 w-4 text-[#ff005e]" aria-hidden />
        </div>
        <div>
          <h3 className="text-[16px] font-semibold">Lembretes</h3>
          <p className="text-[12px] text-[#545454]" id="reminders-subtitle">Avisos suaves para o seu dia</p>
        </div>
      </div>

      <form
        className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault()
          const t = title.trim()
          if (!t || !when) return
          add({ title: t, when })
          setTitle('')
          setWhen('')
        }}
      >
        <input
          className="rounded-xl border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#ffd8e6]"
          placeholder="Título do lembrete"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          name="title"
        />
        <input
          className="rounded-xl border px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-[#ffd8e6]"
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          name="when"
        />
        <button
          type="submit"
          className="rounded-xl px-3 py-2 bg-[#ff005e] text-white font-medium hover:opacity-95 active:scale-[0.99] focus:ring-2 focus:ring-[#ffd8e6] focus:outline-none"
        >
          Adicionar
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {list.map((r) => {
          const ts = new Date(r.when).getTime()
          const delta = ts - now
          const due = delta <= 0
          const soon = delta > 0 && delta <= 1000 * 60 * 30 // 30min
          return (
            <li key={r.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#2f3a56]" aria-hidden />
                <div>
                  <div className="text-[14px] font-medium">{r.title}</div>
                  <div className="text-[12px] text-[#545454]">
                    {new Date(r.when).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {due ? (
                  <span className="rounded-full border px-2 py-0.5 text-[11px] bg-[#ffd8e6]/60">Vencido</span>
                ) : soon ? (
                  <span className="rounded-full border px-2 py-0.5 text-[11px]">Em breve</span>
                ) : null}
                <button
                  type="button"
                  className="rounded-lg border px-2 py-1 text-[12px] hover:bg-[#ffd8e6]/40 focus:ring-2 focus:ring-[#ffd8e6] focus:outline-none"
                  onClick={() => remove(r.id)}
                  aria-label={`Remover lembrete: ${r.title}`}
                >
                  Remover
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
