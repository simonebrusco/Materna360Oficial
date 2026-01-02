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

import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'
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

    // atualiza BLOCO 2 real (sem toast)
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
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="relative min-h-[100dvh] pb-24 overflow-hidden eu360-hub-bg"
    >
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
              <div className="bg-white rounded-3xl p-6 md:p-7 shadow-[0_6px_22px_rgba(0,0,0,0.06)] border border-[#f5d7e5]">
                {/* BLOCO 0 — PARA AGORA (apoio + ação prática) */}
                <section className="pb-7" id="para-agora">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                      <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hub-eyebrow text-[#b8236b]">PARA AGORA</div>
                      <div className="hub-title text-[#2f3a56]">Um apoio para este momento</div>
                      <div className="hub-subtitle text-[#6a6a6a]">Pequeno, prático e sem cobrança.</div>

                      <div className="mt-4 space-y-4">
                        {/* 0A) Acolhimento primeiro */}
                        <div className="rounded-2xl bg-[#ffffff] border border-[#f5d7e5]/70 shadow-[0_4px_14px_rgba(0,0,0,0.04)] p-4">
                          <ParaAgoraSupportCard />
                        </div>

                        {/* 0B) Ação depois (mais discreta) */}
                        <div className="rounded-2xl border border-[#f5d7e5]/70 bg-white px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                          <QuickIdeaAI mode="cuidar_de_mim" className="mt-0" />
                          <div className="mt-3 text-[12px] text-[#6a6a6a]">
                            Se não servir, pode trocar ou fechar por aqui. Sem obrigação.
                          </div>
                        </div>

                        {/* Botão opcional: salvar no Meu Dia (mais explícito) */}
                        <button
                          type="button"
                          className="hidden"
                          onClick={() => saveToMyDay('Um cuidado possível agora')}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-[#f5d7e5]/70" />

                {/* BLOCO 1 — CHECK-IN */}
                <section className="py-7" id="ritmo">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                      <AppIcon name="heart" size={16} className="text-[#b8236b]" />
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
                                  ? 'bg-[#fff3f8] border-[#fd2597] text-[#b8236b]'
                                  : 'bg-white border-[#f5d7e5] text-[#545454] hover:bg-[#fff7fb]',
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

                <div className="border-t border-[#f5d7e5]/70" />

                {/* BLOCO 2 — SEU DIA, DO JEITO QUE ESTÁ (dados reais) */}
                <section className="py-8">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                      <AppIcon name="list" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hub-eyebrow text-[#b8236b]">SEU DIA</div>
                      <div className="hub-title text-[#2f3a56]">Do jeito que está</div>
                      <div className="hub-subtitle text-[#6a6a6a]">Uma visão consolidada, sem agenda e sem cobrança.</div>

                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-[#f5d7e5]/70 bg-white px-5 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                            Salvos
                          </div>
                          <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.savedCount)}</div>
                          <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                        </div>

                        <div className="rounded-2xl border border-[#f5d7e5]/70 bg-white px-5 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                            Compromissos
                          </div>
                          <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">
                            {stat(daySignals.commitmentsCount)}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                        </div>

                        <div className="rounded-2xl border border-[#f5d7e5]/70 bg-white px-5 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                            Para depois
                          </div>
                          <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.laterCount)}</div>
                          <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row gap-2">
                        <Link
                          href="/meu-dia"
                          className="
                            inline-flex items-center justify-center
                            rounded-full
                            bg-white
                            border border-[#fd2597]
                            text-[#b8236b]
                            px-5 py-3
                            text-[12px] font-semibold
                            hover:bg-[#fff3f8]
                            transition
                          "
                        >
                          Ir para Meu Dia
                        </Link>

                        <Link
                          href="/maternar/meu-filho"
                          className="
                            inline-flex items-center justify-center
                            rounded-full
                            bg-white
                            border border-[#f5d7e5]
                            text-[#2f3a56]
                            px-5 py-3
                            text-[12px] font-semibold
                            hover:bg-[#fff7fb]
                            transition
                          "
                        >
                          Ir para Meu Filho
                        </Link>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-[#f5d7e5]/70" />

                {/* BLOCO 3 — ORIENTAÇÃO (apenas linguagem; fallback obrigatório) */}
                <section className="py-8">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                      <AppIcon name="info" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="min-w-0">
                      <div className="hub-eyebrow text-[#b8236b]">ORIENTAÇÃO</div>
                      <div className="hub-title text-[#2f3a56]">{guidance.title}</div>

                      <div className="mt-3 text-[13px] md:text-[14px] text-[#545454] leading-relaxed max-w-2xl">
                        {guidance.text}
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-[#f5d7e5]/70" />

                {/* BLOCO 4 — MICRO CUIDADO (fechamento simples) */}
                <section className="pt-8" id="pausas">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-2xl bg-[#ffe1f1] flex items-center justify-center border border-[#f5d7e5]">
                      <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hub-eyebrow text-[#b8236b]">MICRO CUIDADO</div>
                      <div className="hub-title text-[#2f3a56]">Opcional</div>
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
                            hover:bg-[#fff7fb]
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
                            bg-white
                            border border-[#fd2597]
                            text-[#b8236b]
                            px-5 py-3
                            text-[12px] font-semibold
                            hover:bg-[#fff3f8]
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
