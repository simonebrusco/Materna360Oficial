import { Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import nextDynamic from 'next/dynamic'
import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'

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

const ReceitinhasIA = nextDynamic(
  () => import('@/components/blocks/ReceitinhasIA'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-60 rounded-3xl border bg-white/60" />,
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

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  noStore()

  return (
    <main className="mx-auto max-w-[70rem] space-y-8 px-6 pt-8 pb-16 md:space-y-12 md:px-8 md:pt-12 md:pb-[72px] lg:space-y-14 lg:px-10 lg:pt-14 lg:pb-20">
      <section className="rounded-3xl border border-white/70 bg-white/90 px-6 py-7 shadow-[0_18px_42px_-26px_rgba(47,58,86,0.28)] backdrop-blur-sm transition-shadow duration-300 md:px-8 md:py-9">
        <BreathCard />
      </section>
      <CareJourneys />
      <MindfulnessForMoms />
      <ReceitinhasIA />
      <OrganizationTips />
      <Suspense fallback={<div style={{ padding: '8px' }}>Carregando receitas…</div>}>
        <HealthyRecipesSection />
      </Suspense>
      <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
        <ProfessionalsSection />
      </Suspense>
    </main>
  )
}
