'use client'

import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import MyDayGroups from '@/components/my-day/MyDayGroups'
import { buildAiContext } from '@/app/lib/ai/buildAiContext'
import type { AiLightContext } from '@/app/lib/ai/buildAiContext'

// P13 — continuidade (micro-frase 1x/dia)
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'
import { getMyDayContinuityLine } from '@/app/lib/continuity.client'

//  P23 — camada de experiência (nunca chamar isPremium diretamente em componente)
import { getExperienceTier } from '@/app/lib/experience/experienceTier'

// P22 — fricção zero (primeiro uso, retorno, dia 7/30)
import { getAndUpdateUsageMilestones, ackUsageMilestone } from '@/app/lib/usageMilestones.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ContinuityLine = { text: string; phraseId: string }

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function getFirstName(fullName: string | null | undefined) {
  const n = (fullName ?? '').trim()
  if (!n) return ''
  return n.split(/\s+/)[0] ?? ''
}

function withName(baseGreeting: string, firstName: string) {
  const g = (baseGreeting ?? '').trim()
  const f = (firstName ?? '').trim()
  if (!f) return g || 'Bom dia'
  if (g.toLowerCase().includes(f.toLowerCase())) return g
  return g ? `${g}, ${f}` : `Bom dia, ${f}`
}

export default function MeuDiaClient() {
  const { name } = useProfile()
  const firstName = useMemo(() => getFirstName(name), [name])

  const [greeting, setGreeting] = useState('')
  const [dailyMessage, setDailyMessage] = useState('…')

  // P11/P12 — contexto leve (persona Eu360 + sinais básicos locais)
  const [aiContext, setAiContext] = useState<AiLightContext>(() => buildAiContext())

  // P13 — micro-frase de continuidade (no máximo 1 por dia)
  const [continuityLine, setContinuityLine] = useState<ContinuityLine | null>(null)

  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

  // P22 — marcos de uso (client-only, sem UI)
  const milestones = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        daysSinceFirstOpen: 0,
        daysSinceLastOpen: 0,
        isFirstDay: true,
        isDay7: false,
        isDay30: false,
        isReturnAfterAbsence: false,
      }
    }
    return getAndUpdateUsageMilestones()
  }, [])

  useEffect(() => {
    if (milestones.isDay7) ackUsageMilestone('day7')
    if (milestones.isDay30) ackUsageMilestone('day30')
  }, [milestones.isDay7, milestones.isDay30])

  /* tracking */
  useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    })
  }, [])

  /* saudação (com nome quando houver) */
  useEffect(() => {
    const updateGreeting = () => {
      const base = getTimeGreeting('')
      setGreeting(withName(base, firstName))
    }

    updateGreeting()
    const interval = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(interval)
  }, [firstName])

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

  const refreshAiContextAndContinuity = useCallback(() => {
    try {
      setAiContext(buildAiContext())
    } catch {}

    try {
      const signal = getEu360Signal()
      const tone = (signal?.tone ?? 'gentil') as 'gentil' | 'direto'

      const line = getMyDayContinuityLine({
        dateKey: todayKey,
        tone,
      })

      setContinuityLine(line ? { text: line.text, phraseId: line.phraseId } : null)
    } catch {
      setContinuityLine(null)
    }
  }, [todayKey])

  const refreshPremiumState = useCallback(() => {
    try {
      const tier = getExperienceTier()
      const next = tier === 'premium'

      // Telemetria interna, sem qualquer efeito visual.
      if (next) {
        const key = `m360.premium_seen.${todayKey}`
        const already = safeGetLS(key)

        if (!already) {
          safeSetLS(key, '1')
          try {
            track('premium_state_visible', {
              tab: 'meu-dia',
              dateKey: todayKey,
              timestamp: new Date().toISOString(),
            })
          } catch {}
        }
      }
    } catch {
      // silêncio total: fallback implícito para free
    }
  }, [todayKey])

  useEffect(() => {
    refreshAiContextAndContinuity()
    refreshPremiumState()

    const onStorage = () => {
      refreshAiContextAndContinuity()
      refreshPremiumState()
    }

    const onCustomPersona = () => refreshAiContextAndContinuity()
    const onPlanUpdated = () => refreshPremiumState()

    window.addEventListener('storage', onStorage)
    window.addEventListener('eu360:persona-updated', onCustomPersona as EventListener)
    window.addEventListener('m360:plan-updated', onPlanUpdated as EventListener)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('eu360:persona-updated', onCustomPersona as EventListener)
      window.removeEventListener('m360:plan-updated', onPlanUpdated as EventListener)
    }
  }, [refreshAiContextAndContinuity, refreshPremiumState])

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
      <div className="page-shell relative z-10 flex-1 w-full">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            MEU DIA
          </span>

          <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">Seu dia, do seu jeito</h1>

          <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl lg:max-w-3xl">
            Um espaço para organizar o que importa hoje — com leveza, sem cobrança.
          </p>

          <p className="mt-2 text-[12px] md:text-[13px] text-white/85 max-w-2xl lg:max-w-3xl leading-relaxed">
            Você não precisa dar conta de tudo. Só do que fizer sentido agora.
          </p>

          <div className="pt-4 space-y-1">
            <ClientOnly>
              <h2 className="text-[22px] md:text-[24px] font-semibold text-white">{greeting || 'Bom dia'}</h2>
            </ClientOnly>

            <p className="text-sm md:text-base text-white/95 max-w-2xl lg:max-w-3xl">“{dailyMessage}”</p>

            {continuityLine?.text ? (
              <p className="pt-2 text-[12px] md:text-[13px] text-white/85 max-w-2xl lg:max-w-3xl leading-relaxed">
                {continuityLine.text}
              </p>
            ) : null}
          </div>
        </header>

        {/* Grupos/tarefas continuam no Meu Dia */}
        <MyDayGroups aiContext={aiContext} />

        {/* NOVO: o “me dá uma ideia agora” sai do Meu Dia e vira CTA para Cuidar de Mim */}
        <section className="mt-6 md:mt-8">
          <div className="rounded-3xl border border-white/35 bg-white/12 backdrop-blur-md p-5 md:p-6 shadow-[0_10px_28px_rgba(0,0,0,0.10)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[12px] text-white/85 font-semibold uppercase tracking-[0.18em]">
                  Para agora
                </div>
                <div className="mt-2 text-[18px] md:text-[20px] font-semibold text-white leading-snug">
                  Quer uma ideia simples para este momento?
                </div>
                <p className="mt-1 text-[12px] md:text-[13px] text-white/85 leading-relaxed max-w-2xl">
                  No Cuidar de Mim você ajusta o volume (rapidinho), puxa seus salvos e escolhe um próximo passo — sem virar agenda.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Link
                  href="/maternar/cuidar-de-mim"
                  className="rounded-full bg-white text-[#2f3a56] px-4 py-2 text-[12px] shadow-[0_6px_18px_rgba(0,0,0,0.12)] hover:bg-white/95 transition text-center"
                  onClick={() => {
                    try {
                      track('meu_dia.cta.cuidar_de_mim', { dateKey: todayKey })
                    } catch {}
                  }}
                >
                  Ir para Cuidar de Mim
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Planner continua no Meu Dia */}
        <section
          className="
            mt-6 md:mt-8
            bg-white
            rounded-3xl
            p-6
            shadow-[0_6px_22px_rgba(0,0,0,0.06)]
            border border-[#F5D7E5]
          "
        >
          <WeeklyPlannerShell />
        </section>

        <div className="mt-8 md:mt-10">
          <MotivationalFooter routeKey="meu-dia-hub" />
        </div>
      </div>

      <footer className="relative z-10 w-full text-center pt-4 pb-2 px-4 text-[12px] text-[#6A6A6A]/85">
        <p> 2025 Materna360. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
