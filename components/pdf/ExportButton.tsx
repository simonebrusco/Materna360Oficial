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

export default function ExportButton({ variant }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Feature flag
  const ffEnabled = isEnabled('FF_PDF_EXPORT')
  if (!ffEnabled) return null

  // Experience (P23): sem paywall visível. Diferença é invisível no conteúdo exportado.
  const tier = useMemo(() => normalizeTier(getExperienceTier() as any), [])
  const isPremiumExperience = tier === 'premium' || tier === 'plus'

  // Data availability
  const moodData = getMoodEntries()
  const hasData = Array.isArray(moodData) && moodData.length > 0

  useEffect(() => {
    try {
      trackTelemetry('pdf.export_view', {
        variant,
        tier,
      })
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant])

  const handleExport = async () => {
    if (isLoading || !hasData) return

    const startTime = performance.now()
    setIsLoading(true)
    setError(null)

    try {
      trackTelemetry('pdf.export_start', { variant, tier })

      let reportData: any
      let filename = `materna360-${variant}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(
        2,
        '0',
      )}${String(new Date().getDate()).padStart(2, '0')}.pdf`

      if (variant === 'wellness') {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const todayTasks = getPlannerItemsWithin(1).filter((t) => t.date === todayStr)

        // P23: premium invisível -> mais profundidade, sem rótulo/explicação
        const coachTipsBase = [
          { title: 'Dar um tempo para si mesma', description: 'Reserve 15 minutos para uma atividade que te relaxa.' },
          { title: 'Conectar com seu filho', description: 'Uma conversa de qualidade fortalece o vinculo.' },
          { title: 'Respiracao consciente', description: 'Pratique 3 respiracoes profundas quando se sentir estressada.' },
        ]

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

        filename = `materna360-wellness-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(
          today.getDate(),
        ).padStart(2, '0')}.pdf`
      } else if (variant === 'insights') {
        const events = readLocalEvents()
        const now = Date.now()

        // P23: free menor janela; premium maior janela (sem falar isso na UI)
        const daysWindow = isPremiumExperience ? 30 : 7
        const cutoff = now - daysWindow * 24 * 60 * 60 * 1000

        const recent = events.filter((e) => e.ts >= cutoff)

        const counters: Record<string, number> = {}
        recent.forEach((e) => {
          counters[e.event] = (counters[e.event] || 0) + 1
        })

        const topLimit = isPremiumExperience ? 10 : 5
        const topActions = Object.entries(counters)
