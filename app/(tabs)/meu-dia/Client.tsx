'use client'

import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'
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

// P26 — continuidade Meu Dia Leve -> Meu Dia (fonte única, via persist)
import { consumeRecentMyDaySave, type MeuDiaContinuityPayload } from '@/app/lib/myDayContinuity.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ContinuityLine = { text: string; phraseId: string }
type GroupId = 'para-hoje' | 'familia' | 'autocuidado' | 'rotina-casa' | 'outros'

const LS_ACK_PREFIX = 'm360.meu_dia_leve_ack.' // + dateKey

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

function originLabel(origin: MeuDiaContinuityPayload['origin']) {
  if (origin === 'family') return 'Família'
  if (origin === 'selfcare') return 'Autocuidado'
  if (origin === 'home') return 'Casa'
  if (origin === 'today') return 'Para hoje'
  return 'Outros'
}

function originToGroupId(origin: MeuDiaContinuityPayload['origin']): GroupId {
  if (origin === 'family') return 'familia'
  if (origin === 'selfcare') return 'autocuidado'
  if (origin === 'home') return 'rotina-casa'
  if (origin === 'today') return 'para-hoje'
  return 'outros'
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

  // P26 — prompt discreto (1x/dia) quando houve save recente
  const [meuDiaLevePrompt, setMeuDiaLevePrompt] = useState<MeuDiaContinuityPayload | null>(null)

  // P33.7 (Camada 3) — foco inicial de grupo quando veio de um hub
  const [initialGroupId, setInitialGroupId] = useState<GroupId | null>(null)

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
    track('nav.click', { tab: 'meu-dia', timestamp: new Date().toISOString() })
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

      const line = getMyDayContinuityLine({ dateKey: todayKey, tone })
      setContinuityLine(line ? { text: line.text, phraseId: line.phraseId } : null)
    } catch {
      setContinuityLine(null)
    }
  }, [todayKey])

  const refreshPremiumState = useCallback(() => {
    try {
      const tier = getExperienceTier()
      const next = tier === 'premium'

      if (next) {
        const key = `m360.premium_seen.${todayKey}`
        const already = safeGetLS(key)

        if (!already) {
          safeSetLS(key, '1')
          try {
            track('premium_state_visible', { tab: 'meu-dia', dateKey: todayKey, timestamp: new Date().toISOString() })
          } catch {}
        }
      }
    } catch {
      // silêncio total
    }
  }, [todayKey])

  /**
   * P33.7 / Camada 3 — continuidade real:
   * - consome o save recente via persist (dedupe por ts)
   * - aplica foco inicial de grupo (sem UI extra)
   * - opcionalmente mostra o CTA discreto 1x/dia (ack)
   */
  const refreshMeuDiaLeveContinuity = useCallback(() => {
    try {
      if (typeof window === 'undefined') return

      // 1) Consumo dedupado (persist)
      const payload = consumeRecentMyDaySave({ windowMs: 30 * 60 * 1000 })
      if (!payload) {
        setMeuDiaLevePrompt(null)
        setInitialGroupId(null)
        return
      }

      // 2) Foco inicial de grupo (principal)
      const targetGroup = originToGroupId(payload.origin)
      setInitialGroupId(targetGroup)

      // 3) CTA discreto 1x/dia (secundário)
      const ackKey = `${LS_ACK_PREFIX}${todayKey}`
      const ack = safeGetLS(ackKey)
      if (ack === '1') {
        setMeuDiaLevePrompt(null)
        return
      }

      setMeuDiaLevePrompt(payload)

      try {
        track('meu_dia_leve.continuity_applied', {
          dateKey: todayKey,
          origin: payload.origin,
          source: payload.source,
          groupId: targetGroup,
        })
      } catch {}
    } catch {
      setMeuDiaLevePrompt(null)
      setInitialGroupId(null)
    }
  }, [todayKey])

  useEffect(() => {
    refreshAiContextAndContinuity()
    refreshPremiumState()
    refreshMeuDiaLeveContinuity()

    const onStorage = () => {
      refreshAiContextAndContinuity()
      refreshPremiumState()
      refreshMeuDiaLeveContinuity()
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
  }, [refreshAiContextAndContinuity, refreshPremiumState, refreshMeuDiaLeveContinuity])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="meu-dia"
      className="eu360-hub-bg relative min-h-[100dvh] pb-24 flex flex-col overflow-hidden"
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

            {/* opcional: se quiser, pode manter invisível; não é necessário */}
            {initialGroupId ? (
              <span className="sr-only">{`Continuity group: ${initialGroupId}`}</span>
            ) : null}
          </div>

          {/* P26 — card discreto (secundário) */}
          {meuDiaLevePrompt ? (
            <div className="mt-5">
              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_14px_rgba(0,0,0,0.05)] border border-[#F5D7E5]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                      <AppIcon name="sparkles" size={18} className="text-[#fd2597]" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[12px] text-[#6A6A6A]">
                        Salvo no Meu Dia a partir do Meu Dia Leve • {originLabel(meuDiaLevePrompt.origin)}
                      </div>
                      <div className="mt-1 text-[14px] text-[#545454] leading-relaxed max-w-2xl lg:max-w-3xl">
                        Se quiser, pegue mais um próximo passo pronto — sem inventar nada.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href="/maternar/meu-dia-leve"
                      className="rounded-full bg-[#fd2597] hover:opacity-95 text-white px-4 py-2 text-[12px] font-semibold shadow-lg transition whitespace-nowrap"
                      onClick={() => {
                        try {
                          track('meu_dia_leve.continuity_prompt.click', {
                            dateKey: todayKey,
                            origin: meuDiaLevePrompt.origin,
                            source: meuDiaLevePrompt.source,
                          })
                        } catch {}

                        safeSetLS(`${LS_ACK_PREFIX}${todayKey}`, '1')
                        setMeuDiaLevePrompt(null)
                      }}
                    >
                      Voltar ao Meu Dia Leve
                    </a>

                    <button
                      type="button"
                      className="rounded-full bg-white border border-[#F5D7E5]/70 text-[#545454] px-4 py-2 text-[12px] transition hover:shadow-sm whitespace-nowrap"
                      onClick={() => {
                        safeSetLS(`${LS_ACK_PREFIX}${todayKey}`, '1')
                        setMeuDiaLevePrompt(null)
                        try {
                          track('meu_dia_leve.continuity_prompt.dismiss', { dateKey: todayKey })
                        } catch {}
                      }}
                    >
                      Ok
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        {/* Aqui entra a continuidade real: foco inicial no grupo */}
        <MyDayGroups aiContext={aiContext} initialGroupId={initialGroupId ?? undefined} />

        <section className="mt-6 md:mt-8 bg-white rounded-3xl p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
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
