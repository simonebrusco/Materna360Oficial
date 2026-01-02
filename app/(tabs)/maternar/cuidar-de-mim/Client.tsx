// app/(tabs)/maternar/cuidar-de-mim/Client.tsx
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
 * P33.4 — ÚNICO PONTO DE IA (ORIENTAÇÃO)
 * - IA pode ser ligada/desligada por flag
 * - Fallback humano fixo obrigatório (hub funciona 100% sem IA)
 *
 * Observação:
 * - Mesmo com IA desligada, mantemos orientação humana determinística (segura),
 *   mas o fallback fixo é sempre o guardrail final para falha/timeout/invalid.
 */
const CARE_GUIDANCE_FALLBACK = 'Agora é um bom momento para simplificar. Um passo já ajuda.'

type CareGuidanceInputs = {
  checkin: Ritmo
  salvosCount: number
  compromissosCount: number
  paraDepoisCount: number
  day: 'hoje'
}

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
  // Fonte oficial
  try {
    save(PERSIST_KEYS.cuidarDeMimRitmo, r)
  } catch {}

  // Compat: espelha no legado enquanto outras telas consumirem isso
  safeSetLS(LEGACY_LS_KEYS.eu360Ritmo, r)
}

/**
 * Salvos e Para depois (real):
 * - Fonte: listMyDayTasks(new Date()) -> lê planner/tasks/YYYY-MM-DD (persist + legado)
 * - Para depois: status === 'snoozed' OU snoozeUntil > todayKey
 */
function readSavedTodayFromCore(todayKey: string): { total: number; later: number } {
  try {
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
function readCommitmentsTodayFromPlanner(todayKey: string): number {
  try {
    const all = load<Appointment[]>('planner/appointments/all', []) ?? []
    if (!Array.isArray(all)) return 0
    return all.filter((a) => a?.dateKey === todayKey).length
  } catch {
    return 0
  }
}

function readDaySignals(todayKey: string): DaySignals {
  const saved = readSavedTodayFromCore(todayKey)
  const commitments = readCommitmentsTodayFromPlanner(todayKey)

  return {
    savedCount: saved.total,
    commitmentsCount: commitments,
    laterCount: saved.later,
  }
}

/**
 * Orientação HUMANA (fallback seguro) — declarativa, sem CTA, sem plano, sem múltiplas opções.
 * Pode ser usada como baseline quando IA está desligada.
 */
function pickOrientationHuman(tone: 'gentil' | 'direto', ritmo: Ritmo, signals: DaySignals): string {
  const saved = signals.savedCount ?? 0
  const commitments = signals.commitmentsCount ?? 0
  const later = signals.laterCount ?? 0

  // Leitura leve (não “score”, só sinal)
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
  if (ritmo === 'confusa') return CARE_GUIDANCE_FALLBACK
  if (ritmo === 'cansada') return heavy ? 'Hoje, manter o básico já é suficiente.' : 'Um passo simples já é suficiente hoje.'
  if (ritmo === 'leve') return hasLoad ? 'Vamos manter leve. Só o que fizer sentido.' : 'Vamos manter leve. Sem pressa.'
  return hasLoad ? 'Você pode seguir sem se cobrar.' : 'Você pode seguir no seu ritmo.'
}

/**
 * Micro cuidado (opcional, nunca protagonista) — não terapêutico, não “exercício”, não lista.
 */
function microCareSuggestion(ritmo: Ritmo, seed: number) {
  const optionsByRitmo: Record<Ritmo, string[]> = {
    confusa: [
      'Se fizer sentido agora: água + 1 minuto em silêncio antes do próximo passo.',
      'Se fizer sentido agora: respira uma vez fundo e segue.',
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

function clampText(s: string, maxLen: number) {
  const t = (s ?? '').trim().replace(/\s+/g, ' ')
  if (!t) return ''
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen).trim()
}

function countSentences(s: string) {
  // Heurística simples: divide por ., !, ? (mantém governança “até 2 frases”)
  const parts = (s ?? '')
    .split(/[.!?]+/g)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length
}

function containsListyPatterns(s: string) {
  const t = s ?? ''
  if (t.includes('\n-') || t.includes('\n•')) return true
  if (/\b(1\)|2\)|3\))/.test(t)) return true
  return false
}

function looksLikeCtaOrPlan(s: string) {
  const t = (s ?? '').toLowerCase()
  // guardrail: bloqueia verbos típicos de instrução/ação direta
  const blocked = [
    'faça',
    'tente',
    'você precisa',
    'você deve',
    'agora faça',
    'comece',
    'liste',
    'planeje',
    'organize',
    'crie',
    'adicione',
    'salve',
    'vá para',
    'clique',
    'toque',
  ]
  return blocked.some((k) => t.includes(k))
}

/**
 * IA (somente ORIENTAÇÃO):
 * - Inputs permitidos: checkin + contagens + day:'hoje'
 * - Output: texto único, até 2 frases, até 220 caracteres, sem listas, sem emojis
 *
 * Nota: endpoint pode não existir ainda — falha -> fallback fixo.
 */
async function fetchCareGuidanceAI(inputs: CareGuidanceInputs, signal?: AbortSignal): Promise<string | null> {
  const AI_ENABLED = process.env.NEXT_PUBLIC_P33_CARE_GUIDANCE_AI === '1'
  if (!AI_ENABLED) return null

  try {
    const res = await fetch('/api/ai/cuidar-de-mim/orientacao', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(inputs),
      signal,
    })

    if (!res.ok) return null
    const data = (await res.json()) as { text?: unknown } | null
    const raw = typeof data?.text === 'string' ? data.text : ''
    const cleaned = clampText(raw, 220)

    // validações de governança
    if (!cleaned) return null
    if (countSentences(cleaned) > 2) return null
    if (containsListyPatterns(cleaned)) return null
    if (cleaned.includes('😀') || cleaned.includes('😂') || cleaned.includes('❤️')) return null // guardrail básico
    if (/[^\x00-\x7F]/.test('') && false) {
      // noop (mantém TS feliz sem “unused” se você quiser estender depois)
    }
    if (looksLikeCtaOrPlan(cleaned)) return null

    return cleaned
  } catch {
    return null
  }
}

export default function Client() {
  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])

  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [microSeed, setMicroSeed] = useState<number>(0)

  // 🔒 Bloco 2 (real)
  const [daySignals, setDaySignals] = useState<DaySignals>(() => ({
    savedCount: 0,
    commitmentsCount: 0,
    laterCount: 0,
  }))

  // 🔒 Bloco 3 (orientação) — pode vir de IA (somente aqui)
  const [guidanceText, setGuidanceText] = useState<string>(CARE_GUIDANCE_FALLBACK)
  const aiAbortRef = useRef<AbortController | null>(null)

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  const tone = useMemo(() => {
    return (euSignal?.tone ?? 'gentil') as 'gentil' | 'direto'
  }, [euSignal?.tone])

  const micro = useMemo(() => microCareSuggestion(ritmo, microSeed), [ritmo, microSeed])

  function refreshSignals(source: string) {
    const next = readDaySignals(todayKey)
    setDaySignals(next)

    try {
      track('cuidar_de_mim.signals.refresh', {
        source,
        saved: next.savedCount,
        commitments: next.commitmentsCount,
        later: next.laterCount,
        todayKey,
      })
    } catch {}
  }

  async function refreshGuidance(reason: string, r: Ritmo, signals: DaySignals) {
    // Sempre temos baseline humano seguro
    const human = pickOrientationHuman(tone, r, signals)

    // Cancela IA anterior
    try {
      aiAbortRef.current?.abort()
    } catch {}
    aiAbortRef.current = new AbortController()

    const inputs: CareGuidanceInputs = {
      checkin: r,
      salvosCount: signals.savedCount ?? 0,
      compromissosCount: signals.commitmentsCount ?? 0,
      paraDepoisCount: signals.laterCount ?? 0,
      day: 'hoje',
    }

    // IA (se ligada) — se falhar: fallback fixo; se desligada: human
    const ai = await fetchCareGuidanceAI(inputs, aiAbortRef.current.signal)

    const next =
      typeof ai === 'string' && ai
        ? ai
        : typeof human === 'string' && human
          ? human
          : CARE_GUIDANCE_FALLBACK

    // Guardrail final: nunca deixa vazio; se der qualquer coisa estranha, fallback fixo
    const safe = clampText(next, 220)
    const finalText = safe && countSentences(safe) <= 2 && !containsListyPatterns(safe) ? safe : CARE_GUIDANCE_FALLBACK

    setGuidanceText(finalText)

    try {
      track('cuidar_de_mim.guidance.refresh', {
        reason,
        usedAi: !!ai,
        tone,
        ritmo: r,
        todayKey,
      })
    } catch {}
  }

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}

    const r = inferRitmo()
    setRitmo(r)

    const s = readDaySignals(todayKey)
    setDaySignals(s)

    // orientação inicial
    void refreshGuidance('mount', r, s)

    try {
      track('cuidar_de_mim.open', { ritmo: r, saved: s.savedCount, commitments: s.commitmentsCount, later: s.laterCount })
    } catch {}

    // 🔒 Refresh real dos dados do Bloco 2 (e orientação) em eventos de “vida real”
    const onFocus = () => {
      const nextSignals = readDaySignals(todayKey)
      setDaySignals(nextSignals)
      void refreshGuidance('focus', r, nextSignals)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        const nextSignals = readDaySignals(todayKey)
        setDaySignals(nextSignals)
        void refreshGuidance('visibility', r, nextSignals)
      }
    }

    const onStorage = (e: StorageEvent) => {
      const k = String(e.key ?? '')
      // persist.ts pode prefixar com "m360:" internamente — então checamos por contains
      const relevant =
        k.includes('planner/appointments/all') ||
        k.includes(`planner/tasks/${todayKey}`) ||
        k.includes(`planner/tasks/`) ||
        k.includes('m360:planner/appointments/all') ||
        k.includes(`m360:planner/tasks/${todayKey}`) ||
        k.includes('cuidar_de_mim.ritmo.v1') ||
        k.includes('eu360_ritmo')

      if (!relevant) return

      const nextSignals = readDaySignals(todayKey)
      setDaySignals(nextSignals)
      // orientação deve reagir ao estado + volume (sem virar template fixo)
      const nextRitmo = inferRitmo()
      setRitmo(nextRitmo)
      void refreshGuidance('storage', nextRitmo, nextSignals)
    }

    // Eventos custom (quando houver)
    const onCustom = () => {
      const nextSignals = readDaySignals(todayKey)
      setDaySignals(nextSignals)
      void refreshGuidance('custom', inferRitmo(), nextSignals)
    }

    try {
      window.addEventListener('focus', onFocus)
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('storage', onStorage)
      window.addEventListener('m360:myday-updated', onCustom as EventListener)
      window.addEventListener('m360:planner-updated', onCustom as EventListener)
    } catch {}

    return () => {
      try {
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('m360:myday-updated', onCustom as EventListener)
        window.removeEventListener('m360:planner-updated', onCustom as EventListener)
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quando ritmo muda por toque, orientação precisa reagir (IA só aqui)
  useEffect(() => {
    void refreshGuidance('ritmo_changed', ritmo, daySignals)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ritmo])

  // Quando contagens mudam (por refresh), orientação reage
  useEffect(() => {
    void refreshGuidance('signals_changed', ritmo, daySignals)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daySignals.savedCount, daySignals.commitmentsCount, daySignals.laterCount])

  function onPickRitmo(next: Ritmo) {
    setRitmo(next)
    setRitmoPersist(next)

    // Mantém counts reais atualizados (pode ter mudado em paralelo)
    refreshSignals('checkin_select')

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

    // Atualiza BLOCO 2 real (sem toast)
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

  // UI microcopy (não IA)
  const lessLine = 'Hoje pode ser menos — e ainda assim conta.'

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

            <h1 className="mt-3 text-[28px] md:text-[34px] font-semibold text-white leading-tight">Cuidar de Mim</h1>

            <p className="mt-1.5 text-sm md:text-base text-white/90 max-w-2xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          {/* CONTAINER PREMIUM (um módulo central forte) */}
          <section className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-[36px] border border-white/35 bg-white/92 shadow-[0_30px_90px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              {/* subtle top sheen */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fff6fb] via-transparent to-transparent opacity-70" />

              {/* inner padding */}
              <div className="relative p-5 md:p-8">
                {/* editorial rail */}
                <div className="relative">
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-[#f5d7e5]" />

                  <div className="space-y-10">
                    {/* BLOCO 1 — CHECK-IN */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-9 w-9 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center shadow-[0_10px_26px_rgba(253,37,151,0.14)]">
                        <AppIcon name="sparkles" size={16} className="text-[#b8236b]" />
                      </div>

                      <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#b8236b]">CHECK-IN</div>
                      <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">Como você está agora?</div>

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
                                  ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                                  : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                              ].join(' ')}
                              aria-label={`Selecionar ritmo ${r}`}
                            >
                              {r}
                            </button>
                          )
                        })}
                      </div>
                    </section>

                    {/* BLOCO 2 — SEU DIA, DO JEITO QUE ESTÁ (coração + premium) */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-9 w-9 rounded-2xl bg-white border border-[#f5d7e5] flex items-center justify-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                        <AppIcon name="list" size={16} className="text-[#b8236b]" />
                      </div>

                      <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#b8236b]">SEU DIA</div>
                      <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">Do jeito que está</div>
                      <div className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a]">
                        Uma visão consolidada, sem agenda e sem cobrança.
                      </div>

                      {/* módulo integrado (não “3 cards jogados”) */}
                      <div className="mt-5 rounded-[28px] border border-[#f5d7e5] bg-gradient-to-b from-[#fff6fb] to-white shadow-[0_18px_55px_rgba(253,37,151,0.10)] overflow-hidden">
                        <div className="p-4 md:p-5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                              <div className="text-[10px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                                Salvos
                              </div>
                              <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.savedCount)}</div>
                              <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas registradas hoje</div>
                            </div>

                            <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                              <div className="text-[10px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                                Compromissos
                              </div>
                              <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">
                                {stat(daySignals.commitmentsCount)}
                              </div>
                              <div className="mt-0.5 text-[12px] text-[#6a6a6a]">no seu planner</div>
                            </div>

                            <div className="rounded-2xl border border-[#f5d7e5] bg-white px-4 py-3">
                              <div className="text-[10px] uppercase tracking-[0.18em] text-[#b8236b] font-semibold">
                                Para depois
                              </div>
                              <div className="mt-1 text-[20px] font-semibold text-[#2f3a56]">{stat(daySignals.laterCount)}</div>
                              <div className="mt-0.5 text-[12px] text-[#6a6a6a]">coisas que podem esperar</div>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col sm:flex-row gap-2">
                            <Link
                              href="/meu-dia"
                              className={[
                                'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold',
                                'bg-[#ff005e] text-white',
                                'shadow-[0_12px_30px_rgba(253,37,151,0.28)] hover:bg-[#e00070] transition',
                              ].join(' ')}
                            >
                              Ir para Meu Dia
                            </Link>

                            <Link
                              href="/maternar/meu-filho"
                              className={[
                                'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold',
                                'border border-[#f5d7e5] bg-white text-[#2f3a56]',
                                'hover:bg-[#fff0f7] transition',
                              ].join(' ')}
                            >
                              Ir para Meu Filho
                            </Link>

                            <button
                              type="button"
                              onClick={() => {
                                refreshSignals('manual_refresh_button')
                                void refreshGuidance('manual_refresh_button', ritmo, readDaySignals(todayKey))
                              }}
                              className={[
                                'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold',
                                'border border-[#f5d7e5] bg-white text-[#6a6a6a]',
                                'hover:bg-[#fff0f7] transition',
                              ].join(' ')}
                              aria-label="Atualizar contagens do dia"
                              title="Atualizar"
                            >
                              Atualizar
                            </button>
                          </div>

                          <div className="mt-3 text-[11px] text-[#6a6a6a]">
                            Esses números são um retrato do que já existe no sistema — sem te pedir mais nada.
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* BLOCO 3 — ORIENTAÇÃO DO DIA (núcleo; IA só aqui) */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-9 w-9 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center shadow-[0_10px_26px_rgba(253,37,151,0.14)]">
                        <AppIcon name="info" size={16} className="text-[#b8236b]" />
                      </div>

                      <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#b8236b]">ORIENTAÇÃO</div>
                      <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">Hoje, um norte simples</div>

                      <div className="mt-2 text-[13px] md:text-[14px] text-[#6a6a6a] leading-relaxed max-w-2xl">
                        {guidanceText}
                      </div>

                      {/* linha humana fixa de apoio (não IA) */}
                      <div className="mt-2 text-[13px] md:text-[14px] text-[#6a6a6a] leading-relaxed max-w-2xl">
                        Você não precisa organizar o dia inteiro para seguir. Só o próximo passo.
                      </div>
                    </section>

                    {/* BLOCO 4 — MICRO CUIDADO (opcional e discreto) */}
                    <section className="relative pl-12">
                      <div className="absolute left-2 top-1.5 h-9 w-9 rounded-2xl bg-white border border-[#f5d7e5] flex items-center justify-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                        <AppIcon name="heart" size={16} className="text-[#b8236b]" />
                      </div>

                      <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#b8236b]">MICRO CUIDADO</div>
                      <div className="mt-1 text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">Opcional</div>

                      <div className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a]">{micro}</div>

                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => saveToMyDay(micro)}
                          className={[
                            'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold',
                            'bg-[#ff005e] text-white',
                            'shadow-[0_12px_30px_rgba(253,37,151,0.28)] hover:bg-[#e00070] transition',
                          ].join(' ')}
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
                          className={[
                            'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold',
                            'border border-[#f5d7e5] bg-white text-[#2f3a56]',
                            'hover:bg-[#fff0f7] transition',
                          ].join(' ')}
                        >
                          Me dá outra opção
                        </button>
                      </div>

                      {euSignal?.showLessLine ? (
                        <div className="mt-3 text-[12px] text-[#6a6a6a]">{lessLine}</div>
                      ) : null}
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8">
            <LegalFooter />
          </div>

          <div className="PageSafeBottom" />
        </div>
      </ClientOnly>
    </main>
  )
}
