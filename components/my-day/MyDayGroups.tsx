'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  groupTasks,
  listMyDayTasks,
  type GroupedTasks,
  type MyDayTaskItem,
  removeTask,
  snoozeTask,
  unsnoozeTask,
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

// (P28) evita bug de timezone: parse manual para YYYY-MM-DD
function formatSnoozeUntil(raw: unknown): string | null {
  const s = typeof raw === 'string' ? raw : ''
  if (!s) return null

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const dt = new Date(y, mo - 1, d) // local time (seguro p/ BR)
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
    // Premium invisível: organiza por recência para sobrevivência/organização
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
   <section className="mt-6 md:mt-8 space-y-6 md:space-y-7">
      {!hasAny ? (
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.05)] border border-[var(--color-border-soft)]">
          <h4 className="text-[16px] font-semibold text-[var(--color-text-main)]">
            Seu dia pode começar simples.
          </h4>

          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
            Você não precisa organizar tudo agora.
          </p>

          <p className="mt-3 text-[12px] text-[var(--color-text-muted)]">
            Quando quiser, registre uma coisa pequena — ou apenas volte depois. O Materna360 continua aqui.
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
                  'bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)]',
                  isHighlighted ? 'ring-1 ring-[#fd2597]/20 border-[#fd2597]/25 bg-[rgba(253,37,151,0.03)]' : '',
                ].join(' ')}
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <h4 className="text-[16px] md:text-[18px] font-semibold text-[var(--color-text-main)]">
                    {group.title}
                  </h4>

                  {hasMore ? (
                    <button
                      onClick={() => toggleGroup(groupId)}
                      className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[rgba(0,0,0,0.02)] transition"
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
                      <div
                        key={t.id}
                        className="rounded-2xl border px-4 py-3 border-[var(--color-border-soft)]"
                      >
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 items-stretch sm:items-center">
                          <div className="min-w-0">
                            <p className="text-[14px] text-[var(--color-text-main)]">{t.title}</p>

                            {st === 'snoozed' ? (
                              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                                Deixado para depois{snoozeLabel ? ` • até ${snoozeLabel}` : ''}.
                              </p>
                            ) : null}
                          </div>

                          <div className="shrink-0 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-2">
                            {st === 'active' ? (
                              <>
                                <button
                                  onClick={() => onDone(t)}
                                  className="rounded-full bg-[#fd2597] text-white px-3.5 py-2 text-[12px] font-semibold hover:opacity-95 transition"
                                >
                                  Concluir
                                </button>

                                <button
                                  onClick={() => onSnooze(t)}
                                  className="rounded-full border border-[var(--color-border-soft)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[rgba(0,0,0,0.02)] transition"
                                >
                                  Deixar para amanhã
                                </button>

                                <button
                                  onClick={() => onRemove(t)}
                                  className="rounded-full border border-[var(--color-border-soft)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[rgba(0,0,0,0.02)] transition"
                                >
                                  Remover
                                </button>
                              </>
                            ) : st === 'snoozed' ? (
                              <>
                                <button
                                  onClick={() => onUnsnooze(t)}
                                  className="rounded-full bg-[#fd2597] text-white px-3.5 py-2 text-[12px] font-semibold hover:opacity-95 transition"
                                >
                                  Trazer para hoje
                                </button>

                                <button
                                  onClick={() => onRemove(t)}
                                  className="rounded-full border border-[var(--color-border-soft)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[rgba(0,0,0,0.02)] transition"
                                >
                                  Remover
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => onRemove(t)}
                                className="rounded-full border border-[var(--color-border-soft)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[rgba(0,0,0,0.02)] transition"
                              >
                                Remover
                              </button>
                            )}
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
