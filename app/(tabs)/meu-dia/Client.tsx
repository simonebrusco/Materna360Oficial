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
  const [greeting, setGreeting] = useState<string>('')

  // ✅ Mensagem do dia calculada somente no client (evita hydration mismatch)
  const [dailyMessage, setDailyMessage] = useState<string>('…')

  // tracking de navegação
  useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    })
  }, [])

  // saudação dinâmica (Bom dia / Boa tarde / Boa noite + nome)
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : ''
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName))

    updateGreeting()
    const interval = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(interval)
  }, [name])

  // ✅ define a mensagem do dia após montar
  useEffect(() => {
    const index = getDailyIndex(new Date(), DAILY_MESSAGES.length)
    const msg = DAILY_MESSAGES[index] ?? '…'
    setDailyMessage(msg)
  }, [])

  // recarrega a mensagem à meia-noite
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)

    const timeoutId = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="meu-dia"
      className="
        relative
        min-h-[100dvh]
        pb-24
        flex
        flex-col
        overflow-hidden

        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#2f3a56_0%,#553a62_10%,#8b3563_22%,#fd2597_40%,#fdbed7_68%,#ffe1f1_88%,#fff7fa_100%)]
      "
    >
      {/* overlays premium (não muda layout, só acabamento) */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(900px_520px_at_18%_10%,rgba(255,216,230,0.40)_0%,rgba(255,216,230,0.00)_60%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.26)_0%,rgba(253,37,151,0.00)_62%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-0 top-0 h-20
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),rgba(255,255,255,0.00))]
        "
      />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 flex-1 mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO — alinhado ao Maternar */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
                MEU DIA
              </span>

              <h1 className="text-[28px] md:text-[32px] font-semibold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.38)]">
                Seu Dia Organizado
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_5px_rgba(0,0,0,0.45)]">
                Um espaço para planejar com leveza.
              </p>

              {/* Saudação + frase diária */}
              <div className="pt-3 space-y-1">
                <ClientOnly>
                  <h2 className="text-[22px] md:text-[24px] font-semibold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.38)]">
                    {greeting || 'Bom dia'}
                  </h2>
                </ClientOnly>

                <p className="text-sm md:text-base text-white/95 leading-relaxed max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  &quot;{dailyMessage}&quot;
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Wrapper premium do Planner (sem mexer no WeeklyPlannerShell) */}
        <div
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
        </div>

        {/* Footer motivacional */}
        <div className="mt-8 md:mt-10">
          <MotivationalFooter routeKey="meu-dia-hub" />
        </div>
      </div>

      {/* RODAPÉ LEGAL */}
      <footer
        className="
          relative z-10
          w-full
          text-center
          pt-4
          pb-2
          px-4
          text-[12px]
          md:text-[13px]
          leading-relaxed
          text-[#6A6A6A]/85
        "
      >
        <p>© 2025 Materna360®. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
