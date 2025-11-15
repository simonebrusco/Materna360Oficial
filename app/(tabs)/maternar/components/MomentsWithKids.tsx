'use client'

import React from 'react'

// In the future this component can receive a `moments` prop with real data
// coming from the same source that currently feeds the daily timeline or
// memories in other tabs.

const MOCK_MOMENTS = [
  {
    id: 1,
    weekday: 'Terça-feira',
    dateLabel: '12 de março',
    title: 'Leitura antes de dormir',
    tag: 'Conexão',
  },
  {
    id: 2,
    weekday: 'Quinta-feira',
    dateLabel: '14 de março',
    title: 'Café da manhã sem telas',
    tag: 'Rotina',
  },
  {
    id: 3,
    weekday: 'Domingo',
    dateLabel: '16 de março',
    title: 'Passeio no parque em família',
    tag: 'Vitória do dia',
  },
]

export function MomentsWithKids() {
  const moments = MOCK_MOMENTS // TODO: replace with real data binding

  if (!moments || moments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-600">
        <p>
          Aqui vão ficar os momentos especiais com seus filhos. Pequenas cenas do dia a dia
          que você quiser registrar para não esquecer.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Em breve você poderá adicionar e revisar essas memórias com um só toque.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {moments.map(moment => (
        <article
          key={moment.id}
          className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            {moment.weekday} • {moment.dateLabel}
          </div>
          <h3 className="text-sm font-semibold text-support-1">
            {moment.title}
          </h3>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-complement px-3 py-1 text-[11px] font-medium text-support-1">
              {moment.tag}
            </span>
            <span className="text-[11px] text-gray-400">
              Em breve: toque para ver detalhes desse momento.
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}
