'use client'

import type { MyDayTaskItem } from '@/app/lib/myDayTasks.client'

/**
 * P19.1 — Memória recente do Meu Dia (client-only)
 *
 * Objetivo:
 * - Ler micro-histórico recente (D-1 a D-3)
 * - Detectar pressão leve de pendências
 * - Nunca gravar nada
 * - Nunca emitir telemetria
 * - Nunca criar estado novo
 *
 * Uso:
 * - Apenas leitura
 * - Apenas para calibrar UX do dia atual
 */

type PendingPressure = 'low' | 'medium' | 'high'

export type MyDayRecentSignal = {
  hadTasksRecently: boolean
  hadCompletionRecently: boolean
  pendingPressure: PendingPressure
}

/** ---------- Helpers internos ---------- */

function isValidDateKey(v: unknown): v is string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

function subtractDays(dateKey: string, days: number): string | null {
  if (!isValidDateKey(dateKey)) return null
  const [y, m, d] = dateKey.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  if (Number.isNaN(base.getTime())) return null
  base.setDate(base.getDate() - Math.max(1, days))
  const yy = base.getFullYear()
  const mm = String(base.getMonth() + 1).padStart(2, '0')
  const dd = String(base.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function readTasksByDateKey(dateKey: string): MyDayTaskItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(`planner/tasks/${dateKey}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as MyDayTaskItem[]) : []
  } catch {
    return []
  }
}

/** ---------- Lógica principal ---------- */

/**
 * Lê os últimos dias (D-1 a D-3) e retorna um sinal humano simples.
 */
export function getRecentMyDaySignal(dateKey: string): MyDayRecentSignal {
  let hadTasksRecently = false
  let hadCompletionRecently = false
  let pendingCount = 0

  // varremos no máximo 3 dias para trás
  for (let i = 1; i <= 3; i++) {
    const dk = subtractDays(dateKey, i)
    if (!dk) continue

    const tasks = readTasksByDateKey(dk)
    if (!Array.isArray(tasks) || tasks.length === 0) continue

    hadTasksRecently = true

    for (const t of tasks) {
      const status = (t.status ?? (t.done ? 'done' : 'active')) as
        | 'active'
        | 'done'
        | 'snoozed'

      if (status === 'done') {
        hadCompletionRecently = true
      }

      if (status === 'active' || status === 'snoozed') {
        pendingCount++
      }
    }

    // se já temos sinal suficiente, não precisamos continuar
    if (pendingCount >= 6) break
  }

  let pendingPressure: PendingPressure = 'low'

  if (pendingCount >= 6) pendingPressure = 'high'
  else if (pendingCount >= 3) pendingPressure = 'medium'

  return {
    hadTasksRecently,
    hadCompletionRecently,
    pendingPressure,
  }
}
