import type { Metadata } from 'next'
import CuidarClient from './Client'
import HealthyRecipesSection from '@/components/recipes/HealthyRecipesSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Cuidar | Materna360',
  description:
    'Saúde física, emocional e segurança para sua família com uma experiência leve e organizada.',
}

export default async function Page() {
  return (
    <main data-layout="page-template-v1" className="bg-soft-page min-h-[100dvh] pb-24">
      <CuidarClient recipesSection={<HealthyRecipesSection />} />
    </main>
  )
}
