import React from 'react'

// For now this component is purely presentational.
// When real data is available, replace the mocked list below.

const MOCK_MOMENTS: Array<{
  id: string
  dayLabel: string
  title: string
  note: string
}> = []

export function MomentsWithKids() {
  const hasMoments = MOCK_MOMENTS.length > 0

  if (!hasMoments) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-[#2f3a56]">
          Crie um primeiro momento especial
        </p>
        <p className="mt-2 max-w-xs text-xs text-gray-600">
          Em breve, aqui você vai ver uma linha do tempo com os pequenos momentos que viveu com seu filho: uma brincadeira, um abraço antes de dormir, uma conversa rápida na correria do dia.
        </p>
        <p className="mt-3 text-[11px] text-gray-500">
          Por enquanto, use o planner e as atividades do app para se inspirar. Em uma próxima versão, cada gesto registrado poderá aparecer aqui como memória.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
      <ul className="space-y-4">
        {MOCK_MOMENTS.map((item, index) => (
          <li key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full bg-[#ff005e]" />
              {index !== MOCK_MOMENTS.length - 1 && (
                <div className="mt-1 h-full w-px flex-1 bg-[#ffd8e6]" />
              )}
            </div>
            <div className="flex-1 rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {item.dayLabel}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[#2f3a56]">
                {item.title}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-gray-600">
                {item.note}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="pt-1 text-[11px] text-gray-500">
        No futuro, você poderá registrar momentos diretamente do seu dia e eles aparecerão aqui, criando uma linha do tempo afetiva da sua maternidade.
      </p>
    </div>
  )
}
