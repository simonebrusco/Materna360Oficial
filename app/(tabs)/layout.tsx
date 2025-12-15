import BottomNav from '@/components/common/BottomNav'
import { GlobalHeader } from '@/components/common/GlobalHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-layout="page-template-v1"
      className="
        relative min-h-[100dvh]
        pb-24
        overflow-x-hidden
        bg-[#fff7fa]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#e865a7_22%,#fdbed7_58%,#ffe1f1_85%,#fff7fa_100%)]
      "
    >
      <GlobalHeader />
      <div className="relative">{children}</div>
      <BottomNav />
    </div>
  )
}
