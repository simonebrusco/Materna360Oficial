// app/(tabs)/maternar/minha-jornada/Client.tsx
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

/**
 * P26 — PRINCÍPIO DA JORNADA (ANTI-CULPA)
 *
 * A Jornada é acompanhamento silencioso, não produtividade.
 * Regras inegociáveis:
 * - A Jornada registra apenas o que ACONTECEU (conclusões/salvamentos/ações).
 * - Ausência não é registrada como “falha”.
 * - Não existe “dias perdidos”, “streak quebrado” ou qualquer penalidade.
 * - Repetição conta como continuidade (não como insistência / cobrança).
 *
 * Se uma mudança futura introduzir sensação de cobrança,
 * ela viola diretamente a P26 e deve ser revertida.
 */

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

function getRangeKeys(daysBack: number, anchor = new Date()) {
  const keys: string[] = []
  for (let i = -Math.max(0, daysBack - 1); i <= 0; i++) keys.push(addDaysKey(anchor, i))
  return keys
}

/**
 * Chaves atuais usadas no Maternar (sem backend).
 * Mantemos compatível com o que já existe no app.
 */
const LS = {
  pointsTotal: 'mj_points_total',
  dayPrefix: 'mj_day_',
  // OBS: mesmo que exista 'mj_streak' no storage/histórico,
  // a Jornada P26 NÃO deve depender disso como métrica central.
  streak: 'mj_streak',
}

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
        {/* COR OFICIAL (primária viva): #fd2597 */}
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

type View = 'hoje' | 'resumo'

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
        // Foco padronizado na paleta oficial (#fd2597)
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fd2597]/30 focus-visible:ring-offset-0',
        active
          ? 'bg-white/90 border-white/60 text-[#2f3a56]'
          : 'bg-white/20 border-white/35 text-white/90 hover:bg-white/30',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

/**
 * Microtexto “IA” (local, leve, sem recomendação, sem cobrança).
 * Regra: espelhar + contextualizar presença. Nunca avaliar, nunca sugerir constância.
 */
function buildMinhaJornadaMicrotext(args: {
  view: View
  todayPoints: number
  totalPoints: number
  daysActive7: number
  daysActive28: number
  weeklyTotal: number
  monthlyTotal: number
}) {
  const { view, todayPoints, totalPoints, daysActive7, daysActive28, weeklyTotal, monthlyTotal } = args

  const top =
    todayPoints > 0
      ? 'Hoje já tem um registro. Isso é presença — mesmo que tenha sido pequeno.'
      : 'Se hoje ficou em silêncio, tudo bem. A Jornada reconhece o que coube (inclusive pausa).'

  const hoje =
    todayPoints > 0
      ? 'O que apareceu hoje já vira parte do seu registro — sem precisar “render”.'
      : 'Quando não dá, não vira falha. O registro não cobra nada de você.'

  const resumo =
    totalPoints > 0 || monthlyTotal > 0 || weeklyTotal > 0 || daysActive28 > 0
      ? 'Isso não é desempenho: é um retrato do que existiu quando você esteve aqui.'
      : 'Ainda não há registros no período — e isso não diz nada sobre você. Só diz que não coube ainda.'

  const cuidado =
    daysActive7 === 0 && daysActive28 > 0
      ? 'Às vezes a presença aparece em outros ritmos. O app não transforma intervalo em dívida.'
      : daysActive28 === 0
        ? 'Você pode ficar fora pelo tempo que precisar. Voltar, quando fizer sentido, já basta.'
        : 'A Jornada respeita seu ritmo. Ela registra quando acontece — e só.'

  if (view === 'hoje') {
    return { top, section: hoje, closing: cuidado }
  }

  return { top, section: resumo, closing: cuidado }
}

export default function MinhaJornadaClient() {
  const [view, setView] = useState<View>('hoje')

  const [today, setToday] = useState<string>(todayKey())
  const [totalPoints, setTotalPoints] = useState<number>(0)
  const [todayPoints, setTodayPoints] = useState<number>(0)

  useEffect(() => {
    try {
      track('nav.view', {
        tab: 'maternar',
        page: 'minha-jornada',
        timestamp: new Date().toISOString(),
      })
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
      track('minha_jornada.open', { today: t, totalPoints: total, todayPoints: tPoints })
    } catch {}
  }, [])

  const weekKeys = useMemo(() => getRangeKeys(7, new Date()), [])
  const monthKeys = useMemo(() => getRangeKeys(28, new Date()), [])

  const daysActive7 = useMemo(() => weekKeys.filter(k => readDayPoints(k) > 0).length, [weekKeys])
  const daysActive28 = useMemo(() => monthKeys.filter(k => readDayPoints(k) > 0).length, [monthKeys])

  const weeklyTotal = useMemo(() => weekKeys.reduce((acc, k) => acc + readDayPoints(k), 0), [weekKeys])
  const monthlyTotal = useMemo(() => monthKeys.reduce((acc, k) => acc + readDayPoints(k), 0), [monthKeys])

  // metas “internas” (não viram cobrança; só referência visual)
  const todaySoftMax = 26
  const weekSoftMax = 120

  const presenceLabel =
    daysActive28 === 0
      ? 'Você pode voltar quando fizer sentido.'
      : daysActive28 === 1
        ? 'Você esteve aqui 1 dia nas últimas 4 semanas.'
        : `Você esteve aqui ${daysActive28} dias nas últimas 4 semanas.`

  const micro = useMemo(
    () =>
      buildMinhaJornadaMicrotext({
        view,
        todayPoints,
        totalPoints,
        daysActive7,
        daysActive28,
        weeklyTotal,
        monthlyTotal,
      }),
    [view, todayPoints, totalPoints, daysActive7, daysActive28, weeklyTotal, monthlyTotal]
  )

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
                Um registro silencioso do que aconteceu — sem cobrança, sem “tudo ou nada”.
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
                      <AppIcon name="sparkles" size={20} className="text-[#fd2597]" />
                    </div>

                    <div>
                      <div className="text-[12px] text-white/85">
                        hoje: {todayPoints} pts • total: {totalPoints} pts • {presenceLabel}
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        O que coube hoje já conta
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        A Jornada não mede desempenho. Ela apenas registra presença quando ela acontece.
                      </div>

                      {/* Microtexto (IA) — 1–2 frases, sem CTA */}
                      <div className="text-[12px] text-white/80 mt-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.18)]">
                        {micro.top}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/maternar/minhas-conquistas"
                      className="
                        rounded-full
                        bg-white/90 hover:bg-white
                        text-[#2f3a56]
                        px-4 py-2 text-[12px]
                        shadow-lg transition
                        text-center
                      "
                    >
                      Conquistas & Selos
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

                {/* Mini menu */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <ViewPill active={view === 'hoje'} onClick={() => setView('hoje')} label="Hoje" />
                  <ViewPill active={view === 'resumo'} onClick={() => setView('resumo')} label="Resumo" />
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-4 md:p-6 space-y-4">
                {/* HOJE */}
                {view === 'hoje' ? (
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
                          Hoje
                        </span>

                        <h2 className="text-lg font-semibold text-[#2f3a56]">Registro do dia</h2>

                        <p className="text-[13px] text-[#6a6a6a]">
                          Aqui fica só o que foi feito/salvo/concluído. Se hoje foi “zero”, está tudo bem.
                        </p>

                        {/* Microtexto (IA) — 1 frase */}
                        <p className="text-[12px] text-[#6a6a6a]">{micro.section}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                          feito hoje
                        </div>
                        <div className="mt-2 text-[26px] font-semibold text-[#2f3a56]">{todayPoints} pts</div>

                        <div className="mt-4">
                          <ProgressBar value={todayPoints} max={todaySoftMax} />
                        </div>

                        <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">
                          Referência visual gentil — não é meta. Se não coube, não vira dívida.
                        </div>
                      </div>

                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                          presença recente
                        </div>

                        <div className="mt-2 text-[14px] font-semibold text-[#2f3a56]">Últimos 7 dias</div>
                        <div className="mt-1 text-[12px] text-[#6a6a6a]">dias com registro: {daysActive7}/7</div>

                        <div className="mt-4">
                          <div className="text-[11px] text-[#6a6a6a]">pontos na semana</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{weeklyTotal} pts</div>
                          <div className="mt-3">
                            <ProgressBar value={weeklyTotal} max={weekSoftMax} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        fechamento leve
                      </div>
                      <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                        O que você fez hoje já está registrado. Se você parar por aqui, está tudo completo.
                      </div>

                      {/* Microtexto (IA) — 1 frase */}
                      <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">{micro.closing}</div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href="/maternar"
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Voltar para o Maternar
                        </Link>
                        <Link
                          href="/meu-dia"
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ir para Meu Dia
                        </Link>
                      </div>
                    </div>
                  </SoftCard>
                ) : null}

                {/* RESUMO */}
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

                        <h2 className="text-lg font-semibold text-[#2f3a56]">Leitura de continuidade</h2>

                        <p className="text-[13px] text-[#6a6a6a]">
                          Sem “dias perdidos”. Sem punição. Só um retrato leve do que aconteceu quando você esteve aqui.
                        </p>

                        {/* Microtexto (IA) — 1 frase */}
                        <p className="text-[12px] text-[#6a6a6a]">{micro.section}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">total</div>
                        <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{totalPoints} pts</div>
                        <div className="mt-1 text-[12px] text-[#6a6a6a]">somatório do que foi registrado</div>
                      </div>

                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                          últimos 7 dias
                        </div>
                        <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{weeklyTotal} pts</div>
                        <div className="mt-1 text-[12px] text-[#6a6a6a]">dias com registro: {daysActive7}/7</div>
                      </div>

                      <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">28 dias</div>
                        <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{daysActive28} dias</div>
                        <div className="mt-1 text-[12px] text-[#6a6a6a]">pontos no período: {monthlyTotal} pts</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                      <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">
                        nota de cuidado
                      </div>
                      <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                        Se você está numa fase difícil, o app não deveria virar mais um lugar de cobrança. A Jornada
                        respeita silêncio e pausa. Voltar já é suficiente.
                      </div>

                      {/* Microtexto (IA) — 1 frase */}
                      <div className="mt-2 text-[12px] text-[#6a6a6a] leading-relaxed">{micro.closing}</div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setView('hoje')}
                          className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                        >
                          Ver hoje
                        </button>

                        <Link
                          href="/maternar/minhas-conquistas"
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ir para Conquistas & Selos
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
