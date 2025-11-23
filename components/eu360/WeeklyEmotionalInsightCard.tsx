'use client'

import { useState } from 'react'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { toast } from '@/app/lib/toast'

export function WeeklyEmotionalInsightCard() {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/ai/emocional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'weekly_overview',
          origin: 'eu360',
          humor: null,
          energy: null,
        }),
      })

      if (!res.ok) throw new Error('Erro na IA')

      const data = await res.json()
      const text = data?.weeklyInsight || data?.insight || null

      if (!text) {
        throw new Error('Resposta vazia')
      }

      setInsight(text)
      toast.success('Leitura da semana atualizada!')
    } catch (error) {
      console.error('[Eu360] Weekly emotional insight fallback:', error)

      setInsight(
        'Sua semana não precisa ser perfeita para ser importante. Observe quais dias foram mais leves e quais pesaram um pouco mais. Essa consciência já é um grande ato de cuidado com você mesma. 💗'
      )

      toast.info('Trouxemos uma leitura especial da sua semana ✨')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Reveal delay={150}>
      <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="mb-6">
          <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2 flex items-center gap-2">
            <AppIcon name="sparkles" size={18} className="text-[#ff005e]" decorative />
            Leitura emocional da semana
          </h3>
          <p className="text-sm text-[#545454]">
            Uma visão carinhosa sobre como você tem se sentido nos últimos dias.
          </p>
        </div>

        <div className="space-y-4">
          {!insight && !loading && (
            <p className="text-sm leading-relaxed text-[#545454]">
              Quando você quiser, toque no botão abaixo para receber uma reflexão sobre a sua
              semana, pensada para te acolher e te ajudar a enxergar seus padrões com mais
              gentileza.
            </p>
          )}

          {loading && (
            <p className="text-sm text-[#545454] italic">
              Lendo sua semana com carinho…
            </p>
          )}

          {!loading && insight && (
            <p className="text-sm leading-relaxed text-[#545454]">{insight}</p>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Gerando leitura…' : 'Gerar leitura da semana'}
          </Button>
        </div>
      </SoftCard>
    </Reveal>
  )
}
