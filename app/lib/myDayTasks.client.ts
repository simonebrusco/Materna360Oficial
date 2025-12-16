'use client'

import { track } from '@/app/lib/telemetry'

/**
 * My Day — single source of truth (client storage).
 * - Persistência local por dia: planner/tasks/YYYY-MM-DD
 * - Migração silenciosa: tarefas antigas continuam válidas
 * - Sem acoplamento duro com Planner (guardrails anti-regressão)
 */

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
 * Origin = intenção (usada para agrupamento “leve”).
 * Observação: no Meu Filho você já usa ORIGIN = 'family'.
 */
export type TaskOrigin = 'today' | 'family' | 'self' | 'home' | 'other'

export type TaskStatus = 'active' | 'done' | 'snoozed'

export type MyDayTask = {
  id: string
  title: string

  // intenção / agrupamento
  origin?: TaskOrigin

  // P8: estados leves
  status?: TaskStatus
  snoozeUntil?: string // dateKey (YYYY-MM-DD)
  createdAt?: string // ISO

  // rastreio de origem (telemetria e agrupamento por “fonte”)
  source?: MyDaySource | string

  // extensível (sem depender disso)
  meta?: Record<string, unknown>
}

export type AddToMyDayInput = {
  title: string
  origin?: TaskOrigin
  source?: MyDaySource | string
  date?: Date
  meta?: Record<string, unknown>
}

export type AddToMyDayResult = {
  ok: boolean
  id?: string
  created: boolean
}

/** -----------------------------
 *  Low-level helpers
 *  ----------------------------- */

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

function safeNowISO() {
  try {
    return new Date().toISOString()
  } catch {
    return undefined
  }
}

/**
 * dateKey local (YYYY-MM-DD), sem depender de export externo.
 * Evita os erros “dateKey não exportado” nos clients.
 */
export function makeDateKey(d: Date = new Date()): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function storageKeyFor(dateKey: string) {
  return `planner/tasks/${dateKey}`
}

function parseTasks(raw: string | null): MyDayTask[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // migração silenciosa: normaliza shape
    return parsed
      .map((t: any) => {
        if (!t) return null
        const id = typeof t.id === 'string' ? t.id : ''
        const title = typeof t.title === 'string' ? t.title : ''
        if (!id || !title) return null

        const origin: TaskOrigin | undefined =
          t.origin === 'today' || t.origin === 'family' || t.origin === 'self' || t.origin === 'home' || t.origin === 'other'
            ? t.origin
            : undefined

        const status: TaskStatus | undefined =
          t.status === 'active' || t.status === 'done' || t.status === 'snoozed' ? t.status : undefined

        const snoozeUntil = typeof t.snoozeUntil === 'string' ? t.snoozeUntil : undefined
        const createdAt = typeof t.createdAt === 'string' ? t.createdAt : undefined
        const source = typeof t.source === 'string' ? t.source : undefined
        const meta = typeof t.meta === 'object' && t.meta ? t.meta : undefined

        return { id, title, origin, status, snoozeUntil, createdAt, source, meta } satisfies MyDayTask
      })
      .filter(Boolean) as MyDayTask[]
  } catch {
    return []
  }
}

function readTasks(date: Date = new Date()): MyDayTask[] {
  const key = storageKeyFor(makeDateKey(date))
  return parseTasks(safeGetLS(key))
}

function writeTasks(tasks: MyDayTask[], date: Date = new Date()) {
  const key = storageKeyFor(makeDateKey(date))
  safeSetLS(key, JSON.stringify(tasks))
}

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, ' ').toLowerCase()
}

function stableId(title: string, origin?: TaskOrigin, source?: string) {
  const base = `${normalizeTitle(title)}|${origin ?? ''}|${source ?? ''}`
  // hash leve e determinístico (sem crypto)
  let h = 2166136261
  for (let i = 0; i < base.length; i++) {
    h ^= base.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `t_${(h >>> 0).toString(16)}`
}

/** -----------------------------
 *  Public API (Etapa 1/2 P8)
 *  ----------------------------- */

export function addTaskToMyDay(input: AddToMyDayInput): AddToMyDayResult {
  const date = input.date ?? new Date()
  const title = (input.title ?? '').trim()
  if (!title) return { ok: false, created: false }

  const origin = input.origin
  const source = input.source ?? MY_DAY_SOURCES.UNKNOWN

  const id = stableId(title, origin, String(source))
  const tasks = readTasks(date)

  // já existe?
  const exists = tasks.some((t) => t.id === id)
  if (exists) {
    return { ok: true, id, created: false }
  }

  const createdAt = safeNowISO()
  const next: MyDayTask = {
    id,
    title,
    origin,
    source: String(source),
    status: 'active',
    createdAt,
    meta: input.meta,
  }

  writeTasks([next, ...tasks], date)
  return { ok: true, id, created: true }
}

/**
 * Wrapper com telemetria padronizada (sem dados sensíveis).
 */
export function addTaskToMyDayAndTrack(input: AddToMyDayInput & { source: MyDaySource | string }) {
  const res = addTaskToMyDay(input)
  try {
    track('my_day.add_task', {
      created: res.created,
      ok: res.ok,
      origin: input.origin ?? 'other',
      source: String(input.source ?? MY_DAY_SOURCES.UNKNOWN),
    })
  } catch {}
  return res
}

/**
 * Lista as tarefas do dia (já aplicando regra leve de snooze):
 * - status snoozed só aparece quando snoozeUntil <= hoje (ou inexistente)
 */
export function listMyDayTasks(date: Date = new Date()): MyDayTask[] {
  const todayKey = makeDateKey(date)
  const tasks = readTasks(date)

  return tasks.filter((t) => {
    if (t.status !== 'snoozed') return true
    if (!t.snoozeUntil) return true
    return t.snoozeUntil <= todayKey
  })
}

export function toggleDone(taskId: string, date: Date = new Date()): { ok: boolean } {
  const tasks = readTasks(date)
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) return { ok: false }

  const cur = tasks[idx]
  const nextStatus: TaskStatus = cur.status === 'done' ? 'active' : 'done'
  const next: MyDayTask = { ...cur, status: nextStatus }

  const out = [...tasks]
  out[idx] = next
  writeTasks(out, date)

  try {
    track('my_day.toggle_done', { to: nextStatus })
  } catch {}

  return { ok: true }
}

/**
 * Snooze leve: “não é pra hoje”
 * - por padrão empurra para amanhã (days=1)
 */
export function snoozeTask(taskId: string, days: number = 1, date: Date = new Date()): { ok: boolean } {
  const tasks = readTasks(date)
  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) return { ok: false }

  const cur = tasks[idx]
  const until = new Date(date)
  until.setDate(until.getDate() + Math.max(1, Math.floor(days)))

  const next: MyDayTask = {
    ...cur,
    status: 'snoozed',
    snoozeUntil: makeDateKey(until),
  }

  const out = [...tasks]
  out[idx] = next
  writeTasks(out, date)

  try {
    track('my_day.snooze', { days: Math.max(1, Math.floor(days)) })
  } catch {}

  return { ok: true }
}

export function removeTask(taskId: string, date: Date = new Date()): { ok: boolean } {
  const tasks = readTasks(date)
  const before = tasks.length
  const out = tasks.filter((t) => t.id !== taskId)
  if (out.length === before) return { ok: false }

  writeTasks(out, date)

  try {
    track('my_day.remove', {})
  } catch {}

  return { ok: true }
}

/** -----------------------------
 *  Grouping (P8 — por intenção)
 *  ----------------------------- */

export type MyDayGroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

export type MyDayGroup = {
  id: MyDayGroupId
  title: string
  items: MyDayTask[]
}

function inferOriginFromSource(source?: string): TaskOrigin | undefined {
  if (!source) return undefined
  if (source === MY_DAY_SOURCES.MATERNAR_MEU_FILHO) return 'family'
  if (source === MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM) return 'self'
  if (source === MY_DAY_SOURCES.MATERNAR_MEU_DIA_LEVE) return 'today'
  if (source === MY_DAY_SOURCES.PLANNER) return 'today'
  return undefined
}

function groupIdFromOrigin(origin?: TaskOrigin): MyDayGroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'self') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

function groupTitle(id: MyDayGroupId) {
  if (id === 'para-hoje') return 'Para hoje (simples e real)'
  if (id === 'familia') return 'Família & conexão'
  if (id === 'autocuidado') return 'Autocuidado'
  if (id === 'rotina-casa') return 'Rotina & casa'
  return 'Outros'
}

export function groupTasks(tasks: MyDayTask[]): MyDayGroup[] {
  const buckets: Record<MyDayGroupId, MyDayTask[]> = {
    'para-hoje': [],
    familia: [],
    autocuidado: [],
    'rotina-casa': [],
    outros: [],
  }

  for (const t of tasks) {
    const origin = t.origin ?? inferOriginFromSource(String(t.source ?? ''))
    const gid = groupIdFromOrigin(origin)
    buckets[gid].push({ ...t, origin: origin ?? t.origin })
  }

  const ordered: MyDayGroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
  return ordered.map((id) => ({ id, title: groupTitle(id), items: buckets[id] }))
}
