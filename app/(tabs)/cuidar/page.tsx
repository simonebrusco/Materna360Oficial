import React, { Suspense } from 'react'
import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

import BreathBlock from '@/components/blocks/BreathTimer'
import SectionBoundary from '@/components/common/SectionBoundary'

const ProfessionalsSection = dynamic(
  () => import('@/components/support/ProfessionalsSection').then((module) => module.default ?? module),
  { ssr: false, loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" /> }
)

const HealthyRecipesSection = dynamic(
  () => import('@/components/recipes/HealthyRecipesSection').then((module) => module.default ?? module),
  { ssr: false, loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" /> }
)

export default async function Page() {
  return (
    <div className="my-6 mx-auto max-w-6xl space-y-8 px-4 md:px-6">
      <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft">
        <BreathBlock />
      </section>

      <SectionBoundary title="Receitas Saudáveis">
        <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
          <HealthyRecipesSection />
        </Suspense>
      </SectionBoundary>

      <SectionBoundary title="Profissionais de apoio">
        <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
          <ProfessionalsSection />
        </Suspense>
      </SectionBoundary>
    </div>
  )
}
