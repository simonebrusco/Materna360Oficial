import { Suspense } from 'react'

import CuidarClient from '@/app/(tabs)/cuidar/Client'
import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4">Loading…</div>}>
      <CuidarClient recipesSection={<HealthyRecipesSection />} />
    </Suspense>
  )
}
