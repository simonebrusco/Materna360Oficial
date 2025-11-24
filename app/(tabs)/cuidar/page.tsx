import { unstable_noStore as noStore } from 'next/cache'
import CuidarClient from './Client'
import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  // Avoid RSC payload caching for this route
  noStore()

  const recipesSection = <HealthyRecipesSection />

  return (
    <main
      data-layout="page-template-v1"
      className="bg-[var(--color-page-bg)] min-h-[100dvh] pb-24"
    >
      <CuidarClient recipesSection={recipesSection} />
    </main>
  )
}
