import { Suspense } from 'react'

import { unstable_noStore as noStore } from 'next/cache'
import nextDynamic from 'next/dynamic'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import AppShell from '@/components/common/AppShell'
import { isEnabled } from '@/app/lib/flags'
import { MentorshipBlock } from '@/components/blocks/MentorshipBlock'

const BreathCard = nextDynamic(
  () => import('@/components/blocks/BreathTimer').then((m) => m.default ?? m),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" />,
  }
)

const CareJourneys = nextDynamic(
  () => import('@/components/blocks/CareJourneys').then((m) => ({ default: m.CareJourneys })),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const MindfulnessForMoms = nextDynamic(
  () => import('@/components/blocks/MindfulnessForMoms'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const OrganizationTips = nextDynamic(
  () => import('@/components/blocks/OrganizationTips'),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-52 rounded-2xl border bg-white/60" />,
  }
)

const ProfessionalsSection = nextDynamic(
  () => import('@/components/support/ProfessionalsSection').then((m) => m.default ?? m),
  {
    ssr: false,
    loading: () => <div className="animate-pulse h-40 rounded-2xl border bg-white/60" />,
  }
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
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

      <SectionWrapper title={<span className="inline-flex items-center gap-2" suppressHydrationWarning>🧘<span>Mindfulness</span></span>}>
        <MindfulnessForMoms />
      </SectionWrapper>

      <SectionWrapper title={<span className="inline-flex items-center gap-2" suppressHydrationWarning>📋<span>Dicas de Organização</span></span>}>
        <OrganizationTips />
      </SectionWrapper>

      <SectionWrapper title={<span className="inline-flex items-center gap-2" suppressHydrationWarning>🚀<span>Jornadas de Cuidado</span></span>}>
        <CareJourneys />
      </SectionWrapper>

      {isEnabled('FF_LAYOUT_V1') && (
        <SectionWrapper title={<span className="inline-flex items-center gap-2" suppressHydrationWarning>🎓<span>Mentoria &amp; Profissionais de Apoio</span></span>}>
          <MentorshipBlock />
        </SectionWrapper>
      )}

      <SectionWrapper title={<span className="inline-flex items-center gap-2" suppressHydrationWarning>👩‍⚕️<span>Profissionais de Confiança</span></span>}>
        <Suspense fallback={<div className="animate-pulse h-40 rounded-2xl border bg-white/60" />}>
          <ProfessionalsSection />
        </Suspense>
      </SectionWrapper>
    </main>
  )

  return isEnabled('FF_LAYOUT_V1') ? <AppShell>{content}</AppShell> : content
}
