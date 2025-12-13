'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'

type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type Etapa = 'ritmo' | 'mini-rotina' | 'pausas' | 'para-voce'

const RITMOS: { key: Ritmo; label: string; hint: string }[] = [
  { key: 'leve', label: 'leve', hint: 'Hoje dá para fazer um pequeno passo.' },
  { key: 'cansada', label: 'cansada', hint: 'Hoje o básico já é suficiente.' },
  { key: 'animada', label: 'animada', hint: 'Aproveite a energia sem se cobrar.' },
  { key: 'sobrecarregada', label: 'sobrecarregada', hint: 'Hoje é dia de reduzir peso.' },
]

const MINI_ROTINAS = [
  {
    id: 'alongar-1min',
    title: 'Alongamento leve (1 min)',
    detail: 'Solte ombros e pescoço. Sem perfeição, só presença.',
    minutes: 1,
  },
  {
    id: 'agua-respira',
    title: 'Água + 3 respirações profundas',
    detail: 'Beba um gole. Inspire 4, solte 6. Três vezes.',
    minutes: 2,
  },
  {
    id: 'cantinho-calma',
    title: 'Organizar um cantinho que acalma',
    detail: 'Só o que cabe: uma superfície, um item, um respiro.',
    minutes: 3,
  },
  {
    id: 'hidratar-calma',
    title: 'Hidratante com calma',
    detail: 'Um gesto simples para o corpo entender: estou cuidando.',
    minutes: 2,
  },
] as const

const PAUSAS = [
  { id: 'respirar-60', title: 'Respirar 60s', detail: 'Inspire 4, solte 6. Repita.', minutes: 1 },
  { id: 'agua-pausa', title: 'Água + pausa', detail: 'Um gole e uma pausa real.', minutes: 1 },
  { id: 'alongar-pescoco', title: 'Soltar pescoço', detail: 'Gire de leve. Sem forçar.', minutes: 1 },
  { id: 'janela-20', title: 'Olhar pela janela', detail: '20 segundos de “longe” para o cérebro.', minutes: 1 },
] as const

function scrollToId(id: Etapa) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function nextStepFromRitmo(ritmo: Ritmo | null): Etapa {
  if (!ritmo) return 'ritmo'
  if (ritmo === 'sobrecarregada') return 'pausas'
  if (ritmo === 'cansada') return 'pausas'
  return 'mini-rotina'
}

function messageForRitmo(ritmo: Ritmo | null): string {
  if (!ritmo) {
    return 'Hoje você não precisa “dar conta”. Só precisa escolher um próximo passo pequeno.'
  }
  switch (ritmo) {
    case 'leve':
      return 'Hoje, faça um gesto curto e consistente. Pequeno, mas seu.'
    case 'cansada':
      return 'Hoje, a meta é aliviar: uma pausa real já muda o tom do dia.'
    case 'animada':
      return 'Hoje, use a energia com gentileza: sem acelerar para compensar.'
    case 'sobrecarregada':
      return 'Hoje, seu foco é reduzir peso: menos exigência, mais ar.'
  }
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [note, setNote] = useState('')
  const [miniRotinaId, setMiniRotinaId] = useState<string | null>(null)
  const [pausaId, setPausaId] = useState<string | null>(null)

  const [highlight, setHighlight] = useState<Etapa>('ritmo')

  const ritmoHint = useMemo(() => {
    if (!ritmo) return null
    return RITMOS.find((r) => r.key === ritmo)?.hint ?? null
  }, [ritmo])

  const recommendedNext = useMemo(() => nextStepFromRitmo(ritmo), [ritmo])
  const dailyMessage = useMemo(() => messageForRitmo(ritmo), [ritmo])

  const lastActionRef = useRef<string>('')

  useEffect(() => {
    try {
      track('nav.view', {
        page: 'cuidar-de-mim',
        timestamp: new Date().toISOString(),
      })
    } catch {}
  }, [])

  useEffect(() => {
    // Atualiza o “realce” da trilha conforme escolhas, sem travar o fluxo
    if (!ritmo) {
      setHighlight('ritmo')
      return
    }
    if (!miniRotinaId && (recommendedNext === 'mini-rotina' || ritmo === 'leve' || ritmo === 'animada')) {
      setHighlight('mini-rotina')
      return
    }
    if (!pausaId && (recommendedNext === 'pausas' || ritmo === 'cansada' || ritmo === 'sobrecarregada')) {
      setHighlight('pausas')
      return
    }
    setHighlight('para-voce')
  }, [ritmo, miniRotinaId, pausaId, recommendedNext])

  const topBgStyle: React.CSSProperties = {
    background: 'radial-gradient(circle at top left, #fdbed7 0%, #ffe1f1 70%, #ffffff 100%)',
  }

  return (
    <main
      data-tab="maternar-cuidar-de-mim"
      className="min-h-[100dvh] pb-32 relative overflow-hidden"
      style={topBgStyle}
    >
      {/* HALOS DE LUZ (somente tons suaves – sem pink saturado no fundo) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-12%] left-[-14%] w-[58%] h-[58%] bg-[#fdbed7]/55 blur-[110px] rounded-full" />
        <div className="absolute bottom-[-18%] right-[-14%] w-[52%] h-[52%] bg-[#ffe1f1]/70 blur-[120px] rounded-full" />
      </div>

      <ClientOnly>
        <div className="relative mx-auto max-w-3xl px-5 md:px-6">
          {/* HERO */}
          <header className="pt-10 md:pt-14 mb-7">
            <Reveal>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-[12px] tracking-wide uppercase text-[#6a6a6a]">
                    <span className="inline-flex h-6 px-3 rounded-full bg-white/70 border border-[#f5d7e5] items-center">
                      Maternar
                    </span>
                  </p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-[#545454] leading-tight mt-2">
                    Cuidar de Mim
                  </h1>
                  <p className="text-[15px] md:text-[17px] text-[#6a6a6a] mt-2 max-w-xl leading-relaxed">
                    Uma trilha curta para você respirar e escolher um gesto possível — sem culpa e sem esforço extra.
                  </p>
                </div>

                <div className="hidden md:flex items-center justify-center h-12 w-12 rounded-2xl bg-white/70 border border-[#f5d7e5] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                  <AppIcon name="heart" size={22} className="text-[#b8236b]" />
                </div>
              </div>
            </Reveal>
          </header>

          {/* “AGORA” – trilha inteligente em 30s */}
          <Reveal delay={120}>
            <section
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-8
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                    <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
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
                  onClick={() => scrollToId(recommendedNext)}
                  className="
                    shrink-0
                    rounded-full
                    bg-[#fd2597]
                    text-white
                    px-4 py-2.5
                    text-[13px]
                    shadow-lg
                    hover:opacity-95
                    transition
                  "
                  aria-label="Ir para o próximo passo recomendado"
                >
                  Ir para o próximo
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(
                  [
                    { id: 'ritmo', label: '1. Meu ritmo' },
                    { id: 'mini-rotina', label: '2. Mini rotina' },
                    { id: 'pausas', label: '3. Pausas rápidas' },
                    { id: 'para-voce', label: '4. Para você' },
                  ] as const
                ).map((chip) => {
                  const active = highlight === chip.id
                  return (
                    <button
                      key={chip.id}
                      onClick={() => scrollToId(chip.id)}
                      className={[
                        'rounded-full px-3.5 py-2 text-[12px] border transition',
                        active
                          ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#545454]'
                          : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                      ].join(' ')}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-4">
                <p className="text-[14px] text-[#545454] leading-relaxed">{dailyMessage}</p>
              </div>
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 1) MEU RITMO HOJE */}
          {/* ============================= */}
          <Reveal>
            <section
              id="ritmo"
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-8
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                  <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#545454]">Meu ritmo hoje</h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">Como você chega aqui agora — sem julgamento.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {RITMOS.map((r) => {
                  const active = ritmo === r.key
                  return (
                    <button
                      key={r.key}
                      onClick={() => {
                        setRitmo(r.key)
                        try {
                          track('cuidar_de_mim.ritmo.select', { ritmo: r.key })
                        } catch {}
                        lastActionRef.current = `ritmo:${r.key}`
                      }}
                      className={[
                        'rounded-2xl text-sm py-3 border transition shadow-[0_3px_10px_rgba(0,0,0,0.05)]',
                        active
                          ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#545454]'
                          : 'bg-white border-[#f5d7e5] text-[#545454] hover:bg-[#ffe1f1]',
                      ].join(' ')}
                    >
                      {r.label}
                    </button>
                  )
                })}
              </div>

              {ritmoHint ? (
                <div className="mt-4 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-4">
                  <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                    <span className="font-semibold text-[#545454]">Leitura rápida:</span> {ritmoHint}
                  </p>
                </div>
              ) : null}

              <label className="block mt-5">
                <span className="text-[12px] text-[#6a6a6a]">Se quiser, deixe uma frase (opcional)</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: estou no limite hoje, só quero que o dia fique mais leve…"
                  className="
                    mt-2 w-full rounded-2xl p-4 text-[14px]
                    bg-white
                    border border-[#f5d7e5]
                    focus:outline-none focus:ring-2 focus:ring-[#fd2597]/40
                    text-[#545454]
                    placeholder:text-[#a0a0a0]
                    min-h-[98px]
                  "
                />
              </label>
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 2) MINI ROTINA DE AUTOCUIDADO */}
          {/* ============================= */}
          <Reveal>
            <section
              id="mini-rotina"
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-8
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                  <AppIcon name="sparkles" size={22} className="text-[#b8236b]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#545454]">Mini rotina de autocuidado</h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">
                    Escolha uma opção de 1 a 3 minutos — a melhor é a que cabe.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {MINI_ROTINAS.map((step) => {
                  const active = miniRotinaId === step.id
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setMiniRotinaId(step.id)
                        try {
                          track('cuidar_de_mim.mini_rotina.select', { id: step.id, minutes: step.minutes })
                        } catch {}
                        lastActionRef.current = `mini:${step.id}`
                      }}
                      className={[
                        'text-left rounded-2xl p-4 border transition shadow-[0_3px_10px_rgba(0,0,0,0.05)]',
                        active
                          ? 'bg-[#fff7fb] border-[#f5d7e5]'
                          : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-semibold text-[#545454]">{step.title}</div>
                          <div className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">{step.detail}</div>
                        </div>
                        <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] bg-white border border-[#f5d7e5] text-[#6a6a6a]">
                          {step.minutes} min
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {miniRotinaId ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] p-4">
                  <p className="text-[13px] text-[#545454] leading-relaxed">
                    Perfeito. Se der, faça agora mesmo — sem esperar “o momento ideal”.
                  </p>
                  <button
                    onClick={() => scrollToId('para-voce')}
                    className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                  >
                    Concluir
                  </button>
                </div>
              ) : null}
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 3) PAUSAS RÁPIDAS */}
          {/* ============================= */}
          <Reveal>
            <section
              id="pausas"
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-8
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                  <AppIcon name="timer" size={22} className="text-[#fd2597]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#545454]">Pausas rápidas</h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">
                    Para quando você precisa de um “reset” curto — sem sumir do seu dia.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {PAUSAS.map((item) => {
                  const active = pausaId === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setPausaId(item.id)
                        try {
                          track('cuidar_de_mim.pausa.select', { id: item.id, minutes: item.minutes })
                        } catch {}
                        lastActionRef.current = `pausa:${item.id}`
                      }}
                      className={[
                        'text-left rounded-2xl p-4 border transition shadow-[0_3px_10px_rgba(0,0,0,0.05)]',
                        active
                          ? 'bg-[#fff7fb] border-[#f5d7e5]'
                          : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-semibold text-[#545454]">{item.title}</div>
                          <div className="text-[13px] text-[#6a6a6a] mt-1 leading-relaxed">{item.detail}</div>
                        </div>
                        <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] bg-white border border-[#f5d7e5] text-[#6a6a6a]">
                          {item.minutes} min
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {pausaId ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] p-4">
                  <p className="text-[13px] text-[#545454] leading-relaxed">
                    Boa. Você não precisa recuperar o dia inteiro — só precisa recuperar você.
                  </p>
                  <button
                    onClick={() => scrollToId('para-voce')}
                    className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                  >
                    Concluir
                  </button>
                </div>
              ) : null}
            </section>
          </Reveal>

          {/* ============================= */}
          {/* 4) PARA VOCÊ HOJE */}
          {/* ============================= */}
          <Reveal>
            <section
              id="para-voce"
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-10
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                  <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#545454]">Para você hoje</h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">Uma frase curta para te trazer de volta.</p>
                </div>
              </div>

              <div className="bg-[#fff7fb] p-5 rounded-2xl border border-[#f5d7e5] text-[15px] text-[#545454] leading-relaxed">
                “Hoje, escolha algo que cuide de você do mesmo jeito que você cuida de todo mundo.”
              </div>

              <div className="mt-4 rounded-2xl bg-white border border-[#f5d7e5] p-4">
                <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                  Se você fez uma escolha aqui, você já fez algo importante: voltou para si. Amanhã, a trilha continua
                  do mesmo jeito — pequena e possível.
                </p>
              </div>
            </section>
          </Reveal>

          <div className="mt-10">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
