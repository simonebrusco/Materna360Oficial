'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { ClientOnly } from '@/components/common/ClientOnly'

import QuickIdeaAI from '@/components/my-day/QuickIdeaAI'

import { track } from '@/app/lib/telemetry'
import { load, save } from '@/app/lib/persist'
import { getBrazilDateKey } from '@/app/lib/dateKey'

import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'

import { readMyDayCountsToday } from '@/app/lib/myDayCounts.client'
import { getCareGuidance } from '@/app/lib/cuidarDeMimGuidance'

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

/**
 * “Micro cuidado” offline (sem IA):
 * - Linguagem adulta, não terapêutica.
 * - Curta e acionável.
 */
function microCareSuggestion(ritmo: Ritmo, seed: number) {
  const optionsByRitmo: Record<Ritmo, string[]> = {
    confusa: [
      'Se fizer sentido agora: água + 10 segundos em silêncio antes do próximo passo.',
      'Se fizer sentido agora: uma respiração funda e escolher só uma coisa pequena.',
      'Se fizer sentido agora: baixar os ombros e voltar para o próximo passo.',
    ],
    cansada: [
      'Se fizer sentido agora: 3 goles d’água e ombros para baixo (3x).',
      'Se fizer sentido agora: água e um alongamento curto do pescoço (1x).',
      'Se fizer sentido agora: sentar por 20 segundos. Só isso.',
    ],
    leve: [
      'Se fizer sentido agora: um gole d’água e seguir.',
      'Se fizer sentido agora: abrir a janela por um instante e continuar.',
      'Se fizer sentido agora: água e uma pausa curtinha.',
    ],
    ok: [
      'Se fizer sentido agora: um gole d’água já ajuda.',
      'Se fizer sentido agora: organizar só o que está na sua frente.',
      'Se fizer sentido agora: água e seguir no seu ritmo.',
    ],
  }

  const list = optionsByRitmo[ritmo]
  const idx = Math.abs(seed) % list.length
  return list[idx]
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [microSeed, setMicroSeed] = useState<number>(0)
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

  /** Fallback offline do hub (sem IA): usado no bloco “Micro cuidado”. */
  const micro = useMemo(() => microCareSuggestion(ritmo, microSeed), [ritmo, microSeed])

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

  function saveToMyDay(title: string) {
    const origin = 'selfcare' as const

    const res = addTaskToMyDay({
      title,
      origin,
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    try {
      markRecentMyDaySave({
        origin,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}

    if (res?.ok) {
      setDaySignals(readDaySignals())
    }

    try {
      track('cuidar_de_mim.save_to_my_day', {
        origin,
        ok: !!res.ok,
        created: !!res.created,
        limitHit: !!res.limitHit,
        dateKey: res.dateKey,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}
  }

  const stat = (n: number | null | undefined) => (typeof n === 'number' ? String(n) : '—')

  return (
    <main data-layout="page-template-v1" data-tab="maternar" className="relative min-h-[100dvh] pb-24 overflow-hidden">
      <ClientOnly>
        <div className="page-shell relative z-10">
          {/* HEADER */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <Link
              href="/maternar"
              className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition"
            >
              <span className="mr-1.5 text-lg leading-none">←</span>
              Voltar para o Maternar
            </Link>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">Cuidar de Mim</h1>

            <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          {/* CONTAINER EDITORIAL ÚNICO */}
          <section className="hub-shell">
            <div className="hub-shell-inner">
              <div className="bg-white/95 backdrop-blur rounded-3xl p-6 md:p-7 shadow-lg border border-black/5">
                {/* BLOCO 0 — PARA AGORA (reuso: card do Meu Dia, adaptado ao hub via mode) */}
                <section className="pb-6" id="para-agora">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-black/5 flex items-center justify-center">
                      <AppIcon name="sparkles" size={16} className="text-black/70" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hub-eyebrow">PARA AGORA</div>
                      <div className="hub-title">Um apoio para este momento</div>
                      <div className="hub-subtitle">Pequeno, prático e sem cobrança.</div>

                      <div className="mt-4">
                        <QuickIdeaAI mode="cuidar_de_mim" />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-black/5" />

                {/* BLOCO 1 — CHECK-IN */}
                <section className="py-6" id="ritmo">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-black/5 flex items-center justify-center">
                      <AppIcon name="heart" size={16} className="text-black/70" />
                    </div>
                    <div className="min-w-0">
                      <div className="hub-eyebrow">CHECK-IN</div>
                      <div className="hub-title">Como você está agora?</div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(['leve', 'cansada', 'confusa', 'ok'] as Ritmo[]).map((r) => {
                          const active = ritmo === r
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => onPickRitmo(r)}
                              className={[
                                'rounded-full px-4 py-2 text-[12px] border transition',
                                active
                                  ? 'bg-black/10 border-black/10 text-black'
                                  : 'bg-white border-black/10 text-black/70 hover:bg-black/5',
                              ].join(' ')}
                            >
                              {r}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-black/5" />

                {/* BLOCO 2 — SEU DIA, DO JEITO QUE ESTÁ (dados reais) */}
                <section className="py-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-black/5 flex items-center justify-center">
                      <AppIcon name="list" size={16} className="text-black/70" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hub-eyebrow">SEU DIA</div>
                      <div className="hub-title">Do jeito que está</div>
                      <div className="hub-subtitle">Uma visão consolidada, sem agenda e sem cobrança.</div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-black/60 font-semibold">
                            Salvos
                          </div>
                          <div className="mt-1 text-[20px] font-semibold text-black">{stat(daySignals.savedCount)}</div>
                          <div className="mt-0.5 text-[12px] text-black/60">coisas registradas hoje</div>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-black/60 font-semibold">
                            Compromissos
                          </div>
                          <div className="mt-1 text-[20px] font-semibold text-black">
                            {stat(daySignals.commitmentsCount)}
                          </div>
                          <div className="mt-0.5 text-[12px] text-black/60">no seu planner</div>
                        </div>

                        <div className="rounded-2xl border border-black/5 bg-white px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-black/60 font-semibold">
                            Para depois
                          </div>
                          <div className="mt-1 text-[20px] font-semibold text-black">{stat(daySignals.laterCount)}</div>
                          <div className="mt-0.5 text-[12px] text-black/60">coisas que podem esperar</div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col sm:flex-row gap-2">
                        <Link href="/meu-dia" className="btn-primary inline-flex items-center justify-center">
                          Ir para Meu Dia
                        </Link>
                        <Link href="/maternar/meu-filho" className="btn-secondary inline-flex items-center justify-center">
                          Ir para Meu Filho
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-black/5" />

                {/* BLOCO 3 — ORIENTAÇÃO (apenas linguagem; fallback obrigatório) */}
                <section className="py-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-black/5 flex items-center justify-center">
                      <AppIcon name="info" size={16} className="text-black/70" />
                    </div>

                    <div className="min-w-0">
                      <div className="hub-eyebrow">ORIENTAÇÃO</div>
                      <div className="hub-title">{guidance.title}</div>

                      <div className="mt-2 text-[13px] md:text-[14px] text-black/70 leading-relaxed max-w-2xl">
                        {guidance.text}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-black/5" />

                {/* BLOCO 4 — MICRO CUIDADO (offline, sem IA) */}
                <section className="pt-6" id="pausas">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-black/5 flex items-center justify-center">
                      <AppIcon name="sparkles" size={16} className="text-black/70" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hub-eyebrow">MICRO CUIDADO</div>
                      <div className="hub-title">Opcional</div>
                      <div className="hub-subtitle">{micro}</div>

                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button type="button" onClick={() => saveToMyDay(micro)} className="btn-primary">
                          Salvar no Meu Dia
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMicroSeed((s) => s + 1)
                            try {
                              track('cuidar_de_mim.micro.rotate', { ritmo })
                            } catch {}
                          }}
                          className="btn-secondary"
                        >
                          Me dá outra opção
                        </button>
                      </div>

                      {euSignal?.showLessLine ? (
                        <div className="mt-3 text-[12px] text-black/60">Hoje pode ser menos. E ainda assim contar.</div>
                      ) : null}
                    </div>
                  </div>
                </section>
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
