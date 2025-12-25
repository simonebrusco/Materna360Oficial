'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import {
  groupTasks,
  listMyDayTasks,
  type GroupedTasks,
  type MyDayTaskItem,
  removeTask,
  snoozeTask,
  unsnoozeTask,
  MY_DAY_SOURCES,
} from '@/app/lib/myDayTasks.client'
import type { AiLightContext } from '@/app/lib/ai/buildAiContext'
import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getExperienceTier } from '@/app/lib/experience/experienceTier'
import { getDensityLevel } from '@/app/lib/experience/density'
import { track } from '@/app/lib/telemetry'
import { consumeRecentMyDaySave } from '@/app/lib/myDayContinuity.client'

type GroupId = keyof GroupedTasks
type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
const DEFAULT_LIMIT = 5

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

function formatSnoozeUntil(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw : ''
  if (!s) return null

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) {
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const t = Date.parse(s)
  if (!Number.isFinite(t)) return s

  try {
    return new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch {
    return s
  }
}

/* =========================
   Persona segura
========================= */

function getPersonaId(aiContext?: AiLightContext): PersonaId | undefined {
  const p: any = (aiContext as any)?.persona
  if (p === 'sobrevivencia' || p === 'organizacao' || p === 'conexao' || p === 'equilibrio' || p === 'expansao') {
    return p
  }
  if (typeof p === 'object' && p?.persona) return p.persona
  return undefined
}

/* =========================
   Ordenação contextual
========================= */

function sortForGroup(items: MyDayTaskItem[], opts: { premium: boolean; persona?: PersonaId }) {
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
   Continuidade
========================= */

function groupIdFromOrigin(origin: string): GroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

/* =========================
   COMPONENTE
========================= */

export default function MyDayGroups({
  aiContext,
  initialDate,
}: {
  aiContext?: AiLightContext
  initialDate?: Date
}) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [highlightGroup, setHighlightGroup] = useState<GroupId | null>(null)

  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [experienceTier, setExperienceTier] = useState(() => getExperienceTier())
  const [densityLevel, setDensityLevel] = useState(() => getDensityLevel())

  const isPremiumExperience = experienceTier === 'premium'
  const personaId = getPersonaId(aiContext)

  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const hasAny = tasks.length > 0

  const effectiveLimit = useMemo(() => {
    const raw = Number((euSignal as any)?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : DEFAULT_LIMIT

    if (densityLevel === 'normal') {
      return Math.max(5, Math.min(6, resolved))
    }
    return Math.max(3, Math.min(4, resolved))
  }, [euSignal, densityLevel])

  function refresh() {
    setTasks(listMyDayTasks(initialDate))
  }

  function toggleGroup(groupId: GroupId) {
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  /* ---------- bootstrap ---------- */

  useEffect(() => {
    refresh()
    setEuSignal(getEu360Signal())
    setExperienceTier(getExperienceTier())
    setDensityLevel(getDensityLevel())

    const sync = () => {
      setEuSignal(getEu360Signal())
      setExperienceTier(getExperienceTier())
      setDensityLevel(getDensityLevel())
      refresh()
    }

    window.addEventListener('storage', sync)
    window.addEventListener('m360:plan-updated', sync as EventListener)
    window.addEventListener('eu360:persona-updated', sync as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('m360:plan-updated', sync as EventListener)
      window.removeEventListener('eu360:persona-updated', sync as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- continuidade silenciosa ---------- */

  useEffect(() => {
    try {
      const payload = consumeRecentMyDaySave()
      if (!payload) return

      const gid = groupIdFromOrigin(payload.origin)
      setExpanded((prev) => ({ ...prev, [gid]: true }))
      setHighlightGroup(gid)

      window.setTimeout(() => {
        try {
          document.getElementById(`myday-group-${gid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch {}
      }, 60)

      window.setTimeout(() => setHighlightGroup(null), 6500)

      try {
        track('my_day.continuity.applied', { origin: payload.origin, source: payload.source })
      } catch {}
    } catch {}
  }, [])

  /* ---------- ações ---------- */

  async function onDone(t: MyDayTaskItem) {
    const res = removeTask(t.id, initialDate)
    if (res.ok) refresh()
  }

  async function onRemove(t: MyDayTaskItem) {
    const res = removeTask(t.id, initialDate)
    if (res.ok) refresh()
  }

  async function onSnooze(t: MyDayTaskItem) {
    const res = snoozeTask(t.id, 1, initialDate)
    if (res.ok) refresh()
  }

  async function onUnsnooze(t: MyDayTaskItem) {
    const res = unsnoozeTask(t.id, initialDate)
    if (res.ok) refresh()
  }

  /* ---------- render ---------- */

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {!hasAny ? (
        <div className="bg-white rounded-3xl p-6 border">
          <h4 className="text-[16px] font-semibold text-[var(--color-text-main)]">Tudo certo por aqui.</h4>
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
            Quando você registrar algo no Materna360, ele aparece aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {GROUP_ORDER.map((groupId) => {
            const group = grouped[groupId]
            if (!group || group.items.length === 0) return null

            const sorted = sortForGroup(group.items, {
              premium: isPremiumExperience,
              persona: personaId,
            })

            const isExpanded = !!expanded[groupId]
            const visible = isExpanded ? sorted : sorted.slice(0, effectiveLimit)
            const hasMore = sorted.length > effectiveLimit
            const isHighlighted = highlightGroup === groupId

            return (
              <div
                key={groupId}
                id={`myday-group-${groupId}`}
                className={[
                  'bg-white rounded-3xl p-6 border',
                  isHighlighted ? 'ring-2 ring-[#fd2597]/25 border-[#fd2597]/30' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[16px] font-semibold">{group.title}</h4>
                  {hasMore ? (
                    <button
                      onClick={() => toggleGroup(groupId)}
                      className="rounded-full border px-4 py-2 text-[12px]"
                    >
                      {isExpanded ? 'Recolher' : 'Ver tudo'}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2">
                  {visible.map((t) => {
                    const st = statusOf(t)
                    const snoozeLabel = formatSnoozeUntil((t as any).snoozeUntil)

                    return (
                      <div key={t.id} className="rounded-2xl border px-4 py-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="text-[14px]">{t.title}</p>
                            {st === 'snoozed' && snoozeLabel ? (
                              <p className="text-[11px] text-muted">Até {snoozeLabel}</p>
                            ) : null}
                          </div>

                          <div className="flex gap-2">
                            {st === 'active' ? (
                              <>
                                <button onClick={() => onDone(t)} className="text-[12px]">
                                  Concluir
                                </button>
                                <button onClick={() => onSnooze(t)} className="text-[12px]">
                                  Amanhã
                                </button>
                              </>
                            ) : st === 'snoozed' ? (
                              <button onClick={() => onUnsnooze(t)} className="text-[12px]">
                                Trazer
                              </button>
                            ) : null}
                            <button onClick={() => onRemove(t)} className="text-[12px]">
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
