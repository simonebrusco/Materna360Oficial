'use client'

import * as React from 'react'
import type { Profile } from '@/lib/ageRange'

type Props = {
  dailyGreeting: string
  currentDateKey: string
  weekStartKey: string
  weekLabels: string[]
  plannerTitle: string
  profile: Profile
  dateKey: string
  allActivities: any[]
  recommendations: any[]
  initialBuckets: Record<string, string[]>
}

export default function MeuDiaClient(props: Props) {
  return (
    <div className="mt-6 space-y-6">
      {/* Planner card */}
      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <h2 className="text-sm font-medium text-support-2">{props.plannerTitle}</h2>
        <p className="text-xs text-support-3">{props.dailyGreeting || 'Mensagem do dia'}</p>

        {/* Week strip (placeholder if FamilyPlanner not available) */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-support-3">
            <span>Semana</span>
            <span className="tabular-nums">{props.weekLabels.join(' · ')}</span>
          </div>
          <div className="mt-2 h-11 rounded-xl bg-neutral-50/60 ring-1 ring-black/5" />
        </div>
      </section>

      {/* Checklist card */}
      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <h2 className="text-sm font-medium text-support-2">Checklist</h2>
        <div className="mt-3 grid grid-cols-4 gap-3">
          {['💤', '🍎', '🏃‍♀️', '📚'].map((icon, i) => (
            <button
              key={i}
              className="flex flex-col items-center justify-center rounded-2xl bg-white px-3 py-4 text-xs shadow-sm ring-1 ring-black/5 hover:shadow-md"
            >
              <span className="text-lg">{icon}</span>
              <span className="mt-1 text-[11px] text-support-3">Ação</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recommendations card */}
      <section className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <h2 className="text-sm font-medium text-support-2">Sugestões para hoje</h2>
        <p className="mt-2 text-xs text-support-3">
          Dicas rápidas e atividades baseadas no perfil e na idade dos filhos.
        </p>
        <div className="mt-3 h-24 rounded-xl bg-neutral-50/60 ring-1 ring-black/5" />
      </section>
    </div>
  )
}
