'use client'

import { useState, useEffect } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { ClientOnly } from '@/components/common/ClientOnly'
import { save, load } from '@/app/lib/persist'
import { trackTelemetry } from '@/app/lib/telemetry'

export default function EnergiaPage() {
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    const savedEnergy = load<number>('meu-dia:energy-level', 3)
    if (typeof savedEnergy === 'number') {
      setEnergyLevel(savedEnergy)
    }
  }, [])

  const handleEnergyChange = (value: number) => {
    setEnergyLevel(value)
    save('meu-dia:energy-level', value)

    try {
      trackTelemetry('energy.level_changed', {
        page: 'energia',
        value,
      })
    } catch {}
  }

  if (!isHydrated) {
    return (
      <PageTemplate label="MEU DIA" title="Níveis de Energia" subtitle="Registre se está esgotada ou recarregada.">
        <div className="max-w-2xl h-40 bg-white/50 rounded-3xl animate-pulse" />
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      label="MEU DIA"
      title="Níveis de Energia"
      subtitle="Registre se está esgotada ou recarregada."
    >
      <ClientOnly>
        <div className="max-w-2xl">
          <div className="mb-8">
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
              Reconhecer seus níveis de energia ajuda você a tomar decisões melhores sobre como lidar com suas tarefas e prioridades do dia.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_12px_32px_rgba(255,0,94,0.05)] p-6 md:p-8">
            <h3 className="text-lg font-semibold text-[#2f3a56] mb-6">Como está sua energia agora?</h3>

            <div className="space-y-6">
              {/* Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#545454]">Esgotada</span>
                  <span className="text-sm font-medium text-[#545454]">Recarregada</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={energyLevel}
                  onChange={(e) => handleEnergyChange(Number(e.target.value))}
                  className="w-full h-2 bg-[#FFD8E6] rounded-full appearance-none cursor-pointer accent-primary"
                  aria-label="Níveis de energia"
                />
              </div>

              {/* Number Buttons */}
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleEnergyChange(level)}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                      energyLevel === level
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-[#FFE5EF] text-[#2f3a56] hover:bg-[#FFD8E6]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {/* Current Level Description */}
              <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-sm font-medium text-[#2f3a56] mb-1">Seu nível atual: <span className="text-primary font-semibold">{energyLevel}/5</span></p>
                <p className="text-xs text-[#545454]">
                  {energyLevel === 0 && 'Você está muito esgotada. Considere fazer uma pausa e se cuidar.'}
                  {energyLevel === 1 && 'Você está cansada. Reserve um tempo para descansar.'}
                  {energyLevel === 2 && 'Você está sentindo-se um pouco cansada. Um pequeno descanso pode ajudar.'}
                  {energyLevel === 3 && 'Você está em um nível equilibrado de energia.'}
                  {energyLevel === 4 && 'Você está com boa energia. Aproveite esse momento!'}
                  {energyLevel === 5 && 'Você está totalmente recarregada! Aproveite essa energia positiva.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
