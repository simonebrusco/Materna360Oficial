'use client'

import React from 'react'

export function EmotionalAnalytics() {
  return (
    <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-support-1">Sua Evolução</h2>
        <p className="text-sm text-support-2">
          Acompanhe seu bem-estar, humor e energia ao longo do tempo
        </p>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-complement/20 rounded-2xl p-6 min-h-64 flex flex-col items-center justify-center text-center">
        <p className="text-support-2 text-sm mb-2">Gráficos de evolução emocional</p>
        <p className="text-support-2 text-xs">
          Seus dados de humor, energia e conexão aparecerão aqui com análises visuais
        </p>
      </div>
    </div>
  )
}
