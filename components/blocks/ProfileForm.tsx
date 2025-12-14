'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'
import { ChildrenBlock } from './ProfileFormBlocks/ChildrenBlock'

/**
 * =========================================================
 * TYPES EXPORTADOS (os Blocks dependem disso)
 * =========================================================
 */

export type ChildProfile = {
  id: string
  nome?: string
  genero?: string
  idadeMeses?: number
}

export type ProfileFormState = {
  // Compat: blocks usam "figurinha"
  figurinha?: ProfileStickerId

  // Compat: versões antigas podem ter usado "sticker"
  sticker?: ProfileStickerId

  // Campos usados em blocks mais “antigos” (V1)
  nomeMae?: string
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro' | string
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve' | string
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite' | string

  // Campos usados no ProfileForm “novo” (V2)
  name?: string
  preferredName?: string
  role?: string
  feeling?: string
  biggestPain?: string[]
  energy?: string

  // Filhos
  filhos?: ChildProfile[]
}

export type FormErrors = {
  figurinha?: string
  nomeMae?: string
  userPreferredName?: string
  userRole?: string
  userMainChallenges?: string
  userEnergyPeakTime?: string

  // erros por filho, indexado por ID
  filhos?: Record<string, string | undefined>

  // fallback
  [key: string]: string | undefined | Record<string, string | undefined> | undefined
}

type Props = {
  form?: ProfileFormState
  errors?: FormErrors
  onChange?: (updates: Partial<ProfileFormState>) => void
}

/**
 * =========================================================
 * PERSISTÊNCIA LOCAL (EU360)
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

function normalizeState(raw: ProfileFormState): ProfileFormState {
  const next: ProfileFormState = { ...raw }

  // Normaliza sticker/figurinha
  const maybe = next.figurinha ?? next.sticker
  if (maybe && isProfileStickerId(maybe)) {
    next.figurinha = maybe
    next.sticker = maybe
  }

  // Compat: campos duplicados (name vs nomeMae etc.)
  if (!next.name && next.nomeMae) next.name = next.nomeMae
  if (!next.preferredName && next.userPreferredName) next.preferredName = next.userPreferredName
  if (!next.role && next.userRole) next.role = next.userRole
  if (!next.feeling && next.userEmotionalBaseline) next.feeling = next.userEmotionalBaseline
  if (!next.biggestPain && next.userMainChallenges) next.biggestPain = next.userMainChallenges
  if (!next.energy && next.userEnergyPeakTime) next.energy = next.userEnergyPeakTime

  // Filhos sempre array
  next.filhos = Array.isArray(next.filhos) ? next.filhos : []

  // Arrays sempre array
  next.userMainChallenges = Array.isArray(next.userMainChallenges) ? next.userMainChallenges : []
  next.biggestPain = Array.isArray(next.biggestPain) ? next.biggestPain : []

  return next
}

/**
 * =========================================================
 * UI: pills de etapas (visual)
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
 * COMPONENTE PRINCIPAL
 * - Controlled: se receber props, usa props
 * - Uncontrolled: se NÃO receber, gerencia state + LS
 * =========================================================
 */
export default function ProfileForm(props: Props) {
  const isControlled = Boolean(props.onChange && props.form)

  const [internalForm, setInternalForm] = useState<ProfileFormState>(() =>
    normalizeState({
      filhos: [],
      biggestPain: [],
      userMainChallenges: [],
    }),
  )

  const [internalErrors] = useState<FormErrors>({})

  // Hydrate LS apenas no modo UNCONTROLLED
  useEffect(() => {
    if (isControlled) return
    const saved = safeParseJSON<ProfileFormState>(safeGetLS(LS_KEY))
    if (saved) setInternalForm(normalizeState(saved))
  }, [isControlled])

  // Persist LS apenas no modo UNCONTROLLED
  useEffect(() => {
    if (isControlled) return
    safeSetLS(LS_KEY, JSON.stringify(internalForm))
  }, [internalForm, isControlled])

  const form = useMemo(() => {
    const base = isControlled ? (props.form as ProfileFormState) : internalForm
    return normalizeState(base)
  }, [isControlled, props.form, internalForm])

  const errors = useMemo(() => {
    return isControlled ? (props.errors ?? {}) : internalErrors
  }, [isControlled, props.errors, internalErrors])

  const onChange = useMemo(() => {
    if (isControlled && props.onChange) return props.onChange

    return (updates: Partial<ProfileFormState>) => {
      setInternalForm(prev => normalizeState({ ...prev, ...updates }))
    }
  }, [isControlled, props.onChange])

  function saveAndContinue() {
    try {
      track('eu360.profile.saved', {
        figurinha: form.figurinha ?? null,
        hasName: Boolean(form.nomeMae || form.name),
      })
    } catch {}
  }

  // Garantia: se selecionou figurinha no bloco, espelha em sticker (compat)
  useEffect(() => {
    if (!form.figurinha) return
    if (!isProfileStickerId(form.figurinha)) return
    if (form.sticker === form.figurinha) return
    onChange({ sticker: form.figurinha })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.figurinha])

  // “Pré-carrega” assets de stickers (leve)
  useEffect(() => {
    try {
      STICKER_OPTIONS.forEach(s => {
        const img = new Image()
        img.src = s.asset
      })
    } catch {}
  }, [])

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
            <StepPill active number={1} label="Você" />
            <StepPill number={2} label="Seu(s) filho(s)" />
            <StepPill number={3} label="Rotina" />
            <StepPill number={4} label="Rede & preferências" />
          </div>

          {/* Conteúdo (blocos) */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-6">
            {/* Step 1 */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">Você</h3>
              <p className="text-[12px] text-[#6a6a6a] mt-1">
                Pequenas escolhas aqui deixam o Materna360 muito mais “seu”.
              </p>
            </div>

            <AboutYouBlock form={form} errors={errors} onChange={onChange} />

            {/* Step 2 */}
            <div className="pt-2 border-t border-[#F5D7E5]" />

            <ChildrenBlock form={form} errors={errors} onChange={onChange} />
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
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
