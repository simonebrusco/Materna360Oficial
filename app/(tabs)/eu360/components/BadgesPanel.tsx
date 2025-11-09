'use client'
import * as React from 'react'
import { Trophy, Heart, MessageCircle, Users } from 'lucide-react'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'

const cn = (...args: Array<string | false | null | undefined>) =>
  args.filter(Boolean).join(' ')

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
        icon: <Heart className="h-5 w-5 text-[#ff005e]" />,
        unlocked: saved.includes('selfcare'),
      },
      {
        id: 'present-mom',
        label: 'Mãe Presente',
        description: 'Você registrou suas emoções no diário.',
        icon: <MessageCircle className="h-5 w-5 text-[#ff005e]" />,
        unlocked: saved.includes('present-mom'),
      },
      {
        id: 'connected',
        label: 'Conexão Sem Culpa',
        description: 'Você manteve sua rotina em dia.',
        icon: <Users className="h-5 w-5 text-[#ff005e]" />,
        unlocked: saved.includes('connected'),
      },
    ]
    setBadges(defaultBadges)
  }, [])

  const unlock = (id: string) => {
    setBadges(prev => {
      const updated = prev.map(b => (b.id === id ? { ...b, unlocked: true } : b))
      const b = updated.find(x => x.id === id)
      if (b) {
        toast.success(`Conquista desbloqueada: ${b.label}!`)
        track('toast.shown', { type: 'success', id, msg: 'badge_unlocked' })
      }
      return updated
    })
    const saved = JSON.parse(localStorage.getItem(BADGE_KEY) || '[]')
    if (!saved.includes(id)) {
      const next = [...saved, id]
      localStorage.setItem(BADGE_KEY, JSON.stringify(next))
      track('badge.unlocked', { id })
    }
  }

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4">
      <h2 className="text-[18px] font-semibold mb-2 text-[#2f3a56] flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[#ff005e]" /> Conquistas
      </h2>
      <div className="grid gap-3">
        {badges.map(badge => (
          <div
            key={badge.id}
            className={cn(
              'rounded-xl border p-3 flex items-center justify-between transition-all duration-300',
              badge.unlocked
                ? 'bg-[#ffd8e6]/50 border-[#ff005e]/40 shadow-[0_4px_12px_rgba(255,0,94,0.12)]'
                : 'bg-white/70 border-[#e9ecf2]'
            )}
          >
            <div className="flex items-center gap-3">
              {badge.icon}
              <div>
                <div className="font-medium text-[14px] text-[#2f3a56]">{badge.label}</div>
                <div className="text-[12px] text-[#545454]">{badge.description}</div>
              </div>
            </div>
            <button
              className={cn(
                'ui-press ui-ring px-3 py-1.5 text-[12px] rounded-xl border',
                badge.unlocked
                  ? 'opacity-50 cursor-default'
                  : 'bg-[#ff005e] text-white hover:opacity-95'
              )}
              disabled={badge.unlocked}
              onClick={() => unlock(badge.id)}
            >
              {badge.unlocked ? 'Conquistado' : 'Desbloquear'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
