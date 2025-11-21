'use client'

import React, { useState, useEffect } from 'react'
import { useProfile } from '@/app/hooks/useProfile'
import { getTimeGreeting } from '@/app/lib/greetings'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import IntelligentSuggestionsSection from '@/components/blocks/IntelligentSuggestionsSection'

export function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')

  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : 'Mãe'
    const timeGreeting = getTimeGreeting(firstName)
    setGreeting(timeGreeting)
    track('page_view', { page: 'meu-dia' })
  }, [name])

  return (
    <PageTemplate title="Meu Dia">
      <ClientOnly>
        <div className="space-y-6">
          <Reveal delay={0}>
            <section className="space-y-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#3A3A3A]">
                {greeting}
              </h2>
            </section>
          </Reveal>

          <div className="rounded-3xl bg-white border border-[#FFE8F2] p-6 md:p-8 shadow-sm space-y-6">
            <Reveal delay={200}>
              <IntelligentSuggestionsSection mood={null} intention={null} />
            </Reveal>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
