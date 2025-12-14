'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import { isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

// Blocks (atenção: imports como NAMED, para evitar erro de default export)
import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'
import { ChildrenBlock } from './ProfileFormBlocks/ChildrenBlock'
import { PreferencesBlock } from './ProfileFormBlocks/PreferencesBlock'

/**
 * =========================================================
 * EXPORTS NECESSÁRIOS PARA OS BLOCKS (compat definitiva)
 * =========================================================
 */

// errors genéricos + filhos por id
export type FormErrors = {
  [key: string]: string | undefined
  filhos?: Record<string, string | undefined>
}

export type ChildProfile = {
  id: string
  nome?: string
  genero?: string
  idadeMeses?: number
}

/**
 * ProfileFormState = contrato de compatibilidade entre blocks.
 * Mantemos campos "canônicos" + campos legados que ainda existem nos blocks.
 */
export type ProfileFormState = {
  // ✅ Figurinhas (compat)
  figurinha?: ProfileStickerId
  sticker?: ProfileStickerId

  // ✅ Canônicos (mais novos)
  name?: string
  preferredName?: string
  role?: string
  feeling?: string
  biggestPain?: string[]
  energy?: string
  filhos?: ChildProfile[]
  contentPreferences?: string[]
  notificationPreferences?: string[]

  // ✅ Legados (ainda usados em alguns blocks)
  nomeMae?: string
  userPreferredName?: string
  userRole?: string
  userEmotionalBaseline?: string
  userMainChallenges?: string[]
  userEnergyPeakTime?: string

  // ✅ Preferências (erro atual do PreferencesBlock)
  userContentPreferences?: string[]
  userNotificationPreferences?: string[]
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

function safeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

function normalizeDraft(input: ProfileFormState): ProfileFormState {
  const next: ProfileFormState = { ...input }

  // figurinha <-> sticker (compat)
  if (!next.figurinha && next.sticker && isProfileStickerId(next.sticker)) {
    next.figurinha = next.sticker
  }
  if (!next.sticker && next.figurinha && isProfileStickerId(next.figurinha)) {
    next.sticker = next.figurinha
  }

  // preferredName compat (legado -> canônico)
  if (!next.preferredName && next.userPreferredName) next.preferredName = next.userPreferredName
  if (!next.userPreferredName && next.preferredName) next.userPreferredName = next.preferredName

  // name compat
  if (!next.name && next.nomeMae) next.name = next.nomeMae
  if (!next.nomeMae && next.name) next.nomeMae = next.name

  // role compat
  if (!next.role && next.userRole) next.role = next.userRole
  if (!next.userRole && next.role) next.userRole = next.role

  // feeling compat
  if (!next.feeling && next.userEmotionalBaseline) next.feeling = next.userEmotionalBaseline
  if (!next.userEmotionalBaseline && next.feeling) next.userEmotionalBaseline = next.feeling

  // biggestPain compat
  if (!next.biggestPain && next.userMainChallenges) next.biggestPain = next.userMainChallenges
  if (!next.userMainChallenges && next.biggestPain) next.userMainChallenges = next.biggestPain

  // energy compat
  if (!next.energy && next.userEnergyPeakTime) next.energy = next.userEnergyPeakTime
  if (!next.userEnergyPeakTime && next.energy) next.userEnergyPeakTime = next.energy

  // preferences compat
  if (!next.contentPreferences && next.userContentPreferences) next.contentPreferences = next.userContentPreferences
  if (!next.userContentPreferences && next.contentPreferences) next.userContentPreferences = next.contentPreferences

  if (!next.notificationPreferences && next.userNotificationPreferences) next.notificationPreferences = next.userNotificationPreferences
  if (!next.userNotificationPreferences && next.notificationPreferences) next.userNotificationPreferences = next.notificationPreferences

  // defaults seguros
  if (!Array.isArray(next.biggestPain)) next.biggestPain = []
  if (!Array.isArray(next.userMainChallenges)) next.userMainChallenges = next.biggestPain ?? []
  if (!Array.isArray(next.contentPreferences)) next.contentPreferences = []
  if (!Array.isArray(next.userContentPreferences)) next.userContentPreferences = next.contentPreferences ?? []
  if (!Array.isArray(next.notificationPreferences)) next.notificationPreferences = []
  if (!Array.isArray(next.userNotificationPreferences)) next.userNotificationPreferences = next.notificationPreferences ?? []
  if (!Array.isArray(next.filhos)) next.filhos = []

  return next
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
  const [form, setForm] = useState<ProfileFormState>(() =>
    normalizeDraft({
      biggestPain: [],
      userMainChallenges: [],
      contentPreferences: [],
      userContentPreferences: [],
      notificationPreferences: [],
      userNotificationPreferences: [],
      filhos: [],
    }),
  )

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const saved = safeParseJSON<ProfileFormState>(safeGetLS(LS_KEY))
    if (saved) setForm(normalizeDraft(saved))
  }, [])

  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  const onChange = (updates: Partial<ProfileFormState>) => {
    setForm(prev => normalizeDraft({ ...prev, ...updates }))
  }

  const step = useMemo(() => {
    // heurística simples: se tiver filhos -> pelo menos step 2
    if ((form.filhos?.length ?? 0) > 0) return 2
    // se tiver prefs -> step 4
    if ((form.userContentPreferences?.length ?? 0) > 0 || (form.userNotificationPreferences?.length ?? 0) > 0) return 4
    // se tiver o básico do “Você”
    if (form.figurinha || form.nomeMae || form.userPreferredName || form.userRole) return 1
    return 1
  }, [form])

  function validate(): FormErrors {
    const next: FormErrors = {}

    // Mantemos como “soft”: só validamos nome se o block exigir required no input.
    // (AboutYouBlock tem required em alguns cenários)
    if (!form.nomeMae || form.nomeMae.trim().length < 2) {
      next.nomeMae = 'Digite seu nome para continuar.'
    }

    // filhos: se existir campo idadeMeses e vier inválido, marca por id
    const childErrors: Record<string, string> = {}
    for (const c of form.filhos ?? []) {
      if (typeof c.idadeMeses === 'number' && c.idadeMeses < 0) {
        childErrors[c.id] = 'Idade inválida.'
      }
    }
    if (Object.keys(childErrors).length > 0) next.filhos = childErrors

    // desafios (se o block marcar como obrigatório)
    if ((form.userMainChallenges?.length ?? 0) === 0 && (form.biggestPain?.length ?? 0) === 0) {
      // não bloqueia hard; só sinaliza se você quiser
      // next.userMainChallenges = 'Selecione pelo menos um desafio.'
    }

    return next
  }

  function saveAndContinue() {
    const v = validate()
    setErrors(v)

    const hasBlocking = Boolean(v.nomeMae) || (v.filhos && Object.keys(v.filhos).length > 0)
    if (hasBlocking) return

    try {
      track('eu360.profile.saved', {
        figurinha: form.figurinha ?? null,
        hasName: Boolean(form.nomeMae || form.name),
        childrenCount: form.filhos?.length ?? 0,
      })
    } catch {}
  }

  return (
    <SectionWrapper>
      <Reveal>
        <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.10)] px-5 py-5 md:px-7 md:py-7 space-y-5">
          <div className="flex items-start justify-between gap-3">
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

            <span className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffe1f1] border border-[#f5d7e5]">
              <AppIcon name="sparkles" className="h-5 w-5 text-[#fd2597]" decorative />
            </span>
          </div>

          {/* Pills (visual) */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active={step === 1} number={1} label="Você" />
            <StepPill active={step === 2} number={2} label="Seu(s) filho(s)" />
            <StepPill active={step === 3} number={3} label="Rotina" />
            <StepPill active={step === 4} number={4} label="Rede & preferências" />
          </div>

          {/* Card interno */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-5">
            {/* 1) VOCÊ */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">Sobre você</h3>
                <p className="text-[12px] text-[#6a6a6a] mt-1">
                  Escolha uma figurinha e ajuste o básico para o app falar com você do jeito certo.
                </p>
              </div>

              <AboutYouBlock form={form} errors={errors} onChange={onChange} />
            </div>

            <div className="pt-2 border-t border-[#F5D7E5]" />

            {/* 2) FILHOS */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">Seu(s) filho(s)</h3>
                <p className="text-[12px] text-[#6a6a6a] mt-1">
                  Só o essencial — para o Materna360 sugerir ideias mais alinhadas ao momento de vocês.
                </p>
              </div>

              <ChildrenBlock form={form} errors={errors} onChange={onChange} />
            </div>

            <div className="pt-2 border-t border-[#F5D7E5]" />

            {/* 3) PREFERÊNCIAS */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">Preferências</h3>
                <p className="text-[12px] text-[#6a6a6a] mt-1">
                  Você escolhe o que faz sentido receber aqui. Sem excesso.
                </p>
              </div>

              <PreferencesBlock form={form} errors={errors} onChange={onChange} />
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
              Você poderá editar essas informações depois.
            </p>
          </SoftCard>
        </SoftCard>
      </Reveal>
    </SectionWrapper>
  )
}
