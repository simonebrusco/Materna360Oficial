'use client'

import React, { useEffect, useState } from 'react'

import { PageTemplate } from '@/components/common/PageTemplate'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'

import { useProfile } from '@/app/hooks/useProfile'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'

function DailyGreetingSection() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')

  // saudação dinâmica (bom dia, boa tarde, etc. + primeiro nome)
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : ''
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName))

    updateGreeting()
    const interval = setInterval(updateGreeting, 60_000)
    return () => clearInterval(interval)
  }, [name])

  // mensagem do dia (troca a cada 24h)
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length)
  const dailyMessage = DAILY_MESSAGES[dayIndex]

  return (
    <section className="mb-6 md:mb-8 mt-2 md:mt-3 space-y-2">
      {/* BOM DIA / BOA TARDE – bem destacado */}
      <ClientOnly>
        <p className="text-2xl md:text-3xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
          {greeting || 'Bem-vinda ao seu dia organizado.'}
        </p>
      </ClientOnly>

      {/* Frase motivacional do dia (dinâmica) */}
      <p className="text-sm md:text-base text-white/92 max-w-xl leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
        &quot;{dailyMessage}&quot;
      </p>
    </section>
  )
}

export default function MeuDiaClient() {
  return (
    <PageTemplate
      label="MEU DIA"
      title="Seu Dia Organizado"
      subtitle="Um espaço para planejar com leveza."
    >
      {/* Saudação + frase do dia (sem card branco) */}
      <DailyGreetingSection />

      {/* Toda a inteligência e o layout do Meu Dia ficam aqui dentro */}
      <div id="planner-root" className="mt-2 md:mt-4">
        <WeeklyPlannerShell />
      </div>
    </PageTemplate>
  )
}
