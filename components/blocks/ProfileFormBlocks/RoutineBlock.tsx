'use client'

import React from 'react'
import type { FormErrors, ProfileFormState } from '../ProfileForm'

type RoutineArrayField = 'routineChaosMoments' | 'routineSupportNeeds'

interface Props {
  form: ProfileFormState
  errors: FormErrors
  onChange: (updates: Partial<ProfileFormState>) => void

  /**
   * ✅ Opcional para evitar cascata de erros
   * Se não vier, o bloco faz o toggle via onChange.
   */
  onToggleArrayField?: (fieldName: RoutineArrayField, value: string) => void
}

export function RoutineBlock({ form, errors, onChange, onToggleArrayField }: Props) {
  const toggle = (fieldName: RoutineArrayField, value: string) => {
    if (onToggleArrayField) {
      onToggleArrayField(fieldName, value)
      return
    }

    const current = form[fieldName] ?? []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]

    if (fieldName === 'routineChaosMoments') {
      onChange({ routineChaosMoments: next })
      return
    }

    onChange({ routineSupportNeeds: next })
  }

  const chaosMoments = [
    'Ao acordar',
    'Na hora de sair de casa',
    'Na hora do almoço',
    'Fim da tarde',
    'Na hora do banho',
    'Na hora de dormir',
  ]

  const supportNeeds = [
    'Planejar melhor a rotina',
    'Lidar com birras / explosões',
    'Reduzir telas sem guerra',
    'Ter mais tempo para mim',
    'Melhorar a comunicação em casa',
    'Organizar tarefas com o parceiro(a)/rede',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold text-[var(--color-text-main)]">Rotina</h3>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Um mapa rápido do que pesa e do que ajudaria agora. Sem julgamento.
        </p>
      </div>

      {/* Momentos de caos */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">
          Em quais momentos a rotina costuma ficar mais caótica?
        </p>

        <div className="space-y-2">
          {chaosMoments.map((moment) => {
            const checked = (form.routineChaosMoments ?? []).includes(moment)
            return (
              <label key={moment} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle('routineChaosMoments', moment)}
                  className="h-4 w-4 rounded border-[var(--color-soft-strong)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/40 focus:ring-1 focus:ring-offset-0"
                />
                <span className="text-xs text-[var(--color-text-main)]">{moment}</span>
              </label>
            )
          })}
        </div>

        {errors.routineChaosMoments ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.routineChaosMoments}</p>
        ) : null}
      </div>

      {/* O que ajudaria */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-main)]">
          O que mais te ajudaria nos próximos dias?
        </p>

        <div className="space-y-2">
          {supportNeeds.map((item) => {
            const checked = (form.routineSupportNeeds ?? []).includes(item)
            return (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle('routineSupportNeeds', item)}
                  className="h-4 w-4 rounded border-[var(--color-soft-strong)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]/40 focus:ring-1 focus:ring-offset-0"
                />
                <span className="text-xs text-[var(--color-text-main)]">{item}</span>
              </label>
            )
          })}
        </div>

        {errors.routineSupportNeeds ? (
          <p className="text-[11px] text-[var(--color-brand)] font-medium">{errors.routineSupportNeeds}</p>
        ) : null}
      </div>
    </div>
  )
}
