'use client'

import * as React from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { getCurrentPlanId } from '@/app/lib/planClient'
import { Crown } from 'lucide-react'

type Props = {
  message: string
  cta?: string
  href?: string
}

export function PaywallBanner({ message, cta = 'Conheça os planos', href = '/planos' }: Props) {
  const [plan, setPlan] = React.useState('free')

  React.useEffect(() => {
    setPlan(getCurrentPlanId())
  }, [])

  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-3 flex items-start gap-3">
      <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Crown className="h-4 w-4 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-5 text-ink-1">{message}</div>
        <div className="mt-2">
          <Link
            href={href}
            onClick={() => track('nav.click', { tab: 'paywall', dest: href })}
            className="ui-press ui-ring inline-flex items-center rounded-xl border border-white/60 px-3 py-1.5 text-xs font-medium text-ink-1 hover:bg-primary/5 transition-colors"
          >
            {cta} • {plan.toUpperCase()}
          </Link>
        </div>
      </div>
    </div>
  )
}
