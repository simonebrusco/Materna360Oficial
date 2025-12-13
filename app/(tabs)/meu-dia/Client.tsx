'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState('')
  const [dailyMessage, setDailyMessage] = useState('…')

  // tracking
  useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    })
  }, [])

  // saudação
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : ''
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName))
    updateGreeting()
    const interval = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(interval)
  }, [name])

  // mensagem do dia
  useEffect(() => {
    const index = getDailyIndex(new Date(), DAILY_MESSAGES.length)
    setDailyMessage(DAILY_MESSAGES[index] ?? '…')
  }, [])

  // reload meia-noite
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)
    const t = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="meu-dia"
      className="
        relative min-h-[100dvh] pb-24 flex flex-col overflow-hidden
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#2f3a56_0%,#553a62_10%,#8b3563_22%,#fd2597_40%,#fdbed7_68%,#ffe1f1_88%,#fff7fa_100%)]
      "
    >
      {/* overlays */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0
        bg-[radial-gradient(900px_520px_at_18%_10%,rgba(255,216,230,0.40)_0%,rgba(255,216,230,0.00)_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0
        bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.26)_0%,rgba(253,37,151,0.00)_62%)]"
      />

      <div className="relative z-10 flex-1 mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            MEU DIA
          </span>

          <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">
            Organização do seu dia
          </h1>

          <p className="mt-1 text-sm md:text-base text-white/90 max-w-xl">
            Aqui você organiza compromissos, lembretes e tudo que salvou no app —
            sem precisar procurar.
          </p>

          <div className="pt-4 space-y-1">
            <ClientOnly>
              <h2 className="text-[22px] md:text-[24px] font-semibold text-white">
                {greeting || 'Bom dia'}
              </h2>
            </ClientOnly>

            <p className="text-sm md:text-base text-white/95 max-w-xl">
              “{dailyMessage}”
            </p>
          </div>
        </header>

        {/* PLANNER */}
        <section
          className="
            rounded-3xl
            bg-white/10
            border border-white/35
            backdrop-blur-xl
            shadow-[0_18px_45px_rgba(0,0,0,0.18)]
            p-3 md:p-4
          "
        >
          <WeeklyPlannerShell />
        </section>

        {/* FOOTER MOTIVACIONAL */}
        <div className="mt-8 md:mt-10">
          <MotivationalFooter routeKey="meu-dia-hub" />
        </div>
      </div>

      {/* RODAPÉ LEGAL */}
      <footer className="relative z-10 w-full text-center pt-4 pb-2 px-4 text-[12px] text-[#6A6A6A]/85">
        <p>© 2025 Materna360®. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
