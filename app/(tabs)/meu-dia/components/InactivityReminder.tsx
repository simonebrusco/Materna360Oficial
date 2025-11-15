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

    // Scroll to the mood section (FUSION-SAFE: guarded for iframe context)
    if (typeof document !== 'undefined') {
      try {
        const moodSection = document.querySelector('[data-section="mood"]')
        if (moodSection) {
          moodSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      } catch {
        // Silently fail if querySelector is not available
      }
    }
  }

  return (
    <Reveal delay={130}>
      <div className="mt-6 rounded-3xl bg-white shadow-soft px-6 py-6 md:px-7 md:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
        {/* Icon and text content */}
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
            <AppIcon name="bell" size={18} className="text-primary" decorative />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="m360-subtitle">
              Faz alguns dias que você não registra seu dia
            </h3>
            <p className="m360-label-sm text-gray-600">
              Que tal anotar só um momento bom de hoje? Mesmo que pequeno.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 md:flex-col md:items-end">
          <button
            type="button"
            onClick={handleCtaClick}
            className="inline-flex items-center justify-center rounded-full bg-primary text-white px-4 py-2 m360-label-sm shadow-soft transition-all duration-150 hover:bg-primary/90"
          >
            Registrar meu dia
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="m360-label-sm text-gray-500 underline-offset-2 hover:underline"
          >
            Agora não
          </button>
        </div>
      </div>
    </Reveal>
  )
}
