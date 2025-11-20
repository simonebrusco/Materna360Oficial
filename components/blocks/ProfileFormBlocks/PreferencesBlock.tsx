'use client'

import { ProfileFormState } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  onChange: (updates: Partial<ProfileFormState>) => void
  onToggleArrayField: (fieldName: keyof ProfileFormState, value: string) => void
}

export function PreferencesBlock({ form, onChange, onToggleArrayField }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Preferências no app</h2>
        <p className="mt-1 text-xs text-gray-600">Assim a gente personaliza tudo para você.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Que tipo de conteúdo você gostaria?</label>
        <div className="space-y-2">
          {['Receitas', 'Atividades infantis', 'Dicas de sono', 'Saúde mental da mãe', 'Desenvolvimento infantil', 'Organização do lar'].map(
            (pref) => (
              <label key={pref} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.userContentPreferences || []).includes(pref)}
                  onChange={() => onToggleArrayField('userContentPreferences', pref)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                />
                <span className="text-xs text-gray-800">{pref}</span>
              </label>
            )
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Como você gostaria de ser orientada?</label>
        <select
          value={form.userGuidanceStyle || ''}
          onChange={(event) => onChange({ userGuidanceStyle: event.target.value as any })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="diretas">Dicas diretas e práticas</option>
          <option value="explicacao">Com explicação detalhada</option>
          <option value="motivacionais">Com mensagens motivacionais</option>
        </select>
        <p className="text-[11px] text-gray-500">Opcional, mas nos ajuda a comunicar melhor.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Com que frequência você gostaria de sugestões de autocuidado?</label>
        <select
          value={form.userSelfcareFrequency || ''}
          onChange={(event) => onChange({ userSelfcareFrequency: event.target.value as any })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="diario">Todo dia</option>
          <option value="semana">Uma vez por semana</option>
          <option value="pedido">Só quando eu pedir</option>
        </select>
        <p className="text-[11px] text-gray-500">Opcional, mas queremos respeitar seu tempo.</p>
      </div>
    </div>
  )
}
