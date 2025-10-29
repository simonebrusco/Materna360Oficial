'use client'

import { useMemo } from 'react'
import type { Profile } from '@/app/lib/ageRange'

type MeuDiaClientProps = {
  dailyGreeting: string
  currentDateKey: string
  weekStartKey: string
  weekLabels: string[]
  plannerTitle: string
  profile: Profile
  dateKey: string
  allActivities: any[]
  recommendations: any[]
  initialBuckets: string[]
}

/**
 * This client component mirrors the data contract used previously.
 * It renders a premium greeting block and a simple planner shell,
 * so the page compiles and displays while keeping the same props shape.
 * If the old feature components (e.g., FamilyPlanner, Checklist) still exist,
 * you can replace the "TODO" area with them without changing the server page.
 */
export function MeuDiaClient(props: MeuDiaClientProps) {
  const {
    dailyGreeting,
    plannerTitle,
    weekLabels,
  } = props

  const subtitle = useMemo(() => dailyGreeting || 'Que seu dia seja leve e produtivo.', [dailyGreeting])

  return (
    <section className="mt-6 space-y-6">
      {/* Greeting card */}
      <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md">
        <h2 className="text-xl font-semibold text-support-1">{plannerTitle}</h2>
        <p className="mt-1 text-support-2">{subtitle}</p>
      </div>

      {/* Planner shell (keeps layout parity) */}
      <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-support-1">Semana</h3>
          <div className="flex gap-2 text-xs text-support-3">
            {weekLabels?.map((w, i) => (
              <span key={i} className="rounded-full border border-black/5 bg-white/80 px-2 py-0.5">{w}</span>
            ))}
          </div>
        </div>

        {/* TODO: If you have the original planner components (e.g. <FamilyPlanner .../> and <Checklist .../> ), render them here using the props already provided above. */}
        <div className="mt-4 rounded-xl border border-black/5 bg-white/60 p-4 text-sm text-support-3">
          Planejador e checklist serão carregados aqui (estrutura preservada).
        </div>
      </div>
    </section>
  )
}
