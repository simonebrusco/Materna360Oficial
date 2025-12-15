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
        pb-24
        bg-[#fff7fa]
        bg-[linear-gradient(to_bottom,#2f3a56_0%,#553a62_10%,#8b3563_22%,#fd2597_40%,#fdbed7_68%,#ffe1f1_88%,#fff7fa_100%)]
      "
      data-layout="page-template-v1"
    >
      {/* overlays globais do fundo (uma vez só, para todas as tabs) */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(900px_520px_at_18%_10%,rgba(255,216,230,0.40)_0%,rgba(255,216,230,0.00)_60%)]
        "
      />
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.26)_0%,rgba(253,37,151,0.00)_62%)]
        "
      />

      <GlobalHeader />

      {/* conteúdo das páginas */}
      <div className="relative z-10">{children}</div>

      <BottomNav />
    </div>
  )
}
