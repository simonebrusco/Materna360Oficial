'use client'

import * as React from 'react'
import { printElementById } from '@/app/lib/print'
import { gate } from '@/app/lib/gate'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { FileDown } from 'lucide-react'

export function ExportPlanner() {
  const { enabled } = gate('export.pdf' as any)

  if (!enabled) {
    return <PaywallBanner message="Exportação em PDF do planner disponível nos planos pagos." />
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/95 backdrop-blur-[1px] shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink-1">Exportar Planner</h2>
        </div>
        <button
          className="inline-flex items-center gap-1 rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-xs font-medium text-support-2 hover:bg-white/95 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/30"
          onClick={() => printElementById('meu-dia-print-area')}
        >
          Exportar
        </button>
      </div>
      <p className="text-xs text-support-3 mt-2">Gere um PDF com seus itens e lembretes.</p>
    </div>
  )
}
