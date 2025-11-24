'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import type { CoachMessage } from '@/app/lib/coachMaterno.v3'
import AppIcon from '@/components/ui/AppIcon'
import Link from 'next/link'

type Props = {
  resolve: () => CoachMessage
  onView?: (patternKey: string) => void
  onCTAClick?: (ctaId: string, patternKey: string) => void
}

export default function CoachCardV3({ resolve, onView, onCTAClick }: Props) {
  const [message, setMessage] = useState<CoachMessage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const msg = resolve()
      setMessage(msg)
      try {
        onView?.(msg.patternKey)
      } catch {}
      // Fire telemetry for coach shown
      try {
        track('coach_v3_shown', {
          page: '/eu360',
          patternKey: msg.patternKey,
        })
      } catch {}
    } catch (err) {
      console.error('CoachCardV3: Error resolving message', err)
      setError('Unable to load coach message')
    }
  }, [resolve, onView])

  if (error) {
    return (
      <Card className="rounded-2xl bg-white/90 p-5">
        <div className="h-5 w-24 bg-red-200 rounded mb-4" />
        <div className="h-6 w-2/3 bg-red-100 rounded mb-2 text-xs text-red-600">Error loading coach</div>
      </Card>
    )
  }

  if (!message) {
    return (
      <Card className="rounded-2xl bg-white/90 p-5">
        <div className="h-5 w-24 bg-black/10 rounded mb-4 animate-pulse" />
        <div className="h-6 w-2/3 bg-black/10 rounded mb-2 animate-pulse" />
        <div className="h-4 w-1/2 bg-black/10 rounded animate-pulse" />
      </Card>
    )
  }

  const handleCTAClick = (ctaId: string) => {
    try {
      onCTAClick?.(ctaId, message.patternKey)
    } catch {}
    try {
      track('coach_v3_cta_click', {
        page: '/eu360',
        patternKey: message.patternKey,
        ctaId,
      })
    } catch {}
  }

  return (
    <Reveal>
      <Card className="rounded-2xl bg-white/90 p-5">
        <div className="mb-3">
          <Badge>Coach Materno v0.3</Badge>
        </div>

        <h3 className="m360-card-title">{message.title}</h3>

        <p className="m360-body mt-3 text-[#545454] leading-relaxed">{message.body}</p>

        {message.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ffd8e6]/40 text-[#ff005e] text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <Link
            href="/meu-dia"
            onClick={() => handleCTAClick('register_today')}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#ff005e] text-white px-4 py-2 text-sm font-semibold hover:bg-[#ff0050] transition-colors"
          >
            <AppIcon name="plus" size={16} decorative />
            Registrar meu dia
          </Link>

          {message.patternKey === 'trend_up' && (
            <Link
              href="/meu-dia"
              onClick={() => handleCTAClick('continue_momentum')}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/60 bg-white/90 text-[#545454] px-4 py-2 text-sm font-semibold hover:bg-[#ff005e]/5 transition-colors"
            >
              <AppIcon name="arrow-up" size={16} decorative />
              Manter o ritmo
            </Link>
          )}

          {message.patternKey === 'low_energy_week' && (
            <button
              onClick={() => handleCTAClick('self_care_tips')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#ff005e] hover:text-[#ff0050] transition-colors underline opacity-80 hover:opacity-100"
            >
              <AppIcon name="heart" size={14} decorative />
              Ver dicas de autocuidado
            </button>
          )}

          {message.patternKey === 'balanced' && (
            <button
              onClick={() => handleCTAClick('celebrate')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#ff005e] hover:text-[#ff0050] transition-colors underline opacity-80 hover:opacity-100"
            >
              <AppIcon name="sparkles" size={14} decorative />
              Celebre o progresso
            </button>
          )}
        </div>
      </Card>
    </Reveal>
  )
}
