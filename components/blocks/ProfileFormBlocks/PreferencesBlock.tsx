'use client'

import React from 'react'
import type { FormErrors, ProfileFormState } from '../ProfileForm'

type PreferencesArrayField = 'userContentPreferences' | 'userNotificationsPreferences'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void

  /**
   * Opcional: se não vier, o bloco resolve sozinho
   */
  onToggleArrayField?: (fieldName: PreferencesArrayField, value: string) => void
}

export function PreferencesBlock({ form, errors, onChange, onToggleArrayField }: Props) {
  const toggle = (fieldName: PreferencesArrayField, value: string) => {
    if (onToggleArrayField) {
      onToggleArrayField(fieldName, value)
      return
    }

    const current = form[fieldName] ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]

    if (fieldName === 'userContentPreferences') {
      onChange({ userContentPreferences: next })
      return
    }

    onChange({ userNotificationsPreferences: next })
  }

  const contentPrefs = [
    'Rotina & organização leve',
    'Parentalidade sem culpa',
    'Atividades rápidas com filhos',
    'Emoções & autorregulação',
    'Autocuidado possível',
    'Comunicação respeitosa',
  ]

  const notificationPrefs = [
    'Lembretes gentis (1x ao dia)',
    'Resumo semanal',
    'Sugestões rápidas (2–3 por semana)',
    'Sem notificações por enquanto',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Rede & preferências</h3>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Para o app te entregar o que faz sentido e no ritmo certo.
        </p>
      </div>

      {/* Preferências de conteúdo */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">Que tipo de conteúdo você quer ver mais?</p>

        <div className="space-y-2">
          {contentPrefs.map((pref) => {
            const checked = (form.userContentPreferences ?? []).includes(pref)

            return (
              <label key={pref} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle('userContentPreferences', pref)}
                  className="h-4 w-4 rounded border-[var(--color-soft-strong)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/40"
                />
                <span className="text-xs text-[var(--color-text-main)]">{pref}</span>
              </label>
            )
          })}
        </div>

        {errors.userContentPreferences ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userContentPreferences}</p>
        ) : null}
      </div>

      {/* Preferências de notificação */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">Como você prefere receber lembretes?</p>

        <div className="space-y-2">
          {notificationPrefs.map((pref) => {
            const checked = (form.userNotificationsPreferences ?? []).includes(pref)

            return (
              <label key={pref} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle('userNotificationsPreferences', pref)}
                  className="h-4 w-4 rounded border-[var(--color-soft-strong)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/40"
                />
                <span className="text-xs text-[var(--color-text-main)]">{pref}</span>
              </label>
            )
          })}
        </div>

        {errors.userNotificationsPreferences ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">
            {errors.userNotificationsPreferences}
          </p>
        ) : null}
      </div>
    </div>
  )
}
