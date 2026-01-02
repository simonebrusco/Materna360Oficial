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
  try {
    const v = load<string>(PERSIST_KEYS.cuidarDeMimRitmo)
    if (v === 'leve' || v === 'cansada' || v === 'confusa' || v === 'ok') return v
  } catch {}

  const raw = safeGetLS(LEGACY_LS_KEYS.eu360Ritmo)
  if (raw === 'leve') return 'leve'
  if (raw === 'cansada' || raw === 'sobrecarregada') return 'cansada'
  if (raw === 'confusa') return 'confusa'
  if (raw === 'ok' || raw === 'animada') return 'ok'

  return 'cansada'
}

function setRitmoPersist(r: Ritmo) {
  try {
    save(PERSIST_KEYS.cuidarDeMimRitmo, r)
  } catch {}
}

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
  const [daySignals, setDaySignals] = useState<DaySignals>({
    savedCount: 0,
    commitmentsCount: 0,
    laterCount: 0,
  })

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  const guidance = useMemo(() => {
    try {
      const out = getCareGuidance({
        ritmo,
        savedCount: daySignals.savedCount,
      })
      return {
        title: out?.title?.trim() || 'Hoje, um norte simples',
        text: out?.text?.trim() || GUIDANCE_FALLBACK,
      }
    } catch {
      return { title: 'Hoje, um norte simples', text: GUIDANCE_FALLBACK }
    }
  }, [ritmo, daySignals.savedCount])

  useEffect(() => {
    const r = inferRitmo()
    const s = readDaySignals()
    setRitmo(r)
    setDaySignals(s)

    track('cuidar_de_mim.open', {
      ritmo: r,
      saved: s.savedCount,
      commitments: s.commitmentsCount,
      later: s.laterCount,
    })
  }, [])

  function onPickRitmo(next: Ritmo) {
    setRitmo(next)
    setRitmoPersist(next)
    track('cuidar_de_mim.checkin.select', { ritmo: next })
  }

  function saveToMyDay(title: string) {
    const res = addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    if (res?.ok) setDaySignals(readDaySignals())

    markRecentMyDaySave({
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })
  }

  const stat = (n?: number) => (typeof n === 'number' ? String(n) : '—')

  return (
    <main data-layout="page-template-v1" data-tab="maternar" className="relative min-h-[100dvh] pb-24 overflow-hidden eu360-hub-bg">
      <ClientOnly>
        <div className="page-shell relative z-10">
          {/* HEADER */}
          <header className="pt-8 md:pt-10 mb-8">
            <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85 hover:text-white">
              <span className="mr-1.5 text-lg">←</span>
              Voltar para o Maternar
            </Link>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white">Cuidar de Mim</h1>
            <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          {/* CONTAINER */}
          <section className="hub-shell">
            <div className="hub-shell-inner">
              <div className="bg-white/95 backdrop-blur rounded-3xl p-6 md:p-7 border border-[#f5d7e5] shadow-[0_18px_45px_rgba(184,35,107,0.14)]">

                {/* BLOCO 0 — PARA AGORA (PREMIUM GRID) */}
                <section className="pb-7">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                      <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="flex-1">
                      <div className="hub-eyebrow text-[#b8236b]">PARA AGORA</div>
                      <div className="hub-title text-[#2f3a56]">Um apoio para este momento</div>
                      <div className="hub-subtitle text-[#6a6a6a]">Pequeno, prático e sem cobrança.</div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Acolhimento */}
                        <div className="min-h-[92px]">
                          <ParaAgoraSupportCard variant="embedded" />
                        </div>

                        {/* Ação */}
                        <div className="min-h-[92px] rounded-2xl border border-[#f5d7e5]/70 bg-white/70 backdrop-blur px-4 py-4 shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                          <QuickIdeaAI mode="cuidar_de_mim" className="mt-0" />
                          <div className="mt-3 text-[12px] text-[#6a6a6a]">
                            Se não servir, pode trocar ou fechar por aqui. Sem obrigação.
                          </div>
                        </div>

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

                {/* CHECK-IN */}
                <section className="py-7">
                  <div className="hub-eyebrow text-[#b8236b]">CHECK-IN</div>
                  <div className="hub-title text-[#2f3a56]">Como você está agora?</div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    {(['leve', 'cansada', 'confusa', 'ok'] as Ritmo[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => onPickRitmo(r)}
                        className={`px-4 py-2 rounded-full text-[12px] font-semibold border ${
                          ritmo === r
                            ? 'bg-[#fff3f8] border-[#fd2597] text-[#b8236b]'
                            : 'bg-white border-[#f5d7e5] text-[#545454]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 text-[12px] text-[#6a6a6a]">
                    Só um toque para se reconhecer. Nada além disso.
                  </div>
                </section>

                <div className="border-t border-[#f5d7e5]/70" />

                {/* SEU DIA */}
                <section className="py-7">
                  <div className="hub-eyebrow text-[#b8236b]">SEU DIA</div>
                  <div className="hub-title text-[#2f3a56]">Do jeito que está</div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Salvos', value: stat(daySignals.savedCount), desc: 'coisas registradas hoje' },
                      { label: 'Compromissos', value: stat(daySignals.commitmentsCount), desc: 'no seu planner' },
                      { label: 'Para depois', value: stat(daySignals.laterCount), desc: 'coisas que podem esperar' },
                    ].map((c) => (
                      <div key={c.label} className="rounded-2xl border border-[#f5d7e5]/70 bg-white/70 px-5 py-4">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                          {c.label}
                        </div>
                        <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{c.value}</div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="border-t border-[#f5d7e5]/70" />

                {/* ORIENTAÇÃO */}
                <section className="py-7">
                  <div className="hub-eyebrow text-[#b8236b]">ORIENTAÇÃO</div>
                  <div className="hub-title text-[#2f3a56]">{guidance.title}</div>
                  <p className="mt-2 text-[14px] text-[#545454] max-w-2xl">{guidance.text}</p>
                </section>

                <div className="border-t border-[#f5d7e5]/70" />

                {/* MICRO CUIDADO */}
                <section className="pt-7">
                  <div className="hub-eyebrow text-[#b8236b]">MICRO CUIDADO</div>
                  <div className="hub-title text-[#2f3a56]">Opcional</div>
                  <div className="hub-subtitle text-[#6a6a6a]">
                    Se não couber nada agora, fechar por aqui já é cuidado.
                  </div>

                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button className="rounded-full px-5 py-3 border border-[#f5d7e5] text-[#2f3a56] text-[12px]">
                      Encerrar por aqui
                    </button>
                    <Link
                      href="/meu-dia"
                      className="rounded-full px-5 py-3 border border-[#f5d7e5] text-[#2f3a56] text-[12px]"
                    >
                      Ver Meu Dia
                    </Link>
                  </div>

                  {euSignal?.showLessLine && (
                    <div className="mt-3 text-[12px] text-[#6a6a6a]">
                      Hoje pode ser menos. E ainda assim contar.
                    </div>
                  )}
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
