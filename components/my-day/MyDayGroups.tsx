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
import { getRecentMyDaySignal } from '@/app/lib/myDayMemory.client' // ✅ P19.2

type GroupId = keyof GroupedTasks
type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
const DEFAULT_LIMIT = 5

// ✅ P9 — sinal pós-salvar vindo do Meu Dia Leve
const LS_RECENT_SAVE = 'my_day_recent_save_v1'
type RecentSaveOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'
type RecentSavePayload = { ts: number; origin: RecentSaveOrigin; source: string }

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

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeRemoveLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function groupIdFromRecentOrigin(origin: RecentSaveOrigin): GroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

/* =========================
   Persona segura
========================= */

function getPersonaId(aiContext?: AiLightContext): PersonaId | undefined {
  const p: any = (aiContext as any)?.persona
  if (p === 'sobrevivencia' || p === 'organizacao' || p === 'conexao' || p === 'equilibrio' || p === 'expansao')
    return p
  if (
    typeof p === 'object' &&
    (p.persona === 'sobrevivencia' ||
      p.persona === 'organizacao' ||
      p.persona === 'conexao' ||
      p.persona === 'equilibrio' ||
      p.persona === 'expansao')
  )
    return p.persona
  return undefined
}

/* =========================
   P18 — Densidade adaptativa
========================= */

function getAdaptivePremiumLimit(persona?: PersonaId) {
  switch (persona) {
    case 'sobrevivencia':
      return { min: 2, max: 3 }
    case 'organizacao':
      return { min: 3, max: 3 }
    case 'conexao':
    case 'equilibrio':
      return { min: 3, max: 4 }
    case 'expansao':
      return { min: 4, max: 4 }
    default:
      return { min: 3, max: 4 }
  }
}

/* =========================
   P18 — Ordenação contextual
========================= */

function sortForGroup(
  items: MyDayTaskItem[],
  opts: { premium: boolean; dateKey: string; persona?: PersonaId },
) {
  const { premium, persona } = opts

  const statusRank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    return s === 'active' ? 0 : s === 'snoozed' ? 1 : 2
  }

  const started = (t: MyDayTaskItem) => {
    const anyT: any = t as any
    return !!(
      anyT.startedAt ||
      anyT.inProgress === true ||
      (typeof anyT.progress === 'number' && anyT.progress > 0)
    )
  }

  return [...items].sort((a, b) => {
    // premium + persona: puxa o que já começou pro topo (menos atrito)
    if (premium && (persona === 'sobrevivencia' || persona === 'organizacao')) {
      const sa = started(a)
      const sb = started(b)
      if (sa !== sb) return sa ? -1 : 1
    }

    const ra = statusRank(a)
    const rb = statusRank(b)
    if (ra !== rb) return ra - rb

    // free: mais antigo primeiro | premium: mais recente primeiro (essencial agora)
    return premium ? timeOf(b) - timeOf(a) : timeOf(a) - timeOf(b)
  })
}

/* =========================
   P18/P20 — Continuidade adaptada
========================= */

function refineContinuityForPremium(dateKey: string, persona?: PersonaId) {
  const variants: Record<PersonaId, string[]> = {
    sobrevivencia: ['Hoje, menos já é suficiente.', 'Um passo já é muito.'],
    organizacao: ['Escolher o essencial clareia o dia.'],
    conexao: ['Pequenas presenças mudam o clima.'],
    equilibrio: ['Seguir no seu ritmo já é constância.'],
    expansao: ['Use essa energia com foco.', 'Avançar com clareza sustenta mais.'],
  }

  const list = (persona && variants[persona]) || variants.equilibrio
  let acc = 0
  for (let i = 0; i < dateKey.length; i++) {
    acc = (acc + dateKey.charCodeAt(i) * (i + 1)) % 10_000
  }
  return list[acc % list.length]
}

/* =========================
   COMPONENTE
========================= */

export function MyDayGroups({ aiContext }: { aiContext?: AiLightContext }) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [continuityLine, setContinuityLine] = useState<string | null>(null)
  const [premium, setPremium] = useState(false)

  // ✅ P21 — pós-salvar sutil (sem UI nova)
  const [recentSaveActive, setRecentSaveActive] = useState(false)
  const [highlightGroup, setHighlightGroup] = useState<GroupId | null>(null)

  const dateKey = useMemo(() => getBrazilDateKey(new Date()), [])
  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const personaId = getPersonaId(aiContext)

  const totalCount = tasks.length
  const hasAny = totalCount > 0

  const recentSignal = useMemo(() => {
    if (!premium) return null
    return getRecentMyDaySignal(dateKey)
  }, [premium, dateKey])

  const effectiveLimit = useMemo(() => {
    const raw = Number(euSignal?.listLimit)
    const resolved = Number.isFinite(raw) ? raw : DEFAULT_LIMIT

    if (!premium) return Math.max(5, Math.min(6, resolved))

    const { min, max } = getAdaptivePremiumLimit(personaId)

    if (recentSignal?.pendingPressure === 'high') {
      return Math.max(min, Math.min(max, resolved - 1))
    }

    return Math.max(min, Math.min(max, resolved))
  }, [euSignal, premium, personaId, recentSignal])

  const copy = useMemo(() => {
    const persona = personaId
    const headerTitle = persona === 'sobrevivencia' ? 'Só o essencial de hoje' : 'Seu dia, do seu jeito'
    const headerSubtitle =
      persona === 'organizacao'
        ? 'Organizado, simples e claro.'
        : 'Aqui você vê o que faz sentido agora — sem precisar procurar.'

    const groupHints: Partial<Record<GroupId, string>> = {
      'para-hoje': 'O que realmente importa agora.',
      familia: 'Cuidado e presença com quem você ama.',
      autocuidado: 'Pequenos gestos que te sustentam.',
      'rotina-casa': 'O básico que mantém a casa rodando.',
      outros: 'O resto sem culpa.',
    }

    return { headerTitle, headerSubtitle, groupHints }
  }, [personaId])

  function refresh() {
    setTasks(listMyDayTasks())
  }

  function toggleGroup(groupId: GroupId) {
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  async function onDone(taskId: string, groupId: GroupId) {
    try {
      toggleDone(taskId)
      refresh()
      track('my_day.task_toggled', { taskId, groupId, dateKey, premium })
    } catch {
      // silencioso
    }
  }

  async function onSnooze(taskId: string, groupId: GroupId) {
    try {
      snoozeTask(taskId)
      refresh()
      track('my_day.task_snoozed', { taskId, groupId, dateKey, premium })
    } catch {
      // silencioso
    }
  }

  async function onUnsnooze(taskId: string, groupId: GroupId) {
    try {
      unsnoozeTask(taskId)
      refresh()
      track('my_day.task_unsnoozed', { taskId, groupId, dateKey, premium })
    } catch {
      // silencioso
    }
  }

  async function onRemove(taskId: string, groupId: GroupId) {
    try {
      removeTask(taskId)
      refresh()
      track('my_day.task_removed', { taskId, groupId, dateKey, premium })
    } catch {
      // silencioso
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    const sync = () => {
      try {
        setPremium(isPremium())
      } catch {
        setPremium(false)
      }
    }
    sync()
    window.addEventListener('m360:plan-updated', sync as EventListener)
    return () => window.removeEventListener('m360:plan-updated', sync as EventListener)
  }, [])

  useEffect(() => {
    setEuSignal(getEu360Signal())
  }, [])

  // ✅ P21 — consume sinal pós-salvar e aplica highlight sutil + auto-expand (TTL)
  useEffect(() => {
    try {
      if (!premium) {
        setRecentSaveActive(false)
        setHighlightGroup(null)
        return
      }

      const raw = safeGetLS(LS_RECENT_SAVE)
      if (!raw) return

      const payload = safeParseJSON<RecentSavePayload>(raw)
      safeRemoveLS(LS_RECENT_SAVE)

      if (!payload || typeof payload.ts !== 'number' || !payload.origin) return

      // TTL do “retorno” (janela curta, para não ressuscitar highlight antigo)
      const ageMs = Date.now() - payload.ts
      if (ageMs < 0 || ageMs > 12_000) return

      const gid = groupIdFromRecentOrigin(payload.origin)

      // abre o grupo e aplica destaque sutil
      setHighlightGroup(gid)
      setExpanded((prev) => ({ ...prev, [gid]: true }))

      setRecentSaveActive(true)
      const t = window.setTimeout(() => {
        setRecentSaveActive(false)
        setHighlightGroup(null)
      }, 2600)

      try {
        track('my_day.recent_save.consumed', {
          origin: payload.origin,
          source: payload.source ?? null,
          ageMs,
        })
      } catch {}

      return () => window.clearTimeout(t)
    } catch {
      // silencioso
    }
  }, [premium])

  // P20 — continuidade: timing/coerência (não competir com o pós-salvar)
  useEffect(() => {
    try {
      const tone = (euSignal?.tone ?? 'gentil') as NonNullable<Eu360Signal['tone']>

      const base = getMyDayContinuityLine({ dateKey, tone })
      if (!base?.text) {
        setContinuityLine(null)
        return
      }

      if (!premium) {
        setContinuityLine(base.text)
        return
      }

      // durante pós-salvar: some (não disputa atenção)
      if (recentSaveActive) {
        setContinuityLine(null)
        return
      }

      // premium: sem inventar / sem frase se vazio
      if (totalCount === 0) {
        setContinuityLine(null)
        return
      }

      // coerência emocional (ex.: dia leve + sem conclusão recente)
      if (recentSignal?.pendingPressure === 'low' && recentSignal?.hadCompletionRecently === false) {
        setContinuityLine(null)
        return
      }

      setContinuityLine(refineContinuityForPremium(dateKey, personaId))
    } catch {
      setContinuityLine(null)
    }
  }, [
    dateKey,
    euSignal?.tone,
    premium,
    personaId,
    totalCount,
    recentSignal?.pendingPressure,
    recentSignal?.hadCompletionRecently,
    recentSaveActive,
  ])

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[18px] md:text-[20px] font-semibold text-white leading-tight">
            {copy.headerTitle}
          </h3>
          <p className="mt-1 text-[12px] md:text-[13px] text-white/85 max-w-2xl">
            {copy.headerSubtitle}
          </p>

          {/* P13/P17.3 — Micro-frase de continuidade (1 por dia, no máximo) */}
          {continuityLine ? (
            <p className="mt-2 text-[12px] md:text-[13px] text-white/80 max-w-2xl">{continuityLine}</p>
          ) : null}
        </div>

        <div className="hidden md:block text-[12px] text-white/85">
          {totalCount > 0 ? (
            <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 backdrop-blur-md">
              {totalCount} {totalCount === 1 ? 'item' : 'itens'}
            </span>
          ) : null}
        </div>
      </div>

      {!hasAny ? (
        <div className="bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)]">
          <h4 className="text-[16px] font-semibold text-[var(--color-text-main)]">Tudo certo por aqui.</h4>
          <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
            Quando você salvar algo no Maternar, ele aparece aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {GROUP_ORDER.map((groupId) => {
            const group = grouped[groupId]
            if (!group) return null

            const sorted = sortForGroup(group.items, { premium, dateKey, persona: personaId })
            const count = sorted.length
            if (count === 0) return null

            const isExpanded = !!expanded[groupId]
            const visible = isExpanded ? sorted : sorted.slice(0, effectiveLimit)
            const hasMore = count > effectiveLimit

            // ✅ P21 — destaque sutil pós-salvar (sem texto/CTA/alerta)
            const shouldHighlight = premium && recentSaveActive && highlightGroup === groupId

            return (
              <div
                key={groupId}
                className={cx(
                  `
                    bg-white
                    rounded-3xl
                    p-6
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                    border
                    border-[var(--color-border-soft)]
                    transition-[box-shadow,background-color]
                    duration-700
                    ease-out
                  `,
                  shouldHighlight ? 'bg-[#fff7fb] shadow-[0_14px_44px_rgba(253,37,151,0.10)]' : null,
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[16px] md:text-[18px] font-semibold text-[var(--color-text-main)]">
                      {group.title}
                    </h4>

                    {copy.groupHints[groupId] ? (
                      <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{copy.groupHints[groupId]}</p>
                    ) : null}

                    <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
                      {count} {count === 1 ? 'tarefa' : 'tarefas'}
                      {hasMore && !isExpanded ? ' • talvez você não precise olhar tudo agora.' : ''}
                    </p>
                  </div>

                  <span
                    className="
                      inline-flex items-center justify-center
                      min-w-[44px]
                      rounded-full
                      border border-[var(--color-border-soft)]
                      px-3 py-1
                      text-[12px]
                      font-semibold
                      text-[var(--color-text-main)]
                      bg-white
                    "
                  >
                    {count}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {visible.map((t) => {
                    const s = statusOf(t)

                    return (
                      <div
                        key={t.id}
                        className={cx(
                          'flex items-start justify-between gap-3 rounded-2xl border px-4 py-3',
                          'border-[var(--color-border-soft)]',
                          s === 'done' && 'opacity-70',
                        )}
                      >
                        <div className="min-w-0">
                          <p
                            className={cx(
                              'text-[14px] text-[var(--color-text-main)] leading-snug break-words',
                              s === 'done' && 'line-through',
                            )}
                          >
                            {t.title}
                          </p>

                          {s === 'snoozed' ? (
                            <div className="mt-2 inline-flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-[var(--color-border-soft)] bg-[#ffe1f1] px-3 py-1 text-[12px] text-[var(--color-text-main)]">
                                não é pra hoje
                              </span>
                              {(t as any).snoozeUntil ? (
                                <span className="text-[12px] text-[var(--color-text-muted)]">
                                  volta em: {(t as any).snoozeUntil}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {s !== 'done' ? (
                            <button
                              onClick={() => onDone(t.id, groupId)}
                              className="rounded-full bg-[#fd2597] text-white shadow-lg px-4 py-2 text-[12px] font-semibold"
                            >
                              Fazer agora
                            </button>
                          ) : (
                            <button
                              onClick={() => onDone(t.id, groupId)}
                              className="rounded-full border border-[var(--color-border-soft)] px-4 py-2 text-[12px] font-semibold text-[var(--color-text-main)]"
                            >
                              Desfazer
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            {s === 'snoozed' ? (
                              <button
                                onClick={() => onUnsnooze(t.id, groupId)}
                                className="text-[12px] font-semibold text-[#b8236b]"
                              >
                                Voltar para hoje
                              </button>
                            ) : (
                              <button
                                onClick={() => onSnooze(t.id, groupId)}
                                className="text-[12px] font-semibold text-[var(--color-text-muted)]"
                              >
                                Não é pra hoje
                              </button>
                            )}

                            <span className="text-[12px] text-[var(--color-text-muted)]">•</span>

                            <button
                              onClick={() => onRemove(t.id, groupId)}
                              className="text-[12px] font-semibold text-[var(--color-text-muted)]"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {hasMore ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      {isExpanded ? 'Você está vendo tudo deste bloco.' : 'Mostrando só o essencial agora.'}
                    </p>

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
