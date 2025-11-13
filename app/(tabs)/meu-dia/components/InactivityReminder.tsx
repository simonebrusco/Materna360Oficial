'use client'

import * as React from 'react'
import AppIcon from '@/components/ui/AppIcon'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import SoftCard from '@/components/ui/SoftCard'
import { track } from '@/app/lib/telemetry'
import { useInactivityReminder } from '../hooks/useInactivityReminder'

export function InactivityReminder() {
  const { show, inactivityInfo, dismiss } = useInactivityReminder()

  if (!show || !inactivityInfo) {
    return null
  }

  const handleCtaClick = () => {
    try {
      track('reminder_inactivity_cta_click', {
        page: '/meu-dia',
        daysSinceLastEntry: inactivityInfo.daysSinceLastEntry,
        lastEntryDate: inactivityInfo.lastEntryDate,
      })
    } catch {}

    // Scroll to the mood section
    try {
      const moodSection = document.querySelector('[data-section="mood"]')
      if (moodSection) {
        moodSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch {
      // Silently fail if document is not available
    }
  }

  return (
    <Reveal delay={130}>
      <SoftCard className="mb-4 border-l-4 border-l-[#ff005e]/60 bg-gradient-to-r from-[#fff5f7] to-white/90">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff005e]/10">
              <AppIcon name="bell" size={18} className="text-[#ff005e]" decorative />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#2f3a56] mb-1">
              Faz alguns dias que você não registra como foi seu dia.
            </h3>
            <p className="text-sm text-[#545454] mb-4 leading-relaxed">
              Quer retomar hoje? Pequenos registros constantes ajudam a entender melhor sua rotina e suas emoções.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCtaClick}
                className="flex items-center justify-center gap-1 sm:w-auto"
              >
                <AppIcon name="check-circle" size={16} decorative />
                Registrar meu dia hoje
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={dismiss}
                className="text-[#545454] hover:bg-white/50 border border-[#e0e0e0]"
              >
                Agora não
              </Button>
            </div>
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="flex-shrink-0 text-[#545454] hover:text-[#2f3a56] transition-colors"
            aria-label="Fechar lembrete"
          >
            <AppIcon name="x" size={20} decorative />
          </button>
        </div>
      </SoftCard>
    </Reveal>
  )
}
