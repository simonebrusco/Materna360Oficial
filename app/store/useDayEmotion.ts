// app/store/useDayEmotion.ts

import { useState, useEffect } from 'react'
import { save, load } from '@/app/lib/persist'

type DayEmotionState = {
  mood: string | null
  dayIntention: string | null
}

const STORAGE_KEY = 'materna360/dayEmotion'

export function useDayEmotion() {
  const [mood, setMood] = useState<string | null>(null)
  const [dayIntention, setDayIntention] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Carrega do storage na montagem
  useEffect(() => {
    try {
      const stored: DayEmotionState =
        load(STORAGE_KEY, {
          mood: null,
          dayIntention: null,
        }) ?? {
          mood: null,
          dayIntention: null,
        }

      setMood(stored.mood ?? null)
      setDayIntention(stored.dayIntention ?? null)
    } catch {
      // se der erro, segue em frente com null/null
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Salva sempre que algo mudar
  useEffect(() => {
    if (!isHydrated) return

    const stateToSave: DayEmotionState = {
      mood,
      dayIntention,
    }

    try {
      save(STORAGE_KEY, stateToSave)
    } catch {
      // falha de persistência não deve quebrar a UI
    }
  }, [mood, dayIntention, isHydrated])

  return {
    mood,
    dayIntention,
    setMood,
    setDayIntention,
    isHydrated,
  }
}
