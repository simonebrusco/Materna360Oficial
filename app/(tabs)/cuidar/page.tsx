import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ProfessionalsSection = dynamic(
  () => import('@/components/support/ProfessionalsSection').then((module) => module.default ?? module),
  { ssr: false }
)

const HealthyRecipesSection = dynamic(
  () => import('@/components/recipes/HealthyRecipesSection').then((module) => module.default ?? module),
  { ssr: false }
)

export default async function Page() {
  return (
    <div className="my-6 mx-auto max-w-6xl space-y-8 px-4 md:px-6">
      <Suspense fallback={<div className="m-4 h-40 animate-pulse rounded-2xl border bg-white/60" />}>
        <HealthyRecipesSection />
      </Suspense>
      <Suspense fallback={<div className="m-4 h-40 animate-pulse rounded-2xl border bg-white/60" />}>
        <ProfessionalsSection />
      </Suspense>
    </div>
  )
}
