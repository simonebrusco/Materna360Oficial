import React from 'react'
import BottomNav from '@/components/common/BottomNav'
import { GlobalHeader } from '@/components/common/GlobalHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden bg-white"
      data-layout="page-template-v1"
      data-surface="tabs"
    >
      {/* Fundo unificado das tabs (paleta Materna) */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 -z-10

          bg-[#ffe1f1]
          bg-[linear-gradient(to_bottom,#2f3a56_0%,#553a62_18%,#8b3563_34%,#fd2597_55%,#fdbed7_78%,#ffe1f1_100%)]
        "
      />

      {/* Névoa suave para reduzir saturação e dar respiro (sem sair da paleta) */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 -z-10
          bg-white/10
        "
      />

      {/* Glow suave (premium) */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 -z-10
          bg-[radial-gradient(900px_520px_at_20%_10%,rgba(255,216,230,0.28)_0%,rgba(255,216,230,0.00)_60%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 -z-10
          bg-[radial-gradient(900px_520px_at_78%_18%,rgba(253,37,151,0.18)_0%,rgba(253,37,151,0.00)_62%)]
        "
      />

      <GlobalHeader />

      <div className="pb-24">{children}</div>

      <BottomNav />
    </div>
  )
}
