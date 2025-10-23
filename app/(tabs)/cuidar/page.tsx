import React, { Suspense } from 'react'

import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'
import ProfessionalsSection from '@/components/support/ProfessionalsSection'

export default function Page() {
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
