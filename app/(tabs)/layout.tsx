import * as React from 'react'
import BottomNav from '@/components/common/BottomNav'
import { GlobalHeader } from '@/components/common/GlobalHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        relative min-h-[100dvh]
        overflow-hidden
        bg-[#fff7fa]
        bg-[linear-gradient(to_bottom,#2f3a56_0%,#553a62_12%,#8b3563_24%,#b8236b_40%,#fd2597_56%,#fdbed7_78%,#ffe1f1_92%,#fff7fa_100%)]
      "
      data-layout="page-template-v1"
    >
      {/* overlays globais (iguais nas 3 abas) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0
        bg-[radial-gradient(900px_520px_at_18%_10%,rgba(255,216,230,0.40)_0%,rgba(255,216,230,0.00)_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0
        bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.22)_0%,rgba(253,37,151,0.00)_62%)]"
      />

      <GlobalHeader />

      {/* conteúdo acima do fundo */}
      <div className="relative z-10 pb-24">{children}</div>

      <BottomNav />
    </div>
  )
}
