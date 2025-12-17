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

type GroupId = keyof GroupedTasks

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']
const DEFAULT_LIMIT = 5

// P9 — sinal de “acabou de salvar” (vem do Maternar/Meu Dia Leve)
const LS_RECENT_SAVE = 'my_day_recent_save_v1'
type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'
type RecentSavePayload = { ts: number; origin: TaskOrigin; source: string }

function safeDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

function statusOf(t: MyDayTaskItem): 'active' | 'snoozed' | 'done' {
  if (t.status) return t.status
  if (t.done === true) return 'done'
  return 'active'
}

function timeOf(t: MyDayTaskItem): number {
  const iso = t.createdAt
  const n = iso ? Date.parse(iso) : NaN
  return Number.isFinite(n) ? n : 0
}

function sortForGroup(items: MyDayTaskItem[]) {
  const rank = (t: MyDayTaskItem) => {
    const s = statusOf(t)
    return s === 'active' ? 0 : s === 'snoozed' ? 1 : 2
  }

  return [...items].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return timeOf(a) - timeOf(b) // mais antigo primeiro
  })
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function groupIdFromOrigin(origin: TaskOrigin): GroupId {
  if (origin === 'today') return 'para-hoje'
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  return 'outros'
}

/**
 * Normaliza persona de um AiLightContext sem “quebrar” tipagem caso o shape evolua.
 * Aceita tanto `persona` como string quanto objeto (ex.: { persona: '...', label: '...' }).
 */
function getPersonaId(aiContext?: AiLightContext): string | undefined {
  const p: any = (aiContext as any)?.persona
  if (!p) return undefined
  if (typeof p === 'string') return p
  if (typeof p === 'object' && typeof p.persona === 'string') return p.persona
  return undefined
}

function microcopyForPersona(persona?: string) {
  // Defaults (neutro)
  const base = {
    headerTitle: 'Seu dia, em blocos mais leves',
    headerSubtitle: 'O Materna360 organiza para você. Você só escolhe o próximo passo.',
    bannerTitle: 'Hoje pode ser menos. O essencial já está aqui.',
    bannerBody: 'Eu coloquei no bloco certo para você não precisar procurar.',
    groupHints: {
      'para-hoje': 'Se der, escolha só uma coisa.',
      familia: 'Um pequeno gesto já conta.',
      autocuidado: 'Cuidar de você pode ser simples.',
      'rotina-casa': 'Nem tudo precisa ser feito hoje.',
      outros: 'Talvez isso possa esperar.',
    } as Partial<Record<GroupId, string>>,
  }

  // Ajustes sutis por fase (sem “cara de IA”)
  if (persona === 'sobrevivencia') {
    return {
      ...base,
      headerSubtitle: 'Hoje é sobre passar pelo dia com menos peso. Um passo já ajuda.',
      bannerTitle: 'Sem pressa. Um passo de cada vez.',
      bannerBody: 'Eu deixei isso no lugar certo. Você não precisa resolver tudo agora.',
      groupHints: {
        ...base.groupHints,
        'para-hoje': 'Só uma coisa. O resto pode esperar.',
        autocuidado: 'O mínimo já é cuidado.',
        'rotina-casa': 'Hoje, o suficiente já é muito.',
      },
    }
  }

  if (persona === 'organizacao') {
    return {
      ...base,
      headerSubtitle: 'Vamos tirar ruído: olhar o essencial primeiro já organiza a cabeça.',
      bannerBody: 'Eu já organizei por blocos para você decidir com mais clareza.',
      groupHints: {
        ...base.groupHints,
        'para-hoje': 'Comece pelo que destrava o dia.',
        'rotina-casa': 'Um ponto da casa por vez.',
      },
    }
  }

  if (persona === 'conexao') {
    return {
      ...base,
      headerSubtitle: 'Leveza com presença: pequenas escolhas mudam o clima da rotina.',
      groupHints: {
        ...base.groupHints,
        familia: 'Pequeno e intencional vale muito.',
        autocuidado: 'Um respiro curto já muda o tom.',
      },
    }
  }

  if (persona === 'equilibrio') {
    return {
      ...base,
      headerSubtitle: 'Você está encontrando ritmo. Vamos manter constância gentil.',
      bannerTitle: 'Bom. Agora é seguir no seu ritmo.',
      groupHints: {
        ...base.groupHints,
        'para-hoje': 'Prioridade clara, execução leve.',
      },
    }
  }

  if (persona === 'expansao') {
    return {
      ...base,
      headerSubtitle: 'Você tem energia para avançar. Vamos canalizar isso com clareza.',
      bannerTitle: 'Boa. Vamos usar essa energia com foco.',
      bannerBody: 'Eu coloquei no bloco certo para você agir sem dispersar.',
      groupHints: {
        ...base.groupHints,
        'para-hoje': 'Acerte uma coisa importante agora.',
        outros: 'Se for relevante, traga para hoje.',
      },
    }
  }

  return base
}

export function MyDayGroups({ aiContext }: { aiContext?: AiLightContext }) {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // P9 UI state
  const [recentBanner, setRecentBanner] = useState(false)
  const [highlightGroup, setHighlightGroup] = useState<GroupId | null>(null)

  // P12 — sinal reativo (tone + listLimit)
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())

  // P13 — linha de continuidade (no máximo 1x/dia)
  const [continuityLine, setContinuityLine] = useState<string | null>(null)

  const dateKey = useMemo(() => safeDateKey(new Date()), [])
  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const totalCount = useMemo(() => tasks.length, [tasks])

  const personaId = useMemo(() => getPersonaId(aiContext), [aiContext])
  const copy = useMemo(() => microcopyForPersona(personaId), [personaId])

  const listLimit = useMemo(() => {
    const n = Number(euSignal?.listLimit)
    const resolved = Number.isFinite(n) ? n : DEFAULT_LIMIT
    return Math.max(1, resolved || DEFAULT_LIMIT)
  }, [euSignal])

  function refresh() {
    setTasks(listMyDayTasks())
  }

  // P12 — atualiza signal quando persona mudar (mesma aba via event custom; outra aba via storage)
  useEffect(() => {
    const refreshSignal = () => {
      try {
        setEuSignal(getEu360Signal())
      } catch {
        // nunca quebra render
      }
    }

    const onStorage = (_e: StorageEvent) => {
      refreshSignal()
    }

    const onCustom = () => {
      refreshSignal()
    }

    try {
      window.addEventListener('storage', onStorage)
      window.addEventListener('eu360:persona-updated', onCustom as EventListener)
    } catch {}

    return () => {
      try {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('eu360:persona-updated', onCustom as EventListener)
      } catch {}
    }
  }, [])

  // carregar tarefas + telemetria de render
  useEffect(() => {
    refresh()

    try {
      const current = listMyDayTasks()
      const g = groupTasks(current)
      const groupsCount = GROUP_ORDER.filter((id) => (g[id]?.items?.length ?? 0) > 0).length
      track('my_day.group.render', { dateKey, groupsCount, tasksCount: current.length, persona: personaId ?? null })
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // P13 — calcular a frase de continuidade (1x/dia, nunca no primeiro uso)
  useEffect(() => {
    try {
      const tone = (euSignal?.tone ?? 'gentil') as NonNullable<Eu360Signal['tone']>
      const line = getMyDayContinuityLine({ dateKey, tone })
      setContinuityLine(line?.text ?? null)
    } catch {
      setContinuityLine(null)
    }
  }, [dateKey, euSignal])

  // P9 — detectar “acabou de salvar” e abrir/destacar o bloco certo
  useEffect(() => {
    const raw = safeGetLS(LS_RECENT_SAVE)
    const payload = safeParseJSON<RecentSavePayload>(raw)
    if (!payload?.ts || !payload.origin) return

    const ageMs = Date.now() - payload.ts
    if (ageMs > 2 * 60_000) {
      safeRemoveLS(LS_RECENT_SAVE)
      return
    }

    const gid = groupIdFromOrigin(payload.origin)

    setRecentBanner(true)
    setHighlightGroup(gid)
    setExpanded((prev) => ({ ...prev, [gid]: true }))

    safeRemoveLS(LS_RECENT_SAVE)

    const t1 = window.setTimeout(() => setRecentBanner(false), 6500)
    const t2 = window.setTimeout(() => setHighlightGroup(null), 6500)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  function toggleGroup(id: GroupId) {
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        track('my_day.group.expand', { dateKey, groupId: id, persona: personaId ?? null })
      } catch {}
      return next
    })
  }

  async function onDone(taskId: string, groupId: GroupId) {
    const res = toggleDone(taskId)
    if (res.ok) {
      try {
        track('my_day.task.done.toggle', { dateKey, groupId, persona: personaId ?? null })
      } catch {}
      refresh()
    }
  }

  async function onSnooze(taskId: string, groupId: GroupId) {
    const res = snoozeTask(taskId, 1)
    if (res.ok) {
      try {
        track('my_day.task.snooze', { dateKey, groupId, days: 1, persona: personaId ?? null })
      } catch {}
      refresh()
    }
  }

  async function onUnsnooze(taskId: string, groupId: GroupId) {
    const res = unsnoozeTask(taskId)
    if (res.ok) {
      try {
        track('my_day.task.snooze', { dateKey, groupId, days: 0, persona: personaId ?? null })
      } catch {}
      refresh()
    }
  }

  async function onRemove(taskId: string, groupId: GroupId) {
    const res = removeTask(taskId)
    if (res.ok) {
      try {
        track('my_day.task.remove', { dateKey, groupId, persona: personaId ?? null })
      } catch {}
      refresh()
    }
  }

  const hasAny = totalCount > 0

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[18px] md:text-[20px] font-semibold text-white leading-tight">{copy.headerTitle}</h3>
          <p className="mt-1 text-[12px] md:text-[13px] text-white/85 max-w-2xl">{copy.headerSubtitle}</p>

          {/* P13 — Micro-frase de continuidade (1 por dia, no máximo) */}
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

      {/* Banner pós-salvar (adaptativo por persona) */}
      {recentBanner ? (
        <div className="rounded-3xl border border-white/35 bg-white/12 backdrop-blur-md px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <p className="text-[13px] md:text-[14px] font-semibold text-white">{copy.bannerTitle}</p>
          <p className="mt-1 text-[12px] text-white/85">{copy.bannerBody}</p>
        </div>
      ) : null}

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
            const sorted = sortForGroup(group.items)
            const count = sorted.length
            if (count === 0) return null

            const isExpanded = !!expanded[groupId]
            const visible = isExpanded ? sorted : sorted.slice(0, listLimit)
            const hasMore = count > listLimit
            const isHighlighted = highlightGroup === groupId

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
                    transition
                  `,
                  isHighlighted && 'ring-2 ring-[#fd2597] shadow-[0_16px_40px_rgba(253,37,151,0.18)]',
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
                              {t.snoozeUntil ? (
                                <span className="text-[12px] text-[var(--color-text-muted)]">
                                  volta em: {t.snoozeUntil}
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
                      {isExpanded ? 'Ver menos' : 'Ver mais'}
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
