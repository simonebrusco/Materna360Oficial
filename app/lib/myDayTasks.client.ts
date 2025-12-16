'use client'

import { save, load } from '@/app/lib/persist'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { track } from '@/app/lib/telemetry'

/**
 * Origins (o "porquê" / área semântica da task)
 * - Deve ser curto, estável e reutilizável em todos os hubs.
 */
export type TaskOrigin = 'top3' | 'agenda' | 'selfcare' | 'family' | 'manual'

/**
 * Sources (o "de onde veio" / ponto do produto)
 * - Usado apenas para tracking/telemetry.
 * - NÃO é persistido no storage do Meu Dia na P7 (escopo).
 */
export const MY_DAY_SOURCES = {
  maternarMeuFilho: 'maternar.meu-filho',
  // Próximos hubs entram aqui (P7/P8) — sem inventar strings soltas:
  // maternarRotinaLeve: 'maternar.rotina-leve',
  // maternarMeuCorpo: 'maternar.meu-corpo',
  // maternarBiblioteca: 'maternar.biblioteca',
} as const

export type MyDaySource = (typeof MY_DAY_SOURCES)[keyof typeof MY_DAY_SOURCES]

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

function normalizeTitle(title: string) {
  return (title ?? '').trim()
}

function makeDedupeKey(origin: TaskOrigin, title: string) {
  return `${origin}::${normalizeTitle(title)}`.toLowerCase()
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

  const rawTitle = normalizeTitle(input.title)
  const titleFinal = rawTitle || 'Tarefa'
  const normalizedKey = makeDedupeKey(input.origin, titleFinal)

  if (input.dedupe !== false) {
    const has = existing.some((t) => makeDedupeKey(t.origin, t.title) === normalizedKey)
    if (has) return { id: '', dateKey, created: false }
  }

  const id = safeId()
  const next: TaskItem = {
    id,
    title: titleFinal,
    done: false,
    origin: input.origin,
  }

  save(key, [...existing, next])
  return { id, dateKey, created: true }
}

/**
 * Wrapper padrão da P7:
 * - cria a task no Meu Dia (com dedupe por default)
 * - dispara telemetry consistente
 * - NÃO muda persistência (escopo P7)
 */
export function addTaskToMyDayAndTrack(input: AddToMyDayInput & { source: MyDaySource }) {
  const res = addTaskToMyDay(input)

  try {
    track('my_day.add_task', {
      source: input.source,
      origin: input.origin,
      dateKey: res.dateKey,
      created: res.created,
    })
  } catch {}

  return res
}
