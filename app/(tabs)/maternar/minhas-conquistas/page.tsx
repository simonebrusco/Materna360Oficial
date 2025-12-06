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

import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import {
  getXpSnapshot,
  updateXP,
  getXpHistory,
  type XpSnapshot,
  type XpHistoryEntry,
} from '@/app/lib/xp'

// ===== TYPES & CONSTANTS =====

type HighlightTarget = 'painel' | 'missoes' | 'selos' | 'mensal' | null

type Mission = {
  id: string
  label: string
  xp: number
  done?: boolean
}

type SealId =
  | 'primeiro-passo'
  | 'semana-leve'
  | 'cuidar-de-mim'
  | 'conexao'
  | 'rotina'
  | 'presenca'

type Seal = {
  id: SealId
  label: string
  icon: AppIconName
}

type UnlockedSealsMap = Record<SealId, boolean>

type WeekDayIntensity = 'none' | 'low' | 'medium' | 'high'

type WeekSummary = {
  label: string
  days: { xp: number; intensity: WeekDayIntensity }[]
}

const INITIAL_MISSIONS: Mission[] = [
  { id: 'humor', label: 'Registrar como estou hoje', xp: 15 },
  { id: 'planner', label: 'Preencher meu planner', xp: 25 },
  { id: 'pausa', label: 'Fazer uma pausa de 5 minutos sem culpa', xp: 20 },
  { id: 'conquista', label: 'Registrar uma conquista', xp: 30 },
]

const SEALS: Seal[] = [
  { id: 'primeiro-passo', label: 'Primeiro passo', icon: 'sparkles' },
  { id: 'semana-leve', label: 'Semana leve', icon: 'sun' },
  { id: 'cuidar-de-mim', label: 'Cuidando de mim', icon: 'heart' },
  { id: 'conexao', label: 'Conectando com meu filho', icon: 'smile' },
  { id: 'rotina', label: 'Rotina em dia', icon: 'calendar' },
  { id: 'presenca', label: 'Presença real', icon: 'star' },
]

// XP alvo por nível (aprox. 5–7 dias de uso leve)
const LEVEL_XP = 300

// storage das missões por dia
const MISSIONS_STATE_PREFIX = 'missions:minhas-conquistas:'

// ===== SMALL PURE HELPERS =====

function highlightRingClass(highlightFromQuery: HighlightTarget, target: HighlightTarget) {
  return highlightFromQuery === target
    ? 'ring-2 ring-[#ff005e] ring-offset-2 ring-offset-pink-100/60'
    : ''
}

function computeLevel(totalXp: number) {
  if (totalXp <= 0) {
    return {
      level: 1,
      inLevelProgressPercent: 0,
      missingToNext: LEVEL_XP,
    }
  }

  const level = Math.floor(totalXp / LEVEL_XP) + 1
  const levelBaseXp = (level - 1) * LEVEL_XP
  const currentInLevel = Math.max(0, totalXp - levelBaseXp)
  const missingToNext = Math.max(0, level * LEVEL_XP - totalXp)
  const inLevelProgressPercent = Math.min(100, (currentInLevel / LEVEL_XP) * 100)

  return {
    level,
    inLevelProgressPercent,
    missingToNext,
  }
}

/**
 * Regras de desbloqueio dos selos.
 *
 * PRIMEIRO PASSO: teve pelo menos 1 dia com XP > 0.
 * SEMANA LEVE: streak atual >= 5.
 * CUIDAR DE MIM: total XP >= 300.
 * CONEXÃO: pelo menos 10 dias diferentes com XP > 0.
 * ROTINA EM DIA: streak atual >= 10.
 * PRESENÇA REAL: pelo menos 20 dias com XP > 0 e streak atual >= 14.
 */
function computeUnlockedSeals(
  snapshot: XpSnapshot,
  history: XpHistoryEntry[],
): UnlockedSealsMap {
  const daysWithPresence = history.filter((d) => d.xp > 0).length
  const anyDay = daysWithPresence > 0
  const manyDays = daysWithPresence >= 10
  const longPresence = daysWithPresence >= 20

  const streak = snapshot.streak ?? 0
  const total = snapshot.total ?? 0

  const map: UnlockedSealsMap = {
    'primeiro-passo': anyDay,
    'semana-leve': streak >= 5,
    'cuidar-de-mim': total >= LEVEL_XP,
    conexao: manyDays,
    rotina: streak >= 10,
    presenca: longPresence && streak >= 14,
  }

  return map
}

/**
 * Constrói um texto carinhoso de resumo para o card "Seu resumo de hoje".
 */
function buildTodaySummaryText(todayXp: number, completedMissions: number): string {
  if (todayXp <= 0 && completedMissions === 0) {
    return 'Se hoje nada coube na agenda, você ainda merece gentileza.'
  }

  if (completedMissions === 0 && todayXp > 0) {
    return 'Só de aparecer por aqui, você já está cuidando de você.'
  }

  if (completedMissions > 0 && todayXp < 50) {
    return 'Você deu pequenos passos hoje, e isso já conta muito.'
  }

  if (completedMissions >= 2 && todayXp >= 50 && todayXp < 120) {
    return 'Você marcou cuidados importantes hoje. Celebre esse movimento.'
  }

  return 'Hoje você se fez presente de um jeito muito bonito. Não precisa ser perfeito para ser valioso.'
}

/**
 * Intensidade de presença por XP do dia.
 */
function xpToIntensity(xp: number): WeekDayIntensity {
  if (xp <= 0) return 'none'
  if (xp < 30) return 'low'
  if (xp < 80) return 'medium'
  return 'high'
}

/**
 * Quebra o histórico do mês corrente em até 4 semanas.
 */
function buildMonthWeeks(history: XpHistoryEntry[]): WeekSummary[] {
  const todayKey = getBrazilDateKey()
  const [yearStr, monthStr] = todayKey.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr) // 1-12
  const daysInMonth = new Date(year, month, 0).getDate()

  const byDate = new Map<string, number>()
  history.forEach((h) => {
    byDate.set(h.dateKey, h.xp)
  })

  const weeks: WeekSummary[] = []
  let current: WeekSummary = { label: 'Semana 1', days: [] }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = String(day).padStart(2, '0')
    const key = `${yearStr}-${monthStr}-${d}`
    const xp = byDate.get(key) ?? 0

    current.days.push({ xp, intensity: xpToIntensity(xp) })

    if (current.days.length === 7 || day === daysInMonth) {
      weeks.push(current)
      if (day !== daysInMonth) {
        current = {
          label: `Semana ${weeks.length + 1}`,
          days: [],
        }
      }
    }
  }

  // Garante no máximo 4 semanas na UI
  return weeks.slice(0, 4)
}

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

  const todayDateKey = useMemo(() => getBrazilDateKey(), [])

  const [missions, setMissions] = useState<Mission[]>(() =>
    INITIAL_MISSIONS.map((m) => ({ ...m, done: false })),
  )
  const [xp, setXp] = useState<XpSnapshot | null>(null)
  const [xpHistory, setXpHistory] = useState<XpHistoryEntry[]>([])
  const [unlockedSeals, setUnlockedSeals] = useState<UnlockedSealsMap>({
    'primeiro-passo': false,
    'semana-leve': false,
    'cuidar-de-mim': false,
    conexao: false,
    rotina: false,
    presenca: false,
  })

  // Sugestão automática textual (placeholder simples, pode evoluir com IA depois)
  const completedMissions = missions.filter((m) => m.done).length
  const todayXp = xp?.today ?? 0
  const totalXp = xp?.total ?? 0
  const streak = xp?.streak ?? 0

  const todaySummaryTitle = buildTodaySummaryText(todayXp, completedMissions)

  const levelInfo = computeLevel(totalXp)

  // Carrega XP / histórico / estado de missões
  useEffect(() => {
    try {
      const snapshot = getXpSnapshot()
      setXp(snapshot)
      const history = getXpHistory()
      setXpHistory(history)

      const seals = computeUnlockedSeals(snapshot, history)
      setUnlockedSeals(seals)
    } catch (error) {
      console.error('[MinhasConquistas] Erro ao carregar XP inicial:', error)
      const snapshot: XpSnapshot = { today: 0, total: 0, streak: 0 }
      setXp(snapshot)
      setXpHistory([])
      setUnlockedSeals(computeUnlockedSeals(snapshot, []))
    }

    // Estado de missões do dia
    try {
      const stored =
        load<Record<string, boolean>>(`${MISSIONS_STATE_PREFIX}${todayDateKey}`) ?? {}
      setMissions(
        INITIAL_MISSIONS.map((m) => ({
          ...m,
          done: !!stored[m.id],
        })),
      )
    } catch (error) {
      console.error('[MinhasConquistas] Erro ao carregar missões do dia:', error)
    }
  }, [todayDateKey])

  const weeks = useMemo(() => buildMonthWeeks(xpHistory), [xpHistory])

  const handleMissionToggle = (id: string) => {
    const mission = missions.find((m) => m.id === id)
    if (!mission) return

    const wasDone = !!mission.done
    const newDone = !wasDone
    const delta = newDone ? mission.xp : -mission.xp

    // Atualiza missões visualmente + persiste estado do dia
    setMissions((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, done: newDone } : item,
      )

      const stored: Record<string, boolean> = {}
      updated.forEach((m) => {
        if (m.done) stored[m.id] = true
      })
      save(`${MISSIONS_STATE_PREFIX}${todayDateKey}`, stored)

      return updated
    })

    // Atualiza XP com fallback seguro
    setXp((prev) => {
      const base: XpSnapshot = prev ?? { today: 0, total: 0, streak: 0 }

      const fallback: XpSnapshot = {
        today: Math.max(0, base.today + delta),
        total: Math.max(0, base.total + delta),
        streak: base.streak || (delta > 0 ? 1 : 0),
      }

      try {
        const fromStore = updateXP(delta)
        // Recalcula selos e histórico depois de atualizar XP
        const history = getXpHistory()
        setXpHistory(history)
        setUnlockedSeals(computeUnlockedSeals(fromStore, history))

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
    highlightRingClass(highlightFromQuery, target)

  const levelBadgeLabel =
    totalXp > 0
      ? `Nível ${levelInfo.level} · Jornada em andamento`
      : 'Nível 1 · Jornada começando com calma'

  const progressHelperText =
    totalXp > 0
      ? `Faltam aproximadamente ${levelInfo.missingToNext} XP para o próximo nível.`
      : `Seu próximo nível chega a cada ${LEVEL_XP} XP somados, sem pressa.`

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
                      Este espaço mostra um resumo leve do que você já fez hoje e ao longo dos dias
                      – sem cobrança, só reconhecimento.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#2f3a56] shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                      <AppIcon name="crown" className="h-4 w-4 text-[#ff005e]" decorative />
                      {levelBadgeLabel}
                    </span>
                    <span className="text-[11px] text-[#545454]/80">
                      Os números abaixo acompanham o que você já fez na plataforma.
                    </span>
                  </div>
                </div>

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

                {/* Barra de progresso geral por nível */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#545454]/90">
                    <span>Rumo ao próximo nível</span>
                    <span>{todayXp} XP hoje</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#ffd8e6]/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff005e] to-[#ff8fb4]"
                      style={{ width: `${levelInfo.inLevelProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#545454]/80">{progressHelperText}</p>
                </div>
              </div>
            </SoftCard>
          </RevealSection>

          {/* BLOCO 2 – Missões & resumo do dia */}
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
                      Use este espaço como um lembrete gentil, não como obrigação. Marque só o que
                      fizer sentido hoje.
                    </p>
                  </header>

                  <div className="space-y-2.5">
                    {missions.map((mission) => {
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

              {/* Resumo rápido do dia */}
              <SoftCard className="lg:col-span-2 rounded-[28px] md:rounded-[32px] p-5 md:p-6 bg-[#ffeef6]/70 border border-[#ffd8e6] shadow-[0_16px_44px_rgba(0,0,0,0.10)]">
                <div className="space-y-4">
                  <header className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#cf285f]">
                      Seu resumo de hoje
                    </p>
                    <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                      {todaySummaryTitle}
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
                        Mesmo quando nenhuma missão cabe no dia, o fato de você estar aqui já mostra
                        cuidado com você.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AppIcon
                        name="idea"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff005e]"
                        decorative
                      />
                      <span>
                        Use este painel junto com o <strong>Meu Dia</strong> e o <strong>Cuidar</strong>{' '}
                        para acompanhar sua energia, cuidados e vínculos.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AppIcon
                        name="smile"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#ff005e]"
                        decorative
                      />
                      <span>
                        Ao final da semana, você poderá olhar para trás e enxergar não só tarefas,
                        mas todos os gestos de presença que fez por você e pela sua família.
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
                'rounded-[32px] md:rounded-[36px] p-6 md:8 bg-white border border-[#ffd8e6] shadow-[0_18px_60px_rgba(0,0,0,0.18)]',
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
                      Cada selo representa um momento em que você escolheu cuidar, insistir ou
                      recomeçar. Não é sobre perfeição, é sobre presença.
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
                  {SEALS.map((seal) => {
                    const unlocked = unlockedSeals[seal.id]
                    return (
                      <div
                        key={seal.id}
                        className={clsx(
                          'flex flex-col items-center justify-between gap-2 rounded-2xl border px-3 py-4 text-center shadow-[0_10px_28px_rgba(0,0,0,0.14)]',
                          unlocked
                            ? 'border-[#ffd8e6] bg-white/90'
                            : 'border-[#ffd8e6]/70 bg-white/60 opacity-65',
                        )}
                      >
                        <div
                          className={clsx(
                            'flex h-10 w-10 items-center justify-center rounded-2xl',
                            unlocked ? 'bg-[#ffe5ef]' : 'bg-[#f9e9f1]',
                          )}
                        >
                          <AppIcon
                            name={seal.icon}
                            className={clsx(
                              'h-5 w-5',
                              unlocked ? 'text-[#ff005e]' : 'text-[#cf285f]/60',
                            )}
                            decorative
                          />
                        </div>
                        <p className="text-[11px] font-semibold leading-snug text-[#2f3a56]">
                          {seal.label}
                        </p>
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            unlocked
                              ? 'bg-[#ffd8e6]/90 text-[#cf285f]'
                              : 'bg-[#f3d7e2] text-[#a35a7a]',
                          )}
                        >
                          {unlocked ? 'Conquistado' : 'Bloqueado'}
                        </span>
                      </div>
                    )
                  })}
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
                    Aqui você vê um resumo dos dias em que conseguiu se cuidar, registrar a rotina
                    ou criar momentos especiais. Mesmo quando os quadrinhos ficarem em branco, isso
                    também conta a história da sua fase.
                  </p>
                </header>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#545454]/95">
                    <span>Visão do mês atual</span>
                    <span>As barrinhas mostram a intensidade dos seus dias.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {weeks.map((week) => (
                      <div
                        key={week.label}
                        className="rounded-2xl border border-[#ffd8e6] bg-[#fff7fb] px-3 py-3 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#cf285f]">
                            {week.label}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          {week.days.map((day, idx) => (
                            <div
                              key={`${week.label}-${idx}`}
                              className={clsx(
                                'h-6 w-2.5 rounded-full bg-[#ffd8e6]/50',
                                day.intensity === 'none' && 'bg-[#ffd8e6]/30',
                                day.intensity === 'low' && 'bg-[#ffd8e6]/80',
                                day.intensity === 'medium' && 'bg-[#ff6fa3]/80',
                                day.intensity === 'high' && 'bg-[#ff005e]/80',
                              )}
                            />
                          ))}
                        </div>

                        <p className="mt-1 text-[11px] text-[#545454]/90">
                          Barrinhas mais fortes mostram dias com mais gestos de presença; as mais
                          clarinhas mostram dias em que a vida pediu pausa.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs md:text-sm text-[#545454]/85">
                  Quando essa área estiver conectada a mais registros seus, você poderá enxergar o
                  mês inteiro com mais gentileza: não só o que faltou, mas tudo o que você já
                  conseguiu fazer por você e pela sua família.
                </p>
              </div>
            </SoftCard>
          </RevealSection>

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
