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

export const dynamic = 'force-dynamic'
export const revalidate = 0

type FocusMode = 'respirar-1' | 'recarregar-3' | 'cuidar-5'
type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type Etapa = 'ritmo' | 'mini-rotina' | 'pausas' | 'para-voce'

type Suggestion = {
  id: string
  title: string
  subtitle: string
  minutes: 1 | 3 | 5
  tags: string[]
  steps: string[]
  microWin: string
  pauseOptions: { label: string; min: 1 | 2 }[]
  phrase: string
}

function scrollToId(id: Etapa) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function focusLabel(f: FocusMode) {
  switch (f) {
    case 'respirar-1':
      return 'Respirar agora (1 min)'
    case 'recarregar-3':
      return 'Recarregar (3 min)'
    case 'cuidar-5':
      return 'Cuidar com calma (5 min)'
  }
}

function focusHint(f: FocusMode) {
  switch (f) {
    case 'respirar-1':
      return 'Quando você só precisa baixar o volume por um minuto.'
    case 'recarregar-3':
      return 'Quando dá para fazer um pequeno “reset” e seguir.'
    case 'cuidar-5':
      return 'Quando você consegue se tratar com um pouco mais de cuidado.'
  }
}

function ritmoHint(r: Ritmo) {
  switch (r) {
    case 'leve':
      return 'Hoje é um dia de manter leve e não se exigir demais.'
    case 'cansada':
      return 'Hoje o foco é recuperar um pouco do seu fôlego.'
    case 'animada':
      return 'Hoje dá para cuidar de você e manter o ritmo bom.'
    case 'sobrecarregada':
      return 'Hoje o objetivo é reduzir pressão — um passo pequeno já ajuda.'
  }
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'respirar-1',
    title: 'Respiração curta para acalmar',
    subtitle: 'Um minuto para baixar a pressão do corpo e voltar para si.',
    minutes: 1,
    tags: ['1 min', 'agora'],
    steps: ['Inspire pelo nariz contando 4.', 'Segure 2.', 'Solte pela boca contando 6.', 'Repita 3 vezes.'],
    microWin: 'Você acabou de criar espaço dentro do seu dia.',
    pauseOptions: [
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água + pausa', min: 1 },
      { label: 'Ombros para baixo', min: 1 },
      { label: 'Olhar pela janela', min: 1 },
    ],
    phrase: 'Hoje, você não precisa dar conta de tudo. Precisa só se acolher um pouco.',
  },
  {
    id: 'recarregar-3',
    title: 'Reset de 3 minutos (corpo + mente)',
    subtitle: 'Pequeno ajuste para você seguir mais inteira, sem esperar “o momento ideal”.',
    minutes: 3,
    tags: ['3 min', 'reset'],
    steps: [
      'Beba alguns goles de água.',
      'Solte o pescoço: 3 giros bem leves.',
      'Respire: 4 inspirações lentas.',
      'Escolha 1 próxima ação possível (bem pequena).',
    ],
    microWin: 'Você se deu um reinício sem precisar parar o mundo.',
    pauseOptions: [
      { label: 'Água + pausa', min: 1 },
      { label: 'Alongar pescoço', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Alongar mãos', min: 1 },
    ],
    phrase: 'O cuidado de hoje pode ser simples — e ainda assim real.',
  },
  {
    id: 'cuidar-5',
    title: 'Cuidar com calma (5 min)',
    subtitle: 'Um gesto mais completo, sem perfeição. Só cuidado possível.',
    minutes: 5,
    tags: ['5 min', 'suave'],
    steps: [
      'Passe um hidratante com atenção (mãos ou rosto).',
      'Alongue braços por 30 segundos.',
      'Respire 4 vezes com a mão no peito.',
      'Organize um “cantinho” mínimo: 1 item no lugar.',
    ],
    microWin: 'Você se lembrou de você — isso muda o dia.',
    pauseOptions: [
      { label: 'Hidratante com calma', min: 2 },
      { label: 'Alongar braços', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
      { label: 'Água + pausa', min: 1 },
    ],
    phrase: 'Você merece o mesmo carinho que oferece para todo mundo.',
  },
]

function pickSuggestion(focus: FocusMode, ritmo: Ritmo): Suggestion {
  // “Inteligência suave”: se sobrecarregada, puxa para o mais curto por padrão.
  if (ritmo === 'sobrecarregada' && focus !== 'respirar-1') {
    return SUGGESTIONS.find((s) => s.id === 'respirar-1')!
  }
  return SUGGESTIONS.find((s) => s.id === focus)!
}

export default function Client() {
  const [focus, setFocus] = useState<FocusMode>('respirar-1')
  const [ritmo, setRitmo] = useState<Ritmo>('leve')
  const [note, setNote] = useState('')
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false])
  const [pauseIndex, setPauseIndex] = useState(0)

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  const featured = useMemo(() => pickSuggestion(focus, ritmo), [focus, ritmo])

  useEffect(() => {
    // Reset suave quando muda o “caminho”
    setChecked([false, false, false, false])
    setPauseIndex(0)
  }, [featured.id])

  const progress = useMemo(() => checked.filter(Boolean).length, [checked])

  const bgStyle: React.CSSProperties = {
    background: 'radial-gradient(circle at top left, #ffe1f1 0%, #ffffff 72%, #ffffff 100%)',
  }

  function onSelectFocus(next: FocusMode) {
    setFocus(next)
    try {
      track('cuidar_de_mim.focus.select', { focus: next })
    } catch {}
    scrollToId('mini-rotina')
  }

  function onSelectRitmo(next: Ritmo) {
    setRitmo(next)
    try {
      track('cuidar_de_mim.ritmo.select', { ritmo: next })
    } catch {}
    scrollToId('mini-rotina')
  }

  function toggleStep(i: number) {
    setChecked((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      try {
        track('cuidar_de_mim.step.toggle', { i, value: next[i], suggestion: featured.id })
      } catch {}
      return next
    })
  }

  function nextPause() {
    setPauseIndex((p) => (p + 1) % featured.pauseOptions.length)
    try {
      track('cuidar_de_mim.pause.next', { suggestion: featured.id })
    } catch {}
  }

  return (
    <main
      data-tab="maternar-cuidar-de-mim"
      className="min-h-[100dvh] pb-32 relative overflow-hidden"
      style={bgStyle}
    >
      {/* HALOS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-16%] left-[-18%] w-[62%] h-[62%] bg-[#fdbed7]/22 blur-[145px] rounded-full" />
        <div className="absolute bottom-[-22%] right-[-18%] w-[58%] h-[58%] bg-[#ffe1f1]/38 blur-[155px] rounded-full" />
      </div>

      <ClientOnly>
        <div className="relative mx-auto max-w-3xl px-5 md:px-6">
          {/* HERO */}
          <header className="pt-10 md:pt-14 mb-6">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-[#6a6a6a] hover:text-[#545454] transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <p className="inline-flex items-center gap-2 text-[12px] tracking-wide uppercase text-[#6a6a6a]">
                <span className="inline-flex h-6 px-3 rounded-full bg-white/70 border border-[#f5d7e5] items-center">
                  Cuidar de mim
                </span>
              </p>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-[28px] md:text-[32px] font-semibold text-[#545454] leading-tight">
                    Cuidar de Mim
                  </h1>
                  <p className="text-[15px] md:text-[17px] text-[#6a6a6a] mt-2 max-w-xl leading-relaxed">
                    Uma experiência curta e guiada para você respirar, se reorganizar por dentro e seguir com mais leveza.
                  </p>
                </div>

                <div className="hidden md:flex items-center justify-center h-11 w-11 rounded-2xl bg-white/70 border border-[#f5d7e5] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                  <AppIcon name="sparkles" size={20} className="text-[#b8236b]" />
                </div>
              </div>
            </div>
          </header>

          {/* COMANDO CENTRAL (interliga tudo) */}
          <Reveal>
            <section
              className="
                bg-white rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-7
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                    <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                  </div>
                  <div>
                    <h2 className="text-[18px] md:text-[20px] font-semibold text-[#545454] leading-snug">
                      Agora, escolha só um próximo passo
                    </h2>
                    <p className="text-[13px] md:text-[14px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Em vez de fazer tudo, faça o que ajuda de verdade hoje.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => scrollToId('ritmo')}
                  className="
                    shrink-0 rounded-full
                    bg-[#fd2597] text-white
                    px-4 py-2.5 text-[13px]
                    shadow-lg hover:opacity-95 transition
                  "
                >
                  Começar
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                {(
                  [
                    { id: 'respirar-1' as const, icon: 'timer', title: 'Respirar agora', meta: '1 min' },
                    { id: 'recarregar-3' as const, icon: 'sparkles', title: 'Recarregar', meta: '3 min' },
                    { id: 'cuidar-5' as const, icon: 'heart', title: 'Cuidar com calma', meta: '5 min' },
                  ] as const
                ).map((opt) => {
                  const active = focus === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onSelectFocus(opt.id)}
                      className={[
                        'rounded-3xl border transition text-left p-4 shadow-[0_6px_22px_rgba(0,0,0,0.05)]',
                        active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                      ].join(' ')}
                      aria-label={focusLabel(opt.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-white border border-[#f5d7e5] flex items-center justify-center">
                            <AppIcon name={opt.icon as any} size={20} className="text-[#b8236b]" />
                          </div>
                          <div>
                            <div className="text-[14px] font-semibold text-[#545454]">{opt.title}</div>
                            <div className="text-[12px] text-[#6a6a6a] mt-1">{opt.meta}</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#6a6a6a]">{active ? 'ativo' : ' '}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 text-[12px] text-[#6a6a6a]">
                {focusHint(focus)}
              </div>
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 1) MEU RITMO HOJE */}
          {/* ============================= */}
          <section id="ritmo">
            <Reveal>
              <SoftCard
                className="
                  p-6 md:p-7 rounded-3xl
                  bg-white border border-[#f5d7e5]
                  shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  mb-7
                "
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                      Meu ritmo hoje
                    </span>
                    <h2 className="text-[18px] font-semibold text-[#545454]">
                      Como você chega aqui agora?
                    </h2>
                    <p className="text-[14px] text-[#6a6a6a]">
                      Sem julgamento — só para ajustar o cuidado de hoje.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['leve', 'cansada', 'animada', 'sobrecarregada'] as Ritmo[]).map((r) => {
                    const active = ritmo === r
                    return (
                      <button
                        key={r}
                        onClick={() => onSelectRitmo(r)}
                        className={[
                          'rounded-full px-3.5 py-2 text-[12px] border transition',
                          active
                            ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#545454]'
                            : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                  <div className="text-[14px] text-[#545454] font-semibold">
                    {ritmoHint(ritmo)}
                  </div>

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Se quiser, escreva uma frase (opcional). Ex.: “tô no limite hoje, só quero que o dia fique mais leve…”"
                    className="
                      mt-4 w-full rounded-2xl p-4 text-[13px]
                      bg-white border border-[#f5d7e5]
                      focus:outline-none focus:ring-2 focus:ring-[#fd2597]/30
                      text-[#545454]
                      placeholder:text-[#a0a0a0]
                      min-h-[92px]
                    "
                  />
                </div>
              </SoftCard>
            </Reveal>
          </section>

          {/* ============================= */}
          {/* 2) MINI ROTINA DE AUTOCUIDADO (protagonista + checklist) */}
          {/* ============================= */}
          <section id="mini-rotina">
            <Reveal>
              <SoftCard
                className="
                  p-6 md:p-7 rounded-3xl
                  bg-white border border-[#f5d7e5]
                  shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  mb-7
                "
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                      Mini rotina de autocuidado
                    </span>
                    <h2 className="text-[18px] font-semibold text-[#545454]">
                      A opção mais certeira para hoje
                    </h2>
                    <p className="text-[14px] text-[#6a6a6a]">
                      Baseada no seu foco e no seu ritmo atual.
                    </p>
                  </div>
                </div>

                {/* Card protagonista */}
                <div className="mt-5 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {featured.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-white border border-[#f5d7e5] px-2.5 py-1 text-[11px] text-[#6a6a6a]"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto inline-flex items-center rounded-full bg-[#ffd8e6] border border-[#f5d7e5] px-2.5 py-1 text-[11px] text-[#545454]">
                      {featured.minutes} min
                    </span>
                  </div>

                  <div className="text-[16px] md:text-[18px] font-semibold text-[#545454]">
                    {featured.title}
                  </div>
                  <div className="text-[13px] md:text-[14px] text-[#6a6a6a] mt-1 leading-relaxed">
                    {featured.subtitle}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featured.steps.slice(0, 4).map((s, i) => (
                      <button
                        key={s}
                        onClick={() => toggleStep(i)}
                        className={[
                          'rounded-2xl border p-4 text-left transition',
                          checked[i] ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">
                          passo {i + 1}
                        </div>
                        <div className="text-[13px] text-[#545454] mt-1 leading-relaxed">
                          {s}
                        </div>
                        <div className="text-[12px] text-[#6a6a6a] mt-3">
                          {checked[i] ? 'feito ✓' : 'marcar como feito'}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-[12px] text-[#6a6a6a]">
                      progresso: <span className="font-semibold text-[#545454]">{progress}</span>/4
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => scrollToId('pausas')}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Preciso de pausa rápida
                      </button>
                      <button
                        onClick={() => scrollToId('para-voce')}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Fechar com carinho
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 text-[12px] text-[#6a6a6a] leading-relaxed">
                    {featured.microWin}
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </section>

          {/* ============================= */}
          {/* 3) PAUSAS RÁPIDAS (1 pausa por vez + próximo) */}
          {/* ============================= */}
          <section id="pausas">
            <Reveal>
              <SoftCard
                className="
                  p-6 md:p-7 rounded-3xl
                  bg-white border border-[#f5d7e5]
                  shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  mb-7
                "
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="timer" size={22} className="text-[#fd2597]" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                      Pausas rápidas
                    </span>
                    <h2 className="text-[18px] font-semibold text-[#545454]">
                      Um “reset” sem sumir do seu dia
                    </h2>
                    <p className="text-[14px] text-[#6a6a6a]">
                      Escolha uma pausa. Só uma. E já está valendo.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                  <div className="text-[12px] text-[#b8236b] font-semibold uppercase tracking-wide">
                    agora
                  </div>

                  <div className="text-[16px] md:text-[18px] font-semibold text-[#545454] mt-2 leading-relaxed">
                    {featured.pauseOptions[pauseIndex]?.label}
                  </div>

                  <div className="mt-3 text-[12px] text-[#6a6a6a]">
                    Duração sugerida: {featured.pauseOptions[pauseIndex]?.min} min
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={nextPause}
                      className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                    >
                      Outra pausa
                    </button>
                    <button
                      onClick={() => scrollToId('mini-rotina')}
                      className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                    >
                      Voltar para a mini rotina
                    </button>
                  </div>

                  <div className="mt-4 text-[12px] text-[#6a6a6a] leading-relaxed">
                    Se hoje estiver pesado, o seu cuidado pode ser mínimo — e ainda assim verdadeiro.
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </section>

          {/* ============================= */}
          {/* 4) PARA VOCÊ HOJE (fechamento emocional interligado) */}
          {/* ============================= */}
          <section id="para-voce">
            <Reveal>
              <SoftCard
                className="
                  p-6 md:p-7 rounded-3xl
                  bg-white border border-[#f5d7e5]
                  shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  mb-10
                "
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                      Para você hoje
                    </span>
                    <h2 className="text-[18px] font-semibold text-[#545454]">
                      Um lembrete gentil (do tamanho do seu dia)
                    </h2>
                    <p className="text-[14px] text-[#6a6a6a]">
                      Fechamento da experiência: um carinho que te devolve para você.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                  <div className="text-[12px] text-[#b8236b] font-semibold uppercase tracking-wide">
                    hoje
                  </div>
                  <div className="text-[16px] md:text-[18px] font-semibold text-[#545454] mt-2 leading-relaxed">
                    {featured.phrase}
                  </div>

                  <div className="mt-4 text-[12px] text-[#6a6a6a] leading-relaxed">
                    Você escolheu: <span className="font-semibold text-[#545454]">{focusLabel(focus)}</span> · ritmo:{' '}
                    <span className="font-semibold text-[#545454]">{ritmo}</span>
                    {note?.trim() ? (
                      <>
                        <br />
                        <span className="text-[#545454]">Sua frase:</span> “{note.trim()}”
                      </>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => scrollToId('ritmo')}
                      className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                    >
                      Ajustar meu ritmo
                    </button>
                    <button
                      onClick={() => scrollToId('mini-rotina')}
                      className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                    >
                      Repetir o cuidado de hoje
                    </button>
                  </div>
                </div>
              </SoftCard>
            </Reveal>
          </section>

          <div className="mt-4">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
