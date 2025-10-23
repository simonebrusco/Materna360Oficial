import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

const HealthyRecipesSection = dynamic(
  () => import('@/components/recipes/HealthyRecipesSection').then((m) => m.default ?? m),
  { ssr: false }
)

const ProfessionalsSection = dynamic(
  () => import('@/components/support/ProfessionalsSection').then((m) => m.default ?? m),
  { ssr: false }
)

export default async function Page() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8 my-6">
      <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
        <HealthyRecipesSection />
      </Suspense>
      <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
        <ProfessionalsSection />
      </Suspense>
    </div>
  )
}
