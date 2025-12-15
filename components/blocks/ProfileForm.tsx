'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import { STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'
import { ChildrenBlock } from './ProfileFormBlocks/ChildrenBlock'
import { RoutineBlock } from './ProfileFormBlocks/RoutineBlock'
import { PreferencesBlock } from './ProfileFormBlocks/PreferencesBlock'

/**
 * =========================================================
 * TIPOS “LEI” DO FORMULÁRIO (Contrato único)
 * =========================================================
 */

export type ChildGender = 'feminino' | 'masculino' | 'nao-informar'

export type ChildProfile = {
  id: string
  nome?: string
  genero?: ChildGender
  idadeMeses?: number
}

export type UserRole = 'mae' | 'pai' | 'cuidador' | 'outro'
export type EmotionalBaseline = 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
export type EnergyPeakTime = 'manha' | 'tarde' | 'noite'

export type ProfileFormState = {
  /** Figurinhas */
  figurinha?: ProfileStickerId

  /** Step 1 (AboutYouBlock) */
  nomeMae: string
  userPreferredName?: string
  userRole?: UserRole
  userEmotionalBaseline?: EmotionalBaseline
  userMainChallenges: string[]
  userEnergyPeakTime?: EnergyPeakTime

  /** Step 2 (ChildrenBlock) */
  filhos: ChildProfile[]

  /** Step 3 (RoutineBlock) */
  routineChaosMoments: string[]
  routineSupportNeeds: string[]

  /** Step 4 (PreferencesBlock) */
  supportNetwork: string[]
  userContentPreferences: string[]
  userNotificationsPreferences: string[]
}

/**
 * FormErrors:
 * - Evita index signature genérica (que quebra com filhos)
 * - Permite erro por campo + erros por filho (map id->msg)
 */
export type FormErrors = Partial<Record<Exclude<keyof ProfileFormState, 'filhos'>, string>> & {
  filhos?: Record<string, string | undefined>
}

/**
 * =========================================================
 * LS
 * =========================================================
 */
const LS_KEY = 'eu360_profile_v1'

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

function makeId() {
  return `child_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function defaultState(): ProfileFormState {
  return {
    figurinha: undefined,

    nomeMae: '',
    userPreferredName: '',
    userRole: undefined,
    userEmotionalBaseline: undefined,
    userMainChallenges: [],
    userEnergyPeakTime: undefined,

    filhos: [{ id: makeId(), nome: '', genero: 'nao-informar', idadeMeses: undefined }],

    routineChaosMoments: [],
    routineSupportNeeds: [],

    supportNetwork: [],
    userContentPreferences: [],
    userNotificationsPreferences: [],
  }
}

/**
 * =========================================================
 * UI: Pills
 * =========================================================
 */
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

/**
 * =========================================================
 * COMPONENT
 * =========================================================
 */
export default function ProfileForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<ProfileFormState>(() => defaultState())
  const [errors, setErrors] = useState<FormErrors>({})

  // Load LS
  useEffect(() => {
    const saved = safeParseJSON<Partial<ProfileFormState>>(safeGetLS(LS_KEY))
    if (!saved) return

    // Merge seguro mantendo defaults
    const merged: ProfileFormState = {
      ...defaultState(),
      ...saved,
      // normalizações
      nomeMae: typeof saved.nomeMae === 'string' ? saved.nomeMae : '',
      userMainChallenges: Array.isArray(saved.userMainChallenges) ? saved.userMainChallenges : [],
      filhos: Array.isArray(saved.filhos) && saved.filhos.length > 0 ? saved.filhos : defaultState().filhos,
      routineChaosMoments: Array.isArray(saved.routineChaosMoments) ? saved.routineChaosMoments : [],
      routineSupportNeeds: Array.isArray(saved.routineSupportNeeds) ? saved.routineSupportNeeds : [],
      supportNetwork: Array.isArray(saved.supportNetwork) ? saved.supportNetwork : [],
      userContentPreferences: Array.isArray(saved.userContentPreferences) ? saved.userContentPreferences : [],
      userNotificationsPreferences: Array.isArray(saved.userNotificationsPreferences) ? saved.userNotificationsPreferences : [],
    }

    // Garantir figurinha válida
    if (merged.figurinha && !isProfileStickerId(merged.figurinha)) {
      merged.figurinha = undefined
    }

    setForm(merged)
  }, [])

  // Persist LS
  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  function onChange(updates: Partial<ProfileFormState>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  function onToggleArrayField(fieldName: keyof ProfileFormState, value: string) {
    const current = (form[fieldName] as unknown as string[] | undefined) ?? []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    setForm(prev => ({ ...prev, [fieldName]: next } as ProfileFormState))
  }

  const activeStickerId = form.figurinha

  const canGoNext = useMemo(() => {
    // Regras mínimas — sem travar experiência
    if (step === 1) return Boolean(form.nomeMae?.trim())
    if (step === 2) return (form.filhos?.length ?? 0) >= 1
    return true
  }, [step, form.nomeMae, form.filhos])

  function validateStep(): boolean {
    const nextErrors: FormErrors = {}

    if (step === 1) {
      if (!form.nomeMae?.trim()) nextErrors.nomeMae = 'Por favor, preencha seu nome.'
      if (form.figurinha && !isProfileStickerId(form.figurinha)) {
        nextErrors.figurinha = 'Selecione uma figurinha válida.'
      }
    }

    if (step === 2) {
      // Exemplo leve: se tiver idade negativa
      const childErrors: Record<string, string | undefined> = {}
      for (const c of form.filhos) {
        if (typeof c.idadeMeses === 'number' && c.idadeMeses < 0) {
          childErrors[c.id] = 'A idade não pode ser negativa.'
        }
      }
      if (Object.keys(childErrors).length > 0) nextErrors.filhos = childErrors
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goNext() {
    if (!validateStep()) return
    setStep(s => (s === 4 ? 4 : ((s + 1) as 1 | 2 | 3 | 4)))
  }

  function goPrev() {
    setErrors({})
    setStep(s => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3 | 4)))
  }

  function saveAndContinue() {
    try {
      track('eu360.profile.saved', {
        figurinha: activeStickerId ?? null,
        hasName: Boolean(form.nomeMae?.trim()),
        step,
      })
    } catch {}
  }

  return (
    <SectionWrapper>
      <Reveal>
        <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
          {/* Header */}
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-ink-muted)]">
              Seu perfil
            </p>
            <h2 className="mt-1 text-lg md:text-xl font-semibold text-[var(--color-ink)] leading-snug">
              Sobre você (sem pressa)
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-ink-muted)] leading-relaxed">
              Isso nos ajuda a adaptar o tom e as sugestões para a sua rotina real.
            </p>
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active={step === 1} number={1} label="Você" />
            <StepPill active={step === 2} number={2} label="Seu(s) filho(s)" />
            <StepPill active={step === 3} number={3} label="Rotina" />
            <StepPill active={step === 4} number={4} label="Rede & preferências" />
          </div>

          {/* Body */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
            {step === 1 ? (
              <AboutYouBlock form={form} errors={errors} onChange={onChange} />
            ) : null}

            {step === 2 ? (
              <ChildrenBlock form={form} errors={errors} onChange={onChange} />
            ) : null}

            {step === 3 ? (
              <RoutineBlock
                form={form}
                errors={errors}
                onChange={onChange}
                onToggleArrayField={onToggleArrayField}
              />
            ) : null}

            {step === 4 ? (
              <PreferencesBlock
                form={form}
                errors={errors}
                onChange={onChange}
                onToggleArrayField={onToggleArrayField}
              />
            ) : null}

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={step === 1}
                className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </SoftCard>

          {/* CTA */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.08)] p-4 md:p-5">
            <button
              type="button"
              onClick={saveAndContinue}
              className="w-full rounded-full bg-[#fd2597] text-white px-5 py-3 text-[13px] font-semibold shadow-[0_10px_26px_rgba(253,37,151,0.30)] hover:opacity-95 transition"
            >
              Salvar e continuar
            </button>
            <p className="mt-2 text-center text-[10px] text-[#6a6a6a]">
              Você poderá editar essas informações no seu Perfil.
            </p>
          </SoftCard>

          {/* Nota visual sutil (mantém tom premium) */}
          <div className="flex items-start gap-2 text-[11px] text-[#6a6a6a]">
            <AppIcon name="sparkles" size={16} className="text-[#fd2597]" decorative />
            <p>
              Esse formulário salva automaticamente e é usado apenas para personalizar sua experiência no Materna360.
            </p>
          </div>
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
