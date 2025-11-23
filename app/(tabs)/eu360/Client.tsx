'use client'

import { useEffect } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import AppShell from '@/components/common/AppShell'
import { ClientOnly } from '@/components/common/ClientOnly'
import { ProfileForm } from '@/components/blocks/ProfileForm'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import { WeeklyEmotionalInsightCard } from '@/components/eu360/WeeklyEmotionalInsightCard'

export default function Eu360Client() {
  // Page-view telemetry on mount
  useEffect(() => {
    track('nav.click', { tab: 'eu360', dest: '/eu360' })
  }, [])

  const { name } = useProfile()

  const content = (
    <PageTemplate
      label="EU360"
      title="Seu mundo em perspectiva"
      subtitle="Conte um pouco sobre você e a fase da sua família."
    >
      {/* Bloco 1 — Perfil / fase da família */}
      <SectionWrapper>
        <ProfileForm />
      </SectionWrapper>

      {/* Bloco 2 — Leitura emocional da semana (IA, mas com experiência de amiga) */}
      <SectionWrapper>
        <WeeklyEmotionalInsightCard />
      </SectionWrapper>
    </PageTemplate>
  )

  return (
    <>
      <AppShell>
        <ClientOnly>{content}</ClientOnly>
      </AppShell>
    </>
  )
}
