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

type Step = 'painel' | 'missoes' | 'selos' | 'progresso'
type MissionId = 'autocuidado' | 'conexao' | 'apoio' | 'limite'

type Mission = {
  id: MissionId
  title: string
  how: string
  tag: string
  points: number
}

type Badge = {
  id: string
  title: string
  desc: string
  icon: React.ComponentProps<typeof AppIcon>['name']
  minPoints: number
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

function safeParseInt(v: string | null, fallback = 0) {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) ? n : fallback
}

function todayKey() {
  // YYYY-MM-DD local
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function stepIndex(s: Step) {
  return s === 'painel' ? 1 : s === 'missoes' ? 2 : s === 'selos' ? 3 : 4
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function addDaysKey(date: Date, delta: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + delta)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getWeekKeys(anchor = new Date()) {
  // últimos 7 dias incluindo hoje
  const keys: string[] = []
  for (let i = -6; i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

function getMonthKeys(anchor = new Date()) {
  // últimos 28 dias incluindo hoje (4 semanas)
  const keys: string[] = []
  for (let i = -27; i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

const LS = {
  // pontos acumulados
  pointsTotal: 'mj_points_total',
  // ponto por dia: mj_day_YYYY-MM-DD = number
  dayPrefix: 'mj_day_',
  // missões do dia: mj_done_YYYY-MM-DD_autocuidado = 1
  donePrefix: 'mj_done_',
  // streak: dias seguidos com pelo menos 1 missão
  streak: 'mj_streak',
  streakLastDay: 'mj_streak_last_day',
}

const MISSIONS: Mission[] = [
  {
    id: 'autocuidado',
    title: 'Gesto de autocuidado (rápido e real)',
    how: 'Escolha um micro gesto que cabe hoje: água + respiração, banho mais calmo, 3 minutos de silêncio.',
    tag: 'você',
    points: 10,
  },
  {
    id: 'conexao',
    title: 'Conexão com seu filho (5 min intencionais)',
    how: 'Sem inventar brincadeira. Uma pergunta + ouvir com atenção + um abraço. Só isso.',
    tag: 'conexão',
    points: 12,
  },
  {
    id: 'apoio',
    title: 'Aceitar ou pedir ajuda (uma coisa só)',
    how: 'Delegar uma tarefa pequena ou pedir suporte objetivo. “Você pode fazer X para mim?”',
    tag: 'apoio',
    points: 14,
  },
  {
    id: 'limite',
    title: 'Um “não” que te protege hoje',
    how: 'Negar algo que te sobrecarregaria. Curto, sem justificativa longa. “Hoje não consigo.”',
    tag: 'limite',
    points: 14,
  },
]

const BADGES: Badge[] = [
  { id: 'b-1', title: 'Primeiro passo', desc: 'Você começou. Isso já muda tudo.', icon: 'star', minPoints: 10 },
  { id: 'b-2', title: 'Dia possível', desc: 'Você fez o que cabia — e isso conta.', icon: 'sparkles', minPoints: 22 },
  { id: 'b-3', title: 'Presença real', desc: 'Você criou pequenos momentos de conexão.', icon: 'heart', minPoints: 40 },
  { id: 'b-4', title: 'Rotina mais leve', desc: 'Você ajustou o dia com decisões simples.', icon: 'sun', minPoints: 70 },
]

function readDayPoints(key: string) {
  return safeParseInt(safeGetLS(LS.dayPrefix + key), 0)
}

function writeDayPoints(key: string, points: number) {
  safeSetLS(LS.dayPrefix + key, String(points))
}

function readDone(dayKey: string, missionId: MissionId) {
  return safeGetLS(`${LS.donePrefix}${dayKey}_${missionId}`) === '1'
}

function writeDone(dayKey: string, missionId: MissionId, done: boolean) {
  safeSetLS(`${LS.donePrefix}${dayKey}_${missionId}`, done ? '1' : '0')
}

function readTotalPoints() {
  return safeParseInt(safeGetLS(LS.pointsTotal), 0)
}

function writeTotalPoints(points: number) {
  safeSetLS(LS.pointsTotal, String(points))
}

function updateStreakIfNeeded(day: string, didAnyToday: boolean) {
  // streak conta dias seguidos com pelo menos 1 missão marcada.
  const last = safeGetLS(LS.streakLastDay)
  const streak = safeParseInt(safeGetLS(LS.streak), 0)

  if (!didAnyToday) return

  if (!last) {
    safeSetLS(LS.streak, '1')
    safeSetLS(LS.streakLastDay, day)
    return
  }

  if (last === day) return

  // se ontem foi o last, incrementa; senão reinicia
  const d = new Date(day)
  const yesterday = addDaysKey(d, -1)

  if (last === yesterday) {
    safeSetLS(LS.streak, String(streak + 1))
    safeSetLS(LS.streakLastDay, day)
  } else {
    safeSetLS(LS.streak, '1')
    safeSetLS(LS.streakLastDay, day)
  }
}

function readStreak() {
  return safeParseInt(safeGetLS(LS.streak), 0)
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = clamp(Math.round((value / Math.max(1, max)) * 100), 0, 100)
  return (
    <div className="w-full">
      <div className="h-2.5 rounded-full bg-[#ffe1f1] overflow-hidden border border-[#f5d7e5]">
        <div className="h-full bg-[#fd2597] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[#6a6a6a]">
        <span>{pct}%</span>
        <span>
          {value}/{max}
        </span>
      </div>
    </div>
  )
}

function StepPill({
  active,
  onClick,
  label,
}: {
  active?: boolean
  onClick?: () => void
  label: string
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
      {label}
    </button>
  )
}

function MissionCard({
  mission,
  done,
  onToggle,
}: {
  mission: Mission
  done: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'w-full text-left rounded-3xl border p-4 transition',
        done ? 'bg-[#ffd8e6] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5] hover:bg-[#ffe1f1]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex w-max items-center rounded-full bg-[#ffe1f1] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
            {mission.tag} • {mission.points} pts
          </div>
          <div className="mt-2 text-[13px] font-semibold text-[#2f3a56] leading-snug">{mission.title}</div>
          <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">{mission.how}</div>
        </div>

        <div
          className={[
            'shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center border',
            done ? 'bg-white border-[#f5d7e5]' : 'bg-[#fff7fb] border-[#f5d7e5]',
          ].join(' ')}
        >
          <AppIcon name={done ? 'check' : 'star'} size={18} className="text-[#fd2597]" />
        </div>
      </div>
    </button>
  )
}

export default function MinhaJornadaClient() {
  const [step, setStep] = useState<Step>('painel')
  const [today, setToday] = useState<string>(todayKey())
  const [doneMap, setDoneMap] = useState<Record<MissionId, boolean>>({
    autocuidado: false,
    conexao: false,
    apoio: false,
    limite: false,
  })

  const [totalPoints, setTotalPoints] = useState<number>(0)
  const [todayPoints, setTodayPoints] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'minha-jornada', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const t = todayKey()
    setToday(t)

    const total = readTotalPoints()
    const tPoints = readDayPoints(t)
    const s = readStreak()

    const map: Record<MissionId, boolean> = {
      autocuidado: readDone(t, 'autocuidado'),
      conexao: readDone(t, 'conexao'),
      apoio: readDone(t, 'apoio'),
      limite: readDone(t, 'limite'),
    }

    setTotalPoints(total)
    setTodayPoints(tPoints)
    setStreak(s)
    setDoneMap(map)

    try {
      track('minha_jornada.open', { today: t, totalPoints: total })
    } catch {}
  }, [])

  const weekKeys = useMemo(() => getWeekKeys(new Date()), [])
  const monthKeys = useMemo(() => getMonthKeys(new Date()), [])

  const daysActive7 = useMemo(() => weekKeys.filter((k) => readDayPoints(k) > 0).length, [weekKeys])
  const daysActive28 = useMemo(() => monthKeys.filter((k) => readDayPoints(k) > 0).length, [monthKeys])

  const badgeUnlocked = useMemo(() => BADGES.filter((b) => totalPoints >= b.minPoints), [totalPoints])
  const nextBadge = useMemo(() => BADGES.find((b) => totalPoints < b.minPoints) ?? null, [totalPoints])

  const weeklyTotal = useMemo(() => weekKeys.reduce((acc, k) => acc + readDayPoints(k), 0), [weekKeys])

  const monthWeeks = useMemo(() => {
    // 4 blocos de 7 dias (28 dias)
    const blocks: { label: string; total: number; activeDays: number }[] = []
    for (let w = 0; w < 4; w++) {
      const slice = monthKeys.slice(w * 7, w * 7 + 7)
      const total = slice.reduce((acc, k) => acc + readDayPoints(k), 0)
      const activeDays = slice.filter((k) => readDayPoints(k) > 0).length
      blocks.push({ label: `Semana ${w + 1}`, total, activeDays })
    }
    return blocks
  }, [monthKeys])

  function go(next: Step) {
    setStep(next)
    try {
      track('minha_jornada.step', { step: next })
    } catch {}
  }

  function toggleMission(m: Mission) {
    const wasDone = doneMap[m.id]
    const nextDone = !wasDone

    const nextMap = { ...doneMap, [m.id]: nextDone }
    setDoneMap(nextMap)

    // pontos do dia
    const currentDayPoints = readDayPoints(today)
    const nextDayPoints = clamp(currentDayPoints + (nextDone ? m.points : -m.points), 0, 9999)
    writeDayPoints(today, nextDayPoints)
    setTodayPoints(nextDayPoints)

    // total
    const currentTotal = readTotalPoints()
    const nextTotal = clamp(currentTotal + (nextDone ? m.points : -m.points), 0, 999999)
    writeTotalPoints(nextTotal)
    setTotalPoints(nextTotal)

    // done flag
    writeDone(today, m.id, nextDone)

    // streak (apenas se marcou alguma coisa hoje)
    const didAnyToday = Object.values(nextMap).some(Boolean)
    updateStreakIfNeeded(today, didAnyToday)
    setStreak(readStreak())

    try {
      track('minha_jornada.mission.toggle', { id: m.id, done: nextDone, points: m.points, today })
    } catch {}
  }

  const completedTodayCount = useMemo(() => Object.values(doneMap).filter(Boolean).length, [doneMap])
  const todayGoal = 26 // “boa” meta interna (2 missões médias)
  const weeklyGoal = 120 // referência suave para semana

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
                Minha Jornada
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um painel para você enxergar progresso real: passos pequenos, missões possíveis e conquistas que somam.
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
                      <AppIcon name="star" size={20} className="text-[#fd2597]" />
                    </div>

                    <div>
                      <div className="text-[12px] text-white/85">
                        Passo {stepIndex(step)}/4 • hoje: {completedTodayCount}/4 missões • sequência: {streak} dia(s)
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Sua jornada em visão clara
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        Aqui a regra é simples: marcou o que foi possível, você avançou.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => go('missoes')}
                    className="
                      rounded-full
                      bg-white/90 hover:bg-white
                      text-[#2f3a56]
                      px-4 py-2 text-[12px]
                      shadow-lg transition
                    "
                  >
                    Missões de hoje
                  </button>
                </div>

                {/* Stepper */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <StepPill active={step === 'painel'} onClick={() => go('painel')} label="Painel" />
                  <StepPill active={step === 'missoes'} onClick={() => go('missoes')} label="Missões do dia" />
                  <StepPill active={step === 'selos'} onClick={() => go('selos')} label="Selos & medalhas" />
                  <StepPill active={step === 'progresso'} onClick={() => go('progresso')} label="Progresso mensal" />
                </div>
              </div>

              {/* Conteúdo muda dentro do mesmo container */}
              <div className="p-4 md:p-6">
                {/* 1) PAINEL DA JORNADA */}
                {step === 'painel' ? (
                  <div id="painel" className="space-y-4">
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
                            Painel da jornada
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Visão geral (sem julgamentos)</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Isso aqui não é produtividade. É visibilidade: você enxerga o que já aconteceu.
                          </p>
                        </div>
                      </div>

                      {/* Cards diferentes: métricas + barra + destaque */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">hoje</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{todayPoints} pts</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">missões feitas: {completedTodayCount}/4</div>
                          <div className="mt-3">
                            <ProgressBar value={todayPoints} max={todayGoal} />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">últimos 7 dias</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{weeklyTotal} pts</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">dias ativos: {daysActive7}/7</div>
                          <div className="mt-3">
                            <ProgressBar value={weeklyTotal} max={weeklyGoal} />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">total</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{totalPoints} pts</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">dias ativos (28): {daysActive28}/28</div>

                          <div className="mt-3 rounded-2xl bg-[#ffe1f1] p-3 border border-[#f5d7e5]">
                            <div className="text-[12px] font-semibold text-[#2f3a56]">Sequência</div>
                            <div className="text-[12px] text-[#6a6a6a]">{streak} dia(s) seguidos com pelo menos 1 missão</div>
                          </div>
                        </div>
                      </div>

                      {/* CTA interno */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => go('missoes')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Marcar missões de hoje
                        </button>
                        <button
                          onClick={() => go('selos')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ver selos liberados
                        </button>
                        <button
                          onClick={() => go('progresso')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ver seu mês
                        </button>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* 2) MISSÕES DO DIA (executáveis) */}
                {step === 'missoes' ? (
                  <div id="missoes" className="space-y-4">
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
                            Missões do dia
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Marque o que foi possível</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Missão aqui não é cobrança: é registro do que você realmente fez.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {MISSIONS.map((m) => (
                          <MissionCard
                            key={m.id}
                            mission={m}
                            done={doneMap[m.id]}
                            onToggle={() => toggleMission(m)}
                          />
                        ))}
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">hoje</div>
                        <div className="mt-1 text-[14px] font-semibold text-[#2f3a56]">
                          {completedTodayCount === 0
                            ? 'Se der para marcar só uma, já vale.'
                            : completedTodayCount === 1
                              ? 'Boa. Uma missão já conta.'
                              : completedTodayCount === 2
                                ? 'Perfeito. Duas missões já mudam o clima do dia.'
                                : completedTodayCount === 3
                                  ? 'Você fechou o dia com presença real.'
                                  : 'Fechado. Quatro missões — você avançou muito hoje.'}
                        </div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Dica prática: se você está exausta, marque a missão que aconteceu — não a que você “queria ter feito”.
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('selos')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Ver selos que liberou
                          </button>
                          <button
                            onClick={() => go('progresso')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver progresso do mês
                          </button>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* 3) SELOS & MEDALHAS (concretos, por pontos) */}
                {step === 'selos' ? (
                  <div id="selos" className="space-y-4">
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
                            Selos & medalhas
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Conquistas reais (sem perfeição)</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Você desbloqueia conforme vive. Sem “metas inalcançáveis”.
                          </p>
                        </div>
                      </div>

                      {/* Layout diferente: vitrine + próximo selo */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">liberados</div>
                          <div className="mt-3 space-y-3">
                            {badgeUnlocked.length === 0 ? (
                              <div className="text-[13px] text-[#6a6a6a]">
                                Ainda não tem selo liberado — marque uma missão e o primeiro já aparece aqui.
                              </div>
                            ) : (
                              badgeUnlocked.map((b) => (
                                <div key={b.id} className="flex items-start gap-3 rounded-2xl bg-white border border-[#f5d7e5] p-4">
                                  <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                                    <AppIcon name={b.icon} size={18} className="text-[#fd2597]" />
                                  </div>
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#2f3a56]">{b.title}</div>
                                    <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">{b.desc}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-[#f5d7e5] bg-white p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">próximo selo</div>
                          {nextBadge ? (
                            <div className="mt-3">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                                  <AppIcon name={nextBadge.icon} size={18} className="text-[#fd2597]" />
                                </div>
                                <div>
                                  <div className="text-[14px] font-semibold text-[#2f3a56]">{nextBadge.title}</div>
                                  <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">{nextBadge.desc}</div>
                                </div>
                              </div>
                              <div className="mt-4">
                                <ProgressBar value={totalPoints} max={nextBadge.minPoints} />
                              </div>
                              <div className="mt-3 text-[12px] text-[#6a6a6a]">
                                Falta <span className="font-semibold text-[#2f3a56]">{Math.max(0, nextBadge.minPoints - totalPoints)} pts</span>.
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 text-[13px] text-[#6a6a6a]">
                              Você liberou todos os selos atuais. (Depois a gente expande isso com P7/P8.)
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              onClick={() => go('missoes')}
                              className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                            >
                              Marcar missões
                            </button>
                            <button
                              onClick={() => go('progresso')}
                              className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                            >
                              Ver mês
                            </button>
                          </div>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* 4) PROGRESSO MENSAL (visual por semanas) */}
                {step === 'progresso' ? (
                  <div id="progresso" className="space-y-4">
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
                            Progresso mensal
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Quatro semanas em visão clara</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Enxergar tendência ajuda mais do que cobrar constância perfeita.
                          </p>
                        </div>
                      </div>

                      {/* Layout diferente: semanas como cards horizontais */}
                      <div className="mt-4 space-y-3">
                        {monthWeeks.map((w) => (
                          <div
                            key={w.label}
                            className="rounded-3xl border border-[#f5d7e5] bg-white p-5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[12px] font-semibold text-[#2f3a56]">{w.label}</div>
                                <div className="mt-1 text-[12px] text-[#6a6a6a]">
                                  {w.activeDays}/7 dias ativos • {w.total} pts
                                </div>
                              </div>
                              <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                                {w.activeDays >= 5 ? 'forte' : w.activeDays >= 3 ? 'ok' : 'sobrevivência'}
                              </span>
                            </div>
                            <div className="mt-3">
                              <ProgressBar value={w.total} max={weeklyGoal} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">leitura rápida</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Se teve semana “sobrevivência”, isso não é falha. É dado. A próxima semana começa no próximo passo,
                          não na cobrança.
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            onClick={() => go('missoes')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Marcar missão de hoje
                          </button>
                          <button
                            onClick={() => go('painel')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Voltar ao painel
                          </button>
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
