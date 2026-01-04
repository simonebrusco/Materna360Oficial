'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { buildAiContext } from '@/app/lib/ai/buildAiContext'
import AppShell from '@/components/common/AppShell'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import Eu360ProfileCollapsible from '@/components/blocks/Eu360ProfileCollapsible'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import LegalFooter from '@/components/common/LegalFooter'

//  P14
import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getEu360FortnightLine } from '@/app/lib/continuity.client'

//  P23 — Tom por camada de experiência (free sempre gentil)
import { getContinuityTone } from '@/app/lib/experience/continuityTone'

type WeeklyInsight = {
  title: string
  summary: string
  observations: string[]
}

type WeeklyInsightContext = {
  firstName?: string
  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
    todayMissionsDone?: number
  }
  preferences?: {
    toneLabel?: string
    microCopy?: string
    focusHint?: string
    helpStyle?: 'diretas' | 'guiadas' | 'explorar' | undefined
  }
}

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

type Eu360Preferences = {
  toneLabel: string
  microCopy: string
  focusHint?: string
  helpStyle?: 'diretas' | 'guiadas' | 'explorar'
  updatedAtISO: string
  answers: QuestionnaireAnswers
}

// Preferências (não “persona”)
const LS_KEYS = {
  eu360Prefs: 'eu360_prefs_v1',
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

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

//  P14 (dateKey simples, client-only)
function safeDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Derivação qualitativa de preferências (sem “score” e sem rótulo fixo).
 * Objetivo: calibrar tom e foco, não classificar.
 */
function computePrefsFromAnswers(answers: QuestionnaireAnswers) {
  // Tom base: mais acolhedor quanto mais “puxado” o estado relatado
  const feltHeavy =
    answers.q1 === 'exausta' || answers.q1 === 'cansada' || answers.q4 === 'sobrevivencia' || answers.q6 === 'passar' || answers.q6 === 'basico'

  const hasEnergy = answers.q1 === 'energia' || answers.q4 === 'alem' || answers.q6 === 'avancar'

  const focusHintMap: Record<NonNullable<QuestionnaireAnswers['q3']>, string> = {
    tempo: 'tempo e sobrecarga',
    emocional: 'peso emocional',
    organizacao: 'organização leve',
    conexao: 'conexão com seu filho',
    tudo: 'muitas frentes ao mesmo tempo',
  }

  const focusHint = answers.q3 ? focusHintMap[answers.q3] : undefined
  const helpStyle = answers.q5

  // Labels (sem “modo”, sem etiqueta)
  const toneLabel = feltHeavy ? 'Tom mais leve' : hasEnergy ? 'Tom mais claro' : 'Tom gentil'

  // Microcopy coerente com “leitura” (sem empuxo)
  const microCopy = feltHeavy
    ? 'Aqui a prioridade é aliviar o peso: acolhimento primeiro, sem cobrança.'
    : hasEnergy
      ? 'Aqui a ideia é dar clareza sem te empurrar: um retrato honesto do seu momento.'
      : 'Aqui é um espaço de leitura gentil: organizar sentimentos sem virar tarefa.'

  return { toneLabel, microCopy, focusHint, helpStyle }
}

/**
 * P23 — Tom de conversa (invisível):
 * - Free: sempre gentil (seguro, acolhedor)
 * - Premium: respeita o tom real do momento
 */
function refineMicroCopyForTone(input: { base: string; tone: NonNullable<Eu360Signal['tone']> }) {
  const { base, tone } = input
  if (tone !== 'gentil') return base
  // Quando “gentil”, evitamos qualquer sensação de empuxo.
  return base.replace('clareza', 'cuidado').replace('honesto', 'gentil')
}

function readPrefsFromLS(): Eu360Preferences | null {
  const raw = safeGetLS(LS_KEYS.eu360Prefs)
  return safeParseJSON<Eu360Preferences>(raw)
}

function writePrefsToLS(result: Eu360Preferences) {
  safeSetLS(LS_KEYS.eu360Prefs, JSON.stringify(result))

  // Evento neutro: informa atualização de preferências (não “perfil”).
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('eu360:prefs-updated'))
    }
  } catch {
    // nunca quebra o fluxo
  }
}

function StepDot({ active }: { active?: boolean }) {
  return (
    <span
      className={[
        'h-2.5 w-2.5 rounded-full border transition',
        active ? 'bg-white border-white/70' : 'bg-white/25 border-white/35',
      ].join(' ')}
    />
  )
}

function OptionButton({ active, label, onClick }: { active?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-2xl border px-4 py-3 text-[13px] transition',
        active
          ? 'border-[#fd2597] bg-[#ffd8e6] text-[#2f3a56]'
          : 'border-[#f5d7e5] bg-white hover:bg-[#ffe1f1] text-[#2f3a56]',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

async function fetchWeeklyInsight(context: WeeklyInsightContext): Promise<WeeklyInsight> {
  try {
    track('ai.request', {
      feature: 'weekly_overview',
      origin: 'eu360',
      daysWithPlanner: context.stats?.daysWithPlanner ?? null,
      moodCheckins: context.stats?.moodCheckins ?? null,
      unlockedAchievements: context.stats?.unlockedAchievements ?? null,
      todayMissionsDone: context.stats?.todayMissionsDone ?? null,
      toneLabel: context.preferences?.toneLabel ?? null,
      focusHint: context.preferences?.focusHint ?? null,
      helpStyle: context.preferences?.helpStyle ?? null,
    })

    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'weekly_overview',
        origin: 'eu360',
        context,
      }),
    })

    if (!res.ok) throw new Error('Resposta inválida da IA')

    const data = await res.json()
    const insight = data?.weeklyInsight

    if (!insight || typeof insight !== 'object') throw new Error('Insight semanal vazio')

    // Preferimos observations; mantemos fallback para suggestions (compat).
    const observations: string[] =
      (Array.isArray(insight.observations) && insight.observations.length > 0
        ? insight.observations
        : Array.isArray(insight.suggestions) && insight.suggestions.length > 0
          ? insight.suggestions
          : []) as string[]

    return {
      title: insight.title ?? 'Seu resumo emocional da semana',
      summary:
        insight.summary ??
        'Pelos seus registros recentes, esta semana parece ter sido marcada por momentos de cansaço, mas também por pequenos respiros.',
      observations:
        observations.length > 0
          ? observations
          : [
              'Há sinais de que a semana oscilou entre cansaço e momentos em que o essencial foi sustentado.',
              'Mesmo sem perfeição, o que aparece é continuidade possível — do seu jeito, no ritmo que deu.',
            ],
    }
  } catch (error) {
    console.error('[Eu360] Erro ao buscar insight semanal, usando fallback:', error)
    return {
      title: 'Seu resumo emocional da semana',
      summary: 'Mesmo nos dias mais puxados, sempre existe algo pequeno que se manteve. Aqui é só para enxergar isso com mais cuidado.',
      observations: [
        'Parece que você sustentou mais do que percebeu, mesmo com a energia variando.',
        'Quando o dia pesa, o “mínimo possível” também é uma forma de cuidado — e conta.',
      ],
    }
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Eu360Client() {
  const questionnaireRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    track('nav.click', { tab: 'eu360', dest: '/eu360' })
  }, [])

  const { name } = useProfile()
  const firstName = (name || '').split(' ')[0] || 'Você'

  // Mantém placeholder; em seguida você vai alinhar com “Minha Jornada / Minhas Conquistas”.
  const stats = useMemo(
    () => ({
      daysWithPlanner: 7,
      moodCheckins: 4,
      unlockedAchievements: 3,
      todayMissionsDone: 2,
    }),
    [],
  )

  const [weeklyInsight, setWeeklyInsight] = useState<WeeklyInsight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  const [prefsResult, setPrefsResult] = useState<Eu360Preferences | null>(null)
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({})
  const [qStep, setQStep] = useState<number>(1)
  const [saving, setSaving] = useState(false)

  //  P14 — signal + linha quinzenal
  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const [fortnightLine, setFortnightLine] = useState<string | null>(null)
  const dateKey = useMemo(() => safeDateKey(new Date()), [])

  //  P23 — tom resolvido (free sempre gentil; premium respeita)
  const resolvedTone = useMemo(() => {
    return getContinuityTone((euSignal?.tone ?? 'gentil') as any) as NonNullable<Eu360Signal['tone']>
  }, [euSignal?.tone])

  useEffect(() => {
    const saved = readPrefsFromLS()
    if (saved) {
      setPrefsResult(saved)
      setAnswers(saved.answers ?? {})
    }
  }, [])

  const prefsPreview = useMemo(() => {
    const base = computePrefsFromAnswers(answers)
    return {
      toneLabel: base.toneLabel,
      microCopy: refineMicroCopyForTone({ base: base.microCopy, tone: resolvedTone }),
      focusHint: base.focusHint,
      helpStyle: base.helpStyle,
    }
  }, [answers, resolvedTone])

  const totalAnswered = useMemo(() => {
    const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const
    return keys.filter((k) => Boolean(answers[k])).length
  }, [answers])

  // Preferências “resolvidas” para mandar no contexto (salvo > preview)
  const prefsForAi = useMemo(() => {
    if (prefsResult) {
      return {
        toneLabel: prefsResult.toneLabel,
        microCopy: prefsResult.microCopy,
        focusHint: prefsResult.focusHint,
        helpStyle: prefsResult.helpStyle,
      }
    }
    return {
      toneLabel: prefsPreview.toneLabel,
      microCopy: prefsPreview.microCopy,
      focusHint: prefsPreview.focusHint,
      helpStyle: prefsPreview.helpStyle,
    }
  }, [prefsResult, prefsPreview])

  // Re-hidrata signal quando preferências mudarem (storage + custom event)
  useEffect(() => {
    const refresh = () => {
      try {
        setEuSignal(getEu360Signal())
      } catch {
        // nunca quebra
      }
    }

    const onStorage = (_e: StorageEvent) => refresh()
    const onCustom = () => refresh()

    try {
      window.addEventListener('storage', onStorage)
      window.addEventListener('eu360:prefs-updated', onCustom as EventListener)
    } catch {}

    return () => {
      try {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener('eu360:prefs-updated', onCustom as EventListener)
      } catch {}
    }
  }, [])

  //  P14 — calcula linha quinzenal (1x/14 dias)
  useEffect(() => {
    try {
      const line = getEu360FortnightLine({ dateKey, tone: resolvedTone })
      setFortnightLine(line?.text ?? null)
    } catch {
      setFortnightLine(null)
    }
  }, [dateKey, resolvedTone])

  useEffect(() => {
    let isMounted = true

    const loadInsight = async () => {
      setLoadingInsight(true)
      try {
        const result = await fetchWeeklyInsight({
          firstName,
          stats,
          preferences: prefsForAi,
        })
        if (isMounted) setWeeklyInsight(result)
      } finally {
        if (isMounted) setLoadingInsight(false)
      }
    }

    void loadInsight()

    return () => {
      isMounted = false
    }
  }, [firstName, stats, prefsForAi])

  function setAnswer<K extends keyof QuestionnaireAnswers>(key: K, value: NonNullable<QuestionnaireAnswers[K]>) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function canGoNext() {
    const key = `q${qStep}` as keyof QuestionnaireAnswers
    return Boolean(answers[key])
  }

  function goNext() {
    if (!canGoNext()) return
    setQStep((s) => Math.min(6, s + 1))
  }

  function goPrev() {
    setQStep((s) => Math.max(1, s - 1))
  }

  async function finishQuestionnaire() {
    const required: (keyof QuestionnaireAnswers)[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']
    const ok = required.every((k) => Boolean(answers[k]))
    if (!ok) return

    setSaving(true)
    try {
      const computed = computePrefsFromAnswers(answers)

      const result: Eu360Preferences = {
        toneLabel: computed.toneLabel,
        microCopy: computed.microCopy, // base estável; refinamento por tone só na UI
        focusHint: computed.focusHint,
        helpStyle: computed.helpStyle,
        updatedAtISO: new Date().toISOString(),
        answers,
      }

      writePrefsToLS(result)
      setPrefsResult(result)

      try {
        track('eu360.questionario.complete', { answered: 6, helpStyle: computed.helpStyle ?? null, focusHint: computed.focusHint ?? null })
      } catch {}
    } finally {
      setSaving(false)
    }
  }

  function scrollToQuestionnaire() {
    try {
      track('eu360.questionario.cta_click', { origin: 'hero' })
    } catch {}
    questionnaireRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const heroTitle = 'Seu mundo em perspectiva'
  const heroSubtitle = 'Um espaço para o Materna360 entender seu momento e acompanhar com mais leveza, sem cobrança.'

  // (Mantemos como referência futura; não muda fluxo agora)
  void buildAiContext

  const content = (
    <main
      data-layout="page-template-v1"
      data-tab="eu360"
      className="eu360-hub-bg relative min-h-[100dvh] pb-24 overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
        {/* HERO */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-7 text-left">
          <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
            EU360
          </span>

          <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.38)]">
            {heroTitle}
          </h1>

          <p className="mt-2 text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_5px_rgba(0,0,0,0.45)]">
            {heroSubtitle}
          </p>

          {/* HERO GLASS CARD */}
          <div className="mt-4 rounded-3xl border border-white/35 bg-white/12 backdrop-blur-md px-4 py-4 md:px-5 md:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/80">
                  Seu tom por aqui, nesta fase
                </p>

                <div className="mt-2 flex items-start gap-2">
                  <AppIcon name="sparkles" size={18} className="text-white" decorative />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {prefsResult ? prefsResult.toneLabel : prefsPreview.toneLabel}
                    </p>
                    <p className="text-[12px] text-white/85 leading-relaxed">
                      {prefsResult
                        ? refineMicroCopyForTone({ base: prefsResult.microCopy, tone: resolvedTone })
                        : prefsPreview.microCopy}
                    </p>

                    {/*  P15 — continuidade quinzenal (leve, 1x/14 dias) */}
                    {fortnightLine ? (
                      <p className="mt-2 text-[12px] text-white/80 leading-relaxed">{fortnightLine}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <StepDot key={n} active={prefsResult ? n === 6 : n === qStep} />
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (prefsResult) {
                    setPrefsResult(null)
                    setQStep(1)
                    try {
                      track('eu360.questionario.edit', {})
                    } catch {}
                    scrollToQuestionnaire()
                    return
                  }
                  scrollToQuestionnaire()
                }}
                className="rounded-full bg-white/90 hover:bg-white text-[#2f3a56] px-4 py-2 text-[12px] shadow-lg transition inline-flex items-center gap-2"
              >
                <AppIcon name="sparkles" size={16} decorative />
                <span>{prefsResult ? 'Refazer com calma' : 'Fazer quando fizer sentido (2 min)'}</span>
              </button>

              <Link
                href="/meu-dia"
                className="rounded-full bg-[#fd2597] hover:opacity-95 text-white px-4 py-2 text-[12px] shadow-lg transition inline-flex items-center gap-2"
              >
                <span>Ir para Meu Dia</span>
                <AppIcon name="arrow-right" size={16} decorative />
              </Link>
            </div>
          </div>
        </header>

        <div className="space-y-6 md:space-y-7 pb-8">
          {/* 1 — PERFIL (recolhido por padrão) */}
          <Eu360ProfileCollapsible defaultOpen={false} />

          {/* 2 — QUESTIONÁRIO */}
          <div ref={questionnaireRef} />

          <SectionWrapper density="compact">
            <Reveal>
              <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6a6a6a]">
                      Questionário rápido (2 min)
                    </p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#2f3a56] leading-snug">
                      Para o app acompanhar o seu momento real
                    </h2>
                    <p className="mt-1 text-[13px] text-[#6a6a6a] leading-relaxed">
                      Sem teste, sem diagnóstico. Só um jeito simples de reduzir ruído e deixar o Materna360 mais coerente com o seu dia a dia.
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <StepDot key={n} active={prefsResult ? n === 6 : n === qStep} />
                    ))}
                  </div>
                </div>

                {!prefsResult ? (
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/70 px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6a6a6a]">Prévia do tom</p>
                    <div className="mt-1 flex items-start gap-2">
                      <AppIcon name="sparkles" size={18} className="text-[#fd2597]" decorative />
                      <div>
                        <p className="text-sm font-semibold text-[#2f3a56]">{prefsPreview.toneLabel}</p>
                        <p className="text-[12px] text-[#6a6a6a] leading-relaxed">{prefsPreview.microCopy}</p>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-[#6a6a6a]">
                      Progresso: <span className="font-semibold text-[#2f3a56]">{totalAnswered}/6</span>
                    </p>
                  </div>
                ) : null}

                {prefsResult ? (
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fb] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                        <AppIcon name="check" size={18} className="text-[#fd2597]" decorative />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#2f3a56]">Questionário concluído</p>
                        <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                          A partir de agora, o Materna360 pode ajustar o tom e o foco das mensagens para ficar mais coerente com a sua fase — sem te analisar.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {qStep === 1 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">1) Como você tem se sentido na maior parte dos dias?</p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q1 === 'exausta'} label="Exausta" onClick={() => setAnswer('q1', 'exausta')} />
                          <OptionButton
                            active={answers.q1 === 'cansada'}
                            label="Cansada, mas dando conta"
                            onClick={() => setAnswer('q1', 'cansada')}
                          />
                          <OptionButton active={answers.q1 === 'oscilando'} label="Oscilando" onClick={() => setAnswer('q1', 'oscilando')} />
                          <OptionButton
                            active={answers.q1 === 'equilibrada'}
                            label="Mais equilibrada"
                            onClick={() => setAnswer('q1', 'equilibrada')}
                          />
                          <OptionButton
                            active={answers.q1 === 'energia'}
                            label="Com energia para mais"
                            onClick={() => setAnswer('q1', 'energia')}
                          />
                        </div>
                      </div>
                    ) : null}

                    {qStep === 2 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">
                          2) Quanto tempo, de verdade, você costuma ter para você por dia?
                        </p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q2 === 'nenhum'} label="Quase nenhum" onClick={() => setAnswer('q2', 'nenhum')} />
                          <OptionButton active={answers.q2 === '5a10'} label="5 a 10 minutos" onClick={() => setAnswer('q2', '5a10')} />
                          <OptionButton active={answers.q2 === '15a30'} label="15 a 30 minutos" onClick={() => setAnswer('q2', '15a30')} />
                          <OptionButton active={answers.q2 === 'mais30'} label="Mais de 30 minutos" onClick={() => setAnswer('q2', 'mais30')} />
                        </div>
                      </div>
                    ) : null}

                    {qStep === 3 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">3) Hoje, o que mais pesa na sua rotina?</p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q3 === 'tempo'} label="Falta de tempo" onClick={() => setAnswer('q3', 'tempo')} />
                          <OptionButton
                            active={answers.q3 === 'emocional'}
                            label="Cansaço emocional"
                            onClick={() => setAnswer('q3', 'emocional')}
                          />
                          <OptionButton active={answers.q3 === 'organizacao'} label="Organização" onClick={() => setAnswer('q3', 'organizacao')} />
                          <OptionButton
                            active={answers.q3 === 'conexao'}
                            label="Conexão com meu filho"
                            onClick={() => setAnswer('q3', 'conexao')}
                          />
                          <OptionButton active={answers.q3 === 'tudo'} label="Tudo um pouco" onClick={() => setAnswer('q3', 'tudo')} />
                        </div>
                      </div>
                    ) : null}

                    {qStep === 4 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">
                          4) Quando pensa na sua rotina como mãe, o que mais descreve?
                        </p>
                        <div className="grid gap-2">
                          <OptionButton
                            active={answers.q4 === 'sobrevivencia'}
                            label="Sobrevivência"
                            onClick={() => setAnswer('q4', 'sobrevivencia')}
                          />
                          <OptionButton
                            active={answers.q4 === 'organizar'}
                            label="Tentando organizar"
                            onClick={() => setAnswer('q4', 'organizar')}
                          />
                          <OptionButton active={answers.q4 === 'conexao'} label="Buscando conexão" onClick={() => setAnswer('q4', 'conexao')} />
                          <OptionButton
                            active={answers.q4 === 'equilibrio'}
                            label="Encontrando equilíbrio"
                            onClick={() => setAnswer('q4', 'equilibrio')}
                          />
                          <OptionButton active={answers.q4 === 'alem'} label="Querendo ir além" onClick={() => setAnswer('q4', 'alem')} />
                        </div>
                      </div>
                    ) : null}

                    {qStep === 5 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">5) Como você prefere receber ajuda aqui?</p>
                        <div className="grid gap-2">
                          <OptionButton
                            active={answers.q5 === 'diretas'}
                            label="Poucas mensagens, bem diretas"
                            onClick={() => setAnswer('q5', 'diretas')}
                          />
                          <OptionButton
                            active={answers.q5 === 'guiadas'}
                            label="Algumas opções, mas guiadas"
                            onClick={() => setAnswer('q5', 'guiadas')}
                          />
                          <OptionButton active={answers.q5 === 'explorar'} label="Gosto de explorar com calma" onClick={() => setAnswer('q5', 'explorar')} />
                        </div>
                      </div>
                    ) : null}

                    {qStep === 6 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">6) Se hoje fosse um bom dia, o que já seria suficiente?</p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q6 === 'passar'} label="Conseguir passar pelo dia" onClick={() => setAnswer('q6', 'passar')} />
                          <OptionButton
                            active={answers.q6 === 'basico'}
                            label="Cumprir o básico sem culpa"
                            onClick={() => setAnswer('q6', 'basico')}
                          />
                          <OptionButton
                            active={answers.q6 === 'momento'}
                            label="Ter um momento bom com meu filho"
                            onClick={() => setAnswer('q6', 'momento')}
                          />
                          <OptionButton
                            active={answers.q6 === 'organizada'}
                            label="Me sentir mais organizada"
                            onClick={() => setAnswer('q6', 'organizada')}
                          />
                          <OptionButton active={answers.q6 === 'avancar'} label="Avançar um pouco mais" onClick={() => setAnswer('q6', 'avancar')} />
                        </div>
                      </div>
                    ) : null}

                    <div className="pt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={goPrev}
                        disabled={qStep === 1}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Voltar
                      </button>

                      {qStep < 6 ? (
                        <button
                          type="button"
                          onClick={goNext}
                          disabled={!canGoNext()}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Próximo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={finishQuestionnaire}
                          disabled={!canGoNext() || saving}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Salvando…' : 'Concluir'}
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-[#6a6a6a] leading-relaxed">
                      Isso fica salvo como preferências de tom e foco. Você pode refazer quando quiser.
                    </p>
                  </>
                )}
              </SoftCard>
            </Reveal>
          </SectionWrapper>

          {/* 3 — PAINEL DA JORNADA */}
          <SectionWrapper density="compact">
            <Reveal>
              <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6a6a6a]">Painel da sua jornada</p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#2f3a56] leading-snug">
                      Um olhar rápido, sem cobrança
                    </h2>
                    <p className="mt-1 text-[13px] text-[#6a6a6a] leading-relaxed">
                      Aqui é só para enxergar recortes do que apareceu — não é placar e não é cobrança.
                    </p>
                  </div>
                  <AppIcon name="sparkles" className="h-6 w-6 text-[#fd2597] hidden md:block" />
                </div>

                <div className="grid grid-cols-3 gap-2.5 md:gap-4">
                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6a6a6a]">Registros no planner</p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">{stats.daysWithPlanner}</p>
                  </div>
                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6a6a6a]">Check-ins de humor</p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">{stats.moodCheckins}</p>
                  </div>
                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6a6a6a]">Conquistas registradas</p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">{stats.unlockedAchievements}</p>
                  </div>
                </div>

                <SoftCard className="mt-2 rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/80 px-4 py-4 md:px-5 md:py-5 shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <AppIcon name="heart" size={20} className="text-[#fd2597]" decorative />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-[#6a6a6a] uppercase tracking-[0.16em]">
                          Olhar carinhoso sobre a sua semana
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] leading-snug">
                          {weeklyInsight?.title || 'Seu resumo emocional da semana'}
                        </h3>
                        <p className="text-[11px] text-[#6a6a6a] leading-relaxed">
                          {firstName}, este espaço é para leitura: enxergar seus últimos dias com mais gentileza — sem pendência.
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 space-y-2.5">
                      {loadingInsight ? (
                        <p className="text-sm text-[#6a6a6a] leading-relaxed">
                          Estou olhando com carinho para a sua semana para trazer uma leitura…
                        </p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-[#2f3a56]">
                            {weeklyInsight?.summary ??
                              'Mesmo nos dias mais puxados, sempre existe algo pequeno que se manteve. Aqui é só para enxergar isso com mais cuidado.'}
                          </p>

                          {weeklyInsight?.observations && weeklyInsight.observations.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold text-[#6a6a6a] uppercase tracking-[0.16em]">
                                Observações, sem cobrança
                              </p>
                              <ul className="space-y-1.5 text-sm text-[#2f3a56]">
                                {weeklyInsight.observations.map((item, idx) => (
                                  <li key={idx}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <p className="text-[11px] text-[#6a6a6a] mt-2 leading-relaxed">
                            Isso não é diagnóstico e não é plano. É só um retrato gentil do que apareceu — e pode ficar por isso mesmo.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </SoftCard>
              </SoftCard>
            </Reveal>
          </SectionWrapper>

          {/* 4 — BANNER DE PLANOS */}
          <SectionWrapper density="compact">
            <Reveal>
              <SoftCard className="rounded-3xl border border-white/60 bg-[radial-gradient(circle_at_top_left,#fd2597_0,#b8236b_45%,#fdbed7_100%)] px-6 py-6 md:px-8 md:py-7 shadow-[0_24px_60px_rgba(0,0,0,0.32)] text-white overflow-hidden relative">
                <div className="absolute -right-20 -bottom-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="space-y-2 max-w-xl">
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/80">Materna360+</p>
                    <h2 className="text-xl md:text-2xl font-semibold leading-snug text-white">
                      Um apoio a mais, quando você quiser
                    </h2>
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      Conteúdos e recursos extras para aprofundar o cuidado com você, com a sua rotina e com a sua família — no seu tempo.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <Link href="/planos">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-6 py-2 rounded-full text-sm font-semibold bg-white text-[#fd2597] shadow-[0_10px_26px_rgba(0,0,0,0.24)] hover:bg-[#ffe1f1] transition-colors"
                      >
                        Conhecer os planos
                      </button>
                    </Link>
                    <p className="text-[11px] text-white/85 md:text-right max-w-xs">
                      Planos pensados para fases diferentes — você escolhe o que faz sentido agora.
                    </p>
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </SectionWrapper>
        </div>
      </div>

      <LegalFooter />
    </main>
  )

  return (
    <AppShell>
      <ClientOnly>{content}</ClientOnly>
    </AppShell>
  )
}
