'use client'

'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { toast } from '@/app/lib/toast'
import {
  plannerApi,
  plannerStorage,
  type PlannerItem,
  USE_API_PLANNER,
} from '@/lib/plannerData'

import type { OrganizationTip } from '@/app/lib/organizationTips'

const STORAGE_KEY = 'organization_tips_state_v1'
const TOTAL_DURATION_MS = 15 * 60 * 1000
const PLANNER_LIMIT = 20

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

type TipState = {
  checklist: boolean[]
  timerStatus: TimerStatus
  remainingMs: number
  targetTimestamp?: number
}

type StoredState = Record<string, TipState>

type OrganizationTipsClientProps = {
  tips: OrganizationTip[]
}

const clampRemaining = (value: number) => {
  if (Number.isNaN(value)) {
    return TOTAL_DURATION_MS
  }
  return Math.min(TOTAL_DURATION_MS, Math.max(0, value))
}

const createDefaultState = (tip?: OrganizationTip): TipState => ({
  checklist: tip ? tip.checklist.map(() => false) : [false, false, false],
  timerStatus: 'idle',
  remainingMs: TOTAL_DURATION_MS,
  targetTimestamp: undefined,
})

const sanitizeTipState = (
  tip: OrganizationTip | undefined,
  raw: unknown,
  now: number
): TipState => {
  const fallback = createDefaultState(tip)
  if (!raw || typeof raw !== 'object') {
    return fallback
  }

  const input = raw as Partial<TipState>
  const desiredLength = tip?.checklist.length ?? (Array.isArray(input.checklist) ? input.checklist.length : 3)

  const checklist: boolean[] = Array.isArray(input.checklist)
    ? input.checklist.slice(0, desiredLength).map((entry) => Boolean(entry))
    : []
  while (checklist.length < desiredLength) {
    checklist.push(false)
  }

  let timerStatus: TimerStatus = input.timerStatus ?? 'idle'
  if (!['idle', 'running', 'paused', 'completed'].includes(timerStatus)) {
    timerStatus = 'idle'
  }

  const rawRemaining = typeof input.remainingMs === 'number' ? input.remainingMs : TOTAL_DURATION_MS
  let remainingMs = clampRemaining(rawRemaining)
  let targetTimestamp = typeof input.targetTimestamp === 'number' ? input.targetTimestamp : undefined

  if (timerStatus === 'running') {
    if (typeof targetTimestamp === 'number') {
      const diff = targetTimestamp - now
      if (diff <= 0) {
        timerStatus = 'completed'
        remainingMs = 0
        targetTimestamp = undefined
      } else {
        remainingMs = clampRemaining(diff)
      }
    } else {
      timerStatus = 'idle'
      remainingMs = TOTAL_DURATION_MS
    }
  }

  if (timerStatus === 'completed') {
    remainingMs = 0
    targetTimestamp = undefined
  }

  if (timerStatus === 'idle' && remainingMs !== TOTAL_DURATION_MS) {
    remainingMs = TOTAL_DURATION_MS
  }

  return {
    checklist,
    timerStatus,
    remainingMs,
    targetTimestamp,
  }
}

const readStoredState = (): StoredState => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as StoredState
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (error) {
    console.error('Falha ao ler estado das dicas de organização:', error)
  }

  return {}
}

const persistState = (state: StoredState) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Falha ao persistir estado das dicas de organização:', error)
  }
}

const formatRemaining = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.round(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const getTodayKey = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function OrganizationTipsClient({ tips }: OrganizationTipsClientProps) {
  const [states, setStates] = useState<StoredState>(() => {
    const stored = readStoredState()
    const now = Date.now()
    const sanitized: StoredState = {}

    Object.entries(stored).forEach(([id, value]) => {
      sanitized[id] = sanitizeTipState(undefined, value, now)
    })

    tips.forEach((tip) => {
      sanitized[tip.id] = sanitizeTipState(tip, stored[tip.id], now)
    })

    return sanitized
  })

  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    persistState(states)
  }, [states])

  const hasRunningTimer = useMemo(
    () => tips.some((tip) => states[tip.id]?.timerStatus === 'running'),
    [states, tips]
  )

  useEffect(() => {
    if (!hasRunningTimer) {
      return
    }

    const interval = window.setInterval(() => {
      setStates((previous) => {
        let mutated = false
        const next: StoredState = { ...previous }
        const now = Date.now()

        tips.forEach((tip) => {
          const current = next[tip.id]
          if (!current || current.timerStatus !== 'running' || typeof current.targetTimestamp !== 'number') {
            return
          }

          const diff = current.targetTimestamp - now
          if (diff <= 0) {
            next[tip.id] = {
              ...current,
              timerStatus: 'completed',
              remainingMs: 0,
              targetTimestamp: undefined,
            }
            mutated = true
          } else {
            const remaining = clampRemaining(diff)
            if (Math.abs(remaining - current.remainingMs) >= 1000) {
              next[tip.id] = {
                ...current,
                remainingMs: remaining,
              }
              mutated = true
            }
          }
        })

        return mutated ? next : previous
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [hasRunningTimer, tips])

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((entry) => entry !== id)
      }
      return [...prev, id]
    })
  }

  const updateTipState = (tip: OrganizationTip, updater: (state: TipState) => TipState) => {
    setStates((previous) => {
      const current = previous[tip.id] ?? createDefaultState(tip)
      const nextState = updater(current)
      if (nextState === current) {
        return previous
      }
      return {
        ...previous,
        [tip.id]: nextState,
      }
    })
  }

  const handleToggleChecklist = (tip: OrganizationTip, index: number) => {
    updateTipState(tip, (current) => {
      const checklist = current.checklist.map((entry, idx) => (idx === index ? !entry : entry))
      return {
        ...current,
        checklist,
      }
    })
  }

  const startTimer = (tip: OrganizationTip) => {
    updateTipState(tip, (current) => {
      const now = Date.now()
      const shouldRestart = current.timerStatus === 'completed' || current.timerStatus === 'idle'
      const remaining = current.timerStatus === 'paused' && current.remainingMs > 0 && !shouldRestart
        ? clampRemaining(current.remainingMs)
        : TOTAL_DURATION_MS

      return {
        ...current,
        timerStatus: 'running',
        remainingMs: remaining,
        targetTimestamp: now + remaining,
      }
    })
  }

  const pauseTimer = (tip: OrganizationTip) => {
    updateTipState(tip, (current) => {
      if (current.timerStatus !== 'running') {
        return current
      }

      const now = Date.now()
      const remaining = current.targetTimestamp ? clampRemaining(current.targetTimestamp - now) : current.remainingMs

      return {
        ...current,
        timerStatus: remaining <= 0 ? 'completed' : 'paused',
        remainingMs: remaining <= 0 ? 0 : remaining,
        targetTimestamp: undefined,
      }
    })
  }

  const resetTimer = (tip: OrganizationTip) => {
    updateTipState(tip, (current) => ({
      ...current,
      timerStatus: 'idle',
      remainingMs: TOTAL_DURATION_MS,
      targetTimestamp: undefined,
    }))
  }

  const handleAddToPlanner = (tip: OrganizationTip) => {
    try {
      const dateKey = getTodayKey()
      const nowIso = new Date().toISOString()
      const summary = tip.checklist.map((task, index) => `${index + 1}. ${task}`).join(' • ')

      const item: PlannerItem = {
        id: createId(),
        type: 'Recomendação',
        title: `Organização: ${tip.title}`,
        done: false,
        durationMin: 15,
        notes: `${tip.description}\nChecklist: ${summary}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      }

      const currentData = plannerStorage.getPlannerData?.() ?? {}
      const existing = Array.isArray(currentData[dateKey]) ? currentData[dateKey] : []
      const nextItems = [item, ...existing].slice(0, PLANNER_LIMIT)
      const nextData = {
        ...currentData,
        [dateKey]: nextItems,
      }

      plannerStorage.savePlannerData?.(nextData)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('planner:item-added', {
            detail: { dateKey, item },
          })
        )
      }

      if (USE_API_PLANNER) {
        void plannerApi.savePlannerItem(dateKey, item)
      }

      toast({ title: 'Tudo certo! Dica guardada no seu Planner.', kind: 'success' })
    } catch (error) {
      console.error('Falha ao adicionar dica ao Planner:', error)
      toast({ title: 'Algo não funcionou como esperado. Tente novamente.', kind: 'danger' })
    }
  }

  return (
    <div className="space-y-4">
      {tips.map((tip, tipIndex) => {
        const state = states[tip.id] ?? createDefaultState(tip)
        const isExpanded = expandedIds.includes(tip.id)
        const allDone = state.checklist.length > 0 && state.checklist.every(Boolean)
        const formattedTime = formatRemaining(state.remainingMs)
        const timerStatus = state.timerStatus

        const startLabel = timerStatus === 'paused' ? 'Retomar 15min' : 'Iniciar 15min'

        return (
          <Card
            key={tip.id}
            className="CardElevate section-card overflow-hidden bg-gradient-to-br from-white via-white to-secondary/30"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span aria-hidden className="text-3xl flex-shrink-0">
                  {tip.icon}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-support-1">{tip.title}</h3>
                  <p className="mt-1 text-sm text-support-2">{tip.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isExpanded ? 'primary' : 'secondary'}
                  onClick={() => toggleExpanded(tip.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`organization-tip-${tip.id}-tasks`}
                  className="flex items-center gap-1.5"
                >
                  <span aria-hidden>✓</span> Checklist
                </Button>

                {timerStatus === 'running' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => pauseTimer(tip)}
                    aria-label={`Pausar timer da dica ${tip.title}`}
                  >
                    Pausar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => startTimer(tip)}
                    aria-label={`Iniciar timer de 15 minutos da dica ${tip.title}`}
                  >
                    {startLabel}
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => resetTimer(tip)}
                  disabled={timerStatus === 'idle' && state.remainingMs === TOTAL_DURATION_MS}
                  aria-label={`Reiniciar timer da dica ${tip.title}`}
                >
                  Reiniciar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddToPlanner(tip)}
                  aria-label={`Adicionar a dica ${tip.title} ao Planner`}
                >
                  ＋ Adicionar ao Planner
                </Button>
              </div>

              <div className="mt-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-soft">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Tempo de foco</p>
                    <p className="font-mono text-2xl text-support-1">{formattedTime}</p>
                  </div>
                  {timerStatus === 'completed' ? (
                    <p className="text-sm font-medium text-primary"><span aria-hidden>⏰</span> Tempo concluído! Pequenas pausas fazem grande diferença.</p>
                  ) : (
                    <p className="text-xs text-support-2">Reserve um momento só seu. Pausas curtas trazem fôlego para o dia.</p>
                  )}
                </div>
              </div>

              <div
                id={`organization-tip-${tip.id}-tasks`}
                className={`transition-all duration-300 ${isExpanded ? 'max-h-[480px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
              >
                {isExpanded && (
                  <div className="mt-4 space-y-3">
                    <ul className="space-y-2">
                      {tip.checklist.map((task, taskIndex) => {
                        const inputId = `organization-tip-${tip.id}-task-${taskIndex}`
                        const checked = Boolean(state.checklist?.[taskIndex])
                        return (
                          <li key={inputId}>
                            <label
                              htmlFor={inputId}
                              className="flex cursor-pointer items-center gap-3 rounded-full bg-white/70 px-4 py-3 text-sm text-support-2 shadow-inner transition-colors hover:bg-white"
                            >
                              <input
                                id={inputId}
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleChecklist(tip, taskIndex)}
                                className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                aria-label={`Marcar passo ${taskIndex + 1} da dica ${tip.title}`}
                              />
                              <span className={checked ? 'text-support-1 line-through' : 'text-support-2'}>{task}</span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>

                    {allDone && (
                      <p className="text-sm font-semibold text-primary"><span aria-hidden>✨</span> Você fez o seu melhor hoje!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}

      <p className="text-center text-sm font-medium text-support-2/80">
        Você não precisa fazer tudo. Só o que cabe hoje.
      </p>

    </div>
  )
}
