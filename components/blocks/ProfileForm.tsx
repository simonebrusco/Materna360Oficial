'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import { isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

// Blocks (atenção: imports com named export)
import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'
import { ChildrenBlock } from './ProfileFormBlocks/ChildrenBlock'
import { RoutineBlock } from './ProfileFormBlocks/RoutineBlock'
import { PreferencesBlock } from './ProfileFormBlocks/PreferencesBlock'

/**
 * =========================================================
 * TYPES (Fonte única — evita cascata)
 * =========================================================
 */

export type ChildGender = 'feminino' | 'masculino' | 'nao-informar'

export type ChildProfile = {
  id: string
  nome?: string
  genero?: ChildGender
  idadeMeses?: number
}

export type ProfileFormState = {
  // Compat (algumas telas usam "figurinha", outras já usaram "sticker")
  figurinha?: ProfileStickerId
  sticker?: ProfileStickerId

  // Step 1 — Você
  nomeMae?: string
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro'
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'

  // Step 2 — Filhos
  filhos: ChildProfile[]

  // Step 3 — Rotina
  routineChaosMoments?: string[]

  // Step 4 — Preferências
  userContentPreferences?: string[]
  userNotificationsPreferences?: string[]

  // (evita próximo erro que apareceu em log)
  supportNetwork?: string[]

  // Compat legado (se algo antigo ainda salvar no LS)
  name?: string
  preferredName?: string
}

/**
 * Erros tipados (SEM index signature).
 * Se você colocar [key: string], volta a quebrar o filhos?: Record.
 */
export type FormErrors = {
  // Step 1
  nomeMae?: string
  userPreferredName?: string
  userRole?: string
  userEmotionalBaseline?: string
  userMainChallenges?: string
  userEnergyPeakTime?: string

  // Step 2
  filhos?: Record<string, string | undefined>

  // Step 3
  routineChaosMoments?: string

  // Step 4
  userContentPreferences?: string
  userNotificationsPreferences?: string
  supportNetwork?: string

  // Geral
  _form?: string
}

/**
 * =========================================================
 * LS Helpers
 * =========================================================
 */

const LS_KEY = 'eu360_profile_v2'

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
  return Math.random().toString(36).slice(2, 10)
}

/**
 * =========================================================
 * UI Helpers
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
 * Default state
 * =========================================================
 */

function defaultState(): ProfileFormState {
  return {
    filhos: [
      {
        id: makeId(),
        nome: '',
        genero: 'nao-informar',
        idadeMeses: undefined,
      },
    ],
    userMainChallenges: [],
    routineChaosMoments: [],
    userContentPreferences: [],
    userNotificationsPreferences: [],
    supportNetwork: [],
  }
}

/**
 * =========================================================
 * Component
 * =========================================================
 */

export default function ProfileForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<ProfileFormState>(() => defaultState())
  const [errors, setErrors] = useState<FormErrors>({})

  // Load
  useEffect(() => {
    const saved = safeParseJSON<ProfileFormState>(safeGetLS(LS_KEY))
    if (!saved) return

    // Normaliza compat / legado
    const normalized: ProfileFormState = {
      ...defaultState(),
      ...saved,
      filhos: Array.isArray(saved.filhos) && saved.filhos.length > 0 ? saved.filhos : defaultState().filhos,
    }

    // Espelha "sticker" -> "figurinha" e vice-versa
    if (!normalized.figurinha && normalized.sticker && isProfileStickerId(normalized.sticker)) {
      normalized.figurinha = normalized.sticker
    }
    if (!normalized.sticker && normalized.figurinha && isProfileStickerId(normalized.figurinha)) {
      normalized.sticker = normalized.figurinha
    }

    // Legado: name/preferredName
    if (!normalized.nomeMae && normalized.name) normalized.nomeMae = normalized.name
    if (!normalized.userPreferredName && normalized.preferredName) normalized.userPreferredName = normalized.preferredName

    setForm(normalized)
  }, [])

  // Persist
  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  function onChange(updates: Partial<ProfileFormState>) {
    setForm(prev => {
      const next = { ...prev, ...updates }

      // Garante arrays e filhos
      if (!Array.isArray(next.filhos) || next.filhos.length === 0) next.filhos = defaultState().filhos
      if (!Array.isArray(next.userMainChallenges)) next.userMainChallenges = []
      if (!Array.isArray(next.routineChaosMoments)) next.routineChaosMoments = []
      if (!Array.isArray(next.userContentPreferences)) next.userContentPreferences = []
      if (!Array.isArray(next.userNotificationsPreferences)) next.userNotificationsPreferences = []
      if (!Array.isArray(next.supportNetwork)) next.supportNetwork = []

      // Se escolheu figurinha, espelha em sticker
      if (next.figurinha && isProfileStickerId(next.figurinha)) next.sticker = next.figurinha

      return next
    })
  }

  function onToggleArrayField(fieldName: keyof ProfileFormState, value: string) {
    const current = (form[fieldName] as string[] | undefined) ?? []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    onChange({ [fieldName]: next } as Partial<ProfileFormState>)
  }

  const activeStickerId = form.figurinha ?? form.sticker ?? undefined

  // Validação simples por step (mínima e estável)
  function validateStep(s: 1 | 2 | 3 | 4) {
    const nextErrors: FormErrors = {}

    if (s === 1) {
      if (!form.nomeMae || form.nomeMae.trim().length < 2) nextErrors.nomeMae = 'Digite seu nome.'
      if (!form.userRole) nextErrors.userRole = 'Selecione uma opção.'
    }

    if (s === 2) {
      const filhos = form.filhos ?? []
      const filhosErrors: Record<string, string | undefined> = {}

      filhos.forEach(child => {
        // Aqui você pode apertar a regra quando quiser.
        // Por enquanto, só garante que o objeto tem id.
        if (!child.id) filhosErrors[child.id || makeId()] = 'Registro inválido.'
      })

      if (Object.keys(filhosErrors).length > 0) nextErrors.filhos = filhosErrors
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goNext() {
    if (!validateStep(step)) return
    setStep(prev => (prev === 4 ? 4 : ((prev + 1) as 1 | 2 | 3 | 4)))
  }

  function goPrev() {
    setStep(prev => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3 | 4)))
  }

  function saveAndFinish() {
    if (!validateStep(step)) return

    try {
      track('eu360.profile.saved', {
        figurinha: activeStickerId ?? null,
        hasName: Boolean(form.nomeMae || form.name),
        step,
      })
    } catch {}

    // Aqui, por enquanto, só persistimos (já está no effect).
    // Se quiser, depois adicionamos toast / feedback.
  }

  const headerSubtitle = useMemo(() => {
    if (step === 1) return 'Isso nos ajuda a adaptar o tom e as sugestões para a sua rotina real.'
    if (step === 2) return 'Informações simples para sugerir conteúdos mais alinhados à sua fase.'
    if (step === 3) return 'Para reduzir atrito nos horários que mais te desgastam.'
    return 'Para o app te entregar o que faz sentido e no ritmo certo.'
  }, [step])

  return (
    <SectionWrapper>
      <Reveal>
        <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--color-ink-muted)]">
              Seu perfil
            </p>
            <h2 className="mt-1 text-lg md:text-xl font-semibold text-[var(--color-ink)] leading-snug">
              Sobre você (sem pressa)
            </h2>
            <p className="mt-1 text-[13px] text-[var(--color-ink-muted)] leading-relaxed">
              {headerSubtitle}
            </p>
          </div>

          {/* Stepper */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active={step === 1} number={1} label="Você" />
            <StepPill active={step === 2} number={2} label="Seu(s) filho(s)" />
            <StepPill active={step === 3} number={3} label="Rotina" />
            <StepPill active={step === 4} number={4} label="Rede & preferências" />
          </div>

          {/* Conteúdo */}
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

              {step < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={saveAndFinish}
                  className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition inline-flex items-center gap-2"
                >
                  <span>Salvar</span>
                  <AppIcon name="check" size={16} decorative />
                </button>
              )}
            </div>

            {errors._form ? (
              <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors._form}</p>
            ) : null}
          </SoftCard>

          <p className="text-center text-[10px] text-[#6a6a6a]">
            Você pode editar essas informações quando quiser.
          </p>
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
