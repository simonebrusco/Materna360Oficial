'use client'

import { save, load } from '@/app/lib/persist'
import { getBrazilDateKey } from '@/app/lib/dateKey'

export type TaskOrigin = 'top3' | 'agenda' | 'selfcare' | 'family' | 'manual'

export type TaskItem = {
  id: string
  title: string
  done: boolean
  origin: TaskOrigin
}

function safeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

type AddToMyDayInput = {
  title: string
  origin: TaskOrigin
  date?: Date
  /**
   * Por padrão, evita duplicar a mesma tarefa no mesmo dia (title+origin, case-insensitive).
   * Para permitir duplicar, passe dedupe: false.
   */
  dedupe?: boolean
}

export function addTaskToMyDay(
  input: AddToMyDayInput
): { id: string; dateKey: string; created: boolean } {
  const dateKey = getBrazilDateKey(input.date ?? new Date())
  const key = `planner/tasks/${dateKey}`

  const existing = load<TaskItem[]>(key, []) ?? []

  const normalizedTitle = (input.title ?? '').trim()
  const normalizedKey = `${input.origin}::${normalizedTitle}`.toLowerCase()

  if (input.dedupe !== false) {
    const has = existing.some(
      (t) =>
        `${t.origin}::${(t.title ?? '').trim()}`.toLowerCase() === normalizedKey
    )
    if (has) return { id: '', dateKey, created: false }
  }

  const id = safeId()
  const next: TaskItem = {
    id,
    title: normalizedTitle || 'Tarefa',
    done: false,
    origin: input.origin,
  }

  save(key, [...existing, next])
  return { id, dateKey, created: true }
}
