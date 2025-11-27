'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import { PageTemplate } from '@/components/common/PageTemplate'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'

import { useProfile } from '@/app/hooks/useProfile'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getTimeGreeting } from '@/app/lib/greetings'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import { SoftCard } from '@/components/ui/card'

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

  // mensagem do dia (mesma lógica que estava no Maternar)
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length)
  const dailyMessage = DAILY_MESSAGES[dayIndex]

  return (
    <section className="mb-6 md:mb-8 space-y-3">
      <div className="space-y-1">
        <ClientOnly>
          <p className="text-sm md:text-base font-semibold text-[var(--color-text-main)]">
            {greeting || 'Bem-vinda ao seu dia organizado.'}
          </p>
        </ClientOnly>
        <p className="text-xs md:text-sm text-[var(--color-text-muted)]">
          Um carinho do Materna360 pra você começar o dia com mais leveza.
        </p>
      </div>

      <Reveal delay={80}>
        <SoftCard className="relative overflow-hidden rounded-3xl border border-[var(--color-soft-strong)] bg-white/95 shadow-[0_18px_45px_rgba(0,0,0,0.08)] px-4 py-4 md:px-6 md:py-5">
          <div className="absolute inset-0 pointer-events-none opacity-70">
            <div className="absolute -top-10 -right-8 h-20 w-20 rounded-full bg-[rgba(255,20,117,0.12)] blur-3xl" />
            <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-[rgba(155,77,150,0.10)] blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-semibold text-[var(--color-text-main)] leading-snug">
                Um carinho pra você hoje
              </h3>
              <AppIcon
                name="heart"
                className="h-4 w-4 md:h-5 md:w-5 text-[var(--color-brand)]"
                aria-hidden="true"
              />
            </div>

            <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
              &quot;{dailyMessage}&quot;
            </p>

            <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]/90 leading-snug pt-0.5">
              Uma mensagem especial para começar seu dia com mais leveza.
            </p>

            <div className="mt-2 md:mt-3">
              <Link
                href="#planner-root"
                className="inline-flex items-center gap-0.5 text-xs md:text-sm font-semibold text-[var(--color-brand)] transition-all duration-150 hover:gap-1 hover:text-[var(--color-brand-deep)]"
              >
                <span>Começar meu dia organizado</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </SoftCard>
      </Reveal>
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
      {/* Saudação + carinho do dia */}
      <DailyGreetingSection />

      {/* Toda a inteligência e o layout do Meu Dia ficam aqui dentro */}
      <div id="planner-root" className="mt-2 md:mt-4">
        <WeeklyPlannerShell />
      </div>
    </PageTemplate>
  )
}
