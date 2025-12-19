'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FileDown } from 'lucide-react'
import { getMoodEntries } from '@/app/lib/moodStore.client'
import { getPlannerItemsWithin } from '@/app/lib/plannerStore.client'
import { readLocalEvents, trackTelemetry } from '@/app/lib/telemetry'
import { isEnabled } from '@/app/lib/flags.client'
import { getExperienceTier } from '@/app/lib/experience/experienceTier'

interface ExportButtonProps {
  variant: 'wellness' | 'insights'
}

type ExperienceTier = 'free' | 'premium' | 'plus' | 'unknown'

function normalizeTier(raw: unknown): ExperienceTier {
  const v = String(raw || '').toLowerCase()
  if (v === 'premium') return 'premium'
  if (v === 'plus') return 'plus'
  if (v === 'free') return 'free'
  return 'unknown'
}

function safeTodayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export default function ExportButton({ variant }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ Estado “hidratado” (evita qualquer risco de mismatch e mantém hooks sempre no topo)
  const [ffEnabled, setFfEnabled] = useState(false)
  const [tier, setTier] = useState<ExperienceTier>('unknown')

  useEffect(() => {
    try {
      setFfEnabled(Boolean(isEnabled('FF_PDF_EXPORT')))
    } catch {
      setFfEnabled(false)
    }

    try {
      setTier(normalizeTier(getExperienceTier() as any))
    } catch {
      setTier('unknown')
    }
  }, [])

  const isPremiumExperience = tier === 'premium' || tier === 'plus'

  // Data availability (client-only — este componente é 'use client')
  const moodData = getMoodEntries()
  const hasData = Array.isArray(moodData) && moodData.length > 0

  useEffect(() => {
    if (!ffEnabled) return
    try {
      trackTelemetry('pdf.export_view', { variant, tier })
    } catch {}
  }, [variant, tier, ffEnabled])

  const buttonText = useMemo(() => {
    return variant === 'wellness' ? 'Exportar Relatorio' : 'Exportar Insights'
  }, [variant])

  const handleExport = async () => {
    if (!ffEnabled) return
    if (isLoading || !hasData) return

    const startTime = performance.now()
    setIsLoading(true)
    setError(null)

    try {
      trackTelemetry('pdf.export_start', { variant, tier })

      const todayKey = safeTodayKey(new Date())

      let reportData: any
      let filename = `materna360-${variant}-${todayKey}.pdf`

      if (variant === 'wellness') {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const todayTasks = getPlannerItemsWithin(1).filter((t) => t.date === todayStr)

        // Free: base útil
        const coachTipsBase = [
          { title: 'Dar um tempo para si mesma', description: 'Reserve 15 minutos para uma atividade que te relaxa.' },
          { title: 'Conectar com seu filho', description: 'Uma conversa de qualidade fortalece o vinculo.' },
          { title: 'Respiracao consciente', description: 'Pratique 3 respiracoes profundas quando se sentir estressada.' },
        ]

        // Premium/Plus: melhor (sem “explicar por quê”)
        const coachTipsPremium = [
          ...coachTipsBase,
          { title: 'Transicao suave', description: 'Antes de mudar de tarefa, respire e escolha um unico proximo passo.' },
          { title: 'Rotina minima', description: 'Defina um minimo do dia para reduzir friccao e ruido mental.' },
        ]

        reportData = {
          moodEntries: getMoodEntries(),
          todayTasks,
          coachTips: isPremiumExperience ? coachTipsPremium : coachTipsBase,
        }

        filename = `materna360-wellness-${todayKey}.pdf`
      } else if (variant === 'insights') {
        const events = readLocalEvents()
        const now = Date.now()

        // Free: 7 dias | Premium/Plus: 30 dias (melhor)
        const daysWindow = isPremiumExperience ? 30 : 7
        const cutoff = now - daysWindow * 24 * 60 * 60 * 1000
        const recent = Array.isArray(events) ? events.filter((e) => (e as any)?.ts >= cutoff) : []

        const counters: Record<string, number> = {}
        for (const e of recent) {
          const key = String((e as any)?.event || 'unknown')
          counters[key] = (counters[key] || 0) + 1
        }

        // Free: top 5 | Premium/Plus: top 10 (melhor)
        const topLimit = isPremiumExperience ? 10 : 5
        const entries = Object.entries(counters).map(([event, count]) => ({ event, count }))
        entries.sort((a, b) => b.count - a.count)
        const topActions = entries.slice(0, topLimit)

        const mood = getMoodEntries()
        const moodSeries = (Array.isArray(mood) ? mood : []).map((m) => Number((m as any)?.mood ?? 0))
        const energySeries = (Array.isArray(mood) ? mood : []).map((m) => Number((m as any)?.energy ?? 0))

        reportData = {
          windowDays: daysWindow,
          counters,
          topActions,
          moodSeries,
          energySeries,
        }

        filename = `materna360-insights-${todayKey}.pdf`
      } else {
        throw new Error(`Unknown variant: ${variant}`)
      }

      const response = await fetch('/api/pdf/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant, data: reportData }),
      })

      if (!response.ok) {
        let msg = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          msg = (errorData as any)?.error || msg
        } catch {}
        throw new Error(msg)
      }

      const blob = await response.blob()
      const bytes = blob.size
      const durationMs = Math.round(performance.now() - startTime)

      trackTelemetry('pdf.export_success', { variant, bytes, durationMs, tier })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      const durationMs = Math.round(performance.now() - startTime)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'

      try {
        trackTelemetry('pdf.export_error', { variant, error: errorMsg, durationMs, tier })
      } catch {}

      setError(errorMsg)
      console.error('PDF export error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Return condicional só depois dos hooks
  if (!ffEnabled) return null

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={isLoading || !hasData}
        aria-label="Export as PDF"
        className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-xs font-medium text-support-1 hover:bg-white/95 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileDown size={16} aria-hidden="true" className={isLoading ? 'animate-pulse' : ''} />
        <span>{isLoading ? 'Exportando...' : buttonText}</span>
      </button>

      {error ? (
        <div className="mt-2 text-xs text-primary rounded-md bg-primary/10 p-2" role="alert">
          Erro ao exportar: {error}
        </div>
      ) : null}

      {!hasData ? (
        <div className="mt-2 text-xs text-support-2 rounded-md bg-support-3/10 p-2" role="note">
          Nenhum dado disponivel para exportar
        </div>
      ) : null}
    </div>
  )
}
