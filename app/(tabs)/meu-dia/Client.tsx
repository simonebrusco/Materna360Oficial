'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
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

// P13 — continuidade (micro-frase 1x/dia)
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'
import { getMyDayContinuityLine } from '@/app/lib/continuity.client'

// P16 — plano premium (free/premium)
import { isPremium } from '@/app/lib/plan'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ContinuityLine = { text: string; phraseId: string }

export default function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState('')
  const [dailyMessage, setDailyMessage] = useState('…')

  // P11/P12 — contexto leve (persona Eu360 + sinais básicos locais)
  // ✅ Reativo a mudanças do Eu360 (sem reload)
  const [aiContext, setAiContext] = useState<AiLightContext>(() => buildAiContext())

  // P13 — micro-frase de continuidade (no máximo 1 por dia)
  const [continuityLine, setContinuityLine] = useState<ContinuityLine | null>(null)

  // P16 — premium state (SSR-safe: define após mount)
  const [premium, setPremium] = useState(false)
  const [premiumSeenToday, setPremiumSeenToday] = useState(false)

  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

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

  function refreshAiContextAndContinuity() {
    // P12 — re-hidrata aiContext
    try {
      setAiContext(buildAiContext())
    } catch {
      // nunca quebra o fluxo
    }

    // P13 — recalcula micro-frase (helper já controla 1x/dia / primeiro uso / repetição)
    try {
      const signal = getEu360Signal()
      const tone = (signal?.tone ?? 'gentil') as 'gentil' | 'direto'

      const line = getMyDayContinuityLine({
        dateKey: getBrazilDateKey(new Date()),
        tone,
      })

      setContinuityLine(line ? { text: line.text, phraseId: line.phraseId } : null)
    } catch {
      // silencioso
      setContinuityLine(null)
    }
  }

  // P16 — revalida premium state (e telemetria 1x/dia)
  function refreshPremiumState() {
    try {
      const next = isPremium()
      setPremium(next)

      if (next) {
        const key = `m360.premium_seen.${getBrazilDateKey(new Date())}`
        const already = typeof window !== 'undefined' ? localStorage.getItem(key) : '1'

        if (!already) {
          try {
            localStorage.setItem(key, '1')
          } catch {}

          track('premium_state_visible', {
            tab: 'meu-dia',
            dateKey: getBrazilDateKey(new Date()),
            timestamp: new Date().toISOString(),
          })

          setPremiumSeenToday(true)
        }
      }
    } catch {
      // não quebra o fluxo
      setPremium(false)
    }
  }

  // ✅ P12/P13 — re-hidrata aiContext e continuidade quando a persona mudar
  useEffect(() => {
    refreshAiContextAndContinuity()
    refreshPremiumState()

    const onStorage = (_e: StorageEvent) => {
      refreshAiContextAndContinuity()
      refreshPremiumState()
    }

    const onCustomPersona = () => {
      refreshAiContextAndContinuity()
    }

    // P16 — evento custom de plano (mesma aba)
    const onPlanUpdated = () => {
      refreshPremiumState()
    }

    try {
      window.addEventListener('storage', onStorage)
      window.addEventListener('eu360:persona-updated', onCustomPersona as EventListener)
      window.addEventListener('m360:plan-updated', onPlanUpdated as EventListener)
    } catch {}

    return () => {
      try {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('eu360:persona-updated', onCustomPersona as EventListener)
        window.removeEventListener('m360:plan-updated', onPlanUpdated as EventListener)
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

            {/* P13 — micro-frase de continuidade (1x/dia, discreta) */}
            {continuityLine?.text ? (
              <p className="pt-2 text-[12px] md:text-[13px] text-white/85 max-w-xl leading-relaxed">
                {continuityLine.text}
              </p>
            ) : null}
          </div>
        </header>

        {/* P8/P11/P12/P13 — BLOCOS ORGANIZADOS (com contexto leve do Eu360) */}
        <MyDayGroups aiContext={aiContext} />

        {/* P16 — BLOCO FREE vs PREMIUM */}
        {!premium ? (
          // 🔹 Free — monetização natural (mantém o seu bloco atual)
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
        ) : (
          // ✅ Premium — benefício percebido (sem venda)
          <section className="mt-6">
            <div
              className="
                rounded-3xl
                border border-white/35
                bg-white/12
                backdrop-blur-xl
                px-5 py-4
                shadow-[0_18px_45px_rgba(0,0,0,0.18)]
              "
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-white">
                    Seu dia já está ajustado hoje
                  </p>
                  <p className="mt-1 text-[12px] text-white/90 leading-relaxed">
                    Você não precisa recomeçar. O Materna360 considera o seu contexto e te ajuda a priorizar com leveza.
                  </p>
                </div>

                {/* sutil “marcador” premium, sem virar banner */}
                <span className="shrink-0 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-white/95 uppercase">
                  Premium
                </span>
              </div>

              <ul className="mt-3 space-y-2 text-[12px] text-white/90">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white/80" />
                  Sugestões mais consistentes com o seu ritmo do dia
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-white/80" />
                  Mais contexto para decidir o que vale manter e o que vale simplificar
                </li>
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="
                    inline-flex items-center justify-center
                    rounded-full
                    border border-white/35
                    bg-white/10
                    px-4 py-2
                    text-[12px]
                    font-semibold
                    text-white
                    hover:bg-white/15
                    transition
                  "
                  onClick={() => {
                    track('premium_cta_click', {
                      tab: 'meu-dia',
                      action: 'view_adjustments',
                      timestamp: new Date().toISOString(),
                    })

                    // Por enquanto, CTA neutro e seguro:
                    // - pode virar âncora / modal / página quando o recurso existir.
                    // Mantém sem regressão.
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  aria-label="Ver ajustes de hoje"
                >
                  Ver ajustes de hoje
                </button>

                <Link
                  href="/planos"
                  className="
                    inline-flex items-center justify-center
                    rounded-full
                    border border-white/20
                    bg-white/0
                    px-4 py-2
                    text-[12px]
                    font-semibold
                    text-white/90
                    hover:text-white
                    hover:bg-white/10
                    transition
                  "
                >
                  Entender seus benefícios
                </Link>
              </div>

              {/* opcional: micro feedback 1x/dia (não invasivo) */}
              {premiumSeenToday ? (
                <p className="mt-3 text-[11px] text-white/75 leading-relaxed">
                  Ajuste aplicado com calma — um passo por vez.
                </p>
              ) : null}
            </div>
          </section>
        )}

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
