'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'

/**
 * ChildDiary entry type
 * @property dateKey - YYYY-MM-DD in America/Sao_Paulo timezone (use getBrazilDateKey())
 * @property notes - Free-form notes about the child's day
 * @property mood - Child's mood level (optional)
 * @property tags - Additional metadata like sleep status, food intake, etc. (optional)
 */
export type ChildDiary = {
  dateKey: string // YYYY-MM-DD (TZ America/Sao_Paulo)
  notes: string
  mood?: 'low' | 'ok' | 'high'
  tags?: string[] // e.g., sleep, food, appointment
}

/**
 * localStorage key for child diary entries
 * Stores array of ChildDiary entries
 */
const KEY = 'm360.childDiary.v1'

/**
 * Hook for managing child diary entries with localStorage persistence
 *
 * Usage:
 * ```tsx
 * const { entries, isLoaded, upsert, remove } = useChildDiary()
 *
 * // Add or update entry
 * upsert({
 *   dateKey: getBrazilDateKey(),
 *   notes: 'Dia tranquilo, brincou muito',
 *   mood: 'high',
 *   tags: ['playful', 'well-fed']
 * })
 *
 * // Remove entry
 * remove('2025-01-15')
 * ```
 *
 * Telemetry:
 * - Fires `cuidar.diary_saved` on upsert with payload: { dateKey, hasMood, mood, hasTags, tagCount, notesLength }
 * - Fires `cuidar.diary_removed` on remove with payload: { dateKey }
 *
 * @returns Object with entries array, isLoaded flag, and methods to upsert and remove entries
 */
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
