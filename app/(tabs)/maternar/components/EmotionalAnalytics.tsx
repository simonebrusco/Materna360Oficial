'use client'

import React from 'react'

// Later this will be powered by the same weekly mood/energy aggregation
// already used in other parts of the app.

export function EmotionalAnalytics() {
  return (
    <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-sm">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Visão geral da semana
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Esses indicadores vão te ajudar a perceber padrões entre como você se sente, sua rotina e os momentos com os filhos.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
            <span>Humor</span>
            <span>—</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/3 rounded-full bg-primary/70" />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
            <span>Energia</span>
            <span>—</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/2 rounded-full bg-support-1/70" />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-gray-500">
            <span>Conexão com os filhos</span>
            <span>—</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-2/3 rounded-full bg-complement" />
          </div>
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <p>
          Em breve você vai ver aqui quais dias tendem a ser mais leves ou mais intensos, e como isso se conecta com a rotina da família.
        </p>
        <p className="text-[11px] text-gray-500">
          A ideia não é te julgar, e sim te ajudar a se observar com mais carinho.
        </p>
      </div>
    </div>
  )
}
