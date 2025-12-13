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

export const dynamic = 'force-dynamic'
export const revalidate = 0

type FocusMode = 'conectar-2' | 'brincar-10' | 'fluir-dia'
type AgeGroup = '0-2' | '3-4' | '5-6' | '6+'
type Etapa = 'brincadeiras' | 'desenvolvimento' | 'rotina' | 'conexao'

type Activity = {
  id: string
  title: string
  subtitle: string
  tags: string[]
  minutes: 2 | 5 | 10
  ageFit: AgeGroup[]
  steps: string[]
  routine: {
    before: string
    during: string
    after: string
  }
  connection: string[]
}

function scrollToId(id: Etapa) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function ageLabel(a: AgeGroup) {
  switch (a) {
    case '0-2':
      return '0–2'
    case '3-4':
      return '3–4'
    case '5-6':
      return '5–6'
    case '6+':
      return '+6'
  }
}

function focusLabel(f: FocusMode) {
  switch (f) {
    case 'conectar-2':
      return 'Conectar agora (2 min)'
    case 'brincar-10':
      return 'Brincar rápido (10 min)'
    case 'fluir-dia':
      return 'Fazer o dia fluir'
  }
}

function focusHint(f: FocusMode) {
  switch (f) {
    case 'conectar-2':
      return 'Um gesto curto para mudar o clima sem bagunçar o dia.'
    case 'brincar-10':
      return 'Uma brincadeira simples para vocês se encontrarem com presença.'
    case 'fluir-dia':
      return 'Um ajuste leve de rotina para reduzir atrito ao longo do dia.'
  }
}

const AGE_GROUPS: { id: AgeGroup; title: string; hint: string }[] = [
  { id: '0-2', title: '0–2 anos', hint: 'Sentidos e segurança: explorar com calma.' },
  { id: '3-4', title: '3–4 anos', hint: 'Faz de conta e energia: brincar é linguagem.' },
  { id: '5-6', title: '5–6 anos', hint: 'Curiosidade e autonomia: perguntas e escolhas.' },
  { id: '6+', title: '+6 anos', hint: 'Opinião e limites: combinar e sustentar com carinho.' },
]

const ACTIVITIES: Activity[] = [
  {
    id: 'tesouro-casa',
    title: 'Caça aos tesouros da casa',
    subtitle: 'Escolham 3 coisas para encontrar juntos. Simples e divertido.',
    tags: ['rápido', 'conexão'],
    minutes: 10,
    ageFit: ['3-4', '5-6', '6+'],
    steps: [
      'Escolham 3 “tesouros” (ex.: algo redondo, algo macio, algo vermelho).',
      'Definam o combinado: sem pressa, sem competir.',
      'Quando acharem, comemorem com um “toque secreto” (mãozinha, abraço, sorriso).',
    ],
    routine: {
      before: 'Avise: “vamos brincar 10 min e depois voltamos para o que estávamos fazendo”.',
      during: 'Deixe ele liderar uma parte (ele escolhe 1 tesouro).',
      after: 'Fechem com um gesto: “obrigada por brincar comigo”.',
    },
    connection: [
      'Olhos nos olhos por 10 segundos antes de começar.',
      'Dizer uma coisa específica que você gostou: “eu gostei quando você…”',
      'Abraço curto com respiração junto: 2 inspirações.',
    ],
  },
  {
    id: 'espelho-desenho',
    title: 'Desenho espelhado',
    subtitle: 'Um traço seu, um traço dele. Vocês criam juntos, sem certo/errado.',
    tags: ['calminho', 'criativo'],
    minutes: 10,
    ageFit: ['3-4', '5-6', '6+'],
    steps: [
      'Você faz um traço bem simples.',
      'Ele imita do jeito dele (sem corrigir).',
      'Alternem 6 rodadas e deem um nome para o desenho.',
    ],
    routine: {
      before: 'Organize “o mínimo”: papel + um lápis. Só isso.',
      during: 'Se ele frustrar, valide: “entendi, vamos fazer do seu jeito”.',
      after: 'Guardem o desenho em um lugar “da história de vocês”.',
    },
    connection: [
      'Elogio específico: “adorei a sua ideia de…”',
      'Toque no ombro com carinho e “tô aqui”.',
      'Pergunta curta: “qual parte você mais gostou?”.',
    ],
  },
  {
    id: 'almofadas-caminho',
    title: 'Caminho de almofadas',
    subtitle: 'Um mini percurso na sala para gastar energia sem sair de casa.',
    tags: ['movimento', 'energia'],
    minutes: 10,
    ageFit: ['3-4', '5-6', '6+'],
    steps: [
      'Disponha 4–6 almofadas no chão (sem perfeição).',
      'Façam 3 travessias: normal, lento, “robô”.',
      'Finalize com “estátua” por 5 segundos.',
    ],
    routine: {
      before: 'Diga: “depois a gente guarda juntos em 1 minuto”.',
      during: 'Você faz 1 rodada junto (mesmo que pequena).',
      after: 'Guardem 3 almofadas juntos — e acabou.',
    },
    connection: [
      'Um high-five lento.',
      'Um abraço curto depois da última travessia.',
      'Dizer: “eu gostei de ver você se divertindo”.',
    ],
  },
  {
    id: 'historia-a-dois',
    title: 'História inventada a dois',
    subtitle: 'Cada um diz uma frase. A história nasce — e vira lembrança.',
    tags: ['conexão', 'imaginação'],
    minutes: 10,
    ageFit: ['3-4', '5-6', '6+'],
    steps: [
      'Comece com: “Era uma vez…” (bem simples).',
      'Ele continua com uma frase.',
      'Vocês fazem 8 frases no total e dão um título.',
    ],
    routine: {
      before: 'Aviso curto: “vamos fazer uma história rapidinha”.',
      during: 'Se ele repetir ideias, valide: repetição também é segurança.',
      after: 'Feche com: “amanhã a gente continua”.',
    },
    connection: [
      'Olhar atento enquanto ele fala (sem tela).',
      'Sorriso e “obrigada por me contar”.',
      'Pergunta: “quem foi o herói hoje?”.',
    ],
  },
  {
    id: 'sensorial-2min',
    title: 'Explorar com os sentidos (2 min)',
    subtitle: 'Um mini jogo sensorial para acalmar e reconectar.',
    tags: ['2 min', 'sensorial'],
    minutes: 2,
    ageFit: ['0-2', '3-4'],
    steps: [
      'Escolha um objeto seguro (tecido, colher, bola macia).',
      'Nomeie 2 coisas: “macio”, “frio”, “liso”…',
      'Finalize com um sorriso e um toque carinhoso.',
    ],
    routine: {
      before: 'Sente perto. Só presença.',
      during: 'Descreva sem ensinar: “você está explorando”.',
      after: 'Um abraço curto, acabou.',
    },
    connection: [
      'Toque gentil na mão.',
      'Dizer baixinho: “tô aqui com você”.',
      'Olhar + sorriso (sem pressa).',
    ],
  },
]

function pickFeatured(activities: Activity[], focus: FocusMode, age: AgeGroup): Activity {
  const ageFiltered = activities.filter((a) => a.ageFit.includes(age))

  if (focus === 'conectar-2') {
    const twoMin = ageFiltered.find((a) => a.minutes === 2) ?? activities.find((a) => a.minutes === 2)
    return twoMin ?? activities[0]
  }

  if (focus === 'brincar-10') {
    const ten = ageFiltered.find((a) => a.minutes === 10) ?? activities.find((a) => a.minutes === 10)
    return ten ?? activities[0]
  }

  // fluir-dia -> prioriza uma brincadeira que vira “âncora” do dia (10 min) e tenha passos claros
  const anchor =
    ageFiltered.find((a) => a.minutes === 10 && a.steps.length >= 3) ??
    activities.find((a) => a.minutes === 10 && a.steps.length >= 3)

  return anchor ?? activities[0]
}

export default function MeuFilhoClient() {
  const [focus, setFocus] = useState<FocusMode>('brincar-10')
  const [age, setAge] = useState<AgeGroup>('3-4')
  const [checked, setChecked] = useState<{ before: boolean; during: boolean; after: boolean }>({
    before: false,
    during: false,
    after: false,
  })
  const [gestureIndex, setGestureIndex] = useState(0)

  useEffect(() => {
    try {
      track('nav.view', {
        tab: 'maternar',
        page: 'meu-filho',
        timestamp: new Date().toISOString(),
      })
    } catch {}
  }, [])

  const featured = useMemo(() => pickFeatured(ACTIVITIES, focus, age), [focus, age])
  const alternatives = useMemo(() => {
    const filtered = ACTIVITIES.filter((a) => a.id !== featured.id && a.ageFit.includes(age))
    return filtered.slice(0, 3)
  }, [featured.id, age])

  useEffect(() => {
    // reset suave quando muda o “caminho”
    setChecked({ before: false, during: false, after: false })
    setGestureIndex(0)
  }, [focus, age, featured.id])

  const bgStyle: React.CSSProperties = {
    background: 'radial-gradient(circle at top left, #ffe1f1 0%, #ffffff 72%, #ffffff 100%)',
  }

  const halo = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[-16%] left-[-18%] w-[62%] h-[62%] bg-[#fdbed7]/22 blur-[145px] rounded-full" />
      <div className="absolute bottom-[-22%] right-[-18%] w-[58%] h-[58%] bg-[#ffe1f1]/38 blur-[155px] rounded-full" />
    </div>
  )

  const progress = useMemo(() => {
    const n = Number(checked.before) + Number(checked.during) + Number(checked.after)
    return clamp(n, 0, 3)
  }, [checked])

  const connectionLine = useMemo(() => {
    const list = featured.connection
    if (!list.length) return 'Hoje, só um gesto curto já muda o clima.'
    const idx = clamp(gestureIndex, 0, list.length - 1)
    return list[idx]
  }, [featured.connection, gestureIndex])

  function onSelectFocus(next: FocusMode) {
    setFocus(next)
    try {
      track('meu_filho.focus.select', { focus: next })
    } catch {}
    // conduz para a seção 1 sempre (a experiência começa na brincadeira “protagonista”)
    scrollToId('brincadeiras')
  }

  function onSelectAge(next: AgeGroup) {
    setAge(next)
    try {
      track('meu_filho.age.select', { age: next })
    } catch {}
    scrollToId('desenvolvimento')
  }

  function toggleChecklist(key: 'before' | 'during' | 'after') {
    setChecked((p) => {
      const next = { ...p, [key]: !p[key] }
      try {
        track('meu_filho.routine.check', { key, value: next[key] })
      } catch {}
      return next
    })
  }

  function nextGesture() {
    const len = featured.connection.length || 1
    setGestureIndex((p) => (p + 1) % len)
    try {
      track('meu_filho.connection.next', { activity: featured.id })
    } catch {}
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="min-h-[100dvh] pb-32 relative overflow-hidden"
      style={bgStyle}
    >
      {halo}

      <ClientOnly>
        <div className="relative mx-auto max-w-3xl px-4 md:px-6">
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

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-[12px] tracking-wide uppercase text-[#6a6a6a]">
                    <span className="inline-flex h-6 px-3 rounded-full bg-white/70 border border-[#f5d7e5] items-center">
                      Meu filho
                    </span>
                  </p>

                  <h1 className="text-[28px] md:text-[32px] font-semibold text-[#545454] leading-tight mt-2">
                    Meu Filho
                  </h1>

                  <p className="text-[15px] md:text-[17px] text-[#6a6a6a] leading-relaxed max-w-xl mt-2">
                    Uma experiência única para hoje: escolher um foco, ajustar pela fase do seu filho e sair com um passo claro.
                  </p>
                </div>

                <div className="hidden md:flex items-center justify-center h-11 w-11 rounded-2xl bg-white/70 border border-[#f5d7e5] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                  <AppIcon name="toy" size={20} className="text-[#b8236b]" />
                </div>
              </div>
            </div>
          </header>

          {/* COMANDO CENTRAL (interliga tudo) */}
          <Reveal>
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
                      Hoje, o que você precisa?
                    </h2>
                    <p className="text-[13px] md:text-[14px] text-[#6a6a6a] mt-1 leading-relaxed">
                      {focusHint(focus)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => scrollToId('brincadeiras')}
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
                  aria-label="Ir para o começo da experiência"
                >
                  Começar
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                {(
                  [
                    { id: 'conectar-2' as const, icon: 'heart', title: 'Conectar agora', meta: '2 min' },
                    { id: 'brincar-10' as const, icon: 'toy', title: 'Brincar rápido', meta: '10 min' },
                    { id: 'fluir-dia' as const, icon: 'sun', title: 'Fazer o dia fluir', meta: 'rotina' },
                  ] as const
                ).map((opt) => {
                  const active = focus === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => onSelectFocus(opt.id)}
                      className={[
                        `
                          rounded-3xl border transition text-left
                          p-4
                          shadow-[0_6px_22px_rgba(0,0,0,0.05)]
                        `,
                        active
                          ? 'bg-[#ffd8e6] border-[#f5d7e5]'
                          : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
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
                        <span className="text-[11px] text-[#6a6a6a]">
                          {active ? 'ativo' : ' '}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          </Reveal>

          <div className="space-y-6 md:space-y-7 pb-10">
            {/* ============================= */}
            {/* 1) BRINCADEIRAS DO DIA (card protagonista + alternativas) */}
            {/* ============================= */}
            <section id="brincadeiras">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                      <AppIcon name="toy" size={22} className="text-[#fd2597]" />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        Brincadeiras do dia
                      </span>
                      <h2 className="text-[18px] font-semibold text-[#545454]">
                        Uma ideia certa para hoje (sem caça)
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Baseada no seu foco e ajustada para a fase {ageLabel(age)}.
                      </p>
                    </div>
                  </div>

                  {/* Card protagonista (diferente do resto) */}
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

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {featured.steps.map((s, idx) => (
                        <div
                          key={s}
                          className="rounded-2xl bg-white border border-[#f5d7e5] p-4"
                        >
                          <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">
                            passo {idx + 1}
                          </div>
                          <div className="text-[13px] text-[#545454] mt-1 leading-relaxed">
                            {s}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => scrollToId('rotina')}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Como encaixar no dia
                      </button>
                      <button
                        onClick={() => scrollToId('conexao')}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Fechar com conexão
                      </button>
                    </div>
                  </div>

                  {/* Alternativas menores (não competem) */}
                  {alternatives.length ? (
                    <div className="mt-5">
                      <div className="text-[12px] text-[#6a6a6a] mb-2">
                        Outras opções rápidas (se você quiser variar):
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {alternatives.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              try {
                                track('meu_filho.activity.switch', { from: featured.id, to: a.id })
                              } catch {}
                              // troca por “soft”: muda o foco para brincar e ajusta “featured” via estado
                              // sem backend, o jeito mais seguro é direcionar para Desenvolvimento e incentivar troca de fase/foco.
                              // Aqui fazemos apenas o scroll para manter o fluxo leve.
                              scrollToId('desenvolvimento')
                            }}
                            className="
                              rounded-3xl bg-white border border-[#f5d7e5]
                              p-4 text-left
                              shadow-[0_6px_22px_rgba(0,0,0,0.05)]
                              hover:bg-[#ffe1f1] transition
                            "
                            aria-label={`Ver alternativa: ${a.title}`}
                          >
                            <div className="text-[13px] font-semibold text-[#545454] leading-snug">
                              {a.title}
                            </div>
                            <div className="text-[12px] text-[#6a6a6a] mt-1 leading-relaxed">
                              {a.subtitle}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </SoftCard>
              </Reveal>
            </section>

            {/* ============================= */}
            {/* 2) DESENVOLVIMENTO POR FASE (seletor + painel dinâmico) */}
            {/* ============================= */}
            <section id="desenvolvimento">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                      <AppIcon name="child" size={22} className="text-[#fd2597]" />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        Desenvolvimento por fase
                      </span>
                      <h2 className="text-[18px] font-semibold text-[#545454]">
                        Ajuste a experiência para a fase do seu filho
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Não é diagnóstico. É só um ajuste para as sugestões ficarem mais certeiras.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {AGE_GROUPS.map((g) => {
                      const active = age === g.id
                      return (
                        <button
                          key={g.id}
                          onClick={() => onSelectAge(g.id)}
                          className={[
                            'rounded-full px-3.5 py-2 text-[12px] border transition',
                            active
                              ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#545454]'
                              : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                          ].join(' ')}
                        >
                          {g.title}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                    <div className="text-[12px] text-[#b8236b] font-semibold uppercase tracking-wide">
                      Fase {ageLabel(age)}
                    </div>
                    <div className="text-[14px] text-[#545454] mt-1 leading-relaxed">
                      {AGE_GROUPS.find((g) => g.id === age)?.hint}
                    </div>
                    <div className="text-[12px] text-[#6a6a6a] mt-3">
                      Esta fase ajusta automaticamente a ideia principal em “Brincadeiras do dia”.
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => scrollToId('brincadeiras')}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Voltar para a ideia de hoje
                      </button>
                      <button
                        onClick={() => scrollToId('rotina')}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Ver rotina leve
                      </button>
                    </div>
                  </div>
                </SoftCard>
              </Reveal>
            </section>

            {/* ============================= */}
            {/* 3) ROTINA LEVE DA CRIANÇA (timeline + checklist/progresso) */}
            {/* ============================= */}
            <section id="rotina">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                      <AppIcon name="sun" size={22} className="text-[#fd2597]" />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        Rotina leve da criança
                      </span>
                      <h2 className="text-[18px] font-semibold text-[#545454]">
                        Como encaixar sem estressar
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Um mini fluxo antes/durante/depois para a ideia de hoje caber na vida real.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[14px] font-semibold text-[#545454]">
                        Mini fluxo da brincadeira: {featured.title}
                      </div>
                      <span className="text-[12px] text-[#6a6a6a]">
                        progresso: {progress}/3
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        onClick={() => toggleChecklist('before')}
                        className={[
                          'rounded-2xl border p-4 text-left transition',
                          checked.before ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">
                          antes
                        </div>
                        <div className="text-[13px] text-[#545454] mt-1 leading-relaxed">
                          {featured.routine.before}
                        </div>
                        <div className="text-[12px] text-[#6a6a6a] mt-3">
                          {checked.before ? 'feito ✓' : 'marcar como feito'}
                        </div>
                      </button>

                      <button
                        onClick={() => toggleChecklist('during')}
                        className={[
                          'rounded-2xl border p-4 text-left transition',
                          checked.during ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">
                          durante
                        </div>
                        <div className="text-[13px] text-[#545454] mt-1 leading-relaxed">
                          {featured.routine.during}
                        </div>
                        <div className="text-[12px] text-[#6a6a6a] mt-3">
                          {checked.during ? 'feito ✓' : 'marcar como feito'}
                        </div>
                      </button>

                      <button
                        onClick={() => toggleChecklist('after')}
                        className={[
                          'rounded-2xl border p-4 text-left transition',
                          checked.after ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">
                          depois
                        </div>
                        <div className="text-[13px] text-[#545454] mt-1 leading-relaxed">
                          {featured.routine.after}
                        </div>
                        <div className="text-[12px] text-[#6a6a6a] mt-3">
                          {checked.after ? 'feito ✓' : 'marcar como feito'}
                        </div>
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => scrollToId('conexao')}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Fechar com um gesto
                      </button>
                      <button
                        onClick={() => scrollToId('brincadeiras')}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Voltar para a brincadeira
                      </button>
                    </div>
                  </div>
                </SoftCard>
              </Reveal>
            </section>

            {/* ============================= */}
            {/* 4) GESTOS DE CONEXÃO (1 gesto por vez + “outro gesto”) */}
            {/* ============================= */}
            <section id="conexao">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                      <AppIcon name="heart" size={22} className="text-[#fd2597]" />
                    </div>
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        Gestos de conexão
                      </span>
                      <h2 className="text-[18px] font-semibold text-[#545454]">
                        Um gesto agora (curto e poderoso)
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Fechamento da experiência: um gesto que diz “eu tô aqui”.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                    <div className="text-[12px] text-[#b8236b] font-semibold uppercase tracking-wide">
                      para hoje
                    </div>
                    <div className="text-[16px] md:text-[18px] font-semibold text-[#545454] mt-2 leading-relaxed">
                      {connectionLine}
                    </div>
                    <div className="text-[12px] text-[#6a6a6a] mt-3">
                      Baseado na ideia principal: <span className="font-semibold text-[#545454]">{featured.title}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={nextGesture}
                        className="rounded-full bg-white border border-[#f5d7e5] text-[#545454] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                      >
                        Outro gesto
                      </button>
                      <button
                        onClick={() => scrollToId('brincadeiras')}
                        className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                      >
                        Recomeçar a experiência
                      </button>
                    </div>

                    <div className="mt-4 text-[12px] text-[#6a6a6a] leading-relaxed">
                      Se hoje só couber um gesto, escolha um. Um gesto por dia cria uma história inteira.
                    </div>
                  </div>
                </SoftCard>
              </Reveal>
            </section>

            <div className="mt-4">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
