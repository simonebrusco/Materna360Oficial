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
import {
  loadMyDayRecentSave,
  loadMeuDiaLeveLastHandledTs,
  saveMeuDiaLeveLastHandledTs,
} from '@/app/lib/persist'

type GroupId = keyof GroupedTasks
type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
const DEFAULT_LIMIT = 5

/* =========================
   P26 — Continuidade Meu Dia Leve -> Meu Dia
   (agora via persist.ts com migração silenciosa)
========================= */

type MeuDiaLeveRecentSave = {
  ts: number
  origin: 'today' | 'family' | 'selfcare' | 'home' | 'other'
  source: string
}

function isRecentSavePayload(v: unknown): v is MeuDiaLeveRecentSave {
  if (!v || typeof v !== 'object') return false
  const o = v as any
  const okOrigin =
    o.origin === 'today' || o.origin === 'family' || o.origin === 'selfcare' || o.origin === 'home' || o.origin === 'other'
  const okTs = typeof o.ts === 'number' && Number.isFinite(o.ts)
  const okSource = typeof o.source === 'string' && !!o.source.trim()
  return okOrigin && okTs && okSource
}

function groupIdFromOrigin(origin: MeuDiaLeveRecentSave['origin']): GroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
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
    const dt = new Date(t)
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  } catch {
    return s
  }
}

/* =========================
   Persona segura
========================= */

function getPersonaId(aiContext?: AiLightContext): PersonaId | undefined {
  const p: any = (aiContext as any)?.persona
  if (p === 'sobrevivencia' || p === 'organizacao' || p === 'conexao' || p === 'equilibrio' || p === 'expansao') return p
  if (typeof p === 'object' && p?.persona) return p.persona
  return undefined
}

/* =========================
   Ordenação contextual (mantida)
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
   Continuidade (P26)
========================= */

function getReturnLink(t: MyDayTaskItem): { href: string; label: string } | null {
  const s = (t as any).source as string | undefined

  if (s === MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM) {
    return { href: '/maternar/cuidar-de-mim', label: 'Voltar ao cuidado' }
  }
  if (s === MY_DAY_SOURCES.MATERNAR_MEU_FILHO) {
    return { href: '/maternar/meu-filho', label: 'Voltar ao Meu Filho' }
  }
  if (s === MY_DAY_SOURCES.MATERNAR_MEU_DIA_LEVE) {
    return { href: '/maternar/meu-dia-leve', label: 'Voltar ao Meu Dia Leve' }
  }

  return null
}

/* =========================
   Jornada mínima (P26)
========================= */

function dateKeyOfNow(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function markSelfcareDoneForJourney(source: string | undefined) {
  try {
    const dk = dateKeyOfNow()
    window.localStorage.setItem('journey/selfcare/doneOn', dk)

    const raw = window.localStorage.getItem('journey/selfcare/doneCount')
    const n = raw ? Number(raw) : 0
    const next = Number.isFinite(n) ? n + 1 : 1
    window.localStorage.setItem('journey/selfcare/doneCount', String(next))

    if (source) window.localStorage.setItem('journey/selfcare/lastSource', source)
  } catch {}
}

function markFamilyDoneForJourney(source: string | undefined) {
  try {
    const dk = dateKeyOfNow()
    window.localStorage.setItem('journey/family/doneOn', dk)

    const raw = window.localStorage.getItem('journey/family/doneCount')
    const n = raw ? Number(raw) : 0
    const next = Number.isFinite(n) ? n + 1 : 1
    window.localStorage.setItem('journey/family/doneCount', String(next))

    if (source) window.localStorage.setItem('journey/family/lastSource', source)
  } catch {}
}

/* =========================
   COMPONENTE
========================= */

export function MyDayGroups({ aiContext }: { aiContext?: AiLightContext }) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())

  // P28 — experiência (somente decisão interna; atualiza silenciosamente)
  const [experienceTier, setExperienceTier] = useState(() => getExperienceTier())
  const [densityLevel, setDensityLevel] = useState(() => getDensityLevel())
  const isPremiumExperience = experienceTier === 'premium'

  // P26 — destaque de grupo quando veio do Meu Dia Leve
  const [highlightGroup, setHighlightGroup] = useState<GroupId | null>(null)

  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const personaId = getPersonaId(aiContext)

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
    setTasks(listMyDayTasks())
  }

  function toggleGroup(groupId: GroupId) {
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  useEffect(() => {
    refresh()
    setEuSignal(getEu360Signal())
    setExperienceTier(getExperienceTier())
    setDensityLevel(getDensityLevel())

    const sync = () => {
      // silencioso: apenas atualiza decisões internas
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

  /**
   * P26 — “Meu Dia Leve salvou e agora o Meu Dia abre no lugar certo”
   * - quando detecta save recente: expande o grupo-alvo e aplica destaque suave
   * - não mostra conteúdo; só orienta a atenção para a seção correta
   * - de-dupe por ts (last handled)
   */
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return

      const parsed = loadMyDayRecentSave()
      if (!isRecentSavePayload(parsed)) return

      const lastHandled = loadMeuDiaLeveLastHandledTs()
      const isNew = Number.isFinite(parsed.ts) && parsed.ts > (Number.isFinite(lastHandled) ? lastHandled : 0)

      // janela de recência: 30 min
      const ageMs = Date.now() - parsed.ts
      const RECENT_WINDOW_MS = 30 * 60 * 1000
      const isRecent = ageMs >= 0 && ageMs <= RECENT_WINDOW_MS

      if (!isNew || !isRecent) return

      const gid = groupIdFromOrigin(parsed.origin)

      setExpanded((prev) => ({ ...prev, [gid]: true }))
      setHighlightGroup(gid)

      saveMeuDiaLeveLastHandledTs(parsed.ts)

      window.setTimeout(() => {
        try {
          const el = document.getElementById(`myday-group-${gid}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch {}
      }, 50)

      window.setTimeout(() => setHighlightGroup(null), 6500)

      try {
        track('meu_dia_leve.group_focus_applied', {
          origin: parsed.origin,
          groupId: gid,
          ageMs,
          source: parsed.source,
        })
      } catch {}
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * P26 — “Concluir some”
   * Em vez de apenas marcar como done, removemos do dia.
   */
  async function onDone(t: MyDayTaskItem) {
    const res = removeTask(t.id)
    if (res.ok) {
      refresh()

      if (t.origin === 'selfcare') {
        markSelfcareDoneForJourney((t as any).source ?? 'unknown')
        try {
          track('journey.selfcare.done', { source: (t as any).source ?? 'unknown' })
        } catch {}
      }

      if (t.origin === 'family') {
        markFamilyDoneForJourney((t as any).source ?? 'unknown')
        try {
          track('journey.family.done', { source: (t as any).source ?? 'unknown' })
        } catch {}
      }

      try {
        track('my_day.ui.done_remove', { origin: t.origin, source: (t as any).source ?? 'unknown' })
      } catch {}
    } else {
      try {
        track('my_day.ui.done_remove', { ok: false })
      } catch {}
    }
  }

  async function onRemove(t: MyDayTaskItem) {
    const res = removeTask(t.id)
    if (res.ok) {
      refresh()
      try {
        track('my_day.ui.remove', { origin: t.origin, source: (t as any).source ?? 'unknown' })
      } catch {}
    }
  }

  async function onSnooze(t: MyDayTaskItem) {
    const res = snoozeTask(t.id, 1)
    if (res.ok) {
      refresh()
      try {
        track('my_day.ui.snooze', { origin: t.origin, source: (t as any).source ?? 'unknown', days: 1 })
      } catch {}
    }
  }

  async function onUnsnooze(t: MyDayTaskItem) {
    const res = unsnoozeTask(t.id)
    if (res.ok) {
      refresh()
      try {
        track('my_day.ui.unsnooze', { origin: t.origin, source: (t as any).source ?? 'unknown' })
      } catch {}
    }
  }

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {!hasAny ? (
        <div className="bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)]">
          <h4 className="text-[16px] font-semibold text-[var(--color-text-main)]">Tudo certo por aqui.</h4>

          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
            Quando você registrar algo no Materna360 — no Maternar ou no Meu Dia — ele aparece aqui automaticamente.
          </p>

          <p className="mt-3 text-[12px] text-[var(--color-text-muted)]">
            Se fizer sentido, comece pequeno. Um lembrete simples já ajuda.
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

            // Alertas gentis (P26) — sem bloquear
            const isSelfcareGroup = groupId === 'autocuidado'
            const selfcareTooMany = isSelfcareGroup && count >= Math.max(6, effectiveLimit + 2)

            const isFamilyGroup = groupId === 'familia'
            const familyTooMany = isFamilyGroup && count >= 4

            const isHighlighted = highlightGroup === groupId

            return (
              <div
                key={groupId}
                id={`myday-group-${groupId}`}
                className={[
                  'bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)]',
                  isHighlighted ? 'ring-2 ring-[#fd2597]/25 border-[#fd2597]/30 bg-[rgba(253,37,151,0.04)]' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-[16px] md:text-[18px] font-semibold text-[var(--color-text-main)]">{group.title}</h4>

                  {hasMore ? (
                    <button
                      onClick={() => toggleGroup(groupId)}
                      className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[rgba(0,0,0,0.02)] transition"
                    >
                      {isExpanded ? 'Recolher' : 'Ver tudo'}
                    </button>
                  ) : null}
                </div>

                {familyTooMany ? (
                  <div className="mt-3 rounded-2xl border border-[var(--color-border-soft)] bg-[rgba(0,0,0,0.02)] px-4 py-3">
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      Dica do Materna: escolha uma ação por vez — presença vale mais que quantidade.
                    </p>
                  </div>
                ) : null}

                {selfcareTooMany ? (
                  <div className="mt-3 rounded-2xl border border-[var(--color-border-soft)] bg-[rgba(0,0,0,0.02)] px-4 py-3">
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      Dica do Materna: autocuidado funciona melhor com pouco. Escolha 1 tarefa e deixe o resto para outro dia.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  {visible.map((t) => {
                    const st = statusOf(t)
                    const returnLink = getReturnLink(t)
                    const snoozeLabel = formatSnoozeUntil((t as any).snoozeUntil)

                    return (
                      <div key={t.id} className="rounded-2xl border px-4 py-3 border-[var(--color-border-soft)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[14px] text-[var(--color-text-main)]">{t.title}</p>

                            {st === 'snoozed' ? (
                              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                                Deixado para depois{snoozeLabel ? ` • até ${snoozeLabel}` : ''}.
                              </p>
                            ) : null}
                          </div>

                          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
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

                        {returnLink ? (
                          <div className="mt-3">
                            <Link
                              href={returnLink.href}
                              className="inline-flex rounded-full border border-[var(--color-border-soft)] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-text-main)] hover:bg-[rgba(0,0,0,0.02)] transition"
                            >
                              {returnLink.label}
                            </Link>
                          </div>
                        ) : null}
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
