'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

import { track } from '@/app/lib/telemetry'
import {
  groupTasks,
  listMyDayTasks,
  removeTask,
  snoozeTask,
  toggleDone,
  unsnoozeTask,
  type GroupedTasks,
  type MyDayTaskItem,
} from '@/app/lib/myDayTasks.client'
import type { AiLightContext } from '@/app/lib/ai/buildAiContext'
import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getMyDayContinuityLine } from '@/app/lib/continuity.client'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { isPremium } from '@/app/lib/plan'

/* ---------------------------------- */
/* Tipos e constantes                 */
/* ---------------------------------- */

type GroupId = keyof GroupedTasks

const GROUP_ORDER: GroupId[] = [
  'para-hoje',
  'familia',
  'autocuidado',
  'rotina-casa',
  'outros',
]

const FREE_LIMIT = 5
const PREMIUM_LIMIT = 3

/* ---------------------------------- */
/* Utils locais                       */
/* ---------------------------------- */

function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  if (t.status) return t.status
  if (t.done === true) return 'done'
  return 'active'
}

function timeOf(t: MyDayTaskItem): number {
  const n = t.createdAt ? Date.parse(t.createdAt) : NaN
  return Number.isFinite(n) ? n : 0
}

/**
 * P17 — Micropriorização premium
 * Regra simples e previsível:
 * active > snoozed > done
 * premium prioriza levemente itens mais recentes
 */
function sortForGroup(items: MyDayTaskItem[], premium: boolean) {
  const rank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    if (s === 'active') return 0
    if (s === 'snoozed') return 1
    return 2
  }

  return [...items].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb

    return premium
      ? timeOf(b) - timeOf(a) // premium: mais recente sobe levemente
      : timeOf(a) - timeOf(b) // free: mais antigo primeiro
  })
}

/**
 * P17 — Densidade percebida
 * Nunca inventa tarefas
 */
function resolveVisibleLimit(count: number, premium: boolean) {
  if (!premium) return FREE_LIMIT
  return Math.min(PREMIUM_LIMIT, count)
}

/* ---------------------------------- */
/* Componente                         */
/* ---------------------------------- */

export function MyDayGroups({ aiContext }: { aiContext?: AiLightContext }) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [continuityLine, setContinuityLine] = useState<string | null>(null)

  const premium = useMemo(() => isPremium(), [])
  const dateKey = useMemo(() => getBrazilDateKey(new Date()), [])
  const premiumAdjustmentTrackedRef = React.useRef<string | null>(null)

  /* ---------------------------------- */
  /* Dados derivados                    */
  /* ---------------------------------- */

  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const totalCount = tasks.length

  /* ---------------------------------- */
  /* Carga inicial                      */
  /* ---------------------------------- */

  useEffect(() => {
    setTasks(listMyDayTasks())

    try {
      track('my_day.group.render', {
        dateKey,
        tasksCount: tasks.length,
      })
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------- */
  /* Continuidade (P13/P17)             */
  /* ---------------------------------- */

  useEffect(() => {
    try {
      const tone = (euSignal?.tone ?? 'gentil') as NonNullable<Eu360Signal['tone']>
      const line = getMyDayContinuityLine({
        dateKey,
        tone,
        premium, // agora influencia discretamente
      })
      setContinuityLine(line?.text ?? null)
    } catch {
      setContinuityLine(null)
    }
  }, [dateKey, euSignal?.tone, premium])

  /* ---------------------------------- */
  /* P17 — Telemetria segura (1x/dia)   */
  /* ---------------------------------- */

  const premiumAdjustmentApplied = useMemo(() => {
    if (!premium) return false
    if (!tasks.length) return false

    return GROUP_ORDER.some((groupId) => {
      const items = grouped[groupId]?.items ?? []
      if (!items.length) return false

      const limit = resolveVisibleLimit(items.length, true)
      return !expanded[groupId] && limit < items.length
    })
  }, [premium, tasks, grouped, expanded])

  useEffect(() => {
    if (!premiumAdjustmentApplied) return
    if (premiumAdjustmentTrackedRef.current === dateKey) return

    premiumAdjustmentTrackedRef.current = dateKey

    try {
      track('premium_adjustment_applied', {
        tab: 'meu-dia',
        type: 'density',
        timestamp: new Date().toISOString(),
      })
    } catch {}
  }, [premiumAdjustmentApplied, dateKey])

  /* ---------------------------------- */
  /* Ações                              */
  /* ---------------------------------- */

  function refresh() {
    setTasks(listMyDayTasks())
  }

  function toggleGroup(id: GroupId) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function onDone(taskId: string) {
    const res = toggleDone(taskId)
    if (res.ok) refresh()
  }

  async function onSnooze(taskId: string) {
    const res = snoozeTask(taskId, 1)
    if (res.ok) refresh()
  }

  async function onUnsnooze(taskId: string) {
    const res = unsnoozeTask(taskId)
    if (res.ok) refresh()
  }

  async function onRemove(taskId: string) {
    const res = removeTask(taskId)
    if (res.ok) refresh()
  }

  /* ---------------------------------- */
  /* Render                             */
  /* ---------------------------------- */

  if (!totalCount) {
    return (
      <section className="mt-6 bg-white rounded-3xl p-6 shadow border">
        <h4 className="text-[16px] font-semibold text-[var(--color-text-main)]">
          Tudo certo por aqui.
        </h4>
        <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
          Quando você salvar algo no Maternar, ele aparece aqui automaticamente.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6 space-y-5">
      {continuityLine ? (
        <p className="text-[13px] text-white/85 max-w-2xl">{continuityLine}</p>
      ) : null}

      {GROUP_ORDER.map((groupId) => {
        const group = grouped[groupId]
        if (!group?.items?.length) return null

        const sorted = sortForGroup(group.items, premium)
        const limit = resolveVisibleLimit(sorted.length, premium)
        const isExpanded = !!expanded[groupId]
        const visible = isExpanded ? sorted : sorted.slice(0, limit)
        const hasMore = sorted.length > limit

        return (
          <div
            key={groupId}
            className="bg-white rounded-3xl p-6 shadow border"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-[16px] font-semibold">
                {group.title}
              </h4>
              <span className="text-[12px]">{sorted.length}</span>
            </div>

            <div className="mt-4 space-y-2">
              {visible.map((t) => {
                const s = statusOf(t)

                return (
                  <div
                    key={t.id}
                    className={`flex justify-between gap-3 rounded-2xl border px-4 py-3 ${
                      s === 'done' ? 'opacity-70' : ''
                    }`}
                  >
                    <p
                      className={`text-[14px] ${
                        s === 'done' ? 'line-through' : ''
                      }`}
                    >
                      {t.title}
                    </p>

                    <div className="flex gap-2 text-[12px]">
                      <button onClick={() => onDone(t.id)}>
                        {s === 'done' ? 'Desfazer' : 'Fazer agora'}
                      </button>
                      <button onClick={() => onSnooze(t.id)}>Não é pra hoje</button>
                      <button onClick={() => onRemove(t.id)}>Remover</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {hasMore ? (
              <div className="mt-4 text-right">
                <button
                  onClick={() => toggleGroup(groupId)}
                  className="text-[12px] font-semibold"
                >
                  {isExpanded ? 'Ver menos' : 'Ver mais'}
                </button>
              </div>
            ) : null}
          </div>
        )
      })}
    </section>
  )
}
