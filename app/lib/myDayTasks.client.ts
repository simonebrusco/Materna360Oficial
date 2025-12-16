'use client'

import { track } from '@/app/lib/telemetry'
import { dateKey as makeDateKey } from '@/app/lib/dateKey'

/**
 * P7/P8 — Fonte única de persistência do Meu Dia
 * Persistência local: localStorage em `planner/tasks/${dateKey}`
 *
 * Regras:
 * - migração silenciosa (tarefas antigas continuam funcionando)
 * - normalização garante id/status/createdAt/source
 * - sem acoplamento duro com Eu360/Planner
 */

/* =========================
   TIPOS / CONSTANTES
========================= */

type TaskStatus = 'active' | 'done' | 'snoozed'

export type MyDaySource =
  | 'maternar.meu-filho'
  | 'maternar.meu-dia-leve'
  | 'maternar.cuidar-de-mim'
  | 'planner'
  | 'manual'
  | 'unknown'

export const MY_DAY_SOURCES = {
  MATERNAR_MEU_FILHO: 'maternar.meu-filho',
  MATERNAR_MEU_DIA_LEVE: 'maternar.meu-dia-leve',
  MATERNAR_CUIDAR_DE_MIM: 'maternar.cuidar-de-mim',
  PLANNER: 'planner',
  MANUAL: 'manual',
  UNKNOWN: 'unknown',
} as const

export type TaskItem = {
  id: string
  title: string
  status?: TaskStatus
  snoozeUntil?: string // dateKey
  createdAt?: string // ISO
  source?: MyDaySource

  // legado (se existir em dados antigos)
  origin?: string
}

export type AddToMyDayInput = {
  title: string
  date?: Date
  dateKey?: string
  source?: MyDaySource
  origin?: string // legado (se algum lugar ainda mandar)
}

/* =========================
   STORAGE SAFE
========================= */

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

/* =========================
   HELPERS (ID / DATE)
========================= */

function makeId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function asIsoNow() {
  return new Date().toISOString()
}

function storageKeyForDateKey(dateKey: string) {
  return `planner/tasks/${dateKey}`
}

function resolveDateKey(input?: { date?: Date; dateKey?: string }) {
  if (input?.dateKey && input.dateKey.trim().length > 0) return input.dateKey.trim()
  return makeDateKey(input?.date ?? new Date())
}

/* =========================
   MIGRAÇÃO SILENCIOSA
========================= */

function normalizeSource(input?: string): MyDaySource {
  if (!input) return 'unknown'

  // Já no formato novo?
  if (
    input === 'maternar.meu-filho' ||
    input === 'maternar.meu-dia-leve' ||
    input === 'maternar.cuidar-de-mim' ||
    input === 'planner' ||
    input === 'manual' ||
    input === 'unknown'
  ) {
    return input
  }

  // Migração de valores legados (best effort)
  const v = input.toLowerCase()

  if (v.includes('meu-filho')) return 'maternar.meu-filho'
  if (v.includes('meu-dia-leve')) return 'maternar.meu-dia-leve'
  if (v.includes('meu-dia')) return 'maternar.meu-dia-leve'
  if (v.includes('cuidar')) return 'maternar.cuidar-de-mim'
  if (v.includes('auto')) return 'maternar.cuidar-de-mim'
  if (v.includes('planner')) return 'planner'
  if (v.includes('manual')) return 'manual'

  return 'unknown'
}

function normalizeTask(raw: any): TaskItem {
  const title = typeof raw?.title === 'string' ? raw.title : ''

  const id =
    typeof raw?.id === 'string' && raw.id.trim().length > 0 ? raw.id : makeId()

  const createdAt =
    typeof raw?.createdAt === 'string' && raw.createdAt.trim().length > 0
      ? raw.createdAt
      : asIsoNow()

  const status: TaskStatus =
    raw?.status === 'done' || raw?.status === 'snoozed' || raw?.status === 'active'
      ? raw.status
      : 'active'

  const source = normalizeSource(raw?.source ?? raw?.origin)

  const snoozeUntil =
    typeof raw?.snoozeUntil === 'string' && raw.snoozeUntil.trim().length > 0
      ? raw.snoozeUntil
      : undefined

  return {
    id,
    title,
    createdAt,
    status,
    snoozeUntil,
    source,
  }
}

function normalizeTaskList(rawList: any): TaskItem[] {
  const list = Array.isArray(rawList) ? rawList : []
  return list
    .map(normalizeTask)
    .filter((t) => typeof t.title === 'string' && t.title.trim().length > 0)
}

/* =========================
   LEITURA / ESCRITA ÚNICAS
========================= */

function readTasks(dateKey: string): TaskItem[] {
  const key = storageKeyForDateKey(dateKey)
  const raw = safeGetLS(key)
  const parsed = raw ? safeJsonParse(raw, []) : []
  return normalizeTaskList(parsed)
}

function writeTasks(dateKey: string, tasks: TaskItem[]) {
  const key = storageKeyForDateKey(dateKey)
  const next = normalizeTaskList(tasks)
  safeSetLS(key, JSON.stringify(next))
}

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/* =========================
   API PRINCIPAL (P7)
========================= */

/**
 * addTaskToMyDay — usado pelo Maternar (P7)
 * - cria no formato P8 (status/createdAt/source)
 * - mantém compatibilidade com origin legado
 */
export function addTaskToMyDay(input: AddToMyDayInput): { ok: boolean; id?: string } {
  const dk = resolveDateKey({ date: input.date, dateKey: input.dateKey })
  const tasks = readTasks(dk)

  const title = (input.title ?? '').trim()
  if (!title) return { ok: false }

  const newTask: TaskItem = normalizeTask({
    id: makeId(),
    title,
    createdAt: asIsoNow(),
    status: 'active',
    source: normalizeSource(input.source ?? input.origin),
  })

  // Evitar duplicação “igual” imediata (leve, sem rigidez)
  const already = tasks.some((t) => t.title.trim().toLowerCase() === title.toLowerCase())
  const next = already ? tasks : [newTask, ...tasks]

  writeTasks(dk, next)
  return { ok: true, id: newTask.id }
}

export type MyDaySourceForTrack = MyDaySource | string

export function addTaskToMyDayAndTrack(input: AddToMyDayInput & { source: MyDaySourceForTrack }) {
  const res = addTaskToMyDay(input)
  try {
    track('my_day.task.add', {
      ok: res.ok,
      source: normalizeSource(input.source),
      hasId: Boolean(res.id),
    })
  } catch {}
  return res
}

/* =========================
   API P8 (ETAPA 2)
========================= */

export function listMyDayTasks(date?: Date): TaskItem[] {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasks(dk)

  // Regra do snooze: “não é pra hoje” não aparece quando snoozeUntil > hoje
  // (mas mantém no storage para voltar depois).
  return tasks.filter((t) => {
    if (t.status !== 'snoozed') return true
    if (!t.snoozeUntil) return true
    // se snoozeUntil <= hoje, volta a aparecer
    return t.snoozeUntil <= dk
  })
}

export function toggleDone(taskId: string, date?: Date): { ok: boolean } {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasks(dk)

  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) return { ok: false }

  const t = tasks[idx]
  const nextStatus: TaskStatus = t.status === 'done' ? 'active' : 'done'

  tasks[idx] = normalizeTask({
    ...t,
    status: nextStatus,
    // done não carrega snooze
    snoozeUntil: nextStatus === 'done' ? undefined : t.snoozeUntil,
  })

  writeTasks(dk, tasks)

  try {
    track('my_day.task.toggle_done', {
      status: nextStatus,
      source: normalizeSource(tasks[idx].source),
    })
  } catch {}

  return { ok: true }
}

export function snoozeTask(taskId: string, days = 1, date?: Date): { ok: boolean; snoozeUntil?: string } {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasks(dk)

  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) return { ok: false }

  // Snooze leve: empurra visibilidade para um dateKey futuro
  const until = makeDateKey(addDays(date ?? new Date(), Math.max(1, days)))

  const t = tasks[idx]
  tasks[idx] = normalizeTask({
    ...t,
    status: 'snoozed',
    snoozeUntil: until,
  })

  writeTasks(dk, tasks)

  try {
    track('my_day.task.snooze', {
      days: Math.max(1, days),
      snoozeUntil: until,
      source: normalizeSource(tasks[idx].source),
    })
  } catch {}

  return { ok: true, snoozeUntil: until }
}

export function unsnoozeTask(taskId: string, date?: Date): { ok: boolean } {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasks(dk)

  const idx = tasks.findIndex((t) => t.id === taskId)
  if (idx < 0) return { ok: false }

  const t = tasks[idx]
  tasks[idx] = normalizeTask({
    ...t,
    status: 'active',
    snoozeUntil: undefined,
  })

  writeTasks(dk, tasks)

  try {
    track('my_day.task.unsnooze', {
      source: normalizeSource(tasks[idx].source),
    })
  } catch {}

  return { ok: true }
}

export function removeTask(taskId: string, date?: Date): { ok: boolean } {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasks(dk)

  const before = tasks.length
  const next = tasks.filter((t) => t.id !== taskId)
  if (next.length === before) return { ok: false }

  writeTasks(dk, next)

  try {
    track('my_day.task.remove', { count: 1 })
  } catch {}

  return { ok: true }
}

/* =========================
   AGRUPAMENTO (P8)
========================= */

export type TaskGroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

export type GroupedTasks = Array<{
  id: TaskGroupId
  title: string
  items: TaskItem[]
}>

export function groupTasks(tasks: TaskItem[]): GroupedTasks {
  const normalized = normalizeTaskList(tasks)

  const buckets: Record<TaskGroupId, TaskItem[]> = {
    'para-hoje': [],
    familia: [],
    autocuidado: [],
    'rotina-casa': [],
    outros: [],
  }

  for (const t of normalized) {
    const src = normalizeSource(t.source)

    // Mapeamento por intenção (sem “produtividade fria”)
    if (src === 'maternar.meu-filho') {
      buckets.familia.push(t)
      continue
    }

    if (src === 'maternar.cuidar-de-mim') {
      buckets.autocuidado.push(t)
      continue
    }

    if (src === 'maternar.meu-dia-leve') {
      buckets['para-hoje'].push(t)
      continue
    }

    if (src === 'planner') {
      buckets['para-hoje'].push(t)
      continue
    }

    if (src === 'manual') {
      buckets['para-hoje'].push(t)
      continue
    }

    buckets.outros.push(t)
  }

  // Ordenação leve:
  // - active primeiro, depois snoozed, depois done
  // - mais recente primeiro por createdAt
  const sortGroup = (a: TaskItem, b: TaskItem) => {
    const wa = weightStatus(a.status)
    const wb = weightStatus(b.status)
    if (wa !== wb) return wa - wb

    const ca = a.createdAt ? Date.parse(a.createdAt) : 0
    const cb = b.createdAt ? Date.parse(b.createdAt) : 0
    return cb - ca
  }

  const groups: GroupedTasks = [
    { id: 'para-hoje', title: 'Para hoje (simples e real)', items: buckets['para-hoje'].sort(sortGroup) },
    { id: 'familia', title: 'Família & conexão', items: buckets.familia.sort(sortGroup) },
    { id: 'autocuidado', title: 'Autocuidado', items: buckets.autocuidado.sort(sortGroup) },
    { id: 'rotina-casa', title: 'Rotina & casa', items: buckets['rotina-casa'].sort(sortGroup) },
    { id: 'outros', title: 'Outros', items: buckets.outros.sort(sortGroup) },
  ]

  // Remover grupos vazios (UI agradece)
  return groups.filter((g) => g.items.length > 0)
}

function weightStatus(s?: TaskStatus) {
  // active (0) -> snoozed (1) -> done (2)
  if (s === 'active' || !s) return 0
  if (s === 'snoozed') return 1
  return 2
}

function addDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}
