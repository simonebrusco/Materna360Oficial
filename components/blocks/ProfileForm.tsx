'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
export type FormErrors = Record<string, string | undefined>

/**
 * Compatibilidade:
 * - AboutYouBlock usa form.figurinha
 * - Algumas telas antigas podem ter usado "sticker"
 * Para evitar regressões, suportamos os DOIS.
 */
export type ProfileFormState = {
  figurinha?: ProfileStickerId
  sticker?: ProfileStickerId

  name?: string
  preferredName?: string
  role?: string
  feeling?: string
  biggestPain?: string[]
  energy?: string
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
  const [draft, setDraft] = useState<ProfileDraft>({
    biggestPain: [],
  })

  useEffect(() => {
    const saved = safeParseJSON<ProfileDraft>(safeGetLS(LS_KEY))
    if (saved) {
      const normalized: ProfileDraft = { ...saved }

      // Normaliza: se vier "sticker" antigo, espelha em "figurinha"
      if (!normalized.figurinha && normalized.sticker && isProfileStickerId(normalized.sticker)) {
        normalized.figurinha = normalized.sticker
      }

      // Se vier figurinha, espelha em sticker (compat)
      if (!normalized.sticker && normalized.figurinha && isProfileStickerId(normalized.figurinha)) {
        normalized.sticker = normalized.figurinha
      }

      setDraft(normalized)
    }
  }, [])

  useEffect(() => {
    safeSetLS(LS_KEY, JSON.stringify(draft))
  }, [draft])

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

  function togglePain(label: string) {
    setDraft(prev => {
      const curr = prev.biggestPain ?? []
      const exists = curr.includes(label)
      const next = exists ? curr.filter(x => x !== label) : [...curr, label]
      return { ...prev, biggestPain: next }
    })
  }

  function saveAndContinue() {
    try {
      track('eu360.profile.saved', {
        figurinha: draft.figurinha ?? null,
        hasName: Boolean(draft.name),
      })
    } catch {}
  }

  const activeStickerId = draft.figurinha ?? draft.sticker ?? undefined

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

          {/* Card interno */}
          <SoftCard className="rounded-3xl bg-white border border-[#F5D7E5] shadow-[0_10px_26px_rgba(0,0,0,0.06)] p-4 md:p-6 space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">Sobre você</h3>
              <p className="text-[12px] text-[#6a6a6a] mt-1">
                Isso nos ajuda a adaptar as sugestões à sua rotina real.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-[#2f3a56]">Escolha uma figurinha de perfil</p>
              <p className="text-[11px] text-[#6a6a6a]">Escolha a vibe que mais combina com você hoje.</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {STICKER_OPTIONS.map(s => {
                  const active = activeStickerId === s.id

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (!isProfileStickerId(s.id)) return
                        setDraft(prev => ({ ...prev, figurinha: s.id, sticker: s.id }))
                        try {
                          track('eu360.profile.sticker_selected', { id: s.id })
                        } catch {}
                      }}
                      className={[
                        'rounded-2xl border px-3 py-3 text-left transition',
                        active
                          ? 'border-[#fd2597] bg-[#ffd8e6]/70 shadow-[0_10px_22px_rgba(253,37,151,0.18)]'
                          : 'border-[#f5d7e5] bg-white hover:bg-[#fff3f8]',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={[
                            'h-10 w-10 rounded-full flex items-center justify-center',
                            active ? 'bg-white' : 'bg-[#ffe1f1]',
                          ].join(' ')}
                          aria-hidden="true"
                        >
                          <AppIcon
                            name="sparkles"
                            className={active ? 'h-5 w-5 text-[#fd2597]' : 'h-5 w-5 text-[#fd2597]/90'}
                            decorative
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-[#2f3a56] truncate">{s.title}</p>
                          <p className="text-[10px] text-[#6a6a6a] leading-snug">{s.subtitle}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 pt-2">
              <Field label="Seu nome">
                <input
                  value={draft.name ?? ''}
                  onChange={e => setDraft(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=""
                  className="w-full rounded-xl border border-[#f5d7e5] bg-white px-3 py-2 text-[13px] text-[#2f3a56] outline-none focus:border-[#fd2597]/60"
                />
              </Field>

              <Field label="Como você prefere ser chamada?">
                <input
                  value={draft.preferredName ?? ''}
                  onChange={e => setDraft(prev => ({ ...prev, preferredName: e.target.value }))}
                  placeholder="Ex.: Ju, Mãe, Simone…"
                  className="w-full rounded-xl border border-[#f5d7e5] bg-white px-3 py-2 text-[13px] text-[#2f3a56] outline-none focus:border-[#fd2597]/60"
                />
                <p className="mt-1 text-[10px] text-[#6a6a6a]">Opcional, mas traz tudo mais pessoal.</p>
              </Field>

              <Field label="Você é:">
                <select
                  value={draft.role ?? ''}
                  onChange={e => setDraft(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full rounded-xl border border-[#f5d7e5] bg-white px-3 py-2 text-[13px] text-[#2f3a56] outline-none focus:border-[#fd2597]/60"
                >
                  <option value="">Selecione…</option>
                  <option value="mae">Mãe</option>
                  <option value="pai">Pai</option>
                  <option value="cuidador">Cuidador(a)</option>
                  <option value="outro">Outro</option>
                </select>
              </Field>

              <Field label="Como você se sente na maior parte dos dias com a maternidade?">
                <select
                  value={draft.feeling ?? ''}
                  onChange={e => setDraft(prev => ({ ...prev, feeling: e.target.value }))}
                  className="w-full rounded-xl border border-[#f5d7e5] bg-white px-3 py-2 text-[13px] text-[#2f3a56] outline-none focus:border-[#fd2597]/60"
                >
                  <option value="">Selecione…</option>
                  <option value="exausta">Exausta</option>
                  <option value="cansada">Cansada, mas dando conta</option>
                  <option value="oscilando">Oscilando</option>
                  <option value="equilibrada">Mais equilibrada</option>
                  <option value="energia">Com energia para mais</option>
                </select>
                <p className="mt-1 text-[10px] text-[#6a6a6a]">Opcional, mas ajuda a personalizar sugestões.</p>
              </Field>

              <div className="pt-1">
                <p className="text-[12px] font-semibold text-[#2f3a56]">Qual é o seu maior desafio hoje?</p>
                <div className="mt-2 grid gap-1.5">
                  {painOptions.map(label => {
                    const checked = (draft.biggestPain ?? []).includes(label)
                    return (
                      <label key={label} className="flex items-center gap-2 text-[12px] text-[#2f3a56]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePain(label)}
                          className="h-4 w-4 accent-[#fd2597]"
                        />
                        <span>{label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Field label="Quando você sente mais energia?">
                <select
                  value={draft.energy ?? ''}
                  onChange={e => setDraft(prev => ({ ...prev, energy: e.target.value }))}
                  className="w-full rounded-xl border border-[#f5d7e5] bg-white px-3 py-2 text-[13px] text-[#2f3a56] outline-none focus:border-[#fd2597]/60"
                >
                  <option value="">Selecione…</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                  <option value="varia">Varia muito</option>
                </select>
              </Field>
            </div>
          </SoftCard>

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-[#2f3a56]">{label}</p>
      {children}
    </div>
  )
}
