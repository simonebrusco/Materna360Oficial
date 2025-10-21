'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Toast } from '@/components/ui/Toast'
import {
  getInitialDailyActivity,
  getTodayDateKey,
  resolveDailyActivity,
} from '@/lib/dailyActivity'
import { plannerApi, plannerStorage, type PlannerItem, USE_API_PLANNER } from '@/lib/plannerData'

type ActivityState = ReturnType<typeof getInitialDailyActivity>

type ToastState = {
  message: string
  type: 'success' | 'error'
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 11)
}

export function ActivityOfDay() {
  const [activityState, setActivityState] = useState<ActivityState>(() => getInitialDailyActivity())
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const { activity } = activityState
  const cardTitle = activity.emoji ? `${activity.emoji} ${activity.title}` : activity.title
  const hasDuration = activity.durationMin !== undefined && activity.durationMin !== null
  const hasAgeBand = Boolean(activity.ageBand)
  const ageChipLabel = hasAgeBand ? activity.ageBand : 'Todas as idades'

  useEffect(() => {
    let active = true

    const loadActivity = async () => {
      try {
        const result = await resolveDailyActivity()

        if (!active) {
          return
        }

        setActivityState(result)
      } catch (error) {
        console.error('Falha ao carregar atividade do dia:', error)
      }
    }

    void loadActivity()

    return () => {
      active = false
    }
  }, [])

  const handleToggleDetails = useCallback(() => {
    setIsExpanded((previous) => !previous)
  }, [])

  const handleSaveToPlanner = useCallback(async () => {
    if (isSaving) {
      return
    }

    setIsSaving(true)

    const dateKey = activityState.dateKey || getTodayDateKey()
    const nowIso = new Date().toISOString()

    const newItem: PlannerItem = {
      id: createId(),
      type: 'Brincadeira',
      title: activity.title,
      done: false,
      durationMin: activity.durationMin,
      ageBand: activity.ageBand,
      notes: '',
      refId: activity.refId,
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    try {
      if (USE_API_PLANNER) {
        await plannerApi.savePlannerItem(dateKey, newItem)
      } else {
        const currentData = plannerStorage.getPlannerData()
        const currentItems = currentData[dateKey] ?? []
        plannerStorage.savePlannerData({
          ...currentData,
          [dateKey]: [...currentItems, newItem],
        })
      }

      setToast({ message: 'Atividade adicionada ao Planner de hoje.', type: 'success' })
    } catch (error) {
      console.error('Falha ao salvar atividade no Planner:', error)
      setToast({ message: 'Não foi possível salvar agora. Tente novamente.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }, [activity, activityState.dateKey, isSaving])

  const detailButtonLabel = isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/12 via-white/95 to-white p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">
              Atividade do Dia
            </span>
            <p className="mt-4 text-2xl font-bold text-support-1 md:text-3xl">{cardTitle}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-support-2 md:text-sm">
              {hasAgeBand && (
                <span className="inline-flex items-center gap-1">👧 {activity.ageBand}</span>
              )}
              {hasDuration && (
                <span className="inline-flex items-center gap-1">⏱️ {activity.durationMin} min</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            type="button"
            onClick={handleToggleDetails}
            aria-expanded={isExpanded}
          >
            {detailButtonLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            type="button"
            onClick={handleSaveToPlanner}
            disabled={isSaving}
          >
            Salvar no Planner
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-5 rounded-2xl border border-white/60 bg-white/80 p-5 text-sm text-support-1 shadow-soft">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Título</h4>
                <p className="mt-1 font-semibold text-support-1">{cardTitle}</p>
              </div>
              {hasDuration && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Duração</h4>
                  <p className="mt-1 text-support-2">{activity.durationMin} minutos</p>
                </div>
              )}
              {activity.materials && activity.materials.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Materiais</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-support-2">
                    {activity.materials.map((material) => (
                      <li key={material}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}
              {activity.steps && activity.steps.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Passo a passo</h4>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-support-2">
                    {activity.steps.map((step, index) => (
                      <li key={`${activity.id}-step-${index}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {hasAgeBand && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-support-2/80">Faixa etária</h4>
                  <p className="mt-1 text-support-2">{activity.ageBand}</p>
                </div>
              )}
              {activity.refId && (
                <div>
                  <Link
                    href={`/descobrir/${activity.refId}`}
                    className="text-sm font-semibold text-primary transition hover:underline"
                  >
                    Ver página completa
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
