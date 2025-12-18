'use client'

import * as React from 'react'
import clsx from 'clsx'
import { Button } from '@/components/ui/Button'
import { upgradeToPremium } from '@/app/lib/plan'
import AppIcon from '@/components/ui/AppIcon'

type PlanId = 'materna-plus' | 'materna-360'

type Props = {
  open: boolean
  onOpenChange: (b: boolean) => void

  /**
   * P15 — abre contextualizado (sem pressão).
   * Default mantém compatibilidade com chamadas antigas.
   */
  planId?: PlanId
}

const PLAN_CONTENT: Record<
  PlanId,
  {
    badge: string
    title: string
    subtitle: string
    highlights: string[]
    primaryCta: string
    secondaryCta: string
  }
> = {
  'materna-plus': {
    badge: 'Materna+',
    title: 'Mais apoio, com o seu ritmo',
    subtitle:
      'Um upgrade para trazer mais clareza e personalização no dia a dia — sem te exigir mais.',
    highlights: [
      'Mais personalização no tom e no volume de sugestões',
      'Histórico ampliado para você se situar com calma',
      'Exportar PDF (Planner, Rotina Leve, Como Estou Hoje)',
      'Biblioteca Materna completa e trilhas mais profundas',
    ],
    primaryCta: 'Quero o Materna+',
    secondaryCta: 'Agora não',
  },
  'materna-360': {
    badge: 'Materna+ 360',
    title: 'A experiência completa de acompanhamento',
    subtitle:
      'Para quem quer mais profundidade e consistência — com presença, sem cobrança e sem pressão.',
    highlights: [
      'Orientações ilimitadas (sempre no seu tom)',
      'Resumos por semana e por mês para você se localizar',
      'Rotina 360 com ajustes ao longo da semana',
      'Trilhas personalizadas para sua família',
    ],
    primaryCta: 'Quero o Materna+ 360',
    secondaryCta: 'Vou pensar com calma',
  },
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

  const content = PLAN_CONTENT[planId]

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* sheet */}
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md px-3 pb-3 sm:px-4 sm:pb-4">
        <div
          className={clsx(
            'rounded-3xl bg-white',
            'border border-[#ffd8e6]',
            'shadow-[0_18px_45px_rgba(0,0,0,0.22)]',
            'p-4 sm:p-5'
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Upgrade Materna360"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd8e6] bg-[#ffe1f1]/70 px-3 py-1">
                <AppIcon name="sparkles" size={14} decorative className="text-[#fd2597]" />
                <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#2f3a56]">
                  {content.badge}
                </span>
              </div>

              <h3 className="mt-3 text-base sm:text-lg font-semibold text-[#2f3a56] leading-snug">
                {content.title}
              </h3>

              <p className="mt-1 text-[13px] text-[#6a6a6a] leading-relaxed">
                {content.subtitle}
              </p>
            </div>

            <button
              aria-label="Fechar"
              className="inline-flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-[#ffe1f1] transition-colors text-[#2f3a56]"
              onClick={() => onOpenChange(false)}
            >
              ✕
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[#f5d7e5] bg-[#fff7fb] px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6a6a6a]">
              O que muda na prática
            </p>

            <ul className="mt-2 space-y-2">
              {content.highlights.map((t, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AppIcon
                    name="check"
                    size={16}
                    decorative
                    className="mt-0.5 text-[#fd2597] flex-shrink-0"
                  />
                  <span className="text-[13px] text-[#2f3a56] leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 text-[11px] text-[#6a6a6a] leading-relaxed">
            Você pode testar com calma. Se não fizer sentido agora, tudo bem — o app continua funcionando no Essencial.
          </p>

          <div className="mt-4 flex gap-2">
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() => {
                upgradeToPremium()
                onOpenChange(false)
              }}
            >
              {content.primaryCta}
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {content.secondaryCta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
