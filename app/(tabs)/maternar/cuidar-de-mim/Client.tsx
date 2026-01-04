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
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-36
        bg-[#ffe1f1]
        overflow-x-hidden
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
          {/* HEADER */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Cuidar de Mim
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-2xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
              </p>
            </div>
          </header>

          {/* CONTAINER PRINCIPAL (layout “antigo”) */}
          <div
            className="
              rounded-3xl
              bg-white/10
              border border-white/35
              backdrop-blur-xl
              shadow-[0_18px_45px_rgba(184,35,107,0.25)]
              p-4 md:p-6
            "
          >
            <div
              className="
                rounded-3xl
                bg-white/95
                border border-[#f5d7e5]
                shadow-[0_18px_45px_rgba(184,35,107,0.14)]
                overflow-hidden
              "
            >
              {/* BLOCO 0 — PARA AGORA */}
              <section className="p-5 md:p-7" id="para-agora">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5] shrink-0">
                    <AppIcon name="sparkles" size={16} className="text-[#fd2597]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                      PARA AGORA
                    </div>
                    <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-0.5">
                      Um apoio para este momento
                    </div>
                    <div className="text-[13px] text-[#6a6a6a] mt-1">Pequeno, prático e sem cobrança.</div>

                    {/* Responsivo:
                        - 1 coluna até lg (tablet incluído)
                        - 2 colunas só a partir de lg (desktop) */}
                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                      <ParaAgoraSupportCard variant="embedded" className="h-full w-full" />

                      <div className="h-full w-full rounded-2xl bg-white/60 backdrop-blur border border-[#f5d7e5]/70 shadow-[0_10px_26px_rgba(184,35,107,0.08)] p-5 md:p-6 overflow-hidden">
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
              </section>

              <div className="border-t border-[#f5d7e5]" />

              {/* BLOCO 1 — CHECK-IN */}
              <section className="p-5 md:p-7" id="ritmo">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5] shrink-0">
                    <AppIcon name="heart" size={16} className="text-[#fd2597]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                      CHECK-IN
                    </div>
                    <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-0.5">
                      Como você está agora?
                    </div>

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

                    <div className="mt-2 text-[12px] text-[#6a6a6a]">
                      Só um toque para se reconhecer. Nada além disso.
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-[#f5d7e5]" />

              {/* BLOCO 2 — SEU DIA */}
              <section className="p-5 md:p-7">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5] shrink-0">
                    <AppIcon name="list" size={16} className="text-[#fd2597]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                      SEU DIA
                    </div>
                    <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-0.5">
                      Do jeito que está
                    </div>
                    <div className="text-[13px] text-[#6a6a6a] mt-1">
                      Uma visão consolidada, sem agenda e sem cobrança.
                    </div>

                    {/* Responsivo: 1 col no mobile, 3 col só no sm+ */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                          Salvos
                        </div>
                        <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.savedCount)}</div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                      </div>

                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                          Compromissos
                        </div>
                        <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">
                          {stat(daySignals.commitmentsCount)}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                      </div>

                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(184,35,107,0.06)]">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                          Para depois
                        </div>
                        <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.laterCount)}</div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-[#f5d7e5]" />

              {/* BLOCO 3 — ORIENTAÇÃO */}
              <section className="p-5 md:p-7">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5] shrink-0">
                    <AppIcon name="info" size={16} className="text-[#fd2597]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                      ORIENTAÇÃO
                    </div>
                    <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-0.5">
                      {guidance.title}
                    </div>

                    <div className="mt-2 text-[13px] md:text-[14px] text-[#545454] leading-relaxed max-w-3xl">
                      {guidance.text}
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-[#f5d7e5]" />

              {/* BLOCO 4 — MICRO CUIDADO */}
              <section className="p-5 md:p-7" id="pausas">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5] shrink-0">
                    <AppIcon name="sparkles" size={16} className="text-[#fd2597]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                      MICRO CUIDADO
                    </div>
                    <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56] mt-0.5">
                      Um gesto possível
                    </div>
                    <div className="text-[13px] text-[#6a6a6a] mt-1">
                      Se não couber nada agora, fechar por aqui já é cuidado.
                    </div>

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
                          w-full sm:w-auto
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
                          w-full sm:w-auto
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

            <div className="mt-6">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
