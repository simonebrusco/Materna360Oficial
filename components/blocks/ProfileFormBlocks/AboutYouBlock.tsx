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
    <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Sobre você</h2>
        <p className="mt-1 text-xs text-gray-600">Isso nos ajuda a adaptar as sugestões à sua rotina real.</p>
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-900">Escolha uma figurinha de perfil</h3>
          <p className="mt-1 text-[11px] text-gray-600">Escolha a vibe que mais combina com você hoje.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {STICKER_OPTIONS.map((sticker) => {
            const isActive = form.figurinha === sticker.id
            return (
              <button
                key={sticker.id}
                type="button"
                onClick={() => onChange({ figurinha: sticker.id })}
                className={`group relative flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all duration-300 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
                  isActive
                    ? 'border-primary-300 bg-primary-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                aria-pressed={isActive}
                aria-label={`Selecionar figurinha ${sticker.label}`}
              >
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full transition-all duration-300 ${
                    isActive ? 'bg-primary-100' : 'bg-gray-100'
                  }`}
                >
                  <img
                    src={sticker.asset}
                    alt={sticker.label}
                    className="h-9 w-9 object-contain"
                    loading="lazy"
                  />
                </span>
                <span className="text-[10px] font-semibold text-gray-900 line-clamp-2">{sticker.label}</span>
                <span className="text-[9px] text-gray-500 line-clamp-2">{STICKER_DESCRIPTIONS[sticker.id]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="mother-name" className="text-xs font-medium text-gray-800">
          Seu nome
        </label>
        <input
          id="mother-name"
          type="text"
          required
          value={form.nomeMae}
          onChange={(event) => onChange({ nomeMae: event.target.value })}
          className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 ${
            errors.nomeMae ? 'border-primary-400 ring-1 ring-primary-300' : ''
          }`}
          aria-invalid={Boolean(errors.nomeMae)}
        />
        {errors.nomeMae && <p className="text-[11px] text-primary-600 font-medium">{errors.nomeMae}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="preferred-name" className="text-xs font-medium text-gray-800">
          Como você prefere ser chamada?
        </label>
        <input
          id="preferred-name"
          type="text"
          value={form.userPreferredName || ''}
          onChange={(event) => onChange({ userPreferredName: event.target.value })}
          placeholder="Ex.: Ju, Mãe, Simone..."
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200"
        />
        <p className="text-[11px] text-gray-500">Opcional, mas faz tudo mais pessoal.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Você é:</label>
        <select
          value={form.userRole || ''}
          onChange={(event) => onChange({ userRole: event.target.value as any })}
          className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none ${
            errors.userRole ? 'border-primary-400 ring-1 ring-primary-300' : ''
          }`}
        >
          <option value="">Selecione...</option>
          <option value="mae">Mãe</option>
          <option value="pai">Pai</option>
          <option value="outro">Outro cuidador</option>
        </select>
        {errors.userRole && <p className="text-[11px] text-primary-600 font-medium">{errors.userRole}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">
          Como você se sente na maior parte dos dias com a maternidade?
        </label>
        <select
          value={form.userEmotionalBaseline || ''}
          onChange={(event) => onChange({ userEmotionalBaseline: event.target.value as any })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="sobrecarregada">Muito sobrecarregada</option>
          <option value="cansada">Cansada, mas dando conta</option>
          <option value="equilibrada">Equilibrada na maior parte do tempo</option>
          <option value="leve">Em uma fase mais leve</option>
        </select>
        <p className="text-[11px] text-gray-500">Opcional, mas ajuda a personalizar sugestões.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Qual é o seu maior desafio hoje?</label>
        <div className="space-y-2">
          {['Falta de tempo', 'Culpa', 'Organização da rotina', 'Comportamento do filho', 'Cansaço físico', 'Relação com parceiro(a) / família'].map(
            (challenge) => (
              <label key={challenge} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.userMainChallenges || []).includes(challenge)}
                  onChange={() => toggleArrayField('userMainChallenges', challenge)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                />
                <span className="text-xs text-gray-800">{challenge}</span>
              </label>
            )
          )}
        </div>
        {errors.userMainChallenges && <p className="text-[11px] text-primary-600 font-medium">{errors.userMainChallenges}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Quando você sente mais energia?</label>
        <select
          value={form.userEnergyPeakTime || ''}
          onChange={(event) => onChange({ userEnergyPeakTime: event.target.value as any })}
          className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none ${
            errors.userEnergyPeakTime ? 'border-primary-400 ring-1 ring-primary-300' : ''
          }`}
        >
          <option value="">Selecione...</option>
          <option value="manha">Manhã (acordar, começar o dia)</option>
          <option value="tarde">Tarde (meio do dia)</option>
          <option value="noite">Noite (depois que crianças dormem)</option>
        </select>
        {errors.userEnergyPeakTime && <p className="text-[11px] text-primary-600 font-medium">{errors.userEnergyPeakTime}</p>}
      </div>
    </div>
  )
}
