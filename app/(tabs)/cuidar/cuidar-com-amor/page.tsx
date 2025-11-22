'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'

type SignalsDayData = {
  selectedSignals: string[]
  observation: string
}

type CareCareData = {
  checkedItems: string[]
}

type BondData = {
  selectedOption: 'gesto' | 'ritual' | null
}

const SIGNALS_OPTIONS = [
  'Alegria',
  'Agitação',
  'Carinho',
  'Muito sono',
  'Carência',
  'Irritação',
]

const CARE_ITEMS = [
  'Sono respeitado',
  'Alimentação equilibrada',
  'Água durante o dia',
  'Tempo de movimento/brincadeira',
  'Pausa de conexão (olho no olho, conversa, abraço)',
]

const EMOTIONAL_CARE_TIPS = [
  'Reserve alguns minutos para ouvir seu filho sem interrupções.',
  'Valide o que ele sente, mesmo quando não concordar com o comportamento.',
  'Ofereça um gesto de carinho físico, como um abraço ou colo.',
]

export default function CuidarComAmorPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [signalsData, setSignalsData] = useState<SignalsDayData>({
    selectedSignals: [],
    observation: '',
  })
  const [careData, setCareData] = useState<CareCareData>({
    checkedItems: [],
  })
  const [bondData, setBondData] = useState<BondData>({
    selectedOption: null,
  })

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const { addItem } = usePlannerSavedContents()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load persisted data
  useEffect(() => {
    if (!isHydrated) return

    const signalsKey = `cuidar-com-amor:${currentDateKey}:signals`
    const careKey = `cuidar-com-amor:${currentDateKey}:care`
    const bondKey = `cuidar-com-amor:${currentDateKey}:bond`

    const savedSignals = load<SignalsDayData>(signalsKey)
    const savedCare = load<CareCareData>(careKey)
    const savedBond = load<BondData>(bondKey)

    if (
      savedSignals &&
      typeof savedSignals === 'object' &&
      'selectedSignals' in savedSignals
    ) {
      setSignalsData(savedSignals)
    }

    if (
      savedCare &&
      typeof savedCare === 'object' &&
      'checkedItems' in savedCare
    ) {
      setCareData(savedCare)
    }

    if (
      savedBond &&
      typeof savedBond === 'object' &&
      'selectedOption' in savedBond
    ) {
      setBondData(savedBond)
    }
  }, [isHydrated, currentDateKey])

  const handleSignalToggle = (signal: string) => {
    const updated = signalsData.selectedSignals.includes(signal)
      ? signalsData.selectedSignals.filter((s) => s !== signal)
      : [...signalsData.selectedSignals, signal]

    setSignalsData({
      ...signalsData,
      selectedSignals: updated,
    })
  }

  const handleSaveSignals = () => {
    const signalsKey = `cuidar-com-amor:${currentDateKey}:signals`
    save(signalsKey, signalsData)

    try {
      track('care_signals_saved', {
        origin: 'cuidar-com-amor',
        signalsCount: signalsData.selectedSignals.length,
      })
    } catch {}

    toast.success('Sinais do dia salvos com carinho.')
  }

  const handleCareToggle = (item: string) => {
    const updated = careData.checkedItems.includes(item)
      ? careData.checkedItems.filter((i) => i !== item)
      : [...careData.checkedItems, item]

    setCareData({
      ...careData,
      checkedItems: updated,
    })
  }

  const handleSaveCare = () => {
    const careKey = `cuidar-com-amor:${currentDateKey}:care`
    save(careKey, careData)

    try {
      track('care_checklist_saved', {
        origin: 'cuidar-com-amor',
        checkedCount: careData.checkedItems.length,
      })
    } catch {}

    toast.success('Cuidados de hoje registrados com carinho.')
  }

  const handleBondOptionChange = (option: 'gesto' | 'ritual') => {
    setBondData({
      selectedOption: option,
    })
  }

  const handleSaveBond = () => {
    if (!bondData.selectedOption) {
      toast.info('Escolha uma opção para continuar.')
      return
    }

    const bondKey = `cuidar-com-amor:${currentDateKey}:bond`
    save(bondKey, bondData)

    try {
      addItem({
        origin: 'cuidar-com-amor',
        type: 'insight',
        title:
          bondData.selectedOption === 'gesto'
            ? 'Gesto de vínculo para hoje'
            : 'Ritual de conexão para hoje',
        payload: {
          tipoEscolhido: bondData.selectedOption,
          descricao:
            bondData.selectedOption === 'gesto'
              ? 'Pequeno gesto para deixar o dia do seu filho mais leve.'
              : 'Mini-ritual de conexão para antes de dormir ou depois da escola.',
        },
      })

      try {
        track('care_bond_saved', {
          origin: 'cuidar-com-amor',
          type: bondData.selectedOption,
        })
      } catch {}
    } catch (error) {
      console.error('[Cuidar com Amor] Error saving bond to planner:', error)
      toast.danger('Erro ao salvar no planner.')
    }
  }

  return (
    <PageTemplate
      label="CUIDAR"
      title="Cuidar com Amor"
      subtitle="Pequenos gestos que fortalecem o vínculo com seu filho."
    >
      <ClientOnly>
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8">
          {/* BLOCK 1 — Sinais do Dia */}
          <Reveal delay={0}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2">
                  Sinais do Dia
                </h3>
                <p className="text-sm md:text-base text-[#545454]">
                  Observe pequenos sinais que podem mostrar como seu filho está hoje.
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-[#2f3a56] font-medium mb-3">
                  Quais desses sinais você percebe hoje?
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SIGNALS_OPTIONS.map((signal) => (
                    <button
                      key={signal}
                      onClick={() => handleSignalToggle(signal)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        signalsData.selectedSignals.includes(signal)
                          ? 'bg-[#ff005e] text-white shadow-md'
                          : 'bg-white/60 text-[#2f3a56] hover:bg-white/80'
                      }`}
                    >
                      {signal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#2f3a56] mb-2">
                  Quer detalhar algo?
                </label>
                <textarea
                  value={signalsData.observation}
                  onChange={(e) =>
                    setSignalsData({
                      ...signalsData,
                      observation: e.target.value,
                    })
                  }
                  placeholder="Escreva aqui algo que você percebeu no seu filho hoje."
                  className="w-full px-4 py-3 rounded-2xl border border-white/40 bg-white/50 text-[#2f3a56] placeholder-[#999] text-sm focus:border-[#ff005e]/60 focus:outline-none focus:ring-2 focus:ring-[#ff005e]/30"
                  rows={3}
                />
              </div>

              <button
                onClick={handleSaveSignals}
                className="w-full px-4 py-3 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all duration-200"
              >
                Salvar sinais do dia
              </button>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Cuidado Emocional por Idade */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2">
                  Cuidado Emocional por Idade
                </h3>
                <p className="text-sm md:text-base text-[#545454]">
                  Sugestões suaves para acolher o momento do seu filho.
                </p>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-[#FFE5EF]/40">
                <p className="text-sm text-[#545454]">
                  Cadastre a idade do seu filho no Eu360 para sugestões ainda mais certeiras.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {EMOTIONAL_CARE_TIPS.map((tip, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 text-[#ff005e] mt-0.5">
                      •
                    </div>
                    <p className="text-sm text-[#545454]">{tip}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => console.log('ver mais cuidado emocional')}
                className="text-sm font-semibold text-[#ff005e] hover:opacity-80 transition-opacity inline-flex items-center gap-1"
              >
                Ver mais ideias de cuidado →
              </button>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Cuidados do Dia */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2">
                  Cuidados do Dia
                </h3>
                <p className="text-sm md:text-base text-[#545454]">
                  Acompanhe cuidados importantes de forma leve.
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-[#2f3a56] font-medium mb-3">
                  Marque o que você já conseguiu cuidar hoje:
                </p>
                <div className="space-y-3">
                  {CARE_ITEMS.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={careData.checkedItems.includes(item)}
                        onChange={() => handleCareToggle(item)}
                        className="w-5 h-5 rounded-lg accent-[#ff005e] cursor-pointer"
                      />
                      <span className="text-sm text-[#2f3a56]">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveCare}
                className="w-full px-4 py-3 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all duration-200"
              >
                Salvar cuidados de hoje
              </button>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Para Fortalecer o Vínculo */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8">
              <div className="mb-6">
                <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] mb-2">
                  Para Fortalecer o Vínculo
                </h3>
                <p className="text-sm md:text-base text-[#545454]">
                  Escolha um gesto especial para hoje.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {/* Gesto Option */}
                <label className="flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer bg-white/60 hover:bg-white/80"
                  style={{
                    borderColor: bondData.selectedOption === 'gesto' ? '#ff005e' : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <input
                    type="radio"
                    name="bond-option"
                    value="gesto"
                    checked={bondData.selectedOption === 'gesto'}
                    onChange={() => handleBondOptionChange('gesto')}
                    className="w-5 h-5 mt-0.5 accent-[#ff005e] cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                      Gesto de hoje
                    </h4>
                    <p className="text-xs text-[#545454]">
                      Escolha um pequeno gesto para deixar o dia do seu filho mais leve (ex.: bilhete, elogio, tempo de colo).
                    </p>
                  </div>
                </label>

                {/* Ritual Option */}
                <label className="flex items-start gap-4 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer bg-white/60 hover:bg-white/80"
                  style={{
                    borderColor: bondData.selectedOption === 'ritual' ? '#ff005e' : 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <input
                    type="radio"
                    name="bond-option"
                    value="ritual"
                    checked={bondData.selectedOption === 'ritual'}
                    onChange={() => handleBondOptionChange('ritual')}
                    className="w-5 h-5 mt-0.5 accent-[#ff005e] cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[#2f3a56] mb-1">
                      Ritual rápido
                    </h4>
                    <p className="text-xs text-[#545454]">
                      Defina um mini-ritual de conexão para antes de dormir ou depois da escola.
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={handleSaveBond}
                className="w-full px-4 py-3 rounded-lg bg-[#ff005e] text-white font-semibold text-sm hover:bg-[#ff005e]/90 transition-all duration-200"
              >
                Salvar no planner
              </button>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
