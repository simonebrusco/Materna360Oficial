'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import { STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

/**
 * =========================================================
 * EXPORTS NECESSÁRIOS PARA OS BLOCKS (fix do build)
 * =========================================================
 */
export type FormErrors = {
  [key: string]: string | undefined
  filhos?: Record<string, string | undefined>
}

/**
 * =========================================================
 * TIPOS (COM COMPATIBILIDADE LEGADA)
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
  // ✅ figurinha atual
  figurinha?: ProfileStickerId

  // ✅ compat legado: algumas telas antigas podem ter usado "sticker"
  sticker?: ProfileStickerId

  // ✅ campos atuais (blocos usam estes)
  nomeMae?: string
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro'
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'
  filhos?: ChildProfile[]

  // ✅ preferências
  userContentPreferences?: string[]
  userNotificationsPreferences?: string[]

  // ✅ compat legado: versões anteriores do ProfileForm tinham "name"
  name?: string
}

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
  return `c_${Math.random().toString(16).slice(2)}_${Date.now()}`
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

export default function ProfileForm() {
  const [form, setForm] = useState<ProfileFormState>({
    filhos: [{ id: makeId(), genero: 'nao-informar' }],
    userMainChallenges: [],
    userContentPreferences: [],
    userNotificationsPreferences: [],
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  useEffect(() => {
    const saved = safeParseJSON<ProfileFormState>(safeGetLS(LS_KEY))
    if (!saved) return

    const normalized: ProfileFormState = { ...saved }

    // ✅ compat figurinha/sticker
    if (!normalized.figurinha && normalized.sticker && isProfileStickerId(normalized.sticker)) {
      normalized.figurinha = normalized.sticker
    }
    if (!normalized.sticker && normalized.figurinha && isProfileStickerId(normalized.figurinha)) {
      normalized.sticker = normalized.figurinha
    }

    // ✅ compat name <-> nomeMae
    if (!normalized.nomeMae && typeof normalized.name === 'string') {
      normalized.nomeMae = normalized.name
    }
    if (!normalized.name && typeof normalized.nomeMae === 'string') {
      normalized.name = normalized.nomeMae
    }

    // ✅ default filhos
    if (!Array.isArray(normalized.filhos) || normalized.filhos.length === 0) {
      normalized.filhos = [{ id: makeId(), genero: 'nao-informar' }]
    } else {
      normalized.filhos = normalized.filhos.map(c => ({
        id: c.id || makeId(),
        nome: c.nome ?? '',
        genero: c.genero ?? 'nao-informar',
        idadeMeses: typeof c.idadeMeses === 'number' ? c.idadeMeses : undefined,
      }))
    }

    // ✅ defaults arrays
    normalized.userMainChallenges = normalized.userMainChallenges ?? []
    normalized.userContentPreferences = normalized.userContentPreferences ?? []
    normalized.userNotificationsPreferences = normalized.userNotificationsPreferences ?? []

    setForm(prev => ({ ...prev, ...normalized }))
  }, [])

  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  const activeStickerId = form.figurinha ?? form.sticker ?? undefined

  const painOptions = useMemo(
    () => [
      'Falta de tempo',
      'Culpa',
      'Organização da rotina',
      'Comportamento do filho',
      'Cansaço físico',
      'Relação com parceiro(a) / família',
    ],
    [],
  )

  const onChange = (updates: Partial<ProfileFormState>) => {
    setForm(prev => {
      const next = { ...prev, ...updates }

      // manter espelho nomeMae <-> name (compat)
      if (typeof next.nomeMae === 'string' && !updates.name) next.name = next.nomeMae
      if (typeof next.name === 'string' && !updates.nomeMae) next.nomeMae = next.name

      // manter espelho figurinha <-> sticker (compat)
      if (next.figurinha && isProfileStickerId(next.figurinha)) next.sticker = next.figurinha
      if (next.sticker && isProfileStickerId(next.sticker) && !next.figurinha) next.figurinha = next.sticker

      return next
    })
  }

  const onToggleArrayField = (fieldName: keyof ProfileFormState, value: string) => {
    const current = (form[fieldName] as string[] | undefined) ?? []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    onChange({ [fieldName]: next } as Partial<ProfileFormState>)
  }

  function saveAndContinue() {
    // (validação mínima aqui se quiser; por enquanto só tracking)
    try {
      track('eu360.profile.saved', {
        figurinha: activeStickerId ?? null,
        hasName: Boolean(form.nomeMae || form.name),
        step,
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

          {/* Conteúdo (mantém o layout premium) */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                {step === 1
                  ? 'Sobre você'
                  : step === 2
                    ? 'Seu(s) filho(s)'
                    : step === 3
                      ? 'Rotina'
                      : 'Rede & preferências'}
              </h3>

              <span className="text-[11px] text-[#6a6a6a] inline-flex items-center gap-1">
                <AppIcon name="sparkles" className="h-4 w-4 text-[#fd2597]" decorative />
                Passo {step}/4
              </span>
            </div>

            {/* IMPORTANTE:
               Aqui você continua renderizando seus blocks (AboutYouBlock/ChildrenBlock/RoutineBlock/PreferencesBlock)
               — não mexi para não inventar estrutura diferente.
               Se quiser, cole seu ProfileForm atual completo (com imports) e eu te devolvo com TODOS os blocks alinhados.
            */}
            <p className="text-[12px] text-[#6a6a6a]">
              Estrutura pronta. Agora é só garantir que os blocks usem os mesmos campos do ProfileFormState.
            </p>
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
