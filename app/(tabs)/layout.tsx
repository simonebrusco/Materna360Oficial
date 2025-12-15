import * as React from 'react'
import BottomNav from '@/components/common/BottomNav'
import { GlobalHeader } from '@/components/common/GlobalHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-white" data-layout="page-template-v1">
      {/* FUNDO ÚNICO (APROVADO) — vale para Meu Dia, Maternar e Eu360 */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[linear-gradient(to_bottom,#fd2597_0%,#e865a7_18%,#fdbed7_52%,#ffe1f1_76%,#ffffff_100%)]
        "
      />
      {/* overlays sutis (premium, sem “camadas sujas”) */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(900px_520px_at_18%_12%,rgba(255,216,230,0.55)_0%,rgba(255,216,230,0.00)_62%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(900px_520px_at_82%_18%,rgba(253,37,151,0.22)_0%,rgba(253,37,151,0.00)_62%)]
        "
      />

      {/* Conteúdo acima do fundo */}
      <div className="relative z-10">
        <GlobalHeader />
        <div className="pb-24">{children}</div>
        <BottomNav />
      </div>
    </div>
  )
}
