'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { ClientOnly } from '@/components/common/ClientOnly'
import { track } from '@/app/lib/telemetry'

import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'
import { markRecentMyDaySave } from '@/app/lib/myDayContinuity.client'
import { getEu360Signal } from '@/app/lib/eu360Signals.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Ritmo = 'leve' | 'cansada' | 'confusa' | 'ok'
type FocusMode = '1min' | '3min' | '5min'

const LS_KEYS = {
  eu360FocusTime: 'eu360_focus_time',
  eu360Ritmo: 'eu360_ritmo',
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

function inferFocus(): FocusMode {
  const raw = safeGetLS(LS_KEYS.eu360FocusTime)
  return raw === '1min' || raw === '3min' || raw === '5min' ? raw : '3min'
}

function inferRitmo(): Ritmo {
  const raw = safeGetLS(LS_KEYS.eu360Ritmo)
  // compat: se antes você salvava leve/cansada/animada/sobrecarregada, cai em “cansada/ok”
  if (raw === 'leve') return 'leve'
  if (raw === 'cansada') return 'cansada'
  if (raw === 'confusa') return 'confusa'
  if (raw === 'ok') return 'ok'
  if (raw === 'sobrecarregada') return 'cansada'
  if (raw === 'animada') return 'ok'
  return 'cansada'
}

function setRitmoLS(r: Ritmo) {
  safeSetLS(LS_KEYS.eu360Ritmo, r)
}

function setFocusLS(f: FocusMode) {
  safeSetLS(LS_KEYS.eu360FocusTime, f)
}

function pickOrientation(tone: 'gentil' | 'direto', ritmo: Ritmo) {
  // “orientação adulta”, sem consolo/autoajuda.
  if (tone === 'direto') {
    if (ritmo === 'confusa') return 'Escolha só um próximo passo real. O resto pode esperar.'
    if (ritmo === 'cansada') return 'Hoje é dia de manter o básico. Sem decidir tudo agora.'
    if (ritmo === 'leve') return 'Siga leve. Não invente complexidade.'
    return 'Seu dia não precisa render para valer.'
  }

  // gentil
  if (ritmo === 'confusa') return 'Agora é um bom momento para simplificar. Um passo já ajuda.'
  if (ritmo === 'cansada') return 'Um passo simples já é suficiente hoje.'
  if (ritmo === 'leve') return 'Vamos manter leve. Só o que fizer sentido.'
  return 'Você pode seguir sem se cobrar.'
}

function microCareSuggestion(focus: FocusMode) {
  // micro cuidado opcional — sempre 1 linha + ação simples.
  if (focus === '1min') return 'Se fizer sentido agora: 3 goles d’água e 1 respiração lenta.'
  if (focus === '3min') return 'Se fizer sentido agora: água + ombros para baixo (3x).'
  return 'Se fizer sentido agora: 2 minutos de pausa real, sem tela.'
}

export default function Client() {
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [focus, setFocus] = useState<FocusMode>('3min')
  const [saveFeedback, setSaveFeedback] = useState<string>('')

  // “seu dia do jeito que está” (versão v1: leve e estável; sem depender de novos dados)
  // depois podemos conectar em contagens reais (salvos/compromissos) sem mudar UI.
  const daySummary = useMemo(() => {
    return ['Você pode começar pequeno', 'Um próximo passo basta', 'O resto pode ficar para depois']
  }, [])

  useEffect(() => {
    try {
      track('nav.view', { page: 'cuidar-de-mim', timestamp: new Date().toISOString() })
    } catch {}

    // inferências iniciais
    const f = inferFocus()
    const r = inferRitmo()
    setFocus(f)
    setRitmo(r)

    try {
      track('cuidar_de_mim.open', { focus: f, ritmo: r })
    } catch {}
  }, [])

  const euSignal = useMemo(() => {
    try {
      return getEu360Signal()
    } catch {
      return { tone: 'gentil' as const, listLimit: 5, showLessLine: false }
    }
  }, [])

  const orientation = useMemo(() => {
    const tone = (euSignal?.tone ?? 'gentil') as 'gentil' | 'direto'
    return pickOrientation(tone, ritmo)
  }, [euSignal?.tone, ritmo])

  const micro = useMemo(() => microCareSuggestion(focus), [focus])

  function onPickRitmo(next: Ritmo) {
    setRitmo(next)
    setRitmoLS(next)

    try {
      track('cuidar_de_mim.checkin.select', { ritmo: next })
    } catch {}
  }

  function onPickFocus(next: FocusMode) {
    setFocus(next)
    setFocusLS(next)
    try {
      track('cuidar_de_mim.focus.select', { focus: next })
    } catch {}
  }

  function saveToMyDay(title: string) {
    const origin = 'selfcare' as const

    const res = addTaskToMyDay({
      title,
      origin,
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    // continuidade: abre o Meu Dia no grupo certo após save (silencioso)
    try {
      markRecentMyDaySave({
        origin,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}

    if (res.created) setSaveFeedback('Salvo no Meu Dia.')
    else setSaveFeedback('Isso já estava no Meu Dia.')

    try {
      track('cuidar_de_mim.save_to_my_day', {
        origin,
        created: res.created,
        dateKey: res.dateKey,
        source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
      })
    } catch {}

    window.setTimeout(() => setSaveFeedback(''), 2200)
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="relative min-h-[100dvh] pb-24 overflow-hidden"
    >
      <ClientOnly>
        <div className="page-shell relative z-10">
          {/* HEADER (mantém sofisticado, sem exagero de cards) */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <Link href="/maternar" className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition">
              <span className="mr-1.5 text-lg leading-none">←</span>
              Voltar para o Maternar
            </Link>

            <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold text-white leading-tight">Cuidar de Mim</h1>

            <p className="mt-1 text-sm md:text-base text-white/90 max-w-2xl">
              Um espaço para pausar, entender o dia como ele está e seguir com mais clareza.
            </p>
          </header>

          {/* HUB CONTAINER (padrão Meu Filho) */}
          <section className="hub-shell">
            <div className="hub-shell-inner">
              {saveFeedback ? (
                <div className="mb-5 rounded-2xl bg-[#fff7fb] border border-[#f5d7e5] px-4 py-3 text-[12px] text-[#2f3a56]">
                  {saveFeedback}
                </div>
              ) : null}

              {/* BLOCO 1 — CHECK-IN */}
              <div>
                <div className="hub-eyebrow">CHECK-IN</div>
                <div className="hub-title">Como você está agora?</div>
                <div className="hub-subtitle">Só um toque para eu te orientar melhor. Sem cobrança.</div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(['leve', 'cansada', 'confusa', 'ok'] as Ritmo[]).map((r) => {
                    const active = ritmo === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onPickRitmo(r)}
                        className={[
                          'rounded-full px-4 py-2 text-[12px] border transition',
                          active
                            ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                            : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>

                {/* foco (baixo ruído; opcional) */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[12px] text-[#6a6a6a]">Quanto tempo cabe agora?</span>
                  {(['1min', '3min', '5min'] as FocusMode[]).map((f) => {
                    const active = focus === f
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => onPickFocus(f)}
                        className={[
                          'rounded-full px-3.5 py-2 text-[12px] border transition',
                          active
                            ? 'bg-[#ffd8e6] border-[#f5d7e5] text-[#2f3a56]'
                            : 'bg-white border-[#f5d7e5] text-[#6a6a6a] hover:bg-[#ffe1f1]',
                        ].join(' ')}
                      >
                        {f}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="hub-divider" />

              {/* BLOCO 3 — ORIENTAÇÃO DO DIA (núcleo) */}
              <div>
                <div className="hub-eyebrow">ORIENTAÇÃO</div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#ffd8e6] border border-[#f5d7e5] flex items-center justify-center shrink-0">
                    <AppIcon name="info" size={18} className="text-[#b8236b]" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-[16px] md:text-[18px] font-semibold text-[#2f3a56] leading-snug">
                      {orientation}
                    </div>
                    <div className="mt-1 text-[12px] md:text-[13px] text-[#6a6a6a] leading-relaxed">
                      Seu dia não precisa “fechar”. Ele só precisa ficar mais simples por dentro.
                    </div>
                  </div>
                </div>
              </div>

              <div className="hub-divider" />

              {/* BLOCO 2 — SEU DIA, DO JEITO QUE ESTÁ (integração leve) */}
              <div>
                <div className="hub-eyebrow">SEU DIA</div>
                <div className="hub-title">Do jeito que está</div>
                <div className="hub-subtitle">Sem listas longas. Só um retrato leve para tirar da cabeça.</div>

                <ul className="mt-4 space-y-2 text-[13px] text-[#545454]">
                  {daySummary.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#b8236b]" />
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-col sm:flex-row gap-2">
                  <Link href="/meu-dia" className="btn-primary inline-flex items-center justify-center">
                    Ir para Meu Dia
                  </Link>
                  <Link href="/maternar/meu-filho" className="btn-secondary inline-flex items-center justify-center">
                    Ir para Meu Filho
                  </Link>
                </div>
              </div>

              <div className="hub-divider" />

              {/* BLOCO 4 — MICRO CUIDADO OPCIONAL */}
              <div>
                <div className="hub-eyebrow">MICRO CUIDADO</div>
                <div className="hub-title">Opcional</div>
                <div className="hub-subtitle">{micro}</div>

                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button type="button" onClick={() => saveToMyDay(micro)} className="btn-primary">
                    Salvar no Meu Dia
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // só gira entre 1/3/5 sem criar “tarefa”, para variar a sugestão
                      const next: FocusMode = focus === '1min' ? '3min' : focus === '3min' ? '5min' : '1min'
                      onPickFocus(next)
                      try {
                        track('cuidar_de_mim.micro.swap', { from: focus, to: next, ritmo })
                      } catch {}
                    }}
                    className="btn-secondary"
                  >
                    Me dá outra opção
                  </button>
                </div>

                {euSignal?.showLessLine ? (
                  <div className="mt-4 text-[12px] text-[#6a6a6a]">
                    Hoje pode ser menos. E ainda assim contar.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="mt-6">
            <LegalFooter />
          </div>

          <div className="PageSafeBottom" />
        </div>
      </ClientOnly>
    </main>
  )
}
