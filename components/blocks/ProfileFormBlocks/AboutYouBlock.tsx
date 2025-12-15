'use client'

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
  // Toggle restrito apenas ao campo correto (evita casts perigosos)
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
    <div className="space-y-4">
      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-main)]">
            Escolha uma figurinha de perfil
          </h3>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
            Escolha a vibe que mais combina com você hoje.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 max-w-3xl">
          {STICKER_OPTIONS.map((sticker) => {
            const isActive = form.figurinha === sticker.id

            return (
              <button
                key={sticker.id}
                type="button"
                onClick={() => onChange({ figurinha: sticker.id })}
                className={[
                  'group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border aspect-square',
                  'transition-colors duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isActive
                    ? [
                        // ✅ Active refinado (discreto + DS)
                        'border-[var(--color-brand)]/40',
                        'bg-[var(--color-soft-bg)]',
                        'shadow-[0_6px_18px_rgba(0,0,0,0.06)]',
                        'focus-visible:ring-[var(--color-brand)]',
                      ].join(' ')
                    : [
                        'border-[var(--color-border-soft)]',
                        'bg-white',
                        'hover:border-[var(--color-brand)]/25',
                        'hover:bg-[var(--color-soft-bg)]/40',
                        'hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]',
                        'focus-visible:ring-[var(--color-brand)]',
                      ].join(' '),
                ].join(' ')}
                aria-pressed={isActive}
                aria-label={`Selecionar figurinha ${sticker.label}`}
              >
                <span
                  className={[
                    'inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-full flex-shrink-0',
                    'transition-colors duration-200',
                    isActive ? 'bg-white' : 'bg-[var(--color-soft-bg)]',
                  ].join(' ')}
                >
                  <img
                    src={sticker.asset}
                    alt={sticker.label}
                    className="h-11 w-11 object-contain"
                    loading="lazy"
                  />
                </span>

                <div className="flex flex-col items-center gap-0.5 min-h-[32px] flex-1 justify-center">
                  <span className="text-[9px] font-bold text-[var(--color-text-main)] line-clamp-2 text-center leading-tight">
                    {sticker.label}
                  </span>
                  <span className="text-[8px] text-[var(--color-text-muted)] line-clamp-1 text-center">
                    {STICKER_DESCRIPTIONS[sticker.id]}
                  </span>
                </div>

                {/* ✅ micro-indicador de seleção (bem sutil) */}
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[var(--color-brand)]/55"
                  />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

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
          <option value="outro">Outro cuidador</option>
        </select>
        {errors.userRole && (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userRole}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">
          Como você se sente na maior parte dos dias com a maternidade?
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

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">Quando você sente mais energia?</label>
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
