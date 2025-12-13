'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import WeeklyPlannerShell from '@/components/planner/WeeklyPlannerShell'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import { DAILY_MESSAGES } from '@/app/data/dailyMessages'
import { getDailyIndex } from '@/app/lib/dailyMessage'
import { getTimeGreeting } from '@/app/lib/greetings'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type MissionId = 'autocuidado' | 'conexao' | 'apoio' | 'limite'
type Mission = {
  id: MissionId
  title: string
  how: string
  tag: string
  points: number
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function addDaysKey(date: Date, delta: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + delta)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const LS = {
  pointsTotal: 'mj_points_total',
  dayPrefix: 'mj_day_',
  donePrefix: 'mj_done_',
  streak: 'mj_streak',
  streakLastDay: 'mj_streak_last_day',
}

const MISSIONS: Mission[] = [
  {
    id: 'autocuidado',
    title: 'Gesto de autocuidado (rápido e real)',
    how: 'Um micro gesto que cabe hoje: água + respiração, banho mais calmo, 3 minutos de silêncio.',
    tag: 'você',
    points: 10,
  },
  {
    id: 'conexao',
    title: 'Conexão com seu filho (5 min intencionais)',
    how: 'Uma pergunta + ouvir com atenção + um abraço. Só isso.',
    tag: 'conexão',
    points: 12,
  },
  {
    id: 'apoio',
    title: 'Aceitar ou pedir ajuda (uma coisa só)',
    how: 'Delegue uma tarefa pequena ou peça suporte objetivo: “Você pode fazer X?”',
    tag: 'apoio',
    points: 14,
  },
  {
    id: 'limite',
    title: 'Um “não” que te protege hoje',
    how: 'Negue algo que te sobrecarregaria. Curto e sem justificativa longa: “Hoje não consigo.”',
    tag: 'limite',
    points: 14,
  },
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
  const last = safeGetLS(LS.streakLastDay)
  const streak = safeParseInt(safeGetLS(LS.streak), 0)
  if (!didAnyToday) return
  if (!last) {
    safeSetLS(LS.streak, '1')
    safeSetLS(LS.streakLastDay, day)
    return
  }
  if (last === day) return
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
      <div className="h-2.5 rounded-full bg-white/55 overflow-hidden border border-white/45">
        <div className="h-full bg-[#fd2597] rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-white/85">
        <span>{pct}%</span>
        <span>
          {value}/{max}
        </span>
      </div>
    </div>
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
        done
          ? 'bg-white/85 border-white/55'
          : 'bg-white/12 border-white/35 hover:bg-white/18',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex w-max items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#b8236b] uppercase">
            {mission.tag} • {mission.points} pts
          </div>
          <div className="mt-2 text-[13px] font-semibold text-white leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
            {mission.title}
          </div>
          <div className="mt-2 text-[12px] text-white/90 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.20)]">
            {mission.how}
          </div>
        </div>

        <div
          className={[
            'shrink-0 h-10 w-10 rounded-2xl flex items-center justify-center border',
            done ? 'bg-white border-white/60' : 'bg-white/20 border-white/35',
          ].join(' ')}
        >
          <AppIcon name={done ? 'check' : 'star'} size={18} className="text-[#fd2597]" />
        </div>
      </div>
    </button>
  )
}

export default function MeuDiaClient() {
  const { name } = useProfile()
  const [greeting, setGreeting] = useState<string>('')

  // ✅ Mensagem do dia calculada somente no client (evita hydration mismatch)
  const [dailyMessage, setDailyMessage] = useState<string>('…')

  // Missões (client only)
  const [today, setToday] = useState<string>(todayKey())
  const [doneMap, setDoneMap] = useState<Record<MissionId, boolean>>({
    autocuidado: false,
    conexao: false,
    apoio: false,
    limite: false,
  })
  const [todayPoints, setTodayPoints] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)

  const completedTodayCount = useMemo(
    () => Object.values(doneMap).filter(Boolean).length,
    [doneMap],
  )
  const todayGoal = 26 // referência suave: 2 missões “médias”

  // tracking de navegação
  useEffect(() => {
    track('nav.click', {
      tab: 'meu-dia',
      timestamp: new Date().toISOString(),
    })
  }, [])

  // saudação dinâmica (Bom dia / Boa tarde / Boa noite + nome)
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : ''
    const updateGreeting = () => setGreeting(getTimeGreeting(firstName))
    updateGreeting()
    const interval = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(interval)
  }, [name])

  // ✅ define a mensagem do dia após montar
  useEffect(() => {
    const index = getDailyIndex(new Date(), DAILY_MESSAGES.length)
    const msg = DAILY_MESSAGES[index] ?? '…'
    setDailyMessage(msg)
  }, [])

  // init missões (LS)
  useEffect(() => {
    const t = todayKey()
    setToday(t)

    const map: Record<MissionId, boolean> = {
      autocuidado: readDone(t, 'autocuidado'),
      conexao: readDone(t, 'conexao'),
      apoio: readDone(t, 'apoio'),
      limite: readDone(t, 'limite'),
    }

    setDoneMap(map)
    setTodayPoints(readDayPoints(t))
    setStreak(readStreak())

    try {
      track('meu_dia.missoes.open', { today: t })
    } catch {}
  }, [])

  function toggleMission(m: Mission) {
    const wasDone = doneMap[m.id]
    const nextDone = !wasDone
    const nextMap = { ...doneMap, [m.id]: nextDone }
    setDoneMap(nextMap)

    // pontos do dia
    const currentDayPoints = readDayPoints(today)
    const nextDayPoints = clamp(
      currentDayPoints + (nextDone ? m.points : -m.points),
      0,
      9999,
    )
    writeDayPoints(today, nextDayPoints)
    setTodayPoints(nextDayPoints)

    // total
    const currentTotal = readTotalPoints()
    const nextTotal = clamp(
      currentTotal + (nextDone ? m.points : -m.points),
      0,
      999999,
    )
    writeTotalPoints(nextTotal)

    // done flag
    writeDone(today, m.id, nextDone)

    // streak
    const didAnyToday = Object.values(nextMap).some(Boolean)
    updateStreakIfNeeded(today, didAnyToday)
    setStreak(readStreak())

    try {
      track('meu_dia.missao.toggle', {
        id: m.id,
        done: nextDone,
        points: m.points,
        today,
      })
    } catch {}
  }

  // recarrega a mensagem à meia-noite
  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0)

    const timeoutId = window.setTimeout(() => window.location.reload(), delay)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <main
      data-layout="page-template-v1"
      data-tab="meu-dia"
      className="
        relative
        min-h-[100dvh]
        pb-24
        flex
        flex-col
        overflow-hidden

        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#2f3a56_0%,#553a62_10%,#8b3563_22%,#fd2597_40%,#fdbed7_68%,#ffe1f1_88%,#fff7fa_100%)]
      "
    >
      {/* overlays premium (não muda layout, só acabamento) */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(900px_520px_at_18%_10%,rgba(255,216,230,0.40)_0%,rgba(255,216,230,0.00)_60%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-[radial-gradient(820px_520px_at_78%_22%,rgba(253,37,151,0.26)_0%,rgba(253,37,151,0.00)_62%)]
        "
      />
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-0 top-0 h-20
          bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),rgba(255,255,255,0.00))]
        "
      />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 flex-1 mx-auto max-w-3xl px-4 md:px-6">
        {/* HERO — alinhado ao Maternar */}
        <header className="pt-8 md:pt-10 mb-6 md:mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <span className="inline-flex items-center rounded-full border border-white/35 bg-white/12 px-3 py-1 text-[12px] font-semibold tracking-[0.24em] text-white uppercase backdrop-blur-md">
                MEU DIA
              </span>

              <h1 className="text-[28px] md:text-[32px] font-semibold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.38)]">
                Seu Dia Organizado
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_5px_rgba(0,0,0,0.45)]">
                Um espaço para planejar com leveza.
              </p>

              {/* Saudação + frase diária */}
              <div className="pt-3 space-y-1">
                <ClientOnly>
                  <h2 className="text-[22px] md:text-[24px] font-semibold text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.38)]">
                    {greeting || 'Bom dia'}
                  </h2>
                </ClientOnly>

                <p className="text-sm md:text-base text-white/95 leading-relaxed max-w-xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  &quot;{dailyMessage}&quot;
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ MISSÕES DE HOJE (EXECUÇÃO FICA NO MEU DIA) */}
        <section
          className="
            mb-4 md:mb-5
            rounded-3xl
            bg-white/10
            border border-white/35
            backdrop-blur-xl
            shadow-[0_18px_45px_rgba(0,0,0,0.18)]
            overflow-hidden
          "
        >
          {/* top bar */}
          <div className="p-4 md:p-5 border-b border-white/25">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
                  <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
                </div>

                <div className="space-y-1">
                  <div className="text-[12px] text-white/85">
                    Missões de hoje • {completedTodayCount}/4 • sequência: {streak} dia(s)
                  </div>
                  <div className="text-[16px] md:text-[18px] font-semibold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                    Marque o que foi possível
                  </div>
                  <div className="text-[12px] md:text-[13px] text-white/85 drop-shadow-[0_1px_6px_rgba(0,0,0,0.20)]">
                    Aqui é registro real — não cobrança.
                  </div>
                </div>
              </div>

              <Link
                href="/maternar/minha-jornada"
                className="
                  rounded-full
                  bg-white/90 hover:bg-white
                  text-[#2f3a56]
                  px-4 py-2 text-[12px]
                  shadow-lg transition
                  whitespace-nowrap
                "
                onClick={() => {
                  try {
                    track('meu_dia.missoes.cta_jornada', { today })
                  } catch {}
                }}
              >
                Ver Minha Jornada
              </Link>
            </div>

            <div className="mt-4">
              <ProgressBar value={todayPoints} max={todayGoal} />
            </div>
          </div>

          {/* cards */}
          <div className="p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MISSIONS.map(m => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  done={doneMap[m.id]}
                  onToggle={() => toggleMission(m)}
                />
              ))}
            </div>

            <div className="mt-4 rounded-3xl border border-white/25 bg-white/10 p-4">
              <div className="text-[13px] font-semibold text-white">
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
              <div className="mt-1 text-[12px] text-white/85 leading-relaxed">
                Dica prática: marque a missão que aconteceu — não a que você “queria ter feito”.
              </div>
            </div>
          </div>
        </section>

        {/* Wrapper premium do Planner (sem mexer no WeeklyPlannerShell) */}
        <div
          className="
            rounded-3xl
            bg-white/10
            border border-white/35
            backdrop-blur-xl
            shadow-[0_18px_45px_rgba(0,0,0,0.18)]
            p-3 md:p-4
          "
        >
          <WeeklyPlannerShell />
        </div>

        {/* Footer motivacional */}
        <div className="mt-8 md:mt-10">
          <MotivationalFooter routeKey="meu-dia-hub" />
        </div>
      </div>

      {/* RODAPÉ LEGAL */}
      <footer
        className="
          relative z-10
          w-full
          text-center
          pt-4
          pb-2
          px-4
          text-[12px]
          md:text-[13px]
          leading-relaxed
          text-[#6A6A6A]/85
        "
      >
        <p>© 2025 Materna360®. Todos os direitos reservados.</p>
        <p>Proibida a reprodução total ou parcial sem autorização.</p>
      </footer>
    </main>
  )
}
