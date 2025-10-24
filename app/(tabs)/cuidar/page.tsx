import { Suspense } from 'react'

import { unstable_noStore as noStore } from 'next/cache'
import dynamic from 'next/dynamic'
import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'

const BreathCard = dynamic(
  () => import('@/components/blocks/BreathTimer').then((m) => m.default ?? m),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" />,
  }
)

const CareJourneys = dynamic(
  () => import('@/components/blocks/CareJourneys').then((m) => ({ default: m.CareJourneys })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const MindfulnessForMoms = dynamic(
  () => import('@/components/blocks/MindfulnessForMoms'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const OrganizationTips = dynamic(
  () => import('@/components/blocks/OrganizationTips'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const ProfessionalsSection = dynamic(
  () => import('@/components/support/ProfessionalsSection').then((m) => m.default ?? m),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" />,
  }
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  noStore()

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8 my-6">
      <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft">
        <BreathCard />
      </section>
      <section className="mt-6 space-y-6">
        <CareJourneys />
        <MindfulnessForMoms />
        <OrganizationTips />
      </section>
      <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
        <HealthyRecipesSection />
      </Suspense>
      <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
        <ProfessionalsSection />
      </Suspense>
    </div>
  )
}
