// app/(tabs)/maternar/cuidar-de-mim/Client.tsx
'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'
import { getProfileSnapshot } from '@/app/lib/profile.client'
import { markJourneySelfcareDone } from '@/app/lib/journey.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * =========================================================
 * LocalStorage — padrão Materna360 (P26)
 * =========================================================
 */
const LS_PREFIX = 'm360:'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    const direct = window.localStorage.getItem(key)
    if (direct !== null) return direct
    return window.localStorage.getItem(`${LS_PREFIX}${key}`)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`${LS_PREFIX}${key}`, value)
  } catch {}
}

/**
 * =========================================================
 * Tipos e constantes
 * =========================================================
 */
type FocusTime = '1min' | '3min' | '5min'
type Ritmo = 'leve' | 'cansada' | 'sobrecarregada'

const HUB_PREF = {
  focus: 'maternar:cuidar:focus_time',
  ritmo: 'maternar:cuidar:ritmo',
}

/**
 * =========================================================
 * Normalização
 * =========================================================
 */
function normalizeFocusTime(v: string | null): FocusTime {
  if (v === '1min' || v === '3min' || v === '5min') return v
  return '3min'
}

function normalizeRitmo(v: string | null): Ritmo {
  if (v === 'leve' || v === 'cansada' || v === 'sobrecarregada') return v
  return 'cansada'
}

/**
 * =========================================================
 * Conteúdo
 * =========================================================
 */
const SUGESTOES: Record<FocusTime, string[]> = {
  '1min': [
    'Respirar fundo e soltar os ombros',
    'Beber um copo de água',
    'Fechar os olhos por 30 segundos',
  ],
  '3min': [
    'Alongar pescoço e costas',
    'Respiração 4-4-6',
    'Organizar um ponto pequeno',
  ],
  '5min': [
    'Respiração guiada curta',
    'Alongamento consciente',
    'Silêncio sem tela',
  ],
}

export default function CuidarDeMimClient() {
  const [focusTime, setFocusTime] = useState<FocusTime>('3min')
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [picked, setPicked] = useState<number>(0)
  const [saveFeedback, setSaveFeedback] = useState<string>('')

  /**
   * =========================================================
   * Boot
   * =========================================================
   */
  useEffect(() => {
    const prefFocus = normalizeFocusTime(safeGetLS(HUB_PREF.focus))
    const prefRitmo = normalizeRitmo(safeGetLS(HUB_PREF.ritmo))

    setFocusTime(prefFocus)
    setRitmo(prefRitmo)

    const snap = getProfileSnapshot()

    try {
      track('cuidar_de_mim.open', {
        focusTime: prefFocus,
        ritmo: prefRitmo,
        profileSource: snap.source,
      })
    } catch {}
  }, [])

  /**
   * =========================================================
   * Handlers
   * =========================================================
   */
  function onSelectFocusTime(v: FocusTime) {
    setFocusTime(v)
    safeSetLS(HUB_PREF.focus, v)
    setPicked(0)

    try {
      track('cuidar_de_mim.focus.select', { value: v })
    } catch {}
  }

  function onSelectRitmo(v: Ritmo) {
    setRitmo(v)
    safeSetLS(HUB_PREF.ritmo, v)

    try {
      track('cuidar_de_mim.ritmo.select', { value: v })
    } catch {}
  }

  function saveToMyDay(title: string) {
    const res = addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    if (res.limitHit) {
      toast.info('Seu Meu Dia já está cheio hoje.')
      return
    }

    if (res.created) {
      toast.success('Salvo no Meu Dia')
      setSaveFeedback('Salvo no Meu Dia.')
      markJourneySelfcareDone(MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM)
    } else {
      toast.info('Já estava no Meu Dia')
      setSaveFeedback('Essa tarefa já estava no Meu Dia.')
    }

    window.setTimeout(() => setSaveFeedback(''), 2200)

    try {
      track('cuidar_de_mim.save', {
        created: res.created,
        dateKey: res.dateKey,
      })
    } catch {}
  }

  const sugestoes = useMemo(() => SUGESTOES[focusTime], [focusTime])
  const sugestaoAtiva = sugestoes[picked] ?? sugestoes[0]

  /**
   * =========================================================
   * UI
   * =========================================================
   */
  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="min-h-[100dvh] pb-32 bg-[#ffe1f1]"
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <header className="pt-8 mb-6">
            <Link href="/maternar" className="text-sm text-[#2f3a56]">
              ← Voltar
            </Link>

            <h1 className="text-2xl font-semibold mt-3 text-[#2f3a56]">
              Cuidar de Mim
            </h1>
            <p className="text-sm text-[#6a6a6a] mt-1">
              Pequenos cuidados possíveis para agora.
            </p>
          </header>

          <Reveal>
            <SoftCard className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold mb-2">Quanto tempo dá?</div>
                  <div className="flex gap-2">
                    {(['1min', '3min', '5min'] as FocusTime[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => onSelectFocusTime(v)}
                        className={`rounded-full px-3 py-1 text-xs border ${
                          focusTime === v ? 'bg-[#ffd8e6]' : 'bg-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-2">Como você está?</div>
                  <div className="flex gap-2">
                    {(['leve', 'cansada', 'sobrecarregada'] as Ritmo[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => onSelectRitmo(v)}
                        className={`rounded-full px-3 py-1 text-xs border ${
                          ritmo === v ? 'bg-[#ffd8e6]' : 'bg-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border p-4 bg-[#fff7fb]">
                  <div className="text-sm font-semibold mb-2">
                    Sugestão para agora
                  </div>
                  <div className="text-sm text-[#2f3a56] mb-4">
                    {sugestaoAtiva}
                  </div>

                  <button
                    onClick={() => saveToMyDay(sugestaoAtiva)}
                    className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-xs"
                  >
                    Salvar no Meu Dia
                  </button>

                  {saveFeedback && (
                    <div className="text-xs text-[#6a6a6a] mt-2">
                      {saveFeedback}
                    </div>
                  )}
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <div className="mt-6">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
