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
    <div className="space-y-6 md:space-y-7">
      {/* MOMENTOS DE CAOS */}
      <div className="space-y-2.5">
        <label className="text-xs md:text-sm font-semibold text-[var(--color-text-main)]">
          Em quais momentos do dia você sente mais caos?
        </label>
        <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
          Isso nos ajuda a entender onde o dia costuma apertar para trazer sugestões mais realistas.
        </p>

        <div className="mt-1.5 space-y-2">
          {[
            'Manhã (acordar, sair de casa)',
            'Hora das refeições',
            'Dever de casa / estudos',
            'Final de tarde (cansaço, birras)',
            'Hora de dormir',
          ].map(moment => (
            <label
              key={moment}
              className="flex items-center gap-2.5 cursor-pointer rounded-2xl px-2 py-1.5 hover:bg-[var(--color-soft-strong)]/35 transition-colors"
            >
              <input
                type="checkbox"
                checked={(form.routineChaosMoments || []).includes(moment)}
                onChange={() => onToggleArrayField('routineChaosMoments', moment)}
                className="h-4 w-4 rounded border-[var(--color-soft-strong)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/40 focus:ring-1 focus:ring-offset-0"
              />
              <span className="text-xs md:text-sm text-[var(--color-text-main)]">{moment}</span>
            </label>
          ))}
        </div>

        {errors.routineChaosMoments && (
          <p className="text-[11px] md:text-xs text-[var(--color-brand)] font-medium">
            {errors.routineChaosMoments}
          </p>
        )}
      </div>

      {/* TEMPO DE TELA */}
      <div className="space-y-2.5">
        <label className="text-xs md:text-sm font-semibold text-[var(--color-text-main)]">
          Hoje, quantas horas por dia, em média, seu filho usa telas?
        </label>
        <select
          value={form.routineScreenTime || ''}
          onChange={event =>
            onChange({ routineScreenTime: event.target.value as any })
          }
          className="w-full rounded-2xl border border-[var(--color-soft-strong)] bg-white px-3 py-2.5 text-xs md:text-sm text-[var(--color-text-main)] shadow-[0_4px_10px_rgba(0,0,0,0.03)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]/35"
        >
          <option value="">Selecione...</option>
          <option value="nada">Quase nada</option>
          <option value="ate1h">Até 1h</option>
          <option value="1-2h">1–2h</option>
          <option value="mais2h">Mais de 2h</option>
        </select>
        <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
          Opcional, mas nos ajuda a entender sua realidade.
        </p>
      </div>

      {/* EM QUE PRECISA DE AJUDA */}
      <div className="space-y-2.5">
        <label className="text-xs md:text-sm font-semibold text-[var(--color-text-main)]">
          Em que você gostaria de ajuda?
        </label>
        <p className="text-[11px] md:text-xs text-[var(--color-text-muted)]">
          Marque tudo o que fizer sentido para a sua rotina neste momento.
        </p>

        <div className="mt-1.5 space-y-2">
          {[
            'Gestão de tempo',
            'Dicas de organização',
            'Lidar com birras',
            'Sono da criança',
            'Alimentação saudável',
            'Atividades divertidas',
          ].map(support => (
            <label
              key={support}
              className="flex items-center gap-2.5 cursor-pointer rounded-2xl px-2 py-1.5 hover:bg-[var(--color-soft-strong)]/35 transition-colors"
            >
              <input
                type="checkbox"
                checked={(form.routineDesiredSupport || []).includes(support)}
                onChange={() => onToggleArrayField('routineDesiredSupport', support)}
                className="h-4 w-4 rounded border-[var(--color-soft-strong)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/40 focus:ring-1 focus:ring-offset-0"
              />
              <span className="text-xs md:text-sm text-[var(--color-text-main)]">
                {support}
              </span>
            </label>
          ))}
        </div>

        {errors.routineDesiredSupport && (
          <p className="text-[11px] md:text-xs text-[var(--color-brand)] font-medium">
            {errors.routineDesiredSupport}
          </p>
        )}
      </div>
    </div>
  )
}
