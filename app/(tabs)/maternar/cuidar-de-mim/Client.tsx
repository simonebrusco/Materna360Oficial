'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { Reveal } from '@/components/ui/Reveal'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'ritmo' | 'acao' | 'pausa' | 'fechar'
type Focus = '1min' | '3min' | '5min'
type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'

type Routine = {
  focus: Focus
  title: string
  subtitle: string
  steps: string[]
  pauses: { label: string; min: number }[]
  close: string
}

const ROUTINES: Routine[] = [
  {
    focus: '1min',
    title: 'Reset rápido (1 min)',
    subtitle: 'Baixar o volume do corpo e seguir.',
    steps: ['Respire fundo 3 vezes', 'Relaxe os ombros'],
    pauses: [{ label: 'Respirar 1 min', min: 1 }],
    close: 'Pronto. Isso já ajuda.',
  },
  {
    focus: '3min',
    title: 'Reset 3 min (água + pescoço)',
    subtitle: 'Voltar para si e escolher o próximo passo.',
    steps: ['Água: 3 goles', 'Pescoço: 3 giros', 'Respirar 4 vezes'],
    pauses: [
      { label: 'Água + pausa', min: 1 },
      { label: 'Respirar 1 min', min: 1 },
    ],
    close: 'Feito. Você retomou o controle.',
  },
  {
    focus: '5min',
    title: 'Cuidar com calma (5 min)',
    subtitle: 'Organizar por dentro antes de seguir.',
    steps: [
      'Hidratante nas mãos',
      'Alongar braços',
      'Respirar com a mão no peito',
      'Arrumar 1 item perto',
    ],
    pauses: [
      { label: 'Respirar', min: 1 },
      { label: 'Alongar', min: 2 },
    ],
    close: 'Pronto. O dia fica mais leve agora.',
  },
]

function inferContext(): { focus: Focus; ritmo: Ritmo } {
  if (typeof window === 'undefined') return { focus: '3min', ritmo: 'cansada' }
  const f = localStorage.getItem('eu360_focus') as Focus | null
  const r = localStorage.getItem('eu360_ritmo') as Ritmo | null
  if (r === 'sobrecarregada') return { focus: '1min', ritmo: r }
  return { focus: f ?? '3min', ritmo: r ?? 'cansada' }
}

export default function Client() {
  const [step, setStep] = useState<Step>('acao')
  const [focus, setFocus] = useState<Focus>('3min')
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')
  const [checked, setChecked] = useState<boolean[]>([])

  useEffect(() => {
    const ctx = inferContext()
    setFocus(ctx.focus)
    setRitmo(ctx.ritmo)
    track('cuidar_de_mim.open', ctx)
  }, [])

  const routine = useMemo(
    () => ROUTINES.find((r) => r.focus === focus)!,
    [focus]
  )

  useEffect(() => {
    setChecked(new Array(routine.steps.length).fill(false))
  }, [routine])

  function toggle(i: number) {
    setChecked((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  return (
    <main
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_25%,#fdbed7_55%,#ffe1f1_85%,#ffffff_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* HERO */}
          <header className="pt-10 md:pt-14 mb-6 text-white">
            <Link
              href="/maternar"
              className="inline-flex items-center text-[12px] text-white/80 hover:text-white mb-2"
            >
              ← Voltar para o Maternar
            </Link>

            <h1 className="text-3xl font-semibold">Cuidar de Mim</h1>
            <p className="text-white/90 max-w-xl mt-2">
              Você entra sem clareza e sai com um reset curto e prático para
              seguir melhor — sem precisar pensar muito.
            </p>
          </header>

          {/* PAINEL PRINCIPAL */}
          <Reveal>
            <section
              className="
                rounded-3xl
                bg-white/10
                border border-white/30
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                overflow-hidden
              "
            >
              {/* HEADER DO PAINEL */}
              <div className="px-5 md:px-6 pt-5 pb-4 border-b border-white/25">
                <div className="flex justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center">
                      <AppIcon name="heart" size={22} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[12px] text-white/80">
                        Sugestão pronta para agora
                      </div>
                      <div className="text-lg font-semibold text-white mt-1">
                        {routine.title}
                      </div>
                      <div className="text-sm text-white/85 mt-1">
                        {routine.subtitle}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('ritmo')}
                    className="rounded-full bg-white text-[#fd2597] px-4 py-2 text-sm"
                  >
                    Ajustar
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  {['ritmo', 'acao', 'pausa', 'fechar'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStep(s as Step)}
                      className={[
                        'rounded-full px-3 py-1 text-xs border',
                        step === s
                          ? 'bg-white text-[#fd2597] border-white'
                          : 'bg-white/20 text-white border-white/30',
                      ].join(' ')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* BODY */}
              <div className="bg-white px-5 md:px-6 py-6">
                {step === 'ritmo' && (
                  <div className="space-y-4">
                    <p className="font-semibold">Como você está agora?</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['leve', 'cansada', 'animada', 'sobrecarregada'] as Ritmo[]).map(
                        (r) => (
                          <button
                            key={r}
                            onClick={() => setRitmo(r)}
                            className="rounded-full border px-3 py-2 text-sm"
                          >
                            {r}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {step === 'acao' && (
                  <div className="space-y-4">
                    <p className="font-semibold">Faça isso agora</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {routine.steps.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => toggle(i)}
                          className={[
                            'rounded-2xl border p-4 text-left',
                            checked[i]
                              ? 'bg-[#ffd8e6]'
                              : 'bg-white',
                          ].join(' ')}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 'pausa' && (
                  <div>
                    <p className="font-semibold mb-2">Escolha uma pausa rápida</p>
                    {routine.pauses.map((p) => (
                      <div key={p.label} className="border rounded-xl p-3 mb-2">
                        {p.label} • {p.min} min
                      </div>
                    ))}
                  </div>
                )}

                {step === 'fechar' && (
                  <div className="space-y-3">
                    <p className="font-semibold">{routine.close}</p>
                    <Link
                      href="/maternar/meu-filho"
                      className="inline-block rounded-full bg-[#fd2597] text-white px-4 py-2"
                    >
                      Ir para Meu Filho
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </Reveal>

          <div className="mt-8">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
