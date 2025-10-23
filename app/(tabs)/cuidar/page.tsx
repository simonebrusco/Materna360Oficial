import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'
import ProfessionalsSection from '@/components/support/ProfessionalsSection'

export default function Page() {
  return (
    <div className="my-6 mx-auto max-w-6xl space-y-8 px-4 md:px-6">
      <HealthyRecipesSection />
      <ProfessionalsSection />
    </div>
  )
}
