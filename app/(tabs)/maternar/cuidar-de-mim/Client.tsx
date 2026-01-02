'use client'

import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * P33.4 — ÚNICO PONTO DE IA (planejamento, não execução)
 * - IA só pode atuar no texto do Bloco 3 (Orientação)
 * - Se falhar, fallback fixo obrigatório
 * - Output: texto único, máx 2 frases, máx 220 chars, sem listas, sem emojis
 */
type CareGuidanceInput = {
  checkin: Ritmo
  salvosCount: number
  compromissosCount: number
  paraDepoisCount: number
  day: 'hoje'
}

type CareGuidance = {
  text: string
}

const CARE_GUIDANCE_FALLBACK = 'Agora é um bom momento para simplificar. Um passo já ajuda.'

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

function clampGuidanceText(raw: string): string {
  const s = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!s) return CARE_GUIDANCE_FALLBACK

  // máx 2 frases (split simples por pontuação comum)
  const parts = s
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)

  let out = parts.join(' ')
  if (!out) out = CARE_GUIDANCE_FALLBACK

  // máx 220 chars
  if (out.length > 220) out = out.slice(0, 220).trim()

  return out
}

/**
 * Implementação atual (sem IA): lógica determinística, mas já “plugável”.
 * Quando a IA for ligada, este ponto vira o call (mantendo o mesmo contrato e fallback).
 */
function getCareGuidance(input: CareGuidanceInput, tone: 'gentil' | 'direto'): CareGuidance {
  try {
    const saved = input.salvosCount ?? 0
    const commitments = input.compromissosCount ?? 0
    const later = input.paraDepoisCount ?? 0

    const loadTotal = saved + commitments + later
    const hasLoad = loadTotal > 0
    const heavy = loadTotal >= 6

    let text = CARE_GUIDANCE_FALLBACK

    if (tone === 'direto') {
      if (input.checkin === 'confusa') text = 'Escolha só um próximo passo real. O resto pode esperar.'
      else if (input.checkin === 'cansada')
        text = heavy ? 'Hoje é dia de manter o básico. Sem decidir tudo agora.' : 'Mantenha o básico. O resto pode esperar.'
      else if (input.checkin === 'leve') text = hasLoad ? 'Siga leve. Só não invente complexidade.' : 'Siga leve. Um passo por vez.'
      else text = hasLoad ? 'Seu dia já está em movimento. Sem se cobrar por “fechar”.' : 'Seu dia não precisa render para valer.'
    } else {
      if (input.checkin === 'confusa') text = 'Agora é um bom momento para simplificar. Um passo já ajuda.'
      else if (input.checkin === 'cansada') text = heavy ? 'Hoje, manter o básico já é suficiente.' : 'Um passo simples já é suficiente hoje.'
      else if (input.checkin === 'leve') text = hasLoad ? 'Vamos manter leve. Só o que fizer sentido.' : 'Vamos manter leve. Sem pressa.'
      else text = hasLoad ? 'Você pode seguir sem se cobrar.' : 'Você pode seguir no seu ritmo.'
    }

    return { text: clampGuidanceText(text) }
  } catch {
    return { text: CARE_GUIDANCE_FALLBACK }
  }
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

  const tone = useMemo(() => (euSignal?.tone ?? 'gentil') as 'gentil' | 'direto', [euSignal?.tone])

  const guidance = useMemo(() => {
    const input: CareGuidanceInput = {
      checkin: ritmo,
      salvosCount: daySignals.savedCount,
      compromissosCount: daySignals.commitmentsCount,
      paraDepoisCount: daySignals.laterCount,
      day: 'hoje',
    }
    return getCareGuidance(input, tone)
  }, [ritmo, daySignals, tone])

  const micro = useMemo(() => microCareSuggestion(ritmo, microSeed), [ritmo, microSeed])

  // ====== Integração real do Bloco 2 (sempre “ao vivo”, sem esforço da usuária) ======
  const lastSignalsRef = useRef<string>('')

  const refreshSignals = React.useCallback((reason: string) => {
    try {
      const s = readDaySignals()
      const sig = `${s.savedCount}|${s.commitmentsCount}|${s.laterCount}`
      if (sig === lastSignalsRef.current) return
      lastSignalsRef.current = sig
      setDaySignals(s)

      try {
        track('cuidar_de_mim.signals.refresh', { reason, saved: s.savedCount, commitments: s.commitmentsCount, later: s.laterCount })
      } catch {}
    } catch {}
  }, [])

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}

    const r = inferRitmo()
    setRitmo(r)

    refreshSignals('mount')

    try {
      const s = readDaySignals()
      track('cuidar_de_mim.open', { ritmo: r, saved: s.savedCount, commitments: s.commitmentsCount, later: s.laterCount })
    } catch {}
  }, [refreshSignals])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onFocus = () => refreshSignals('focus')
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshSignals('visibility')
    }
    const onStorage = () => refreshSignals('storage')

    try {
      window.addEventListener('focus', onFocus)
      document.addEventListener('visibilitychange', onVis)
      window.addEventListener('storage', onStorage)
    } catch {}

    return () => {
      try {
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onVis)
        window.removeEventListener('storage', onStorage)
      } catch {}
    }
  }, [refreshSignals])

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
    if (res?.ok) refreshSignals('save_to_my_day')

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

          {/* HUB CONTAINER (premium, integrado) */}
          <section className="relative">
            <div className="rounded-[28px] border border-white/35 bg-white/90 shadow-[0_26px_90px_rgba(0,0,0,0.22)] backdrop-blur-[6px] overflow-hidden">
              <div className="p-5 md:p-7">
                {/* trilho vertical sutil (sensação de sistema, não widgets) */}
                <div className="relative">
                  <div className="absolute left-[18px] top-[10px] bottom-[10px] w-px bg-[var(--color-soft-strong)]" />

                  <div className="space-y-8">
                    {/* BLOCO 1 — CHECK-IN */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-[var(--color-soft-bg)] border border-[var(--color-soft-strong)] flex items-center justify-center">
                        <AppIcon name="sparkles" size={16} className="text-[var(--color-brand)]" />
                      </div>

                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                        Check-in
                      </p>
                      <h2 className="mt-1 text-[18px] md:text-[20px] font-semibold text-[var(--color-text-main)]">
                        Como você está agora?
                      </h2>

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
                                'outline-none focus:outline-none focus-visible:outline-none',
                                active
                                  ? 'bg-[var(--color-soft-bg)] border-[var(--color-soft-strong)] text-[var(--color-text-main)]'
                                  : 'bg-white border-[var(--color-soft-strong)] text-[var(--color-text-muted)] hover:bg-[var(--color-soft-bg)]',
                              ].join(' ')}
                            >
                              {r}
                            </button>
                          )
                        })}
                      </div>
                    </section>

                    {/* BLOCO 2 — SEU DIA, DO JEITO QUE ESTÁ (módulo central forte) */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-white border border-[var(--color-soft-strong)] flex items-center justify-center">
                        <AppIcon name="list" size={16} className="text-[var(--color-brand)]" />
                      </div>

                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                        Seu dia
                      </p>
                      <h2 className="mt-1 text-[18px] md:text-[20px] font-semibold text-[var(--color-text-main)]">
                        Do jeito que está
                      </h2>
                      <p className="mt-1 text-[12px] md:text-[13px] text-[var(--color-text-muted)]">
                        Uma visão consolidada, sem agenda e sem cobrança.
                      </p>

                      {/* módulo coeso (não 3 cards soltos) */}
                      <div className="mt-4 rounded-[22px] border border-[var(--color-soft-strong)] bg-[var(--color-soft-bg)]/45 p-3 md:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-[var(--color-soft-strong)] bg-white px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-brand)] font-semibold">
                              Salvos
                            </div>
                            <div className="mt-1 text-[20px] font-semibold text-[var(--color-text-main)]">
                              {stat(daySignals.savedCount)}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">coisas registradas hoje</div>
                          </div>

                          <div className="rounded-2xl border border-[var(--color-soft-strong)] bg-white px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-brand)] font-semibold">
                              Compromissos
                            </div>
                            <div className="mt-1 text-[20px] font-semibold text-[var(--color-text-main)]">
                              {stat(daySignals.commitmentsCount)}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">no seu planner</div>
                          </div>

                          <div className="rounded-2xl border border-[var(--color-soft-strong)] bg-white px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-brand)] font-semibold">
                              Para depois
                            </div>
                            <div className="mt-1 text-[20px] font-semibold text-[var(--color-text-main)]">
                              {stat(daySignals.laterCount)}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">coisas que podem esperar</div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <Link
                            href="/meu-dia"
                            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.30)] hover:opacity-95 transition"
                          >
                            Ir para Meu Dia
                          </Link>

                          <Link
                            href="/maternar/meu-filho"
                            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold border border-[var(--color-soft-strong)] bg-white hover:bg-[var(--color-soft-bg)] text-[var(--color-text-main)] transition"
                          >
                            Ir para Meu Filho
                          </Link>
                        </div>
                      </div>
                    </section>

                    {/* BLOCO 3 — ORIENTAÇÃO DO DIA (núcleo, pronto para IA futura) */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-[var(--color-soft-bg)] border border-[var(--color-soft-strong)] flex items-center justify-center">
                        <AppIcon name="info" size={16} className="text-[var(--color-brand)]" />
                      </div>

                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                        Orientação
                      </p>
                      <h2 className="mt-1 text-[18px] md:text-[20px] font-semibold text-[var(--color-text-main)]">
                        Hoje, um norte simples
                      </h2>

                      <p className="mt-2 text-[12px] md:text-[13px] text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
                        {guidance?.text ? clampGuidanceText(guidance.text) : CARE_GUIDANCE_FALLBACK}
                      </p>
                    </section>

                    {/* BLOCO 4 — MICRO CUIDADO (opcional e discreto) */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-white border border-[var(--color-soft-strong)] flex items-center justify-center">
                        <AppIcon name="heart" size={16} className="text-[var(--color-brand)]" />
                      </div>

                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--color-brand)]">
                        Micro cuidado
                      </p>
                      <h2 className="mt-1 text-[18px] md:text-[20px] font-semibold text-[var(--color-text-main)]">Opcional</h2>

                      <p className="mt-1 text-[12px] md:text-[13px] text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
                        {micro}
                      </p>

                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => saveToMyDay(micro)}
                          className="rounded-full px-4 py-2 text-xs font-semibold bg-[var(--color-brand)] text-white shadow-[0_10px_26px_rgba(253,37,151,0.30)] hover:opacity-95 transition"
                        >
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
                          className="rounded-full px-4 py-2 text-xs font-semibold border border-[var(--color-soft-strong)] bg-white hover:bg-[var(--color-soft-bg)] text-[var(--color-text-main)] transition"
                        >
                          Me dá outra opção
                        </button>
                      </div>

                      {euSignal?.showLessLine ? (
                        <p className="mt-3 text-[12px] text-[var(--color-text-muted)]">
                          Hoje pode ser menos — e ainda assim conta.
                        </p>
                      ) : null}
                    </section>
                  </div>
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
