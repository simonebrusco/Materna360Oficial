'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { ClientOnly } from '@/components/common/ClientOnly'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'
import QuickIdeaAI from '@/components/my-day/QuickIdeaAI'
import { readRecentMyDaySave, originLabel } from '@/app/lib/myDayContinuity.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Checkin = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'

const LS_KEYS = {
  myDayLastSignal: 'm360.my_day.last_signal.v1',
} as const

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

function isCheckin(v: unknown): v is Checkin {
  return v === 'leve' || v === 'cansada' || v === 'animada' || v === 'sobrecarregada'
}

function readCheckin(): Checkin | null {
  const v = safeGetLS(LS_KEYS.myDayLastSignal)
  return isCheckin(v) ? v : null
}

export default function Client() {
  const [checkin, setCheckin] = useState<Checkin | null>(null)

  // Sinal do Eu360 (ritmo/tom) – usado só para “densidade” e microcopy.
  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  const recentSave = useMemo(() => {
    try {
      return readRecentMyDaySave()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}

    setCheckin(readCheckin())
  }, [])

  function onPickCheckin(next: Checkin) {
    setCheckin(next)
    safeSetLS(LS_KEYS.myDayLastSignal, next)

    try {
      window.dispatchEvent(new CustomEvent('m360:myday-checkin-updated', { detail: { value: next } }))
    } catch {}

    try {
      track('cuidar_de_mim.checkin.select', { value: next })
    } catch {}
  }

  const toneLine =
    euSignal?.tone === 'direto'
      ? 'Escolha o que cabe. Um passo pequeno já muda o resto.'
      : 'Só um toque para eu te orientar melhor. Sem cobrança.'

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
                Cuidar de Mim
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Um espaço para se orientar, sem cobrança.
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            {/* CARD 1 — CENTRAL */}
            <Reveal>
              <SoftCard
                className="
                  p-5 md:p-6 rounded-3xl
                  bg-white/95
                  border border-[#f5d7e5]
                  shadow-[0_10px_28px_rgba(184,35,107,0.12)]
                "
              >
                <div className="space-y-3">
                  <div className="text-[18px] md:text-[20px] font-semibold text-[#2f3a56]">
                    Seu dia pode começar simples.
                  </div>

                  <p className="text-[13px] text-[#6a6a6a] leading-relaxed max-w-3xl">
                    Você não precisa organizar tudo agora. Ajuste o volume e escolha um caminho.
                  </p>

                  <div className="pt-1">
                    <div className="text-[12px] font-semibold text-[#2f3a56]">Como você está agora?</div>
                    <p className="text-[12px] text-[#6a6a6a] mt-1">{toneLine}</p>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['leve', 'cansada', 'animada', 'sobrecarregada'] as Checkin[]).map((v) => {
                        const active = checkin === v
                        return (
                          <button
                            key={v}
                            onClick={() => onPickCheckin(v)}
                            className={[
                              'rounded-full px-3.5 py-2 text-[12px] border transition text-left',
                              active
                                ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                                : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                            ].join(' ')}
                          >
                            {v}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/meu-dia"
                      className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition text-center"
                      onClick={() => {
                        try {
                          track('cuidar_de_mim.goto', { target: 'meu-dia' })
                        } catch {}
                      }}
                    >
                      Ir para Meu Dia
                    </Link>

                    <Link
                      href="/maternar/meu-filho"
                      className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition text-center"
                      onClick={() => {
                        try {
                          track('cuidar_de_mim.goto', { target: 'meu-filho' })
                        } catch {}
                      }}
                    >
                      Ir para Meu Filho
                    </Link>
                  </div>
                </div>
              </SoftCard>
            </Reveal>

            {/* CARD 2 — IDEIA (agora vive aqui) */}
            <Reveal>
              <div className="rounded-3xl bg-white/95 border border-[#f5d7e5] shadow-[0_10px_28px_rgba(184,35,107,0.10)] p-5 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] text-[#b8236b] font-semibold uppercase tracking-[0.18em]">
                      Para agora
                    </div>
                    <div className="mt-2 text-[18px] md:text-[20px] font-semibold text-[#2f3a56] leading-snug">
                      Me dá uma ideia simples para este momento
                    </div>
                    <p className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed max-w-3xl">
                      Sem perfeição. Uma sugestão pequena para destravar o próximo passo.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {/* Reuso direto do card que estava no Meu Dia */}
                  <QuickIdeaAI />
                </div>
              </div>
            </Reveal>

            {/* CARD 3 — SALVOS (fallback seguro com continuidade) */}
            <Reveal>
              <SoftCard
                className="
                  p-5 md:p-6 rounded-3xl
                  bg-white/95
                  border border-[#f5d7e5]
                  shadow-[0_10px_28px_rgba(184,35,107,0.08)]
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] text-[#b8236b] font-semibold uppercase tracking-[0.18em]">
                      Seus salvos
                    </div>
                    <div className="mt-2 text-[16px] md:text-[18px] font-semibold text-[#2f3a56] leading-snug">
                      O que você guardou para facilitar sua vida
                    </div>
                    <p className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed max-w-3xl">
                      Aqui aparecem coisas que você salvou no app. Pouco e útil.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] p-4">
                  {recentSave ? (
                    <div className="space-y-2">
                      <div className="text-[12px] text-[#6a6a6a]">
                        Último salvo recente
                      </div>
                      <div className="text-[14px] font-semibold text-[#2f3a56]">
                        {originLabel(recentSave.origin)} • {recentSave.source}
                      </div>
                      <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                        Dica: se você salvar algo no Meu Dia / Meu Filho / Cuidar de Mim, ele aparece aqui para você retomar sem pensar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[14px] font-semibold text-[#2f3a56]">
                        Ainda não tem nada salvo por aqui.
                      </div>
                      <p className="text-[12px] text-[#6a6a6a] leading-relaxed">
                        Quando você salvar uma ideia, rotina ou passo no app, ele aparece neste card para facilitar sua retomada.
                      </p>
                    </div>
                  )}
                </div>
              </SoftCard>
            </Reveal>

            <div className="mt-4">
              <LegalFooter />
            </div>
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
