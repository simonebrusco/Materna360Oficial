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
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-6 flex flex-col h-full">
                {/* Card Header with Editorial Underline */}
                <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                    Sinais do Dia
                  </h3>
                  <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                    Observe pequenos sinais que podem mostrar como seu filho está hoje.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-[#2f3a56] font-medium">
                    Quais desses sinais você percebe hoje?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SIGNALS_OPTIONS.map((signal) => (
                      <button
                        key={signal}
                        onClick={() => handleSignalToggle(signal)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20 ${
                          signalsData.selectedSignals.includes(signal)
                            ? 'bg-[#ff005e] text-white shadow-md border border-[#ff005e]'
                            : 'bg-white text-[#2f3a56] border border-[#ffd8e6] hover:border-[#ff005e] hover:bg-[#ffd8e6]/15'
                        }`}
                      >
                        {signal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#2f3a56] uppercase tracking-wide mb-2.5">
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
                    className="w-full p-3 rounded-2xl border border-[#ffd8e6] bg-white text-sm text-[#2f3a56] placeholder-[#545454]/40 focus:outline-none focus:border-[#ff005e] focus:ring-2 focus:ring-[#ff005e]/20 resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSignals}
                  className="w-full mt-auto"
                >
                  Salvar sinais do dia
                </Button>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 2 — Cuidado Emocional por Idade */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-6 flex flex-col h-full">
                {/* Card Header with Editorial Underline */}
                <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                    Cuidado Emocional por Idade
                  </h3>
                  <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                    Sugestões suaves para acolher o momento do seu filho.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FFE5EF]/40 border border-[#ffd8e6]/50">
                  <p className="text-xs md:text-sm text-[#545454]">
                    Cadastre a idade do seu filho no Eu360 para sugestões ainda mais certeiras.
                  </p>
                </div>

                <div className="space-y-3 flex-1">
                  {EMOTIONAL_CARE_TIPS.map((tip, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 text-[#6A2C70] mt-0.5 font-semibold">
                        •
                      </div>
                      <p className="text-sm text-[#545454] leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => console.log('ver mais cuidado emocional')}
                  className="text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff005e]/60"
                >
                  Ver mais ideias de cuidado →
                </button>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 3 — Cuidados do Dia */}
          <Reveal delay={100}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-6 flex flex-col h-full">
                {/* Card Header with Editorial Underline */}
                <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                    Cuidados do Dia
                  </h3>
                  <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                    Acompanhe cuidados importantes de forma leve.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                    Marque o que você já conseguiu cuidar hoje:
                  </p>
                  <div className="space-y-2.5 flex-1">
                    {CARE_ITEMS.map((item) => (
                      <label
                        key={item}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#ffd8e6]/10 cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-[#ff005e]/20"
                      >
                        <input
                          type="checkbox"
                          checked={careData.checkedItems.includes(item)}
                          onChange={() => handleCareToggle(item)}
                          className="w-5 h-5 rounded border-[#ffd8e6] text-[#ff005e] cursor-pointer accent-[#ff005e]"
                        />
                        <span className="text-sm text-[#2f3a56] flex-1 font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveCare}
                  className="w-full mt-auto"
                >
                  Salvar cuidados de hoje
                </Button>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCK 4 — Para Fortalecer o Vínculo */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-6 flex flex-col h-full">
                {/* Card Header with Editorial Underline */}
                <div className="space-y-3 border-b-2 border-[#6A2C70] pb-4">
                  <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                    Para Fortalecer o Vínculo
                  </h3>
                  <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                    Escolha um gesto especial para hoje.
                  </p>
                </div>

                <div className="space-y-3 flex-1">
                  {/* Gesto Option */}
                  <label className="flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: bondData.selectedOption === 'gesto' ? '#ff005e' : '#ffd8e6',
                      backgroundColor: bondData.selectedOption === 'gesto' ? '#ffd8e6/10' : '#ffd8e6/5',
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
                      <p className="text-xs text-[#545454] leading-relaxed">
                        Escolha um pequeno gesto para deixar o dia do seu filho mais leve (ex.: bilhete, elogio, tempo de colo).
                      </p>
                    </div>
                  </label>

                  {/* Ritual Option */}
                  <label className="flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: bondData.selectedOption === 'ritual' ? '#ff005e' : '#ffd8e6',
                      backgroundColor: bondData.selectedOption === 'ritual' ? '#ffd8e6/10' : '#ffd8e6/5',
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
                      <p className="text-xs text-[#545454] leading-relaxed">
                        Defina um mini-ritual de conexão para antes de dormir ou depois da escola.
                      </p>
                    </div>
                  </label>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveBond}
                  className="w-full mt-auto"
                >
                  Salvar no planner
                </Button>
              </div>
            </SoftCard>
          </Reveal>
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
