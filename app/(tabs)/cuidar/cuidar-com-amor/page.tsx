'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import AppIcon from '@/components/ui/AppIcon'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import {
  fetchCuidarComAmorSuggestion,
  type CuidarComAmorFeature,
  type CuidarComAmorSuggestion,
} from '@/app/lib/ai/cuidarComAmorClient'

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

type HighlightTarget = 'alimentacao' | 'sono' | 'conexao' | 'rituais' | null

const SIGNALS_OPTIONS = ['Alegria', 'Agitação', 'Carinho', 'Muito sono', 'Carência', 'Irritação']

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

const SLEEP_AUDIO_PLACEHOLDERS = [
  {
    id: 'musica-suave',
    title: 'Música suave para acalmar',
    description:
      'Música instrumental curtinha para diminuir o ritmo da casa e preparar o ambiente para o soninho.',
  },
  {
    id: 'historia-calma',
    title: 'História calma para dormir',
    description:
      'Uma história leve com trilha doce, feita para relaxar ao lado do seu filho.',
  },
  {
    id: 'sons-de-ninar',
    title: 'Sons de ninar',
    description: 'Som contínuo e tranquilo, perfeito para embalar o sono do seu filho.',
  },
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

  const searchParams = useSearchParams()
  const [highlightTarget, setHighlightTarget] = useState<HighlightTarget>(null)

  // refs para scroll dos atalhos
  const cuidadosBlockRef = useRef<HTMLDivElement | null>(null)
  const sonoBlockRef = useRef<HTMLDivElement | null>(null)
  const conexaoBlockRef = useRef<HTMLDivElement | null>(null)
  const rituaisBlockRef = useRef<HTMLDivElement | null>(null)

  // estado das sugestões inteligentes
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [currentFeature, setCurrentFeature] = useState<CuidarComAmorFeature | null>(null)
  const [currentSuggestion, setCurrentSuggestion] = useState<CuidarComAmorSuggestion | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // carregar dados salvos
  useEffect(() => {
    if (!isHydrated) return

    const signalsKey = `cuidar-com-amor:${currentDateKey}:signals`
    const careKey = `cuidar-com-amor:${currentDateKey}:care`
    const bondKey = `cuidar-com-amor:${currentDateKey}:bond`

    const savedSignals = load<SignalsDayData>(signalsKey)
    const savedCare = load<CareCareData>(careKey)
    const savedBond = load<BondData>(bondKey)

    if (savedSignals && Array.isArray(savedSignals.selectedSignals)) {
      setSignalsData(savedSignals)
    }

    if (savedCare && Array.isArray(savedCare.checkedItems)) {
      setCareData(savedCare)
    }

    if (savedBond && 'selectedOption' in savedBond) {
      setBondData(savedBond)
    }
  }, [isHydrated, currentDateKey])

  // ler ?abrir= e direcionar foco
  useEffect(() => {
    const abrir = (searchParams.get('abrir') as HighlightTarget) ?? null
    if (!abrir) return

    setHighlightTarget(abrir)

    let targetRef: React.RefObject<HTMLDivElement> | null = null
    if (abrir === 'alimentacao') targetRef = cuidadosBlockRef
    if (abrir === 'sono') targetRef = sonoBlockRef
    if (abrir === 'conexao') targetRef = conexaoBlockRef
    if (abrir === 'rituais') targetRef = rituaisBlockRef

    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const timeout = setTimeout(() => setHighlightTarget(null), 1400)
    return () => clearTimeout(timeout)
  }, [searchParams])

  const highlightLabel = (target: HighlightTarget): string | null => {
    switch (target) {
      case 'alimentacao':
        return 'Alimentação & cuidados do dia'
      case 'sono':
        return 'Sono & rotina da noite'
      case 'conexao':
        return 'Conexão afetuosa'
      case 'rituais':
        return 'Pequenos rituais de vínculo'
      default:
        return null
    }
  }

  // --- sinais do dia ---

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

  // --- cuidados do dia ---

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

  // --- vínculo / planner ---

  const handleBondOptionChange = (option: 'gesto' | 'ritual') => {
    setBondData({
      selectedOption: option,
    })
  }

  const handleSaveBond = async () => {
    if (!bondData.selectedOption) {
      toast.info('Escolha uma opção para hoje.')
      return
    }

    const bondKey = `cuidar-com-amor:${currentDateKey}:bond`
    save(bondKey, bondData)

    try {
      await addItem({
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

      toast.success('Combinado de hoje salvo no seu planner.')
    } catch (error) {
      console.error('[Cuidar com Amor] Erro ao salvar no planner:', error)
      toast.danger('Não foi possível salvar agora. Tente novamente em alguns instantes.')
    }
  }

  // --- sugestões de cuidado (alimentação / sono / conexão) ---

  const handleAskSuggestion = async (feature: CuidarComAmorFeature) => {
    setSuggestionLoading(true)
    setCurrentFeature(feature)
    try {
      const data = await fetchCuidarComAmorSuggestion({
        feature,
        origin: 'cuidar-com-amor',
      })
      setCurrentSuggestion(data)
    } finally {
      setSuggestionLoading(false)
    }
  }

  const suggestionTitle = (feature: CuidarComAmorFeature | null) => {
    switch (feature) {
      case 'alimentacao':
        return 'Ideias suaves para a alimentação de hoje'
      case 'sono':
        return 'Ideias suaves para a noite de hoje'
      case 'conexao':
        return 'Ideias suaves para o vínculo de hoje'
      default:
        return 'Ideias de cuidado para hoje'
    }
  }

  return (
    <PageTemplate
      label="CUIDAR"
      title="Cuidar com Amor"
      subtitle="Pequenos gestos que fortalecem o vínculo com seu filho."
    >
      <ClientOnly>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pb-16 md:pb-20 space-y-8 md:space-y-10">
          {/* SEÇÃO 1 — HOJE COM SEU FILHO */}
          <Reveal>
            <section className="rounded-[40px] md:rounded-[44px] border border-white/40 bg-white/10 shadow-[0_22px_60px_rgba(0,0,0,0.25)] px-4 py-6 md:px-7 md:py-8 lg:px-10 lg:py-9 backdrop-blur-2xl">
              <div className="space-y-6 md:space-y-7">
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-white/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                    Hoje com seu filho
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                      Entenda o momento do seu filho com carinho.
                    </h2>
                    <p className="text-xs md:text-sm text-white/85 max-w-2xl">
                      Observe os sinais do dia e escolha formas suaves de acolher o que ele está
                      vivendo — sem pressa, sem perfeição.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 md:gap-6 lg:gap-7 md:grid-cols-2">
                  {/* SINAIS DO DIA */}
                  <SoftCard className="rounded-[28px] p-5 md:p-6 lg:p-7 bg-white border border-[#ffd8e6] shadow-[0_10px_40px_rgba(0,0,0,0.12)]">
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AppIcon name="idea" className="w-4 h-4 text-[#ff005e]" decorative />
                          <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                            Sinais do dia
                          </h3>
                        </div>
                        <p className="text-xs md:text-sm text-[#545454]">
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
                              className={`px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff005e]/20 ${
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

                      <div>
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
                        className="w-full"
                      >
                        Salvar sinais do dia
                      </Button>
                    </div>
                  </SoftCard>

                  <div className="space-y-4 md:space-y-5">
                    {/* CUIDADO EMOCIONAL POR IDADE */}
                    <div ref={conexaoBlockRef}>
                      <SoftCard
                        className={`rounded-[28px] p-5 md:p-6 bg-white border shadow-[0_10px_34px_rgba(0,0,0,0.12)] transition-all ${
                          highlightTarget === 'conexao'
                            ? 'border-[#ff005e] ring-2 ring-[#ff005e]/30'
                            : 'border-[#ffd8e6]'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <AppIcon
                                name="heart"
                                className="w-4 h-4 text-[#ff005e]"
                                decorative
                              />
                              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                                Cuidado emocional por idade
                              </h3>
                            </div>
                            <p className="text-xs md:text-sm text-[#545454]">
                              Sugestões suaves para acolher o momento do seu filho.
                            </p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-[#ffe5ef]/60 border border-[#ffd8e6]/70">
                            <p className="text-xs md:text-sm text-[#545454]">
                              Cadastre a idade do seu filho no Eu360 para receber ideias ainda mais
                              próximas da rotina de vocês.
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            {EMOTIONAL_CARE_TIPS.map((tip, idx) => (
                              <div key={idx} className="flex gap-2.5">
                                <span className="mt-1 text-[#ff005e]">•</span>
                                <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                                  {tip}
                                </p>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            className="text-xs md:text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors inline-flex items-center gap-1"
                          >
                            Ver mais ideias de cuidado →
                          </button>
                        </div>
                      </SoftCard>
                    </div>

                    {/* SONO & ROTINA — ÁUDIOS */}
                    <div ref={sonoBlockRef}>
                      <SoftCard
                        className={`rounded-[28px] p-5 md:p-6 bg-[#fff7fb] border shadow-[0_10px_34px_rgba(0,0,0,0.10)] transition-all ${
                          highlightTarget === 'sono'
                            ? 'border-[#ff005e] ring-2 ring-[#ff005e]/30'
                            : 'border-[#ffd8e6]'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <AppIcon
                                name='time'
                                className="w-4 h-4 text-[#ff005e]"
                                decorative
                              />
                              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                                Sono & rotina
                              </h3>
                            </div>
                            <p className="text-xs md:text-sm text-[#545454]">
                              Quando o sono está puxado, pequenos áudios podem deixar a noite um
                              pouco mais leve.
                            </p>
                          </div>

                          <div className="space-y-3">
                            {SLEEP_AUDIO_PLACEHOLDERS.map((audio) => (
                              <div
                                key={audio.id}
                                className="flex items-center gap-4 rounded-2xl border border-[#ffd8e6]/80 bg-white/80 px-4 py-3"
                              >
                                <button
                                  type="button"
                                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ffd8e6] bg-white shadow-sm"
                                >
                                  <AppIcon
                                    name="play"
                                    className="w-4 h-4 text-[#ff005e]"
                                    decorative
                                  />
                                </button>
                                <div className="flex-1 space-y-0.5">
                                  <p className="text-sm font-semibold text-[#2f3a56]">
                                    {audio.title}
                                  </p>
                                  <p className="text-xs text-[#545454]">{audio.description}</p>
                                </div>
                                <span className="text-[11px] text-[#545454]/70">Em breve</span>
                              </div>
                            ))}
                          </div>

                          <p className="text-[11px] md:text-xs text-[#545454]/80 leading-relaxed">
                            Para questões de sono mais específicas ou persistentes, vale sempre
                            conversar com o pediatra de confiança. Aqui, o foco é só rotina e
                            acolhimento.
                          </p>
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          {/* SEÇÃO 2 — CUIDADOS & VÍNCULO */}
          <Reveal>
            <section className="rounded-[40px] md:rounded-[44px] border border-white/35 bg-white/8 shadow-[0_22px_60px_rgba(0,0,0,0.22)] px-4 py-6 md:px-7 md:py-8 lg:px-10 lg:py-9 backdrop-blur-2xl">
              <div className="space-y-6 md:space-y-7">
                <div className="space-y-2">
                  <span className="inline-flex items-center rounded-full bg-white/16 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                    Cuidados & vínculo
                  </span>
                  <div className="space-y-1">
                    <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                      Acompanhe os cuidados do dia e escolha um gesto especial.
                    </h2>
                    <p className="text-xs md:text-sm text-white/85 max-w-2xl">
                      Marque o que já conseguiu cuidar hoje e defina um gesto ou ritual simples
                      para fortalecer o vínculo com seu filho.
                    </p>
                  </div>

                  {highlightTarget && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[11px] text-white/95">
                      <AppIcon name="sparkles" className="w-3.5 h-3.5 text-white" decorative />
                      <span>
                        Você veio de um atalho focado em{' '}
                        <span className="font-semibold">
                          {highlightLabel(highlightTarget) ?? 'cuidado do dia'}
                        </span>
                        .
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid gap-5 md:gap-6 lg:gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
                  {/* CUIDADOS DO DIA */}
                  <div ref={cuidadosBlockRef}>
                    <SoftCard
                      className={`rounded-[28px] p-5 md:p-6 lg:p-7 bg-white border shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all ${
                        highlightTarget === 'alimentacao'
                          ? 'border-[#ff005e] ring-2 ring-[#ff005e]/30'
                          : 'border-[#ffd8e6]'
                      }`}
                    >
                      <div className="space-y-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <AppIcon
                              name="heart"
                              className="w-4 h-4 text-[#ff005e]"
                              decorative
                            />
                            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                              Cuidados do dia
                            </h3>
                          </div>
                          <p className="text-xs md:text-sm text-[#545454]">
                            Acompanhe cuidados importantes de forma leve.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                            Marque o que você já conseguiu cuidar hoje:
                          </p>
                          <div className="space-y-2.5">
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
                                <span className="text-sm text-[#2f3a56] flex-1 font-medium">
                                  {item}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSaveCare}
                          className="w-full"
                        >
                          Salvar cuidados de hoje
                        </Button>
                      </div>
                    </SoftCard>
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    {/* PARA FORTALECER O VÍNCULO */}
                    <div ref={rituaisBlockRef}>
                      <SoftCard
                        className={`rounded-[28px] p-5 md:p-6 bg-white border shadow-[0_10px_34px_rgba(0,0,0,0.12)] transition-all ${
                          highlightTarget === 'rituais'
                            ? 'border-[#ff005e] ring-2 ring-[#ff005e]/30'
                            : 'border-[#ffd8e6]'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <AppIcon
                                name="care"
                                className="w-4 h-4 text-[#ff005e]"
                                decorative
                              />
                              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                                Para fortalecer o vínculo
                              </h3>
                            </div>
                            <p className="text-xs md:text-sm text-[#545454]">
                              Escolha um gesto especial para hoje.
                            </p>
                          </div>

                          <div className="space-y-3">
                            <label
                              className="flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                              style={{
                                borderColor:
                                  bondData.selectedOption === 'gesto' ? '#ff005e' : '#ffd8e6',
                                backgroundColor:
                                  bondData.selectedOption === 'gesto'
                                    ? 'rgba(255,216,230,0.35)'
                                    : 'rgba(255,216,230,0.15)',
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
                                  Escolha um pequeno gesto para deixar o dia do seu filho mais leve
                                  (ex.: bilhete, elogio, tempo de colo).
                                </p>
                              </div>
                            </label>

                            <label
                              className="flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                              style={{
                                borderColor:
                                  bondData.selectedOption === 'ritual' ? '#ff005e' : '#ffd8e6',
                                backgroundColor:
                                  bondData.selectedOption === 'ritual'
                                    ? 'rgba(255,216,230,0.35)'
                                    : 'rgba(255,216,230,0.15)',
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
                                  Defina um mini-ritual de conexão para antes de dormir ou depois da
                                  escola.
                                </p>
                              </div>
                            </label>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveBond}
                            className="w-full"
                          >
                            Salvar no planner
                          </Button>
                        </div>
                      </SoftCard>
                    </div>

                    {/* IDEIAS DE CUIDADO PARA HOJE (usa rota inteligente, sem falar isso na UI) */}
                    <div ref={conexaoBlockRef}>
                      <SoftCard className="rounded-[28px] p-5 md:p-6 bg-white/95 border border-[#ffd8e6] shadow-[0_10px_34px_rgba(0,0,0,0.12)]">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <AppIcon
                                name="sparkles"
                                className="w-4 h-4 text-[#ff005e]"
                                decorative
                              />
                              <h3 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                                Ideias de cuidado para hoje
                              </h3>
                            </div>
                            <p className="text-xs md:text-sm text-[#545454]">
                              Escolha um foco e deixe o Materna360 sugerir caminhos suaves que cabem
                              na sua rotina real.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant={currentFeature === 'alimentacao' ? 'primary' : 'ghost'}
                              size="xs"
                              onClick={() => handleAskSuggestion('alimentacao')}
                              className="px-3 py-1.5 text-xs"
                              disabled={suggestionLoading}
                            >
                              Alimentação
                            </Button>
                            <Button
                              type="button"
                              variant={currentFeature === 'sono' ? 'primary' : 'ghost'}
                              size="xs"
                              onClick={() => handleAskSuggestion('sono')}
                              className="px-3 py-1.5 text-xs"
                              disabled={suggestionLoading}
                            >
                              Sono & rotina
                            </Button>
                            <Button
                              type="button"
                              variant={currentFeature === 'conexao' ? 'primary' : 'ghost'}
                              size="xs"
                              onClick={() => handleAskSuggestion('conexao')}
                              className="px-3 py-1.5 text-xs"
                              disabled={suggestionLoading}
                            >
                              Conexão
                            </Button>
                          </div>

                          <div className="rounded-2xl border border-[#ffd8e6]/70 bg-[#fff7fb] px-4 py-3 space-y-2">
                            {suggestionLoading && (
                              <p className="text-xs text-[#545454]">
                                Estamos preparando algumas ideias para você…
                              </p>
                            )}

                            {!suggestionLoading && currentSuggestion && (
                              <>
                                <p className="text-sm font-semibold text-[#2f3a56]">
                                  {suggestionTitle(currentFeature)}
                                </p>
                                <p className="text-xs text-[#545454]">
                                  {currentSuggestion.description}
                                </p>
                                <ul className="mt-2 space-y-1.5">
                                  {currentSuggestion.tips.map((tip, idx) => (
                                    <li
                                      key={`${idx}-${tip.slice(0, 10)}`}
                                      className="flex gap-2 text-xs text-[#545454]"
                                    >
                                      <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#ff005e]" />
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                                {currentSuggestion.disclaimer && (
                                  <p className="mt-2 text-[11px] text-[#545454]/80">
                                    {currentSuggestion.disclaimer}
                                  </p>
                                )}
                              </>
                            )}

                            {!suggestionLoading && !currentSuggestion && (
                              <p className="text-xs text-[#545454]">
                                Se quiser, escolha um foco acima para receber ideias simples que
                                podem deixar o dia de vocês um pouco mais leve.
                              </p>
                            )}
                          </div>
                        </div>
                      </SoftCard>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Reveal>

          <MotivationalFooter routeKey="cuidar-cuidar-com-amor" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
