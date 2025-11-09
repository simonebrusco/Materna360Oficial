'use client'

import * as React from 'react'
import { Trophy, Heart, MessageCircle, Users } from 'lucide-react'
import { track } from '@/app/lib/telemetry-track'
import { cn } from '@/lib/utils'

type Badge = {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
}

const BADGE_KEY = 'm360:badges'

export function BadgesPanel() {
  const [badges, setBadges] = React.useState<Badge[]>([])

  React.useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(BADGE_KEY) || '[]')
    const defaultBadges: Badge[] = [
      {
        id: 'selfcare',
        label: 'Autocuidado Ativo',
        description: 'Você praticou autocuidado durante a semana.',
        icon: <Heart className="h-5 w-5 text-primary" aria-hidden="true" />,
        unlocked: saved.includes('selfcare'),
      },
      {
        id: 'present-mom',
        label: 'Mãe Presente',
        description: 'Você registrou suas emoções no diário.',
        icon: <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />,
        unlocked: saved.includes('present-mom'),
      },
      {
        id: 'connected',
        label: 'Conexão Sem Culpa',
        description: 'Você manteve sua rotina em dia.',
        icon: <Users className="h-5 w-5 text-primary" aria-hidden="true" />,
        unlocked: saved.includes('connected'),
      },
    ]
    setBadges(defaultBadges)
  }, [])

  const unlock = (id: string) => {
    setBadges((prev) =>
      prev.map((b) => (b.id === id ? { ...b, unlocked: true } : b))
    )
    const saved = JSON.parse(localStorage.getItem(BADGE_KEY) || '[]')
    if (!saved.includes(id)) {
      const updated = [...saved, id]
      localStorage.setItem(BADGE_KEY, JSON.stringify(updated))
      track({ event: 'badge.unlocked', id })
    }
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink-1 mb-4">
        <Trophy className="h-5 w-5 text-primary" aria-hidden="true" /> Conquistas
      </h2>
      <div className="grid gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              'rounded-xl border p-3 flex items-center justify-between transition-all duration-300',
              badge.unlocked
                ? 'bg-primary/5 border-primary/40 shadow-[0_4px_12px_rgba(255,0,94,0.12)]'
                : 'bg-white/70 border-support-3'
            )}
          >
            <div className="flex items-center gap-3">
              {badge.icon}
              <div>
                <div className="font-medium text-sm text-ink-1">{badge.label}</div>
                <div className="text-xs text-support-3">{badge.description}</div>
              </div>
            </div>
            <button
              className={cn(
                'ui-press ui-ring px-3 py-1.5 text-xs rounded-xl border',
                badge.unlocked
                  ? 'opacity-50 cursor-default'
                  : 'bg-primary text-white hover:opacity-95'
              )}
              disabled={badge.unlocked}
              onClick={() => unlock(badge.id)}
              aria-label={badge.unlocked ? `Conquista desbloqueada: ${badge.label}` : `Desbloquear conquista: ${badge.label}`}
            >
              {badge.unlocked ? 'Conquistado' : 'Desbloquear'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
