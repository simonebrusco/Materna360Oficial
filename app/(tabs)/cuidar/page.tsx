import { Suspense } from 'react'

import { unstable_noStore as noStore } from 'next/cache'
import nextDynamic from 'next/dynamic'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import AppShell from '@/components/common/AppShell'
import { isEnabled } from '@/app/lib/flags'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const BreathCard = nextDynamic(
  () => import('@/components/blocks/BreathTimer').then((m) => m.default ?? m),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" />,
  }
)

const CareJourneys = nextDynamic(
  () => import('@/components/blocks/CareJourneys').then((m) => ({ default: m.CareJourneys })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const MindfulnessForMoms = nextDynamic(
  () => import('@/components/blocks/MindfulnessForMoms'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const OrganizationTips = nextDynamic(
  () => import('@/components/blocks/OrganizationTips'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const ProfessionalsSection = nextDynamic(
  () => import('@/components/support/ProfessionalsSection').then((m) => m.default ?? m),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" />,
  }
)

export default async function Page() {
  noStore()

  return <Suspense fallback={<div className="p-4">Loading…</div>}><CuidarClient /></Suspense>
}
