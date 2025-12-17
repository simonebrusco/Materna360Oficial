'use client'

import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  getEu360Signal,
  getRecentMyDaySave,
  clearRecentMyDaySave,
  groupIdFromOrigin,
  type GroupId,
} from '@/app/lib/eu360Signals.client'

const GROUP_ORDER: GroupId[] = ['para-hoje', 'familia', 'autocuidado', 'rotina-casa', 'outros']

// P9.2 — Trilhas leves (micro-orientação sem cobrança)
const GROUP_HINTS: Partial<Record<GroupId, string>> = {
  'para-hoje': 'Se der, escolha só uma coisa.',
  familia: 'Um pequeno gesto já conta.',
  autocuidado: 'Cuidar de você pode ser simples.',
  'rotina-casa': 'Nem tudo precisa ser feito hoje.',
  outros: 'Talvez isso possa esperar.',
}

function safeDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

export function MyDayGroups() {
  const [tasks, setTasks] = useState<MyDayTaskItem[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [focusGroup, setFocusGroup] = useState<GroupId | null>(null)
  const [showSavedBanner, setShowSavedBanner] = useState(false)

  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const dateKey = useMemo(() => safeDateKey(new Date()), [])
  const signal = useMemo(() => getEu360Signal(), [])

  const grouped = useMemo(() => groupTasks(tasks), [tasks])
  const totalCount = useMemo(() => tasks.length, [tasks])

  function refresh() {
    setTasks(listMyDayTasks())
  }

  // carregar tarefas + telemetria de render
  useEffect(() => {
    refresh()

    try {
      const current = listMyDayTasks()
      const g = groupTasks(current)
      const groupsCount = GROUP_ORDER.filter((id) => (g[id]?.items?.length ?? 0) > 0).length
      track('my_day.group.render', { dateKey, groupsCount, tasksCount: current.length })
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // se veio de “Salvar no Meu Dia” (ex.: Meu Dia Leve), abrir o bloco certo e mostrar frase
  useEffect(() => {
    const recent = getRecentMyDaySave()
    if (!recent) return

    const gid = groupIdFromOrigin(recent.origin)
    setFocusGroup(gid)
    setExpanded((prev) => ({ ...prev, [gid]: true }))
    setShowSavedBanner(true)

    // rolar até o bloco (depois do paint)
    window.setTimeout(() => {
      const el = groupRefs.current[gid]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)

    // limpa o “sinal” para não ficar repetindo em todo refresh
    clearRecentMyDaySave()
  }, [])

  function toggleGroup(id: GroupId) {
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        track('my_day.group.expand', { dateKey, groupId: id })
      } catch {}
      return next
    })
  }

  async function onDone(taskId: string, groupId: GroupId) {
    const res = toggleDone(taskId)
    if (res.ok) {
      try {
        track('my_day.task.done.toggle', { dateKey, groupId })
      } catch {}
      refresh()
    }
  }

  async function onSnooze(taskId: string, groupId: GroupId) {
    const res = snoozeTask(taskId, 1)
    if (res.ok) {
      try {
        track('my_day.task.snooze', { dateKey, groupId, days: 1 })
      } catch {}
      refresh()
    }
  }

  async function onUnsnooze(taskId: string, groupId: GroupId) {
    const res = unsnoozeTask(taskId)
    if (res.ok) {
      try {
        track('my_day.task.snooze', { dateKey, groupId, days: 0 })
      } catch {}
      refresh()
    }
  }

  async function onRemove(taskId: string, groupId: GroupId) {
    const res = removeTask(taskId)
    if (res.ok) {
      try {
        track('my_day.task.remove', { dateKey, groupId })
      } catch {}
      refresh()
    }
  }

  const hasAny = totalCount > 0
  const LIMIT = Math.max(3, Math.min(7, signal.listLimit)) // guarda-rail

  return (
    <section className="mt-6 md:mt-8 space-y-4 md:space-y-5">
      {/* Banner de chegada (com contraste bom) */}
      {showSavedBanner && signal.showLessLine ? (
        <div className="rounded-3xl border border-white/35 bg-white/14 backdrop-blur-md px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-white leading-snug">
                Hoje pode ser menos. O essencial já está aqui.
              </p>
              <p className="mt-1 text-[11px] text-white/85">
                Eu já organizei o que você salvou — escolha só o próximo passo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSavedBanner(false)}
              className="shrink-0 rounded-full bg-white/90 hover:bg-white text-[#2f3a56] px-3 py-1.5 text-[12px] font-semibold transition"
              aria-label="Fechar mensagem"
            >
              Ok
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-[18px] md:text-[20px] font-semibold text-white leading-tight">
            Seu dia, em blocos mais leves
          </h3>
          <p className="mt-1 text-[12px] md:text-[13px] text-white/85 max-w-2xl">
            O Materna360 organiza para você. Você só escolhe o próximo passo.
          </p>
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
            const sorted = sortForGroup(group.items)
            const count = sorted.length
            if (count === 0) return null

            const isExpanded = !!expanded[groupId]
            const visible = isExpanded ? sorted : sorted.slice(0, LIMIT)
            const hasMore = count > LIMIT

            const isFocused = focusGroup === groupId

            return (
              <div
                key={groupId}
                ref={(el) => {
                  groupRefs.current[groupId] = el
                }}
                data-group={groupId}
                className={cx(
                  'bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[var(--color-border-soft)]',
                  isFocused && 'ring-2 ring-[#ffd8e6]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[16px] md:text-[18px] font-semibold text-[var(--color-text-main)]">
                      {group.title}
                    </h4>

                    {GROUP_HINTS[groupId] ? (
                      <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{GROUP_HINTS[groupId]}</p>
                    ) : null}

                    <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
                      {count} {count === 1 ? 'tarefa' : 'tarefas'}
                      {hasMore && !isExpanded ? ' • mostrando só o essencial agora.' : ''}
                    </p>
                  </div>

                  <span className="inline-flex items-center justify-center min-w-[44px] rounded-full border border-[var(--color-border-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--color-text-main)] bg-white">
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
                          s === 'done' && 'opacity-70'
                        )}
                      >
                        <div className="min-w-0">
                          <p
                            className={cx(
                              'text-[14px] text-[var(--color-text-main)] leading-snug break-words',
                              s === 'done' && 'line-through'
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
