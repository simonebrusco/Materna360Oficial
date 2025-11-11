'use client'

import * as React from 'react'
import { printElementById } from '@/app/lib/print'
import { PaywallBanner } from '@/components/paywall/PaywallBanner'
import { track } from '@/app/lib/telemetry'
import { isPremium } from '@/app/lib/plan'
import { FileDown } from 'lucide-react'

export function ExportBlock() {
  const [isPremiumUser, setIsPremiumUser] = React.useState(false)

  React.useEffect(() => {
    setIsPremiumUser(isPremium())
    if (!isPremium()) {
      track('paywall_open', { feature: 'pdf_export', context: 'eu360' })
    }
  }, [])

  if (!isPremiumUser) {
    return (
      <div className="mb-3">
        <PaywallBanner
          message="Exportação em PDF disponível nos planos pagos."
          cta="Desbloquear PDF"
          href="/planos"
        />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-white/90 backdrop-blur-sm shadow-[0_8px_28px_rgba(47,58,86,0.08)] p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-[#ff005e]" aria-hidden />
          <h2 className="text-[16px] font-semibold">Exportar PDF</h2>
        </div>
        <button
          className="ui-press ui-ring rounded-xl border px-3 py-1.5 text-[12px]"
          onClick={() => printElementById('eu360-print-area')}
        >
          Exportar
        </button>
      </div>
      <p className="text-[12px] text-[#545454] mt-1">
        Será gerado um PDF com o resumo da semana.
      </p>
    </div>
  )
}
