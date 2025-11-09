'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry-track'

export function useSavedSuggestions(storageKey = 'saved:discover') {
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
      const wasSaved = updated.has(id)

      if (wasSaved) {
        updated.delete(id)
      } else {
        updated.add(id)
      }

      // Persist to localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)))
      } catch {}

      // Fire telemetry (only on save, not on unsave)
      if (!wasSaved) {
        track({
          event: 'discover.suggestion_saved',
          tab: 'descobrir',
          id,
          payload: { id, isSaved: true },
        })
      }

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
