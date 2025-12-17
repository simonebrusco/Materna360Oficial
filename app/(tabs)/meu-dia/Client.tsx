'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { MyDayGroups } from '@/components/my-day/MyDayGroups'
import { buildAiContext } from '@/app/lib/ai/buildAiContext'
import type { AiLightContext } from '@/app/lib/ai/buildAiContext'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState('')
  const [dailyMessage, setDailyMessage] = useState('…')

  // P11/P12 — contexto leve (persona Eu360 + sinais básicos locais)
  // ✅ Agora reativo a mudanças do Eu360 (sem reload)
  const [aiContext, setAiContext] = useState<AiLightContext>(() => buildAiContext())

  /* tracking */
  useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    })
  }, [])

  /* saudação */
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : ''
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName))
    updateGreeting()
    const interval = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(interval)
  }, [name])

  /* mensagem do dia */
  useEffect(() => {
    const index = getDailyIndex(new Date(), DAILY_MESSAGES.length)
    setDailyMessage(DAILY_MESSAGES[index] ?? '…')
  }, [])

  /* reload à meia-noite */
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)
    const t = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(t)
  }, [])

  // ✅ P12 — re-hidrata aiContext quando a persona mudar
  useEffect(() => {
    const refresh = () => {
      try {
        setAiContext(buildAiContext())
      } catch {
        // nunca quebra o fluxo
      }
    }

    const onStorage = (_e: StorageEvent) => {
      refresh()
    }

    const onCustom = () => {
      refresh()
    }

    try {
      window.addEventListener('storage', onStorage)
      window.addEventListener('eu360:persona-updated', onCustom as EventListener)
    } catch {}

    return () => {
      try {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('eu360:persona-updated', onCustom as EventListener)
      } catch {}
    }
  }, [])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="meu-dia"
      className="
        eu360-hub-bg
        relative min-h-[100dvh]
        pb-24
        flex flex-col
        overflow-hidden
      "
    >
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
            Aqui você organiza compromissos, lembretes e tudo que salvou no app — sem precisar procurar.
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

        {/* P8/P11/P12/P13 — BLOCOS ORGANIZADOS (com contexto leve do Eu360) */}
        <MyDayGroups aiContext={aiContext} />

        {/* 🔹 P10 — MICRO BLOCO MATERNA360+ (MONETIZAÇÃO NATURAL) */}
        <section className="mt-6">
          <div
            className="
              rounded-3xl
              border border-[#f5d7e5]
              bg-[#fff7fb]
              px-5 py-4
              shadow-[0_8px_22px_rgba(0,0,0,0.06)]
            "
          >
            <p className="text-[13px] font-semibold text-[#2f3a56]">
              Com o Materna360+, o seu dia se ajusta automaticamente
            </p>

            <p className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">
              O app aprende com o seu ritmo, reduz tarefas em dias difíceis e sugere
              o que faz mais sentido para você — sem precisar recomeçar ou explicar
              tudo de novo.
            </p>

            <div className="mt-3">
              <Link
                href="/planos"
                className="
                  inline-flex items-center
                  rounded-full
                  bg-[#fd2597]
                  px-4 py-2
                  text-[12px]
                  font-semibold
                  text-white
                  shadow
                  hover:opacity-95
                  transition
                "
              >
                Entender o Materna360+
              </Link>
            </div>
          </div>
        </section>

        {/* PLANNER (LEGADO — NÃO TOCAR) */}
        <section
          className="
            mt-6 md:mt-8
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
