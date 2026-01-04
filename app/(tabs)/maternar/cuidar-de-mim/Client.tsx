'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { ClientOnly } from '@/components/common/ClientOnly'

import { track } from '@/app/lib/telemetry'
import { load, save } from '@/app/lib/persist'
import { getBrazilDateKey } from '@/app/lib/dateKey'

import { getEu360Signal } from '@/app/lib/eu360Signals.client'
import { readMyDayCountsToday } from '@/app/lib/myDayCounts.client'
import { getCareGuidance } from '@/app/lib/cuidarDeMimGuidance'

import QuickIdeaAI from '@/components/my-day/QuickIdeaAI'
import ParaAgoraSupportCard from '@/components/cuidar-de-mim/ParaAgoraSupportCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'confusa' | 'ok'

/**
 * Governança:
 * - Cuidar de Mim é a casa oficial do check-in.
 * - Mantém leitura compat do legado eu360_ritmo, mas grava no persist.
 */
const PERSIST_KEYS = {
  cuidarDeMimRitmo: 'cuidar_de_mim.ritmo.v1',
} as const

const LEGACY_LS_KEYS = {
  eu360Ritmo: 'eu360_ritmo',
} as const

type Appointment = {
  id: string
  dateKey: string
  time: string
  title: string
}

type DaySignals = {
  savedCount: number
  commitmentsCount: number
  laterCount: number
}

/** Fallback obrigatório da governança (sem IA, sem variação). */
const GUIDANCE_FALLBACK = 'Agora é um bom momento para simplificar. Um passo já ajuda.'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function inferRitmo(): Ritmo {
  // 1) Novo padrão (persist)
  try {
    const v = load<string>(PERSIST_KEYS.cuidarDeMimRitmo)
    if (v === 'leve' || v === 'cansada' || v === 'confusa' || v === 'ok') return v
  } catch {}

  // 2) Legado (compat)
  const raw = safeGetLS(LEGACY_LS_KEYS.eu360Ritmo)
  if (raw === 'leve') return 'leve'
  if (raw === 'cansada') return 'cansada'
  if (raw === 'confusa') return 'confusa'
  if (raw === 'ok') return 'ok'
  if (raw === 'sobrecarregada') return 'cansada'
  if (raw === 'animada') return 'ok'

  return 'cansada'
}

function setRitmoPersist(r: Ritmo) {
  try {
    save(PERSIST_KEYS.cuidarDeMimRitmo, r)
  } catch {}
}

/**
 * Compromissos (real):
 * - Fonte: planner/appointments/all
 * - Count: appointments com dateKey === todayKey
 */
function readCommitmentsTodayFromPlanner(): number {
  try {
    const todayKey = getBrazilDateKey(new Date())
    const all = load<Appointment[]>('planner/appointments/all', []) ?? []
    if (!Array.isArray(all)) return 0
    return all.filter((a) => a?.dateKey === todayKey).length
  } catch {
    return 0
  }
}

/**
 * BLOCO 2 — integração real mínima e segura:
 * - Salvos e Para depois: via helper oficial readMyDayCountsToday()
 * - Compromissos: via planner/appointments/all
 */
function readDaySignals(): DaySignals {
  try {
    const counts = readMyDayCountsToday()
    const commitments = readCommitmentsTodayFromPlanner()

    return {
      savedCount: typeof counts.savedToday === 'number' ? counts.savedToday : 0,
      laterCount: typeof counts.laterToday === 'number' ? counts.laterToday : 0,
      commitmentsCount: commitments,
    }
  } catch {
    return { savedCount: 0, commitmentsCount: 0, laterCount: 0 }
  }
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [daySignals, setDaySignals] = useState<DaySignals>(() => ({
    savedCount: 0,
    commitmentsCount: 0,
    laterCount: 0,
  }))

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  /** BLOCO 3 — governança: texto vindo do helper oficial + fallback obrigatório */
  const guidance = useMemo(() => {
    try {
      const out = getCareGuidance({
        ritmo,
        savedCount: daySignals.savedCount ?? 0,
      })
      const text = (out?.text ?? '').trim()
      return {
        title: (out?.title ?? 'Hoje, um norte simples').trim() || 'Hoje, um norte simples',
        text: text || GUIDANCE_FALLBACK,
      }
    } catch {
      return { title: 'Hoje, um norte simples', text: GUIDANCE_FALLBACK }
    }
  }, [ritmo, daySignals.savedCount])

  useEffect(() => {
    try {
      track('nav.view', { page: 'maternar.cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}

    const r = inferRitmo()
    setRitmo(r)

    const s = readDaySignals()
    setDaySignals(s)

    try {
      track('cuidar_de_mim.open', {
        ritmo: r,
        saved: s.savedCount,
        commitments: s.commitmentsCount,
        later: s.laterCount,
      })
    } catch {}
  }, [])

  function onPickRitmo(next: Ritmo) {
    setRitmo(next)
    setRitmoPersist(next)

    try {
      track('cuidar_de_mim.checkin.select', { ritmo: next })
    } catch {}
  }

  const stat = (n: number | null | undefined) => (typeof n === 'number' ? String(n) : '—')

  return (
    <main data-layout="page-template-v1" data-tab="maternar" className="relative min-h-[100dvh] pb-24 overflow-hidden eu360-hub-bg">
      <ClientOnly>
        {/* RAIL MASTER — eixo único (desktop/tablet/mobile) */}
        <div className="relative z-10 mx-auto w-full max-w-[1080px] px-4 sm:px-5 md:px-6">
          {/* HEADER */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition">
              <span className="mr-1.5 text-lg leading-none">←</span>
              Voltar para o Maternar
            </Link>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">Cuidar de Mim</h1>

            <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          {/* ENVELOPE TRANSLÚCIDO — volta o “card do topo” + contém o card branco */}
          <section className="w-full">
            <div
              className="
                rounded-[28px]
                border border-white/25
                bg-white/12
                backdrop-blur
                shadow-[0_22px_70px_rgba(184,35,107,0.22)]
                p-3 sm:p-4 md:p-5
              "
            >
              {/* TOPO TRANSLÚCIDO — “Sugestão pronta para agora (sem obrigação)” */}
              <div
                className="
                  rounded-[22px]
                  border border-white/20
                  bg-white/12
                  backdrop-blur
                  px-4 py-4 sm:px-5 sm:py-5
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 h-10 w-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                      <AppIcon name="heart" size={18} className="text-white" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-white/85 font-semibold">
                        Sugestão pronta para agora (sem obrigação)
                      </div>
                      <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-white leading-tight">
                        Um apoio para este momento
                      </div>
                      <div className="mt-1 text-[12px] md:text-[13px] text-white/85 max-w-[56ch]">
                        Pequeno, prático e sem cobrança. Se não servir, você troca ou fecha por aqui.
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {/* neutro: mantém layout do print; se tiver rota real, troca depois */}
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          track('cuidar_de_mim.top.adjust', { ritmo })
                        } catch {}
                      }}
                      className="
                        rounded-full
                        bg-white/90
                        text-[#2f3a56]
                        px-4 py-2
                        text-[12px] font-semibold
                        shadow-[0_10px_22px_rgba(0,0,0,0.10)]
                        hover:bg-white
                        transition
                      "
                    >
                      Ajustar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          track('cuidar_de_mim.top.start', { ritmo })
                        } catch {}
                        // scroll suave para Para Agora
                        try {
                          document.getElementById('para-agora')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        } catch {}
                      }}
                      className="
                        rounded-full
                        bg-[#fd2597]
                        text-white
                        px-4 py-2
                        text-[12px] font-semibold
                        shadow-[0_10px_26px_rgba(253,37,151,0.22)]
                        hover:opacity-95
                        transition
                      "
                    >
                      Começar
                    </button>
                  </div>
                </div>

                {/* chips do topo */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Para agora', 'Ritmo', 'Dia', 'Norte'].map((label) => (
                    <span
                      key={label}
                      className="
                        inline-flex items-center
                        rounded-full
                        bg-white/10
                        border border-white/20
                        px-3 py-1
                        text-[11px]
                        text-white/90
                      "
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* CARD BRANCO INTERNO — editorial */}
              <div className="mt-3 sm:mt-4 rounded-[24px] bg-white/95 backdrop-blur border border-[#f5d7e5] shadow-[0_18px_45px_rgba(184,35,107,0.14)]">
                <div className="p-4 sm:p-5 md:p-7">
                  {/* BLOCO 0 — PARA AGORA */}
                  <section className="pb-6" id="para-agora">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="sparkles" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="hub-eyebrow text-[#b8236b]">PARA AGORA</div>
                        <div className="hub-title text-[#2f3a56]">Um apoio para este momento</div>
                        <div className="hub-subtitle text-[#6a6a6a]">Pequeno, prático e sem cobrança.</div>

                        <div className="mt-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch">
                            <ParaAgoraSupportCard variant="embedded" className="h-full" />

                            <div className="h-full rounded-2xl bg-white/60 backdrop-blur border border-[#f5d7e5]/70 shadow-[0_10px_26px_rgba(184,35,107,0.08)] p-5 md:p-6">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#ffe1f1]/80 border border-[#f5d7e5]/70 flex items-center justify-center shrink-0">
                                  <AppIcon name="sparkles" size={20} className="text-[#b8236b]" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <QuickIdeaAI mode="cuidar_de_mim" className="mt-0" />
                                  <div className="mt-3 text-[12px] text-[#6a6a6a]">
                                    Se não servir, pode trocar ou fechar por aqui. Sem obrigação.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 text-[12px] text-[#6a6a6a]">
                            Regra do Materna: se couber só uma coisa, já conta.
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 1 — CHECK-IN */}
                  <section className="py-6" id="ritmo">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="heart" size={16} className="text-[#fd2597]" />
                      </div>
                      <div className="min-w-0">
                        <div className="hub-eyebrow text-[#b8236b]">CHECK-IN</div>
                        <div className="hub-title text-[#2f3a56]">Como você está agora?</div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(['leve', 'cansada', 'confusa', 'ok'] as Ritmo[]).map((r) => {
                            const active = ritmo === r
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => onPickRitmo(r)}
                                className={[
                                  'rounded-full px-4 py-2 text-[12px] border transition font-semibold',
                                  active
                                    ? 'bg-[#fd2597] border-[#fd2597] text-white shadow-[0_8px_18px_rgba(253,37,151,0.18)]'
                                    : 'bg-white border-[#f5d7e5] text-[#545454] hover:bg-[#fff3f8]',
                                ].join(' ')}
                              >
                                {r}
                              </button>
                            )
                          })}
                        </div>

                        <div className="mt-2 text-[12px] text-[#6a6a6a]">Só um toque para se reconhecer. Nada além disso.</div>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 2 — SEU DIA */}
                  <section className="py-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="list" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="hub-eyebrow text-[#b8236b]">SEU DIA</div>
                        <div className="hub-title text-[#2f3a56]">Do jeito que está</div>
                        <div className="hub-subtitle text-[#6a6a6a]">Uma visão consolidada, sem agenda e sem cobrança.</div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Salvos</div>
                            <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.savedCount)}</div>
                            <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                          </div>

                          <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Compromissos</div>
                            <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.commitmentsCount)}</div>
                            <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                          </div>

                          <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                            <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Para depois</div>
                            <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.laterCount)}</div>
                            <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 3 — ORIENTAÇÃO */}
                  <section className="py-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="info" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0">
                        <div className="hub-eyebrow text-[#b8236b]">ORIENTAÇÃO</div>
                        <div className="hub-title text-[#2f3a56]">{guidance.title}</div>

                        <div className="mt-2 text-[13px] md:text-[14px] text-[#545454] leading-relaxed max-w-2xl">{guidance.text}</div>
                      </div>
                    </div>
                  </section>

                  <div className="border-t border-[#f5d7e5]" />

                  {/* BLOCO 4 — MICRO CUIDADO */}
                  <section className="pt-6" id="pausas">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                        <AppIcon name="sparkles" size={16} className="text-[#fd2597]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="hub-eyebrow text-[#b8236b]">MICRO CUIDADO</div>
                        <div className="hub-title text-[#2f3a56]">Um gesto possível</div>
                        <div className="hub-subtitle text-[#6a6a6a]">Se não couber nada agora, fechar por aqui já é cuidado.</div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                track('cuidar_de_mim.micro_close', { ritmo })
                              } catch {}
                            }}
                            className="
                              inline-flex items-center justify-center
                              rounded-full
                              bg-white
                              border border-[#f5d7e5]
                              text-[#2f3a56]
                              px-5 py-3
                              text-[12px] font-semibold
                              hover:bg-[#fff3f8]
                              transition
                            "
                          >
                            Encerrar por aqui
                          </button>

                          <Link
                            href="/meu-dia"
                            className="
                              inline-flex items-center justify-center
                              rounded-full
                              bg-[#fd2597] hover:opacity-95
                              text-white
                              px-5 py-3
                              text-[12px] font-semibold
                              shadow-[0_10px_26px_rgba(253,37,151,0.22)]
                              transition
                            "
                          >
                            Ver Meu Dia
                          </Link>
                        </div>

                        {euSignal?.showLessLine ? (
                          <div className="mt-3 text-[12px] text-[#6a6a6a]">Hoje pode ser menos. E ainda assim contar.</div>
                        ) : null}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6">
            <LegalFooter />
          </div>

          <div className="PageSafeBottom" />
        </div>
      </ClientOnly>
    </main>
  )
}
