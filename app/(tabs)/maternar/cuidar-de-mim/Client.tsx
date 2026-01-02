'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { ClientOnly } from '@/components/common/ClientOnly'
import { track } from '@/app/lib/telemetry'

import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'confusa' | 'ok'

const LS_KEYS = {
  eu360Ritmo: 'eu360_ritmo',
} as const

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

function inferRitmo(): Ritmo {
  const raw = safeGetLS(LS_KEYS.eu360Ritmo)
  if (raw === 'leve') return 'leve'
  if (raw === 'cansada') return 'cansada'
  if (raw === 'confusa') return 'confusa'
  if (raw === 'ok') return 'ok'
  // compat
  if (raw === 'sobrecarregada') return 'cansada'
  if (raw === 'animada') return 'ok'
  return 'cansada'
}

function setRitmoLS(r: Ritmo) {
  safeSetLS(LS_KEYS.eu360Ritmo, r)
}

/**
 * “Volume do dia” (v1):
 * - Sem assumir estruturas internas desconhecidas.
 * - Retorna números se você plugar depois; por enquanto, fallback “—”.
 *
 * IMPORTANTE:
 * O que você idealizou pede números reais (salvos/compromissos/depois).
 * Aqui deixo pronto para conectar depois SEM mudar layout.
 */
type DaySignals = {
  savedCount: number | null
  commitmentsCount: number | null
  laterCount: number | null
}

function readDaySignalsBestEffort(): DaySignals {
  // Por enquanto não arriscamos inferir com heurística agressiva.
  // Mantemos nulo (UI mostra “—”), mas layout já é o ideal.
  return { savedCount: null, commitmentsCount: null, laterCount: null }
}

function pickOrientation(tone: 'gentil' | 'direto', ritmo: Ritmo, signals: DaySignals) {
  // Leitura do momento (adulto), cruzando estado + volume (quando houver).
  const hasLoad =
    (signals.savedCount ?? 0) + (signals.commitmentsCount ?? 0) + (signals.laterCount ?? 0) > 0

  if (tone === 'direto') {
    if (ritmo === 'confusa') return 'Escolha só um próximo passo real. O resto pode esperar.'
    if (ritmo === 'cansada') return hasLoad ? 'Hoje é dia de manter o básico. Sem decidir tudo agora.' : 'Mantenha o básico. O resto pode esperar.'
    if (ritmo === 'leve') return 'Siga leve. Não invente complexidade.'
    return 'Seu dia não precisa render para valer.'
  }

  // gentil
  if (ritmo === 'confusa') return 'Agora é um bom momento para simplificar. Um passo já ajuda.'
  if (ritmo === 'cansada') return 'Um passo simples já é suficiente hoje.'
  if (ritmo === 'leve') return 'Vamos manter leve. Só o que fizer sentido.'
  return 'Você pode seguir sem se cobrar.'
}

function microCareSuggestion(ritmo: Ritmo) {
  // Micro cuidado opcional — sem tom terapêutico.
  if (ritmo === 'confusa') return 'Se fizer sentido agora: água + 1 minuto em silêncio antes do próximo passo.'
  if (ritmo === 'cansada') return 'Se fizer sentido agora: 3 goles d’água e ombros para baixo (3x).'
  if (ritmo === 'leve') return 'Se fizer sentido agora: um gole d’água e siga.'
  return 'Se fizer sentido agora: um gole d’água já ajuda.'
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [saveFeedback, setSaveFeedback] = useState<string>('')

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  const daySignals = useMemo(() => {
    try {
      return readDaySignalsBestEffort()
    } catch {
      return { savedCount: null, commitmentsCount: null, laterCount: null }
    }
  }, [])

  const orientation = useMemo(() => {
    const tone = (euSignal?.tone ?? 'gentil') as 'gentil' | 'direto'
    return pickOrientation(tone, ritmo, daySignals)
  }, [euSignal?.tone, ritmo, daySignals])

  const micro = useMemo(() => microCareSuggestion(ritmo), [ritmo])

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}

    const r = inferRitmo()
    setRitmo(r)

    try {
      track('cuidar_de_mim.open', { ritmo: r })
    } catch {}
  }, [])

  function onPickRitmo(next: Ritmo) {
    setRitmo(next)
    setRitmoLS(next)
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

    if (res.created) setSaveFeedback('Salvo no Meu Dia.')
    else setSaveFeedback('Isso já estava no Meu Dia.')

    try {
      track('cuidar_de_mim.save_to_my_day', {
        origin,
        created: res.created,
        dateKey: res.dateKey,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}

    window.setTimeout(() => setSaveFeedback(''), 2200)
  }

  const stat = (n: number | null) => (typeof n === 'number' ? String(n) : '—')

  return (
    <main data-layout="page-template-v1" data-tab="maternar" className="relative min-h-[100dvh] pb-24 overflow-hidden">
      <ClientOnly>
        <div className="page-shell relative z-10">
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

          {/* HUB CONTAINER (um bloco único, integrado) */}
          <section className="hub-shell">
            <div className="hub-shell-inner">
              {saveFeedback ? (
                <div className="mb-5 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] px-4 py-3 text-[12px] text-[#2f3a56]">
                  {saveFeedback}
                </div>
              ) : null}

              {/* RAIL (integração visual) */}
              <div className="relative">
                {/* linha vertical sutil */}
                <div className="absolute left-[18px] top-[6px] bottom-[6px] w-px bg-[#f5d7e5]" />

                <div className="space-y-8">
                  {/* BLOCO 1 — CHECK-IN */}
                  <section className="relative pl-12">
                    <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center">
                      <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="hub-eyebrow">CHECK-IN</div>
                    <div className="hub-title">Como você está agora?</div>

                    {/* sem explicação longa (ideal) */}
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
                                ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                                : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                            ].join(' ')}
                          >
                            {r}
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  {/* BLOCO 2 — SEU DIA, DO JEITO QUE ESTÁ (coração) */}
                  <section className="relative pl-12">
                    <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-[#ffffff] border border-[#f5d7e5] flex items-center justify-center">
                      <AppIcon name="list" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="hub-eyebrow">SEU DIA</div>
                    <div className="hub-title">Do jeito que está</div>
                    <div className="hub-subtitle">Uma visão consolidada, sem agenda e sem cobrança.</div>

                    {/* 3 sinais integrados (não lista) */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Salvos</div>
                        <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">{stat(daySignals.savedCount)}</div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                      </div>

                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Compromissos</div>
                        <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">{stat(daySignals.commitmentsCount)}</div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                      </div>

                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Para depois</div>
                        <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">{stat(daySignals.laterCount)}</div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
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
                  </section>

                  {/* BLOCO 3 — ORIENTAÇÃO DO DIA (núcleo) */}
                  <section className="relative pl-12">
                    <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center">
                      <AppIcon name="info" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="hub-eyebrow">ORIENTAÇÃO</div>
                    <div className="hub-title">{orientation}</div>

                    {/* 1 linha curta abaixo, sem consolo */}
                    <div className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed max-w-2xl">
                      Você não precisa organizar o dia inteiro para seguir. Só o próximo passo.
                    </div>
                  </section>

                  {/* BLOCO 4 — MICRO CUIDADO (opcional e discreto) */}
                  <section className="relative pl-12">
                    <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-[#ffffff] border border-[#f5d7e5] flex items-center justify-center">
                      <AppIcon name="heart" size={16} className="text-[#b8236b]" />
                    </div>

                    <div className="hub-eyebrow">MICRO CUIDADO</div>
                    <div className="hub-title">Opcional</div>
                    <div className="hub-subtitle">{micro}</div>

                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button type="button" onClick={() => saveToMyDay(micro)} className="btn-primary">
                        Salvar no Meu Dia
                      </button>

                      {/* secondary bem discreto */}
                      <button
                        type="button"
                        onClick={() => {
                          const alt = microCareSuggestion(ritmo === 'cansada' ? 'ok' : 'cansada')
                          try {
                            track('cuidar_de_mim.micro.alt', { ritmo })
                          } catch {}
                          saveToMyDay(alt)
                        }}
                        className="btn-secondary"
                      >
                        Salvar outra opção
                      </button>
                    </div>

                    {euSignal?.showLessLine ? (
                      <div className="mt-3 text-[12px] text-[#6a6a6a]">Hoje pode ser menos. E ainda assim contar.</div>
                    ) : null}
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
