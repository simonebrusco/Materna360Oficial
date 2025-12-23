'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { getJourneySnapshot, type JourneySnapshot } from '@/app/lib/journey.client'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'painel' | 'selos' | 'progresso'

function stepIndex(s: Step) {
  return s === 'painel' ? 1 : s === 'selos' ? 2 : 3
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
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

/**
 * P26 — Selos simples (baseado em contagem real)
 * Nada de pontos inventados; só progressão por consistência.
 */
type Badge = {
  id: string
  title: string
  desc: string
  icon: React.ComponentProps<typeof AppIcon>['name']
  minCount: number
}

const BADGES: Badge[] = [
  { id: 'b-1', title: 'Primeiro registro', desc: 'Você marcou presença. Isso já muda o dia.', icon: 'star', minCount: 1 },
  { id: 'b-2', title: 'Trilha possível', desc: 'Você voltou mais de uma vez. Consistência sem peso.', icon: 'sparkles', minCount: 3 },
  { id: 'b-3', title: 'Conexão real', desc: 'Você está criando rotina de presença sem perfeição.', icon: 'heart', minCount: 7 },
  { id: 'b-4', title: 'Base firme', desc: 'Você construiu um histórico. O Materna começa a “pegar”.', icon: 'sun', minCount: 14 },
]

function totalDoneCount(s: JourneySnapshot) {
  const selfcare = Number.isFinite(s.selfcare.count) ? s.selfcare.count : 0
  const family = Number.isFinite(s.family.count) ? s.family.count : 0
  return selfcare + family
}

export default function MinhaJornadaClient() {
  const [step, setStep] = useState<Step>('painel')
  const [snapshot, setSnapshot] = useState<JourneySnapshot>(() => ({
    selfcare: { doneToday: false, count: 0 },
    family: { doneToday: false, count: 0 },
  }))

  function refresh() {
    setSnapshot(getJourneySnapshot())
  }

  useEffect(() => {
    try {
      track('nav.view', { tab: 'maternar', page: 'minha-jornada', timestamp: new Date().toISOString() })
    } catch {}
  }, [])

  useEffect(() => {
    refresh()

    // Atualiza quando volta do Meu Dia / muda aba / etc.
    const onFocus = () => refresh()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    // Atualiza se houver mudanças em outra aba (best effort)
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return
      if (e.key.startsWith('journey/')) refresh()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const completedTodayCount = useMemo(() => {
    let n = 0
    if (snapshot.selfcare.doneToday) n += 1
    if (snapshot.family.doneToday) n += 1
    return n
  }, [snapshot])

  const totalCount = useMemo(() => totalDoneCount(snapshot), [snapshot])

  const badgeUnlocked = useMemo(() => BADGES.filter((b) => totalCount >= b.minCount), [totalCount])
  const nextBadge = useMemo(() => BADGES.find((b) => totalCount < b.minCount) ?? null, [totalCount])

  function go(next: Step) {
    setStep(next)
    try {
      track('minha_jornada.step', { step: next })
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
                Minha Jornada
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um painel para enxergar progresso real: registros pequenos, consistência possível e selos por presença.
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
                        Passo {stepIndex(step)}/3 • hoje: {completedTodayCount}/2 registros • total: {totalCount}
                      </div>
                      <div className="text-[16px] md:text-[18px] font-semibold text-white mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
                        Sua jornada em visão clara
                      </div>
                      <div className="text-[13px] text-white/85 mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]">
                        Aqui é leitura do que já foi registrado. As ações acontecem no Meu Dia.
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
                        track('minha_jornada.cta_meu_dia', { from: 'topbar' })
                      } catch {}
                    }}
                  >
                    Abrir Meu Dia
                  </Link>
                </div>

                {/* Stepper */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <StepPill active={step === 'painel'} onClick={() => go('painel')} label="Painel" />
                  <StepPill active={step === 'selos'} onClick={() => go('selos')} label="Selos" />
                  <StepPill active={step === 'progresso'} onClick={() => go('progresso')} label="Progresso" />
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
                          <AppIcon name="sparkles" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Painel da jornada
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Visão geral (sem cobrança)</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Você não precisa “fazer tudo”. Você só precisa enxergar o que foi possível.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">autocuidado</div>
                              <div className="mt-1 text-[13px] text-[#6a6a6a]">feito hoje:</div>
                              <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">
                                {snapshot.selfcare.doneToday ? 'Sim' : 'Ainda não'}
                              </div>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                              <AppIcon name="sun" size={18} className="text-[#fd2597]" />
                            </div>
                          </div>

                          <div className="mt-3 text-[12px] text-[#6a6a6a]">
                            total registrado: <span className="font-semibold text-[#2f3a56]">{snapshot.selfcare.count}</span>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">conexão</div>
                              <div className="mt-1 text-[13px] text-[#6a6a6a]">feito hoje:</div>
                              <div className="mt-1 text-[18px] font-semibold text-[#2f3a56]">
                                {snapshot.family.doneToday ? 'Sim' : 'Ainda não'}
                              </div>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-[#ffe1f1] flex items-center justify-center shrink-0">
                              <AppIcon name="heart" size={18} className="text-[#fd2597]" />
                            </div>
                          </div>

                          <div className="mt-3 text-[12px] text-[#6a6a6a]">
                            total registrado: <span className="font-semibold text-[#2f3a56]">{snapshot.family.count}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-white p-4">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">leitura rápida</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Hoje você registrou <span className="font-semibold text-[#2f3a56]">{completedTodayCount}</span> de 2 pilares.
                          Se for só 1, ainda assim conta. O Materna é sobre o possível.
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href="/meu-dia"
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Fazer no Meu Dia
                          </Link>

                          <button
                            onClick={() => {
                              refresh()
                              try {
                                track('minha_jornada.refresh', { reason: 'manual' })
                              } catch {}
                            }}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Atualizar
                          </button>

                          <button
                            onClick={() => go('selos')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ver selos
                          </button>
                        </div>
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
                          <AppIcon name="star" size={22} className="text-[#fd2597]" />
                        </div>
                        <div className="space-y-1">
                          <span className="inline-flex items-center rounded-full bg-[#ffe1f1] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#b8236b]">
                            Selos
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">Conquistas por presença</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                            Selos são um jeito de enxergar consistência. Sem “meta impossível”.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">liberados</div>
                          <div className="mt-3 space-y-3">
                            {badgeUnlocked.length === 0 ? (
                              <div className="text-[13px] text-[#6a6a6a]">
                                Ainda não tem selo liberado — registre uma ação (autocuidado ou conexão) e o primeiro aparece.
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
                                <ProgressBar value={totalCount} max={nextBadge.minCount} />
                              </div>

                              <div className="mt-3 text-[12px] text-[#6a6a6a]">
                                Falta{' '}
                                <span className="font-semibold text-[#2f3a56]">
                                  {Math.max(0, nextBadge.minCount - totalCount)}
                                </span>{' '}
                                registro(s).
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 text-[13px] text-[#6a6a6a]">
                              Você liberou todos os selos atuais. Depois a gente expande.
                            </div>
                          )}

                          <div className="mt-5 flex flex-wrap gap-2">
                            <Link
                              href="/meu-dia"
                              className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                            >
                              Registrar no Meu Dia
                            </Link>
                            <button
                              onClick={() => go('painel')}
                              className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                            >
                              Voltar ao painel
                            </button>
                          </div>
                        </div>
                      </div>
                    </SoftCard>
                  </div>
                ) : null}

                {/* PROGRESSO */}
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
                            Progresso
                          </span>
                          <h2 className="text-lg font-semibold text-[#2f3a56]">O que já existe hoje</h2>
                          <p className="text-[13px] text-[#6a6a6a]">
                           Na P26 nós registramos “feito hoje” + contagem total. Histórico por dia (calendário de presença) entra numa fase seguinte.

                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">total registros</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{totalCount}</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">autocuidado + conexão</div>
                        </div>

                        <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">autocuidado</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{snapshot.selfcare.count}</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">
                            hoje: {snapshot.selfcare.doneToday ? 'feito' : '—'}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-[#f5d7e5] bg-white p-4">
                          <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">conexão</div>
                          <div className="mt-1 text-[22px] font-semibold text-[#2f3a56]">{snapshot.family.count}</div>
                          <div className="mt-1 text-[12px] text-[#6a6a6a]">
                            hoje: {snapshot.family.doneToday ? 'feito' : '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-5">
                        <div className="text-[11px] font-semibold tracking-wide text-[#b8236b] uppercase">próximo upgrade</div>
                        <div className="mt-2 text-[13px] text-[#6a6a6a] leading-relaxed">
                          Quando a gente quiser “mês/semana/calendário de presença”, vamos precisar persistir um histórico por dia (sem pesar o app).
                          Por agora, P26 fecha com o essencial: registro simples e leitura clara.
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <Link
                            href="/meu-dia"
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Registrar algo hoje
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
