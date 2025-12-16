'use client'

import React from 'react'
import type { FormErrors, ProfileFormState } from '../ProfileForm'

type PreferencesArrayField = 'userContentPreferences' | 'userNotificationsPreferences'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void

  onToggleArrayField?: (fieldName: PreferencesArrayField, value: string) => void
}

const CONTENT_PREFS = [
  'Rotina & organização leve',
  'Parentalidade sem culpa',
  'Atividades rápidas com filhos',
  'Emoções & autorregulação',
  'Autocuidado possível',
  'Comunicação respeitosa',
] as const

const NOTIFICATION_PREFS = [
  'Lembretes gentis (1x ao dia)',
  'Resumo semanal',
  'Sugestões rápidas (2–3 por semana)',
  'Sem notificações por enquanto',
] as const

function Chip({
  active,
  label,
  onClick,
}: {
  active?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'w-full text-left rounded-2xl border px-3 py-2 text-[12px] transition',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-brand)]/40',
        active
          ? 'border-[var(--color-brand)]/40 bg-[#ffd8e6] text-[#2f3a56] shadow-[0_10px_22px_rgba(0,0,0,0.06)]'
          : 'border-[var(--color-border-soft)] bg-white text-[#2f3a56] hover:bg-[#fff7fb] hover:border-[var(--color-brand)]/20',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function PreferencesBlock({ form, errors, onChange, onToggleArrayField }: Props) {
  const toggleLocal = (fieldName: PreferencesArrayField, value: string) => {
    const current = form[fieldName] ?? []
    const isOn = current.includes(value)

    // regra: "Sem notificações por enquanto" é exclusiva
    if (fieldName === 'userNotificationsPreferences') {
      const NONE = 'Sem notificações por enquanto'

      if (value === NONE) {
        const next = isOn ? [] : [NONE]
        onChange({ userNotificationsPreferences: next })
        return
      }

      // se marcou qualquer outra, remove "Sem notificações"
      const cleaned = current.filter((v) => v !== NONE)
      const next = isOn ? cleaned.filter((v) => v !== value) : [...cleaned, value]
      onChange({ userNotificationsPreferences: next })
      return
    }

    // conteúdo: toggle simples
    const next = isOn ? current.filter((v) => v !== value) : [...current, value]
    onChange({ userContentPreferences: next })
  }

  const toggle = (fieldName: PreferencesArrayField, value: string) => {
    if (onToggleArrayField) {
      // Observação: se o pai estiver controlando, ainda aplicamos a regra de exclusividade
      // aqui somente quando não houver callback externo. Para manter previsível, usamos local.
      toggleLocal(fieldName, value)
      return
    }
    toggleLocal(fieldName, value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Rede & preferências</h3>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Para o app te entregar o que faz sentido e no ritmo certo.
        </p>
      </div>

      {/* Conteúdo */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">Conteúdos que você quer ver mais</p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONTENT_PREFS.map((pref) => {
            const checked = (form.userContentPreferences ?? []).includes(pref)
            return (
              <Chip
                key={pref}
                active={checked}
                label={pref}
                onClick={() => toggle('userContentPreferences', pref)}
              />
            )
          })}
        </div>

        {errors.userContentPreferences ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.userContentPreferences}</p>
        ) : null}

        <p className="text-[11px] text-[var(--color-text-muted)]">
          Dica: você pode escolher só 1 ou 2. Menos, mas mais alinhado, costuma funcionar melhor.
        </p>
      </div>

      {/* Notificações */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">Como você prefere receber lembretes?</p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {NOTIFICATION_PREFS.map((pref) => {
            const checked = (form.userNotificationsPreferences ?? []).includes(pref)
            return (
              <Chip
                key={pref}
                active={checked}
                label={pref}
                onClick={() => toggle('userNotificationsPreferences', pref)}
              />
            )
          })}
        </div>

        {errors.userNotificationsPreferences ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">
            {errors.userNotificationsPreferences}
          </p>
        ) : null}

        <p className="text-[11px] text-[var(--color-text-muted)]">
          Se você marcar “Sem notificações”, o app não te interrompe — e você pode mudar isso quando quiser.
        </p>
      </div>
    </div>
  )
}
