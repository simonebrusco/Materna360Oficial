'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'ritmo' | 'mini-rotina' | 'pausas' | 'para-voce'
type FocusMode = '1min' | '3min' | '5min'
type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'

type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

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

type Routine = {
  id: string
  title: string
  subtitle: string
  focus: FocusMode
  theme: 'regular' | 'descomprimir' | 'clarear' | 'corpo' | 'ambiente'
  steps: string[]
  pauseDeck: { label: string; min: 1 | 2 }[]
  close: string
  next: string
}

const LS_KEYS = {
  eu360FocusTime: 'eu360_focus_time',
  eu360Ritmo: 'eu360_ritmo',
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

function stepIndex(s: Step) {
  return s === 'ritmo' ? 1 : s === 'mini-rotina' ? 2 : s === 'pausas' ? 3 : 4
}

function focusLabel(f: FocusMode) {
  if (f === '1min') return '1 min'
  if (f === '3min') return '3 min'
  return '5 min'
}

function focusTitle(f: FocusMode) {
  if (f === '1min') return 'Reset rápido'
  if (f === '3min') return 'Recarregar'
  return 'Cuidar com calma'
}

function focoHint(f: FocusMode) {
  if (f === '1min') return 'Para quando você só precisa baixar o volume e seguir.'
  if (f === '3min') return 'Para quando dá para fazer um pequeno reset e continuar.'
  return 'Para quando você consegue se organizar por dentro com um pouco mais de calma.'
}

function ritmoTitle(r: Ritmo) {
  if (r === 'leve') return 'Ok, vamos manter leve.'
  if (r === 'animada') return 'Boa. Vamos estabilizar sem exagerar.'
  if (r === 'cansada') return 'Entendido. Vamos recuperar fôlego.'
  return 'Entendido. Vamos reduzir pressão primeiro.'
}

function ritmoHint(r: Ritmo) {
  if (r === 'leve') return 'A meta é simples: seguir bem, sem inventar muito.'
  if (r === 'animada') return 'A meta é manter o ritmo bom sem virar sobrecarga.'
  if (r === 'cansada') return 'A meta é recuperar um pouco de energia com algo curto e certeiro.'
  return 'A meta é destravar: um passo pequeno agora já muda o resto do dia.'
}

/**
 * Conteúdo vivo:
 * - múltiplas rotinas por focus
 * - tema (descomprimir/clarear/corpo/ambiente)
 * - o app escolhe 1 principal + 1 alternativa (livre-arbítrio real)
 */
const ROUTINES: Routine[] = [
  // 1 MIN — DESCOMPRIMIR
  {
    id: 'r1-1',
    focus: '1min',
    theme: 'descomprimir',
    title: 'Reset 60s (respirar e seguir)',
    subtitle: 'Um minuto para reduzir o ruído e voltar pro próximo passo.',
    steps: ['Inspire 4', 'Segure 2', 'Solte 6', 'Repita 3x'],
    pauseDeck: [
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água (3 goles) + pausa', min: 1 },
      { label: 'Ombros para baixo (3x)', min: 1 },
      { label: 'Olhar pela janela (30s)', min: 1 },
    ],
    close: 'Pronto. Você já fez o necessário para seguir melhor.',
    next: 'Se quiser, escolha só a próxima coisa real do seu dia.',
  },
  {
    id: 'r1-2',
    focus: '1min',
    theme: 'clarear',
    title: 'Clareza 60s (uma frase no papel)',
    subtitle: 'Um minuto para tirar da cabeça e deixar o resto mais simples.',
    steps: ['Escreva 1 frase do que está pesado', 'Escreva 1 frase do próximo passo', 'Dobre e guarde', 'Siga'],
    pauseDeck: [
      { label: 'Escrever 1 frase', min: 1 },
      { label: 'Água (3 goles) + pausa', min: 1 },
      { label: 'Soltar mandíbula (3x)', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
    ],
    close: 'Ok. Agora está fora da sua cabeça por um instante.',
    next: 'Se não quiser fazer mais nada, tudo bem. Isso já conta.',
  },

  // 3 MIN — CORPO / CLAREAR
  {
    id: 'r3-1',
    focus: '3min',
    theme: 'corpo',
    title: 'Reset 3 min (água + pescoço + foco)',
    subtitle: 'Três minutos para retomar o controle do próximo passo.',
    steps: ['Água: 3–5 goles', 'Pescoço: 3 giros leves', 'Respire: 4 lentas', 'Escolha 1 próxima ação pequena'],
    pauseDeck: [
      { label: 'Água + pausa', min: 1 },
      { label: 'Pescoço (30s)', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Alongar mãos (30s)', min: 1 },
    ],
    close: 'Feito. Você se deu um reinício sem parar o mundo.',
    next: 'Se fizer sentido, siga com só um próximo passo.',
  },
  {
    id: 'r3-2',
    focus: '3min',
    theme: 'clarear',
    title: 'Organizar por dentro (3 min)',
    subtitle: 'Três minutos para reduzir a sensação de “tudo ao mesmo tempo”.',
    steps: ['Liste 3 coisas (sem resolver)', 'Circule 1 (a mais urgente)', 'Transforme em 1 passo pequeno', 'Pare'],
    pauseDeck: [
      { label: 'Escrever 3 coisas', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Olhar longe (30s)', min: 1 },
      { label: 'Água + pausa', min: 1 },
    ],
    close: 'Pronto. Você não resolveu tudo — só reduziu o ruído.',
    next: 'Se quiser, agora escolha só o passo pequeno.',
  },

  // 5 MIN — AMBIENTE / CORPO
  {
    id: 'r5-1',
    focus: '5min',
    theme: 'ambiente',
    title: 'Cuidar 5 min (corpo + ambiente mínimo)',
    subtitle: 'Cinco minutos para reduzir ruído e deixar o resto do dia mais fácil.',
    steps: ['Hidratante nas mãos (30s)', 'Braços: alongar 30s', 'Mão no peito: 4 respirações', '1 item no lugar'],
    pauseDeck: [
      { label: 'Hidratante (2 min)', min: 2 },
      { label: 'Braços (30s) + ombros', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água + pausa', min: 1 },
    ],
    close: 'Pronto. Isso já deixa o resto do dia mais fácil.',
    next: 'Se não quiser continuar, tudo bem. Você já cuidou de você.',
  },
  {
    id: 'r5-2',
    focus: '5min',
    theme: 'corpo',
    title: 'Abaixar tensão (5 min)',
    subtitle: 'Cinco minutos para o corpo parar de “segurar tudo”.',
    steps: ['Ombros: sobe e desce 5x', 'Solte a mandíbula 5x', 'Respire 4 lentas', 'Alongue mãos 30s'],
    pauseDeck: [
      { label: 'Ombros (30s) + pescoço', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água + pausa', min: 1 },
      { label: 'Olhar pela janela (30s)', min: 1 },
    ],
    close: 'Ok. Seu corpo recebeu um sinal de “menos pressão”.',
    next: 'Se quiser, volte para o seu dia com um passo menor.',
  },
]

function readPersonaFromLS(): PersonaResult | undefined {
  const raw = safeGetLS(LS_KEYS.eu360Persona)
  const parsed = safeParseJSON<PersonaResult>(raw)
  return parsed ?? undefined
}

function daySeed() {
  const d = new Date()
  // seed diária simples: YYYYMMDD
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return Number(`${y}${m}${day}`)
}

function chooseOne<T>(seed: number, items: T[]) {
  const idx = Math.abs(seed) % items.length
  return items[idx]!
}

function inferFromEu360(): { focus: FocusMode; ritmo: Ritmo; persona?: PersonaResult } {
  const focusRaw = safeGetLS(LS_KEYS.eu360FocusTime)
  const ritmoRaw = safeGetLS(LS_KEYS.eu360Ritmo)

  const focus: FocusMode = focusRaw === '1min' || focusRaw === '3min' || focusRaw === '5min' ? focusRaw : '3min'
  const ritmo: Ritmo =
    ritmoRaw === 'leve' || ritmoRaw === 'cansada' || ritmoRaw === 'animada' || ritmoRaw === 'sobrecarregada'
      ? ritmoRaw
      : 'cansada'

  const persona = readPersonaFromLS()

  // ajuste suave: se sobrecarregada, puxa para 1min automaticamente (como já existia)
  if (ritmo === 'sobrecarregada') return { focus: '1min', ritmo, persona }
  return { focus, ritmo, persona }
}

function themesForPersona(persona?: PersonaId): Array<Routine['theme']> {
  // Só “tendência”. Nunca força.
  if (!persona) return ['descomprimir', 'clarear', 'corpo', 'ambiente', 'regular']

  if (persona === 'sobrevivencia') return ['descomprimir', 'corpo', 'clarear', 'regular', 'ambiente']
  if (persona === 'organizacao') return ['clarear', 'ambiente', 'corpo', 'regular', 'descomprimir']
  if (persona === 'conexao') return ['descomprimir', 'corpo', 'regular', 'clarear', 'ambiente']
  if (persona === 'equilibrio') return ['regular', 'corpo', 'clarear', 'ambiente', 'descomprimir']
  return ['clarear', 'regular', 'ambiente', 'corpo', 'descomprimir']
}

function routinesByFocus(focus: FocusMode) {
  return ROUTINES.filter((r) => r.focus === focus)
}

function pickTwoRoutines(input: { focus: FocusMode; ritmo: Ritmo; persona?: PersonaResult; altIndex: number }) {
  const seedBase = daySeed() + input.altIndex * 31

  const pool = routinesByFocus(input.focus)
  if (!pool.length) return { primary: ROUTINES[0], secondary: ROUTINES[1] ?? ROUTINES[0] }

  const themeOrder = themesForPersona(input.persona?.persona)

  // “puxa” por ritmo (bem leve): sobrecarregada/cansada preferem descomprimir/corpo
  const boostedThemes =
    input.ritmo === 'sobrecarregada' || input.ritmo === 'cansada'
      ? ['descomprimir', 'corpo', ...themeOrder]
      : input.ritmo === 'animada'
        ? ['clarear', 'ambiente', ...themeOrder]
        : themeOrder

  const primaryTheme = chooseOne(seedBase, boostedThemes)
  const primaryCandidates = pool.filter((r) => r.theme === primaryTheme)
  const primary = chooseOne(seedBase + 7, primaryCandidates.length ? primaryCandidates : pool)

  // secundária: pega outro tema (ou outro id) para dar livre-arbítrio real
  const secondaryPool = pool.filter((r) => r.id !== primary.id)
  const secondaryTheme = chooseOne(seedBase + 13, boostedThemes)
  const secondaryCandidates = secondaryPool.filter((r) => r.theme === secondaryTheme)
  const secondary = chooseOne(seedBase + 19, secondaryCandidates.length ? secondaryCandidates : secondaryPool.length ? secondaryPool : pool)

  return { primary, secondary }
}

function originForCuidarDeMim(): TaskOrigin {
  return 'selfcare'
}

export default function Client() {
  const [step, setStep] = useState<Step>('mini-rotina')
  const [focus, setFocus] = useState<FocusMode>('3min')
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false])
  const [pauseIndex, setPauseIndex] = useState(0)

  const [saveFeedback, setSaveFeedback] = useState<string>('')

  // alternância “Outra opção” (sem parecer tarefa)
  const [altIndex, setAltIndex] = useState(0)

  const [persona, setPersona] = useState<PersonaResult | undefined>(undefined)

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const inferred = inferFromEu360()
    setFocus(inferred.focus)
    setRitmo(inferred.ritmo)
    setPersona(inferred.persona)
    setStep('mini-rotina')

    try {
      track('cuidar_de_mim.open', {
        focus: inferred.focus,
        ritmo: inferred.ritmo,
        persona: inferred.persona?.persona ?? 'none',
      })
    } catch {}
  }, [])

  const picked = useMemo(() => pickTwoRoutines({ focus, ritmo, persona, altIndex }), [focus, ritmo, persona, altIndex])
  const routine = picked.primary
  const altRoutine = picked.secondary

  useEffect(() => {
    setChecked([false, false, false, false])
    setPauseIndex(0)
  }, [routine.id])

  const progress = useMemo(() => checked.filter(Boolean).length, [checked])

  function go(next: Step) {
    setStep(next)
    try {
      track('cuidar_de_mim.step', { step: next })
    } catch {}
  }

  function onSelectFocus(next: FocusMode) {
    setFocus(next)
    safeSetLS(LS_KEYS.eu360FocusTime, next)
    try {
      track('cuidar_de_mim.focus.select', { focus: next })
    } catch {}
  }

  function onSelectRitmo(next: Ritmo) {
    setRitmo(next)
    safeSetLS(LS_KEYS.eu360Ritmo, next)

    if (next === 'sobrecarregada') {
      setFocus('1min')
      safeSetLS(LS_KEYS.eu360FocusTime, '1min')
    }

    try {
      track('cuidar_de_mim.ritmo.select', { ritmo: next })
    } catch {}
  }

  function toggleStep(i: number) {
    setChecked((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      try {
        track('cuidar_de_mim.routine.toggle', { i, value: next[i], focus, routineId: routine.id })
      } catch {}
      return next
    })
  }

  function nextPause() {
    setPauseIndex((p) => (p + 1) % routine.pauseDeck.length)
    try {
      track('cuidar_de_mim.pause.next', { focus, routineId: routine.id })
    } catch {}
  }

  function swapSuggestion() {
    setAltIndex((i) => i + 1)
    try {
      track('cuidar_de_mim.suggestion.swap', { focus, ritmo, persona: persona?.persona ?? 'none' })
    } catch {}
  }

  function saveToMyDay(title: string) {
    const origin = originForCuidarDeMim()
    const res = addTaskToMyDay({
      title,
      origin,
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    if (res.created) setSaveFeedback('Salvo no Meu Dia.')
    else setSaveFeedback('Essa tarefa já estava no Meu Dia.')

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

  const chips = [
    { id: 'ritmo' as const, label: 'Ritmo' },
    { id: 'mini-rotina' as const, label: 'Ação' },
    { id: 'pausas' as const, label: 'Pausa' },
    { id: 'para-voce' as const, label: 'Fechar' },
  ]

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Cuidar de Mim
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um respiro curto, com escolhas. Se não servir, você troca — sem culpa.
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            <div
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                p-4 md:p-6
                space-y-6
              "
            >
              <Reveal>
                <div
                  className="
                    rounded-3xl
                    bg-white/10
                    border border-white/25
                    shadow-[0_14px_40px_rgba(0,0,0,0.12)]
                    p-4 md:p-5
                  "
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 items-stretch sm:items-center">
                    <div className="flex flex-col sm:flex-row items-start gap-3 items-stretch sm:items-center">
                      <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                        <AppIcon name="heart" size={22} className="text-white" />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[12px] text-white/85">
                          Passo {stepIndex(step)}/4 • {focusTitle(focus)} • {ritmo}
                          {persona?.label ? <span> • {persona.label}</span> : null}
                        </div>

                        <div className="text-[18px] md:text-[20px] font-semibold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                          Sugestão pronta para agora: {routine.title}
                        </div>

                        <div className="text-[13px] text-white/85 leading-relaxed max-w-xl">{routine.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={() => go('ritmo')}
                        className="
                          rounded-full
                          bg-white/90 hover:bg-white
                          text-[#2f3a56]
                          px-4 py-2
                          text-[12px]
                          shadow-[0_6px_18px_rgba(0,0,0,0.12)]
                          transition
                        "
                      >
                        Ajustar
                      </button>

                      <button
                        onClick={swapSuggestion}
                        className="
                          rounded-full
                          bg-white/20
                          border border-white/30
                          text-white
                          px-4 py-2
                          text-[12px]
                          hover:bg-white/25
                          transition
                        "
                      >
                        Outra opção
                      </button>

                      <button
                        onClick={() => go('mini-rotina')}
                        className="
                          rounded-full
                          bg-[#fd2597]
                          text-white
                          px-4 py-2
                          text-[12px]
                          shadow-[0_10px_26px_rgba(253,37,151,0.35)]
                          hover:opacity-95
                          transition
                        "
                      >
                        Começar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                    {chips.map((it) => {
                      const active = step === it.id
                      return (
                        <button
                          key={it.id}
                          onClick={() => go(it.id)}
                          className={[
                            'rounded-full px-3.5 py-2 text-[12px] border transition',
                            active
                              ? 'bg-white/95 border-white/40 text-[#2f3a56]'
                              : 'bg-white/20 border-white/30 text-white/90 hover:bg-white/25',
                          ].join(' ')}
                        >
                          {it.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Alternativa sempre visível (livre-arbítrio real) */}
                  <div className="mt-4 rounded-3xl bg-white/10 border border-white/25 p-4">
                    <div className="text-[11px] text-white/80 font-semibold uppercase tracking-[0.18em]">
                      Se não for isso
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-white leading-snug">{altRoutine.title}</div>
                        <div className="mt-1 text-[12px] text-white/85 leading-relaxed">{altRoutine.subtitle}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // “troca” a principal pela alternativa aumentando altIndex
                          swapSuggestion()
                          try {
                            track('cuidar_de_mim.alt.offer.used', { focus, ritmo, altRoutineId: altRoutine.id })
                          } catch {}
                        }}
                        className="
                          rounded-full
                          bg-white/90 hover:bg-white
                          text-[#2f3a56]
                          px-3.5 py-2
                          text-[12px]
                          shadow-[0_6px_18px_rgba(0,0,0,0.12)]
                          transition
                          whitespace-nowrap
                        "
                      >
                        Trocar por essa
                      </button>
                    </div>
                    <div className="mt-3 text-[12px] text-white/80">
                      Você não precisa acertar. Só escolher o que cabe.
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <SoftCard
                  className="
                    p-5 md:p-6 rounded-3xl
                    bg-white/95
                    border border-[#f5d7e5]
                    shadow-[0_10px_28px_rgba(184,35,107,0.12)]
                  "
                >
                  {saveFeedback ? (
                    <div className="mb-4 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] px-4 py-3 text-[12px] text-[#2f3a56]">
                      {saveFeedback}
                    </div>
                  ) : null}

                  {step === 'ritmo' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Ajuste rápido (pra eu pensar melhor por você)</div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(['leve', 'cansada', 'animada', 'sobrecarregada'] as Ritmo[]).map((r) => {
                          const active = ritmo === r
                          return (
                            <button
                              key={r}
                              onClick={() => onSelectRitmo(r)}
                              className={[
                                'rounded-full px-3.5 py-2 text-[12px] border transition text-left',
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

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                        <div className="text-[14px] font-semibold text-[#2f3a56]">{ritmoTitle(ritmo)}</div>
                        <div className="text-[13px] text-[#6a6a6a] mt-1">{ritmoHint(ritmo)}</div>

                        <div className="mt-4 text-[13px] text-[#2f3a56] font-semibold">Quanto tempo dá agora?</div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {(['1min', '3min', '5min'] as FocusMode[]).map((f) => {
                            const active = focus === f
                            return (
                              <button
                                key={f}
                                onClick={() => onSelectFocus(f)}
                                className={[
                                  'rounded-2xl border p-3 text-left transition',
                                  active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                                ].join(' ')}
                              >
                                <div className="text-[12px] text-[#6a6a6a]">{focusLabel(f)}</div>
                                <div className="text-[13px] font-semibold text-[#2f3a56]">{focusTitle(f)}</div>
                              </button>
                            )
                          })}
                        </div>

                        <div className="mt-3 text-[12px] text-[#6a6a6a]">{focoHint(focus)}</div>

                        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={() => go('mini-rotina')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Aplicar e começar
                          </button>
                          <button
                            onClick={swapSuggestion}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver outra opção
                          </button>
                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Só uma pausa rápida
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 'mini-rotina' ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-[14px] text-[#2f3a56] font-semibold">Faça isso agora</div>
                          <div className="text-[12px] text-[#6a6a6a]">
                            Progresso: <span className="font-semibold text-[#2f3a56]">{progress}</span>/4
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-3.5 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Preciso pausar
                          </button>
                          <button
                            onClick={() => go('para-voce')}
                            className="rounded-full bg-[#fd2597] text-white px-3.5 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Concluir
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {routine.steps.slice(0, 4).map((s, i) => (
                          <button
                            key={`${routine.id}-${s}`}
                            onClick={() => toggleStep(i)}
                            className={[
                              'rounded-3xl border p-4 text-left transition',
                              checked[i]
                                ? 'bg-[#ffd8e6] border-[#f5d7e5]'
                                : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                            ].join(' ')}
                          >
                            <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">passo {i + 1}</div>
                            <div className="text-[13px] text-[#2f3a56] mt-1 leading-relaxed">{s}</div>
                            <div className="text-[12px] text-[#6a6a6a] mt-3">{checked[i] ? 'feito ✓' : 'marcar como feito'}</div>
                          </button>
                        ))}
                      </div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                        <div className="text-[13px] text-[#2f3a56] font-semibold">Se estiver corrido:</div>
                        <div className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">Faça só o passo 1. Isso já ajuda.</div>

                        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={() => saveToMyDay(routine.title)}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={swapSuggestion}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Trocar sugestão
                          </button>

                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ir para Pausas rápidas
                          </button>

                          <button
                            onClick={() => go('para-voce')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Finalizar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 'pausas' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Escolha uma pausa (curta)</div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">agora</div>
                        <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-2 leading-relaxed">
                          {routine.pauseDeck[pauseIndex]?.label}
                        </div>
                        <div className="text-[12px] text-[#6a6a6a] mt-2">
                          Duração sugerida: {routine.pauseDeck[pauseIndex]?.min} min
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={nextPause}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition w-full sm:w-auto"
                          >
                            Outra pausa
                          </button>

                          <button
                            onClick={() => saveToMyDay(routine.pauseDeck[pauseIndex]?.label ?? routine.title)}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('mini-rotina')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar para a ação
                          </button>
                        </div>
                      </div>

                      <div className="text-[12px] text-[#6a6a6a]">Regra do Materna: uma pausa já conta. Não precisa fazer tudo.</div>
                    </div>
                  ) : null}

                  {step === 'para-voce' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Fechamento</div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">feito</div>
                        <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-2 leading-relaxed">
                          {routine.close}
                        </div>
                        <div className="text-[13px] text-[#6a6a6a] mt-3 leading-relaxed">{routine.next}</div>

                        <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={() => saveToMyDay(routine.title)}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('mini-rotina')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Repetir (mesma opção)
                          </button>

                          <button
                            onClick={swapSuggestion}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver outra sugestão
                          </button>

                          <Link
                            href="/maternar/meu-filho"
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ir para Meu Filho
                          </Link>

                          <button
                            onClick={() => go('ritmo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ajustar e trocar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </SoftCard>
              </Reveal>
            </div>

            <div className="mt-4">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
