'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'

export type ChildDiary = {
  dateKey: string // YYYY-MM-DD (TZ America/Sao_Paulo)
  notes: string
  mood?: 'low' | 'ok' | 'high'
  tags?: string[] // e.g., sleep, food, appointment
}

const KEY = 'm360.childDiary.v1'

export function useChildDiary() {
  const [entries, setEntries] = React.useState<ChildDiary[]>([])
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setEntries(JSON.parse(raw))
    } catch (e) {
      console.error('Failed to load child diary:', e)
    }
    setIsLoaded(true)
  }, [])

  const persist = (next: ChildDiary[]) => {
    setEntries(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch (e) {
      console.error('Failed to persist child diary:', e)
    }
  }

  return {
    entries,
    isLoaded,
    upsert(entry: ChildDiary) {
      const idx = entries.findIndex((e) => e.dateKey === entry.dateKey)
      const next = [...entries]
      if (idx >= 0) {
        next[idx] = entry
      } else {
        next.push(entry)
      }
      persist(next)

      // Telemetry
      track('cuidar.diary_saved', {
        dateKey: entry.dateKey,
        hasMood: !!entry.mood,
        mood: entry.mood,
        hasTags: !!entry.tags && entry.tags.length > 0,
        tagCount: entry.tags?.length ?? 0,
        notesLength: entry.notes.length,
      })
    },
    remove(dateKey: string) {
      persist(entries.filter((e) => e.dateKey !== dateKey))
      track('cuidar.diary_removed', { dateKey })
    },
  }
}
