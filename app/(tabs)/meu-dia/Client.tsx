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

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ContinuityLine = { text: string; phraseId: string }

// P26 — continuidade Meu Dia Leve -> Meu Dia (sem conteúdo sensível)
type MeuDiaLeveRecentSave = {
  ts: number
  origin: 'today' | 'family' | 'selfcare' | 'home' | 'other'
  source: string
}

const LS_RECENT_SAVE = 'my_day_recent_save_v1'
const LS_ACK_PREFIX = 'm360.meu_dia_leve_ack.' // + dateKey

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

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

function safeRemoveLS(key: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
  } catch {}
}

function isRecentSavePayload(v: unknown): v is MeuDiaLeveRecentSave {
  if (!v || typeof v !== 'object') return false
  const o = v as any
  const okOrigin =
    o.origin === 'today' || o.origin === 'family' || o.origin === 'selfcare' || o.origin === 'home' || o.origin === 'other'
  const okTs = typeof o.ts === 'number' && Number.isFinite(o.ts)
  const okSource = typeof o.source === 'string' && !!o.source.trim()
  return okOrigin && okTs && okSource
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

function originLabel(origin: MeuDiaLeveRecentSave['origin']) {
  if (origin === 'family') return 'Família'
  if (origin === 'selfcare') return 'Autocuidado'
  if (origin === 'home') return 'Casa'
  if (origin === 'today') return 'Para hoje'
  return 'Outros'
}

/**
 * P33.2 — Ação opcional: “Me dá uma ideia rápida”
 * - Sob demanda (clique)
 * - Sem chat
 * - Sem cobrança
 * - Com fallback seguro
 *
 * Observação técnica:
 * - Este componente NÃO importa server-only.
 * - Consome /api/ai/quick-ideas (já existente no build).
 */
type QuickIdeaSuggestion = { id: string; title: string; description?: string }

type QuickIdeaState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; items: QuickIdeaSuggestion[] }

function getQuickIdeaFallback(): QuickIdeaSuggestion[] {
  return [
    { id: 'fallback-1', title: 'Respirar por 1 minuto', description: 'Uma pausa curta já ajuda a reorganizar.' },
    { id: 'fallback-2', title: 'Escolher só uma prioridade', description: 'O resto pode esperar.' },
    { id: 'fallback-3', title: 'Fazer algo simples', description: 'Algo pequeno já é suficiente por agora.' },
  ]
}

function normalizeQuickIdeas(payload: any): QuickIdeaSuggestion[] | null {
  if (!payload) return null

  // Formato A: { suggestions: [{id,title,description}] }
  if (Array.isArray(payload?.suggestions)) {
    const items = payload.suggestions
      .filter((x: any) => x && typeof x.title === 'string' && x.title.trim())
      .slice(0, 3)
      .map((x: any, idx: number) => ({
        id: typeof x.id === 'string' && x.id.trim() ? x.id : `ai-${idx + 1}`,
        title: String(x.title),
        description: typeof x.description === 'string' && x.description.trim() ? String(x.description) : undefined,
      }))
    return items.length ? items : null
  }

  // Formato B (legado): { title, body } (pode vir de BaseAIResponse)
  if (typeof payload?.title === 'string' || typeof payload?.body === 'string') {
    const raw = String(payload?.body ?? '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .slice(0, 3)

    const items = (raw.length ? raw : [payload?.title].filter(Boolean))
      .slice(0, 3)
      .map((line: any, idx: number) => ({
        id: `ai-${idx + 1}`,
        title: String(line),
      }))

    return items.length ? items : null
  }

  return null
}

function QuickIdeasBlock({ todayKey }: { todayKey: string }) {
  const [state, setState] = useState<QuickIdeaState>({ status: 'idle' })

  const run = useCallback(async () => {
    setState({ status: 'loading' })

    try {
      // 1) Tenta POST (mais compatível com “intenção explícita”)
      const postRes = await fetch('/api/ai/quick-ideas', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ intent: 'quick_idea' }),
      })

      let data: any = null
      if (postRes.ok) {
        data = await postRes.json().catch(() => null)
      } else {
        // 2) Se POST não estiver suportado, tenta GET
        const getRes = await fetch('/api/ai/quick-ideas', { method: 'GET' })
        if (getRes.ok) data = await getRes.json().catch(() => null)
      }

      const normalized = normalizeQuickIdeas(data) ?? getQuickIdeaFallback()

      setState({ status: 'done', items: normalized })

      try {
        track('ai.quick_idea.used', {
          dateKey: todayKey,
          resultType: normalized === getQuickIdeaFallback() ? 'fallback' : 'success',
        })
      } catch {}
    } catch {
      setState({ status: 'done', items: getQuickIdeaFallback() })
      try {
        track('ai.quick_idea.used', { dateKey: todayKey, resultType: 'error_fallback' })
      } catch {}
    }
  }, [todayKey])

  return (
    <div className="mt-6 md:mt-8">
      <div
        className="
          bg-white
          rounded-3xl
          p-5 md:p-6
          shadow-[0_6px_22px_rgba(0,0,0,0.06)]
          border border-[#F5D7E5]
        "
      >
        {state.status === 'idle' ? (
          <button
            type="button"
            className="
              w-full
              flex items-center justify-between
              gap-3
              rounded-2xl
              px-4 py-3
              bg-white
              border border-[#F5D7E5]/70
              text-[#2f3a56]
              hover:shadow-sm
              transition
            "
            onClick={() => {
              try {
                track('ai.quick_idea.click', { dateKey: todayKey })
              } catch {}
              void run()
            }}
          >
            <span className="text-[14px] font-semibold">Me dá uma ideia rápida</span>
            <span className="h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
              <AppIcon name="sparkles" size={18} className="text-[#fd2597]" />
            </span>
          </button>
        ) : null}

        {state.status === 'loading' ? (
          <p className="text-[13px] text-[#6A6A6A]">Pensando em algo simples…</p>
        ) : null}

        {state.status === 'done' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-[#6A6A6A]">Ideias simples para agora</p>

              <button
                type="button"
                className="text-[12px] font-semibold text-[#fd2597] hover:opacity-90 transition"
                onClick={() => {
                  try {
                    track('ai.quick_idea.more', { dateKey: todayKey })
                  } catch {}
                  void run()
                }}
              >
                Outra ideia
              </button>
            </div>

            {state.items.map(item => (
              <div
                key={item.id}
                className="
                  rounded-2xl
                  border border-[#F5D7E5]/70
                  bg-white
                  px-4 py-3
                "
              >
                <p className="text-[14px] font-semibold text-[#2f3a56]">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-[12px] text-[#6A6A6A] leading-relaxed">{item.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
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

  // P26 — CTA discreto: “voltar ao Meu Dia Leve” (1x por dia, só quando houve save recente)
  const [meuDiaLevePrompt, setMeuDiaLevePrompt] = useState<MeuDiaLeveRecentSave | null>(null)

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

  /**
   * P26 — Se o usuário salvou algo no Meu Dia Leve:
   * - mostrar um CTA discreto no Meu Dia
   * - não repetir mais de 1x por dia (ack)
   * - sem expor conteúdo (apenas origem e “salvo”)
   */
  const refreshMeuDiaLeveContinuity = useCallback(() => {
    try {
      if (typeof window === 'undefined') return

      const ackKey = `${LS_ACK_PREFIX}${todayKey}`
      const ack = safeGetLS(ackKey)
      if (ack === '1') {
        setMeuDiaLevePrompt(null)
        return
      }

      const raw = safeGetLS(LS_RECENT_SAVE)
      const parsed = safeParseJSON<unknown>(raw)
      if (!isRecentSavePayload(parsed)) {
        setMeuDiaLevePrompt(null)
        return
      }

      // janela de recência: 30 minutos (discreto, mas ainda faz sentido)
      const ageMs = Date.now() - parsed.ts
      const RECENT_WINDOW_MS = 30 * 60 * 1000

      if (ageMs < 0 || ageMs > RECENT_WINDOW_MS) {
        setMeuDiaLevePrompt(null)
        return
      }

      setMeuDiaLevePrompt(parsed)

      try {
        track('meu_dia_leve.continuity_prompt.view', {
          dateKey: todayKey,
          ageMs,
          origin: parsed.origin,
          source: parsed.source,
        })
      } catch {}
    } catch {
      setMeuDiaLevePrompt(null)
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

          <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">
            Seu dia, do seu jeito
          </h1>

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

          {/* P26 — continuidade discreta (aparece só quando veio do Meu Dia Leve) */}
          {meuDiaLevePrompt ? (
            <div className="mt-5">
              <div
                className="
                  bg-white
                  rounded-3xl
                  p-6
                  shadow-[0_2px_14px_rgba(0,0,0,0.05)]
                  border border-[#F5D7E5]
                "
              >
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
                      className="
                        rounded-full
                        bg-[#fd2597] hover:opacity-95
                        text-white
                        px-4 py-2
                        text-[12px]
                        font-semibold
                        shadow-lg transition
                        whitespace-nowrap
                      "
                      onClick={() => {
                        try {
                          track('meu_dia_leve.continuity_prompt.click', {
                            dateKey: todayKey,
                            origin: meuDiaLevePrompt.origin,
                            source: meuDiaLevePrompt.source,
                          })
                        } catch {}

                        // ack 1x/dia + limpar payload para não “grudar”
                        safeSetLS(`${LS_ACK_PREFIX}${todayKey}`, '1')
                        safeRemoveLS(LS_RECENT_SAVE)
                      }}
                    >
                      Voltar ao Meu Dia Leve
                    </a>

                    <button
                      type="button"
                      className="
                        rounded-full
                        bg-white
                        border border-[#F5D7E5]/70
                        text-[#545454]
                        px-4 py-2
                        text-[12px]
                        transition
                        hover:shadow-sm
                        whitespace-nowrap
                      "
                      onClick={() => {
                        safeSetLS(`${LS_ACK_PREFIX}${todayKey}`, '1')
                        safeRemoveLS(LS_RECENT_SAVE)
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

        <MyDayGroups aiContext={aiContext} />

        {/* P33.2 — IA guiada sob demanda (ação opcional) */}
        <QuickIdeasBlock todayKey={todayKey} />

        {/* BLOCO FREE / PREMIUM — inalterado */}
        {/* ... mantém exatamente como estava ... */}

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
