'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'

// Blocks
import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'
import { ChildrenBlock } from './ProfileFormBlocks/ChildrenBlock'
import { PreferencesBlock } from './ProfileFormBlocks/PreferencesBlock'

/**
 * =========================================================
 * TIPOS EXPORTADOS (contrato oficial dos Blocks)
 * =========================================================
 */

export type ChildGender = 'menino' | 'menina' | 'nao-informar'

export type ChildProfile = {
  id: string
  nome?: string
  genero?: ChildGender
  idadeMeses?: number
}

export type ProfileFormState = {
  figurinha?: string
  sticker?: string

  nomeMae?: string
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro'
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'

  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'

  filhos: ChildProfile[]

  userContentPreferences?: string[]
  userNotificationPreferences?: string[]
}

/**
 * - Sem index signature genérico
 * - filhos é um map por child.id
 */
export type FormErrors = {
  nomeMae?: string
  userPreferredName?: string
  userRole?: string
  userEmotionalBaseline?: string
  userMainChallenges?: string
  userEnergyPeakTime?: string

  userContentPreferences?: string
  userNotificationPreferences?: string

  filhos?: Record<string, string | undefined>
}

/**
 * =========================================================
 * STORAGE
 * =========================================================
 */
const LS_KEY = 'materna360_profile_form_v2'

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

function safeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

function isChildGender(value: unknown): value is ChildGender {
  return value === 'menino' || value === 'menina' || value === 'nao-informar'
}

/**
 * =========================================================
 * UI helpers
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

  const [form, setForm] = useState<ProfileFormState>(() => ({
    filhos: [{ id: safeId(), genero: 'nao-informar' as ChildGender }],
    userMainChallenges: [],
    userContentPreferences: [],
    userNotificationPreferences: [],
  }))

  const [errors, setErrors] = useState<FormErrors>({})

  // Load
  useEffect(() => {
    const saved = safeParseJSON<Partial<ProfileFormState>>(safeGetLS(LS_KEY))
    if (!saved) return

    // ✅ filhos SEM union: sempre ChildProfile[]
    const filhos: ChildProfile[] =
      Array.isArray(saved.filhos) && saved.filhos.length > 0
        ? saved.filhos.map((c) => {
            const genero: ChildGender = isChildGender(c.genero)
              ? c.genero
              : ('nao-informar' as ChildGender)

            return {
              id: c.id || safeId(),
              nome: c.nome ?? '',
              genero,
              idadeMeses: typeof c.idadeMeses === 'number' ? c.idadeMeses : undefined,
            }
          })
        : [{ id: safeId(), genero: 'nao-informar' as ChildGender }]

    setForm((prev) => ({
      ...prev,
      ...saved,
      filhos,
      userMainChallenges: Array.isArray(saved.userMainChallenges)
        ? saved.userMainChallenges
        : prev.userMainChallenges ?? [],
      userContentPreferences: Array.isArray(saved.userContentPreferences)
        ? saved.userContentPreferences
        : prev.userContentPreferences ?? [],
      userNotificationPreferences: Array.isArray(saved.userNotificationPreferences)
        ? saved.userNotificationPreferences
        : prev.userNotificationPreferences ?? [],
    }))
  }, [])

  // Save
  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  const onChange = (updates: Partial<ProfileFormState>) => {
    setForm((prev) => {
      const next: ProfileFormState = {
        ...prev,
        ...updates,
        filhos: Array.isArray((updates as ProfileFormState).filhos)
          ? (updates as ProfileFormState).filhos
          : prev.filhos,
        userMainChallenges: Array.isArray(updates.userMainChallenges)
          ? updates.userMainChallenges
          : prev.userMainChallenges ?? [],
        userContentPreferences: Array.isArray(updates.userContentPreferences)
          ? updates.userContentPreferences
          : prev.userContentPreferences ?? [],
        userNotificationPreferences: Array.isArray(updates.userNotificationPreferences)
          ? updates.userNotificationPreferences
          : prev.userNotificationPreferences ?? [],
      }

      // garantias mínimas (nunca undefined)
      if (!Array.isArray(next.filhos) || next.filhos.length === 0) {
        next.filhos = [{ id: safeId(), genero: 'nao-informar' as ChildGender }]
      }

      return next
    })
  }

  const canNext = useMemo(() => {
    if (step === 1) return true
    if (step === 2) return true
    if (step === 3) return true
    if (step === 4) return true
    return true
  }, [step])

  const goNext = () => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s))
  const goPrev = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))

  function validateAndSave() {
    const nextErrors: FormErrors = {}

    if (!form.nomeMae || String(form.nomeMae).trim().length < 2) {
      nextErrors.nomeMae = 'Por favor, preencha seu nome.'
    }

    if (form.filhos?.length) {
      const childErrs: Record<string, string | undefined> = {}
      for (const c of form.filhos) {
        if (typeof c.idadeMeses === 'number' && c.idadeMeses < 0) {
          childErrs[c.id] = 'Idade em meses inválida.'
        }
      }
      if (Object.keys(childErrs).length > 0) nextErrors.filhos = childErrs
    }

    setErrors(nextErrors)
    const ok = Object.keys(nextErrors).length === 0
    if (!ok) return

    try {
      track('eu360.profile.saved', {
        step: 4,
        hasNomeMae: Boolean(form.nomeMae),
        filhos: form.filhos?.length ?? 0,
      })
    } catch {}
  }

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
              Isso nos ajuda a adaptar o tom e as sugestões para a sua rotina real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active={step === 1} number={1} label="Você" />
            <StepPill active={step === 2} number={2} label="Seu(s) filho(s)" />
            <StepPill active={step === 3} number={3} label="Rotina" />
            <StepPill active={step === 4} number={4} label="Rede & preferências" />
          </div>

          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-5">
            {step === 1 ? <AboutYouBlock form={form} errors={errors} onChange={onChange} /> : null}
            {step === 2 ? <ChildrenBlock form={form} errors={errors} onChange={onChange} /> : null}

            {step === 3 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[var(--color-text-main)]">
                  Rotina (em construção)
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Vamos manter esta etapa simples por enquanto para estabilizar o build. Depois alinhamos com o layout premium.
                </p>
              </div>
            ) : null}

            {step === 4 ? <PreferencesBlock form={form} errors={errors} onChange={onChange} /> : null}

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
                  onClick={() => {
                    if (!canNext) return
                    goNext()
                  }}
                  className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={validateAndSave}
                  className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                >
                  Salvar e continuar
                </button>
              )}
            </div>

            {errors.nomeMae ? (
              <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.nomeMae}</p>
            ) : null}
          </SoftCard>

          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.08)] p-4 md:p-5">
            <p className="text-center text-[10px] text-[#6a6a6a]">
              Você poderá editar essas informações no seu Perfil.
            </p>
          </SoftCard>
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
