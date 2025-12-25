'use client'

import { track } from '@/app/lib/telemetry'

/**
 * P7/P8/P12 — Meu Dia Tasks (client-only)
 * Fonte única: LocalStorage (key: planner/tasks/YYYY-MM-DD)
 *
 * Compatibilidade:
 * - WeeklyPlannerCore (Planner) usa persist.ts que grava com prefixo "m360:"
 * - Meu Dia (myDayTasks.client) historicamente gravava sem prefixo
 *
 * Estratégia segura:
 * - LER dos dois lugares (prioridade: prefixado)
 * - ESCREVER nos dois lugares (compat total)
 * - MIGRAR silenciosamente: se achar só no legado, replica para o prefixado
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
 * Inclui origens do Planner + origens do Meu Dia.
 */
export type TaskOrigin =
  | 'today'
  | 'top3'
  | 'agenda'
  | 'family'
  | 'selfcare'
  | 'home'
  | 'other'
  | 'custom'

/**
 * Shape do PLANNER (não mudar):
 * WeeklyPlannerCore cria TaskItem com "done".
 */
export type TaskItem = {
  id: string
  title: string
  origin: TaskOrigin
  done: boolean
}

/**
 * Shape do MEU DIA (evolutivo):
 * Mantém compatibilidade com dados antigos.
 */
export type TaskStatus = 'active' | 'done' | 'snoozed'

export type MyDayTaskItem = {
  id: string
  title: string
  origin: TaskOrigin

  /** legado (Planner) — pode existir em dados antigos */
  done?: boolean

  /** P8+ */
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

  /**
   * Guardrail: se bater limite de “tarefas abertas”, não criamos nova.
   * Mantido como campo opcional para não quebrar callers antigos.
   */
  limitHit?: boolean
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

/**
 * Guardrail (P26+):
 * Quantas tarefas “abertas” (active + snoozed) podem existir no dia.
 * Observação: "done" não conta para o limite.
 */
const OPEN_TASKS_LIMIT_PER_DAY = 18

/** ---------- Helpers ---------- */

const M360_PREFIX = 'm360:'

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

function storageKeyRawForDateKey(dateKey: string) {
  return `planner/tasks/${dateKey}`
}

function storageKeyPrefixedForDateKey(dateKey: string) {
  return `${M360_PREFIX}${storageKeyRawForDateKey(dateKey)}`
}

function getStorageKeys(dateKey: string) {
  const raw = storageKeyRawForDateKey(dateKey)
  const pref = storageKeyPrefixedForDateKey(dateKey)
  return { raw, pref }
}

function isTaskOrigin(v: unknown): v is TaskOrigin {
  return (
    v === 'today' ||
    v === 'top3' ||
    v === 'agenda' ||
    v === 'family' ||
    v === 'selfcare' ||
    v === 'home' ||
    v === 'other' ||
    v === 'custom'
  )
}

function isTaskStatus(v: unknown): v is TaskStatus {
  return v === 'active' || v === 'done' || v === 'snoozed'
}

function isMyDaySource(v: unknown): v is MyDaySource {
  return typeof v === 'string' && (Object.values(MY_DAY_SOURCES) as string[]).includes(v)
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `t_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function statusOf(t: MyDayTaskItem): TaskStatus {
  const s = t.status
  if (s === 'active' || s === 'done' || s === 'snoozed') return s
  return t.done ? 'done' : 'active'
}

function countOpenTasks(tasks: MyDayTaskItem[]): number {
  let n = 0
  for (const t of tasks) {
    const s = statusOf(t)
    if (s === 'active' || s === 'snoozed') n += 1
  }
  return n
}

/**
 * Normaliza tarefas vindas do storage (que pode conter):
 * - TaskItem do Planner (done)
 * - MyDayTaskItem do Meu Dia (status)
 *
 * Retorna também se houve migração silenciosa (para persistir no próximo write).
 */
function normalizeStoredTask(it: any, nowISO: string): { item: MyDayTaskItem | null; changed: boolean } {
  if (!it) return { item: null, changed: false }

  let changed = false

  const title = typeof it.title === 'string' ? it.title : ''
  if (!title) return { item: null, changed: false }

  const origin: TaskOrigin = isTaskOrigin(it.origin) ? it.origin : 'other'
  if (!isTaskOrigin(it.origin)) changed = true

  // se não tiver id → gerar e persistir
  let id = typeof it.id === 'string' ? it.id : ''
  if (!id) {
    id = makeId()
    changed = true
  }

  const doneLegacy: boolean | undefined = typeof it.done === 'boolean' ? it.done : undefined
  const statusRaw: TaskStatus | undefined = isTaskStatus(it.status) ? it.status : undefined
  const snoozeUntil = typeof it.snoozeUntil === 'string' ? it.snoozeUntil : undefined
  const createdAtRaw = typeof it.createdAt === 'string' ? it.createdAt : undefined
  const source: MyDaySource | undefined = isMyDaySource(it.source) ? it.source : undefined

  // se não tiver status → inferir (coerente com done legado)
  const computedStatus: TaskStatus =
    statusRaw ?? (doneLegacy === true ? 'done' : doneLegacy === false ? 'active' : 'active')

  if (statusRaw !== computedStatus) changed = true

  // se não tiver createdAt → now
  const createdAt = createdAtRaw ?? nowISO
  if (!createdAtRaw) changed = true

  // coerência mínima status <-> done
  let done: boolean | undefined = doneLegacy
  if (computedStatus === 'done' && doneLegacy !== true) {
    done = true
    changed = true
  }
  if (computedStatus !== 'done' && doneLegacy === true) {
    done = false
    changed = true
  }

  const item: MyDayTaskItem = {
    id,
    title,
    origin,
    done,
    status: computedStatus,
    snoozeUntil,
    createdAt,
    source,
  }

  return { item, changed }
}

function readRawArrayFromStorage(keys: { raw: string; pref: string }) {
  if (typeof window === 'undefined') return { parsed: null as unknown[] | null, from: null as 'pref' | 'raw' | null }

  // prioridade: prefixado (Planner via persist)
  const prefItem = safeParseJSON<unknown>(window.localStorage.getItem(keys.pref))
  if (Array.isArray(prefItem)) return { parsed: prefItem, from: 'pref' as const }

  // fallback: legado (sem prefixo)
  const rawItem = safeParseJSON<unknown>(window.localStorage.getItem(keys.raw))
  if (Array.isArray(rawItem)) return { parsed: rawItem, from: 'raw' as const }

  return { parsed: null, from: null }
}

function writeDual(keys: { raw: string; pref: string }, value: unknown) {
  if (typeof window === 'undefined') return
  const json = safeStringifyJSON(value)
  try {
    window.localStorage.setItem(keys.pref, json)
  } catch {}
  try {
    window.localStorage.setItem(keys.raw, json)
  } catch {}
}

function readTasksByDateKey(dateKey: string): MyDayTaskItem[] {
  if (typeof window === 'undefined') return []

  const keys = getStorageKeys(dateKey)
  const res = readRawArrayFromStorage(keys)
  if (!res.parsed) return []

  const nowISO = new Date().toISOString()
  let changed = false

  const normalized: MyDayTaskItem[] = []
  for (const raw of res.parsed) {
    const r = normalizeStoredTask(raw, nowISO)
    if (r.item) normalized.push(r.item)
    if (r.changed) changed = true
  }

  // migração silenciosa:
  // - se veio do legado (raw), garante cópia no prefixado
  // - se houve normalização, persiste a versão normalizada
  if (changed || res.from === 'raw') {
    writeDual(keys, normalized)
  }

  return normalized
}

function writeTasksByDateKey(dateKey: string, tasks: MyDayTaskItem[]) {
  if (typeof window === 'undefined') return
  const keys = getStorageKeys(dateKey)
  writeDual(keys, tasks)
}

/** ---------- API pública ---------- */

export function addTaskToMyDay(input: AddToMyDayInput): AddToMyDayResult {
  try {
    const dk = makeDateKey(input.date ?? new Date())
    const tasks = readTasksByDateKey(dk)

    const title = (input.title ?? '').trim()
    const origin = input.origin ?? 'other'
    const source = input.source ?? MY_DAY_SOURCES.UNKNOWN
    if (!title) return { ok: false }

    // anti-duplicação
    const exists = tasks.some((t) => t.title.trim().toLowerCase() === title.toLowerCase() && t.origin === origin)
    if (exists) return { ok: true, created: false, dateKey: dk }

    // guardrail (bola de neve)
    const openCount = countOpenTasks(tasks)
    if (openCount >= OPEN_TASKS_LIMIT_PER_DAY) {
      try {
        track('my_day.task.limit_hit', { dateKey: dk, openCount, limit: OPEN_TASKS_LIMIT_PER_DAY, origin, source })
      } catch {}
      return { ok: true, created: false, dateKey: dk, limitHit: true }
    }

    const id = makeId()
    const nowISO = new Date().toISOString()

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
      limitHit: !!res.limitHit,
    })
  } catch {}
  return res
}

/**
 * Leitura do dia com auto-normalização:
 * - Se estava snoozed e o snoozeUntil chegou/venceu, volta para active.
 * - Persistimos só se houver mudança real.
 */
export function listMyDayTasks(date?: Date): MyDayTaskItem[] {
  const dk = makeDateKey(date ?? new Date())
  const tasks = readTasksByDateKey(dk)

  let changed = false

  const next: MyDayTaskItem[] = tasks.map((t): MyDayTaskItem => {
    const status: TaskStatus = (t.status ?? (t.done ? 'done' : 'active')) as TaskStatus

    // auto-unsnooze quando o dia chegou
    if (status === 'snoozed' && t.snoozeUntil && dk >= t.snoozeUntil) {
      changed = true
      return { ...t, status: 'active', snoozeUntil: undefined, done: false }
    }

    // coerência mínima status <-> done
    if (t.done === true && status !== 'done') {
      changed = true
      return { ...t, status: 'done' }
    }

    if (t.done === false && status === 'done') {
      changed = true
      return { ...t, done: true }
    }

    if (t.status !== status) changed = true
    return { ...t, status }
  })

  if (changed) writeTasksByDateKey(dk, next)
  return next
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

/**
 * P8/P12 — Snooze: empurra a tarefa para frente (não some, só “não agora”).
 * Export obrigatório (MyDayGroups importa isso).
 */
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

/**
 * P8/P12 — Unsnooze: “Voltar para hoje”.
 * Export obrigatório (MyDayGroups importa isso).
 */
export function unsnoozeTask(taskId: string, date?: Date): { ok: boolean } {
  try {
    const dk = makeDateKey(date ?? new Date())
    const tasks = readTasksByDateKey(dk)

    const next: MyDayTaskItem[] = tasks.map((t) => {
      if (t.id !== taskId) return t
      return { ...t, status: 'active', snoozeUntil: undefined, done: false }
    })

    writeTasksByDateKey(dk, next)
    try {
      track('my_day.task.unsnooze', { ok: true })
    } catch {}
    return { ok: true }
  } catch {
    try {
      track('my_day.task.unsnooze', { ok: false })
    } catch {}
    return { ok: false }
  }
}

/**
 * Remove definitivo.
 * Export obrigatório (MyDayGroups importa isso).
 */
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
 * Agrupamento por intenção/origin.
 * - top3 e agenda entram em "Para hoje"
 * - custom cai em "Outros" (lembrete livre)
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
