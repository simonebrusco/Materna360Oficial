'use client'

import { track } from '@/app/lib/telemetry'
import { load, save } from '@/app/lib/persist'
import { addMJPoints } from '@/app/lib/mjPoints.client'
import { markJourneyFamilyDone, markJourneySelfcareDone } from '@/app/lib/journey.client'

/**
 * P7/P8/P12 — Meu Dia Tasks (client-only)
 * Fonte: LocalStorage
 *
 * Compatibilidade:
 * - Padrão novo: persist.ts (prefixo "m360:" aplicado automaticamente)
 * - Legado: chave sem prefixo (localStorage direto)
 *
 * Estratégia segura:
 * - LER: prioridade no prefixado (persist), fallback no legado
 * - ESCREVER: prefixado (persist) + espelha no legado (compat total)
 * - MIGRAR silenciosamente: se achar só no legado, replica no prefixado
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

export type TaskOrigin =
  | 'today'
  | 'top3'
  | 'agenda'
  | 'family'
  | 'selfcare'
  | 'checkin'
  | 'home'
  | 'other'
  | 'custom'

export type TaskItem = {
  id: string
  title: string
  origin: TaskOrigin
  done: boolean
}

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

export type AddToMyDayInput = {
  title: string
  origin: TaskOrigin
  date?: Date
  source?: MyDaySource
}

export type AddToMyDayResult = {
  ok: boolean
  id?: string
  created?: boolean
  dateKey?: string
  limitHit?: boolean
}

type GroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

export type GroupedTasks = Record<
  GroupId,
  { id: GroupId; title: string; items: MyDayTaskItem[] }
>

const OPEN_TASKS_LIMIT_PER_DAY = 18
const MJ_POINTS_FIRST_TASK_OF_DAY = 5

/* ---------- helpers omitidos (inalterados) ---------- */
/* TODO: todo o bloco de helpers permanece exatamente como você enviou */

/* ---------- API pública ---------- */

export function toggleDone(taskId: string, date?: Date): { ok: boolean } {
  try {
    const dk = makeDateKey(date ?? new Date())
    const tasks = readTasksByDateKey(dk)

    const next: MyDayTaskItem[] = tasks.map((t) => {
      if (t.id !== taskId) return t

      const baseStatus = t.status ?? (t.done ? 'done' : 'active')
      const nextStatus: TaskStatus = baseStatus === 'done' ? 'active' : 'done'

      // 🎯 Integração canônica com Jornada (P34.1)
      if (nextStatus === 'done' && baseStatus !== 'done') {
        if (t.origin === 'selfcare') {
          markJourneySelfcareDone('meu-dia')
        } else if (t.origin === 'family') {
          markJourneyFamilyDone('meu-dia')
        }
      }

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

/* ---------- resto do arquivo segue INALTERADO ---------- */
