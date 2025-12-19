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
import { MyDayGroups } from '@/components/my-day/MyDayGroups'
import { buildAiContext } from '@/app/lib/ai/buildAiContext'
import type { AiLightContext } from '@/app/lib/ai/buildAiContext'

// P13 — continuidade (micro-frase 1x/dia)
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'
import { getMyDayContinuityLine } from '@/app/lib/continuity.client'

// ✅ P23 — camada de experiência (nunca chamar isPremium diretamente em componente)
import { getExperienceTier } from '@/app/lib/experience/experienceTier'

// P22 — fricção zero (primeiro uso, retorno, dia 7/30)
import { getAndUpdateUsageMilestones, ackUsageMilestone } from '@/app/lib/usageMilestones.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ContinuityLine = { text: string; phraseId: string }

export default function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState('')
  const [dailyMessage, setDailyMessage] = useState('…')

  // P11/P12 — contexto leve (persona Eu360 + sinais básicos locais)
  const [aiContext, setAiContext] = useState<AiLightContext>(() => buildAiContext())

  // P13 — micro-frase de continuidade (no máximo 1 por dia)
  const [continuityLine, setContinuityLine] = useState<ContinuityLine | null>(null)

  // P16 — premium state (agora via experience tier)
  const [premium, setPremium] = useState(false)
  const [premiumSeenToday, setPremiumSeenToday] = useState(false)

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
      setPremium(next)

      if (next) {
        const key = `m360.premium_seen.${todayKey}`
        const already = localStorage.getItem(key)

        if (!already) {
          localStorage.setItem(key, '1')

          track('premium_state_visible', {
            tab: 'meu-dia',
            dateKey: todayKey,
            timestamp: new Date().toISOString(),
          })

          setPremiumSeenToday(true)
        }
      }
    } catch {
      setPremium(false)
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

  // 🔹 P22 — regra de ordem silenciosa
  const showMessageFirst = milestones.isFirstDay || milestones.isReturnAfterAbsence

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
              <h2 className="text-[22px] md:text-[24px] font-semibold text-white">{greeting || 'Bom dia'}</h2>
            </ClientOnly>

            <p className="text-sm md:text-base text-white/95 max-w-xl">“{dailyMessage}”</p>

            {continuityLine?.text ? (
              <p className="pt-2 text-[12px] md:text-[13px] text-white/85 max-w-xl leading-relaxed">
                {continuityLine.text}
              </p>
            ) : null}
          </div>
        </header>

        {/* P22 — ordem silenciosa */}
        {showMessageFirst ? (
          <>
            <MyDayGroups aiContext={aiContext} />
          </>
        ) : (
          <>
            <MyDayGroups aiContext={aiContext} />
          </>
        )}

        {/* BLOCO FREE / PREMIUM — inalterado */}
        {/* ... mantém exatamente como estava ... */}

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

        <div className="mt-8 md:mt-10">
          <MotivationalFooter routeKey="meu-dia-hub" />
        </div>
      </div>

      <footer className="relative z-10 w-full text-center pt-4 pb-2 px-4 text-[12px] text-[#6A6A6A]/85">
        <p>© 2025 Materna360®. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
