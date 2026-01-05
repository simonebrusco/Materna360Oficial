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

import { getEu360Signal, type Eu360Signal } from '@/app/lib/eu360Signals.client'
import { getEu360FortnightLine } from '@/app/lib/continuity.client'
import { getContinuityTone } from '@/app/lib/experience/continuityTone'

/* ────────────────────────────────────────────────
   TIPOS
──────────────────────────────────────────────── */

type QuestionnaireAnswers = {
  q1?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia'
  q2?: 'nenhum' | '5a10' | '15a30' | 'mais30'
  q3?: 'tempo' | 'emocional' | 'organizacao' | 'conexao' | 'tudo'
  q4?: 'sobrevivencia' | 'organizar' | 'conexao' | 'equilibrio' | 'alem'
  q5?: 'diretas' | 'guiadas' | 'explorar'
  q6?: 'passar' | 'basico' | 'momento' | 'organizada' | 'avancar'
}

type Eu360Preferences = {
  stateLabel: string
  microCopy: string
  focusHint?: string
  helpStyle?: 'diretas' | 'guiadas' | 'explorar'
  updatedAtISO: string
  answers: QuestionnaireAnswers
}

/* ────────────────────────────────────────────────
   LOCAL STORAGE
──────────────────────────────────────────────── */

const LS_KEYS = {
  eu360Prefs: 'eu360_prefs_v1',
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

function safeParseJSON<T>(raw: string | null): T | null {
  try {
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/* ────────────────────────────────────────────────
   MAPA DOS 5 ESTADOS (CANÔNICO)
──────────────────────────────────────────────── */

function computeStateFromAnswers(answers: QuestionnaireAnswers) {
  if (answers.q1 === 'exausta' || answers.q4 === 'sobrevivencia') {
    return {
      stateLabel: 'Sobrevivência',
      microCopy: 'Aqui o foco é sustentar o dia com menos peso e sem cobrança.',
      focusHint: 'alívio e proteção de energia',
    }
  }

  if (answers.q1 === 'cansada' || answers.q6 === 'basico') {
    return {
      stateLabel: 'Manutenção',
      microCopy: 'Manter o essencial já é suficiente neste momento.',
      focusHint: 'estabilidade e previsibilidade',
    }
  }

  if (answers.q1 === 'oscilando' || answers.q3 === 'tudo') {
    return {
      stateLabel: 'Oscilação',
      microCopy: 'Alguns dias fluem, outros pesam — e isso faz parte.',
      focusHint: 'ritmo e ajuste fino',
    }
  }

  if (answers.q1 === 'equilibrada' || answers.q4 === 'equilibrio') {
    return {
      stateLabel: 'Equilíbrio',
      microCopy: 'Existe espaço para organizar sem se pressionar.',
      focusHint: 'clareza e continuidade',
    }
  }

  return {
    stateLabel: 'Expansão',
    microCopy: 'Há energia para ir além, sem perder o cuidado.',
    focusHint: 'crescimento consciente',
  }
}

/* ────────────────────────────────────────────────
   WRITE PREFS (PONTO CRÍTICO)
──────────────────────────────────────────────── */

function writePrefsToLS(result: Eu360Preferences) {
  safeSetLS(LS_KEYS.eu360Prefs, JSON.stringify(result))

  try {
    if (typeof window !== 'undefined') {
      // Evento novo (Eu360)
      window.dispatchEvent(new Event('eu360:prefs-updated'))

      // Evento legado (Meu Dia / Planner)
      window.dispatchEvent(new Event('eu360:persona-updated'))
    }
  } catch {
    // nunca quebra
  }
}

function readPrefsFromLS(): Eu360Preferences | null {
  return safeParseJSON<Eu360Preferences>(safeGetLS(LS_KEYS.eu360Prefs))
}

/* ────────────────────────────────────────────────
   COMPONENTE
──────────────────────────────────────────────── */

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Eu360Client() {
  const questionnaireRef = useRef<HTMLDivElement | null>(null)

  const { name } = useProfile()
  const firstName = (name || '').split(' ')[0] || 'Você'

  const [answers, setAnswers] = useState<QuestionnaireAnswers>({})
  const [prefs, setPrefs] = useState<Eu360Preferences | null>(null)
  const [qStep, setQStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [euSignal, setEuSignal] = useState<Eu360Signal>(() => getEu360Signal())
  const resolvedTone = useMemo(
    () => getContinuityTone(euSignal.tone),
    [euSignal.tone],
  )

  useEffect(() => {
    const saved = readPrefsFromLS()
    if (saved) {
      setPrefs(saved)
      setAnswers(saved.answers)
    }
  }, [])

  useEffect(() => {
    const refresh = () => setEuSignal(getEu360Signal())
    window.addEventListener('eu360:prefs-updated', refresh)
    window.addEventListener('eu360:persona-updated', refresh)
    return () => {
      window.removeEventListener('eu360:prefs-updated', refresh)
      window.removeEventListener('eu360:persona-updated', refresh)
    }
  }, [])

  const preview = useMemo(
    () => computeStateFromAnswers(answers),
    [answers],
  )

  async function finishQuestionnaire() {
    setSaving(true)
    try {
      const computed = computeStateFromAnswers(answers)

      const result: Eu360Preferences = {
        ...computed,
        helpStyle: answers.q5,
        updatedAtISO: new Date().toISOString(),
        answers,
      }

      writePrefsToLS(result)
      setPrefs(result)

      track('eu360.questionario.complete', {
        state: computed.stateLabel,
      })
    } finally {
      setSaving(false)
    }
  }

  /* ───────── UI ───────── */

  const stateLabel = prefs?.stateLabel ?? preview.stateLabel
  const microCopy = prefs?.microCopy ?? preview.microCopy

  return (
    <AppShell>
      <ClientOnly>
        <main data-tab="eu360" className="eu360-hub-bg min-h-[100dvh] pb-24">
          <div className="mx-auto max-w-6xl px-4">
            <header className="pt-8 mb-6">
              <h1 className="text-2xl font-semibold text-white">
                Seu mundo em perspectiva
              </h1>
              <p className="text-white/90 mt-1">
                Um espaço de leitura, não de cobrança.
              </p>
            </header>

            <SectionWrapper>
              <SoftCard className="rounded-3xl bg-white p-6 space-y-3">
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Seu estado atual
                </p>
                <h2 className="text-lg font-semibold text-[#2f3a56]">
                  {stateLabel}
                </h2>
                <p className="text-sm text-gray-600">{microCopy}</p>
              </SoftCard>
            </SectionWrapper>

            <div ref={questionnaireRef} />

            {/* O restante do layout permanece exatamente como estava */}

          </div>

          <LegalFooter />
        </main>
      </ClientOnly>
    </AppShell>
  )
}
