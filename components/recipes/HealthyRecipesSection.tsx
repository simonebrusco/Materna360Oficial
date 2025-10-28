import dynamic from 'next/dynamic'
import { getBabyProfile } from '@/app/lib/baby'

const RecipesGrid = dynamic(() => import('./RecipesGrid'), { ssr: false })
const EmptyState = dynamic(
  () => import('./EmptyState').catch(() => import('../EmptyStateFallback')),
  { ssr: false }
)

export default async function HealthyRecipesSection() {
  try {
    const { babyAgeMonths } = await getBabyProfile()
    if (babyAgeMonths == null) {
      return <EmptyState hint="Não foi possível obter o perfil. Tente novamente." />
    }
    return <RecipesGrid babyAgeMonths={babyAgeMonths} />
  } catch {
    return <EmptyState hint="Algo deu errado ao carregar receitas." />
  }
}
