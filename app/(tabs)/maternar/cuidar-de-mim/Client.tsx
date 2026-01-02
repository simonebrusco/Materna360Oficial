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

      const text = (out?.text ?? '').trim()

      return {
        title: (out?.title ?? 'Hoje, um norte simples').trim(),
        text: text || GUIDANCE_FALLBACK,
      }
    } catch {
      return { title: 'Hoje, um norte simples', text: GUIDANCE_FALLBACK }
    }
  }, [ritmo, daySignals.savedCount])

  useEffect(() => {
    track('nav.view', { page: 'maternar.cuidar-de-mim' })

    const r = inferRitmo()
    setRitmo(r)

    const s = readDaySignals()
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
    const origin = 'selfcare' as const

    const res = addTaskToMyDay({
      title,
      origin,
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    if (res?.ok) {
      setDaySignals(readDaySignals())
    }

    markRecentMyDaySave({
      origin,
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })
  }

  const stat = (n?: number) => (typeof n === 'number' ? String(n) : '—')

  return (
    <main data-layout="page-template-v1" data-tab="maternar" className="relative min-h-[100dvh] pb-24 eu360-hub-bg">
      <ClientOnly>
        <div className="page-shell relative z-10">
          <header className="pt-8 md:pt-10 mb-8">
            <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85">
              ← Voltar para o Maternar
            </Link>

            <h1 className="mt-3 text-[32px] font-semibold text-white">Cuidar de Mim</h1>
            <p className="mt-1 text-white/90 max-w-2xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          <section className="hub-shell">
            <div className="hub-shell-inner">
              <div className="bg-white/95 backdrop-blur rounded-3xl p-7 shadow-[0_18px_45px_rgba(184,35,107,0.12)] border border-[#f5d7e5]/80">

                {/* PARA AGORA */}
                <section className="pb-8">
                  <div className="flex gap-3">
                    <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                    <div>
                      <div className="hub-eyebrow">PARA AGORA</div>
                      <div className="hub-title">Um apoio para este momento</div>
                      <div className="hub-subtitle">Pequeno, prático e sem cobrança.</div>

                      <div className="mt-4 grid md:grid-cols-2 gap-5">
                        <ParaAgoraSupportCard variant="embedded" className="h-full" />

                        <div className="rounded-2xl bg-white/60 backdrop-blur border border-[#f5d7e5]/70 p-4">
                          <QuickIdeaAI mode="cuidar_de_mim" />
                          <div className="mt-3 text-[12px] text-[#6a6a6a]">
                            Se não servir, pode trocar ou fechar por aqui. Sem obrigação.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t border-[#f5d7e5]/45" />

                {/* CHECK-IN */}
                <section className="py-7">
                  <div className="hub-eyebrow">CHECK-IN</div>
                  <div className="hub-title">Como você está agora?</div>

                  <div className="mt-4 flex gap-2">
                    {(['leve', 'cansada', 'confusa', 'ok'] as Ritmo[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => onPickRitmo(r)}
                        className={`rounded-full px-4 py-2 text-[12px] font-semibold border ${
                          ritmo === r
                            ? 'bg-[#fd2597] text-white border-[#fd2597]'
                            : 'bg-white border-[#f5d7e5]'
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

                <div className="border-t border-[#f5d7e5]/45" />

                {/* SEU DIA */}
                <section className="py-7">
                  <div className="hub-eyebrow">SEU DIA</div>
                  <div className="hub-title">Do jeito que está</div>

                  <div className="mt-4 grid sm:grid-cols-3 gap-4">
                    <div className="soft-card">Salvos<br />{stat(daySignals.savedCount)}</div>
                    <div className="soft-card">Compromissos<br />{stat(daySignals.commitmentsCount)}</div>
                    <div className="soft-card">Para depois<br />{stat(daySignals.laterCount)}</div>
                  </div>
                </section>

                <div className="border-t border-[#f5d7e5]/45" />

                {/* ORIENTAÇÃO */}
                <section className="py-7">
                  <div className="hub-eyebrow">ORIENTAÇÃO</div>
                  <div className="hub-title">{guidance.title}</div>
                  <p className="mt-2 text-[#545454] max-w-2xl">{guidance.text}</p>
                </section>

                <div className="border-t border-[#f5d7e5]/45" />

                {/* MICRO CUIDADO */}
                <section className="pt-7">
                  <div className="hub-eyebrow">MICRO CUIDADO</div>
                  <div className="hub-title text-[#2f3a56]">Um gesto possível</div>
                  <div className="hub-subtitle">
                    Se não couber nada agora, fechar por aqui já é cuidado.
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="secondary-btn">Encerrar por aqui</button>
                    <Link href="/meu-dia" className="primary-btn">Ver Meu Dia</Link>
                  </div>

                  {euSignal.showLessLine && (
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
        </div>
      </ClientOnly>
    </main>
  )
}
