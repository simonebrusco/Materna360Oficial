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
  micro?: string
  aux?: string
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
  {
    id: 'b-1',
    title: 'Primeiro passo',
    desc: 'Você começou. O que vem depois depende de repetir — mesmo que aos poucos.',
    aux: 'Esse marco ganha força quando o começo deixa de ser exceção.',
    micro: 'Não é sobre pressa. É sobre continuidade possível.',
    icon: 'star',
    minPoints: 10,
  },
  {
    id: 'b-2',
    title: 'Dia possível',
    desc: 'Você fez o que cabia. Isso sustenta o caminho quando o dia não permite mais.',
    aux: 'Reconhece escolhas feitas mesmo em dias cheios.',
    micro: '',
    icon: 'sparkles',
    minPoints: 22,
  },
  {
    id: 'b-3',
    title: 'Presença real',
    desc: 'Presença não é quantidade. Ela aparece quando você escolhe estar — mesmo em pequenos momentos.',
    aux: 'Esse marco se constrói quando a presença deixa de ser exceção.',
    micro: 'Pequenos gestos repetidos mudam a experiência.',
    icon: 'heart',
    minPoints: 40,
  },
  {
    id: 'b-4',
    title: 'Rotina mais leve',
    desc: 'Leveza não surge do acaso. Ela vem de decisões conscientes no meio do dia.',
    aux: 'Esse marco aparece quando você ajusta o ritmo com intenção.',
    micro: 'Menos peso também é uma escolha ativa.',
    icon: 'sun',
    minPoints: 70,
  },
]

function readDayPoints(key: string) {
  return safeParseInt(safeGetLS(LS.dayPrefix + key), 0)
}

function readTotalPoints() {
  return safeParseInt(safeGetLS(LS.pointsTotal), 0)
}

function NeutralBar() {
  return (
    <div className="w-full">
      <div className="h-2.5 rounded-full bg-[#ffe1f1] overflow-hidden border border-[#f5d7e5]">
        <div className="h-full bg-[#fd2597] rounded-full" style={{ width: '100%' }} />
      </div>
      <div className="mt-2 text-[11px] text-[#6a6a6a]">
        Continuidade possível dá forma ao caminho.
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
}: {
  badge: Badge
  unlocked: boolean
}) {
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
              {unlocked ? 'Reconhecido' : 'Em construção'}
            </span>
          </div>

          <div className="mt-1 text-[12px] text-[#6a6a6a] leading-relaxed">
            {badge.desc}
          </div>

          {badge.aux ? (
            <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">
              {badge.aux}
            </div>
          ) : null}

          {badge.micro ? (
            <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">
              {badge.micro}
            </div>
          ) : null}
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

  // Mantemos leitura interna (para lógica de selos), mas sem expor métrica como performance na UI.
  const daysActive7 = useMemo(() => weekKeys.filter(k => readDayPoints(k) > 0).length, [weekKeys])
  const daysActive28 = useMemo(() => monthKeys.filter(k => readDayPoints(k) > 0).length, [monthKeys])
  const weeklyTotal = useMemo(() => weekKeys.reduce((acc, k) => acc + readDayPoints(k), 0), [weekKeys])

  const unlocked = useMemo(() => BADGES.filter(b => totalPoints >= b.minPoints), [totalPoints])
  const locked = useMemo(() => BADGES.filter(b => totalPoints < b.minPoints), [totalPoints])
  const nextBadge = useMemo(() => locked[0] ?? null, [locked])

  // Evita lint de variáveis “não usadas” caso build esteja estrito em algum momento
  void today
  void daysActive7
  void daysActive28
  void weeklyTotal
  void todayPoints

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
                        Seu caminho registrado aqui
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Seus marcos, do seu jeito
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        Você constrói com presença. Sem “tudo ou nada”.
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
                          Marcos que se constroem com o tempo
                        </h2>
                        <p className="text-[13px] text-[#6a6a6a]">
                          Eles não aparecem por pressa — aparecem por continuidade.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                            um marco em construção
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
                                  {nextBadge.aux ? (
                                    <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">
                                      {nextBadge.aux}
                                    </div>
                                  ) : null}
                                </div>
                              </div>

                              <div className="mt-4">
                                <NeutralBar />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-[13px] text-[#6a6a6a]">
                              Você já atravessou os marcos atuais. O resto vem com o tempo — sem pressa.
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
                        <BadgeCard key={b.id} badge={b} unlocked />
                      ))}
                      {locked.map(b => (
                        <BadgeCard key={b.id} badge={b} unlocked={false} />
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
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Hoje foi vivido do jeito que deu.
                          <br />
                          Nem todo dia deixa marca visível — e tudo bem.
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">últimos 7 dias</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          A presença não se mede só em registros.
                          <br />
                          O que sustentou você também conta.
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">28 dias</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Este período já faz parte da sua história aqui.
                          <br />
                          Alguns ciclos são mais silenciosos — e ainda assim válidos.
                        </div>

                        <div className="mt-3 rounded-2xl bg-[#ffe1f1] p-3 border border-[#f5d7e5]">
                          <div className="text-[12px] font-semibold text-[#2f3a56]">Selos liberados</div>
                          <div className="text-[12px] text-[#6a6a6a]">
                            Alguns marcos já estão reconhecidos — outros ainda estão se construindo.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">nota de cuidado</div>
                      <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                        Se você está em fase difícil, o app não deveria virar mais um lugar de cobrança.
                        O que foi possível já conta — e conta de verdade.
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
