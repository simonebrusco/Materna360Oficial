'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'

/* =========================================================
   TIPOS — CONTRATO DEFINITIVO ENTRE OS BLOCKS
   ========================================================= */

/**
 * Erros:
 * - campos simples → string
 * - filhos → erros indexados por id
 */
export type FormErrors = {
  [key: string]: string | undefined | Record<string, string | undefined>
  filhos?: Record<string, string | undefined>
}

export type ChildProfile = {
  id: string
  nome?: string
  genero?: string
  idadeMeses?: number
}

/**
 * ProfileFormState = contrato de compatibilidade
 * (campos novos + legados usados nos blocks)
 */
export type ProfileFormState = {
  /* Figurinhas */
  figurinha?: string
  sticker?: string

  /* About you */
  nomeMae?: string
  userPreferredName?: string
  userRole?: string
  userEmotionalBaseline?: string
  userMainChallenges?: string[]
  userEnergyPeakTime?: string

  /* Children */
  filhos?: ChildProfile[]

  /* Preferences */
  userContentPreferences?: string[]
  userNotificationPreferences?: string[]
}

/* =========================================================
   COMPONENTES AUXILIARES
   ========================================================= */

function StepPill({
  active,
  number,
  label,
}: {
  active?: boolean
  number: number
  label: string
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-2 border text-[11px] font-semibold transition',
        active
          ? 'bg-[#ffd8e6] border-[#fd2597]/40 text-[#2f3a56]'
          : 'bg-white/70 border-[#f5d7e5] text-[#6a6a6a]',
      ].join(' ')}
    >
      <span
        className={[
          'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
          active ? 'bg-[#fd2597] text-white' : 'bg-[#ffe1f1] text-[#fd2597]',
        ].join(' ')}
      >
        {number}
      </span>
      <span>{label}</span>
    </span>
  )
}

/* =========================================================
   PROFILE FORM (ORQUESTRADOR)
   ========================================================= */

export default function ProfileForm() {
  const [form, setForm] = useState<ProfileFormState>({
    filhos: [],
    userMainChallenges: [],
    userContentPreferences: [],
    userNotificationPreferences: [],
  })

  const [errors] = useState<FormErrors>({})

  /* Persistência simples */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('eu360_profile')
      if (raw) setForm(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('eu360_profile', JSON.stringify(form))
    } catch {}
  }, [form])

  const onChange = (updates: Partial<ProfileFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }))
  }

  /* =========================================================
     STEP ATIVO — TIPADO CORRETAMENTE (1 | 2 | 3 | 4)
     ========================================================= */

  const step = useMemo<1 | 2 | 3 | 4>(() => {
    const hasAbout =
      Boolean(form.figurinha) ||
      Boolean(form.nomeMae) ||
      Boolean(form.userPreferredName) ||
      Boolean(form.userRole)

    const hasChildren = (form.filhos?.length ?? 0) > 0

    const hasPrefs =
      (form.userContentPreferences?.length ?? 0) > 0 ||
      (form.userNotificationPreferences?.length ?? 0) > 0

    if (hasPrefs) return 4
    if (hasChildren) return 2
    if (hasAbout) return 1
    return 1
  }, [
    form.figurinha,
    form.nomeMae,
    form.userPreferredName,
    form.userRole,
    form.filhos,
    form.userContentPreferences,
    form.userNotificationPreferences,
  ])

  /* ========================================================= */

  function saveAndContinue() {
    try {
      track('eu360.profile.saved', { step })
    } catch {}
  }

  return (
    <SectionWrapper>
      <Reveal>
        <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-6">

          {/* Header */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-ink-muted)]">
              Seu perfil
            </p>
            <h2 className="mt-1 text-lg md:text-xl font-semibold text-[var(--color-ink)]">
              Sobre você (sem pressa)
            </h2>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active={step === 1} number={1} label="Você" />
            <StepPill active={step === 2} number={2} label="Seu(s) filho(s)" />
            <StepPill active={step === 3} number={3} label="Rotina" />
            <StepPill active={step === 4} number={4} label="Rede & preferências" />
          </div>

          {/* Aqui entram os BLOCKS */}
          {/* AboutYouBlock / ChildrenBlock / PreferencesBlock */}
          {/* Eles recebem form, errors e onChange */}

          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] p-4 md:p-6">
            <button
              type="button"
              onClick={saveAndContinue}
              className="w-full rounded-full bg-[#fd2597] text-white px-5 py-3 text-[13px] font-semibold shadow-[0_10px_26px_rgba(253,37,151,0.30)]"
            >
              Salvar e continuar
            </button>
          </SoftCard>
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
