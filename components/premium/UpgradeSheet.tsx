'use client'

import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { upgradeToPremium } from '@/app/lib/plan'

type PlanId = 'materna-plus' | 'materna-360'

type Props = {
  open: boolean
  onOpenChange: (b: boolean) => void
  planId?: PlanId
}

export default function UpgradeSheet({ open, onOpenChange, planId = 'materna-plus' }: Props) {
  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onOpenChange])

  if (!open) return null

  const is360 = planId === 'materna-360'

  const title = is360 ? 'Desbloquear Materna+ 360' : 'Desbloquear Materna+'
  const subtitle = is360
    ? 'A experiência completa, com leitura emocional mais profunda.'
    : 'Mais ajuste automático, clareza e apoio diário — no seu ritmo.'

  const bullets = is360
    ? [
        'Orientações ilimitadas com leitura emocional detalhada',
        'Relatórios emocionais semanais e mensais',
        'Rotina Inteligente 360 com ajustes ao longo da semana',
      ]
    : [
        'Ajustes automáticos mais profundos no seu dia a dia',
        'Histórico emocional expandido',
        'Insights personalizados com mais contexto',
      ]

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-2xl bg-white shadow-lg p-4 sm:p-5 transition ease-out duration-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#545454]">{title}</h3>
            <p className="text-sm text-[#6A6A6A] mt-1">{subtitle}</p>
          </div>

          <button
            aria-label="Fechar"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl hover:bg-black/5 transition-colors"
            onClick={() => onOpenChange(false)}
          >
            ✕
          </button>
        </div>

        <ul className="text-sm text-[#6A6A6A] mt-3 list-disc pl-5 space-y-1">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              // Nota: hoje o app só tem upgradeToPremium (premium boolean).
              // Mantemos compatível e evitamos quebrar lógica.
              upgradeToPremium()
              onOpenChange(false)
            }}
          >
            Continuar
          </Button>

          <Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>
            Depois
          </Button>
        </div>

        <p className="mt-3 text-[11px] text-[#6A6A6A] leading-relaxed">
          Sem pressão. Você pode mudar de plano quando quiser.
        </p>
      </div>
    </div>
  )
}
