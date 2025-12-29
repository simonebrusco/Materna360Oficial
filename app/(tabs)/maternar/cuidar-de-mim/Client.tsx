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

type View = 'entrada' | 'ritmo' | 'rotina' | 'pausas' | 'fechar'
type FocusMode = '1min' | '3min' | '5min'
type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

type Routine = {
  id: string
  title: string
  subtitle: string
  focus: FocusMode
  steps: string[]
  pauseDeck: { label: string; min: 1 | 2 }[]
  close: string
  next: string
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

function focusLabel(f: FocusMode) {
  if (f === '1min') return '1 min'
  if (f === '3min') return '3 min'
  return '5 min'
}

function focusTitle(f: FocusMode) {
  if (f === '1min') return 'Um respiro rápido'
  if (f === '3min') return 'Um reset curto'
  return 'Um cuidado com calma'
}

function focoHint(f: FocusMode) {
  if (f === '1min') return 'Para quando você só precisa baixar o volume e seguir.'
  if (f === '3min') return 'Para quando dá para se reorganizar por dentro e continuar.'
  return 'Para quando você consegue cuidar com um pouco mais de calma.'
}

function ritmoTitle(r: Ritmo) {
  if (r === 'leve') return 'Ok. Vamos manter leve.'
  if (r === 'animada') return 'Boa. Vamos manter sem virar excesso.'
  if (r === 'cansada') return 'Entendido. Vamos recuperar um pouco de fôlego.'
  return 'Entendido. Vamos reduzir pressão primeiro.'
}

function ritmoHint(r: Ritmo) {
  if (r === 'leve') return 'A ideia é só te apoiar para seguir bem, sem inventar muito.'
  if (r === 'animada') return 'A ideia é manter o ritmo bom sem virar sobrecarga.'
  if (r === 'cansada') return 'A ideia é recuperar um pouco de energia com algo curto e possível.'
  return 'A ideia é destravar: um gesto pequeno agora já muda o resto do dia.'
}

const ROUTINES: Routine[] = [
  {
    id: 'r1',
    focus: '1min',
    title: 'Reset 60s (respirar e seguir)',
    subtitle: 'Um minuto para reduzir o ruído e voltar para o próximo passo do seu dia.',
    steps: ['Inspire 4', 'Segure 2', 'Solte 6', 'Repita 3x'],
    pauseDeck: [
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água (3 goles) + pausa', min: 1 },
      { label: 'Ombros para baixo (3x)', min: 1 },
      { label: 'Olhar pela janela (30s)', min: 1 },
    ],
    close: 'Pronto. Isso já é suficiente para seguir um pouco melhor.',
    next: '',
  },
  {
    id: 'r2',
    focus: '3min',
    title: 'Reset 3 min (água + pescoço + foco)',
    subtitle: 'Três minutos para retomar o controle do próximo gesto possível.',
    steps: ['Água: 3–5 goles', 'Pescoço: 3 giros leves', 'Respire: 4 lentas', 'Escolha 1 próxima ação pequena'],
    pauseDeck: [
      { label: 'Água + pausa', min: 1 },
      { label: 'Pescoço (30s)', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Alongar mãos (30s)', min: 1 },
    ],
    close: 'Feito. Você se deu um reinício sem parar o mundo.',
    next: '',
  },
  {
    id: 'r3',
    focus: '5min',
    title: 'Cuidar 5 min (corpo + ambiente mínimo)',
    subtitle: 'Cinco minutos para reduzir ruído e deixar o resto do dia mais fácil.',
    steps: ['Hidratante nas mãos (30s)', 'Braços: alongar 30s', 'Mão no peito: 4 respirações', '1 item no lugar'],
    pauseDeck: [
      { label: 'Hidratante (2 min)', min: 2 },
      { label: 'Braços (30s) + ombros', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água + pausa', min: 1 },
    ],
    close: 'Pronto. Isso já deixa o resto do dia mais leve.',
    next: '',
  },
]

function inferFromEu360(): { focus: FocusMode; ritmo: Ritmo } {
  const focusRaw = safeGetLS('eu360_focus_time')
  const ritmoRaw = safeGetLS('eu360_ritmo')

  const focus: FocusMode = focusRaw === '1min' || focusRaw === '3min' || focusRaw === '5min' ? focusRaw : '3min'
  const ritmo: Ritmo =
    ritmoRaw === 'leve' || ritmoRaw === 'cansada' || ritmoRaw === 'animada' || ritmoRaw === 'sobrecarregada'
      ? ritmoRaw
      : 'cansada'

  if (ritmo === 'sobrecarregada') return { focus: '1min', ritmo }
  return { focus, ritmo }
}

function pickRoutine(focus: FocusMode) {
  return ROUTINES.find((r) => r.focus === focus) ?? ROUTINES[1]
}

function originForCuidarDeMim(): TaskOrigin {
  return 'selfcare'
}

export default function Client() {
  const [view, setView] = useState<View>('entrada')
  const [focus, setFocus] = useState<FocusMode>('3min')
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false])
  const [pauseIndex, setPauseIndex] = useState(0)
  const [saveFeedback, setSaveFeedback] = useState<string>('')

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const inferred = inferFromEu360()
    setFocus(inferred.focus)
    setRitmo(inferred.ritmo)
    setView('entrada')

    try {
      track('cuidar_de_mim.open', { focus: inferred.focus, ritmo: inferred.ritmo })
    } catch {}
  }, [])

  const routine = useMemo(() => pickRoutine(focus), [focus])

  useEffect(() => {
    setChecked([false, false, false, false])
    setPauseIndex(0)
  }, [routine.id])

  function go(next: View) {
    setView(next)
    try {
      track('cuidar_de_mim.step', { step: next })
    } catch {}
  }

  function onSelectFocus(next: FocusMode) {
    setFocus(next)
    safeSetLS('eu360_focus_time', next)
    try {
      track('cuidar_de_mim.focus.select', { focus: next })
    } catch {}
  }

  function onSelectRitmo(next: Ritmo) {
    setRitmo(next)
    safeSetLS('eu360_ritmo', next)

    if (next === 'sobrecarregada') {
      setFocus('1min')
      safeSetLS('eu360_focus_time', '1min')
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
        track('cuidar_de_mim.routine.toggle', { i, value: next[i], focus })
      } catch {}
      return next
    })
  }

  function nextPause() {
    setPauseIndex((p) => (p + 1) % routine.pauseDeck.length)
    try {
      track('cuidar_de_mim.pause.next', { focus })
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
                O que você precisa agora?
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
                          {focusTitle(focus)} • {ritmo}
                        </div>

                        <div className="text-[18px] md:text-[20px] font-semibold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                          {routine.title}
                        </div>

                        <div className="text-[13px] text-white/85 leading-relaxed max-w-xl">
                          {routine.subtitle}
                        </div>
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
                        Ajustar ritmo
                      </button>
                      <button
                        onClick={() => go(view === 'rotina' ? 'rotina' : 'entrada')}
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
                        Ver opções
                      </button>
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

                  {view === 'entrada' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Escolha uma opção simples</div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {(['1min', '3min', '5min'] as FocusMode[]).map((f) => {
                          const active = focus === f
                          return (
                            <button
                              key={f}
                              onClick={() => {
                                onSelectFocus(f)
                                go('rotina')
                              }}
                              className={[
                                'rounded-3xl border p-4 text-left transition',
                                active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                              ].join(' ')}
                            >
                              <div className="text-[12px] text-[#6a6a6a]">{focusLabel(f)}</div>
                              <div className="text-[13px] font-semibold text-[#2f3a56]">{focusTitle(f)}</div>
                              <div className="text-[12px] text-[#6a6a6a] mt-2">{focoHint(f)}</div>
                            </button>
                          )
                        })}
                      </div>

                      <div className="mt-2 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                        <button
                          onClick={() => go('ritmo')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Se quiser, ajustar ritmo
                        </button>

                        <Link
                          href="/maternar"
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition text-center"
                        >
                          Agora não
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  {view === 'ritmo' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Se quiser, ajuste seu ritmo</div>

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
                            onClick={() => go('rotina')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Abrir opção
                          </button>
                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Só uma pausa rápida
                          </button>
                          <button
                            onClick={() => go('entrada')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {view === 'rotina' ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-[14px] text-[#2f3a56] font-semibold">Se quiser, faça por partes</div>
                          <div className="text-[12px] text-[#6a6a6a]">Você pode marcar só o que fizer. Ou nada.</div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-3.5 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Pausa rápida
                          </button>
                          <button
                            onClick={() => go('fechar')}
                            className="rounded-full bg-[#fd2597] text-white px-3.5 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Encerrar
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
                            <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">
                              parte {i + 1}
                            </div>
                            <div className="text-[13px] text-[#2f3a56] mt-1 leading-relaxed">{s}</div>
                            <div className="text-[12px] text-[#6a6a6a] mt-3">
                              {checked[i] ? 'marcado ✓' : 'marcar'}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                        <div className="text-[13px] text-[#2f3a56] font-semibold">Se estiver corrido:</div>
                        <div className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">Faça só a parte 1. Isso já conta.</div>

                        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={() => saveToMyDay(routine.title)}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('entrada')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver outra opção
                          </button>

                          <button
                            onClick={() => go('fechar')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Encerrar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {view === 'pausas' ? (
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
                            onClick={() => go('rotina')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar
                          </button>
                        </div>
                      </div>

                      <div className="text-[12px] text-[#6a6a6a]">Uma pausa já conta. Você pode parar aqui.</div>
                    </div>
                  ) : null}

                  {view === 'fechar' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Fechamento</div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">ok</div>
                        <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-2 leading-relaxed">
                          {routine.close}
                        </div>
                        <div className="text-[13px] text-[#6a6a6a] mt-3 leading-relaxed">
                          Você pode encerrar agora. Se quiser, volte aqui quando fizer sentido.
                        </div>

                        <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={() => saveToMyDay(routine.title)}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('entrada')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver outra opção
                          </button>

                          <button
                            onClick={() => go('ritmo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ajustar ritmo
                          </button>

                          <Link
                            href="/maternar"
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition text-center"
                          >
                            Encerrar
                          </Link>
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
