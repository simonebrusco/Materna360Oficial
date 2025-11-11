'use client'

import * as React from 'react'
import { computeBadges } from '@/app/lib/badges'
import { Award } from 'lucide-react'

export default function ConquistasPage() {
  const [badges, setBadges] = React.useState<ReturnType<typeof computeBadges>>([])

  React.useEffect(() => {
    setBadges(computeBadges())
  }, [])

  return (
    <div data-layout="page-template-v1" className="bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_72%)] min-h-[100dvh] pb-24">
      <div className="mx-auto max-w-[1040px] px-4 md:px-6 py-6">
        <h1 className="text-2xl md:text-[28px] font-semibold mb-6">Conquistas</h1>

        {badges.length === 0 ? (
          <div className="rounded-2xl border border-white/60 bg-white/90 p-4 text-sm text-ink-2">
            Nenhuma conquista por enquanto.
          </div>
        ) : (
          <ul className="grid gap-3">
            {badges.map((b) => (
              <li key={b.id} className="rounded-2xl border border-white/60 bg-white/90 p-4 flex items-center gap-3">
                <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-1">{b.label}</div>
                  <div className="text-xs text-support-2">
                    Desbloqueado em {new Date(b.unlockedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
