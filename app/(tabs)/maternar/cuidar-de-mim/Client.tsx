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

function stepIndex(s: Step) {
  return s === 'ritmo' ? 1 : s === 'mini-rotina' ? 2 : s === 'pausas' ? 3 : 4
}

function focusLabel(f: FocusMode) {
  if (f === '1min') return '1 min'
  if (f === '3min') return '3 min'
  return '5 min'
}

function focusTitle(f: FocusMode) {
  if (f === '1min') return 'Bem curtinho'
  if (f === '3min') return 'Um respiro'
  return 'Com um pouco mais de calma'
}

function focoHint(f: FocusMode) {
  if (f === '1min') return 'Só para abaixar o volume um pouco, sem compromisso.'
  if (f === '3min') return 'Um cuidado pequeno que cabe sem parar o mundo.'
  return 'Um cuidado leve, do seu tamanho, sem precisar “render” nada.'
}

function ritmoTitle(r: Ritmo) {
  if (r === 'leve') return 'Entendi: hoje dá para manter leve.'
  if (r === 'animada') return 'Que bom: vamos só estabilizar, sem exagero.'
  if (r === 'cansada') return 'Entendi: hoje está puxado.'
  return 'Entendi: hoje está pesado.'
}

function ritmoHint(r: Ritmo) {
  if (r === 'leve') return 'Aqui a ideia é só te dar um apoio pequeno — se fizer sentido.'
  if (r === 'animada') return 'Um cuidado curto para você seguir bem, sem virar cobrança.'
  if (r === 'cansada') return 'Vamos de algo curto e possível, sem exigir nada de você.'
  return 'Vamos reduzir pressão com um passo pequeno — e pode parar quando quiser.'
}

const ROUTINES: Routine[] = [
  {
    id: 'r1',
    focus: '1min',
    title: 'Reset de 60s (respirar e seguir)',
    subtitle: 'Um minuto para baixar o ruído interno, só isso.',
    steps: ['Inspire 4', 'Segure 2', 'Solte 6', 'Repita 3x'],
    pauseDeck: [
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água (3 goles) + pausa', min: 1 },
      { label: 'Ombros para baixo (3x)', min: 1 },
      { label: 'Olhar pela janela (30s)', min: 1 },
    ],
    close: 'Pronto. Se isso já te ajudou um pouco, já valeu.',
    next: 'Você pode encerrar por aqui — ou escolher outra pausa, se quiser.',
  },
  {
    id: 'r2',
    focus: '3min',
    title: 'Reset de 3 min (água + pescoço + foco)',
    subtitle: 'Três minutos para você se recompor por dentro, sem pressa.',
    steps: ['Água: 3–5 goles', 'Pescoço: 3 giros leves', 'Respire: 4 lentas', 'Escolha 1 próxima ação pequena'],
    pauseDeck: [
      { label: 'Água + pausa', min: 1 },
      { label: 'Pescoço (30s)', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Alongar mãos (30s)', min: 1 },
    ],
    close: 'Feito. Um respiro curto já muda o tom do resto.',
    next: 'Se quiser, pare aqui. Se quiser, faça mais uma pausa curta.',
  },
  {
    id: 'r3',
    focus: '5min',
    title: 'Cuidar 5 min (corpo + ambiente mínimo)',
    subtitle: 'Cinco minutos para você sentir mais espaço, sem “arrumar a vida”.',
    steps: ['Hidratante nas mãos (30s)', 'Braços: alongar 30s', 'Mão no peito: 4 respirações', '1 item no lugar'],
    pauseDeck: [
      { label: 'Hidratante (2 min)', min: 2 },
      { label: 'Braços (30s) + ombros', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água + pausa', min: 1 },
    ],
    close: 'Pronto. Um cuidado pequeno, do seu jeito.',
    next: 'Você pode encerrar agora — ou repetir algo bem curto, se fizer sentido.',
  },
]

function pickRoutine(focus: FocusMode) {
  return ROUTINES.find((r) => r.focus === focus) ?? ROUTINES[1]
}

function originForCuidarDeMim(): TaskOrigin {
  return 'selfcare'
}

export default function Client() {
  // Começa pelo reconhecimento (sem inferência / sem memória de Eu360)
  const [step, setStep] = useState<Step>('ritmo')
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
    try {
      track('cuidar_de_mim.open', { focus, ritmo })
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const routine = useMemo(() => pickRoutine(focus), [focus])

  useEffect(() => {
    setChecked([false, false, false, false])
    setPauseIndex(0)
  }, [routine.id])

  function go(next: Step) {
    setStep(next)
    try {
      track('cuidar_de_mim.step', { step: next })
    } catch {}
  }

  function onSelectFocus(next: FocusMode) {
    setFocus(next)
    try {
      track('cuidar_de_mim.focus.select', { focus: next })
    } catch {}
  }

  function onSelectRitmo(next: Ritmo) {
    setRitmo(next)

    // Se estiver pesado, sugere automaticamente o menor tempo — mas sem travar escolha
    if (next === 'sobrecarregada') {
      setFocus('1min')
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

  const chips = [
    { id: 'ritmo' as const, label: 'Como estou' },
    { id: 'mini-rotina' as const, label: 'Um cuidado' },
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
                Um espaço curto para você respirar um pouco — sem obrigação, sem cobrança.
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
                          Passo {stepIndex(step)}/4 • {focusTitle(focus)}
                        </div>

                        <div className="text-[18px] md:text-[20px] font-semibold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                          Um cuidado possível para agora: {routine.title}
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
                        Abrir
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
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Como você está agora?</div>

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

                        <div className="mt-4 text-[13px] text-[#2f3a56] font-semibold">Quanto tempo cabe agora?</div>
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
                            Ver o cuidado sugerido
                          </button>
                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Só uma pausa rápida
                          </button>
                          <button
                            onClick={() => go('para-voce')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar por aqui
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 'mini-rotina' ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-[14px] text-[#2f3a56] font-semibold">Um cuidado pequeno para agora</div>
                          <div className="text-[12px] text-[#6a6a6a]">Se quiser, faça um passo. Se não quiser, tudo bem.</div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-3.5 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Trocar por uma pausa
                          </button>
                          <button
                            onClick={() => go('para-voce')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-3.5 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar por aqui
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
                            <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">passo</div>
                            <div className="text-[13px] text-[#2f3a56] mt-1 leading-relaxed">{s}</div>
                            <div className="text-[12px] text-[#6a6a6a] mt-3">{checked[i] ? 'marcado ✓' : 'marcar (se quiser)'}</div>
                          </button>
                        ))}
                      </div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                        <div className="text-[13px] text-[#2f3a56] font-semibold">Se hoje não der:</div>
                        <div className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">
                          Você pode parar aqui sem “terminar”. Mesmo um pouquinho já conta.
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={() => saveToMyDay(routine.title)}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia (se quiser)
                          </button>

                          <button
                            onClick={() => go('pausas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver pausas rápidas
                          </button>

                          <button
                            onClick={() => go('para-voce')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar por aqui
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 'pausas' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Uma pausa curtinha (se quiser)</div>

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
                            Salvar no Meu Dia (se quiser)
                          </button>

                          <button
                            onClick={() => go('mini-rotina')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar para o cuidado
                          </button>

                          <button
                            onClick={() => go('para-voce')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar por aqui
                          </button>
                        </div>
                      </div>

                      <div className="text-[12px] text-[#6a6a6a]">Uma pausa já conta. E se não der agora, tudo bem.</div>
                    </div>
                  ) : null}

                  {step === 'para-voce' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Fechamento</div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">pronto</div>
                        <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-2 leading-relaxed">
                          {routine.close}
                        </div>
                        <div className="text-[13px] text-[#6a6a6a] mt-3 leading-relaxed">{routine.next}</div>

                        <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
                          <button
                            onClick={() => saveToMyDay(routine.title)}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia (se quiser)
                          </button>

                          <button
                            onClick={() => go('mini-rotina')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver de novo
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
                            Ajustar
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
