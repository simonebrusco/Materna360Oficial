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

  noStore()

  const content = (

    <main className="PageSafeBottom relative mx-auto max-w-5xl bg-[linear-gradient(180deg,#FFE5EF_0%,#FFFFFF_64%)] px-4 pt-10 pb-24 sm:px-6 md:px-8">

      <SectionWrapper className="relative bg-transparent" contentClassName="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 -z-10 h-64 rounded-soft-3xl bg-[radial-gradient(65%_65%_at_50%_0%,rgba(255,216,230,0.55),transparent)]"
        />
        <div>
          <span className="eyebrow-capsule">Autocuidado</span>
          <h1 className="mt-2 text-3xl font-semibold text-support-1 md:text-4xl">
            3 minutos agora
          </h1>
          <p className="mt-2 text-sm text-support-2 md:text-base">
            Pequeños momentos de calma para recarregar sua energia.
          </p>
        </div>
      </SectionWrapper>

      <SectionWrapper>
        <div className="rounded-2xl border border-white/60 bg-white shadow-[0_4px_24px_rgba(47,58,86,0.08)] p-6 md:p-8 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(47,58,86,0.12)]">
          <BreathCard />
        </div>
      </SectionWrapper>

      <SectionWrapper aria-label="Mindfulness">
        <MindfulnessForMoms />
      </SectionWrapper>

      <SectionWrapper aria-label="Dicas de Organização">
        <OrganizationTips />
      </SectionWrapper>

      <SectionWrapper aria-label="Jornadas de Cuidado">
        <CareJourneys />
      </SectionWrapper>

      <SectionWrapper aria-label="Profissionais de Confiança">
        <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
          <ProfessionalsSection />
        </Suspense>
      </SectionWrapper>

    </main>
  )
}
