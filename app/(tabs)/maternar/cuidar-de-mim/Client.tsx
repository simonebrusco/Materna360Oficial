'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { track } from '@/app/lib/telemetry'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import AppIcon from '@/components/ui/AppIcon'
import LegalFooter from '@/components/common/LegalFooter'
import { SoftCard } from '@/components/ui/card'
import { addTaskToMyDay, MY_DAY_SOURCES } from '@/app/lib/myDayTasks.client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Step = 'ritmo' | 'acao' | 'pausa' | 'fechar'
type FocusMode = '1min' | '3min' | '5min'
type Ritmo = 'leve' | 'cansada' | 'animada' | 'sobrecarregada'

type CareFamily = 'corpo' | 'clareza' | 'ritmo' | 'pausa' | 'encerrar'

type CareAction = {
  id: string
  family: CareFamily
  title: string
  description: string
  duration: FocusMode
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

/* ======================================================
   AÇÕES POSSÍVEIS — VOCABULÁRIO OFICIAL (P26)
====================================================== */

const ACTIONS: CareAction[] = [
  {
    id: 'agua',
    family: 'corpo',
    title: 'Beber água agora',
    description: 'Um copo já ajuda o corpo a sair do automático.',
    duration: '1min',
  },
  {
    id: 'respirar',
    family: 'corpo',
    title: 'Respirar 3 vezes com calma',
    description: 'Sem técnica. Só baixar um pouco o ritmo.',
    duration: '1min',
  },
  {
    id: 'ombros',
    family: 'corpo',
    title: 'Soltar ombros e mandíbula',
    description: 'Onde você costuma segurar tensão.',
    duration: '1min',
  },
  {
    id: 'prioridade',
    family: 'clareza',
    title: 'Escolher uma prioridade possível',
    description: 'Se só isso acontecer, já ajuda.',
    duration: '3min',
  },
  {
    id: 'proximo-passo',
    family: 'clareza',
    title: 'Definir o próximo passo pequeno',
    description: 'Nada além do próximo.',
    duration: '3min',
  },
  {
    id: 'reduzir',
    family: 'ritmo',
    title: 'Reduzir expectativa do dia',
    description: 'Hoje pode ser versão mínima.',
    duration: '1min',
  },
  {
    id: 'pausa-curta',
    family: 'pausa',
    title: 'Pausa curta',
    description: 'Um minuto sem fazer nada.',
    duration: '1min',
  },
  {
    id: 'fechar',
    family: 'encerrar',
    title: 'Encerrar por agora',
    description: 'Isso já basta.',
    duration: '1min',
  },
]

function inferFromEu360(): { focus: FocusMode; ritmo: Ritmo } {
  const focusRaw = safeGetLS('eu360_focus_time')
  const ritmoRaw = safeGetLS('eu360_ritmo')

  const focus: FocusMode =
    focusRaw === '1min' || focusRaw === '3min' || focusRaw === '5min'
      ? focusRaw
      : '3min'

  const ritmo: Ritmo =
    ritmoRaw === 'leve' ||
    ritmoRaw === 'cansada' ||
    ritmoRaw === 'animada' ||
    ritmoRaw === 'sobrecarregada'
      ? ritmoRaw
      : 'cansada'

  return { focus, ritmo }
}

function chooseFamily(ritmo: Ritmo): CareFamily {
  if (ritmo === 'sobrecarregada') return 'corpo'
  if (ritmo === 'cansada') return 'ritmo'
  if (ritmo === 'animada') return 'ritmo'
  return 'clareza'
}

function pickAction(family: CareFamily, focus: FocusMode): CareAction {
  const options = ACTIONS.filter(
    (a) => a.family === family && a.duration === focus
  )

  return options[0] ?? ACTIONS[0]
}

export default function Client() {
  const [step, setStep] = useState<Step>('acao')
  const [focus, setFocus] = useState<FocusMode>('3min')
  const [ritmo, setRitmo] = useState<Ritmo>('cansada')

  const [saveFeedback, setSaveFeedback] = useState<string>('')

  useEffect(() => {
    const inferred = inferFromEu360()
    setFocus(inferred.focus)
    setRitmo(inferred.ritmo)

    try {
      track('cuidar_de_mim.open', inferred)
    } catch {}
  }, [])

  const family = useMemo(() => chooseFamily(ritmo), [ritmo])
  const action = useMemo(() => pickAction(family, focus), [family, focus])

  function saveToMyDay(title: string) {
    const res = addTaskToMyDay({
      title,
      origin: 'selfcare',
      source: MY_DAY_SOURCES.MATERNAR_CUIDAR_DE_MIM,
    })

    setSaveFeedback(res.created ? 'Salvo no Meu Dia.' : 'Já estava no Meu Dia.')
    setTimeout(() => setSaveFeedback(''), 2000)
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="min-h-[100dvh] pb-32 bg-[#ffe1f1]"
    >
      <ClientOnly>
        <div className="mx-auto max-w-3xl px-4">
          <header className="pt-8 mb-6">
            <Link href="/maternar" className="text-sm text-white/80">
              ← Voltar
            </Link>

            <h1 className="text-2xl font-semibold text-white mt-2">
              Cuidar de Mim
            </h1>

            <p className="text-sm text-white/90 mt-2 max-w-xl">
              Um ajuste curto para seguir o dia com menos peso.
            </p>
          </header>

          <Reveal>
            <SoftCard className="p-6 rounded-3xl bg-white">
              {saveFeedback && (
                <div className="mb-4 text-sm text-[#2f3a56]">
                  {saveFeedback}
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs text-[#6a6a6a]">
                  Sugestão para agora
                </div>

                <div className="text-lg font-semibold text-[#2f3a56]">
                  {action.title}
                </div>

                <div className="text-sm text-[#6a6a6a]">
                  {action.description}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => saveToMyDay(action.title)}
                    className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-sm"
                  >
                    Salvar no Meu Dia
                  </button>

                  <button
                    onClick={() => setStep('fechar')}
                    className="rounded-full bg-white border border-[#f5d7e5] px-4 py-2 text-sm"
                  >
                    Encerrar
                  </button>

                  <Link
                    href="/maternar/meu-filho"
                    className="rounded-full bg-white border border-[#f5d7e5] px-4 py-2 text-sm"
                  >
                    Ir para Meu Filho
                  </Link>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <div className="mt-6">
            <LegalFooter />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
