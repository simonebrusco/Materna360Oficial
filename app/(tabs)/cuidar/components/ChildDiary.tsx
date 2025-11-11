'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { Baby, CupSoda, Moon, Smile } from 'lucide-react'

type FeedEntry = { id: string; dateKey: string; when: string; type: 'meal' | 'snack' | 'bottle' }
type SleepEntry = { id: string; dateKey: string; start: string; end?: string }
type MoodEntry = { id: string; dateKey: string; level: 'low' | 'ok' | 'high' }

function useLocalArray<T>(key: string) {
  const [items, setItems] = React.useState<T[]>([])
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [key])
  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items))
    } catch {}
  }, [key, items])
  return [items, setItems] as const
}

export function ChildDiary() {
  const [dateKey, setDateKey] = React.useState('2025-01-01')

  const [feeds, setFeeds] = useLocalArray<FeedEntry>('cuidar:feeds')
  const [sleeps, setSleeps] = useLocalArray<SleepEntry>('cuidar:sleeps')
  const [moods, setMoods] = useLocalArray<MoodEntry>('cuidar:moods')

  React.useEffect(() => {
    setDateKey(getBrazilDateKey(new Date()))
  }, [])

  const nowISO = () => new Date().toISOString()

  const addFeed = (type: FeedEntry['type']) => {
    const entry: FeedEntry = { id: crypto.randomUUID(), dateKey, when: nowISO(), type }
    setFeeds((prev) => [entry, ...prev])
    track('care.appointment_add', { tab: 'cuidar', kind: 'feed', type })
  }

  const startSleep = () => {
    const entry: SleepEntry = { id: crypto.randomUUID(), dateKey, start: nowISO() }
    setSleeps((prev) => [entry, ...prev])
    track('care.appointment_add', { tab: 'cuidar', kind: 'sleep_start' })
  }

  const endSleep = () => {
    setSleeps((prev) => {
      const idx = prev.findIndex((s) => !s.end && s.dateKey === dateKey)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], end: nowISO() }
        return copy
      }
      return prev
    })
    track('care.appointment_add', { tab: 'cuidar', kind: 'sleep_end' })
  }

  const setMood = (level: MoodEntry['level']) => {
    const entry: MoodEntry = { id: crypto.randomUUID(), dateKey, level }
    setMoods((prev) => [entry, ...prev])
    track('mood.checkin', { tab: 'cuidar', source: 'child', level })
  }

  const openSleep = sleeps.find((s) => s.dateKey === dateKey && !s.end)

  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5" suppressHydrationWarning>
      <h2 className="text-base font-semibold mb-4">Diário da criança</h2>

      {/* Quick actions - Feeding */}
      <div className="mb-4">
        <div className="text-xs text-support-2 mb-2">Alimentação</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            className="ui-press ui-ring rounded-xl border border-white/60 p-3 flex flex-col items-center gap-1 hover:bg-primary/5 transition-colors"
            onClick={() => addFeed('meal')}
            aria-label="Registrar refeição"
          >
            <CupSoda className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-xs">Refeição</span>
          </button>
          <button
            className="ui-press ui-ring rounded-xl border border-white/60 p-3 flex flex-col items-center gap-1 hover:bg-primary/5 transition-colors"
            onClick={() => addFeed('snack')}
            aria-label="Registrar lanche"
          >
            <Baby className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-xs">Lanche</span>
          </button>
          <button
            className="ui-press ui-ring rounded-xl border border-white/60 p-3 flex flex-col items-center gap-1 hover:bg-primary/5 transition-colors"
            onClick={() => addFeed('bottle')}
            aria-label="Registrar mamadeira"
          >
            <CupSoda className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-xs">Mamadeira</span>
          </button>
        </div>
      </div>

      {/* Sleep actions */}
      <div className="mb-4">
        <div className="text-xs text-support-2 mb-2">Sono</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={startSleep}
            className="ui-press ui-ring rounded-xl border border-white/60 p-3 flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
            aria-label="Iniciar sono"
          >
            <Moon className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-xs">Iniciar</span>
          </button>
          <button
            onClick={endSleep}
            className="ui-press ui-ring rounded-xl border border-white/60 p-3 flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!openSleep}
            aria-label="Encerrar sono"
          >
            <Moon className="h-5 w-5 text-ink-1" aria-hidden />
            <span className="text-xs">Encerrar</span>
          </button>
        </div>
      </div>

      {/* Mood quick pick */}
      <div className="mb-4">
        <div className="text-xs text-support-2 mb-2">Humor</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMood('low')}
            className="ui-press ui-ring rounded-xl border border-white/60 p-2 text-xs flex items-center justify-center gap-1 hover:bg-primary/5 transition-colors"
            aria-label="Humor baixo"
          >
            <Smile className="h-4 w-4 text-ink-1" aria-hidden />
            <span>Baixo</span>
          </button>
          <button
            onClick={() => setMood('ok')}
            className="ui-press ui-ring rounded-xl border border-white/60 p-2 text-xs flex items-center justify-center gap-1 hover:bg-primary/5 transition-colors"
            aria-label="Humor ok"
          >
            <Smile className="h-4 w-4 text-ink-1" aria-hidden />
            <span>Ok</span>
          </button>
          <button
            onClick={() => setMood('high')}
            className="ui-press ui-ring rounded-xl border border-white/60 p-2 text-xs flex items-center justify-center gap-1 hover:bg-primary/5 transition-colors"
            aria-label="Humor alto"
          >
            <Smile className="h-4 w-4 text-ink-1" aria-hidden />
            <span>Alto</span>
          </button>
        </div>
      </div>

      {/* Light timeline (today) */}
      <div>
        <div className="text-xs text-support-2 mb-2">Hoje</div>
        <ul className="space-y-1 text-xs">
          {feeds
            .filter((f) => f.dateKey === dateKey)
            .slice(0, 4)
            .map((f) => (
              <li key={f.id} className="rounded-lg border border-white/60 p-2 flex items-center gap-2">
                <CupSoda className="h-3.5 w-3.5 text-primary flex-shrink-0" aria-hidden />
                <span className="truncate capitalize">{f.type}</span>
              </li>
            ))}
          {openSleep && (
            <li className="rounded-lg border border-white/60 p-2 flex items-center gap-2">
              <Moon className="h-3.5 w-3.5 text-primary flex-shrink-0" aria-hidden />
              <span className="truncate text-support-2">Sono em andamento…</span>
            </li>
          )}
          {moods
            .filter((m) => m.dateKey === dateKey)
            .slice(0, 2)
            .map((m) => (
              <li key={m.id} className="rounded-lg border border-white/60 p-2 flex items-center gap-2">
                <Smile className="h-3.5 w-3.5 text-primary flex-shrink-0" aria-hidden />
                <span className="truncate">Humor: {m.level}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
