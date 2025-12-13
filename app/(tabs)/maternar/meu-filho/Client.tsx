'use client'

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

type Etapa = 'brincadeiras' | 'desenvolvimento' | 'rotina' | 'conexao'
type FocusMode = '5min' | '10min' | 'hoje'

type MiniTileProps = {
  label: string
  subtitle?: string
  tag?: string
  onClick?: () => void
  active?: boolean
}

/**
 * Mini card modular estilo “soundboard” — ações rápidas e palpáveis.
 */
function MiniTile({ label, subtitle, tag, onClick, active }: MiniTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        `
        w-full text-left
        rounded-2xl
        bg-white
        border border-[#f5d7e5]
        shadow-[0_6px_22px_rgba(0,0,0,0.06)]
        px-3.5 py-3.5
        transition
        hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)]
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#fd2597]/50
      `,
        active ? 'ring-2 ring-[#fd2597]/25' : '',
      ].join(' ')}
      aria-label={label}
    >
      <div className="flex flex-col gap-1">
        {tag && (
          <span
            className="
              inline-flex w-max items-center
              rounded-full bg-[#ffe1f1]
              px-2 py-0.5
              text-[10px] font-semibold tracking-wide
              text-[#b8236b] uppercase
            "
          >
            {tag}
          </span>
        )}
        <span className="block text-[13px] md:text-[14px] font-semibold text-[#545454] leading-snug">
          {label}
        </span>
        {subtitle && (
          <span className="block text-[12px] text-[#6a6a6a] leading-snug">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  )
}

function scrollToId(id: Etapa) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function focusToEtapa(focus: FocusMode): Etapa {
  // “Inteligência simples”, sem inventar regras clínicas:
  // 5min  -> conexão (mais impacto com menos tempo)
  // 10min -> brincadeiras (presença rápida e prática)
  // hoje  -> rotina (ajuda a organizar o fluxo do dia)
  if (focus === '5min') return 'conexao'
  if (focus === '10min') return 'brincadeiras'
  return 'rotina'
}

export default function MeuFilhoClient() {
  const [focus, setFocus] = useState<FocusMode>('10min')
  const [selectedTile, setSelectedTile] = useState<string | null>(null)

  useEffect(() => {
    try {
      track('nav.view', {
        tab: 'maternar',
        page: 'meu-filho',
        timestamp: new Date().toISOString(),
      })
    } catch {
      // telemetria nunca quebra a página
    }
  }, [])

  const bgStyle: React.CSSProperties = {
    background: 'radial-gradient(circle at top left, #ffe1f1 0%, #ffffff 72%, #ffffff 100%)',
  }

  const halos = (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[-16%] left-[-18%] w-[62%] h-[62%] bg-[#fdbed7]/24 blur-[140px] rounded-full" />
      <div className="absolute bottom-[-22%] right-[-18%] w-[58%] h-[58%] bg-[#ffe1f1]/38 blur-[150px] rounded-full" />
    </div>
  )

  const targetEtapa = useMemo(() => focusToEtapa(focus), [focus])

  const focusTitle = useMemo(() => {
    if (focus === '5min') return 'Em 5 minutos'
    if (focus === '10min') return 'Em 10 minutos'
    return 'Para o dia de hoje'
  }, [focus])

  const focusHint = useMemo(() => {
    if (focus === '5min') return 'Um gesto de conexão que muda o clima, mesmo na correria.'
    if (focus === '10min') return 'Uma brincadeira simples para vocês se encontrarem no meio do dia.'
    return 'Um ajuste leve na rotina para o dia fluir com menos atrito.'
  }, [focus])

  function pickTile(id: string, etapa: Etapa, label: string) {
    setSelectedTile(id)
    try {
      track('meu_filho.tile.select', { id, etapa, label })
    } catch {}
    // Leva direto à seção onde aquilo “mora” — resposta rápida, sem caça.
    scrollToId(etapa)
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="min-h-[100dvh] pb-32 relative overflow-hidden"
      style={bgStyle}
    >
      {halos}

      <ClientOnly>
        <div className="relative mx-auto max-w-3xl px-4 md:px-6">
          {/* HERO (claro, consistente, sem sombra pesada) */}
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
                    Ideias práticas para brincar, organizar o dia e criar conexão — sem perfeição e sem “grandes produções”.
                  </p>
                </div>

                <div className="hidden md:flex items-center justify-center h-11 w-11 rounded-2xl bg-white/70 border border-[#f5d7e5] shadow-[0_6px_22px_rgba(0,0,0,0.06)]">
                  <AppIcon name="toy" size={20} className="text-[#b8236b]" />
                </div>
              </div>
            </div>
          </header>

          {/* PAINEL INTELIGENTE (personalidade do Meu Filho) */}
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
                      {focusTitle}: escolha um caminho rápido
                    </h2>
                    <p className="text-[13px] md:text-[14px] text-[#6a6a6a] mt-1 leading-relaxed">
                      {focusHint}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => scrollToId(targetEtapa)}
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
                  aria-label="Ir para o caminho sugerido"
                >
                  Ir direto
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(
                  [
                    { id: '5min' as const, label: '5 min' },
                    { id: '10min' as const, label: '10 min' },
                    { id: 'hoje' as const, label: 'dia todo' },
                  ] as const
                ).map((opt) => {
                  const active = focus === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFocus(opt.id)
                        try {
                          track('meu_filho.focus.select', { focus: opt.id })
                        } catch {}
                      }}
                      className={[
                        'rounded-full px-3.5 py-2 text-[12px] border transition',
                        active
                          ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#545454]'
                          : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  )
                })}

                <div className="flex-1" />

                <div className="hidden md:flex items-center gap-2 text-[12px] text-[#6a6a6a]">
                  <span className="inline-flex h-6 px-3 rounded-full bg-white border border-[#f5d7e5] items-center">
                    Sugestão: {targetEtapa === 'conexao' ? 'Conexão' : targetEtapa === 'brincadeiras' ? 'Brincadeiras' : 'Rotina'}
                  </span>
                </div>
              </div>
            </section>
          </Reveal>

          <div className="space-y-6 md:space-y-7 pb-10">
            {/* ============================= */}
            {/* 1) BRINCADEIRAS DO DIA */}
            {/* ============================= */}
            <section id="brincadeiras">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                    space-y-4
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
                        Ideias simples para brincar hoje
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Sem produção. Só presença possível — do jeito que a sua rotina permite.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniTile
                      tag="rápido"
                      label="Caça aos tesouros da casa"
                      subtitle="Escolham 3 coisas para encontrar juntos."
                      active={selectedTile === 'brinc1'}
                      onClick={() => pickTile('brinc1', 'brincadeiras', 'Caça aos tesouros da casa')}
                    />
                    <MiniTile
                      tag="conexão"
                      label="Desenho espelhado"
                      subtitle="Um traço seu, um traço dele — e assim vai."
                      active={selectedTile === 'brinc2'}
                      onClick={() => pickTile('brinc2', 'brincadeiras', 'Desenho espelhado')}
                    />
                    <MiniTile
                      tag="movimento"
                      label="Caminho de almofadas"
                      subtitle="Um percurso simples para atravessar a sala."
                      active={selectedTile === 'brinc3'}
                      onClick={() => pickTile('brinc3', 'brincadeiras', 'Caminho de almofadas')}
                    />
                    <MiniTile
                      tag="calminho"
                      label="História inventada a dois"
                      subtitle="Cada um diz uma frase. A história nasce."
                      active={selectedTile === 'brinc4'}
                      onClick={() => pickTile('brinc4', 'brincadeiras', 'História inventada a dois')}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-4">
                    <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                      Dica de ouro: 10 minutos de presença valem mais do que “tentar brincar muito” com a cabeça em mil lugares.
                    </p>
                  </div>
                </SoftCard>
              </Reveal>
            </section>

            {/* ============================= */}
            {/* 2) DESENVOLVIMENTO POR FASE */}
            {/* ============================= */}
            <section id="desenvolvimento">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                    space-y-4
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
                        Pistas suaves do que costuma aparecer
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Não é diagnóstico e não é regra — é só um mapa leve para você entender melhor o momento.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniTile
                      tag="0–2"
                      label="Explorar com os sentidos"
                      subtitle="Texturas, sons, cores — tudo é descoberta."
                      active={selectedTile === 'fase1'}
                      onClick={() => pickTile('fase1', 'desenvolvimento', 'Explorar com os sentidos')}
                    />
                    <MiniTile
                      tag="3–4"
                      label="Faz de conta em alta"
                      subtitle="Casinha, super-herói, cozinhar de mentira."
                      active={selectedTile === 'fase2'}
                      onClick={() => pickTile('fase2', 'desenvolvimento', 'Faz de conta em alta')}
                    />
                    <MiniTile
                      tag="5–6"
                      label="Perguntas sem fim"
                      subtitle="Curiosidade e vontade de entender tudo."
                      active={selectedTile === 'fase3'}
                      onClick={() => pickTile('fase3', 'desenvolvimento', 'Perguntas sem fim')}
                    />
                    <MiniTile
                      tag="+6"
                      label="Autonomia + opinião"
                      subtitle="Testar limites, escolher, se afirmar."
                      active={selectedTile === 'fase4'}
                      onClick={() => pickTile('fase4', 'desenvolvimento', 'Autonomia + opinião')}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-4">
                    <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                      Cada criança tem seu ritmo. Este painel existe para tirar o peso da comparação e trazer clareza com gentileza.
                    </p>
                  </div>
                </SoftCard>
              </Reveal>
            </section>

            {/* ============================= */}
            {/* 3) ROTINA LEVE DA CRIANÇA */}
            {/* ============================= */}
            <section id="rotina">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                    space-y-4
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
                        Pequenos ajustes que ajudam o dia a fluir
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Não é rotina perfeita. É uma rotina possível — com pontos de apoio simples.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniTile
                      tag="manhã"
                      label="Mini ritual para acordar"
                      subtitle="Um abraço, uma música, uma frase do dia."
                      active={selectedTile === 'rot1'}
                      onClick={() => pickTile('rot1', 'rotina', 'Mini ritual para acordar')}
                    />
                    <MiniTile
                      tag="transições"
                      label="Aviso antes de mudar"
                      subtitle="“Daqui 5 min vamos guardar, combinado?”"
                      active={selectedTile === 'rot2'}
                      onClick={() => pickTile('rot2', 'rotina', 'Aviso antes de mudar')}
                    />
                    <MiniTile
                      tag="energia"
                      label="Janela de movimento"
                      subtitle="Um momento para correr, pular, gastar energia."
                      active={selectedTile === 'rot3'}
                      onClick={() => pickTile('rot3', 'rotina', 'Janela de movimento')}
                    />
                    <MiniTile
                      tag="noite"
                      label="Sinal de desacelerar"
                      subtitle="Menos estímulo e um ritual curto de calma."
                      active={selectedTile === 'rot4'}
                      onClick={() => pickTile('rot4', 'rotina', 'Sinal de desacelerar')}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-4">
                    <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                      O objetivo é ter “apoios” ao longo do dia — não um manual rígido. Se sair do script, tudo bem.
                    </p>
                  </div>
                </SoftCard>
              </Reveal>
            </section>

            {/* ============================= */}
            {/* 4) GESTOS DE CONEXÃO */}
            {/* ============================= */}
            <section id="conexao">
              <Reveal>
                <SoftCard
                  className="
                    p-6 md:p-7 rounded-3xl
                    bg-white
                    border border-[#f5d7e5]
                    shadow-[0_6px_22px_rgba(0,0,0,0.06)]
                    space-y-4
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
                        Pequenas coisas que dizem “eu tô aqui”
                      </h2>
                      <p className="text-[14px] text-[#6a6a6a]">
                        Conexão é repetição de pequenos momentos — do jeito que dá, do jeito que é.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MiniTile
                      tag="olhar"
                      label="Olhos nos olhos (10s)"
                      subtitle="Sem tela, sem pressa — só presença."
                      active={selectedTile === 'con1'}
                      onClick={() => pickTile('con1', 'conexao', 'Olhos nos olhos (10s)')}
                    />
                    <MiniTile
                      tag="toque"
                      label="Abraço mais demorado"
                      subtitle="Respirem juntos por alguns instantes."
                      active={selectedTile === 'con2'}
                      onClick={() => pickTile('con2', 'conexao', 'Abraço mais demorado')}
                    />
                    <MiniTile
                      tag="fala"
                      label="Elogio específico"
                      subtitle="“Eu adoro quando você…”"
                      active={selectedTile === 'con3'}
                      onClick={() => pickTile('con3', 'conexao', 'Elogio específico')}
                    />
                    <MiniTile
                      tag="tempo"
                      label="5 min só de vocês"
                      subtitle="No sofá, na cozinha — onde der."
                      active={selectedTile === 'con4'}
                      onClick={() => pickTile('con4', 'conexao', '5 min só de vocês')}
                    />
                  </div>

                  <div className="mt-3 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] p-4">
                    <p className="text-[13px] text-[#6a6a6a] leading-relaxed">
                      Se hoje só couber um gesto, escolha um. Um gesto por dia cria uma história inteira.
                    </p>
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
