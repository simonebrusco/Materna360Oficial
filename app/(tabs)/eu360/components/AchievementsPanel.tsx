'use client'

import * as React from 'react'
import { computeBadges } from '@/app/lib/badges'
import { Award } from 'lucide-react'
import Link from 'next/link'

export function AchievementsPanel() {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    setCount(computeBadges().length)
  }, [])

  if (count === 0) return null

  return (
    <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <Award className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-base font-semibold">Conquistas</h2>
      </div>
      <div className="text-xs text-support-2 mb-3">Você desbloqueou {count} conquista(s).</div>
      <Link
        href="/eu360/conquistas"
        className="ui-press ui-ring inline-flex items-center rounded-xl border border-white/60 px-3 py-1.5 text-xs font-medium text-ink-1 hover:bg-primary/5 transition-colors"
      >
        Ver todas →
      </Link>
    </div>
  )
}
