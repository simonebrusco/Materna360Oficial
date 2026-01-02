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

import type { MyDayTaskItem } from '@/app/lib/myDayTasks.client'
import { addTaskToMyDay, listMyDayTasks, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'

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
 * Salvos e Para depois (real):
 * - Fonte: listMyDayTasks(new Date()) -> lê planner/tasks/YYYY-MM-DD (persist + legado)
 * - Para depois: status === 'snoozed' OU snoozeUntil > todayKey
 */
function readSavedTodayFromCore(): { total: number; later: number } {
  try {
    const todayKey = getBrazilDateKey(new Date())
    const tasks = listMyDayTasks(new Date())
    if (!Array.isArray(tasks)) return { total: 0, later: 0 }

    let later = 0
    for (const t of tasks as MyDayTaskItem[]) {
      const status = (t.status ?? (t.done ? 'done' : 'active')) as string
      const snoozeUntil = typeof t.snoozeUntil === 'string' ? t.snoozeUntil : ''

      if (status === 'snoozed' || (snoozeUntil && snoozeUntil > todayKey)) later += 1
    }

    return { total: tasks.length, later }
  } catch {
    return { total: 0, later: 0 }
  }
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

function readDaySignals(): DaySignals {
  const saved = readSavedTodayFromCore()
  const commitments = readCommitmentsTodayFromPlanner()

  return {
    savedCount: saved.total,
    commitmentsCount: commitments,
    laterCount: saved.later,
  }
}

function pickOrientation(tone: 'gentil' | 'direto', ritmo: Ritmo, signals: DaySignals) {
  const saved = signals.savedCount ?? 0
  const commitments = signals.commitmentsCount ?? 0
  const later = signals.laterCount ?? 0

  // carga simples (não “score”, só leitura)
  const loadTotal = saved + commitments + later
  const hasLoad = loadTotal > 0
  const heavy = loadTotal >= 6

  if (tone === 'direto') {
    if (ritmo === 'confusa') return 'Escolha só um próximo passo real. O resto pode esperar.'
    if (ritmo === 'cansada') return heavy ? 'Hoje é dia de manter o básico. Sem decidir tudo agora.' : 'Mantenha o básico. O resto pode esperar.'
    if (ritmo === 'leve') return hasLoad ? 'Siga leve. Só não invente complexidade.' : 'Siga leve. Um passo por vez.'
    return hasLoad ? 'Seu dia já está em movimento. Sem se cobrar por “fechar”.' : 'Seu dia não precisa render para valer.'
  }

  // gentil
  if (ritmo === 'confusa') return 'Agora é um bom momento para simplificar. Um passo já ajuda.'
  if (ritmo === 'cansada') return heavy ? 'Hoje, manter o básico já é suficiente.' : 'Um passo simples já é suficiente hoje.'
  if (ritmo === 'leve') return hasLoad ? 'Vamos manter leve. Só o que fizer sentido.' : 'Vamos manter leve. Sem pressa.'
  return hasLoad ? 'Você pode seguir sem se cobrar.' : 'Você pode seguir no seu ritmo.'
}

function microCareSuggestion(ritmo: Ritmo, seed: number) {
  const optionsByRitmo: Record<Ritmo, string[]> = {
    confusa: [
      'Se fizer sentido agora: água + 1 minuto em silêncio antes do próximo passo.',
      'Se fizer sentido agora: respira uma vez fundo e escolhe só uma coisa pequena.',
      'Se fizer sentido agora: fecha os olhos por 10 segundos e reabre no próximo passo.',
    ],
    cansada: [
      'Se fizer sentido agora: 3 goles d’água e ombros para baixo (3x).',
      'Se fizer sentido agora: água e um alongamento rápido do pescoço (1x).',
      'Se fizer sentido agora: senta por 20 segundos. Só isso.',
    ],
    leve: [
      'Se fizer sentido agora: um gole d’água e siga.',
      'Se fizer sentido agora: abre a janela por um instante e continua.',
      'Se fizer sentido agora: água e uma pausa curtinha.',
    ],
    ok: [
      'Se fizer sentido agora: um gole d’água já ajuda.',
      'Se fizer sentido agora: arruma só o que está na sua frente.',
      'Se fizer sentido agora: água e segue no seu ritmo.',
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

  const orientation = useMemo(() => {
    const tone = (euSignal?.tone ?? 'gentil') as 'gentil' | 'direto'
    return pickOrientation(tone, ritmo, daySignals)
  }, [euSignal?.tone, ritmo, daySignals])

  const micro = useMemo(() => microCareSuggestion(ritmo, microSeed), [ritmo, microSeed])

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
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

          {/* HUB — CONTAINER EDITORIAL ÚNICO (igual filosofia do Meu Filho) */}
          <section className="w-full max-w-[920px] mx-auto">
            <div className="bg-white rounded-3xl border border-[#f5d7e5] shadow-sm p-6 md:p-8">
              {/* BLOCO 1 — CHECK-IN */}
              <section className="relative">
                <div className="flex items-start gap-3">
                  <div className="mt-[2px] h-9 w-9 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">CHECK-IN</div>
                    <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56] leading-tight">
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
                  </div>
                </div>
              </section>

              {/* DIVISÓRIA */}
              <div className="mt-7 border-t border-[#f5d7e5]" />

              {/* BLOCO 2 — SEU DIA (módulo sistêmico, não “3 cards soltos”) */}
              <section className="pt-7">
                <div className="flex items-start gap-3">
                  <div className="mt-[2px] h-9 w-9 rounded-2xl bg-white border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="list" size={16} className="text-[#b8236b]" />
                  </div>

                  <div className="min-w-0 w-full">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">SEU DIA</div>
                    <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56] leading-tight">
                      Do jeito que está
                    </div>
                    <div className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a]">
                      Uma visão consolidada, sem agenda e sem cobrança.
                    </div>

                    {/* Linha sistêmica de mini-métricas (internas ao módulo) */}
                    <div className="mt-4 rounded-2xl border border-[#f5d7e5] bg-white p-3 md:p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Salvos</div>
                          <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">{stat(daySignals.savedCount)}</div>
                          <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                        </div>

                        <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Compromissos</div>
                          <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">
                            {stat(daySignals.commitmentsCount)}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                        </div>

                        <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">Para depois</div>
                          <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">{stat(daySignals.laterCount)}</div>
                          <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
                        </div>
                      </div>

                      <div className="mt-3 text-[12px] text-[#6a6a6a]">
                        Esses números são um retrato do que já existe no sistema — sem te pedir mais nada.
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Link href="/meu-dia" className="btn-primary inline-flex items-center justify-center">
                          Ir para Meu Dia
                        </Link>
                        <Link href="/maternar/meu-filho" className="btn-secondary inline-flex items-center justify-center">
                          Ir para Meu Filho
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* DIVISÓRIA */}
              <div className="mt-7 border-t border-[#f5d7e5]" />

              {/* BLOCO 3 — ORIENTAÇÃO (núcleo) */}
              <section className="pt-7">
                <div className="flex items-start gap-3">
                  <div className="mt-[2px] h-9 w-9 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="info" size={16} className="text-[#b8236b]" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">ORIENTAÇÃO</div>
                    <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56] leading-tight">
                      Hoje, um norte simples
                    </div>

                    {/* Texto principal (sem IA fora do escopo; aqui é orientação curta) */}
                    <div className="mt-2 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed max-w-2xl">
                      {orientation}
                    </div>

                    {/* Linha humana fixa (fallback/âncora) */}
                    <div className="mt-2 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed max-w-2xl">
                      Você não precisa organizar o dia inteiro para seguir. Só o próximo passo.
                    </div>
                  </div>
                </div>
              </section>

              {/* DIVISÓRIA */}
              <div className="mt-7 border-t border-[#f5d7e5]" />

              {/* BLOCO 4 — MICRO CUIDADO (opcional e discreto) */}
              <section className="pt-7">
                <div className="flex items-start gap-3">
                  <div className="mt-[2px] h-9 w-9 rounded-2xl bg-white border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="heart" size={16} className="text-[#b8236b]" />
                  </div>

                  <div className="min-w-0 w-full">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">MICRO CUIDADO</div>
                    <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56] leading-tight">
                      Opcional
                    </div>
                    <div className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a]">{micro}</div>

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
                      <div className="mt-3 text-[12px] text-[#6a6a6a]">Hoje pode ser menos. E ainda assim contar.</div>
                    ) : null}
                  </div>
                </div>
              </section>
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
