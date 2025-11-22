'use client'

import { FormErrors, ProfileFormState } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void
  onToggleArrayField: (fieldName: keyof ProfileFormState, value: string) => void
}

export function RoutineBlock({ form, errors, onChange, onToggleArrayField }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 border border-[var(--color-border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Rotina & momentos críticos</h2>
        <p className="mt-1 text-xs text-gray-600">Aqui a gente entende onde o dia costuma apertar para te ajudar com soluções mais realistas.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Em quais momentos do dia você sente mais caos?</label>
        <div className="space-y-2">
          {['Manhã (acordar, sair de casa)', 'Hora das refeições', 'Dever de casa / estudos', 'Final de tarde (cansaço, birras)', 'Hora de dormir'].map(
            (moment) => (
              <label key={moment} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.routineChaosMoments || []).includes(moment)}
                  onChange={() => onToggleArrayField('routineChaosMoments', moment)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                />
                <span className="text-xs text-gray-800">{moment}</span>
              </label>
            )
          )}
        </div>
        {errors.routineChaosMoments && <p className="text-[11px] text-primary-600 font-medium">{errors.routineChaosMoments}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Hoje, quantas horas por dia, em média, seu filho usa telas?</label>
        <select
          value={form.routineScreenTime || ''}
          onChange={(event) => onChange({ routineScreenTime: event.target.value as any })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-primary-300 focus:outline-none focus:ring-1 focus:ring-primary-200 appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="nada">Quase nada</option>
          <option value="ate1h">Até 1h</option>
          <option value="1-2h">1–2h</option>
          <option value="mais2h">Mais de 2h</option>
        </select>
        <p className="text-[11px] text-gray-500">Opcional, mas nos ajuda a entender sua realidade.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-800">Em que você gostaria de ajuda?</label>
        <div className="space-y-2">
          {['Gestão de tempo', 'Dicas de organização', 'Lidar com birras', 'Sono da criança', 'Alimentação saudável', 'Atividades divertidas'].map(
            (support) => (
              <label key={support} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form.routineDesiredSupport || []).includes(support)}
                  onChange={() => onToggleArrayField('routineDesiredSupport', support)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-200"
                />
                <span className="text-xs text-gray-800">{support}</span>
              </label>
            )
          )}
        </div>
        {errors.routineDesiredSupport && <p className="text-[11px] text-primary-600 font-medium">{errors.routineDesiredSupport}</p>}
      </div>
    </div>
  )
}
