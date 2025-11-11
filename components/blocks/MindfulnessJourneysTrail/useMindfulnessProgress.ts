'use client'

import React from 'react'

export type WeekProgress = {
  completed: number
  total: number
  percentage: number
  weekLabel: string
}

function startOfISOWeek(dateInput: Date) {
  const date = new Date(dateInput)
  const day = (date.getDay() + 6) % 7
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day)
  return date
}

function isWithinThisISOWeek(timestamp: number) {
  const now = new Date()
  const start = startOfISOWeek(now).getTime()
  const end = start + 7 * 24 * 60 * 60 * 1000
  return timestamp >= start && timestamp < end
}

const STORAGE_KEYS = [
  'm360_mindfulness_listened_reconecte_se',
  'm360_mindfulness_listened_renove_sua_energia',
  'm360_mindfulness_listened_encontre_calma',
] as const

export function useMindfulnessProgress(): WeekProgress {
  // SSR-safe defaults
  const [progress, setProgress] = React.useState<WeekProgress>({
    completed: 0,
    total: 7,
    percentage: 0,
    weekLabel: '',
  })

  // Compute progress on client-side only (guards SSR mismatch)
  React.useEffect(() => {
    let completed = 0

    if (typeof window !== 'undefined') {
      try {
        const uniqueThisWeek = new Set<string>()

        for (const key of STORAGE_KEYS) {
          const raw = window.localStorage.getItem(key)
          if (!raw) continue

          const parsed = JSON.parse(raw)
          if (!Array.isArray(parsed)) {
            continue
          }

          for (const entry of parsed) {
            if (!entry) continue

            if (typeof entry === 'string') {
              uniqueThisWeek.add(entry)
              continue
            }

            const id = typeof entry.id === 'string' ? entry.id : String(entry.id ?? '')
            const listenedAt = Number(entry.listenedAt ?? entry.timestamp ?? entry.when ?? 0)

            if (id && Number.isFinite(listenedAt) && isWithinThisISOWeek(listenedAt)) {
              uniqueThisWeek.add(id)
            }
          }
        }

        completed = Math.min(7, uniqueThisWeek.size)
      } catch (error) {
        console.warn('[MindfulnessTrail] Failed to read weekly progress', error)
        completed = 0
      }
    }

    const total = 7
    const percentage = Math.max(0, Math.min(100, Math.round((completed / total) * 100)))

    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000) + 1
    const week = Math.max(1, Math.ceil(dayOfYear / 7))

    setProgress({
      completed,
      total,
      percentage,
      weekLabel: `Semana ${week}`,
    })
  }, [])

  return progress
}
