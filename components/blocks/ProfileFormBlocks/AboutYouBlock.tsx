'use client'

import { STICKER_OPTIONS, isProfileStickerId, type ProfileStickerId } from '@/app/lib/stickers'
import { FormErrors, ProfileFormState } from '../ProfileForm'

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

export function AboutYouBlock({ form, errors, onChange }: Props) {
  const toggleArrayField = (fieldName: keyof ProfileFormState, value: string) => {
    const current = form[fieldName] as string[] | undefined
    const updated = (current || []).includes(value)
      ? (current || []).filter((item) => item !== value)
      : [...(current || []), value]
    onChange({ [fieldName]: updated })
  }

  return (
    <div className="rounded-3xl bg-white p-6 border border-[var(--color-border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Sobre você</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">Isso nos ajuda a adaptar as sugestões à sua rotina real.</p>
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Escolha uma figurinha de perfil</h3>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Escolha a vibe que mais combina com você hoje.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STICKER_OPTIONS.map((sticker) => {
            const isActive = form.figurinha === sticker.id
            return (
              <button
                key={sticker.id}
                type="button"
                onClick={() => onChange({ figurinha: sticker.id })}
                className={`group relative flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/30 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5 shadow-sm'
                    : 'border-[var(--color-border-soft)] bg-white hover:border-[var(--color-brand)]/30 hover:shadow-sm'
                }`}
                aria-pressed={isActive}
                aria-label={`Selecionar figurinha ${sticker.label}`}
              >
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-all duration-300 ${
                    isActive ? 'bg-[var(--color-brand)]/10' : 'bg-[var(--color-soft-bg)]'
                  }`}
                >
                  <img
                    src={sticker.asset}
                    alt={sticker.label}
                    className="h-9 w-9 object-contain"
                    loading="lazy"
                  />
                </span>
                <span className="text-[10px] font-semibold text-[var(--color-text-main)] line-clamp-2">{sticker.label}</span>
                <span className="text-[9px] text-[var(--color-text-muted)] line-clamp-2">{STICKER_DESCRIPTIONS[sticker.id]}</span>
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
            errors.nomeMae ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30' : 'border-[var(--color-border-soft)]'
          }`}
          aria-invalid={Boolean(errors.nomeMae)}
        />
        {errors.nomeMae && <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.nomeMae}</p>}
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
          onChange={(event) => onChange({ userRole: event.target.value as any })}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none ${
            errors.userRole ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30' : 'border-[var(--color-border-soft)]'
          }`}
        >
          <option value="">Selecione...</option>
          <option value="mae">Mãe</option>
          <option value="pai">Pai</option>
          <option value="outro">Outro cuidador</option>
        </select>
        {errors.userRole && <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userRole}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">
          Como você se sente na maior parte dos dias com a maternidade?
        </label>
        <select
          value={form.userEmotionalBaseline || ''}
          onChange={(event) => onChange({ userEmotionalBaseline: event.target.value as any })}
          className="w-full rounded-xl border border-[var(--color-border-soft)] bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="sobrecarregada">Muito sobrecarregada</option>
          <option value="cansada">Cansada, mas dando conta</option>
          <option value="equilibrada">Equilibrada na maior parte do tempo</option>
          <option value="leve">Em uma fase mais leve</option>
        </select>
        <p className="text-[11px] text-[var(--color-text-muted)]">Opcional, mas ajuda a personalizar sugestões.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">Qual é o seu maior desafio hoje?</label>
        <div className="space-y-2">
          {['Falta de tempo', 'Culpa', 'Organização da rotina', 'Comportamento do filho', 'Cansaço físico', 'Relação com parceiro(a) / família'].map(
            (challenge) => (
              <label key={challenge} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.userMainChallenges || []).includes(challenge)}
                  onChange={() => toggleArrayField('userMainChallenges', challenge)}
                  className="h-4 w-4 rounded border-[var(--color-border-soft)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/30"
                />
                <span className="text-xs text-[var(--color-text-main)]">{challenge}</span>
              </label>
            )
          )}
        </div>
        {errors.userMainChallenges && <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userMainChallenges}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--color-text-main)]">Quando você sente mais energia?</label>
        <select
          value={form.userEnergyPeakTime || ''}
          onChange={(event) => onChange({ userEnergyPeakTime: event.target.value as any })}
          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[var(--color-text-main)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 appearance-none ${
            errors.userEnergyPeakTime ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/30' : 'border-[var(--color-border-soft)]'
          }`}
        >
          <option value="">Selecione...</option>
          <option value="manha">Manhã (acordar, começar o dia)</option>
          <option value="tarde">Tarde (meio do dia)</option>
          <option value="noite">Noite (depois que crianças dormem)</option>
        </select>
        {errors.userEnergyPeakTime && <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userEnergyPeakTime}</p>}
      </div>
    </div>
  )
}
