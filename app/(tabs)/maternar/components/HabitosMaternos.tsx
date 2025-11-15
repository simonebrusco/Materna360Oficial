'use client'

import React from 'react'

// For now this is a static, premium-styled habits list.
// Later it can be wired to real storage (Supabase/local) and analytics.

const DEFAULT_HABITS = [
  {
    id: 'agua',
    label: 'Beber água ao longo do dia (cuidar de mim também é prioridade).',
  },
  {
    id: 'pausa',
    label: 'Fazer uma pequena pausa só para mim (respirar, alongar, tomar um café em paz).',
  },
  {
    id: 'brincadeira',
    label: 'Criar um momento de brincadeira rápida com meu filho (10–15 min de presença real).',
  },
  {
    id: 'conversa',
    label: 'Ter uma conversa curta com meu filho olhando nos olhos, sem telas por perto.',
  },
  {
    id: 'carinho',
    label: 'Fazer um gesto de carinho gratuito (um abraço, um beijo, um elogio).',
  },
]

export function HabitosMaternos() {
  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-sm">
      <p className="text-xs text-gray-600">
        Esses hábitos não são obrigações. Eles são lembretes gentis de que você também importa
        e de que a conexão com o seu filho se constrói em detalhes do dia a dia.
      </p>

      <div className="space-y-2">
        {DEFAULT_HABITS.map(habit => (
          <label
            key={habit.id}
            className="flex items-start gap-3 rounded-xl bg-gray-50 px-3 py-2"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-[13px] leading-relaxed text-support-1">
              {habit.label}
            </span>
          </label>
        ))}
      </div>

      <p className="pt-1 text-[11px] text-gray-500">
        Em breve, você verá aqui seu progresso ao longo da semana e como esses gestos impactam
        sua jornada como mãe.
      </p>
    </div>
  )
}
