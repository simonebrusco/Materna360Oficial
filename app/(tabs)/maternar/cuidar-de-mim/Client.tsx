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
  if (raw === 'leve' || raw === 'cansada' || raw === 'confusa' || raw === 'ok') return raw as Ritmo
  if (raw === 'sobrecarregada') return 'cansada'
  if (raw === 'animada') return 'ok'

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
    return Array.isArray(all) ? all.filter((a) => a?.dateKey === todayKey).length : 0
  } catch {
    return 0
  }
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [counts, setCounts] = useState(() => readMyDayCountsToday())

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const }
    }
  }, [])

  const guidance = useMemo(() => {
    return getCareGuidance({
      ritmo,
      savedCount: counts.savedToday,
    })
  }, [ritmo, counts.savedToday])

  useEffect(() => {
    const r = inferRitmo()
    setRitmo(r)
    setCounts(readMyDayCountsToday())

    try {
      track('cuidar_de_mim.open', { ritmo: r })
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
    const res = addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    try {
      markRecentMyDaySave({
        origin: 'selfcare',
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}

    if (res?.ok) setCounts(readMyDayCountsToday())
  }

  return (
    <main className="relative min-h-[100dvh] pb-24">
      <ClientOnly>
        <div className="page-shell">
          <header className="pt-8 mb-6">
            <Link href="/maternar" className="text-sm text-white/80">← Voltar</Link>
            <h1 className="mt-3 text-3xl font-semibold text-white">Cuidar de Mim</h1>
            <p className="mt-1 text-white/80">Um espaço para pausar e ganhar clareza.</p>
          </header>

          <section className="bg-white rounded-3xl border shadow p-6 space-y-6">
            {/* CHECK-IN */}
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">Check-in</div>
              <div className="mt-2 flex gap-2">
                {(['leve','cansada','confusa','ok'] as Ritmo[]).map(r => (
                  <button
                    key={r}
                    onClick={() => onPickRitmo(r)}
                    className={`px-4 py-2 rounded-full text-sm border ${
                      ritmo === r ? 'bg-gray-100 border-gray-300' : 'border-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t" />

            {/* BLOCO 2 */}
            <div>
              <h2 className="font-semibold text-lg">Seu dia, do jeito que está</h2>
              <p className="text-sm text-gray-500">Sem agenda e sem cobrança.</p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-semibold">{counts.savedToday}</div>
                  <div className="text-xs text-gray-500">Salvos hoje</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">{readCommitmentsTodayFromPlanner()}</div>
                  <div className="text-xs text-gray-500">Compromissos</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold">{counts.laterToday}</div>
                  <div className="text-xs text-gray-500">Para depois</div>
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* BLOCO 3 */}
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500">{guidance.title}</div>
              <p className="mt-2 text-gray-700">{guidance.text}</p>
            </div>

            <div className="border-t" />

            {/* MICRO CUIDADO */}
            <button
              onClick={() => saveToMyDay('Um gole d’água já ajuda.')}
              className="text-sm text-gray-600 underline"
            >
              Salvar um micro cuidado no Meu Dia
            </button>
          </section>

          <LegalFooter />
        </div>
      </ClientOnly>
    </main>
  )
}
