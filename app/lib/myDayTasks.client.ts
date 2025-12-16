'use client'

import { track } from '@/app/lib/telemetry'

export type TaskStatus = 'active' | 'done' | 'snoozed'

export type TaskOrigin =
  | 'today'
  | 'family'
  | 'selfcare'
  | 'home'
  | 'other'

export const MY_DAY_SOURCES = {
  MATERNAR_MEU_FILHO: 'maternar.meu-filho',
  MATERNAR_MEU_DIA_LEVE: 'maternar.meu-dia-leve',
  MATERNAR_CUIDAR_DE_MIM: 'maternar.cuidar-de-mim',
  PLANNER: 'planner',
  MANUAL: 'manual',
  UNKNOWN: 'unknown',
} as const

export type MyDaySource = (typeof MY_DAY_SOURCES)[keyof typeof MY_DAY_SOURCES]

export type MyDayTaskItem = {
  id: string
  title: string
  origin: TaskOrigin

  // P8 (campos opcionais, migração silenciosa)
  status?: TaskStatus
  snoozeUntil?: string // YYYY-MM-DD
  createdAt?: string   // ISO
  source?: MyDaySource
}

export type AddToMyDayInput = {
  title: string
  origin: TaskOrigin
  source?: MyDaySource
  date?: Date
}

export type AddToMyDayResult = {
  ok: boolean
  id?: string

  // compat: usado pela UI/telemetria para diferenciar "já existia"
  created: boolean

  // útil p/ telemetria e debug
  dateKey: string
}

const STORAGE_PREFIX = 'planner/tasks/'
const MAX_TITLE_LEN = 140

function makeDateKey(d: Date) {
  // Formato estável: YYYY-MM-DD
  const iso = d.toISOString()
  return iso.slice(0, 10)
}

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function normalizeTitle(title: string) {
  const t = (title ?? '').trim().replace(/\s+/g, ' ')
  return t.length > MAX_TITLE_LEN ? t.slice(0, MAX_TITLE_LEN) : t
}

function taskStorageKey(dateKey: string) {
  return `${STORAGE_PREFIX}${dateKey}`
}

function readTasksByDateKey(dateKey: string): MyDayTaskItem[] {
  const key = taskStorageKey(dateKey)
  const raw = safeGetLS(key)
  const items = safeParseJSON<MyDayTaskItem[]>(raw, [])

  // migração silenciosa (tarefas antigas continuam)
  return (Array.isArray(items) ? items : []).map((t) => ({
    ...t,
    status: t.status ?? 'active',
    createdAt: t.createdAt ?? new Date().toISOString(),
    origin: (t.origin ?? 'other') as TaskOrigin,
  }))
}

function writeTasksByDateKey(dateKey: string, items: MyDayTaskItem[]) {
  const key = taskStorageKey(dateKey)
  safeSetLS(key, JSON.stringify(items))
}

function makeId() {
  // id estável o suficiente para storage local
  return `md_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

export function listMyDayTasks(date?: Date): MyDayTaskItem[] {
  const dk = makeDateKey(date ?? new Date())
  return readTasksByDateKey(dk)
}

export function addTaskToMyDay(input: AddToMyDayInput): AddToMyDayResult {
  const dateKey = makeDateKey(input.date ?? new Date())
  const title = normalizeTitle(input.title)

  if (!title) {
    return { ok: false, created: false, dateKey }
  }

  const tasks = readTasksByDateKey(dateKey)

  // dedupe por title + origin (simples e robusto)
  const exists = tasks.some(
    (t) =>
      (t.title ?? '').trim().toLowerCase() === title.toLowerCase() &&
      (t.origin ?? 'other') === input.origin
  )

  if (exists) {
    // mantém compat (ok true) mas created false
    return { ok: true, created: false, dateKey }
  }

  const id = makeId()
  const nowISO = new Date().toISOString()

  const next: MyDayTaskItem = {
    id,
    title,
    origin: input.origin,
    status: 'active',
    createdAt: nowISO,
    source: input.source ?? MY_DAY_SOURCES.UNKNOWN,
  }

  writeTasksByDateKey(dateKey, [next, ...tasks])

  return { ok: true, id, created: true, dateKey }
}

export function addTaskToMyDayAndTrack(
  input: AddToMyDayInput & { source: MyDaySource }
): AddToMyDayResult {
  const res = addTaskToMyDay(input)
  try {
    track('my_day.task.add', {
      origin: input.origin,
      source: input.source,
      created: res.created,
      dateKey: res.dateKey,
    })
  } catch {}
  return res
}

export function toggleDone(taskId: string, date?: Date): { ok: boolean } {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasksByDateKey(dk)

  const next = tasks.map((t) => {
    if (t.id !== taskId) return t
    const nextStatus: TaskStatus = (t.status ?? 'active') === 'done' ? 'active' : 'done'
    return { ...t, status: nextStatus }
  })

  writeTasksByDateKey(dk, next)

  try {
    track('my_day.task.toggle_done', { ok: true })
  } catch {}

  return { ok: true }
}

export function snoozeTask(
  taskId: string,
  opts?: { days?: number; date?: Date }
): { ok: boolean; snoozeUntil?: string } {
  const base = opts?.date ?? new Date()
  const dk = makeDateKey(base)
  const days = Math.max(1, Math.min(14, opts?.days ?? 1)) // guardrail

  const until = new Date(base)
  until.setDate(until.getDate() + days)
  const snoozeUntil = makeDateKey(until)

  const tasks = readTasksByDateKey(dk)
  const next = tasks.map((t) => {
    if (t.id !== taskId) return t
    return { ...t, status: 'snoozed', snoozeUntil }
  })

  writeTasksByDateKey(dk, next)

  try {
    track('my_day.task.snooze', { ok: true, days })
  } catch {}

  return { ok: true, snoozeUntil }
}

export function removeTask(taskId: string, date?: Date): { ok: boolean } {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasksByDateKey(dk)
  const next = tasks.filter((t) => t.id !== taskId)
  writeTasksByDateKey(dk, next)

  try {
    track('my_day.task.remove', { ok: true })
  } catch {}

  return { ok: true }
}

export type MyDayGroupId =
  | 'para-hoje'
  | 'familia'
  | 'autocuidado'
  | 'rotina-casa'
  | 'outros'

export function groupTasks(tasks: MyDayTaskItem[]): Record<MyDayGroupId, MyDayTaskItem[]> {
  const groups: Record<MyDayGroupId, MyDayTaskItem[]> = {
    'para-hoje': [],
    familia: [],
    autocuidado: [],
    'rotina-casa': [],
    outros: [],
  }

  for (const t of tasks ?? []) {
    const origin = (t.origin ?? 'other') as TaskOrigin

    if (origin === 'today') groups['para-hoje'].push(t)
    else if (origin === 'family') groups.familia.push(t)
    else if (origin === 'selfcare') groups.autocuidado.push(t)
    else if (origin === 'home') groups['rotina-casa'].push(t)
    else groups.outros.push(t)
  }

  return groups
}
