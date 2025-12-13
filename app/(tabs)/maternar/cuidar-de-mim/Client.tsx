'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'ritmo' | 'mini-rotina' | 'pausas' | 'para-voce'
type FocusMode = '1min' | '3min' | '5min'
type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'

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
  if (f === '3min') return 'Para quando dá para fazer um pequeno “reset” e continuar.'
  return 'Para quando você consegue se organizar por dentro com um pouco mais de calma.'
}

function ritmoTitle(r: Ritmo) {
  if (r === 'leve') return 'Ok, vamos manter leve.'
  if (r === 'animada') return 'Boa. Vamos aproveitar e estabilizar.'
  if (r === 'cansada') return 'Entendido. Vamos recuperar fôlego.'
  return 'Entendido. Vamos reduzir pressão primeiro.'
}

function ritmoHint(r: Ritmo) {
  if (r === 'leve') return 'A meta é simples: seguir bem, sem inventar muito.'
  if (r === 'animada') return 'A meta é manter seu ritmo bom sem se sobrecarregar.'
  if (r === 'cansada') return 'A meta é recuperar um pouco de energia com algo curto e certeiro.'
  return 'A meta é destravar: um passo pequeno agora já muda o resto do dia.'
}

/**
 * Catálogo minimalista (não “autoajuda”):
 * - instruções curtas
 * - resultado claro
 * - linguagem operacional
 */
const ROUTINES: Routine[] = [
  {
    id: 'r1',
    focus: '1min',
    title: 'Respiração 60s (corpo mais calmo)',
    subtitle: 'Um minuto para baixar a pressão do corpo. Sem ritual, sem preparação.',
    steps: ['Inspire 4', 'Segure 2', 'Solte 6', 'Repita 3 vezes'],
    pauseDeck: [
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água (3 goles) + pausa', min: 1 },
      { label: 'Ombros para baixo (3x)', min: 1 },
      { label: 'Olhar pela janela (30s)', min: 1 },
    ],
    close: 'Pronto. Você já fez o necessário para seguir melhor.',
    next: 'Agora escolha a próxima coisa real do seu dia.',
  },
  {
    id: 'r2',
    focus: '3min',
    title: 'Reset 3 min (água + pescoço + foco)',
    subtitle: 'Três minutos para voltar para si e retomar o controle do próximo passo.',
    steps: ['Água: 3–5 goles', 'Pescoço: 3 giros leves', 'Respire: 4 lentas', 'Escolha 1 próxima ação pequena'],
    pauseDeck: [
      { label: 'Água + pausa', min: 1 },
      { label: 'Pescoço (30s)', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Alongar mãos (30s)', min: 1 },
    ],
    close: 'Feito. Você se deu um reinício sem parar o mundo.',
    next: 'Se quiser, faça mais 1 pausa rápida — ou volte para o dia.',
  },
  {
    id: 'r3',
    focus: '5min',
    title: 'Cuidar 5 min (corpo + ambiente mínimo)',
    subtitle: 'Cinco minutos para “arrumar por dentro” e reduzir ruído.',
    steps: ['Hidratante nas mãos (30s)', 'Braços: alongar 30s', 'Mão no peito: 4 respirações', '1 item no lugar'],
    pauseDeck: [
      { label: 'Hidratante (2 min)', min: 2 },
      { label: 'Braços (30s) + ombros', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água + pausa', min: 1 },
    ],
    close: 'Pronto. Isso já deixa o resto do dia mais fácil.',
    next: 'Agora você decide: seguir, repetir, ou ir para Meu Filho.',
  },
]

function inferFromEu360(): { focus: FocusMode; ritmo: Ritmo } {
  const focusRaw = safeGetLS('eu360_focus_time')
  const ritmoRaw = safeGetLS('eu360_ritmo')

  const focus: FocusMode =
    focusRaw === '1min' || focusRaw === '3min' || focusRaw === '5min' ? focusRaw : '3min'

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

export default function Client() {
  const [step, setStep] = useState<Step>('mini-rotina')
  const [focus, setFocus] = useState<FocusMode>('3min')
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false])
  const [pauseIndex, setPauseIndex] = useState(0)

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const inferred = inferFromEu360()
    setFocus(inferred.focus)
    setRitmo(inferred.ritmo)
    setStep('mini-rotina')

    try {
      track('cuidar_de_mim.open', { focus: inferred.focus, ritmo: inferred.ritmo })
    } catch {}
  }, [])

  const routine = useMemo(() => pickRoutine(focus), [focus])

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

  // Gradiente mais claro + final branco mais “limpo”
  const bgStyle: React.CSSProperties = {
    background:
      'linear-gradient(to bottom, rgba(255,216,230,0.55) 0%, rgba(255,225,241,0.28) 28%, #ffffff 78%, #ffffff 100%)',
  }

  return (
    <main data-tab="maternar-cuidar-de-mim" className="min-h-[100dvh] pb-32 relative overflow-hidden" style={bgStyle}>
      {/* Halos (mais leves, para não pesar a página) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-18%] left-[-18%] w-[62%] h-[62%] bg-[#fdbed7]/16 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-24%] right-[-18%] w-[58%] h-[58%] bg-[#ffe1f1]/22 blur-[170px] rounded-full" />
      </div>

      <ClientOnly>
        <div className="relative mx-auto max-w-3xl px-5 md:px-6">
          {/* HERO */}
          <header className="pt-10 md:pt-14 mb-6">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-[#6a6a6a] hover:text-[#545454] transition"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-[12px] tracking-wide uppercase text-[#6a6a6a]">
                    <span className="inline-flex h-6 px-3 rounded-full bg-white/70 border border-[#f5d7e5] items-center">
                      Cuidar de mim
                    </span>
                  </p>

                  {/* Ajuste de tamanho: iguala com as outras páginas internas */}
                  <h1 className="text-2xl md:text-3xl font-semibold text-[#2f3a56] leading-tight mt-2">
                    Cuidar de Mim
                  </h1>

                  <p className="text-[15px] md:text-[16px] text-[#6a6a6a] mt-2 max-w-xl leading-relaxed">
                    Um reset curto para você seguir o dia com mais clareza. Sem texto longo, sem esforço.
                  </p>
                </div>

                <div className="hidden md:flex items-center justify-center h-11 w-11 rounded-2xl bg-white/70 border border-[#f5d7e5] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                  <AppIcon name="sparkles" size={20} className="text-[#b8236b]" />
                </div>
              </div>
            </div>
          </header>

          {/* EXPERIÊNCIA ÚNICA */}
          <Reveal>
            <section
              className="
                bg-white
                rounded-3xl
                border border-[#f5d7e5]
                shadow-[0_8px_26px_rgba(0,0,0,0.06)]
                overflow-hidden
              "
            >
              {/* Top bar */}
              <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-[#f5d7e5]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                      <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                    </div>
                    <div>
                      <div className="text-[12px] text-[#6a6a6a]">
                        Passo {stepIndex(step)}/4 • {focusTitle(focus)} • {ritmo}
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-1">
                        Sugestão para agora: {routine.title}
                      </div>
                      <div className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">{routine.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => go('ritmo')}
                      className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-3.5 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                    >
                      Ajustar
                    </button>
                    <button
                      onClick={() => go('mini-rotina')}
                      className="rounded-full bg-[#fd2597] text-white px-3.5 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                    >
                      Começar
                    </button>
                  </div>
                </div>

                {/* Stepper */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'ritmo' as const, label: 'Ritmo' },
                      { id: 'mini-rotina' as const, label: 'Ação' },
                      { id: 'pausas' as const, label: 'Pausa' },
                      { id: 'para-voce' as const, label: 'Fechar' },
                    ] as const
                  ).map((it) => {
                    const active = step === it.id
                    return (
                      <button
                        key={it.id}
                        onClick={() => go(it.id)}
                        className={[
                          'rounded-full px-3 py-1.5 text-[12px] border transition',
                          active
                            ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                            : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        {it.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Body */}
              <div className="px-5 md:px-6 py-5 md:py-6">
                {/* 1) Ritmo */}
                {step === 'ritmo' ? (
                  <div id="ritmo" className="space-y-4">
                    <div className="text-[14px] text-[#2f3a56] font-semibold">Como você está chegando agora?</div>

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
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => go('mini-rotina')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Aplicar e começar
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

                {/* 2) Mini rotina */}
                {step === 'mini-rotina' ? (
                  <div id="mini-rotina" className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[14px] text-[#2f3a56] font-semibold">Faça isso agora</div>
                        <div className="text-[12px] text-[#6a6a6a]">
                          Progresso: <span className="font-semibold text-[#2f3a56]">{progress}</span>/4
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
                          key={s}
                          onClick={() => toggleStep(i)}
                          className={[
                            'rounded-3xl border p-4 text-left transition',
                            checked[i] ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
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

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => go('pausas')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ir para Pausas rápidas
                        </button>
                        <button
                          onClick={() => go('para-voce')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Finalizar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 3) Pausas */}
                {step === 'pausas' ? (
                  <div id="pausas" className="space-y-4">
                    <div className="text-[14px] text-[#2f3a56] font-semibold">Escolha uma pausa (curta)</div>

                    <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                      <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">agora</div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-2 leading-relaxed">
                        {routine.pauseDeck[pauseIndex]?.label}
                      </div>
                      <div className="text-[12px] text-[#6a6a6a] mt-2">
                        Duração sugerida: {routine.pauseDeck[pauseIndex]?.min} min
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={nextPause}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Outra pausa
                        </button>
                        <button
                          onClick={() => go('mini-rotina')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Voltar para a ação
                        </button>
                        <button
                          onClick={() => go('para-voce')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Concluir
                        </button>
                      </div>
                    </div>

                    <div className="text-[12px] text-[#6a6a6a]">Regra do Materna: uma pausa já conta. Não precisa fazer tudo.</div>
                  </div>
                ) : null}

                {/* 4) Fechamento */}
                {step === 'para-voce' ? (
                  <div id="para-voce" className="space-y-4">
                    <div className="text-[14px] text-[#2f3a56] font-semibold">Fechamento</div>

                    <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                      <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">feito</div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] mt-2 leading-relaxed">
                        {routine.close}
                      </div>
                      <div className="text-[13px] text-[#6a6a6a] mt-3 leading-relaxed">{routine.next}</div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          onClick={() => go('mini-rotina')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Repetir (mesma opção)
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
              </div>
            </section>
          </Reveal>

          <div className="mt-8">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
