'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/common/AppShell'
import { ClientOnly } from '@/components/common/ClientOnly'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import Eu360ProfileCollapsible from '@/components/blocks/Eu360ProfileCollapsible'
import { SoftCard } from '@/components/ui/card'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { useProfile } from '@/app/hooks/useProfile'
import LegalFooter from '@/components/common/LegalFooter'

/* ======================================================
   TIPOS
====================================================== */

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

type Eu360StateId =
  | 'cansaco_acumulado'
  | 'sobrecarga_emocional'
  | 'reorganizacao'
  | 'equilibrio_conexao'
  | 'mais_energia'

type Eu360State = {
  id: Eu360StateId
  title: string
  subtitle: string
}

/* ======================================================
   DERIVAÇÃO DO ESTADO ATUAL (CANÔNICO)
====================================================== */

function deriveEu360StateFromAnswers(answers: QuestionnaireAnswers): Eu360State {
  const q1 = answers.q1
  const q3 = answers.q3
  const q4 = answers.q4
  const q6 = answers.q6

  const heavy =
    q1 === 'exausta' ||
    q1 === 'cansada' ||
    q4 === 'sobrevivencia' ||
    q6 === 'passar' ||
    q6 === 'basico'

  const emotionalOverload =
    q3 === 'emocional' ||
    q3 === 'tudo' ||
    q1 === 'oscilando'

  const reorg =
    q4 === 'organizar' ||
    q3 === 'organizacao' ||
    q3 === 'tempo' ||
    q6 === 'organizada'

  const balanceConnection =
    q4 === 'conexao' ||
    q4 === 'equilibrio' ||
    q3 === 'conexao' ||
    q6 === 'momento'

  const energy =
    q1 === 'energia' ||
    q4 === 'alem' ||
    q6 === 'avancar'

  if (heavy) {
    return {
      id: 'cansaco_acumulado',
      title: 'Um momento de cansaço acumulado',
      subtitle:
        'Aqui a prioridade é aliviar o peso e reduzir cobrança. O app acompanha no seu ritmo, sem te exigir mais.',
    }
  }

  if (emotionalOverload) {
    return {
      id: 'sobrecarga_emocional',
      title: 'Uma fase de sobrecarga emocional',
      subtitle:
        'Tem muita coisa acontecendo ao mesmo tempo. Aqui é um espaço para organizar sentimentos, não para dar conta de tudo.',
    }
  }

  if (reorg) {
    return {
      id: 'reorganizacao',
      title: 'Uma fase de reorganização',
      subtitle:
        'Ainda não está leve, mas há espaço para ajustar aos poucos. Sem pressa, sem plano rígido.',
    }
  }

  if (balanceConnection) {
    return {
      id: 'equilibrio_conexao',
      title: 'Um momento de busca por equilíbrio',
      subtitle:
        'Existe intenção de estar mais presente, mesmo com limites reais. O app acompanha sem transformar isso em obrigação.',
    }
  }

  if (energy) {
    return {
      id: 'mais_energia',
      title: 'Um momento com mais energia disponível',
      subtitle:
        'Dá para olhar a rotina com mais clareza agora — sem pressa e sem virar cobrança.',
    }
  }

  return {
    id: 'reorganizacao',
    title: 'Um momento de transição',
    subtitle:
      'O app vai se ajustando conforme você responde. Sem necessidade de definir tudo agora.',
  }
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function Eu360Client() {
  const questionnaireRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    track('nav.click', { tab: 'eu360', dest: '/eu360' })
  }, [])

  const { name } = useProfile()
  const firstName = (name || '').split(' ')[0] || 'Você'

  const [answers, setAnswers] = useState<QuestionnaireAnswers>({})
  const [qStep, setQStep] = useState(1)

  const eu360State = useMemo(() => {
    return deriveEu360StateFromAnswers(answers)
  }, [answers])

  function setAnswer<K extends keyof QuestionnaireAnswers>(
    key: K,
    value: NonNullable<QuestionnaireAnswers[K]>,
  ) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function canGoNext() {
    const key = `q${qStep}` as keyof QuestionnaireAnswers
    return Boolean(answers[key])
  }

  function goNext() {
    if (!canGoNext()) return
    setQStep((s) => Math.min(6, s + 1))
  }

  function goPrev() {
    setQStep((s) => Math.max(1, s - 1))
  }

  function scrollToQuestionnaire() {
    questionnaireRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <AppShell>
      <ClientOnly>
        <main
          data-layout="page-template-v1"
          data-tab="eu360"
          className="eu360-hub-bg relative min-h-[100dvh] pb-24"
        >
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            {/* HERO */}
            <header className="pt-8 mb-6">
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold tracking-[0.22em] text-white">
                EU360
              </span>

              <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-white">
                Seu mundo em perspectiva
              </h1>

              <p className="mt-2 text-white/90 max-w-xl">
                Um espaço para o Materna360 entender seu momento e acompanhar com mais leveza.
              </p>

              {/* CARD — ESTADO ATUAL */}
              <div className="mt-4 rounded-3xl border border-white/35 bg-white/12 backdrop-blur-md px-5 py-4">
                <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/80">
                  Seu momento agora
                </p>

                <div className="mt-2 flex items-start gap-2">
                  <AppIcon name="heart" size={18} className="text-white" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {eu360State.title}
                    </p>
                    <p className="text-[12px] text-white/85 leading-relaxed">
                      {eu360State.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={scrollToQuestionnaire}
                    className="rounded-full bg-white text-[#2f3a56] px-4 py-2 text-[12px]"
                  >
                    Fazer quando fizer sentido (2 min)
                  </button>

                  <Link
                    href="/meu-dia"
                    className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px]"
                  >
                    Ir para Meu Dia
                  </Link>
                </div>
              </div>
            </header>

            {/* QUESTIONÁRIO */}
            <div ref={questionnaireRef} />

            <SectionWrapper density="compact">
              <Reveal>
                <SoftCard className="rounded-3xl bg-white px-6 py-6 space-y-4">
                  <h2 className="text-lg font-semibold text-[#2f3a56]">
                    Para o app acompanhar o seu momento real
                  </h2>

                  {qStep === 1 && (
                    <>
                      <p className="text-sm font-semibold">
                        Como você tem se sentido na maior parte dos dias?
                      </p>
                      <div className="grid gap-2">
                        <button onClick={() => setAnswer('q1', 'exausta')}>Exausta</button>
                        <button onClick={() => setAnswer('q1', 'cansada')}>
                          Cansada, mas dando conta
                        </button>
                        <button onClick={() => setAnswer('q1', 'oscilando')}>
                          Oscilando
                        </button>
                        <button onClick={() => setAnswer('q1', 'equilibrada')}>
                          Mais equilibrada
                        </button>
                        <button onClick={() => setAnswer('q1', 'energia')}>
                          Com energia para mais
                        </button>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-4">
                    <button onClick={goPrev} disabled={qStep === 1}>
                      Voltar
                    </button>
                    <button onClick={goNext} disabled={!canGoNext()}>
                      Próximo
                    </button>
                  </div>
                </SoftCard>
              </Reveal>
            </SectionWrapper>
          </div>

          <LegalFooter />
        </main>
      </ClientOnly>
    </AppShell>
  )
}
