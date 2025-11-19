'use client'

import { useEffect, useState, useCallback } from 'react'
import { load, save } from '@/app/lib/persist'

export type SavedContent = {
  id: string
  title: string
  type: 'artigo' | 'receita' | 'ideia' | 'frase'
  origin: string
  href?: string
}

const STORAGE_KEY = 'saved:inspirations'

export function useSavedInspirations() {
  const [savedItems, setSavedItems] = useState<SavedContent[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load saved inspirations on mount
  useEffect(() => {
    const loaded = load<SavedContent[]>(STORAGE_KEY, []) ?? []
    setSavedItems(loaded)
    setIsHydrated(true)
  }, [])

  // Toggle save/unsave
  const toggleSave = useCallback(
    (item: SavedContent) => {
      setSavedItems(prev => {
        const isSaved = prev.some(saved => saved.id === item.id)
        let updated: SavedContent[]

        if (isSaved) {
          // Remove from saved
          updated = prev.filter(saved => saved.id !== item.id)
        } else {
          // Add to saved
          updated = [...prev, item]
        }

        // Persist to localStorage
        save(STORAGE_KEY, updated)
        return updated
      })
    },
    []
  )

  // Check if an item is saved
  const isSaved = useCallback(
    (id: string): boolean => {
      return savedItems.some(item => item.id === id)
    },
    [savedItems]
  )

  // Get all saved items
  const getSavedItems = useCallback((): SavedContent[] => {
    return savedItems
  }, [savedItems])

  return {
    savedItems,
    toggleSave,
    isSaved,
    getSavedItems,
    isHydrated,
  }
}
