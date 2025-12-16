'use client'

import { track } from '@/app/lib/telemetry'

/**
 * P7/P8 — Meu Dia Tasks (client-only)
 * Fonte única: LocalStorage (key: planner/tasks/YYYY-MM-DD)
 *
 * Regra de compatibilidade:
 * - O PLANNER (WeeklyPlannerCore) espera TaskItem com { done: boolean }
 * - O MEU DIA (P7/P8) usa MyDayTaskItem com status/snooze etc
 *
 * Portanto:
 * - Mantemos TaskItem (Planner) SEPARADO de MyDayTaskItem (Meu Dia)
 * - Persistência continua no mesmo storageKey planner/tasks/YYYY-MM-DD
 */

/** Sources (telemetria + agrupamento fino no futuro) */
export const MY_DAY_SOURCES = {
  MATERNAR_MEU_FILHO: 'maternar.meu-filho',
  MATERNAR_MEU_DIA_LEVE: 'maternar.meu-dia-leve',
  MATERNAR_CUIDAR_DE_MIM: 'maternar.cuidar-de-mim',
  PLANNER: 'planner',
  MANUAL: 'manual',
  UNKNOWN: 'unknown',
} as const

export type MyDaySource = (typeof MY_DAY_SOURCES)[keyof typeof MY_DAY_SOURCES]

/**
 * Origem/Intenção
 * Inclui origens do Planner (top3, agenda) + origens P8.
 */
export type TaskOrigin = 'today' | 'top3' | 'agenda' | 'family' | 'selfcare' | 'home' | 'other'

/**
 * Shape DO PLANNER (não mudar):
 * WeeklyPlannerCore cria TaskItem com "done".
 */
export type TaskItem = {
  id: string
  title: string
  origin: TaskOrigin
  done: boolean
}

/**
 * Shape DO MEU DIA (P7/P8):
 * Evolução sem quebrar Planner.
 */
export type TaskStatus = 'active' | 'done' | 'snoozed'

export type MyDayTaskItem = {
  id: string
  title: string
  origin: TaskOrigin

  /** legado (Planner) — pode existir em dados antigos */
  done?: boolean

  /** P8 (opcionais — migração silenciosa) */
  status?: TaskStatus
  snoozeUntil?: string // YYYY-MM-DD
  createdAt?: string // ISO
  source?: MyDaySource
}

/** Entrada padrão para salvar no Meu Dia */
export type AddToMyDayInput = {
  title: string
  origin: TaskOrigin
  date?: Date
  source?: MyDaySource
}

/** Resultado compatível com o que os Clients precisam (created + dateKey) */
export type AddToMyDayResult = {
  ok: boolean
  id?: string
  created?: boolean
  dateKey?: string
}

type GroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

export type GroupedTasks = Record<
  GroupId,
  {
    id: GroupId
    title: string
    items: MyDayTaskItem[]
  }
>

/** ---------- Helpers ---------- */

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeStringifyJSON(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return '[]'
  }
}

function makeDateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function storageKeyForDateKey(dateKey: string) {
  return `planner/tasks/${dateKey}`
}

function isTaskOrigin(v: unknown): v is TaskOrigin {
  return (
    v === 'today' ||
    v === 'top3' ||
    v === 'agenda' ||
    v === 'family' ||
    v === 'selfcare' ||
    v === 'home' ||
    v === 'other'
  )
}

function isTaskStatus(v: unknown): v is TaskStatus {
  return v === 'active' || v === 'done' || v === 'snoozed'
}

function isMyDaySource(v: unknown): v is MyDaySource {
  return typeof v === 'string' && (Object.values(MY_DAY_SOURCES) as string[]).includes(v)
}

/**
 * Normaliza tarefas vindas do storage (que pode conter:
 * - TaskItem do Planner (done)
 * - MyDayTaskItem do Meu Dia (status)
 */
function normalizeStoredTask(it: any): MyDayTaskItem | null {
  if (!it) return null

  const id = typeof it.id === 'string' ? it.id : ''
  const title = typeof it.title === 'string' ? it.title : ''
  const origin: TaskOrigin = isTaskOrigin(it.origin) ? it.origin : 'other'
  if (!id || !title) return null

  const doneLegacy: boolean | undefined = typeof it.done === 'boolean' ? it.done : undefined
  const status: TaskStatus | undefined = isTaskStatus(it.status) ? it.status : undefined
  const snoozeUntil = typeof it.snoozeUntil === 'string' ? it.snoozeUntil : undefined
  const createdAt = typeof it.createdAt === 'string' ? it.createdAt : undefined
  const source: MyDaySource | undefined = isMyDaySource(it.source) ? it.source : undefined

  // Migração silenciosa: se veio do Planner (done=true/false) e não tem status, cria status coerente.
  const computedStatus: TaskStatus | undefined =
    status ?? (doneLegacy === true ? 'done' : doneLegacy === false ? 'active' : undefined)

  return {
    id,
    title,
    origin,
    done: doneLegacy,
    status: computedStatus,
    snoozeUntil,
    createdAt,
    source,
  }
}

function readTasksByDateKey(dateKey: string): MyDayTaskItem[] {
  if (typeof window === 'undefined') return []
  const key = storageKeyForDateKey(dateKey)
  const parsed = safeParseJSON<unknown>(window.localStorage.getItem(key))
  if (!Array.isArray(parsed)) return []

  const normalized: MyDayTaskItem[] = parsed.map(normalizeStoredTask).filter(Boolean) as MyDayTaskItem[]
  return normalized
}

function writeTasksByDateKey(dateKey: string, tasks: MyDayTaskItem[]) {
  if (typeof window === 'undefined') return
  const key = storageKeyForDateKey(dateKey)
  window.localStorage.setItem(key, safeStringifyJSON(tasks))
}

/** ---------- API pública (P7 + P8) ---------- */

export function addTaskToMyDay(input: AddToMyDayInput): AddToMyDayResult {
  try {
    const dk = makeDateKey(input.date ?? new Date())
    const nowISO = new Date().toISOString()
    const tasks = readTasksByDateKey(dk)

    const title = (input.title ?? '').trim()
    const origin = input.origin ?? 'other'
    const source = input.source ?? MY_DAY_SOURCES.UNKNOWN
    if (!title) return { ok: false }

    const exists = tasks.some((t) => t.title.trim().toLowerCase() === title.toLowerCase() && t.origin === origin)
    if (exists) return { ok: true, created: false, dateKey: dk }

    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `t_${Math.random().toString(16).slice(2)}_${Date.now()}`

    const next: MyDayTaskItem[] = [
      ...tasks,
      {
        id,
        title,
        origin,
        status: 'active',
        createdAt: nowISO,
        source,
      },
    ]

    writeTasksByDateKey(dk, next)
    return { ok: true, id, created: true, dateKey: dk }
  } catch {
    return { ok: false }
  }
}

export function addTaskToMyDayAndTrack(input: AddToMyDayInput & { source: MyDaySource }) {
  const res = addTaskToMyDay(input)
  try {
    track('my_day.task.add', {
      ok: !!res.ok,
      created: !!res.created,
      origin: input.origin,
      source: input.source,
      dateKey: res.dateKey,
    })
  } catch {}
  return res
}

export function listMyDayTasks(date?: Date): MyDayTaskItem[] {
  const dk = makeDateKey(date ?? new Date())
  return readTasksByDateKey(dk)
}

export function toggleDone(taskId: string, date?: Date): { ok: boolean } {
  try {
    const dk = makeDateKey(date ?? new Date())
    const tasks = readTasksByDateKey(dk)

    const next: MyDayTaskItem[] = tasks.map((t) => {
      if (t.id !== taskId) return t
      const baseStatus = t.status ?? (t.done ? 'done' : 'active')
      const nextStatus: TaskStatus = baseStatus === 'done' ? 'active' : 'done'
      return { ...t, status: nextStatus, done: nextStatus === 'done' }
    })

    writeTasksByDateKey(dk, next)
    try {
      track('my_day.task.toggle_done', { ok: true })
    } catch {}
    return { ok: true }
  } catch {
    try {
      track('my_day.task.toggle_done', { ok: false })
    } catch {}
    return { ok: false }
  }
}

export function snoozeTask(taskId: string, days = 1, date?: Date): { ok: boolean; snoozeUntil?: string } {
  try {
    const base = date ?? new Date()
    const dk = makeDateKey(base)

    const until = new Date(base)
    until.setDate(until.getDate() + Math.max(1, days))
    const untilKey = makeDateKey(until)

    const tasks = readTasksByDateKey(dk)

    const next: MyDayTaskItem[] = tasks.map((t) => {
      if (t.id !== taskId) return t
      return { ...t, status: 'snoozed', snoozeUntil: untilKey, done: false }
    })

    writeTasksByDateKey(dk, next)
    try {
      track('my_day.task.snooze', { ok: true, days })
    } catch {}
    return { ok: true, snoozeUntil: untilKey }
  } catch {
    try {
      track('my_day.task.snooze', { ok: false, days })
    } catch {}
    return { ok: false }
  }
}

export function removeTask(taskId: string, date?: Date): { ok: boolean } {
  try {
    const dk = makeDateKey(date ?? new Date())
    const tasks = readTasksByDateKey(dk)

    const next: MyDayTaskItem[] = tasks.filter((t) => t.id !== taskId)
    writeTasksByDateKey(dk, next)

    try {
      track('my_day.task.remove', { ok: true })
    } catch {}
    return { ok: true }
  } catch {
    try {
      track('my_day.task.remove', { ok: false })
    } catch {}
    return { ok: false }
  }
}

/**
 * P8: agrupamento por intenção/origin.
 * - top3 e agenda entram em "Para hoje"
 */
export function groupTasks(tasks: MyDayTaskItem[]): GroupedTasks {
  const grouped: GroupedTasks = {
    'para-hoje': { id: 'para-hoje', title: 'Para hoje (simples e real)', items: [] },
    familia: { id: 'familia', title: 'Família & conexão', items: [] },
    autocuidado: { id: 'autocuidado', title: 'Autocuidado', items: [] },
    'rotina-casa': { id: 'rotina-casa', title: 'Rotina & casa', items: [] },
    outros: { id: 'outros', title: 'Outros', items: [] },
  }

  for (const t of tasks) {
    const origin = t.origin ?? 'other'
    if (origin === 'today' || origin === 'top3' || origin === 'agenda') grouped['para-hoje'].items.push(t)
    else if (origin === 'family') grouped.familia.items.push(t)
    else if (origin === 'selfcare') grouped.autocuidado.items.push(t)
    else if (origin === 'home') grouped['rotina-casa'].items.push(t)
    else grouped.outros.items.push(t)
  }

  return grouped
}
