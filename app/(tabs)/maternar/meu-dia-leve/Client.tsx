'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'inspiracao' | 'ideias' | 'receitas' | 'passo'
type Slot = '3' | '5' | '10'
type Mood = 'no-limite' | 'corrida' | 'ok' | 'leve'
type Focus = 'casa' | 'voce' | 'filho' | 'comida'

type TaskOrigin = 'today' | 'family' | 'selfcare' | 'home' | 'other'

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
  return s === 'inspiracao' ? 1 : s === 'ideias' ? 2 : s === 'receitas' ? 3 : 4
}

function slotLabel(s: Slot) {
  return s === '3' ? '3 min' : s === '5' ? '5 min' : '10 min'
}

function slotTitle(s: Slot) {
  return s === '3' ? 'micro-alívio' : s === '5' ? 'respiro rápido' : 'virada do dia'
}

function slotHint(s: Slot) {
  if (s === '3') return 'Para quando você está sem tempo e precisa destravar o agora.'
  if (s === '5') return 'Para quando dá para encaixar algo pequeno e útil entre tarefas.'
  return 'Para quando você consegue reorganizar o resto do dia com um passo simples.'
}

function moodTitle(m: Mood) {
  if (m === 'no-limite') return 'Ok. Vamos reduzir o peso do agora.'
  if (m === 'corrida') return 'Ok. Vamos escolher o que resolve primeiro.'
  if (m === 'ok') return 'Boa. Vamos manter o dia fluindo.'
  return 'Perfeito. Vamos aproveitar para deixar mais leve.'
}

function focusTitle(f: Focus) {
  if (f === 'casa') return 'Casa'
  if (f === 'voce') return 'Você'
  if (f === 'filho') return 'Filho'
  return 'Comida'
}

function inferContext(): { slot: Slot; mood: Mood; focus: Focus } {
  const slotRaw = safeGetLS('eu360_day_slot')
  const moodRaw = safeGetLS('eu360_mood')
  const focusRaw = safeGetLS('eu360_focus_today')

  const slot: Slot = slotRaw === '3' || slotRaw === '5' || slotRaw === '10' ? slotRaw : '5'
  const mood: Mood =
    moodRaw === 'no-limite' || moodRaw === 'corrida' || moodRaw === 'ok' || moodRaw === 'leve' ? moodRaw : 'corrida'
  const focus: Focus =
    focusRaw === 'casa' || focusRaw === 'voce' || focusRaw === 'filho' || focusRaw === 'comida' ? focusRaw : 'filho'

  if (mood === 'no-limite') return { slot: '3', mood, focus }
  return { slot, mood, focus }
}

type QuickIdea = { tag: string; title: string; how: string; slot: Slot; focus: Focus }
type QuickRecipe = { tag: string; title: string; how: string; slot: Slot }
type DayLine = { title: string; why: string; focus: Focus; slot: Slot }

const INSPIRATIONS: Record<Mood, { title: string; line: string; action: string }> = {
  'no-limite': {
    title: 'Para agora',
    line: 'Escolha uma coisa só. O resto pode esperar.',
    action: 'Defina 1 prioridade mínima.',
  },
  corrida: {
    title: 'Para hoje',
    line: 'O dia melhora quando você decide o próximo passo — não o dia inteiro.',
    action: 'Escolha o próximo passo.',
  },
  ok: {
    title: 'Para manter',
    line: 'Quando você simplifica, você ganha tempo de verdade.',
    action: 'Corte uma exigência.',
  },
  leve: {
    title: 'Para aproveitar',
    line: 'Dia leve não é dia perfeito. É dia bem conduzido.',
    action: 'Faça o básico bem feito.',
  },
}

const IDEIAS: QuickIdea[] = [
  { tag: '3 min', title: 'Respirar + ombros para baixo', how: '3 respirações lentas + relaxar ombros 3 vezes. Só isso.', slot: '3', focus: 'voce' },
  { tag: '3 min', title: 'Mensagem curta que resolve', how: 'Uma mensagem objetiva (sem texto longo) para destravar algo do dia.', slot: '3', focus: 'casa' },
  { tag: '5 min', title: 'Conexão com o filho (sem inventar)', how: 'Pergunta simples: “o que foi legal hoje?” + ouvir 20 segundos.', slot: '5', focus: 'filho' },
  { tag: '5 min', title: 'Organizar um ponto só', how: 'Uma bancada ou mesa. Não a casa toda.', slot: '5', focus: 'casa' },
  { tag: '10 min', title: 'Música + tarefa que já existe', how: 'Uma música e você faz uma tarefa que já faria de qualquer jeito.', slot: '10', focus: 'voce' },
  { tag: '10 min', title: 'Banho/escova em modo leve', how: 'Transforme a rotina em “missão” rápida e sem discussão.', slot: '10', focus: 'filho' },
  { tag: '5 min', title: 'Água + lanche simples', how: 'Água + algo pronto. Resolve energia sem complicar.', slot: '5', focus: 'comida' },
]

const RECEITAS: QuickRecipe[] = [
  { tag: '3 min', title: 'Iogurte + fruta + granola', how: 'Montagem rápida com o que tiver. Sem medida.', slot: '3' },
  { tag: '5 min', title: 'Ovo mexido + arroz pronto', how: 'Arroz já pronto + ovo mexido. Legume se der.', slot: '5' },
  { tag: '5 min', title: 'Pão + queijo + fruta', how: 'Simples e suficiente para um dia corrido.', slot: '5' },
  { tag: '10 min', title: 'Sopa/caldo pronto + final bonito', how: 'Esquentar + montar prato decente. Resolve sem drama.', slot: '10' },
]

const PASSO_LEVE: DayLine[] = [
  { title: 'Resolver 1 coisa que está travando', why: 'O resto fica mais fácil quando algo destrava.', focus: 'casa', slot: '5' },
  { title: 'Fazer 5 min de conexão com o filho', why: 'Curto e intencional funciona melhor do que “tentar muito”.', focus: 'filho', slot: '5' },
  { title: 'Proteger 10 min só seus', why: 'Sem tela e sem tarefa. É recarregar para continuar.', focus: 'voce', slot: '10' },
  { title: 'Simplificar a refeição', why: 'Comida simples também é cuidado — e libera energia mental.', focus: 'comida', slot: '5' },
]

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-[12px] border transition',
        active ? 'bg-white/90 border-white/60 text-[#2f3a56]' : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function CardChoice({
  title,
  subtitle,
  tag,
  active,
  onClick,
}: {
  title: string
  subtitle: string
  tag: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-3xl border p-4 transition',
        active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
      ].join(' ')}
    >
      <div className="inline-flex w-max items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
        {tag}
      </div>
      <div className="mt-2 text-[13px] font-semibold text-[#2f3a56] leading-snug">{title}</div>
      <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">{subtitle}</div>
    </button>
  )
}

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0
  if (i < 0) return 0
  if (i >= len) return len - 1
  return i
}

function originFromFocus(f: Focus): TaskOrigin {
  if (f === 'filho') return 'family'
  if (f === 'voce') return 'selfcare'
  if (f === 'casa') return 'home'
  if (f === 'comida') return 'today'
  return 'other'
}

export default function MeuDiaLeveClient() {
  const [step, setStep] = useState<Step>('inspiracao')
  const [slot, setSlot] = useState<Slot>('5')
  const [mood, setMood] = useState<Mood>('corrida')
  const [focus, setFocus] = useState<Focus>('filho')

  const [pickedIdea, setPickedIdea] = useState<number>(0)
  const [pickedRecipe, setPickedRecipe] = useState<number>(0)
  const [pickedPasso, setPickedPasso] = useState<number>(0)

  const [saveFeedback, setSaveFeedback] = useState<string>('')

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'meu-dia-leve', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const inferred = inferContext()
    setSlot(inferred.slot)
    setMood(inferred.mood)
    setFocus(inferred.focus)
    setStep('inspiracao')

    try {
      track('meu_dia_leve.open', { slot: inferred.slot, mood: inferred.mood, focus: inferred.focus })
    } catch {}
  }, [])

  const inspiration = useMemo(() => INSPIRATIONS[mood], [mood])

  const ideasForNow = useMemo(() => {
    const strict = IDEIAS.filter((i) => i.slot === slot && i.focus === focus)
    if (strict.length >= 2) return strict.slice(0, 3)

    const bySlot = IDEIAS.filter((i) => i.slot === slot)
    if (bySlot.length >= 3) return bySlot.slice(0, 4)

    return IDEIAS.slice(0, 4)
  }, [slot, focus])

  const recipesForNow = useMemo(() => {
    const bySlot = RECEITAS.filter((r) => r.slot === slot)
    return (bySlot.length ? bySlot : RECEITAS).slice(0, 3)
  }, [slot])

  const passosForNow = useMemo(() => {
    const strict = PASSO_LEVE.filter((p) => p.focus === focus)
    return (strict.length ? strict : PASSO_LEVE).slice(0, 3)
  }, [focus])

  function go(next: Step) {
    setStep(next)
    try {
      track('meu_dia_leve.step', { step: next })
    } catch {}
  }

  function onSelectSlot(next: Slot) {
    setSlot(next)
    safeSetLS('eu360_day_slot', next)
    setPickedIdea(0)
    setPickedRecipe(0)
    setPickedPasso(0)
    try {
      track('meu_dia_leve.slot.select', { slot: next })
    } catch {}
  }

  function onSelectMood(next: Mood) {
    setMood(next)
    safeSetLS('eu360_mood', next)
    if (next === 'no-limite') {
      setSlot('3')
      safeSetLS('eu360_day_slot', '3')
    }
    try {
      track('meu_dia_leve.mood.select', { mood: next })
    } catch {}
  }

  function onSelectFocus(next: Focus) {
    setFocus(next)
    safeSetLS('eu360_focus_today', next)
    setPickedIdea(0)
    setPickedRecipe(0)
    setPickedPasso(0)
    try {
      track('meu_dia_leve.focus.select', { focus: next })
    } catch {}
  }

  const selectedIdea = ideasForNow[clampIndex(pickedIdea, ideasForNow.length)]
  const selectedRecipe = recipesForNow[clampIndex(pickedRecipe, recipesForNow.length)]
  const selectedPasso = passosForNow[clampIndex(pickedPasso, passosForNow.length)]

  function saveCurrentToMyDay(title: string) {
    const origin = originFromFocus(focus)
    const res = addTaskToMyDay({
      title,
      origin,
      source: MY_DAY_SOURCES.MATERNAR_MEU_DIA_LEVE,
    })

    if (res.created) setSaveFeedback('Salvo no Meu Dia.')
    else setSaveFeedback('Essa tarefa já estava no Meu Dia.')

    try {
      track('meu_dia_leve.save_to_my_day', {
        origin,
        created: res.created,
        dateKey: res.dateKey,
        source: MY_DAY_SOURCES.MATERNAR_MEU_DIA_LEVE,
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
        <div className="mx-auto max-w-3xl px-4 md:px-6">
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
                Meu Dia Leve
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Você entra sem clareza e sai com um próximo passo simples para agora — sem ficar caçando.
              </p>
            </div>
          </header>

          <Reveal>
            <section
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                overflow-hidden
              "
            >
              <div className="p-4 md:p-6 border-b border-white/25">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
                      <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
                    </div>

                    <div>
                      <div className="text-[12px] text-white/85">
                        Passo {stepIndex(step)}/4 • {slotTitle(slot)} • {slotLabel(slot)} • foco {focusTitle(focus)}
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Sugestão pronta para o seu agora
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        {slotHint(slot)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => go('ideias')}
                    className="
                      rounded-full
                      bg-white/90 hover:bg-white
                      text-[#2f3a56]
                      px-4 py-2 text-[12px]
                      shadow-lg transition
                    "
                  >
                    Começar
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                    <div className="text-[12px] text-white/85 mb-2">Quanto tempo dá?</div>
                    <div className="flex flex-wrap gap-2">
                      {(['3', '5', '10'] as Slot[]).map((s) => (
                        <Pill key={s} active={slot === s} onClick={() => onSelectSlot(s)}>
                          {slotLabel(s)}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                    <div className="text-[12px] text-white/85 mb-2">Como está o dia?</div>
                    <div className="flex flex-wrap gap-2">
                      {(['no-limite', 'corrida', 'ok', 'leve'] as Mood[]).map((m) => (
                        <Pill key={m} active={mood === m} onClick={() => onSelectMood(m)}>
                          {m === 'no-limite' ? 'no limite' : m}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                    <div className="text-[12px] text-white/85 mb-2">Foco de agora</div>
                    <div className="flex flex-wrap gap-2">
                      {(['filho', 'casa', 'comida', 'voce'] as Focus[]).map((f) => (
                        <Pill key={f} active={focus === f} onClick={() => onSelectFocus(f)}>
                          {focusTitle(f)}
                        </Pill>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'inspiracao' as const, label: 'Inspiração do dia' },
                      { id: 'ideias' as const, label: 'Ideias rápidas' },
                      { id: 'receitas' as const, label: 'Receitas rápidas' },
                      { id: 'passo' as const, label: 'Passo leve' },
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
                            ? 'bg-white/90 border-white/60 text-[#2f3a56]'
                            : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
                        ].join(' ')}
                      >
                        {it.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 md:p-6">
                {saveFeedback ? (
                  <div className="mb-4 rounded-2xl bg-white/80 border border-white/50 px-4 py-3 text-[12px] text-[#2f3a56]">
                    {saveFeedback}
                  </div>
                ) : null}

                {step === 'inspiracao' ? (
                  <div id="inspiracao" className="space-y-4">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Inspiração do dia
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">{moodTitle(mood)}</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Aqui é facilitador: uma linha para organizar o próximo passo. Sem discurso longo.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                          {inspiration.title}
                        </div>
                        <div className="mt-2 text-[16px] md:text-[18px] font-semibold text-[#2f3a56] leading-relaxed">
                          {inspiration.line}
                        </div>
                        <div className="mt-3 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Ação: <span className="font-semibold text-[#2f3a56]">{inspiration.action}</span>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('ideias')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Ver ideia pronta
                          </button>
                          <button
                            onClick={() => go('passo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ir direto ao passo leve
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {step === 'ideias' ? (
                  <div id="ideias" className="space-y-4">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="sun" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Ideias rápidas
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Escolha uma (e pronto)</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            O Materna não é para te dar mais coisa. É para te dar <span className="font-semibold">uma</span> coisa que funciona agora.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {ideasForNow.map((i, idx) => (
                          <CardChoice
                            key={`${i.title}-${idx}`}
                            tag={`${i.tag} • ${focusTitle(i.focus)}`}
                            title={i.title}
                            subtitle={i.how}
                            active={pickedIdea === idx}
                            onClick={() => {
                              setPickedIdea(idx)
                              try {
                                track('meu_dia_leve.idea.pick', { idx, title: i.title })
                              } catch {}
                            }}
                          />
                        ))}
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">faça agora</div>
                        <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">{selectedIdea?.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selectedIdea?.how}</div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              if (selectedIdea?.title) saveCurrentToMyDay(selectedIdea.title)
                            }}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('passo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar com um passo leve
                          </button>

                          <button
                            onClick={() => go('receitas')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Se a trava for comida
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {step === 'receitas' ? (
                  <div id="receitas" className="space-y-4">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Receitas rápidas
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Escolha uma solução e siga</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Sem cardápio perfeito. Aqui é “resolver com dignidade” e liberar sua cabeça.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {recipesForNow.map((r, idx) => {
                          const active = pickedRecipe === idx
                          return (
                            <button
                              key={`${r.title}-${idx}`}
                              onClick={() => {
                                setPickedRecipe(idx)
                                try {
                                  track('meu_dia_leve.recipe.pick', { idx, title: r.title })
                                } catch {}
                              }}
                              className={[
                                'w-full text-left rounded-2xl border p-4 transition',
                                active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                              ].join(' ')}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-[13px] font-semibold text-[#2f3a56]">{r.title}</div>
                                  <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">{r.how}</div>
                                </div>
                                <span className="shrink-0 inline-flex items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
                                  {r.tag}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">hoje resolve assim</div>
                        <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">{selectedRecipe?.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selectedRecipe?.how}</div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              if (selectedRecipe?.title) saveCurrentToMyDay(selectedRecipe.title)
                            }}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <button
                            onClick={() => go('passo')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar com o passo leve
                          </button>

                          <button
                            onClick={() => go('ideias')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar para ideias
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {step === 'passo' ? (
                  <div id="passo" className="space-y-4">
                    <SoftCard
                      className="
                        p-5 md:p-6 rounded-2xl
                        bg-white/95
                        border border-[#f5d7e5]
                        shadow-[0_6px_18px_rgba(184,35,107,0.09)]
                      "
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#ffe1f1] flex items-center justify-center shrink-0">
                          <AppIcon name="star" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Passo leve do dia
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Escolha um (e encerre)</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Um passo pequeno já muda o clima do dia. Não precisa “dar conta de tudo”.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {passosForNow.map((p, idx) => (
                          <CardChoice
                            key={`${p.title}-${idx}`}
                            tag={`${slotLabel(p.slot)} • ${focusTitle(p.focus)}`}
                            title={p.title}
                            subtitle={p.why}
                            active={pickedPasso === idx}
                            onClick={() => {
                              setPickedPasso(idx)
                              try {
                                track('meu_dia_leve.passo.pick', { idx, title: p.title })
                              } catch {}
                            }}
                          />
                        ))}
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-6">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">seu passo de hoje</div>
                        <div className="mt-2 text-[15px] font-semibold text-[#2f3a56]">{selectedPasso?.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selectedPasso?.why}</div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              if (selectedPasso?.title) saveCurrentToMyDay(selectedPasso.title)
                            }}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Salvar no Meu Dia
                          </button>

                          <Link
                            href="/maternar/meu-filho"
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ir para Meu Filho
                          </Link>

                          <button
                            onClick={() => go('ideias')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Trocar ideia rápida
                          </button>

                          <Link
                            href="/maternar"
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar ao Maternar
                          </Link>
                        </div>

                        <div className="mt-4 text-[12px] text-[#6a6a6a]">
                          Fechou. Um passo leve já é progresso no Materna360.
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}
              </div>
            </section>
          </Reveal>

          <div className="mt-6">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
