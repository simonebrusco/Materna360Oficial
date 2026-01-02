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
import { load, save } from '@/app/lib/persist'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'confusa' | 'ok'

/**
 * Governança:
 * - Cuidar de Mim é a “casa oficial” do check-in (estado emocional).
 * - Não usamos Eu360 como storage de estado do dia (Eu360 é “espelho”).
 * - Mantemos compat com legado eu360_ritmo, mas a escrita passa a ser em persist (m360: prefix).
 */
const PERSIST_KEYS = {
  cuidarDeMimRitmo: 'cuidar_de_mim.ritmo.v1',
  myDaySavedDailyCounterPrefix: 'my_day.saved_counter.v1.', // + YYYY-MM-DD
} as const

const LEGACY_LS_KEYS = {
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
  // compat antigo
  if (raw === 'sobrecarregada') return 'cansada'
  if (raw === 'animada') return 'ok'

  // default seguro (sem culpa)
  return 'cansada'
}

function setRitmoPersist(r: Ritmo) {
  try {
    save(PERSIST_KEYS.cuidarDeMimRitmo, r)
  } catch {}
}

/**
 * Contagem real mínima (v1): "Salvos hoje"
 * Estratégia incremental e segura:
 * - Não tenta “adivinhar” estruturas internas do Meu Dia.
 * - Atualiza o contador quando algo é salvo a partir daqui (created=true).
 * - Mostra um número real (não “—”), cumprindo a entrega v1.
 *
 * Observação de governança:
 * - Isso é “mínimo viável” para interligação perceptível.
 * - A contagem global (incluindo saves do Meu Dia, Meu Dia Leve etc.) pode vir na v2,
 *   quando conectarmos com o storage real do core sem heurística.
 */
function todayKey(): string {
  // YYYY-MM-DD local
  const d = new Date()
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function dailySavedCounterKey(): string {
  return `${PERSIST_KEYS.myDaySavedDailyCounterPrefix}${todayKey()}`
}

function readSavedTodayCounter(): number {
  try {
    const n = load<number>(dailySavedCounterKey())
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function bumpSavedTodayCounter() {
  try {
    const cur = readSavedTodayCounter()
    save(dailySavedCounterKey(), cur + 1)
  } catch {}
}

type DaySignals = {
  savedCount: number
  commitmentsCount: number | null
  laterCount: number | null
}

function readDaySignalsV1(): DaySignals {
  return {
    savedCount: readSavedTodayCounter(),
    commitmentsCount: null,
    laterCount: null,
  }
}

function pickOrientation(tone: 'gentil' | 'direto', ritmo: Ritmo, signals: DaySignals) {
  const hasSaved = (signals.savedCount ?? 0) > 0

  // Direto (Eu360)
  if (tone === 'direto') {
    if (ritmo === 'confusa') return hasSaved ? 'Escolha só um próximo passo real. O resto pode esperar.' : 'Escolha um próximo passo real. O resto pode esperar.'
    if (ritmo === 'cansada') return hasSaved ? 'Hoje é dia de manter o básico. Sem decidir tudo agora.' : 'Mantenha o básico. O resto pode esperar.'
    if (ritmo === 'leve') return hasSaved ? 'Siga leve. Só não invente complexidade.' : 'Siga leve. Sem inventar complexidade.'
    return hasSaved ? 'Seu dia já está em movimento. Sem se cobrar por “fechar”.' : 'Seu dia não precisa render para valer.'
  }

  // Gentil (padrão)
  if (ritmo === 'confusa') return hasSaved ? 'Agora é um bom momento para simplificar. Um passo já ajuda.' : 'Agora é um bom momento para simplificar. Um passo já ajuda.'
  if (ritmo === 'cansada') return hasSaved ? 'Um passo simples já é suficiente hoje.' : 'Um passo simples já é suficiente hoje.'
  if (ritmo === 'leve') return hasSaved ? 'Vamos manter leve. Só o que fizer sentido.' : 'Vamos manter leve. Só o que fizer sentido.'
  return hasSaved ? 'Você pode seguir sem se cobrar.' : 'Você pode seguir sem se cobrar.'
}

function microCareSuggestion(ritmo: Ritmo, seed: number) {
  // Micro cuidado opcional — curto, adulto, não terapêutico.
  // seed rotaciona sem salvar automaticamente.
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
  const [savedToday, setSavedToday] = useState<number>(0)

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  const daySignals = useMemo(() => {
    try {
      const s = readDaySignalsV1()
      return s
    } catch {
      return { savedCount: 0, commitmentsCount: null, laterCount: null }
    }
  }, [savedToday])

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

    // v1: carregar contador real mínimo
    const c = readSavedTodayCounter()
    setSavedToday(c)

    try {
      track('cuidar_de_mim.open', { ritmo: r, savedToday: c })
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

    // v1: contador real mínimo (somente quando criou)
    if (res.created) {
      bumpSavedTodayCounter()
      const c = readSavedTodayCounter()
      setSavedToday(c)
    }

    try {
      track('cuidar_de_mim.save_to_my_day', {
        origin,
        created: res.created,
        dateKey: res.dateKey,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}
  }

  const stat = (n: number | null) => (typeof n === 'number' ? String(n) : '—')

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="relative min-h-[100dvh] pb-24 overflow-hidden"
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

            <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">
              Cuidar de Mim
            </h1>

            <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          {/* HUB CONTAINER (um bloco único, integrado) */}
          <section className="hub-shell">
            <div className="hub-shell-inner">
              {/* RAIL (integração visual) */}
              <div className="relative">
                <div className="absolute left-[18px] top-[6px] bottom-[6px] w-px bg-[#f5d7e5]" />

                <div className="space-y-8">
                  {/* BLOCO 1 — CHECK-IN */}
                  <section className="relative pl-12">
                    <div className="absolute left-2 top-1.5 h-8 w-8 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center">
                      <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                    </div>

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

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                          Salvos
                        </div>
                        <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">
                          {String(savedToday)}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                      </div>

                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                          Compromissos
                        </div>
                        <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">
                          {stat(daySignals.commitmentsCount)}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                      </div>

                      <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-[#b8236b] font-semibold">
                          Para depois
                        </div>
                        <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">
                          {stat(daySignals.laterCount)}
                        </div>
                        <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col sm:flex-row gap-2">
                      <Link href="/meu-dia" className="btn-primary inline-flex items-center justify-center">
                        Ir para Meu Dia
                      </Link>
                      <Link
                        href="/maternar/meu-filho"
                        className="btn-secondary inline-flex items-center justify-center"
                      >
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
                    <div className="hub-title">Hoje, um norte simples</div>

                    <div className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed max-w-2xl">
                      {orientation}
                    </div>

                    <div className="mt-2 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed max-w-2xl">
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

                      {/* Agora é rotação silenciosa (não salva) */}
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
