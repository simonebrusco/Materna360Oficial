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

type Step = 'brincadeiras' | 'desenvolvimento' | 'rotina' | 'conexao'
type TimeMode = '5' | '10' | '15'
type AgeBand = '0-2' | '3-4' | '5-6' | '6+'

type PlanItem = {
  title: string
  how: string
  time: TimeMode
  tag: string
}

type Kit = {
  id: string
  title: string
  subtitle: string
  time: TimeMode
  plan: { a: PlanItem; b: PlanItem; c: PlanItem }
  development: { label: string; note: string }
  routine: { label: string; note: string }
  connection: { label: string; note: string }
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
  return s === 'brincadeiras' ? 1 : s === 'desenvolvimento' ? 2 : s === 'rotina' ? 3 : 4
}

function timeLabel(t: TimeMode) {
  if (t === '5') return '5 min'
  if (t === '10') return '10 min'
  return '15 min'
}

function timeTitle(t: TimeMode) {
  if (t === '5') return 'Ligação rápida'
  if (t === '10') return 'Presença prática'
  return 'Momento completo'
}

function timeHint(t: TimeMode) {
  if (t === '5') return 'Para quando você só precisa “conectar e seguir”.'
  if (t === '10') return 'Para quando dá para brincar sem complicar.'
  return 'Para quando você quer fechar o dia com presença de verdade.'
}

function inferContext(): { time: TimeMode; age: AgeBand } {
  /**
   * Integração “best effort” com Eu360:
   * - eu360_time_with_child: "5" | "10" | "15"
   * - eu360_child_age_band: "0-2" | "3-4" | "5-6" | "6+"
   *
   * Se não houver nada: default inteligente = 15 min, 3-4
   */
  const tRaw = safeGetLS('eu360_time_with_child')
  const aRaw = safeGetLS('eu360_child_age_band')

  const time: TimeMode = tRaw === '5' || tRaw === '10' || tRaw === '15' ? tRaw : '15'
  const age: AgeBand = aRaw === '0-2' || aRaw === '3-4' || aRaw === '5-6' || aRaw === '6+' ? aRaw : '3-4'

  return { time, age }
}

const KITS: Record<AgeBand, Record<TimeMode, Kit>> = {
  '0-2': {
    '5': {
      id: 'k-0-2-5',
      title: 'Conexão em 5 min (0–2)',
      subtitle: 'Sem preparar nada. Só presença simples.',
      time: '5',
      plan: {
        a: { tag: 'rápido', time: '5', title: 'Cópia de gestos', how: 'Você faz 3 gestos (bater palmas, tchau, abraço). Ele copia.' },
        b: { tag: 'calmo', time: '5', title: 'Música + colo', how: 'Uma música curta. Balance devagar e respire junto.' },
        c: { tag: 'sensório', time: '5', title: 'Texturas da casa', how: 'Mostre 3 texturas (toalha, almofada, papel). Nomeie e deixe tocar.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Explorar com os sentidos e repetir ações simples.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Transição suave: avise “agora vamos guardar” antes de trocar de atividade.' },
      connection: { label: 'Gesto de conexão', note: 'Olho no olho por 10 segundos. Sem tela. Só você e ele.' },
    },
    '10': {
      id: 'k-0-2-10',
      title: 'Presença prática em 10 min (0–2)',
      subtitle: 'Brincadeira curta + conexão no final.',
      time: '10',
      plan: {
        a: { tag: 'movimento', time: '10', title: 'Caminho de almofadas', how: 'Monte um caminho no chão e atravessem juntos 3 vezes.' },
        b: { tag: 'fala', time: '10', title: 'Nomear tudo', how: 'Passe pela casa nomeando 10 coisas e apontando junto.' },
        c: { tag: 'calmo', time: '10', title: 'Livro rápido', how: 'Escolha um livrinho e faça “voz” por 5 min. Feche com abraço.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Movimento, curiosidade e vontade de repetir.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Uma “janela de movimento” antes do jantar reduz irritação.' },
      connection: { label: 'Gesto de conexão', note: 'Um abraço demorado com respiração junto (3 respirações).' },
    },
    '15': {
      id: 'k-0-2-15',
      title: 'Momento completo em 15 min (0–2)',
      subtitle: 'Brincar + desacelerar sem estender demais.',
      time: '15',
      plan: {
        a: { tag: 'rotina', time: '15', title: 'Mini ritual pré-janta', how: '2 min de música + 8 min de brincar + 5 min para guardar juntos.' },
        b: { tag: 'sensório', time: '15', title: 'Caixa de “coisas seguras”', how: 'Separe 5 itens (colher, copo plástico, pano). Explorem juntos.' },
        c: { tag: 'calmo', time: '15', title: 'Banho de brinquedos', how: 'No banho, leve 2 brinquedos e invente 3 ações repetidas.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Ritmo próprio e necessidade de previsibilidade.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Avisos curtos (“mais 2 min e vamos…”) ajudam muito.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer em voz alta: “eu tô aqui com você” e sorrir.' },
    },
  },
  '3-4': {
    '5': {
      id: 'k-3-4-5',
      title: 'Conexão em 5 min (3–4)',
      subtitle: 'Uma brincadeira que cabe antes da janta.',
      time: '5',
      plan: {
        a: { tag: 'rápido', time: '5', title: 'História de 5 frases', how: 'Cada um fala uma frase. Vocês criam juntos 5 frases e pronto.' },
        b: { tag: 'conexão', time: '5', title: 'Desenho espelhado', how: 'Você faz 1 traço, ele copia. Troca. 5 rodadas.' },
        c: { tag: 'movimento', time: '5', title: 'Siga o líder', how: 'Você faz 4 movimentos (pular, girar, agachar). Ele repete.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Faz de conta em alta e muita imaginação.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Transições ficam melhores com aviso + contagem (ex.: “mais 2 min”).' },
      connection: { label: 'Gesto de conexão', note: 'Pergunta simples: “o que foi legal hoje?” e ouvir 20 segundos.' },
    },
    '10': {
      id: 'k-3-4-10',
      title: 'Presença prática em 10 min (3–4)',
      subtitle: 'Brincar sem produção e fechar bem.',
      time: '10',
      plan: {
        a: { tag: 'movimento', time: '10', title: 'Pista no chão', how: 'Faça uma “pista” com fita/almofadas. Ele percorre 3 vezes.' },
        b: { tag: 'faz de conta', time: '10', title: 'Restaurante relâmpago', how: 'Ele “cozinha” e serve. Você faz 2 pedidos engraçados.' },
        c: { tag: 'calmo', time: '10', title: 'Cartas de elogio', how: 'Diga 2 coisas específicas: “eu gostei quando você…”.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Teste de limites e necessidade de previsibilidade.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Um mini ritual pré-janta (2 min) organiza o resto do período.' },
      connection: { label: 'Gesto de conexão', note: 'Toque no ombro + olhar nos olhos por 5 segundos.' },
    },
    '15': {
      id: 'k-3-4-15',
      title: 'Momento completo em 15 min (3–4)',
      subtitle: 'O clássico: brincar + organizar + fechar com carinho.',
      time: '15',
      plan: {
        a: { tag: 'casa', time: '15', title: 'Caça aos tesouros', how: 'Escolham 3 itens para achar. Depois guardam juntos.' },
        b: { tag: 'faz de conta', time: '15', title: 'Missão do herói', how: '3 “missões”: pular, buscar, entregar. Você narra.' },
        c: { tag: 'calmo', time: '15', title: 'História + abraço', how: '10 min de história inventada + 5 min de abraço e guardar.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Imaginação + necessidade de rotina clara.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'O combinado “brinca e depois guarda” funciona melhor com timer simples.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer: “obrigada por brincar comigo” e sorrir.' },
    },
  },
  '5-6': {
    '5': {
      id: 'k-5-6-5',
      title: 'Conexão em 5 min (5–6)',
      subtitle: 'Rápido e direto: presença sem esticar.',
      time: '5',
      plan: {
        a: { tag: 'fala', time: '5', title: '2 perguntas + 1 abraço', how: 'Pergunte “melhor parte do dia?” e “uma coisa difícil?”. Abraço.' },
        b: { tag: 'rápido', time: '5', title: 'Desafio do minuto', how: '1 min de equilíbrio / 1 min de pular / 1 min de alongar.' },
        c: { tag: 'calmo', time: '5', title: 'Leitura relâmpago', how: 'Leia 2 páginas e combine “amanhã continua”.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Curiosidade, perguntas e vontade de participar das decisões.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Um “combinado curto” evita disputa: “5 min e depois…”.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer algo específico: “eu vi você se esforçando em…”.' },
    },
    '10': {
      id: 'k-5-6-10',
      title: 'Presença prática em 10 min (5–6)',
      subtitle: 'Brincar e fechar com organização mínima.',
      time: '10',
      plan: {
        a: { tag: 'movimento', time: '10', title: 'Circuito rápido', how: '3 estações: pular, agachar, correr parado. 2 rodadas.' },
        b: { tag: 'mesa', time: '10', title: 'Desenho com tema', how: 'Tema: “o melhor do dia”. 5 min desenha, 5 min conta.' },
        c: { tag: 'casa', time: '10', title: 'Ajuda rápida', how: 'Ele ajuda em 1 tarefa (pôr guardanapo). Você elogia o esforço.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Mais autonomia e mais opinião.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Transição fica mais fácil quando ele tem uma “função” simples.' },
      connection: { label: 'Gesto de conexão', note: 'Tempo 1:1 de 5 minutos sem tela.' },
    },
    '15': {
      id: 'k-5-6-15',
      title: 'Momento completo em 15 min (5–6)',
      subtitle: 'Um ciclo simples: brincar → ajudar → fechar.',
      time: '15',
      plan: {
        a: { tag: 'equilíbrio', time: '15', title: 'Brinca 10 + ajuda 5', how: '10 min de jogo rápido + 5 min ajudando numa tarefa pequena.' },
        b: { tag: 'criativo', time: '15', title: 'História com desenho', how: '5 min desenha, 10 min cria história e você escreve 3 frases.' },
        c: { tag: 'calmo', time: '15', title: 'Jogo de perguntas', how: 'Faça 6 perguntas leves (“qual animal…?”). Fecha com abraço.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Vontade de participar e de ser levado a sério.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Um timer visível ajuda a encerrar sem briga.' },
      connection: { label: 'Gesto de conexão', note: 'Dizer: “eu gosto de você do jeito que você é” (curto, direto).' },
    },
  },
  '6+': {
    '5': {
      id: 'k-6p-5',
      title: 'Conexão em 5 min (6+)',
      subtitle: 'Curto e respeitoso — sem infantilizar.',
      time: '5',
      plan: {
        a: { tag: 'fala', time: '5', title: 'Check-in rápido', how: '“De 0 a 10, como foi seu dia?” e uma frase de escuta.' },
        b: { tag: 'corpo', time: '5', title: 'Descompressão', how: '2 min alongar + 2 min respirar + 1 min combinado do dia.' },
        c: { tag: 'casa', time: '5', title: 'Ajuda prática', how: 'Ele ajuda em 1 coisa. Você agradece e reconhece.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Mais autonomia, mais opinião, mais sensibilidade a respeito.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Combinar “o que vem agora” evita atrito nas transições.' },
      connection: { label: 'Gesto de conexão', note: 'Escuta de 30 segundos sem corrigir.' },
    },
    '10': {
      id: 'k-6p-10',
      title: 'Presença prática em 10 min (6+)',
      subtitle: 'Sem grandes jogos: presença e organização.',
      time: '10',
      plan: {
        a: { tag: 'fala', time: '10', title: 'Conversa guiada', how: '2 perguntas + 1 coisa que ele escolhe fazer (rápida).' },
        b: { tag: 'jogo', time: '10', title: 'Mini competição', how: 'Desafio curto (quem guarda mais rápido / quem acha 3 itens).' },
        c: { tag: 'casa', time: '10', title: 'Função + elogio', how: 'Ele escolhe uma função e você elogia o esforço, não o resultado.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Necessidade de sentir controle e escolha.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Dar 2 opções evita disputa (“isso ou aquilo”).' },
      connection: { label: 'Gesto de conexão', note: 'Perguntar: “quer minha ajuda ou só que eu te ouça?”' },
    },
    '15': {
      id: 'k-6p-15',
      title: 'Momento completo em 15 min (6+)',
      subtitle: 'Conexão + rotina leve do jeito que cabe.',
      time: '15',
      plan: {
        a: { tag: 'equilíbrio', time: '15', title: '10 min + 5 min', how: '10 min de escolha dele + 5 min de organização simples.' },
        b: { tag: 'casa', time: '15', title: 'Arrumar junto', how: 'Arrumar um cantinho por 10 min com música. Fecha com conversa.' },
        c: { tag: 'fala', time: '15', title: 'Plano de amanhã', how: '2 min check-in + 10 min atividade + 3 min combinados.' },
      },
      development: { label: 'O que costuma aparecer', note: 'Autonomia e necessidade de respeito nas decisões.' },
      routine: { label: 'Ajuste que ajuda hoje', note: 'Combinados curtos e claros reduzem conflito.' },
      connection: { label: 'Gesto de conexão', note: 'Reconhecer: “eu vi que foi difícil e você tentou”.' },
    },
  },
}

export default function MeuFilhoClient() {
  const [step, setStep] = useState<Step>('brincadeiras')
  const [time, setTime] = useState<TimeMode>('15')
  const [age, setAge] = useState<AgeBand>('3-4')
  const [chosen, setChosen] = useState<'a' | 'b' | 'c'>('a')

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'meu-filho', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const inferred = inferContext()
    setTime(inferred.time)
    setAge(inferred.age)
    setStep('brincadeiras')

    try {
      track('meu_filho.open', { time: inferred.time, age: inferred.age })
    } catch {}
  }, [])

  const kit = useMemo(() => KITS[age][time], [age, time])
  const selected = useMemo(() => kit.plan[chosen], [kit, chosen])

  function go(next: Step) {
    setStep(next)
    try {
      track('meu_filho.step', { step: next })
    } catch {}
  }

  function onSelectTime(next: TimeMode) {
    setTime(next)
    safeSetLS('eu360_time_with_child', next)
    setChosen('a')
    try {
      track('meu_filho.time.select', { time: next })
    } catch {}
  }

  function onSelectAge(next: AgeBand) {
    setAge(next)
    safeSetLS('eu360_child_age_band', next)
    setChosen('a')
    try {
      track('meu_filho.age.select', { age: next })
    } catch {}
  }

  function onChoose(k: 'a' | 'b' | 'c') {
    setChosen(k)
    try {
      track('meu_filho.plan.choose', { which: k, time, age })
    } catch {}
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
          {/* HERO */}
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
                Meu Filho
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Você entra sem ideias e sai com um plano simples para agora — sem precisar pensar.
              </p>
            </div>
          </header>

          {/* EXPERIÊNCIA ÚNICA (um container) */}
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
              {/* Top bar: contexto + trilha */}
              <div className="p-4 md:p-6 border-b border-white/25">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
                      <AppIcon name="toy" size={22} className="text-[#fd2597]" />
                    </div>

                    <div>
                      <div className="text-[12px] text-white/85">
                        Passo {stepIndex(step)}/4 • {timeTitle(time)} • {timeLabel(time)} • faixa {age}
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Sugestão pronta para agora
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        {timeHint(time)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => go('brincadeiras')}
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

                {/* Ajustes rápidos (secundários) */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                    <div className="text-[12px] text-white/85 mb-2">Quanto tempo você tem agora?</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['5', '10', '15'] as TimeMode[]).map((t) => {
                        const active = time === t
                        return (
                          <button
                            key={t}
                            onClick={() => onSelectTime(t)}
                            className={[
                              'rounded-xl border px-3 py-2 text-[12px] text-left transition',
                              active
                                ? 'bg-white/90 border-white/60 text-[#2f3a56]'
                                : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
                            ].join(' ')}
                          >
                            <div className="font-semibold">{timeLabel(t)}</div>
                            <div className="text-[11px] opacity-90">{timeTitle(t)}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/20 border border-white/25 p-3">
                    <div className="text-[12px] text-white/85 mb-2">Faixa do seu filho (para ajustar a ideia)</div>
                    <div className="grid grid-cols-4 gap-2">
                      {(['0-2', '3-4', '5-6', '6+'] as AgeBand[]).map((a) => {
                        const active = age === a
                        return (
                          <button
                            key={a}
                            onClick={() => onSelectAge(a)}
                            className={[
                              'rounded-xl border px-3 py-2 text-[12px] transition',
                              active
                                ? 'bg-white/90 border-white/60 text-[#2f3a56]'
                                : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
                            ].join(' ')}
                          >
                            {a}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Stepper */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'brincadeiras' as const, label: 'Brincadeiras' },
                      { id: 'desenvolvimento' as const, label: 'Fase' },
                      { id: 'rotina' as const, label: 'Rotina' },
                      { id: 'conexao' as const, label: 'Conexão' },
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

              {/* Conteúdo muda dentro do mesmo container */}
              <div className="p-4 md:p-6">
                {/* 1) BRINCADEIRAS DO DIA */}
                {step === 'brincadeiras' ? (
                  <div id="brincadeiras" className="space-y-4">
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
                          <AppIcon name="toy" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Brincadeiras do dia
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">{kit.title}</h2>
                          <p className="text-[13px] text-[#6a6a6a]">{kit.subtitle}</p>
                        </div>
                      </div>

                      {/* Escolha guiada (3 opções) */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(['a', 'b', 'c'] as const).map((k) => {
                          const it = kit.plan[k]
                          const active = chosen === k
                          return (
                            <button
                              key={k}
                              onClick={() => onChoose(k)}
                              className={[
                                'rounded-2xl border p-4 text-left transition',
                                active ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
                              ].join(' ')}
                            >
                              <div className="inline-flex w-max items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
                                {it.tag} • {timeLabel(it.time)}
                              </div>
                              <div className="mt-2 text-[13px] font-semibold text-[#2f3a56] leading-snug">{it.title}</div>
                              <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">{it.how}</div>
                            </button>
                          )
                        })}
                      </div>

                      {/* “faça agora” destacado */}
                      <div className="mt-4 rounded-2xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">faça agora</div>
                        <div className="mt-1 text-[14px] font-semibold text-[#2f3a56]">{selected.title}</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{selected.how}</div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('conexao')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Fechar com conexão
                          </button>
                          <button
                            onClick={() => go('rotina')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ajuste de rotina
                          </button>
                          <button
                            onClick={() => go('desenvolvimento')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Entender a fase
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* 2) DESENVOLVIMENTO POR FASE (sem diagnóstico) */}
                {step === 'desenvolvimento' ? (
                  <div id="desenvolvimento" className="space-y-4">
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
                          <AppIcon name="child" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Desenvolvimento por fase
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">{kit.development.label}</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Pistas simples para você ajustar a forma de brincar hoje. Sem rótulos, sem “diagnóstico”.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                        <div className="text-[14px] font-semibold text-[#2f3a56]">Para a faixa {age}:</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{kit.development.note}</div>
                        <div className="mt-4 text-[13px] text-[#2f3a56] font-semibold">Como usar isso agora:</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Escolha uma brincadeira que combine com essa fase e mantenha curta. O objetivo é conexão, não performance.
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('brincadeiras')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Voltar para a brincadeira
                          </button>
                          <button
                            onClick={() => go('rotina')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ajuste de rotina
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* 3) ROTINA LEVE DA CRIANÇA */}
                {step === 'rotina' ? (
                  <div id="rotina" className="space-y-4">
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
                            Rotina leve da criança
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">{kit.routine.label}</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Um ajuste pequeno para o dia fluir melhor — sem “rotina perfeita”.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                        <div className="text-[14px] font-semibold text-[#2f3a56]">Para hoje:</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">{kit.routine.note}</div>

                        <div className="mt-4 text-[13px] text-[#2f3a56] font-semibold">Aplicação rápida:</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Combine o “final” antes de começar. Ex.: “A gente brinca {timeLabel(time)} e depois guarda juntos.”
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('brincadeiras')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Voltar para a brincadeira
                          </button>
                          <button
                            onClick={() => go('conexao')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Fechar com conexão
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* 4) GESTOS DE CONEXÃO */}
                {step === 'conexao' ? (
                  <div id="conexao" className="space-y-4">
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
                            Gestos de conexão
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">{kit.connection.label}</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            O final simples que faz a criança sentir: “minha mãe tá aqui”.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">agora</div>
                        <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">{kit.connection.note}</div>

                        <div className="mt-4 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Se você fez só isso hoje, já valeu. O Materna é sobre o possível.
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('brincadeiras')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Escolher outra brincadeira
                          </button>
                          <Link
                            href="/maternar"
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar ao Maternar
                          </Link>
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
