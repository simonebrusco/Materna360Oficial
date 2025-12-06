'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { clsx } from 'clsx'

import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { getXpSnapshot, updateXP, type XpSnapshot } from '@/app/lib/xp'

// ===== TYPES & CONSTANTS =====

type HighlightTarget = 'painel' | 'missoes' | 'selos' | 'mensal' | null

type Mission = {
  id: string
  label: string
  xp: number
  done?: boolean
}

const INITIAL_MISSIONS: Mission[] = [
  { id: 'humor', label: 'Registrar como estou hoje', xp: 10 },
  { id: 'planner', label: 'Preencher meu planner', xp: 20 },
  { id: 'pausa', label: 'Fazer uma pausa de 5 minutos sem culpa', xp: 15 },
  { id: 'conquista', label: 'Registrar uma conquista', xp: 25 },
]

const SEALS = [
  { id: 'primeiro-passo', label: 'Primeiro passo', icon: 'sparkles' as AppIconName },
  { id: 'semana-leve', label: 'Semana leve', icon: 'sun' as AppIconName },
  { id: 'cuidar-de-mim', label: 'Cuidando de mim', icon: 'heart' as AppIconName },
  { id: 'conexao', label: 'Conectando com meu filho', icon: 'smile' as AppIconName },
  { id: 'rotina', label: 'Rotina em dia', icon: 'calendar' as AppIconName },
  { id: 'presenca', label: 'Presença real', icon: 'star' as AppIconName },
]

const LEVEL_XP_STEP = 400

// ===== COMPONENT =====

export default function MinhasConquistasPage() {
  const searchParams = useSearchParams()

  const highlightFromQuery: HighlightTarget = useMemo(() => {
    const abrir = searchParams.get('abrir')
    if (!abrir) return null
    if (abrir === 'painel' || abrir === 'missoes' || abrir === 'selos' || abrir === 'mensal') {
      return abrir
    }
    return null
  }, [searchParams])

  const [missions, setMissions] = useState(
    INITIAL_MISSIONS.map(m => ({ ...m, done: false })),
  )

  const [xp, setXp] = useState<XpSnapshot | null>(null)

  // Carrega XP salvo ao abrir a página
  useEffect(() => {
    try {
      const snapshot = getXpSnapshot()
      setXp(snapshot)
    } catch (error) {
      console.error('[MinhasConquistas] Erro ao carregar XP inicial:', error)
      setXp({ today: 0, total: 0, streak: 0 })
    }
  }, [])

  const completedMissions = missions.filter(m => m.done).length

  const handleMissionToggle = (id: string) => {
    const mission = missions.find(m => m.id === id)
    if (!mission) return

    const wasDone = !!mission.done
    const delta = wasDone ? -mission.xp : mission.xp

    // Atualiza missões visualmente
    setMissions(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item)),
    )

    // Atualiza XP com fallback seguro
    setXp(prev => {
      const base: XpSnapshot = prev ?? { today: 0, total: 0, streak: 0 }

      const fallback: XpSnapshot = {
        today: Math.max(0, base.today + delta),
        total: Math.max(0, base.total + delta),
        streak: base.streak || (delta > 0 ? 1 : 0),
      }

      try {
        const fromStore = updateXP(delta)
        return fromStore
      } catch (error) {
        console.error(
          '[MinhasConquistas] Erro ao atualizar XP global, usando fallback local:',
          error,
        )
        return fallback
      }
    })
  }

  const highlightRing = (target: HighlightTarget) =>
    highlightFromQuery === target
      ? 'ring-2 ring-[#ff005e] ring-offset-2 ring-offset-pink-100/60'
      : ''

  const todayXp = xp?.today ?? 0
  const totalXp = xp?.total ?? 0
  const streak = xp?.streak ?? 0

  // Lógica de nível / progresso
  const level = totalXp <= 0 ? 1 : Math.floor(totalXp / LEVEL_XP_STEP) + 1
  const xpInCurrentLevel = totalXp <= 0 ? 0 : totalXp % LEVEL_XP_STEP
  const xpToNextLevel = LEVEL_XP_STEP - xpInCurrentLevel
  const xpProgressPercent =
    xpInCurrentLevel === 0 ? 0 : Math.min(100, (xpInCurrentLevel / LEVEL_XP_STEP) * 100)

  // Texto dinâmico para o resumo
  const resumoTitle =
    completedMissions === 0
      ? 'Se hoje nada coube na agenda, você ainda merece gentileza.'
      : completedMissions < missions.length
        ? 'Você já fez algo por você hoje — e isso já conta muito.'
        : 'Olha quanta coisa você conseguiu cuidar hoje.'

  return (
    <PageTemplate
      label="MATERNAR"
      title="Minhas conquistas"
      subtitle="Um espaço para celebrar o que você já fez – um passo de cada vez."
    >
      <ClientOnly>
        <div className="max-w-6xl mx-auto px-4 pb-16 md:pb-20 space-y-10 md:space-y-12">
          {/* BLOCO 1 – Painel da sua jornada */}
          <RevealSection delay={0}>
            <SoftCard
              className={clsx(
                'relative overflow-hidden rounded-[32px] md:rounded-[40px] p-6 md:p-8 lg:p-9 border border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.20)]',
                highlightRing('painel'),
              )}
            >
              {/* Fundo com glow */}
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -top-16 -left-10 h-40 w-40 rounded-full bg-[rgba(255,0,94,0.28)] blur-3xl" />
                <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-[rgba(255,216,230,0.9)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                      Painel da sua jornada
                    </p>
                    <h2 className="mt-1 text-xl md:text-2xl font-semibold text-[#2f3a56]">
                      Você está avançando. Cada cuidado conta.
                    </h2>
                    <p className="mt-1 text-sm text-[#545454] max-w-xl">
                      Este espaço mostra um resumo leve do que você já fez hoje e ao longo dos dias – sem
                      cobrança, só reconhecimento.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#2f3a56] shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                      <AppIcon name="crown" className="h-4 w-4 text-[#ff005e]" decorative />
                      Nível {level} · Jornada em andamento
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[#545454]/80">
                  Os números abaixo acompanham o que você já fez na plataforma.
                </p>

                {/* Cards de números */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                  <StatCard
                    label="Pontuação de hoje"
                    value={String(todayXp)}
                    helper="+XP somados a partir das ações de hoje"
                    icon="sparkles"
                  />
                  <StatCard
                    label="Pontuação total"
                    value={String(totalXp)}
                    helper="Soma de todos os pequenos passos registrados"
                    icon="star"
                  />
                  <StatCard
                    label="Dias de sequência"
                    value={String(streak)}
                    helper="Dias seguidos em que você conseguiu aparecer por aqui"
                    icon="calendar"
                  />
                </div>

                {/* Barra de progresso geral */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#545454]/90">
                    <span>Rumo ao próximo nível</span>
                    <span>{todayXp} XP hoje</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#ffd8e6]/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff005e] to-[#ff8fb4]"
                      style={{ width: `${xpProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#545454]/80">
                    Você não precisa fazer tudo. Só continuar aparecendo um pouquinho por dia.
                    {' '}
                    {totalXp <= 0
                      ? 'Você começa no Nível 1 — cada cuidado vai somando.'
                      : `Faltam aproximadamente ${xpToNextLevel} XP para o próximo nível.`}
                  </p>
                </div>
              </div>
            </SoftCard>
          </RevealSection>

          {/* BLOCO 2 – Missões & cuidados do dia */}
          <RevealSection delay={60}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">
              {/* Missões do dia – ocupa 3/5 no desktop */}
              <SoftCard
                className={clsx(
                  'lg:col-span-3 rounded-[28px] md:rounded-[32px] p-5 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_16px_44px_rgba(0,0,0,0.16)]',
                  highlightRing('missoes'),
                )}
              >
                <div className="space-y-5">
                  <header className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#ff005e]/80">
                      Missões do dia
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Pequenas ações que somam pontos (e leveza).
                    </h2>
                    <p className="text-sm text-[#545454]">
                      Use este espaço como um lembrete gentil, não como obrigação. Marque só o que fizer
                      sentido hoje.
                    </p>
                  </header>

                  <div className="space-y-2.5">
                    {missions.map(mission => {
                      const isDone = mission.done
                      return (
                        <button
                          key={mission.id}
                          type="button"
                          onClick={() => handleMissionToggle(mission.id)}
                          className={clsx(
                            'w-full flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-all duration-150',
                            isDone
                              ? 'border-[#ff005e]/40 bg-[#ffd8e6]/40 shadow-[0_10px_26px_rgba(0,0,0,0.10)]'
                              : 'border-[#ffd8e6] bg-white hover:bg-[#ffd8e6]/20 hover:border-[#ff005e]/60',
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={clsx(
                                'h-5 w-5 rounded-full border flex items-center justify-center transition-colors',
                                isDone
                                  ? 'border-[#ff005e] bg-[#ff005e]'
                                  : 'border-[#ffd8e6] bg-white',
                              )}
                            >
                              {isDone && (
                                <AppIcon
                                  name="check"
                                  className="h-3.5 w-3.5 text-white"
                                  decorative
                                />
                              )}
                            </div>
                            <span
                              className={clsx(
                                'text-sm md:text-[15px]',
                                isDone ? 'text-[#545454] line-through' : 'text-[#2f3a56]',
                              )}
                            >
                              {mission.label}
                            </span>
                          </div>
                          <span className="ml-3 inline-flex items-center rounded-full bg-[#ffd8e6]/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#ff005e]">
                            {isDone ? `-${mission.xp} XP` : `+${mission.xp} XP`}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#545454]/85">
                    <span>
                      {completedMissions} de {missions.length} missões concluídas hoje.
                    </span>
                    <span>Se não der pra marcar nenhuma, tudo bem também.</span>
                  </footer>
                </div>
              </SoftCard>

              {/* Resumo rápido do dia – 2/5 no desktop */}
              <SoftCard className="lg:col-span-2 rounded-[28px] md:rounded-[32px] p-5 md:p-6 bg-[#ffeef6]/70 border border-[#ffd8e6] shadow-[0_16px_44px_rgba(0,0,0,0.10)]">
                <div className="space-y-4">
                  <header className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#cf285f]">
                      Seu resumo de hoje
                    </p>
                    <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                      {resumoTitle}
                    </h3>
                  </header>

                  <ul className="space-y-2.5 text-sm text-[#545454]">
                    <li className="flex items-start gap-2">
                      <AppIcon
                        name="heart"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff005e]"
                        decorative
                      />
                      <span>
                        {completedMissions === 0
                          ? 'Mesmo quando nenhuma missão cabe no dia, o fato de você estar aqui já mostra cuidado com você.'
                          : `Cada missão marcada aqui (${completedMissions} de ${missions.length}) já mostra que você está olhando para você – mesmo que o dia esteja corrido.`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AppIcon
                        name="idea"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff005e]"
                        decorative
                      />
                      <span>
                        Use este painel junto com o <strong>Meu Dia</strong> e o <strong>Cuidar</strong> para
                        acompanhar sua energia, cuidados e vínculos.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AppIcon
                        name="smile"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff005e]"
                        decorative
                      />
                      <span>
                        Ao final da semana, você poderá olhar para trás e enxergar não só tarefas, mas todos
                        os gestos de presença que fez por você e pela sua família.
                      </span>
                    </li>
                  </ul>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="w-full justify-center border border-[#ff005e]/20 text-[#ff005e]"
                    disabled
                  >
                    Sugestões automáticas chegam em breve
                  </Button>
                </div>
              </SoftCard>
            </div>
          </RevealSection>

          {/* BLOCO 3 – Selos & medalhas */}
          <RevealSection delay={120}>
            <SoftCard
              className={clsx(
                'rounded-[32px] md:rounded-[36px] p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_18px_60px_rgba(0,0,0,0.18)]',
                highlightRing('selos'),
              )}
            >
              <div className="space-y-6">
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                      Selos & medalhas
                    </p>
                    <h2 className="mt-1 text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Uma coleção das suas pequenas grandes vitórias.
                    </h2>
                    <p className="mt-1 text-sm text-[#545454] max-w-2xl">
                      Cada selo representa um momento em que você escolheu cuidar, insistir ou recomeçar. Não
                      é sobre perfeição, é sobre presença.
                    </p>
                  </div>

                  <div className="text-xs text-right text-[#545454]/90">
                    <p>
                      <span className="font-semibold">{SEALS.length}</span> selos disponíveis
                    </p>
                    <p>Novas conquistas serão desbloqueadas ao longo da jornada.</p>
                  </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                  {SEALS.map(seal => (
                    <div
                      key={seal.id}
                      className="flex flex-col items-center justify-between gap-2 rounded-2xl border border-[#ffd8e6] bg-white/80 px-3 py-4 text-center shadow-[0_10px_28px_rgba(0,0,0,0.14)]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffe5ef]">
                        <AppIcon
                          name={seal.icon}
                          className="h-5 w-5 text-[#ff005e]"
                          decorative
                        />
                      </div>
                      <p className="text-[11px] font-semibold leading-snug text-[#2f3a56]">
                        {seal.label}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-[#ffd8e6]/90 px-2 py-0.5 text-[10px] font-semibold text-[#cf285f]">
                        Conquistado
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SoftCard>
          </RevealSection>

          {/* BLOCO 4 – Progresso mensal */}
          <RevealSection delay={160}>
            <SoftCard
              className={clsx(
                'rounded-[32px] md:rounded-[36px] p-6 md:p-8 bg-white/80 border border-white/70 shadow-[0_20px_65px_rgba(0,0,0,0.20)]',
                highlightRing('mensal'),
              )}
            >
              <div className="space-y-6">
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    Progresso mensal
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                    Um mês visto com carinho, não com cobrança.
                  </h2>
                  <p className="text-sm text-[#545454] max-w-2xl">
                    Aqui você terá um resumo dos dias em que conseguiu se cuidar, registrar a rotina ou criar
                    momentos especiais. Mesmo quando os quadrinhos ficarem em branco, isso também conta a
                    história da sua fase.
                  </p>
                </header>

                {/* Mapa simplificado de semanas (mock) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#545454]/95">
                    <span>Visão do mês atual (exemplo)</span>
                    <span>Em breve com dados reais da sua jornada.</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'].map((week, index) => (
                      <div
                        key={week}
                        className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#cf285f]">
                            {week}
                          </span>
                          <span className="text-[10px] text-[#545454]/90">
                            {index === 0 ? 'Exemplo' : 'Em breve'}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4, 5, 6].map(day => (
                            <div
                              key={day}
                              className={clsx(
                                'h-6 w-2.5 rounded-full bg-[#ffd8e6]/70',
                                index === 0 && day < 4 && 'bg-[#ff005e]/70',
                              )}
                            />
                          ))}
                        </div>

                        <p className="mt-1 text-[11px] text-[#545454]/90">
                          Dias marcados mostram momentos em que você conseguiu aparecer por aqui.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs md:text-sm text-[#545454]/85">
                  Quando essa área estiver conectada aos seus registros, você poderá enxergar o mês inteiro com
                  mais gentileza: não só o que faltou, mas tudo o que você já conseguiu fazer por você e pela
                  sua família.
                </p>
              </div>
            </SoftCard>
          </RevealSection>

          {/* Rodapé motivacional geral */}
          <MotivationalFooter routeKey="maternar-minhas-conquistas" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}

// ===== SMALL HELPERS =====

function RevealSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  return (
    <Reveal delay={delay}>
      <div>{children}</div>
    </Reveal>
  )
}

type StatCardProps = {
  label: string
  value: string
  helper?: string
  icon: AppIconName
}

function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-3.5 md:p-4">
      <div className="absolute -top-6 -right-4 h-14 w-14 rounded-full bg-[#ffd8e6] blur-2xl opacity-80" />
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#545454]/80">
            {label}
          </p>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffe5ef]">
            <AppIcon name={icon} className="h-3.5 w-3.5 text-[#ff005e]" decorative />
          </div>
        </div>
        <p className="text-2xl md:text-[26px] font-semibold text-[#2f3a56]">{value}</p>
        {helper && (
          <p className="text-[11px] text-[#545454]/80 leading-snug">
            {helper}
          </p>
        )}
      </div>
    </div>
  )
}
