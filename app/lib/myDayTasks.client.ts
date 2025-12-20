'use client'

import { track } from '@/app/lib/telemetry'

/**
 * P7/P8/P12 — Meu Dia Tasks (client-only)
 * Fonte única: LocalStorage (key: planner/tasks/YYYY-MM-DD)
 *
 * Compatibilidade:
 * - WeeklyPlannerCore (Planner) usa TaskItem com { done: boolean }
 * - Meu Dia usa MyDayTaskItem com status/snooze etc.
 *
 * Estratégia:
 * - Persistimos tudo na mesma storageKey planner/tasks/YYYY-MM-DD
 * - Normalizamos no read (migração silenciosa)
 * - Mantemos coerência mínima status <-> done para não quebrar o Planner
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
  done?: boolean
  status?: TaskStatus
  snoozeUntil?: string
  createdAt?: string
  source?: MyDaySource
}

/** Entrada padrão para salvar no Meu Dia */
export type AddToMyDayInput = {
  title: string
  origin: TaskOrigin
  date?: Date
  source?: MyDaySource
}

/** Resultado compatível com o que os Clients precisam */
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

/* ---------- Helpers ---------- */

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

/* ---------- Normalização e API pública ---------- */
/* (restante do arquivo permanece exatamente igual ao que você enviou) */

