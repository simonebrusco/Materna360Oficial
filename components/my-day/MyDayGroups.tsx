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
import { getRecentMyDaySignal } from '@/app/lib/myDayMemory.client'
import { getExperienceTier } from '@/app/lib/experience/experienceTier'
import { getDensityLevel } from '@/app/lib/experience/density'

type GroupId = keyof GroupedTasks
type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
const DEFAULT_LIMIT = 5

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/* =========================
   Helpers base
========================= */

function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  if ((t as any).status) return (t as any).status
  if ((t as any).done === true) return 'done'
  return 'active'
}

function timeOf(t: MyDayTaskItem): number {
  const iso = (t as any).createdAt
  const n = iso ? Date.parse(iso) : NaN
  return Number.isFinite(n) ? n : 0
}

/* =========================
   Persona segura
========================= */

function getPersonaId(aiContext?: AiLightContext): PersonaId | undefined {
  const p: any = (aiContext as any)?.persona
  if (p === 'sobrevivencia' || p === 'organizacao' || p === 'conexao' || p === 'equilibrio' || p === 'expansao')
    return p
  if (typeof p === 'object' && p?.persona) return p.persona
  return undefined
}

/* =========================
   Ordenação contextual (mantida)
========================= */

function sortForGroup(
  items: MyDayTaskItem[],
  opts: { premium: boolean; persona?: PersonaId },
) {
  const { premium, persona } = opts

  const statusRank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    return s === 'active' ? 0 : s === 'snoozed' ? 1 : 2
  }

  return [...items].sort((a, b) => {
    if (premium && (persona === 'sobrevivencia' || persona === 'organizacao')) {
      const sa = timeOf(a)
      const sb = timeOf(b)
      if (sa !== sb) return sb - sa
    }

    const ra = statusRank(a)
    const rb = statusRank(b)
    if (ra !== rb) return ra - rb

    return premium ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b)
  })
}

/* =========================
   COMPONENTE
========================= */

export function MyDayGroups({ aiContext }: { aiContext?: AiLightContext }) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [continuityLine, setContinuityLine] = useState<string | null>(null)

  const experienceTier = getExperienceTier()
  const densityLevel = getDensityLevel()
  const isPremiumExperience = experienceTier === 'premium'

  const dateKey = useMemo(() => getBrazilDateKey(new Date()), [])
  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const personaId = getPersonaId(aiContext)

  const totalCount = tasks.length
  const hasAny = totalCount > 0

  const recentSignal = useMemo(() => {
    if (!isPremiumExperience) return null
    return getRecentMyDaySignal(dateKey)
  }, [isPremiumExperience, dateKey])

  const effectiveLimit = useMemo(() => {
    const raw = Number(euSignal?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : DEFAULT_LIMIT

    if (densityLevel === 'normal') {
      return Math.max(5, Math.min(6, resolved))
    }

    // density === 'reduced' (premium invisível)
    return Math.max(3, Math.min(4, resolved))
  }, [euSignal, densityLevel])

  function refresh() {
    setTasks(listMyDayTasks())
  }

  function toggleGroup(groupId: GroupId) {
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    setEuSignal(getEu360Signal())
  }, [])

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {!hasAny ? (
        <div className="bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)]">
          <h4 className="text-[16px] font-semibold text-[var(--color-text-main)]">
            Tudo certo por aqui.
          </h4>
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
            Quando você salvar algo no Maternar, ele aparece aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {GROUP_ORDER.map((groupId) => {
            const group = grouped[groupId]
            if (!group) return null

            const sorted = sortForGroup(group.items, {
              premium: isPremiumExperience,
              persona: personaId,
            })

            const count = sorted.length
            if (count === 0) return null

            const isExpanded = !!expanded[groupId]
            const visible = isExpanded ? sorted : sorted.slice(0, effectiveLimit)
            const hasMore = count > effectiveLimit

            return (
              <div
                key={groupId}
                className="bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)]"
              >
                <h4 className="text-[16px] md:text-[18px] font-semibold text-[var(--color-text-main)]">
                  {group.title}
                </h4>

                <div className="mt-4 space-y-2">
                  {visible.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 border-[var(--color-border-soft)]"
                    >
                      <p className="text-[14px] text-[var(--color-text-main)]">
                        {t.title}
                      </p>
                    </div>
                  ))}
                </div>

                {hasMore ? (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => toggleGroup(groupId)}
                      className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-[12px] font-semibold text-[var(--color-text-main)]"
                    >
                      {isExpanded ? 'Recolher' : 'Ver tudo'}
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
