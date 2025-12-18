'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'

type Props = {
  open: boolean
  onOpenChange: (b: boolean) => void
  /** opcional: se você quiser abrir já “ancorado” em algum plano */
  selectedPlanId?: 'materna-plus' | 'materna-360'
}

export default function UpgradeSheet({ open, onOpenChange, selectedPlanId }: Props) {
  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onOpenChange])

  React.useEffect(() => {
    if (!open) return
    try {
      track('paywall_sheet_open', {
        source: 'upgrade_sheet',
        selectedPlanId: selectedPlanId ?? null,
      })
    } catch {}
  }, [open, selectedPlanId])

  if (!open) return null

  const title = 'Materna360+ no seu ritmo'
  const subtitle =
    'Se fizer sentido para você agora, destrave uma experiência mais profunda — sem pressão e sem cobrança.'

  const bullets = [
    { icon: 'sparkles', text: 'Ajustes automáticos mais profundos (menos peso nos dias difíceis)' },
    { icon: 'heart', text: 'Histórico emocional expandido e visão mais completa da sua jornada' },
    { icon: 'check', text: 'Insights mais personalizados e orientações com mais contexto' },
    { icon: 'file-text', text: 'Exportar PDF (planner e registros) para guardar ou organizar' },
  ] as const

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* sheet */}
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md">
        <div className="mx-3 mb-3 rounded-3xl border border-[#f5d7e5] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] overflow-hidden">
          {/* header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#6a6a6a]">
                  Materna360+
                </p>
                <h3 className="mt-1 text-[18px] font-semibold text-[#2f3a56] leading-snug">
                  {title}
                </h3>
                <p className="mt-1 text-[13px] text-[#6a6a6a] leading-relaxed">
                  {subtitle}
                </p>
              </div>

              <button
                aria-label="Fechar"
                className="inline-flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-[#ffe1f1] transition-colors"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-[#545454] text-lg leading-none">✕</span>
              </button>
            </div>
          </div>

          {/* body */}
          <div className="px-5 pb-4">
            <div className="rounded-2xl border border-[#f5d7e5] bg-[#fff7fb] px-4 py-4">
              <p className="text-[12px] font-semibold text-[#2f3a56]">
                O que muda quando você destrava o Materna360+
              </p>

              <div className="mt-3 space-y-2.5">
                {bullets.map((b, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <AppIcon
                      name={b.icon as any}
                      size={16}
                      decorative
                      className="mt-0.5 text-[#fd2597] flex-shrink-0"
                    />
                    <p className="text-[12px] text-[#545454] leading-relaxed">
                      {b.text}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[11px] text-[#6a6a6a] leading-relaxed">
                Você pode conhecer os detalhes e escolher com calma. O plano acompanha sua fase — não o contrário.
              </p>
            </div>

            {/* actions */}
            <div className="mt-4 flex gap-2">
              <Link href="/planos" className="flex-1">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    try {
                      track('paywall_sheet_cta', { action: 'go_to_planos', selectedPlanId: selectedPlanId ?? null })
                    } catch {}
                    onOpenChange(false)
                  }}
                >
                  Entender os planos
                </Button>
              </Link>

              <Button
                variant="secondary"
                size="md"
                className="w-[120px]"
                onClick={() => {
                  try {
                    track('paywall_sheet_cta', { action: 'later', selectedPlanId: selectedPlanId ?? null })
                  } catch {}
                  onOpenChange(false)
                }}
              >
                Depois
              </Button>
            </div>
          </div>
        </div>

        {/* safe bottom spacing */}
        <div className="h-2" />
      </div>
    </div>
  )
}
