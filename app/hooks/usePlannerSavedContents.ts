'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

export type PlannerOrigin =
  | 'rotina-leve'
  | 'como-estou-hoje'
  | 'autocuidado-inteligente'
  | 'cuidar-com-amor'
  | 'minhas-conquistas'
  | 'biblioteca-materna'

export type PlannerContentType =
  | 'note'
  | 'checklist'
  | 'task'
  | 'recipe'
  | 'goal'
  | 'insight'
  | 'event'

export interface PlannerSavedContent {
  id: string
  dateKey: string
  origin: PlannerOrigin
  type: PlannerContentType
  title: string
  payload: any
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY_PREFIX = 'planner:saved:v1:'

function getStorageKey(dateKey: string) {
  return `${STORAGE_KEY_PREFIX}${dateKey}`
}

function loadForDate(dateKey: string): PlannerSavedContent[] {
  try {
    const stored = load<PlannerSavedContent[]>(getStorageKey(dateKey))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export function usePlannerSavedContents(initialDate?: Date) {
  const [dateKey, setDateKey] = useState(() =>
    getBrazilDateKey(initialDate),
  )
  const [items, setItems] = useState<PlannerSavedContent[]>([])

  useEffect(() => {
    const data = loadForDate(dateKey)
    setItems(data)
  }, [dateKey])

  const persist = useCallback(
    (next: PlannerSavedContent[]) => {
      setItems(next)
      save(getStorageKey(dateKey), next)
    },
    [dateKey],
  )

  const addItem = useCallback(
    (input: Omit<PlannerSavedContent, 'id' | 'dateKey' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString()
      const newItem: PlannerSavedContent = {
        id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        dateKey,
        createdAt: now,
        updatedAt: now,
        ...input,
      }

      const next = [...items, newItem]
      persist(next)

      track('planner_saved_content_add', {
        origin: input.origin,
        type: input.type,
      })

      toast.success('Salvo no planner com carinho.')
      return newItem
    },
    [items, dateKey, persist],
  )

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<PlannerSavedContent, 'id' | 'dateKey'>>) => {
      const next = items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : item,
      )
      persist(next)

      track('planner_saved_content_update', { id })

      toast.success('Atualizado no planner.')
    },
    [items, persist],
  )

  const removeItem = useCallback(
    (id: string) => {
      const next = items.filter((item) => item.id !== id)
      persist(next)

      track('planner_saved_content_remove', { id })

      toast.info('Removido do planner.')
    },
    [items, persist],
  )

  const clearAllForDate = useCallback(() => {
    persist([])
    track('planner_saved_content_clear', { dateKey })
    toast.info('Planner do dia limpo com sucesso.')
  }, [dateKey, persist])

  const getByOrigin = useCallback(
    (origin: PlannerOrigin) => items.filter((item) => item.origin === origin),
    [items],
  )

  return {
    dateKey,
    setDateKey,
    items,
    addItem,
    updateItem,
    removeItem,
    clearAllForDate,
    getByOrigin,
  }
}
