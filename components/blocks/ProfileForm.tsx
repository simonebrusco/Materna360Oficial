'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

// Blocks
import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'
import { ChildrenBlock } from './ProfileFormBlocks/ChildrenBlock'
import { RoutineBlock } from './ProfileFormBlocks/RoutineBlock'
import { PreferencesBlock } from './ProfileFormBlocks/PreferencesBlock'

/**
 * =========================================================
 * TIPOS EXPORTADOS (CONTRATO ÚNICO PARA TODOS OS BLOCKS)
 * =========================================================
 */

// ✅ FormErrors: precisa aceitar "filhos" como objeto sem quebrar o index signature
export type FormErrors = Record<string, string | undefined> & {
  filhos?: Record<string, string | undefined>
}

export type ChildGender = 'nao-informar' | 'menina' | 'menino'

export type ChildProfile = {
  id: string
  nome?: string
  genero?: ChildGender
  idadeMeses?: number
}

/**
 * Compatibilidade e evolução:
 * - Blocks antigos/atuais usam chaves diferentes
 * - Para parar a cascata de erros, este type inclui TODAS as chaves usadas nos Blocks.
 */
export type ProfileFormState = {
  // Figurinhas
  figurinha?: ProfileStickerId
  sticker?: ProfileStickerId

  // AboutYouBlock (campos que apareceram nos erros)
  nomeMae?: string
  userPreferredName?: string
  preferredName?: string

  userRole?: 'mae' | 'pai' | 'cuidador' | 'outro'
  role?: 'mae' | 'pai' | 'cuidador' | 'outro'

  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  feeling?: string

  userMainChallenges?: string[]
  biggestPain?: string[]

  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'
  energy?: string

  // ChildrenBlock
  filhos?: ChildProfile[]

  // RoutineBlock (erro atual)
  routineChaosMoments?: string[]
  routineSupportNeeds?: string[]
  routineGoals?: string[]

  // PreferencesBlock
  userContentPreferences?: string[]
  userNotificationsPreferences?: string[]
}

type Step = 1 | 2 | 3 | 4

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

function normalizeForm(saved: ProfileFormState): ProfileFormState {
  const next: ProfileFormState = { ...saved }

  // figurinha/sticker compat
  const candidate = next.figurinha ?? next.sticker
  if (candidate && isProfileStickerId(candidate)) {
    next.figurinha = candidate
    next.sticker = candidate
  }

  // preferredName compat
  if (!next.userPreferredName && next.preferredName) next.userPreferredName = next.preferredName
  if (!next.preferredName && next.userPreferredName) next.preferredName = next.userPreferredName

  // role compat
  if (!next.userRole && next.role) next.userRole = next.role
  if (!next.role && next.userRole) next.role = next.userRole

  // arrays defaults
  next.userMainChallenges = Array.isArray(next.userMainChallenges) ? next.userMainChallenges : []
  next.biggestPain = Array.isArray(next.biggestPain) ? next.biggestPain : []
  next.userContentPreferences = Array.isArray(next.userContentPreferences) ? next.userContentPreferences : []
  next.routineChaosMoments = Array.isArray(next.routineChaosMoments) ? next.routineChaosMoments : []
  next.routineSupportNeeds = Array.isArray(next.routineSupportNeeds) ? next.routineSupportNeeds : []
  next.routineGoals = Array.isArray(next.routineGoals) ? next.routineGoals : []
  next.userNotificationsPreferences = Array.isArray(next.userNotificationsPreferences) ? next.userNotificationsPreferences : []

  // filhos default + saneamento
  if (!Array.isArray(next.filhos) || next.filhos.length === 0) {
    next.filhos = [{ id: makeId(), genero: 'nao-informar', nome: '', idadeMeses: undefined }]
  } else {
    next.filhos = next.filhos.map((c) => ({
      id: c.id || makeId(),
      nome: c.nome ?? '',
      genero: (c.genero ?? 'nao-informar') as ChildGender,
      idadeMeses: typeof c.idadeMeses === 'number' ? c.idadeMeses : undefined,
    }))
  }

  return next
}

export default function ProfileForm() {
  const [step, setStep] = useState<Step>(1)

  const [form, setForm] = useState<ProfileFormState>(() =>
    normalizeForm({
      userMainChallenges: [],
      biggestPain: [],
      userContentPreferences: [],
      userNotificationsPreferences: [],
      routineChaosMoments: [],
      routineSupportNeeds: [],
      routineGoals: [],
      filhos: [{ id: makeId(), genero: 'nao-informar', nome: '', idadeMeses: undefined }],
    }),
  )

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const saved = safeParseJSON<ProfileFormState>(safeGetLS(LS_KEY))
    if (saved) setForm(normalizeForm(saved))
  }, [])

  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  const onChange = (updates: Partial<ProfileFormState>) => {
    setForm((prev) => normalizeForm({ ...prev, ...updates }))
  }

  const canGoNext = useMemo(() => {
    // mínimo para evitar fricção: só exige nome no passo 1 (se você quiser)
    if (step === 1) return Boolean((form.nomeMae ?? '').trim())
    return true
  }, [step, form.nomeMae])

  function validateStep(current: Step) {
    const nextErrors: FormErrors = {}

    if (current === 1) {
      if (!form.nomeMae || !form.nomeMae.trim()) nextErrors.nomeMae = 'Por favor, coloque seu nome.'
      if (form.figurinha && !isProfileStickerId(form.figurinha)) nextErrors.figurinha = 'Figurinha inválida.'
    }

    // Exemplo de validação de filhos (leve)
    if (current === 2) {
      const childMap: Record<string, string | undefined> = {}
      const filhos = form.filhos ?? []
      filhos.forEach((c) => {
        if (typeof c.idadeMeses === 'number' && c.idadeMeses < 0) {
          childMap[c.id] = 'Idade em meses não pode ser negativa.'
        }
      })
      if (Object.keys(childMap).length > 0) nextErrors.filhos = childMap
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goNext() {
    if (!validateStep(step)) return
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s))
  }

  function goPrev() {
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
  }

  function save() {
    // salva já acontece pelo useEffect, aqui é “CTA” + tracking
    try {
      track('eu360.profile.saved', {
        step,
        figurinha: form.figurinha ?? null,
        hasName: Boolean(form.nomeMae),
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

          {/* Pills */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active={step === 1} number={1} label="Você" />
            <StepPill active={step === 2} number={2} label="Seu(s) filho(s)" />
            <StepPill active={step === 3} number={3} label="Rotina" />
            <StepPill active={step === 4} number={4} label="Rede & preferências" />
          </div>

          {/* Conteúdo */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
            {step === 1 ? <AboutYouBlock form={form} errors={errors} onChange={onChange} /> : null}
            {step === 2 ? <ChildrenBlock form={form} errors={errors} onChange={onChange} /> : null}
            {step === 3 ? <RoutineBlock form={form} errors={errors} onChange={onChange} /> : null}
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
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={save}
                  className="rounded-full bg-[#fd2597] text-white px-5 py-2.5 text-[12px] font-semibold shadow-lg hover:opacity-95 transition"
                >
                  Salvar e continuar
                </button>
              )}
            </div>

            {step === 1 && errors.nomeMae ? (
              <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.nomeMae}</p>
            ) : null}
          </SoftCard>

          <p className="text-center text-[10px] text-[#6a6a6a]">
            Você poderá editar essas informações no seu Perfil.
          </p>
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
