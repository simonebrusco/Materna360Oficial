import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

import { BreathTimer as BreathBlock } from '@/components/blocks/BreathTimer'

const ProfessionalsSection = dynamic(
  () => import('@/components/support/ProfessionalsSection').then((module) => ({ default: module.ProfessionalsSection })),
  { ssr: false, loading: () => <div className="animate-pulse rounded-2xl h-40 bg-white/60 border" /> }
)

const HealthyRecipesSection = dynamic(
  () => import('@/components/blocks/HealthyRecipes').then((module) => ({ default: module.HealthyRecipesSection })),
  { ssr: false, loading: () => <div className="animate-pulse rounded-2xl h-40 bg-white/60 border" /> }
)

export default async function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8 my-6">
      <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-soft">
        <BreathBlock />
      </section>
      <Suspense fallback={<div className="animate-pulse rounded-2xl h-40 bg-white/60 border" />}>
        <HealthyRecipesSection />
      </Suspense>
      <Suspense fallback={<div className="animate-pulse rounded-2xl h-40 bg-white/60 border" />}>
        <ProfessionalsSection />
      </Suspense>
    </div>
  )
}
