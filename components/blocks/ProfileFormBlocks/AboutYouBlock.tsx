'use client'

import { useMemo, useState } from 'react'
import { STICKER_OPTIONS, type ProfileStickerId } from '@/app/lib/stickers'
import type {
  EmotionalBaseline,
  EnergyPeakTime,
  FormErrors,
  ProfileFormState,
  UserRole,
} from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void
}

const STICKER_DESCRIPTIONS: Record<ProfileStickerId, string> = {
  'mae-carinhosa': 'Amor nos pequenos gestos.',
  'mae-leve': 'Equilíbrio e presença.',
  'mae-determinada': 'Força com doçura.',
  'mae-criativa': 'Inventa e transforma.',
  'mae-tranquila': 'Serenidade e autocuidado.',
  'mae-resiliente': 'Cai, respira fundo e recomeça.',
}

const MAIN_CHALLENGES = [
  'Falta de tempo',
  'Culpa',
  'Organização da rotina',
  'Comportamento do filho',
  'Cansaço físico',
  'Relação com parceiro(a) / família',
] as const

type MainChallenge = (typeof MAIN_CHALLENGES)[number]

export function AboutYouBlock({ form, errors, onChange }: Props) {
  const [isVibePickerOpen, setIsVibePickerOpen] = useState(false)

  const selectedSticker = useMemo(() => {
    const found = STICKER_OPTIONS.find((s) => s.id === form.figurinha)
    return found ?? null
  }, [form.figurinha])

  const toggleMainChallenge = (value: MainChallenge) => {
    const current = form.userMainChallenges ?? []
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    onChange({ userMainChallenges: updated })
  }

  const onSelectRole = (raw: string) => {
    const value = raw as UserRole
    onChange({ userRole: raw ? value : undefined })
  }

  const onSelectEmotionalBaseline = (raw: string) => {
    const value = raw as EmotionalBaseline
    onChange({ userEmotionalBaseline: raw ? value : undefined })
  }

  const onSelectEnergyPeakTime = (raw: string) => {
    const value = raw as EnergyPeakTime
    onChange({ userEnergyPeakTime: raw ? value : undefined })
  }

  return (
    <div className="space-y-6">
      {/* VIBE / FIGURINHA (compacta + opcional abrir) */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Sua vibe</h3>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Um toque discreto no seu perfil — o app usa isso para ajustar o tom.
          </p>
        </div>

        {/* Resumo compacto da vibe selecionada */}
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[#fff7fb] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ffd8e6]">
                {selectedSticker ? (
                  <selectedSticker.Icon className="h-4.5 w-4.5 text-[#2f3a56]" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#fd2597]" aria-hidden />
                )}
              </span>

              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[var(--color-text-main)]">
                  {selectedSticker ? selectedSticker.label : 'Escolha uma vibe'}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                  {selectedSticker ? STICKER_DESCRIPTIONS[selectedSticker.id] : 'Você pode escolher agora ou depois.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVibePickerOpen((v) => !v)}
              className="rounded-full bg-white border border-[var(--color-border-soft)] px-3 py-2 text-[11px] font-semibold text-[#2f3a56] hover:bg-[#ffe1f1] transition"
            >
              {isVibePickerOpen ? 'Fechar' : 'Trocar vibe'}
            </button>
          </div>

          {errors.figurinha && (
            <p className="mt-2 text-[11px] text-[var(--color-brand)] font-medium">{errors.figurinha}</p>
          )}

          {/* Picker compactado */}
          {isVibePickerOpen ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STICKER_OPTIONS.map((sticker) => {
                const isActive = form.figurinha === sticker.id
                const Icon = sticker.Icon

                return (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => {
                      onChange({ figurinha: sticker.id })
                      setIsVibePickerOpen(false)
                    }}
                    className={[
                      'group w-full rounded-2xl border px-3 py-2 text-left transition',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand)]',
                      isActive
                        ? 'border-[var(--color-brand)]/45 bg-white shadow-[0_10px_22px_rgba(0,0,0,0.06)]'
                        : 'border-[var(--color-border-soft)] bg-white hover:bg-[#fff7fb] hover:border-[var(--color-brand)]/25',
                    ].join(' ')}
                    aria-pressed={isActive}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          'grid h-8 w-8 place-items-center rounded-full transition',
                          isActive ? 'bg-[#ffd8e6]' : 'bg-[var(--color-soft-bg)]',
                        ].join(' ')}
                      >
                        <Icon className="h-4 w-4 text-[#2f3a56]" />
                      </span>

                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[var(--color-text-main)] leading-tight">
                          {sticker.label}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-1">
                          {STICKER_DESCRIPTIONS[sticker.id]}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <label htmlFor="mother-name" className="text-xs font-medium text-[var(--color-text-main)]">
          Seu nome
        </label>
        <input
          id="mother-name"
          type="text"
          required
          value={form.nomeMae}
          onChange={(event) => onChange({ nomeMae: event.target.value })}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 ${
            errors.nomeMae
              ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30'
              : 'border-[var(--color-border-soft)]'
          }`}
          aria-invalid={Boolean(errors.nomeMae)}
        />
        {errors.nomeMae && (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.nomeMae}</p>
        )}
      </div>

      {/* Preferência de nome */}
      <div className="space-y-2">
        <label htmlFor="preferred-name" className="text-xs font-medium text-[var(--color-text-main)]">
          Como você prefere ser chamada?
        </label>
        <input
          id="preferred-name"
          type="text"
          value={form.userPreferredName || ''}
          onChange={(event) => onChange({ userPreferredName: event.target.value })}
          placeholder="Ex.: Ju, Mãe, Simone..."
          className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30"
        />
        <p className="text-[11px] text-[var(--color-text-muted)]">Opcional, mas faz tudo mais pessoal.</p>
      </div>

      {/* Papel */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">Você é:</label>
        <select
          value={form.userRole || ''}
          onChange={(event) => onSelectRole(event.target.value)}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none ${
            errors.userRole
              ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30'
              : 'border-[var(--color-border-soft)]'
          }`}
        >
          <option value="">Selecione...</option>
          <option value="mae">Mãe</option>
          <option value="pai">Pai</option>
          <option value="cuidador">Cuidador(a)</option>
          <option value="outro">Outro</option>
        </select>
        {errors.userRole && (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userRole}</p>
        )}
      </div>

      {/* Baseline emocional */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">
          Como você se sente na maior parte dos dias?
        </label>
        <select
          value={form.userEmotionalBaseline || ''}
          onChange={(event) => onSelectEmotionalBaseline(event.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="sobrecarregada">Muito sobrecarregada</option>
          <option value="cansada">Cansada, mas dando conta</option>
          <option value="equilibrada">Equilibrada na maior parte do tempo</option>
          <option value="leve">Em uma fase mais leve</option>
        </select>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Opcional, mas ajuda a personalizar sugestões.
        </p>
      </div>

      {/* Desafio principal */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">
          Qual é o seu maior desafio hoje?
        </label>
        <div className="space-y-2">
          {MAIN_CHALLENGES.map((challenge) => (
            <label key={challenge} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(form.userMainChallenges || []).includes(challenge)}
                onChange={() => toggleMainChallenge(challenge)}
                className="h-4 w-4 rounded border-[var(--color-border-soft)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/30"
              />
              <span className="text-xs text-[var(--color-text-main)]">{challenge}</span>
            </label>
          ))}
        </div>
        {errors.userMainChallenges && (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userMainChallenges}</p>
        )}
      </div>

      {/* Pico de energia */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">
          Quando você sente mais energia?
        </label>
        <select
          value={form.userEnergyPeakTime || ''}
          onChange={(event) => onSelectEnergyPeakTime(event.target.value)}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none ${
            errors.userEnergyPeakTime
              ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30'
              : 'border-[var(--color-border-soft)]'
          }`}
        >
          <option value="">Selecione...</option>
          <option value="manha">Manhã (acordar, começar o dia)</option>
          <option value="tarde">Tarde (meio do dia)</option>
          <option value="noite">Noite (depois que crianças dormem)</option>
        </select>
        {errors.userEnergyPeakTime && (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userEnergyPeakTime}</p>
        )}
      </div>
    </div>
  )
}
