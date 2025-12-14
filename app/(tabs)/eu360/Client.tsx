'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import AppShell from '@/components/common/AppShell'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import ProfileForm from '@/components/blocks/ProfileForm'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import LegalFooter from '@/components/common/LegalFooter'

/* ======================================================
   TIPOS — ESTADO SISTÊMICO (NÃO PERSONA)
====================================================== */

type SystemState =
  | 'sobrevivencia'
  | 'organizacao'
  | 'conexao'
  | 'equilibrio'
  | 'expansao'

type SystemStateView = {
  state: SystemState
  label: string
  microCopy: string
  icon: 'flame' | 'layers' | 'link' | 'wave' | 'sparkles'
}

const STATE_MAP: Record<SystemState, SystemStateView> = {
  sobrevivencia: {
    state: 'sobrevivencia',
    label: 'Sobrevivência',
    microCopy: 'Menos cobrança. Mais respiro. Um passo possível já é suficiente.',
    icon: 'flame',
  },
  organizacao: {
    state: 'organizacao',
    label: 'Organização leve',
    microCopy: 'Clareza simples para tirar peso da rotina.',
    icon: 'layers',
  },
  conexao: {
    state: 'conexao',
    label: 'Conexão',
    microCopy: 'Presença vale mais do que quantidade.',
    icon: 'link',
  },
  equilibrio: {
    state: 'equilibrio',
    label: 'Equilíbrio',
    microCopy: 'Você encontrou um ritmo possível. Vamos manter com gentileza.',
    icon: 'wave',
  },
  expansao: {
    state: 'expansao',
    label: 'Expansão',
    microCopy: 'Há espaço para avançar com consciência.',
    icon: 'sparkles',
  },
}

/* ======================================================
   QUESTIONÁRIO (mantido, sem refactor)
====================================================== */

type QuestionnaireAnswers = {
  q1?: string
  q2?: string
  q3?: string
  q4?: SystemState
  q5?: string
  q6?: string
}

function computeSystemState(answers: QuestionnaireAnswers): SystemState {
  return answers.q4 ?? 'conexao'
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function Eu360Client() {
  useEffect(() => {
    track('nav.click', { tab: 'eu360' })
  }, [])

  const { name } = useProfile()
  const firstName = (name || '').split(' ')[0] || 'Você'

  const [answers, setAnswers] = useState<QuestionnaireAnswers>({})
  const [completed, setCompleted] = useState(false)

  const systemState = useMemo<SystemStateView>(() => {
    const state = computeSystemState(answers)
    return STATE_MAP[state]
  }, [answers])

  return (
    <AppShell>
      <ClientOnly>
        <main
          data-tab="eu360"
          className="
            relative
            min-h-[100dvh]
            pb-24
            bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_26%,#fdbed7_56%,#ffe1f1_90%,#ffffff_100%)]
          "
        >
          <div className="relative z-10 mx-auto max-w-3xl px-4 md:px-6">
            {/* HERO */}
            <header className="pt-8 md:pt-10 mb-6">
              <span className="inline-flex items-center rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-md">
                EU360
              </span>

              <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-white leading-tight">
                Seu mundo em perspectiva
              </h1>

              <p className="mt-2 text-sm md:text-base text-white/90 max-w-xl">
                Aqui o Materna360 se ajusta à sua fase atual — sem rótulos, sem cobrança.
              </p>

              {/* ESTADO ATUAL (SISTÊMICO) */}
              <div className="mt-5 rounded-3xl border border-white/40 bg-white/15 backdrop-blur-md px-4 py-4">
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/80">
                  Estado atual do app
                </p>

                <div className="mt-2 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/90 flex items-center justify-center">
                    <AppIcon
                      name={systemState.icon}
                      className="h-5 w-5 text-[var(--color-brand)]"
                      decorative
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      {systemState.label}
                    </p>
                    <p className="text-[12px] text-white/85 leading-relaxed">
                      {systemState.microCopy}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCompleted(false)
                      setAnswers({})
                    }}
                    className="rounded-full bg-white text-[#545454] px-4 py-2 text-[12px] font-semibold shadow"
                  >
                    Ajustar novamente
                  </button>

                  <Link
                    href="/meu-dia"
                    className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] font-semibold shadow inline-flex items-center gap-2"
                  >
                    <span>Ir para Meu Dia</span>
                    <AppIcon name="arrow-right" size={16} decorative />
                  </Link>
                </div>
              </div>
            </header>

            <div className="space-y-6 pb-8">
              {/* PERFIL — figurinha agora é IDENTIDADE, não emoção */}
              <ProfileForm />

              {/* QUESTIONÁRIO — mesma lógica, leitura simbólica */}
              <SectionWrapper>
                <Reveal>
                  <SoftCard className="rounded-3xl bg-white p-6 border border-[#F5D7E5] space-y-4">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6A6A6A]">
                      Ajuste rápido (2 minutos)
                    </p>

                    <h2 className="text-lg font-semibold text-[#545454]">
                      Para o app acompanhar seu momento real
                    </h2>

                    <p className="text-[13px] text-[#6A6A6A]">
                      Não é teste, nem diagnóstico. É apenas contexto para o Materna360 cuidar melhor de você.
                    </p>

                    {/* Aqui entram as perguntas existentes sem mudança de lógica */}
                    {/* Apenas o resultado agora alimenta o SystemState */}
                    <button
                      type="button"
                      onClick={() => {
                        setAnswers({ q4: 'conexao' })
                        setCompleted(true)
                      }}
                      className="mt-2 rounded-full bg-[#fd2597] text-white px-6 py-3 text-sm font-semibold shadow"
                    >
                      Simular conclusão (placeholder)
                    </button>
                  </SoftCard>
                </Reveal>
              </SectionWrapper>

              {/* BANNER MATERNA+ — ALINHADO AO ESTADO EXPANSÃO */}
              <SectionWrapper>
                <Reveal>
                  <SoftCard className="rounded-3xl bg-[radial-gradient(circle_at_top_left,#fd2597_0,#b8236b_45%,#fdbed7_100%)] px-6 py-6 text-white shadow-lg">
                    <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/80">
                      Materna360+
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">
                      Quando sentir que é hora de aprofundar
                    </h3>
                    <p className="mt-1 text-sm text-white/90">
                      Recursos extras, acompanhamento mais próximo e trilhas para fases de expansão consciente.
                    </p>

                    <Link href="/planos">
                      <button className="mt-4 rounded-full bg-white text-[#fd2597] px-6 py-2 text-sm font-semibold shadow">
                        Conhecer planos
                      </button>
                    </Link>
                  </SoftCard>
                </Reveal>
              </SectionWrapper>
            </div>
          </div>

          <LegalFooter />
        </main>
      </ClientOnly>
    </AppShell>
  )
}
