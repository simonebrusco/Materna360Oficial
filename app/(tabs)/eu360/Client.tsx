'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

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

type WeeklyInsight = {
  title: string
  summary: string
  suggestions: string[]
}

type WeeklyInsightContext = {
  firstName?: string
  stats?: {
    daysWithPlanner?: number
    moodCheckins?: number
    unlockedAchievements?: number
    todayMissionsDone?: number
  }
  persona?: {
    id?: string
    label?: string
    microCopy?: string
  }
}

type PersonaId = 'sobrevivencia' | 'organizacao' | 'conexao' | 'equilibrio' | 'expansao'

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

type PersonaResult = {
  persona: PersonaId
  label: string
  microCopy: string
  updatedAtISO: string
  answers: QuestionnaireAnswers
}

const LS_KEYS = {
  eu360Persona: 'eu360_persona_v1',
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

function computePersona(answers: QuestionnaireAnswers): PersonaId {
  let score = 0

  if (answers.q1 === 'exausta') score -= 4
  if (answers.q1 === 'cansada') score -= 2
  if (answers.q1 === 'oscilando') score -= 1
  if (answers.q1 === 'equilibrada') score += 1
  if (answers.q1 === 'energia') score += 3

  if (answers.q2 === 'nenhum') score -= 3
  if (answers.q2 === '5a10') score -= 2
  if (answers.q2 === '15a30') score += 0
  if (answers.q2 === 'mais30') score += 1

  if (answers.q4 === 'sobrevivencia') score -= 4
  if (answers.q4 === 'organizar') score -= 1
  if (answers.q4 === 'conexao') score += 0
  if (answers.q4 === 'equilibrio') score += 2
  if (answers.q4 === 'alem') score += 4

  if (answers.q3 === 'emocional') score -= 1
  if (answers.q3 === 'tudo') score -= 2
  if (answers.q3 === 'organizacao') score -= 1
  if (answers.q3 === 'conexao') score += 0
  if (answers.q3 === 'tempo') score -= 1

  if (score <= -5) return 'sobrevivencia'
  if (score <= -2) return 'organizacao'
  if (score <= 1) return 'conexao'
  if (score <= 4) return 'equilibrio'
  return 'expansao'
}

function personaCopy(persona: PersonaId) {
  switch (persona) {
    case 'sobrevivencia':
      return {
        label: 'Modo sobrevivência',
        microCopy: 'Aqui a regra é simples: menos cobrança, mais respiro. Vamos pelo possível.',
      }
    case 'organizacao':
      return {
        label: 'Organização leve',
        microCopy: 'Pequenos ajustes que tiram peso da rotina — sem te exigir perfeição.',
      }
    case 'conexao':
      return {
        label: 'Conexão',
        microCopy: 'Mais presença com menos esforço: 5 minutos intencionais já mudam o clima.',
      }
    case 'equilibrio':
      return {
        label: 'Equilíbrio',
        microCopy: 'Você está encontrando ritmo. Vamos manter constância gentil e clareza.',
      }
    case 'expansao':
      return {
        label: 'Expansão',
        microCopy: 'Você tem energia para avançar. Vamos aprofundar com escolhas mais conscientes.',
      }
  }
}

function readPersonaFromLS(): PersonaResult | null {
  const raw = safeGetLS(LS_KEYS.eu360Persona)
  return safeParseJSON<PersonaResult>(raw)
}

function writePersonaToLS(result: PersonaResult) {
  safeSetLS(LS_KEYS.eu360Persona, JSON.stringify(result))
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

function OptionButton({
  active,
  label,
  onClick,
}: {
  active?: boolean
  label: string
  onClick: () => void
}) {
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
      personaId: context.persona?.id ?? null,
    })

    const res = await fetch('/api/ai/emocional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feature: 'weekly_overview',
        origin: 'eu360',
        context, // ✅ aqui já vai com persona também
      }),
    })

    if (!res.ok) throw new Error('Resposta inválida da IA')

    const data = await res.json()
    const insight = data?.weeklyInsight

    if (!insight || typeof insight !== 'object') throw new Error('Insight semanal vazio')

    return {
      title: insight.title ?? 'Seu resumo emocional da semana',
      summary:
        insight.summary ??
        'Pelos seus registros recentes, esta semana parece ter sido marcada por momentos de cansaço, mas também por pequenas vitórias.',
      suggestions:
        Array.isArray(insight.suggestions) && insight.suggestions.length > 0
          ? insight.suggestions
          : [
              'Separe um momento curto para olhar com carinho para o que você já deu conta.',
              'Escolha apenas uma prioridade por dia para aliviar a sensação de cobrança.',
            ],
    }
  } catch (error) {
    console.error('[Eu360] Erro ao buscar insight semanal, usando fallback:', error)
    return {
      title: 'Seu resumo emocional da semana',
      summary:
        'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos na sua semana.',
      suggestions: [
        'Proteja ao menos um momento do dia que te faz bem, mesmo que sejam 10 minutos.',
        'Perceba quais situações estão drenando demais sua energia e veja o que pode ser simplificado.',
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

  const [personaResult, setPersonaResult] = useState<PersonaResult | null>(null)
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({})
  const [qStep, setQStep] = useState<number>(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const saved = readPersonaFromLS()
    if (saved) {
      setPersonaResult(saved)
      setAnswers(saved.answers ?? {})
    }
  }, [])

  const personaPreview = useMemo(() => {
    const p = computePersona(answers)
    return { persona: p, ...personaCopy(p) }
  }, [answers])

  const totalAnswered = useMemo(() => {
    const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const
    return keys.filter((k) => Boolean(answers[k])).length
  }, [answers])

  // ✅ P11: persona “resolvida” para mandar no contexto (resultado salvo > preview)
  const personaForAi = useMemo(() => {
    if (personaResult) {
      return { id: personaResult.persona, label: personaResult.label, microCopy: personaResult.microCopy }
    }
    return { id: personaPreview.persona, label: personaPreview.label, microCopy: personaPreview.microCopy }
  }, [personaResult, personaPreview])

  useEffect(() => {
    let isMounted = true

    const loadInsight = async () => {
      setLoadingInsight(true)
      try {
        const result = await fetchWeeklyInsight({
          firstName,
          stats,
          persona: personaForAi, // ✅ aqui entra a persona no contexto
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
  }, [firstName, stats, personaForAi])

  function setAnswer<K extends keyof QuestionnaireAnswers>(
    key: K,
    value: NonNullable<QuestionnaireAnswers[K]>,
  ) {
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
      const persona = computePersona(answers)
      const copy = personaCopy(persona)

      const result: PersonaResult = {
        persona,
        label: copy.label,
        microCopy: copy.microCopy,
        updatedAtISO: new Date().toISOString(),
        answers,
      }

      writePersonaToLS(result)
      setPersonaResult(result)

      try {
        track('eu360.questionario.complete', { persona, answered: 6 })
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
  const heroSubtitle =
    'Aqui a gente personaliza o Materna360 para a sua fase — com leveza, sem te pedir perfeição.'

  const content = (
    <main
      data-layout="page-template-v1"
      data-tab="eu360"
      className="eu360-hub-bg relative min-h-[100dvh] pb-24 overflow-hidden"
    >
      <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-6">
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
                  Seu ajuste da semana
                </p>

                <div className="mt-2 flex items-start gap-2">
                  <AppIcon name="sparkles" size={18} className="text-white" decorative />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {personaResult ? personaResult.label : personaPreview.label}
                    </p>
                    <p className="text-[12px] text-white/85 leading-relaxed">
                      {personaResult ? personaResult.microCopy : personaPreview.microCopy}
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <StepDot key={n} active={personaResult ? n === 6 : n === qStep} />
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (personaResult) {
                    setPersonaResult(null)
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
                <span>{personaResult ? 'Ajustar novamente' : 'Fazer agora (2 min)'}</span>
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

          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6a6a6a]">
                      Questionário rápido (2 min)
                    </p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#2f3a56] leading-snug">
                      Para o app se ajustar ao seu momento real
                    </h2>
                    <p className="mt-1 text-[13px] text-[#6a6a6a] leading-relaxed">
                      Sem teste, sem diagnóstico. Só contexto para o Materna360 te entregar menos peso e mais clareza.
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-1">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <StepDot key={n} active={personaResult ? n === 6 : n === qStep} />
                    ))}
                  </div>
                </div>

                {!personaResult ? (
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#ffe1f1]/70 px-4 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6a6a6a]">
                      Prévia do ajuste
                    </p>
                    <div className="mt-1 flex items-start gap-2">
                      <AppIcon name="sparkles" size={18} className="text-[#fd2597]" decorative />
                      <div>
                        <p className="text-sm font-semibold text-[#2f3a56]">{personaPreview.label}</p>
                        <p className="text-[12px] text-[#6a6a6a] leading-relaxed">{personaPreview.microCopy}</p>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-[#6a6a6a]">
                      Progresso: <span className="font-semibold text-[#2f3a56]">{totalAnswered}/6</span>
                    </p>
                  </div>
                ) : null}

                {personaResult ? (
                  <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fb] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                        <AppIcon name="check" size={18} className="text-[#fd2597]" decorative />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[#2f3a56]">Questionário concluído</p>
                        <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                          A partir de agora, o Materna360 pode calibrar o tom, o volume de sugestões e o ritmo do app para você.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {qStep === 1 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">
                          1) Como você tem se sentido na maior parte dos dias?
                        </p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q1 === 'exausta'} label="Exausta" onClick={() => setAnswer('q1', 'exausta')} />
                          <OptionButton active={answers.q1 === 'cansada'} label="Cansada, mas dando conta" onClick={() => setAnswer('q1', 'cansada')} />
                          <OptionButton active={answers.q1 === 'oscilando'} label="Oscilando" onClick={() => setAnswer('q1', 'oscilando')} />
                          <OptionButton active={answers.q1 === 'equilibrada'} label="Mais equilibrada" onClick={() => setAnswer('q1', 'equilibrada')} />
                          <OptionButton active={answers.q1 === 'energia'} label="Com energia para mais" onClick={() => setAnswer('q1', 'energia')} />
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
                        <p className="text-[12px] font-semibold text-[#2f3a56]">
                          3) Hoje, o que mais pesa na sua rotina?
                        </p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q3 === 'tempo'} label="Falta de tempo" onClick={() => setAnswer('q3', 'tempo')} />
                          <OptionButton active={answers.q3 === 'emocional'} label="Cansaço emocional" onClick={() => setAnswer('q3', 'emocional')} />
                          <OptionButton active={answers.q3 === 'organizacao'} label="Organização" onClick={() => setAnswer('q3', 'organizacao')} />
                          <OptionButton active={answers.q3 === 'conexao'} label="Conexão com meu filho" onClick={() => setAnswer('q3', 'conexao')} />
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
                          <OptionButton active={answers.q4 === 'sobrevivencia'} label="Sobrevivência" onClick={() => setAnswer('q4', 'sobrevivencia')} />
                          <OptionButton active={answers.q4 === 'organizar'} label="Tentando organizar" onClick={() => setAnswer('q4', 'organizar')} />
                          <OptionButton active={answers.q4 === 'conexao'} label="Buscando conexão" onClick={() => setAnswer('q4', 'conexao')} />
                          <OptionButton active={answers.q4 === 'equilibrio'} label="Encontrando equilíbrio" onClick={() => setAnswer('q4', 'equilibrio')} />
                          <OptionButton active={answers.q4 === 'alem'} label="Querendo ir além" onClick={() => setAnswer('q4', 'alem')} />
                        </div>
                      </div>
                    ) : null}

                    {qStep === 5 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">
                          5) Como você prefere receber ajuda aqui?
                        </p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q5 === 'diretas'} label="Poucas sugestões, bem diretas" onClick={() => setAnswer('q5', 'diretas')} />
                          <OptionButton active={answers.q5 === 'guiadas'} label="Algumas opções, mas guiadas" onClick={() => setAnswer('q5', 'guiadas')} />
                          <OptionButton active={answers.q5 === 'explorar'} label="Gosto de explorar com calma" onClick={() => setAnswer('q5', 'explorar')} />
                        </div>
                      </div>
                    ) : null}

                    {qStep === 6 ? (
                      <div className="space-y-2">
                        <p className="text-[12px] font-semibold text-[#2f3a56]">
                          6) Se hoje fosse um bom dia, o que já seria suficiente?
                        </p>
                        <div className="grid gap-2">
                          <OptionButton active={answers.q6 === 'passar'} label="Conseguir passar pelo dia" onClick={() => setAnswer('q6', 'passar')} />
                          <OptionButton active={answers.q6 === 'basico'} label="Cumprir o básico sem culpa" onClick={() => setAnswer('q6', 'basico')} />
                          <OptionButton active={answers.q6 === 'momento'} label="Ter um momento bom com meu filho" onClick={() => setAnswer('q6', 'momento')} />
                          <OptionButton active={answers.q6 === 'organizada'} label="Me sentir mais organizada" onClick={() => setAnswer('q6', 'organizada')} />
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
                      Isso fica salvo para personalizar a sua experiência. Você pode refazer quando quiser.
                    </p>
                  </>
                )}
              </SoftCard>
            </Reveal>
          </SectionWrapper>

          {/* 3 — PAINEL DA JORNADA */}
          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6a6a6a]">
                      Painel da sua jornada
                    </p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#2f3a56] leading-snug">
                      Um olhar rápido sobre como você vem cuidando de vocês
                    </h2>
                  </div>
                  <AppIcon name="sparkles" className="h-6 w-6 text-[#fd2597] hidden md:block" />
                </div>

                <div className="grid grid-cols-3 gap-2.5 md:gap-4">
                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6a6a6a]">Dias com planner</p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">{stats.daysWithPlanner}</p>
                  </div>
                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6a6a6a]">Check-ins de humor</p>
                    <p className="mt-1 text-xl font-semibold text-[#fd2597]">{stats.moodCheckins}</p>
                  </div>
                  <div className="rounded-2xl bg-[#ffe1f1] px-3 py-3 text-center shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium text-[#6a6a6a]">Conquistas</p>
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
                          {firstName}, este espaço é para te ajudar a enxergar seus últimos dias com mais gentileza — não para te cobrar.
                        </p>
                      </div>
                    </div>

                    <div className="mt-1 space-y-2.5">
                      {loadingInsight ? (
                        <p className="text-sm text-[#6a6a6a] leading-relaxed">
                          Estou olhando com carinho para a sua semana para trazer uma reflexão…
                        </p>
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed text-[#2f3a56]">
                            {weeklyInsight?.summary ??
                              'Mesmo nos dias mais puxados, sempre existe algo pequeno que deu certo. Tente perceber quais foram esses momentos na sua semana.'}
                          </p>

                          {weeklyInsight?.suggestions && weeklyInsight.suggestions.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-semibold text-[#6a6a6a] uppercase tracking-[0.16em]">
                                Pequenos passos para os próximos dias
                              </p>
                              <ul className="space-y-1.5 text-sm text-[#2f3a56]">
                                {weeklyInsight.suggestions.map((item, idx) => (
                                  <li key={idx}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <p className="text-[11px] text-[#6a6a6a] mt-2 leading-relaxed">
                            Isso não é um diagnóstico — é um convite para você se observar com cuidado. Um passo por vez já é muito.
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
          <SectionWrapper>
            <Reveal>
              <SoftCard className="rounded-3xl border border-white/60 bg-[radial-gradient(circle_at_top_left,#fd2597_0,#b8236b_45%,#fdbed7_100%)] px-6 py-6 md:px-8 md:py-7 shadow-[0_24px_60px_rgba(0,0,0,0.32)] text-white overflow-hidden relative">
                <div className="absolute -right-20 -bottom-24 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="space-y-2 max-w-xl">
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/80">
                      Materna360+
                    </p>
                    <h2 className="text-xl md:text-2xl font-semibold leading-snug text-white">
                      Leve o Materna360 para o próximo nível
                    </h2>
                    <p className="text-sm md:text-base text-white/90 leading-relaxed">
                      Desbloqueie conteúdos exclusivos, acompanhamento mais próximo e ferramentas avançadas para cuidar de você,
                      da sua rotina e da sua família.
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
                      Planos pensados para diferentes fases — você escolhe o que faz sentido agora.
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
