'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'

import { resolveAgeRange, type Child, type Profile, type AgeRange } from '@/app/lib/ageRange'
import type { ChildActivity } from '@/app/data/childContent'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { toast } from '@/app/lib/toast'
import {
  recommendationStorage,
  RECOMMENDATIONS_UPDATED_EVENT,
  type PlannerRecommendation,
} from '@/lib/plannerData'

const ALL_CHILDREN_ID = '__all__'

const FALLBACK_ACTIVITY: ChildActivity = {
  id: 'contato-afetuoso',
  title: 'Momento de contato afetuoso',
  durationMin: 10,
  ageRange: '0-1',
  materials: ['Cobertor macio', 'Música calma'],
  steps: [
    'Reserve um espaço tranquilo e silencioso.',
    'Segure a criança no colo e cante suavemente.',
    'Respirem juntos por alguns instantes em silêncio.',
  ],
}


type ActivityOfDayProps = {
  dateKey: string
  profile: Profile
  activities: ChildActivity[]
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 11)
}

const formatAgeRangeLabel = (range?: AgeRange | null) => {
  if (!range) {
    return 'Todas as idades'
  }

  if (range === '8+') {
    return '8 anos ou mais'
  }

  return `${range} anos`
}

const computeDeterministicIndex = (seed: string, length: number) => {
  if (length <= 0) {
    return 0
  }

  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0
  }

  return Math.abs(hash) % length
}

const sanitizeChildList = (profile: Profile | undefined): Child[] => {
  if (!profile?.children || profile.children.length === 0) {
    return []
  }

  const seen = new Set<string>()
  const result: Child[] = []

  for (const rawChild of profile.children) {
    if (!rawChild || typeof rawChild.id !== 'string') {
      continue
    }

    const trimmedId = rawChild.id.trim()
    if (!trimmedId || seen.has(trimmedId)) {
      continue
    }

    seen.add(trimmedId)

    const trimmedName = rawChild.name?.trim()
    const gender = rawChild.gender === 'm' || rawChild.gender === 'f' ? rawChild.gender : undefined
    const birthdate = rawChild.birthdateISO ? rawChild.birthdateISO.trim() : undefined

    const computedRange = resolveAgeRange({
      id: trimmedId,
      name: trimmedName,
      gender,
      ageRange: rawChild.ageRange ?? null,
      birthdateISO: birthdate ?? null,
    })

    result.push({
      id: trimmedId,
      name: trimmedName && trimmedName.length > 0 ? trimmedName : undefined,
      gender,
      ageRange: computedRange,
      birthdateISO: birthdate,
    })
  }

  return result
}

export function ActivityOfDay({ dateKey, profile, activities }: ActivityOfDayProps) {
  const children = useMemo(() => sanitizeChildList(profile), [profile])
  const isMultiChild = children.length > 1

  const [selectedChildId, setSelectedChildId] = useState<string>(() =>
    isMultiChild ? ALL_CHILDREN_ID : children[0]?.id ?? ''
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    if (children.length === 0) {
      setSelectedChildId('')
      return
    }

    if (children.length === 1) {
      setSelectedChildId(children[0].id)
      return
    }

    setSelectedChildId((previous) => {
      if (!previous) {
        return ALL_CHILDREN_ID
      }

      if (previous === ALL_CHILDREN_ID || children.some((child) => child.id === previous)) {
        return previous
      }

      return ALL_CHILDREN_ID
    })
  }, [children])

  useEffect(() => {
    setIsExpanded(false)
  }, [selectedChildId, dateKey])

  const activityBuckets = useMemo(() => {
    const map = new Map<AgeRange, ChildActivity[]>()

    for (const activity of activities) {
      const list = map.get(activity.ageRange) ?? []
      list.push(activity)
      map.set(activity.ageRange, list)
    }

    return map
  }, [activities])

  const selectActivity = useCallback(
    (range: AgeRange | null, seed: string): ChildActivity => {
      const rangePool = range ? activityBuckets.get(range) ?? [] : []
      const pool = rangePool.length > 0 ? rangePool : activities

      if (pool.length === 0) {
        return FALLBACK_ACTIVITY
      }

      const index = computeDeterministicIndex(seed, pool.length)
      return pool[index]
    },
    [activities, activityBuckets]
  )

  const isAllMode = isMultiChild && selectedChildId === ALL_CHILDREN_ID

  const activeChild = useMemo(() => {
    if (children.length === 0) {
      return null
    }

    if (!isMultiChild) {
      return children[0]
    }

    if (isAllMode) {
      return null
    }

    return children.find((child) => child.id === selectedChildId) ?? children[0]
  }, [children, isAllMode, isMultiChild, selectedChildId])

  const singleActivity = useMemo(() => {
    if (!activeChild) {
      return selectActivity(null, dateKey)
    }

    const range = activeChild.ageRange ?? resolveAgeRange(activeChild)
    return selectActivity(range, `${dateKey}:${activeChild.id}`)
  }, [activeChild, dateKey, selectActivity])

  const groupedActivities = useMemo(() => {
    if (!isAllMode) {
      return []
    }

    return children.map((child) => {
      const range = child.ageRange ?? resolveAgeRange(child)
      const activity = selectActivity(range, `${dateKey}:${child.id}`)
      return { child, activity }
    })
  }, [children, dateKey, isAllMode, selectActivity])

  const badgeLabel = useMemo(() => {
    if (isAllMode) {
      return 'Atividade do Dia'
    }

    if (!activeChild?.name) {
      return 'Atividade do Dia'
    }

    if (activeChild.gender === 'm') {
      return `Atividade do Dia com o ${activeChild.name}`
    }

    if (activeChild.gender === 'f') {
      return `Atividade do Dia com a ${activeChild.name}`
    }

    return `Atividade do Dia com ${activeChild.name}`
  }, [activeChild, isAllMode])

  const headlineActivity = isAllMode ? FALLBACK_ACTIVITY : singleActivity ?? FALLBACK_ACTIVITY
  const headlineTitle = useMemo(() => {
    if (isAllMode) {
      return 'Atividades personalizadas para hoje'
    }

    return headlineActivity.title
  }, [headlineActivity, isAllMode])

  const ageLabel = useMemo(() => {
    if (isAllMode) {
      return 'Personalizado por criança'
    }

    return formatAgeRangeLabel(headlineActivity.ageRange)
  }, [headlineActivity.ageRange, isAllMode])

  const hasDuration = !isAllMode && headlineActivity.durationMin !== undefined && headlineActivity.durationMin !== null

  const handleToggleDetails = useCallback(() => {
    setIsExpanded((previous) => !previous)
  }, [])

  const handleSelectChild = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedChildId(event.target.value)
  }, [])

  const handleSaveActivity = useCallback(
    async (activity: ChildActivity, key: string) => {
      if (savingKey) {
        return
      }

      setSavingKey(key)

      const recommendation: PlannerRecommendation = {
        id: createId(),
        type: 'Recomendação',
        title: activity.title,
        durationMin: activity.durationMin ?? null,
        ageBand: null,
        refId: activity.refId ?? null,
        link: activity.link ?? null,
        source: 'daily-activity',
        createdAt: new Date().toISOString(),
      }

      try {
        recommendationStorage.upsert(dateKey, recommendation)

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(RECOMMENDATIONS_UPDATED_EVENT, {
              detail: { dateKey },
            })
          )
        }

        toast.success('Tudo certo! Atividade adicionada às suas Recomendações.')
      } catch (error) {
        console.error('Falha ao salvar atividade no Planner:', error)
        toast.danger('Algo não funcionou como esperado. Tente novamente.')
      } finally {
        setSavingKey((current) => (current === key ? null : current))
      }
    },
    [dateKey, savingKey]
  )

  const detailButtonLabel = isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'

  return (
    <>
      <Card data-testid="activity-of-day" className="bg-gradient-to-br from-primary/12 via-white/95 to-white p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="eyebrow-capsule">
              {badgeLabel}
            </span>
            <p className="mt-2 text-[16px] font-bold leading-[1.28] text-support-1 line-clamp-2 lg:text-[18px]">
              {headlineTitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-support-2 md:text-sm">
              <span className="inline-flex items-center gap-1">
                <AppIcon name="calendar" size={12} aria-hidden />
                {' '}{ageLabel}
              </span>
              {!isAllMode && hasDuration && (
                <span className="inline-flex items-center gap-1">
                  <AppIcon name="time" size={12} aria-hidden />
                  {' '}{headlineActivity.durationMin} min
                </span>
              )}
            </div>
          </div>

          {children.length > 1 && (
            <div className="w-full sm:w-auto">
              <label htmlFor="activity-child-selector" className="sr-only">
                Selecionar criança
              </label>
              <select
                id="activity-child-selector"
                value={selectedChildId}
                onChange={handleSelectChild}
                className="w-full rounded-full border border-white/60 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-support-1 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
              >
                <option value={ALL_CHILDREN_ID}>Todos</option>
                {children.map((child, index) => (
                  <option key={child.id} value={child.id}>
                    {child.name ?? `Filho ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isAllMode ? (
          <div className="mt-6 space-y-3">
            {groupedActivities.map(({ child, activity }, index) => {
              const childLabel = child.name ?? `Filho ${index + 1}`
              const saveKey = `${child.id}-${activity.id}`
              const childAgeLabel = formatAgeRangeLabel(child.ageRange ?? resolveAgeRange(child))
              const activityTitle = activity.title

              return (
                <div key={child.id} className="rounded-2xl border border-white/60 bg-white/75 p-4 shadow-soft">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-support-1">{activityTitle}</p>
                      <p className="text-xs text-support-2">
                        {childLabel} · {childAgeLabel}
                      </p>
                      {activity.durationMin ? (
                        <p className="mt-1 text-xs text-support-2 inline-flex items-center gap-1">
                          <AppIcon name="time" size={12} aria-hidden />
                          {activity.durationMin} min
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleSaveActivity(activity, saveKey)}
                      disabled={Boolean(savingKey)}
                      className="text-sm font-medium text-primary underline hover:opacity-70 disabled:opacity-50 sm:w-auto"
                    >
                      {savingKey === saveKey ? 'Salvando…' : 'Salvar no Planner'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                type="button"
                onClick={() => void handleSaveActivity(headlineActivity, headlineActivity.id)}
                disabled={Boolean(savingKey)}
              >
                {savingKey ? 'Salvando…' : 'Salvar no Planner'}
              </Button>
              <button
                type="button"
                onClick={handleToggleDetails}
                disabled={Boolean(savingKey)}
                className="text-sm font-medium text-primary hover:opacity-70 disabled:opacity-50"
                aria-expanded={isExpanded}
              >
                {detailButtonLabel}
              </button>
            </div>

            {isExpanded && (
              <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-5 text-sm text-support-1 shadow-soft">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Título</h4>
                    <p className="mt-1 font-semibold text-support-1">{headlineActivity.title}</p>
                  </div>
                  {headlineActivity.durationMin !== undefined && headlineActivity.durationMin !== null && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Duração</h4>
                      <p className="mt-1 text-support-2">{headlineActivity.durationMin} minutos</p>
                    </div>
                  )}
                  {headlineActivity.materials && headlineActivity.materials.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Materiais</h4>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-support-2">
                        {headlineActivity.materials.map((material) => (
                          <li key={material}>{material}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {headlineActivity.steps && headlineActivity.steps.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Passo a passo</h4>
                      <ol className="mt-1 list-decimal space-y-1 pl-5 text-support-2">
                        {headlineActivity.steps.map((step, index) => (
                          <li key={`${headlineActivity.id}-step-${index}`}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {headlineActivity.ageRange && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Faixa etária</h4>
                      <p className="mt-1 text-support-2">{formatAgeRangeLabel(headlineActivity.ageRange)}</p>
                    </div>
                  )}
                  {headlineActivity.refId && (
                    <div>
                      <Link
                        href={`/descobrir/${headlineActivity.refId}`}
                        className="text-sm font-semibold text-primary transition hover:underline"
                      >
                        Ver página completa
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Card>

    </>
  )
}
