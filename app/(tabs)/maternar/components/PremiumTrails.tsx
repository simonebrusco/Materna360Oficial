'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { track } from '@/app/lib/telemetry'
import { isPremium } from '@/app/lib/plan'

export function PremiumTrails() {
  const userIsPremium = isPremium()

  const handleUpgradeClick = () => {
    track('paywall_banner_click', {
      source: 'maternar_trails',
      feature: 'premium_trails',
    })
    window.location.href = '/planos'
  }

  if (userIsPremium) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-support-1">Trilhas Premium</h2>
          <p className="text-sm text-support-2">
            Caminhos guiados para aprofundar sua jornada emocional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Trilha de Autocuidado',
              description: 'Aulas e reflexões sobre bem-estar pessoal',
              icon: 'heart',
            },
            {
              title: 'Trilha de Conexão',
              description: 'Fortaleça sua ligação com os filhos',
              icon: 'sparkles',
            },
          ].map((trail, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-br from-primary/5 to-complement/20 rounded-2xl p-4 border border-primary/20"
            >
              <div className="flex gap-3 mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                  <AppIcon name={trail.icon} size={20} variant="brand" decorative />
                </div>
                <h3 className="font-semibold text-support-1">{trail.title}</h3>
              </div>
              <p className="text-sm text-support-2">{trail.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary/5 via-complement/10 to-primary/5 rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8 border border-primary/20">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold mb-3">
            <AppIcon name="sparkles" size={12} decorative />
            Premium
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-support-1 mb-2">
            Trilhas Premium
          </h2>
          <p className="text-sm text-support-2">
            Desbloqueie caminhos guiados exclusivos para aprofundar sua jornada emocional.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleUpgradeClick}
          className="flex-shrink-0 whitespace-nowrap"
        >
          Desbloquear
        </Button>
      </div>
    </div>
  )
}
