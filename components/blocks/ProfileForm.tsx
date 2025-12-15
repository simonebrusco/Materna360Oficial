'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'
import { ChildrenBlock } from './ProfileFormBlocks/ChildrenBlock'
import { RoutineBlock } from './ProfileFormBlocks/RoutineBlock'
import { PreferencesBlock } from './ProfileFormBlocks/PreferencesBlock'

/**
 * =========================================================
 * EXPORTS NECESSÁRIOS PARA OS BLOCKS (fix definitivo do build)
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
  /** Compat: bloco antigo usa figurinha; alguns fluxos antigos podem ter usado sticker */
  figurinha?: ProfileStickerId
  sticker?: ProfileStickerId

  /** Campos “Você” */
  nomeMae?: string
  userPreferredName?: string
  preferredName?: string

  userRole?: 'mae' | 'pai' | 'outro'
  role?: string

  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  feeling?: string

  userMainChallenges?: string[]
  biggestPain?: string[]

  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'
  energy?: string

  /** Filhos */
  filhos?: ChildProfile[]

  /** Rotina */
  routineChaosMoments?: string[]
  routineSupportNeeds?: string[]

  /** Preferências / rede */
  userContentPreferences?: string[]
  userNotificationsPreferences?: string[]
  supportNetwork?: string[]
}

export type FormErrors = {
  nomeMae?: string
  userPreferredName?: string
  preferredName?: string
  userRole?: string
  userEmotionalBaseline?: string
  userMainChallenges?: string
  userEnergyPeakTime?: string

  routineChaosMoments?: string
  routineSupportNeeds?: string

  userContentPreferences?: string
  userNotificationsPreferences?: string
  supportNetwork?: string

  filhos?: Record<string, string | undefined>
}

/**
 * =========================================================
 * Storage helpers
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
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
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

const DEFAULT_CHILD: ChildProfile = {
  id: 'child-1',
  genero: 'nao-informar',
}

/**
 * =========================================================
 * ProfileForm (container)
 * =========================================================
 */
export default function ProfileForm() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<ProfileFormState>({
    filhos: [{ ...DEFAULT_CHILD, id: makeId() }],
    userMainChallenges: [],
    routineChaosMoments: [],
    routineSupportNeeds: [],
    userContentPreferences: [],
    userNotificationsPreferences: [],
    supportNetwork: [],
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Load
  useEffect(() => {
    const saved = safeParseJSON<ProfileFormState>(safeGetLS(LS_KEY))
    if (!saved) return

    // Normaliza figurinha/sticker
    const normalized: ProfileFormState = { ...saved }
    if (!normalized.figurinha && normalized.sticker && isProfileStickerId(normalized.sticker)) {
      normalized.figurinha = normalized.sticker
    }
    if (!normalized.sticker && normalized.figurinha && isProfileStickerId(normalized.figurinha)) {
      normalized.sticker = normalized.figurinha
    }

    // Normaliza filhos
    const filhos =
      Array.isArray(normalized.filhos) && normalized.filhos.length > 0
        ? normalized.filhos.map(c => ({
            id: c.id || makeId(),
            nome: c.nome ?? '',
            genero: c.genero ?? 'nao-informar',
            idadeMeses: typeof c.idadeMeses === 'number' ? c.idadeMeses : undefined,
          }))
        : [{ ...DEFAULT_CHILD, id: makeId() }]

    setForm(prev => ({
      ...prev,
      ...normalized,
      filhos,
      userMainChallenges: normalized.userMainChallenges ?? prev.userMainChallenges ?? [],
      routineChaosMoments: normalized.routineChaosMoments ?? prev.routineChaosMoments ?? [],
      routineSupportNeeds: normalized.routineSupportNeeds ?? prev.routineSupportNeeds ?? [],
      userContentPreferences: normalized.userContentPreferences ?? prev.userContentPreferences ?? [],
      userNotificationsPreferences:
        normalized.userNotificationsPreferences ?? prev.userNotificationsPreferences ?? [],
      supportNetwork: normalized.supportNetwork ?? prev.supportNetwork ?? [],
    }))
  }, [])

  // Persist
  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  const onChange = (updates: Partial<ProfileFormState>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  // helper local para toggle de arrays (sem prop extra nos blocks)
  const toggleArrayField = (fieldName: keyof ProfileFormState, value: string) => {
    setForm(prev => {
      const current = (prev[fieldName] as string[] | undefined) ?? []
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
      return { ...prev, [fieldName]: next }
    })
  }

  const activeStickerId = form.figurinha ?? form.sticker ?? undefined

  const canGoNext = useMemo(() => {
    // Mantém validação mínima por enquanto (sem travar experiência)
    if (step === 1) return true
    if (step === 2) return true
    if (step === 3) return true
    if (step === 4) return true
    return false
  }, [step])

  function goNext() {
    if (!canGoNext) return
    setStep(s => (s === 4 ? 4 : ((s + 1) as 1 | 2 | 3 | 4)))
  }

  function goPrev() {
    setStep(s => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3 | 4)))
  }

  function saveAndContinue() {
    try {
      track('eu360.profile.saved', {
        figurinha: activeStickerId ?? null,
        hasName: Boolean(form.nomeMae || form.name),
        step,
      })
    } catch {}

    // Mantém comportamento simples: não redireciona aqui.
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

          {/* Pills */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active={step === 1} number={1} label="Você" />
            <StepPill active={step === 2} number={2} label="Seu(s) filho(s)" />
            <StepPill active={step === 3} number={3} label="Rotina" />
            <StepPill active={step === 4} number={4} label="Rede & preferências" />
          </div>

          {/* Conteúdo */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
            {step === 1 ? (
              <AboutYouBlock
                form={form}
                errors={errors}
                onChange={(u) => {
                  // compat: garante figurinha+sticker sincronizados
                  if ('figurinha' in u && u.figurinha && isProfileStickerId(u.figurinha)) {
                    onChange({ ...u, sticker: u.figurinha })
                  } else {
                    onChange(u)
                  }
                }}
              />
            ) : null}

            {step === 2 ? (
              <ChildrenBlock
                form={form}
                errors={errors}
                onChange={onChange}
              />
            ) : null}

            {step === 3 ? (
              <RoutineBlock
                form={form}
                errors={errors}
                onChange={onChange}
              />
            ) : null}

            {step === 4 ? (
              <PreferencesBlock
                form={form}
                errors={errors}
                onChange={onChange}
              />
            ) : null}

            {/* NAV */}
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
                  onClick={saveAndContinue}
                  className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                >
                  Salvar e continuar
                </button>
              )}
            </div>

            {/* Observação */}
            <p className="text-[11px] text-[#6a6a6a] leading-relaxed">
              Isso fica salvo para personalizar a sua experiência. Você pode editar depois quando quiser.
            </p>
          </SoftCard>
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
