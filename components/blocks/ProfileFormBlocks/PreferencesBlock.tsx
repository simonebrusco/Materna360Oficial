'use client'

import { FormErrors, ProfileFormState } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void
}

const CONTENT_PREFS = [
  'Rotina leve',
  'Autocuidado',
  'Organização da casa',
  'Conexão com o filho',
  'Educação sem culpa',
  'Bem-estar emocional',
] as const

const NOTIFICATION_PREFS = [
  'Lembretes suaves do dia',
  'Resumo semanal',
  'Sugestões de autocuidado',
  'Sugestões de conexão com meu filho',
] as const

function toggleArrayValue(list: string[], value: string) {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

export function PreferencesBlock({ form, errors, onChange }: Props) {
  const userContentPreferences = Array.isArray(form.userContentPreferences)
    ? form.userContentPreferences
    : []

  const userNotificationPreferences = Array.isArray(form.userNotificationPreferences)
    ? form.userNotificationPreferences
    : []

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-main)]">
          Rede & preferências
        </h3>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Para o Materna360 te entregar menos ruído e mais do que faz sentido para você.
        </p>
      </div>

      {/* Preferências de conteúdo */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">
          O que você quer ver mais por aqui?
        </p>

        <div className="grid gap-2">
          {CONTENT_PREFS.map(pref => {
            const checked = userContentPreferences.includes(pref)
            return (
              <label key={pref} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      userContentPreferences: toggleArrayValue(userContentPreferences, pref),
                    })
                  }
                  className="h-4 w-4 rounded border-[var(--color-border-soft)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/30"
                />
                <span className="text-xs text-[var(--color-text-main)]">{pref}</span>
              </label>
            )
          })}
        </div>

        {errors.userContentPreferences ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">
            {errors.userContentPreferences}
          </p>
        ) : null}
      </div>

      {/* Preferências de notificações */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-medium text-[var(--color-text-main)]">
          Como você prefere receber lembretes?
        </p>

        <div className="grid gap-2">
          {NOTIFICATION_PREFS.map(pref => {
            const checked = userNotificationPreferences.includes(pref)
            return (
              <label key={pref} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      userNotificationPreferences: toggleArrayValue(
                        userNotificationPreferences,
                        pref,
                      ),
                    })
                  }
                  className="h-4 w-4 rounded border-[var(--color-border-soft)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/30"
                />
                <span className="text-xs text-[var(--color-text-main)]">{pref}</span>
              </label>
            )
          })}
        </div>

        {errors.userNotificationPreferences ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">
            {errors.userNotificationPreferences}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#F5D7E5] bg-[#fff7fb] px-4 py-3">
        <p className="text-[11px] text-[#6a6a6a] leading-relaxed">
          Você pode mudar isso quando quiser. A ideia é te apoiar — não te bombardear.
        </p>
      </div>
    </div>
  )
}
