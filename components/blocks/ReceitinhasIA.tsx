import { getBabyProfile } from '@/app/lib/baby'
import { ReceitinhasCard } from '@/components/features/Receitinhas/ReceitinhasCard'
import type { PlanTier } from '@/components/features/Receitinhas/utils'

export default async function ReceitinhasIA() {
  const profile = await getBabyProfile()
  const plan: PlanTier = 'premium'

  return <ReceitinhasCard childAgeMonths={profile.babyAgeMonths ?? null} initialPlan={plan} />
}
