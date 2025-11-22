'use client'

import { ProfileFormState } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  onChange: (updates: Partial<ProfileFormState>) => void
  onToggleArrayField: (fieldName: keyof ProfileFormState, value: string) => void
}

export function SupportBlock({ form, onChange, onToggleArrayField }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 border border-[var(--color-border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Apoio & rede de suporte</h2>
        <p className="mt-1 text-xs text-gray-600">Conectar você com sua rede pode ser a melhor ajuda.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Quem está no seu time?</label>
        <div className="space-y-2">
          {['Parceiro / cônjuge', 'Avós', 'Amigos próximos', 'Família estendida', 'Profissionais de saúde', 'Comunidade / grupo de mães'].map(
            (support) => (
              <label key={support} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.supportNetwork || []).includes(support)}
                  onChange={() => onToggleArrayField('supportNetwork', support)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                />
                <span className="text-xs text-gray-800">{support}</span>
              </label>
            )
          )}
        </div>
        <p className="text-[11px] text-gray-500">Opcional, mas importante saber em quem você pode contar.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Com que frequência essa rede está disponível?</label>
        <select
          value={form.supportAvailability || ''}
          onChange={(event) => onChange({ supportAvailability: event.target.value as any })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="sempre">Sempre disponível</option>
          <option value="as-vezes">Às vezes disponível</option>
          <option value="raramente">Raramente disponível</option>
        </select>
        <p className="text-[11px] text-gray-500">Nos ajuda a oferecer suporte realista.</p>
      </div>
    </div>
  )
}
