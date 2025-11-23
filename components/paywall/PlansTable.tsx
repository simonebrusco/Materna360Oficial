'use client'

import * as React from 'react'
import { PLANS, type PlanId } from '@/app/lib/plans'
import { getCurrentPlanId, setCurrentPlanId } from '@/app/lib/planClient'
import { Check, X } from 'lucide-react'

function YesNo(v: boolean) {
  return v ? (
    <Check className="h-4 w-4 text-[#0a7f53]" />
  ) : (
    <X className="h-4 w-4 text-[#b00020]" />
  )
}

export function PlansTable() {
  const [plan, setPlan] = React.useState<PlanId>('free')

  React.useEffect(() => {
    setPlan(getCurrentPlanId())
  }, [])

  const select = (id: PlanId) => {
    setCurrentPlanId(id)
    setPlan(id)
  }

  const rows: Array<{
    key: string
    label: string
    formatter?: (v: any) => React.ReactNode
  }> = [
    {
      key: 'ideas.dailyQuota',
      label: 'Ideias por dia',
      formatter: (v) => (
        <span>
          {typeof v === 'number' ? v : v ? 'Ilimitado' : '—'}
        </span>
      ),
    },
    {
      key: 'export.pdf',
      label: 'Exportar PDF',
      formatter: (v) => YesNo(Boolean(v)),
    },
    {
      key: 'journeys.concurrentSlots',
      label: 'Jornadas simultâneas',
      formatter: (v) => <span>{v}</span>,
    },
    {
      key: 'audio.progress',
      label: 'Progresso em áudios',
      formatter: (v) => YesNo(Boolean(v)),
    },
    {
      key: 'insights.weekly',
      label: 'Insights semanais',
      formatter: (v) => YesNo(Boolean(v)),
    },
  ]

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-6">
      <h2 className="text-[22px]/[28px] md:text-[28px]/[34px] font-semibold tracking-[-0.01em] mb-4">
        Tabela de Recursos (QA)
      </h2>

      <div className="mb-4 flex gap-2">
        {(['free', 'plus', 'premium'] as PlanId[]).map((id) => (
          <button
            key={id}
            onClick={() => select(id)}
            className={`px-3 py-1.5 text-[12px] rounded-xl border transition-colors ${
              plan === id
                ? 'bg-[#ffd8e6]/40 border-primary/40'
                : 'border-white/60 bg-white/50 hover:bg-white/70'
            }`}
            aria-pressed={plan === id}
          >
            {PLANS[id].label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left border-b border-white/40">
              <th className="py-2 pr-2 font-semibold text-support-1">
                Recurso
              </th>
              {(['free', 'plus', 'premium'] as PlanId[]).map((id) => (
                <th key={id} className="py-2 px-2 font-semibold text-support-1">
                  {PLANS[id].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={String(r.key)}
                className="border-t border-white/40 hover:bg-white/30 transition-colors"
              >
                <td className="py-2 pr-2 text-[#2f3a56] font-medium">
                  {r.label}
                </td>
                {(['free', 'plus', 'premium'] as PlanId[]).map((id) => {
                  const v = (PLANS[id].limits as any)[r.key]
                  return (
                    <td key={id} className="py-2 px-2 text-center">
                      {r.formatter ? r.formatter(v) : String(v)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[12px] text-[#545454]">
        Seleção acima altera apenas seu plano local (teste/QA).
      </p>
    </div>
  )
}
