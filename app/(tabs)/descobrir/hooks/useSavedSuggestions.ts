'use client'
import * as React from 'react'
import { track } from '@/app/lib/telemetry'

export function useSavedSuggestions(storageKey = 'descobrir:saved') {
  const [saved, setSaved] = React.useState<string[]>([])

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setSaved(JSON.parse(raw))
    } catch {}
  }, [storageKey])

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved))
    } catch {}
  }, [storageKey, saved])

  const save = (id: string) => {
    setSaved((prev) => {
      const updated = new Set(prev)
      if (updated.has(id)) {
        updated.delete(id)
      } else {
        updated.add(id)
      }
      // Persist to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)))
      } catch {}
      // Fire telemetry
      track('suggestion_saved', { tab: 'descobrir', id, isSaved: !updated.has(id) })
      return Array.from(updated)
    })
  }

  const remove = (id: string) => {
    setSaved((prev) => {
      const updated = prev.filter((x) => x !== id)
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const isSaved = (id: string) => saved.includes(id)

  return { saved, save, remove, isSaved }
}
