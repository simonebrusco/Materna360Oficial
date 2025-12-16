'use client'

import React from 'react'
import type { FormErrors, ProfileFormState } from '../ProfileForm'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void
}

export function SupportBlock({ form, errors, onChange }: Props) {
  const supportOptions = [
    'Parceiro(a)',
    'Avós',
    'Outros familiares',
    'Amigos',
    'Escola / creche',
    'Babá / cuidador(a)',
    'Não tenho rede de apoio',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Rede de apoio</h3>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Quem caminha com você nessa fase — mesmo que seja pouco.
        </p>
      </div>

      {/* Quem compõe a rede */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">Quem faz parte da sua rede hoje?</p>

        <div className="space-y-2">
          {supportOptions.map((option) => {
            const current = form.supportNetwork ?? []
            const checked = current.includes(option)

            return (
              <label key={option} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked ? current.filter((v) => v !== option) : [...current, option]
                    onChange({ supportNetwork: next })
                  }}
                  className="h-4 w-4 rounded border-[var(--color-soft-strong)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/40 focus:ring-1 focus:ring-offset-0"
                />
                <span className="text-xs text-[var(--color-text-main)]">{option}</span>
              </label>
            )
          })}
        </div>

        {errors.supportNetwork ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.supportNetwork}</p>
        ) : null}
      </div>
    </div>
  )
}
