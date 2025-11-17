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
      title="Seu perfil Materna360"
      subtitle="Ajudamos você com base nas suas necessidades e da sua família."
    >
      <Card suppressHydrationWarning>
        <ProfileForm />
      </Card>
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
