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

type Step = 'painel' | 'selos' | 'progresso'
type MissionId = 'autocuidado' | 'conexao' | 'apoio' | 'limite'

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
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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
  const keys: string[] = []
  for (let i = -6; i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

function getMonthKeys(anchor = new Date()) {
  const keys: string[] = []
  for (let i = -27; i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

function stepIndex(s: Step) {
  return s === 'painel' ? 1 : s === 'selos' ? 2 : 3
}

const LS = {
  pointsTotal: 'mj_points_total',
  dayPrefix: 'mj_day_',
  donePrefix: 'mj_done_',
  streak: 'mj_streak',
  streakLastDay: 'mj_streak_last_day',
}

const MISSION_IDS: MissionId[] = ['autocuidado', 'conexao', 'apoio', 'limite']

const BADGES: Badge[] = [
  { id: 'b-1', title: 'Primeiro passo', desc: 'Você começou. Isso já muda tudo.', icon: 'star', minPoints: 10 },
  { id: 'b-2', title: 'Dia possível', desc: 'Você fez o que cabia — e isso conta.', icon: 'sparkles', minPoints: 22 },
  { id: 'b-3', title: 'Presença real', desc: 'Você criou pequenos momentos de conexão.', icon: 'heart', minPoints: 40 },
  { id: 'b-4', title: 'Rotina mais leve', desc: 'Você ajustou o dia com decisões simples.', icon: 'sun', minPoints: 70 },
]

function readDayPoints(key: string) {
  return safeParseInt(safeGetLS(LS.dayPrefix + key), 0)
}

function readTotalPoints() {
  return safeParseInt(safeGetLS(LS.pointsTotal), 0)
}

function readStreak() {
  return safeParseInt(safeGetLS(LS.streak), 0)
}

function readDone(dayKey: string, missionId: MissionId) {
  return safeGetLS(`${LS.donePrefix}${dayKey}_${missionId}`) === '1'
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
        active
          ? 'bg-white/90 border-white/60 text-[#2f3a56]'
          : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export default function MinhaJornadaClient() {
  const [step, setStep] = useState<Step>('painel')
  const [today, setToday] = useState<string>(todayKey())
  const [totalPoints, setTotalPoints] = useState<number>(0)
  const [todayPoints, setTodayPoints] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [completedTodayCount, setCompletedTodayCount] = useState<number>(0)

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
    const doneCount = MISSION_IDS.filter(id => readDone(t, id)).length

    setTotalPoints(total)
    setTodayPoints(tPoints)
    setStreak(s)
    setCompletedTodayCount(doneCount)

    try {
      track('minha_jornada.open', { today: t, totalPoints: total })
    } catch {}
  }, [])

  const weekKeys = useMemo(() => getWeekKeys(new Date()), [])
  const monthKeys = useMemo(() => getMonthKeys(new Date()), [])

  const daysActive7 = useMemo(() => weekKeys.filter(k => readDayPoints(k) > 0).length, [weekKeys])
  const daysActive28 = useMemo(() => monthKeys.filter(k => readDayPoints(k) > 0).length, [monthKeys])

  const badgeUnlocked = useMemo(() => BADGES.filter(b => totalPoints >= b.minPoints), [totalPoints])
  const nextBadge = useMemo(() => BADGES.find(b => totalPoints < b.minPoints) ?? null, [totalPoints])

  const weeklyTotal = useMemo(() => weekKeys.reduce((acc, k) => acc + readDayPoints(k), 0), [weekKeys])

  const monthWeeks = useMemo(() => {
    const blocks: { label: string; total: number; activeDays: number }[] = []
    for (let w = 0; w < 4; w++) {
      const slice = monthKeys.slice(w * 7, w * 7 + 7)
      const total = slice.reduce((acc, k) => acc + readDayPoints(k), 0)
      const activeDays = slice.filter(k => readDayPoints(k) > 0).length
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

  const weeklyGoal = 120

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
                Um painel para enxergar progresso real: passos pequenos, consistência possível e selos que somam.
              </p>
            </div>
          </header>

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
              {/* Top bar */}
              <div className="p-4 md:p-6 border-b border-white/25">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
                      <AppIcon name="star" size={20} className="text-[#fd2597]" />
                    </div>

                    <div>
                      <div className="text-[12px] text-white/85">
                        Passo {stepIndex(step)}/3 • hoje: {completedTodayCount}/4 missões • sequência: {streak} dia(s)
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Sua jornada em visão clara
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        Missões agora ficam no Meu Dia. Aqui é leitura do que já aconteceu.
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/meu-dia"
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
                        track('minha_jornada.cta_meu_dia', { today })
                      } catch {}
                    }}
                  >
                    Abrir Meu Dia
                  </Link>
                </div>

                {/* Stepper */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <StepPill active={step === 'painel'} onClick={() => go('painel')} label="Painel" />
                  <StepPill active={step === 'selos'} onClick={() => go('selos')} label="Selos & medalhas" />
                  <StepPill active={step === 'progresso'} onClick={() => go('progresso')} label="Progresso mensal" />
                </div>
              </div>

              <div className="p-4 md:p-6">
                {/* PAINEL */}
                {step === 'painel' ? (
                  <div className="space-y-4">
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

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">hoje</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{todayPoints} pts</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">missões feitas: {completedTodayCount}/4</div>
                        </div>

                        <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">últimos 7 dias</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{weeklyTotal} pts</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">dias ativos: {daysActive7}/7</div>
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

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href="/meu-dia"
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Marcar missões no Meu Dia
                        </Link>
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

                {/* SELOS */}
                {step === 'selos' ? (
                  <div className="space-y-4">
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

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">liberados</div>
                          <div className="mt-3 space-y-3">
                            {badgeUnlocked.length === 0 ? (
                              <div className="text-[13px] text-[#6a6a6a]">
                                Ainda não tem selo liberado — marque uma missão no Meu Dia e o primeiro já aparece aqui.
                              </div>
                            ) : (
                              badgeUnlocked.map(b => (
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
                            <Link
                              href="/meu-dia"
                              className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                            >
                              Marcar missões no Meu Dia
                            </Link>
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

                {/* PROGRESSO MENSAL */}
                {step === 'progresso' ? (
                  <div className="space-y-4">
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

                      <div className="mt-4 space-y-3">
                        {monthWeeks.map(w => (
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
                          Semana “sobrevivência” não é falha. É dado. A próxima começa no próximo passo.
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <Link
                            href="/meu-dia"
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Marcar missão de hoje
                          </Link>
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
