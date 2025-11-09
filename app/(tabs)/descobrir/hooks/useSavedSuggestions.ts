'use client'

import * as React from 'react'
import { track } from '@/app/lib/telemetry-track'
import { save as persistSave, load as persistLoad } from '@/app/lib/persist'

export function useSavedSuggestions(storageKey = 'saved:discover') {
  const [saved, setSaved] = React.useState<string[]>([])

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const loaded = persistLoad<string[]>(storageKey, [])
      if (loaded && Array.isArray(loaded)) {
        setSaved(loaded)
      }
    } catch {}
  }, [storageKey])

  // Persist whenever saved changes
  React.useEffect(() => {
    try {
      persistSave(storageKey, saved)
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

      const newArray = Array.from(updated)

      // Persist to localStorage
      try {
        persistSave(storageKey, newArray)
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

      return newArray
    })
  }

  const remove = (id: string) => {
    setSaved((prev) => {
      const updated = prev.filter((x) => x !== id)
      try {
        persistSave(storageKey, updated)
      } catch {}
      return updated
    })
  }

  const isSaved = (id: string) => saved.includes(id)

  return { saved, save, remove, isSaved }
}
