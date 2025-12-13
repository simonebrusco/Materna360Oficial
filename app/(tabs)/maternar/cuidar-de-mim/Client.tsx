'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'

type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'
type Etapa = 'ritmo' | 'mini-rotina' | 'pausas' | 'para-voce'

const STORAGE_KEY_FAVORITE = 'maternar:cuidar-de-mim:favorited:v1'

const RITMOS: { key: Ritmo; label: string; hint: string }[] = [
  { key: 'leve', label: 'leve', hint: 'Hoje dá para fazer um pequeno passo com leveza.' },
  { key: 'cansada', label: 'cansada', hint: 'Hoje, o básico bem feito já é autocuidado.' },
  { key: 'animada', label: 'animada', hint: 'Use a energia sem se cobrar — constância > intensidade.' },
  { key: 'sobrecarregada', label: 'sobrecarregada', hint: 'Hoje é reduzir peso. Um “reset” curto já ajuda.' },
]

const MINI_ROTINAS = [
  {
    id: 'alongar-1min',
    title: 'Alongamento leve (1 min)',
    detail: 'Solte ombros e pescoço. Sem perfeição — só presença.',
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
    detail: 'Um gesto simples para o corpo entender: “estou cuidando”.',
    minutes: 2,
  },
] as const

const PAUSAS = [
  { id: 'respirar-60', title: 'Respirar 60s', detail: 'Inspire 4, solte 6. Repita.', minutes: 1 },
  { id: 'agua-pausa', title: 'Água + pausa', detail: 'Um gole e uma pausa real.', minutes: 1 },
  { id: 'alongar-pescoco', title: 'Soltar pescoço', detail: 'Gire de leve. Sem forçar.', minutes: 1 },
  { id: 'janela-20', title: 'Olhar pela janela', detail: '20s de “longe” para o cérebro.', minutes: 1 },
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
  if (!ritmo) return 'Você não precisa “dar conta”. Só precisa escolher um próximo passo pequeno.'
  switch (ritmo) {
    case 'leve':
      return 'Hoje, um gesto curto e consistente vale muito.'
    case 'cansada':
      return 'Hoje, alivie: uma pausa real já muda o tom do dia.'
    case 'animada':
      return 'Hoje, use a energia com gentileza — sem acelerar para compensar.'
    case 'sobrecarregada':
      return 'Hoje, seu foco é reduzir peso: menos exigência, mais ar.'
  }
}

function computeProgress(ritmo: Ritmo | null, miniRotinaId: string | null, pausaId: string | null): number {
  let p = 0
  if (ritmo) p += 1
  if (miniRotinaId) p += 1
  if (pausaId) p += 1
  return Math.min(p, 3)
}

function stepLabel(id: Etapa): string {
  switch (id) {
    case 'ritmo':
      return 'Meu ritmo'
    case 'mini-rotina':
      return 'Mini rotina'
    case 'pausas':
      return 'Pausas'
    case 'para-voce':
      return 'Para você'
  }
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo | null>(null)
  const [note, setNote] = useState('')
  const [miniRotinaId, setMiniRotinaId] = useState<string | null>(null)
  const [pausaId, setPausaId] = useState<string | null>(null)

  const [favorite, setFavorite] = useState(false)
  const [highlight, setHighlight] = useState<Etapa>('ritmo')

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
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FAVORITE)
      setFavorite(stored === '1')
    } catch {}
  }, [])

  const ritmoHint = useMemo(() => {
    if (!ritmo) return null
    return RITMOS.find((r) => r.key === ritmo)?.hint ?? null
  }, [ritmo])

  const recommendedNext = useMemo(() => nextStepFromRitmo(ritmo), [ritmo])
  const dailyMessage = useMemo(() => messageForRitmo(ritmo), [ritmo])

  const progress = useMemo(() => computeProgress(ritmo, miniRotinaId, pausaId), [ritmo, miniRotinaId, pausaId])
  const progressText = useMemo(() => `${Math.min(progress + 1, 4)}/4`, [progress])

  const ctaTarget = useMemo(() => {
    if (!ritmo) return 'ritmo' as Etapa
    if (recommendedNext === 'pausas' && !pausaId) return 'pausas' as Etapa
    if (recommendedNext === 'mini-rotina' && !miniRotinaId) return 'mini-rotina' as Etapa
    if (miniRotinaId || pausaId) return 'para-voce' as Etapa
    return recommendedNext
  }, [ritmo, recommendedNext, miniRotinaId, pausaId])

  const ctaLabel = useMemo(() => {
    if (!ritmo) return 'Começar'
    if (ctaTarget === 'para-voce') return `Fechar trilha (${progressText})`
    return `Continuar (${progressText})`
  }, [ritmo, ctaTarget, progressText])

  useEffect(() => {
    if (!ritmo) {
      setHighlight('ritmo')
      return
    }
    if (!miniRotinaId && recommendedNext === 'mini-rotina') {
      setHighlight('mini-rotina')
      return
    }
    if (!pausaId && recommendedNext === 'pausas') {
      setHighlight('pausas')
      return
    }
    setHighlight('para-voce')
  }, [ritmo, miniRotinaId, pausaId, recommendedNext])

  // Fundo interno mais claro + sempre finaliza em branco
  const topBgStyle: React.CSSProperties = {
    background: 'radial-gradient(circle at top left, #ffe1f1 0%, #ffffff 72%, #ffffff 100%)',
  }

  const steps: { id: Etapa; index: number }[] = useMemo(
    () => [
      { id: 'ritmo', index: 1 },
      { id: 'mini-rotina', index: 2 },
      { id: 'pausas', index: 3 },
      { id: 'para-voce', index: 4 },
    ],
    []
  )

  function toggleFavorite() {
    const next = !favorite
    setFavorite(next)
    try {
      localStorage.setItem(STORAGE_KEY_FAVORITE, next ? '1' : '0')
    } catch {}
    try {
      track('cuidar_de_mim.favorite.toggle', { value: next })
    } catch {}
  }

  return (
    <main
      data-tab="maternar-cuidar-de-mim"
      className="min-h-[100dvh] pb-32 relative overflow-hidden"
      style={topBgStyle}
    >
      {/* HALOS SUAVES (ainda mais leves, para manter “tom claro”) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-16%] left-[-18%] w-[62%] h-[62%] bg-[#fdbed7]/28 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-18%] w-[58%] h-[58%] bg-[#ffe1f1]/40 blur-[140px] rounded-full" />
      </div>

      <ClientOnly>
        <div className="relative mx-auto max-w-3xl px-5 md:px-6">
          <header className="pt-10 md:pt-14 mb-6">
            <Reveal>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-[12px] tracking-wide uppercase text-[#6a6a6a]">
                    <span className="inline-flex h-6 px-3 rounded-full bg-white/70 border border-[#f5d7e5] items-center">
                      Maternar
                    </span>
                  </p>

                  {/* H1 alinhado com o padrão das abas (28–32px) */}
                  <h1 className="text-[28px] md:text-[32px] font-semibold text-[#545454] leading-tight mt-2">
                    Cuidar de Mim
                  </h1>

                  <p className="text-[15px] md:text-[17px] text-[#6a6a6a] mt-2 max-w-xl leading-relaxed">
                    Trilhas curtas, decisões simples e gestos possíveis — para você voltar para si sem precisar de tempo “extra”.
                  </p>
                </div>

                <button
                  onClick={toggleFavorite}
                  className="
                    shrink-0
                    h-11 w-11
                    rounded-2xl
                    bg-white/70
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                    flex items-center justify-center
                    hover:bg-white
                    transition
                  "
                  aria-label={favorite ? 'Remover dos salvos' : 'Salvar esta trilha'}
                  title={favorite ? 'Salvo' : 'Salvar'}
                >
                  <AppIcon name="heart" size={20} className={favorite ? 'text-[#fd2597]' : 'text-[#b8236b]'} />
                </button>
              </div>
            </Reveal>
          </header>

          <Reveal delay={120}>
            <section
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-7
              "
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                    <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                  </div>
                  <div>
                    <h2 className="text-[18px] md:text-[20px] font-semibold text-[#545454] leading-snug">
                      Agora: um passo bom o suficiente
                    </h2>
                    <p className="text-[13px] md:text-[14px] text-[#6a6a6a] mt-1 leading-relaxed">
                      Escolha o que ajuda hoje. O resto pode esperar.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => scrollToId(ctaTarget)}
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
                  aria-label="Ir para o próximo passo da trilha"
                >
                  {ctaLabel}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {steps.map((s) => {
                  const isActive = highlight === s.id
                  const isDone =
                    (s.id === 'ritmo' && !!ritmo) ||
                    (s.id === 'mini-rotina' && !!miniRotinaId) ||
                    (s.id === 'pausas' && !!pausaId)

                  const base =
                    'rounded-full px-3.5 py-2 text-[12px] border transition inline-flex items-center gap-2'

                  const styles = isActive
                    ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#545454]'
                    : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]'

                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToId(s.id)}
                      className={[base, styles].join(' ')}
                      aria-label={`Ir para ${stepLabel(s.id)}`}
                    >
                      <span
                        className={[
                          'inline-flex h-5 w-5 rounded-full items-center justify-center text-[11px] border',
                          isDone
                            ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#545454]'
                            : 'bg-white border-[#f5d7e5] text-[#6a6a6a]',
                        ].join(' ')}
                      >
                        {isDone ? '✓' : s.index}
                      </span>
                      <span className="leading-none">{stepLabel(s.id)}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-4">
                <p className="text-[14px] text-[#545454] leading-relaxed">{dailyMessage}</p>
                {favorite ? <p className="text-[12px] text-[#6a6a6a] mt-2">Salvo nos seus favoritos — para voltar rápido.</p> : null}
              </div>
            </section>
          </Reveal>

          {/* 1) MEU RITMO HOJE */}
          <Reveal>
            <section
              id="ritmo"
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-6
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                  <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#545454]">Meu ritmo hoje</h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">Sem julgamento: como você chega agora?</p>
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
                    min-h-[92px]
                  "
                />
              </label>
            </section>
          </Reveal>

          {/* 2) MINI ROTINA DE AUTOCUIDADO */}
          <Reveal>
            <section
              id="mini-rotina"
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-6
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                  <AppIcon name="sparkles" size={22} className="text-[#b8236b]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#545454]">Mini rotina de autocuidado</h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">
                    Para quando você quer se sentir melhor sem precisar de “tempo livre”.
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
                        active ? 'bg-[#fff7fb] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
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
                    Fez sentido. Se der, faça agora mesmo — sem esperar o momento perfeito.
                  </p>
                  <button
                    onClick={() => scrollToId('para-voce')}
                    className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                  >
                    Fechar
                  </button>
                </div>
              ) : null}
            </section>
          </Reveal>

          {/* 3) PAUSAS RÁPIDAS */}
          <Reveal>
            <section
              id="pausas"
              className="
                bg-white
                rounded-3xl
                p-6 md:p-7
                shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                border border-[#f5d7e5]
                mb-6
              "
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center">
                  <AppIcon name="timer" size={22} className="text-[#fd2597]" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-[#545454]">Pausas rápidas</h2>
                  <p className="text-[14px] text-[#6a6a6a] mt-1">Para quando você precisa se regular sem “sumir”.</p>
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
                        active ? 'bg-[#fff7fb] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
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
                    Fechar
                  </button>
                </div>
              ) : null}
            </section>
          </Reveal>

          {/* 4) PARA VOCÊ HOJE */}
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
