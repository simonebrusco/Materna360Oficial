'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import AppIcon from '@/components/ui/AppIcon'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { updateXP } from '@/app/lib/xp'
import { toast } from '@/app/lib/toast'
import { track } from '@/app/lib/telemetry'

type SelfCareData = {
  hydration: boolean
  tookBreak: boolean
  stretched: boolean
  ateWell: boolean
  smallJoy: boolean
  notes: string
}

const CARE_ITEMS = [
  { key: 'hydration', label: 'Bebi água durante o dia', icon: 'water' },
  { key: 'tookBreak', label: 'Fiz uma pausa consciente', icon: 'pause' },
  { key: 'stretched', label: 'Alonguei meu corpo', icon: 'stretch' },
  { key: 'ateWell', label: 'Fiz uma refeição tranquila', icon: 'food' },
  { key: 'smallJoy', label: 'Vivi um pequeno momento de alegria', icon: 'sparkles' },
]

export default function AutocuidadoInteligentePage() {
  const [isHydrated, setIsHydrated] = useState(false)

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const [data, setData] = useState<SelfCareData>({
    hydration: false,
    tookBreak: false,
    stretched: false,
    ateWell: false,
    smallJoy: false,
    notes: '',
  })

  // -------------------------------------
  // HIDRATAÇÃO DO CLIENTE
  // -------------------------------------
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // -------------------------------------
  // CARREGAR DADOS
  // -------------------------------------
  useEffect(() => {
    if (!isHydrated) return
    const key = `autocuidado:${currentDateKey}`
    const saved = load<SelfCareData>(key)
    if (saved) {
      setData(saved)
      toast.info('Continuamos de onde você parou hoje.')
    }
  }, [isHydrated, currentDateKey])

  // -------------------------------------
  // SALVAR DADOS
  // -------------------------------------
  const handleToggle = (key: keyof SelfCareData) => {
    setData(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = () => {
    const persistKey = `autocuidado:${currentDateKey}`
    save(persistKey, data)

    try {
      void updateXP(10)
    } catch {}

    try {
      track('autocuidado_saved', {
        dateKey: currentDateKey,
        items: data,
      })
    } catch {}

    toast.success('Seu autocuidado de hoje foi registrado com carinho.')
  }

  // -------------------------------------
  // RENDER
  // -------------------------------------
  return (
    <PageTemplate
      label="CUIDAR"
      title="Autocuidado Inteligente"
      subtitle="Pequenos cuidados que fazem diferença no seu dia."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl space-y-10 pt-6 pb-16">
          <Reveal>
            <SoftCard className="rounded-3xl bg-white/95 border border-[#F5D7E5] p-6 md:p-8 shadow-[0_6px_22px_rgba(0,0,0,0.06)] space-y-8">
              <header className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#fd2597]/80">
                  Cuidar de si
                </p>
                <h2 className="text-lg md:text-xl font-semibold text-[#545454]">
                  Como você está hoje?
                </h2>
                <p className="text-sm text-[#545454] max-w-2xl">
                  Escolha pequenos gestos de autocuidado que cabem na sua rotina — sem culpa,
                  sem perfeição.
                </p>
              </header>

              <div className="space-y-4">
                {CARE_ITEMS.map(item => (
                  <label
                    key={item.key}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-[#F5D7E5] bg-white hover:bg-[#fdbed7]/10 transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={data[item.key as keyof SelfCareData] as boolean}
                      onChange={() => handleToggle(item.key as keyof SelfCareData)}
                      className="w-5 h-5 accent-[#fd2597] cursor-pointer"
                    />
                    <div className="flex items-center gap-3 text-[#545454]">
                      <AppIcon name={item.icon} className="w-5 h-5 text-[#fd2597]" decorative />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#545454] uppercase tracking-wide mb-2">
                  Quer anotar algo sobre seu dia?
                </label>
                <textarea
                  value={data.notes}
                  onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Escreva algo que queira lembrar ou desabafar."
                  className="w-full rounded-2xl border border-[#F5D7E5] bg-white p-3 text-sm text-[#545454] placeholder:text-[#A0A0A0] focus:border-[#fd2597] focus:ring-1 focus:ring-[#fd2597]/20 resize-none"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleSave}
                className="w-full rounded-full bg-[#fd2597] hover:bg-[#b8236b] text-white shadow-[0_10px_26px_rgba(0,0,0,0.18)]"
              >
                Salvar meu autocuidado de hoje
              </Button>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="autocuidado-inteligente" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
