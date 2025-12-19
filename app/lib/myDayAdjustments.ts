'use client'

import type { MyDayTaskItem } from '@/app/lib/myDayTasks.client'

// ✅ P23 — camada de experiência (nunca chamar isPremium diretamente aqui)
import { getExperienceTier } from '@/app/lib/experience/experienceTier'

/**
 * Tipos internos
 */
export type TaskStatus = 'active' | 'snoozed' | 'done'

/**
 * Normaliza status da tarefa.
 * Mantém compatibilidade com dados antigos.
 */
function getStatus(task: MyDayTaskItem): TaskStatus {
  if ((task as any).status) return (task as any).status
  if ((task as any).done === true) return 'done'
  return 'active'
}

/**
 * Extrai timestamp seguro para ordenação.
 */
function getTime(task: MyDayTaskItem): number {
  const iso = (task as any).createdAt
  const n = iso ? Date.parse(iso) : NaN
  return Number.isFinite(n) ? n : 0
}

/**
 * Define limite de itens por grupo.
 * Regra simples, previsível e silenciosa.
 */
export function getMyDayListLimit(): number {
  return getExperienceTier() === 'premium' ? 3 : 5
}

/**
 * Aplica micropriorização premium.
 * ⚠️ Não altera conteúdo, apenas ordem.
 *
 * Regras:
 * 1. Active > Snoozed > Done
 * 2. Tarefas mais recentes sobem levemente
 * 3. Premium tem ordenação mais "assertiva"
 */
export function applyMyDayAdjustments(tasks: MyDayTaskItem[]): MyDayTaskItem[] {
  const isPremiumExperience = getExperienceTier() === 'premium'

  if (!isPremiumExperience) {
    // Free: mantém ordem natural (mais antiga primeiro)
    return [...tasks].sort((a, b) => getTime(a) - getTime(b))
  }

  // Premium: ordenação cuidadosa e previsível
  const rank = (t: MyDayTaskItem) => {
    const status = getStatus(t)
    if (status === 'active') return 0
    if (status === 'snoozed') return 1
    return 2 // done
  }

  return [...tasks].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)

    if (ra !== rb) return ra - rb

    // Premium: tarefas mais recentes levemente priorizadas
    return getTime(b) - getTime(a)
  })
}
