'use client'

import { useEffect } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import AppShell from '@/components/common/AppShell'
import { ClientOnly } from '@/components/common/ClientOnly'
import { ProfileForm } from '@/components/blocks/ProfileForm'
import { Card } from '@/components/ui/card'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'

export default function Eu360Client() {
  // Page-view telemetry on mount
  useEffect(() => {
    track('nav.click', { tab: 'eu360', dest: '/eu360' })
  }, [])

  const { name } = useProfile();

  const content = (
    <PageTemplate
      label="EU360"
      title="Seu Perfil"
      subtitle="Informações que personalizam sua experiência."
    >
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        <Card suppressHydrationWarning className="rounded-3xl bg-white/90 border border-black/5 shadow-[0_6px_22px_rgba(0,0,0,0.06)] p-6 md:p-8">
          <ProfileForm />
        </Card>
      </div>
    </PageTemplate>
  )

  return (
    <>
      <AppShell>
        <ClientOnly>
          {content}
        </ClientOnly>
      </AppShell>
    </>
  )
}
