// app/(tabs)/eu360/Eu360Client.tsx
'use client'

import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { useProfile } from '@/app/hooks/useProfile'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type EuTone = 'gentil' | 'direto'

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

type Eu360PreferencesLS = {
  toneLabel?: string
  microCopy?: string
  focusHint?: string
  helpStyle?: 'diretas' | 'guiadas' | 'explorar'
  updatedAtISO?: string
  answers?: QuestionnaireAnswers
}

const LS_KEY_PREFS = 'eu360_prefs_v1'

// ----------------------
// Safe LocalStorage
// ----------------------
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

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// ----------------------
// State mapping (5 estados)
// ----------------------
type StateId = NonNullable<QuestionnaireAnswers['q1']>

type StateCard = {
  stateId: StateId
  label: string
  micro: string
  tone: EuTone
  listLimit: number
  showLessLine: boolean
}

const STATE_CARDS: Record<StateId, StateCard> = {
  exausta: {
    stateId: 'exausta',
    label: 'Sobrevivência',
    micro: 'Agora a prioridade é reduzir o peso: acolhimento primeiro, sem cobrança.',
    tone: 'gentil',
    listLimit: 3,
    showLessLine: true,
  },
  cansada: {
    stateId: 'cansada',
    label: 'Respirar e ajustar',
    micro: 'Um passo pequeno já é suficiente. Vamos no ritmo possível.',
    tone: 'gentil',
    listLimit: 4,
    showLessLine: true,
  },
  oscilando: {
    stateId: 'oscilando',
    label: 'Oscilando',
    micro: 'Alguns dias rendem, outros não. Aqui você não precisa fingir constância.',
    tone: 'gentil',
    listLimit: 5,
    showLessLine: false,
  },
  equilibrada: {
    stateId: 'equilibrada',
    label: 'Equilíbrio',
    micro: 'Dá para organizar com clareza, sem aumentar a cobrança.',
    tone: 'direto',
    listLimit: 6,
    showLessLine: false,
  },
  energia: {
    stateId: 'energia',
    label: 'Expansão',
    micro: 'Há energia para ir além, sem perder o cuidado.',
    tone: 'direto',
    listLimit: 7,
    showLessLine: false,
  },
}

function getDefaultPrefs(): Eu360PreferencesLS {
  return {
    updatedAtISO: new Date().toISOString(),
    helpStyle: 'guiadas',
    answers: {},
  }
}

function readPrefs(): Eu360PreferencesLS {
  const raw = safeGetLS(LS_KEY_PREFS)
  const parsed = safeParseJSON<Eu360PreferencesLS>(raw)
  return parsed && typeof parsed === 'object' ? parsed : getDefaultPrefs()
}

function writePrefs(next: Eu360PreferencesLS) {
  safeSetLS(LS_KEY_PREFS, JSON.stringify(next))
  try {
    // sinal para a UX reagir (Meu Dia / Planner / etc.)
    window.dispatchEvent(new Event('eu360:persona-updated'))
  } catch {}
}

// ----------------------
// UI helpers
// ----------------------
function getFirstName(fullName: string | null | undefined) {
  const n = (fullName ?? '').trim()
  if (!n) return ''
  return n.split(/\s+/)[0] ?? ''
}

function clampProgress(currentIdx: number, total: number) {
  const t = Math.max(1, total)
  return Math.min(t, Math.max(1, currentIdx))
}

const QUESTIONS_ORDER: Array<keyof QuestionnaireAnswers> = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']

function answeredCount(a?: QuestionnaireAnswers) {
  const ans = a ?? {}
  return QUESTIONS_ORDER.reduce((acc, k) => (ans[k] ? acc + 1 : acc), 0)
}

// ----------------------
// Component
// ----------------------
export default function Eu360Client() {
  const { name } = useProfile()
  const firstName = useMemo(() => getFirstName(name), [name])

  const [prefs, setPrefs] = useState<Eu360PreferencesLS>(() => readPrefs())
  const [activeIdx, setActiveIdx] = useState<number>(() => {
    const cnt = answeredCount(readPrefs().answers)
    return clampProgress(cnt + 1, QUESTIONS_ORDER.length)
  })

  const todayKey = useMemo(() => getBrazilDateKey(new Date()), [])
  const questionnaireRef = useRef<HTMLDivElement | null>(null)

  const stateId: StateId | null = (prefs?.answers?.q1 as StateId | undefined) ?? null
  const stateCard: StateCard | null = stateId ? STATE_CARDS[stateId] : null

  // tracking open
  useEffect(() => {
    try {
      track('nav.click', { tab: 'eu360', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  // sync if LS changes elsewhere
  useEffect(() => {
    const sync = () => setPrefs(readPrefs())
    try {
      window.addEventListener('storage', sync)
      window.addEventListener('eu360:persona-updated', sync as EventListener)
    } catch {}
    return () => {
      try {
        window.removeEventListener('storage', sync)
        window.removeEventListener('eu360:persona-updated', sync as EventListener)
      } catch {}
    }
  }, [])

  const setAnswer = useCallback(
    <K extends keyof QuestionnaireAnswers>(key: K, value: NonNullable<QuestionnaireAnswers[K]>) => {
      setPrefs((prev) => {
        const base = prev && typeof prev === 'object' ? prev : getDefaultPrefs()
        const next: Eu360PreferencesLS = {
          ...base,
          updatedAtISO: new Date().toISOString(),
          answers: { ...(base.answers ?? {}), [key]: value } as QuestionnaireAnswers,
        }

        // Derivados leves (para leitura humana no Eu360; sinais do app ficam no eu360Signals.client.ts)
        if (key === 'q1') {
          const s = STATE_CARDS[value as StateId]
          next.toneLabel = s.tone === 'gentil' ? 'Tom mais leve' : 'Tom mais direto'
          next.microCopy = s.micro
          next.focusHint = s.label
        }

        // helpStyle: espelha q5
        if (key === 'q5') {
          next.helpStyle = value as Eu360PreferencesLS['helpStyle']
        }

        writePrefs(next)

        try {
          track('eu360.answer_set', { key, value, dateKey: todayKey })
        } catch {}

        return next
      })

      // avança UI
      setActiveIdx((prev) => {
        const nextIdx = Math.min(prev + 1, QUESTIONS_ORDER.length)
        return nextIdx
      })
    },
    [todayKey],
  )

  const scrollToQuestionnaire = useCallback(() => {
    try {
      questionnaireRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {}
  }, [])

  const progressText = useMemo(() => {
    const cnt = answeredCount(prefs?.answers)
    return `${cnt}/${QUESTIONS_ORDER.length}`
  }, [prefs?.answers])

  const currentKey = QUESTIONS_ORDER[Math.max(0, activeIdx - 1)] ?? 'q1'

  // ---------- UI blocks ----------
  return (
    <main
      data-layout="page-template-v1"
      data-tab="eu360"
      className="
        eu360-hub-bg
        relative min-h-[100dvh]
        pb-24
        flex flex-col
        overflow-hidden
      "
    >
      <div className="page-shell relative z-10 flex-1 w-full">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            EU360
          </span>

          <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">
            Seu mundo em perspectiva
          </h1>

          <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl lg:max-w-3xl">
            Um espaço de leitura, não de cobrança.
          </p>

          {firstName ? (
            <p className="mt-2 text-[12px] md:text-[13px] text-white/85 max-w-2xl lg:max-w-3xl leading-relaxed">
              {firstName}, você pode preencher isso aos poucos. O app se ajusta com leveza.
            </p>
          ) : (
            <p className="mt-2 text-[12px] md:text-[13px] text-white/85 max-w-2xl lg:max-w-3xl leading-relaxed">
              Você pode preencher isso aos poucos. O app se ajusta com leveza.
            </p>
          )}
        </header>

        {/* CARD — ESTADO ATUAL */}
        <section
          className="
            bg-white
            rounded-3xl
            p-6
            shadow-[0_6px_22px_rgba(0,0,0,0.06)]
            border border-[#F5D7E5]
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#6A6A6A]">
                Seu estado atual
              </p>

              <h2 className="mt-2 text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">
                {stateCard ? stateCard.label : 'Sem pressa'}
              </h2>

              <p className="mt-1 text-[13px] md:text-[14px] text-[#545454] leading-relaxed max-w-3xl">
                {stateCard ? stateCard.micro : 'Quando você quiser, responda ao questionário rápido. Ele só ajusta o ritmo do app.'}
              </p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: QUESTIONS_ORDER.length }).map((_, i) => {
                  const filled = i < answeredCount(prefs?.answers)
                  return (
                    <span
                      key={i}
                      className={[
                        'h-2 w-2 rounded-full',
                        filled ? 'bg-[#fd2597]' : 'bg-[#ffd8e6] border border-[#F5D7E5]',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                  )
                })}
              </div>

              <button
                type="button"
                onClick={scrollToQuestionnaire}
                className="
                  inline-flex items-center gap-2
                  rounded-full
                  bg-white
                  border border-[#F5D7E5]
                  px-4 py-2
                  text-[12px]
                  font-semibold
                  text-[#2f3a56]
                  hover:bg-[#fff3f8]
                  transition
                "
              >
                <AppIcon name="edit" size={14} className="text-[#fd2597]" />
                Preencher agora
              </button>
            </div>
          </div>
        </section>

        {/* PERFIL (leve, sem pressão) */}
        <section
          className="
            mt-6 md:mt-8
            bg-white
            rounded-3xl
            p-6
            shadow-[0_6px_22px_rgba(0,0,0,0.06)]
            border border-[#F5D7E5]
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#6A6A6A]">Seu perfil</p>
              <h3 className="mt-2 text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">Sobre você (sem pressa)</h3>
              <p className="mt-1 text-[13px] md:text-[14px] text-[#545454] leading-relaxed">
                Isso ajuda o app a ajustar o tom e as sugestões para a sua rotina real.
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToQuestionnaire}
              className="
                inline-flex items-center gap-2
                rounded-full
                bg-[#ffe1f1]
                border border-[#F5D7E5]
                px-4 py-2
                text-[12px]
                font-semibold
                text-[#2f3a56]
                hover:bg-[#ffd8e6]
                transition
                shrink-0
              "
            >
              <AppIcon name="sparkles" size={14} className="text-[#fd2597]" />
              Ajustar agora
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-[#F5D7E5] bg-[#fff7fb] px-4 py-3">
            <p className="text-[12px] text-[#545454]">
              Você pode preencher isso aos poucos. Não é obrigatório agora — mas ajuda o Materna360 a ficar mais do seu jeito.
            </p>
          </div>
        </section>

        {/* QUESTIONÁRIO */}
        <section
          ref={questionnaireRef}
          className="
            mt-6 md:mt-8
            bg-white
            rounded-3xl
            p-6
            shadow-[0_6px_22px_rgba(0,0,0,0.06)]
            border border-[#F5D7E5]
          "
        >
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#6A6A6A]">
            Questionário rápido (2 min)
          </p>

          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">
                Para o app acompanhar o seu momento real
              </h3>
              <p className="mt-1 text-[13px] md:text-[14px] text-[#545454] leading-relaxed">
                Sem teste, sem diagnóstico. Só um jeito simples de reduzir ruído e deixar o Materna360 mais coerente com o seu dia a dia.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[11px] text-[#6A6A6A]">Progresso: {progressText}</p>
            </div>
          </div>

          {/* Prévia do tom / estado (derivada do q1) */}
          <div className="mt-4 rounded-2xl border border-[#F5D7E5] bg-[#fff3f8] px-4 py-3">
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#6A6A6A]">Prévia do tom</p>
            <div className="mt-1 flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white border border-[#F5D7E5]">
                <AppIcon name="sparkles" size={16} className="text-[#fd2597]" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#2f3a56]">
                  {prefs?.toneLabel ? prefs.toneLabel : 'Tom mais leve'}
                </p>
                <p className="text-[12px] text-[#545454] leading-relaxed">
                  {prefs?.microCopy
                    ? prefs.microCopy
                    : 'Aqui a prioridade é aliviar o peso: acolhimento primeiro, sem cobrança.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4" ref={questionnaireRef}>
            {/* Q1 */}
            <div
              className={[
                'rounded-2xl border border-[#F5D7E5] p-4',
                currentKey === 'q1' ? 'bg-white' : 'bg-white/70',
              ].join(' ')}
            >
              <p className="text-[12px] font-semibold text-[#2f3a56]">
                1) Como você tem se sentido na maior parte dos dias?
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: 'exausta', label: 'Exausta' },
                  { id: 'cansada', label: 'Cansada' },
                  { id: 'oscilando', label: 'Oscilando' },
                  { id: 'equilibrada', label: 'Equilibrada' },
                  { id: 'energia', label: 'Com energia' },
                ] as const).map((opt) => {
                  const selected = prefs?.answers?.q1 === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswer('q1', opt.id)}
                      className={[
                        'rounded-2xl px-4 py-3 text-left border transition',
                        selected
                          ? 'bg-[#fd2597] text-white border-[#fd2597] shadow-[0_10px_26px_rgba(253,37,151,0.25)]'
                          : 'bg-white text-[#2f3a56] border-[#F5D7E5] hover:bg-[#fff3f8] hover:border-[#fd2597]/40',
                      ].join(' ')}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                      <span className="block mt-0.5 text-[11px] opacity-85">
                        {STATE_CARDS[opt.id].micro}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Q2 */}
            <div className="rounded-2xl border border-[#F5D7E5] p-4 bg-white/70">
              <p className="text-[12px] font-semibold text-[#2f3a56]">
                2) Quanto tempo, em média, você tem para um “respiro” no dia?
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: 'nenhum', label: 'Quase nenhum' },
                  { id: '5a10', label: '5 a 10 min' },
                  { id: '15a30', label: '15 a 30 min' },
                  { id: 'mais30', label: 'Mais de 30 min' },
                ] as const).map((opt) => {
                  const selected = prefs?.answers?.q2 === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswer('q2', opt.id)}
                      className={[
                        'rounded-2xl px-4 py-3 text-left border transition',
                        selected
                          ? 'bg-[#ffe1f1] text-[#2f3a56] border-[#fd2597]/35'
                          : 'bg-white text-[#2f3a56] border-[#F5D7E5] hover:bg-[#fff3f8] hover:border-[#fd2597]/40',
                      ].join(' ')}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Q3 */}
            <div className="rounded-2xl border border-[#F5D7E5] p-4 bg-white/70">
              <p className="text-[12px] font-semibold text-[#2f3a56]">
                3) O que mais pesa hoje?
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: 'tempo', label: 'Falta de tempo' },
                  { id: 'emocional', label: 'Peso emocional' },
                  { id: 'organizacao', label: 'Organização da rotina' },
                  { id: 'conexao', label: 'Conexão com meu filho(a)' },
                  { id: 'tudo', label: 'Um pouco de tudo' },
                ] as const).map((opt) => {
                  const selected = prefs?.answers?.q3 === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswer('q3', opt.id)}
                      className={[
                        'rounded-2xl px-4 py-3 text-left border transition',
                        selected
                          ? 'bg-[#ffe1f1] text-[#2f3a56] border-[#fd2597]/35'
                          : 'bg-white text-[#2f3a56] border-[#F5D7E5] hover:bg-[#fff3f8] hover:border-[#fd2597]/40',
                      ].join(' ')}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Q4 */}
            <div className="rounded-2xl border border-[#F5D7E5] p-4 bg-white/70">
              <p className="text-[12px] font-semibold text-[#2f3a56]">
                4) O que você mais precisa agora?
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: 'sobrevivencia', label: 'Sobreviver sem culpa' },
                  { id: 'organizar', label: 'Organizar o essencial' },
                  { id: 'conexao', label: 'Mais conexão' },
                  { id: 'equilibrio', label: 'Equilíbrio e constância leve' },
                  { id: 'alem', label: 'Ir além com calma' },
                ] as const).map((opt) => {
                  const selected = prefs?.answers?.q4 === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswer('q4', opt.id)}
                      className={[
                        'rounded-2xl px-4 py-3 text-left border transition',
                        selected
                          ? 'bg-[#ffe1f1] text-[#2f3a56] border-[#fd2597]/35'
                          : 'bg-white text-[#2f3a56] border-[#F5D7E5] hover:bg-[#fff3f8] hover:border-[#fd2597]/40',
                      ].join(' ')}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Q5 */}
            <div className="rounded-2xl border border-[#F5D7E5] p-4 bg-white/70">
              <p className="text-[12px] font-semibold text-[#2f3a56]">
                5) Como você prefere receber ajuda?
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: 'diretas', label: 'Diretas (sem opções)' },
                  { id: 'guiadas', label: 'Guiadas (passo a passo)' },
                  { id: 'explorar', label: 'Explorar (mais ideias)' },
                ] as const).map((opt) => {
                  const selected = prefs?.answers?.q5 === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswer('q5', opt.id)}
                      className={[
                        'rounded-2xl px-4 py-3 text-left border transition',
                        selected
                          ? 'bg-[#ffe1f1] text-[#2f3a56] border-[#fd2597]/35'
                          : 'bg-white text-[#2f3a56] border-[#F5D7E5] hover:bg-[#fff3f8] hover:border-[#fd2597]/40',
                      ].join(' ')}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Q6 */}
            <div className="rounded-2xl border border-[#F5D7E5] p-4 bg-white/70">
              <p className="text-[12px] font-semibold text-[#2f3a56]">
                6) O que você quer que o app faça por você agora?
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { id: 'passar', label: 'Só me acompanhar' },
                  { id: 'basico', label: 'Me ajudar com o básico' },
                  { id: 'momento', label: 'Ajustar ao meu momento' },
                  { id: 'organizada', label: 'Me deixar mais organizada' },
                  { id: 'avancar', label: 'Me ajudar a avançar' },
                ] as const).map((opt) => {
                  const selected = prefs?.answers?.q6 === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAnswer('q6', opt.id)}
                      className={[
                        'rounded-2xl px-4 py-3 text-left border transition',
                        selected
                          ? 'bg-[#ffe1f1] text-[#2f3a56] border-[#fd2597]/35'
                          : 'bg-white text-[#2f3a56] border-[#F5D7E5] hover:bg-[#fff3f8] hover:border-[#fd2597]/40',
                      ].join(' ')}
                    >
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fb] px-4 py-3">
              <p className="text-[12px] text-[#545454] leading-relaxed">
                Tudo que você marcou aqui serve para o Materna360 ajustar <strong>tom</strong> e <strong>ritmo</strong>.
                Não é teste, não é avaliação, não é “certo ou errado”.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 w-full text-center pt-4 pb-2 px-4 text-[12px] text-[#6A6A6A]/85">
        <p> 2025 Materna360. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
