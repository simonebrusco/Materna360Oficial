'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { SectionWrapper } from '@/components/common/SectionWrapper'
import { SoftCard } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/app/lib/telemetry'
import { isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'

import { AboutYouBlock } from './ProfileFormBlocks/AboutYouBlock'

/**
 * =========================================================
 * EXPORTS NECESSÁRIOS PARA OS BLOCKS (fix do build)
 * =========================================================
 */
export type FormErrors = Record<string, string | undefined>

/**
 * =========================================================
 * ProfileFormState — CONTRATO “UNIFICADO”
 * ---------------------------------------------------------
 * Este tipo precisa suportar:
 * 1) Os campos usados nos Blocks atuais (ex.: AboutYouBlock)
 * 2) Campos legados/alternativos usados em versões anteriores
 * 3) Persistência sem quebrar o app (localStorage)
 *
 * Estratégia: manter os campos "novos" + aliases legados,
 * e normalizar/espelhar automaticamente (normalizeDraft()).
 * =========================================================
 */
export type ProfileFormState = {
  /**
   * Stickers (perfil)
   * - AboutYouBlock usa: figurinha
   * - Algumas telas/versões antigas usavam: sticker
   */
  figurinha?: ProfileStickerId
  sticker?: ProfileStickerId

  /**
   * Nome
   * - AboutYouBlock usa: nomeMae
   * - Algumas telas usam: name
   */
  nomeMae?: string
  name?: string

  /**
   * Como prefere ser chamada
   * - AboutYouBlock usa: userPreferredName
   * - Versões “novas” usam: preferredName
   * - Alguns rascunhos antigos: nomePreferido
   */
  userPreferredName?: string
  preferredName?: string
  nomePreferido?: string

  /**
   * Você é:
   * - AboutYouBlock usa: userRole
   * - Algumas telas usam: role
   */
  userRole?: 'mae' | 'pai' | 'outro' | string
  role?: 'mae' | 'pai' | 'cuidador' | 'outro' | string

  /**
   * Base emocional
   * - AboutYouBlock usa: userEmotionalBaseline
   * - Algumas telas usam: feeling
   */
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve' | string
  feeling?: 'exausta' | 'cansada' | 'oscilando' | 'equilibrada' | 'energia' | string

  /**
   * Desafios
   * - AboutYouBlock usa: userMainChallenges (array)
   * - Algumas telas usam: biggestPain (array)
   */
  userMainChallenges?: string[]
  biggestPain?: string[]

  /**
   * Pico de energia
   * - AboutYouBlock usa: userEnergyPeakTime
   * - Algumas telas usam: energy
   */
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite' | 'varia' | string
  energy?: 'manha' | 'tarde' | 'noite' | 'varia' | string
}

type ProfileDraft = ProfileFormState

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

/**
 * =========================================================
 * NORMALIZAÇÃO / COMPATIBILIDADE
 * ---------------------------------------------------------
 * Espelha campos entre versões/blocks para:
 * - parar a cascata de erros
 * - evitar “campo fantasma” em UI diferente
 * - manter localStorage coerente
 * =========================================================
 */
function normalizeDraft(input: ProfileDraft): ProfileDraft {
  const d: ProfileDraft = { ...input }

  // ---------------------------
  // figurinha <-> sticker
  // ---------------------------
  if (d.figurinha && isProfileStickerId(d.figurinha)) {
    d.sticker = d.figurinha
  } else if (d.sticker && isProfileStickerId(d.sticker)) {
    d.figurinha = d.sticker
  }

  // ---------------------------
  // nomeMae <-> name
  // ---------------------------
  if (typeof d.nomeMae === 'string' && !d.name) d.name = d.nomeMae
  if (typeof d.name === 'string' && !d.nomeMae) d.nomeMae = d.name

  // ---------------------------
  // userPreferredName <-> preferredName <-> nomePreferido
  // ---------------------------
  const preferred =
    d.userPreferredName?.trim() ||
    d.preferredName?.trim() ||
    d.nomePreferido?.trim() ||
    ''

  if (preferred) {
    d.userPreferredName = preferred
    d.preferredName = preferred
    d.nomePreferido = preferred
  }

  // ---------------------------
  // userRole <-> role
  // ---------------------------
  if (d.userRole && !d.role) d.role = d.userRole
  if (d.role && !d.userRole) d.userRole = d.role

  // ---------------------------
  // userEmotionalBaseline <-> feeling
  // (mantém ambos; não tenta “converter” valores diferentes)
  // ---------------------------
  if (d.userEmotionalBaseline && !d.feeling) d.feeling = d.userEmotionalBaseline
  if (d.feeling && !d.userEmotionalBaseline) d.userEmotionalBaseline = d.feeling

  // ---------------------------
  // userMainChallenges <-> biggestPain
  // ---------------------------
  if (Array.isArray(d.userMainChallenges) && (!d.biggestPain || !Array.isArray(d.biggestPain))) {
    d.biggestPain = d.userMainChallenges
  }
  if (Array.isArray(d.biggestPain) && (!d.userMainChallenges || !Array.isArray(d.userMainChallenges))) {
    d.userMainChallenges = d.biggestPain
  }

  // ---------------------------
  // userEnergyPeakTime <-> energy
  // ---------------------------
  if (d.userEnergyPeakTime && !d.energy) d.energy = d.userEnergyPeakTime
  if (d.energy && !d.userEnergyPeakTime) d.userEnergyPeakTime = d.energy

  // Garantias de array
  if (!Array.isArray(d.userMainChallenges)) d.userMainChallenges = []
  if (!Array.isArray(d.biggestPain)) d.biggestPain = []

  return d
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
  const [form, setForm] = useState<ProfileDraft>(() =>
    normalizeDraft({
      userMainChallenges: [],
      biggestPain: [],
    }),
  )

  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const saved = safeParseJSON<ProfileDraft>(safeGetLS(LS_KEY))
    if (saved) setForm(normalizeDraft(saved))
  }, [])

  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(form))
  }, [form])

  const onChange = (updates: Partial<ProfileFormState>) => {
    setForm(prev => normalizeDraft({ ...prev, ...updates }))
    setErrors(prev => {
      // limpa erros dos campos alterados
      const next = { ...prev }
      for (const k of Object.keys(updates)) next[k] = undefined
      return next
    })
  }

  const canSave = useMemo(() => {
    // validações mínimas para não travar UX
    // nome obrigatório apenas se o block estiver exigindo
    return Boolean((form.nomeMae || form.name || '').trim())
  }, [form.nomeMae, form.name])

  const saveAndContinue = () => {
    const nextErrors: FormErrors = {}

    if (!((form.nomeMae || form.name || '').trim())) {
      nextErrors.nomeMae = 'Por favor, preencha seu nome.'
    }

    // (opcional) role obrigatório se quiser reforçar
    if (!form.userRole && !form.role) {
      // não bloqueia, mas você pode ligar depois
    }

    setErrors(nextErrors)

    if (Object.values(nextErrors).some(Boolean)) return

    try {
      track('eu360.profile.saved', {
        figurinha: form.figurinha ?? null,
        hasName: Boolean((form.nomeMae || form.name || '').trim()),
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

          {/* Pills (visual only; mantém a pegada do print) */}
          <div className="flex flex-wrap gap-2 rounded-3xl border border-[#f5d7e5] bg-[#fff7fb] px-3 py-3">
            <StepPill active number={1} label="Você" />
            <StepPill number={2} label="Seu(s) filho(s)" />
            <StepPill number={3} label="Rotina" />
            <StepPill number={4} label="Rede & preferências" />
          </div>

          {/* Card interno (conteúdo do Step 1) */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">Sobre você</h3>
              <p className="text-[12px] text-[#6a6a6a] mt-1">
                Escolhas rápidas para o app conversar com a sua fase de um jeito mais leve.
              </p>
            </div>

            <AboutYouBlock form={form} errors={errors} onChange={onChange} />
          </SoftCard>

          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.08)] p-4 md:p-5">
            <button
              type="button"
              onClick={saveAndContinue}
              disabled={!canSave}
              className={[
                'w-full rounded-full px-5 py-3 text-[13px] font-semibold transition',
                canSave
                  ? 'bg-[#fd2597] text-white shadow-[0_10px_26px_rgba(253,37,151,0.30)] hover:opacity-95'
                  : 'bg-[#ffd8e6] text-[#2f3a56] opacity-70 cursor-not-allowed',
              ].join(' ')}
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
