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

const LS = {
  pointsTotal: 'mj_points_total',
  dayPrefix: 'mj_day_',
  // P26: streak removido (anti-culpa). Mantemos o app funcional sem mecânica de sequência.
}

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

type View = 'selos' | 'resumo'

function ViewPill({
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

function BadgeCard({
  badge,
  unlocked,
  currentPoints,
}: {
  badge: Badge
  unlocked: boolean
  currentPoints: number
}) {
  const left = Math.max(0, badge.minPoints - currentPoints)

  return (
    <div
      className={[
        'rounded-3xl border p-4 shadow-[0_6px_18px_rgba(184,35,107,0.08)] transition',
        unlocked ? 'bg-white border-[#f5d7e5]' : 'bg-[#fff7fb] border-[#f5d7e5]',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            'h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border',
            unlocked ? 'bg-[#ffe1f1] border-[#f5d7e5]' : 'bg-white border-[#f5d7e5]',
          ].join(' ')}
        >
          <AppIcon name={badge.icon} size={18} className="text-[#fd2597]" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-semibold text-[#2f3a56]">{badge.title}</div>
            <span
              className={[
                'rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                unlocked
                  ? 'bg-[#ffd8e6] text-[#b8236b] border-[#f5d7e5]'
                  : 'bg-white text-[#6a6a6a] border-[#f5d7e5]',
              ].join(' ')}
            >
              {unlocked ? 'Liberado' : `Faltam ${left} pts`}
            </span>
          </div>

          <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">
            {badge.desc}
          </div>

          <div className="mt-3 text-[11px] text-[#6a6a6a]">
            Marco: <span className="font-semibold text-[#2f3a56]">{badge.minPoints} pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MinhasConquistasClient() {
  const [view, setView] = useState<View>('selos')
  const [today, setToday] = useState<string>(todayKey())
  const [totalPoints, setTotalPoints] = useState<number>(0)
  const [todayPoints, setTodayPoints] = useState<number>(0)

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'minhas-conquistas', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    const t = todayKey()
    setToday(t)

    const total = readTotalPoints()
    const tPoints = readDayPoints(t)

    setTotalPoints(total)
    setTodayPoints(tPoints)

    try {
      track('minhas_conquistas.open', { today: t, totalPoints: total })
    } catch {}
  }, [])

  const weekKeys = useMemo(() => getWeekKeys(new Date()), [])
  const monthKeys = useMemo(() => getMonthKeys(new Date()), [])

  const daysActive7 = useMemo(() => weekKeys.filter(k => readDayPoints(k) > 0).length, [weekKeys])
  const daysActive28 = useMemo(() => monthKeys.filter(k => readDayPoints(k) > 0).length, [monthKeys])
  const weeklyTotal = useMemo(() => weekKeys.reduce((acc, k) => acc + readDayPoints(k), 0), [weekKeys])

  const unlocked = useMemo(() => BADGES.filter(b => totalPoints >= b.minPoints), [totalPoints])
  const locked = useMemo(() => BADGES.filter(b => totalPoints < b.minPoints), [totalPoints])
  const nextBadge = useMemo(() => locked[0] ?? null, [locked])

  const weeklyGoal = 120
  const todayGoal = 26

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
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
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
                Conquistas & Selos
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Uma vitrine leve do que você está construindo — sem vitrine de perfeição.
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
              <div className="p-4 md:p-6 border-b border-white/25">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/80 flex items-center justify-center shrink-0">
                      <AppIcon name="heart" size={20} className="text-[#fd2597]" />
                    </div>

                    <div>
                      <div className="text-[12px] text-white/85">
                        hoje: {todayPoints} pts • total: {totalPoints} pts
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Seus marcos, do seu jeito
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        Você libera conforme vive. Sem “tudo ou nada”.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/maternar/minha-jornada"
                      className="
                        rounded-full
                        bg-white/90 hover:bg-white
                        text-[#2f3a56]
                        px-4 py-2 text-[12px]
                        shadow-lg transition
                        text-center
                      "
                    >
                      Minha Jornada
                    </Link>

                    <Link
                      href="/meu-dia"
                      className="
                        rounded-full
                        bg-white/15 hover:bg-white/25
                        text-white
                        px-4 py-2 text-[12px]
                        border border-white/35
                        transition
                        text-center
                      "
                    >
                      Meu Dia
                    </Link>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ViewPill active={view === 'selos'} onClick={() => setView('selos')} label="Selos" />
                  <ViewPill active={view === 'resumo'} onClick={() => setView('resumo')} label="Resumo" />
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-4">
                {view === 'selos' ? (
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
                          Selos
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          Coleção de conquistas possíveis
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Liberados primeiro. Depois, os próximos.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                            próximo marco
                          </div>
                          {nextBadge ? (
                            <div className="mt-2">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white border border-[#f5d7e5] flex items-center justify-center shrink-0">
                                  <AppIcon name={nextBadge.icon} size={18} className="text-[#fd2597]" />
                                </div>
                                <div>
                                  <div className="text-[14px] font-semibold text-[#2f3a56]">
                                    {nextBadge.title}
                                  </div>
                                  <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">
                                    {nextBadge.desc}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4">
                                <ProgressBar value={totalPoints} max={nextBadge.minPoints} />
                              </div>
                              <div className="mt-2 text-[12px] text-[#6a6a6a]">
                                Falta{' '}
                                <span className="font-semibold text-[#2f3a56]">
                                  {Math.max(0, nextBadge.minPoints - totalPoints)} pts
                                </span>
                                .
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-[13px] text-[#6a6a6a]">
                              Você liberou todos os marcos atuais.
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setView('resumo')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ver resumo
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {unlocked.map(b => (
                        <BadgeCard key={b.id} badge={b} unlocked currentPoints={totalPoints} />
                      ))}
                      {locked.map(b => (
                        <BadgeCard key={b.id} badge={b} unlocked={false} currentPoints={totalPoints} />
                      ))}
                    </div>
                  </SoftCard>
                ) : null}

                {view === 'resumo' ? (
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
                          Resumo
                        </span>
                        <h2 className="text-lg font-semibold text-[#2f3a56]">
                          O que sua presença já mostra
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Sem comparação. Só leitura gentil.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">hoje</div>
                        <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{todayPoints} pts</div>
                        <div className="mt-3">
                          <ProgressBar value={todayPoints} max={todayGoal} />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">últimos 7 dias</div>
                        <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{weeklyTotal} pts</div>
                        <div className="mt-1 text-[12px] text-[#6a6a6a]">dias com presença: {daysActive7}/7</div>
                        <div className="mt-3">
                          <ProgressBar value={weeklyTotal} max={weeklyGoal} />
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">28 dias</div>
                        <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{daysActive28} dias</div>
                        <div className="mt-1 text-[12px] text-[#6a6a6a]">dias com presença: {daysActive28}/28</div>

                        <div className="mt-3 rounded-2xl bg-[#ffe1f1] p-3 border border-[#f5d7e5]">
                          <div className="text-[12px] font-semibold text-[#2f3a56]">Selos liberados</div>
                          <div className="text-[12px] text-[#6a6a6a]">{unlocked.length}/{BADGES.length}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">nota de cuidado</div>
                      <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                        Se você está em fase difícil, o app não deveria virar mais um lugar de cobrança.
                        Seu progresso é o que coube — e isso é progresso.
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setView('selos')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Voltar aos selos
                        </button>

                        <Link
                          href="/maternar/minha-jornada"
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ir para Minha Jornada
                        </Link>
                      </div>
                    </div>
                  </SoftCard>
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
