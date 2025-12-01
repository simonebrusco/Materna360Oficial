'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'
import { getBrazilDateKey } from '@/app/lib/dateKey'
import { save, load } from '@/app/lib/persist'
import { track } from '@/app/lib/telemetry'
import { toast } from '@/app/lib/toast'
import { usePlannerSavedContents } from '@/app/hooks/usePlannerSavedContents'
import AppIcon from '@/components/ui/AppIcon'

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

// Alvos válidos de highlight / atalhos
type HighlightTargetBase = 'alimentacao' | 'sono' | 'conexao' | 'rituais'
type HighlightTarget = HighlightTargetBase | null

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

// Placeholder dos áudios de sono – depois a área admin passa os arquivos reais
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
    description:
      'Som contínuo e tranquilo, perfeito para embalar o sono do seu filho.',
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
  const [highlightTarget, setHighlightTarget] = useState<HighlightTarget>(null)
  const [entryLabel, setEntryLabel] = useState<string | null>(null)

  const currentDateKey = useMemo(() => getBrazilDateKey(), [])
  const { addItem } = usePlannerSavedContents()
  const searchParams = useSearchParams()

  // Refs para scroll suave
  const cuidadosBlockRef = useRef<HTMLDivElement | null>(null)
  const cuidadosCardRef = useRef<HTMLDivElement | null>(null)
  const sonoSectionRef = useRef<HTMLDivElement | null>(null)
  const vinculoCardRef = useRef<HTMLDivElement | null>(null)

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

    if (savedCare && typeof savedCare === 'object' && 'checkedItems' in savedCare) {
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

  // Tratamento dos atalhos ?abrir=...
  useEffect(() => {
    if (!isHydrated) return

    const abrirParam = searchParams.get('abrir')

    const validTargets: HighlightTargetBase[] = [
      'alimentacao',
      'sono',
      'conexao',
      'rituais',
    ]

    const abrir = validTargets.includes(abrirParam as HighlightTargetBase)
      ? (abrirParam as HighlightTargetBase)
      : null

    if (!abrir) return

    // Mensagem suave de origem do atalho
    const labelMap: Record<HighlightTargetBase, string> = {
      alimentacao: 'Alimentação',
      sono: 'Sono & rotina',
      conexao: 'Conexão afetuosa',
      rituais: 'Pequenos rituais',
    }

    if (labelMap[abrir]) {
      setEntryLabel(`Você chegou aqui pelo atalho “${labelMap[abrir]}” do hub Maternar.`)
    }

    // Seleciona ritual automaticamente quando vier de "Pequenos rituais"
    if (abrir === 'rituais') {
      setBondData((prev) => ({
        ...prev,
        selectedOption: 'ritual',
      }))
    }

    // Define alvo e faz highlight temporário
    setHighlightTarget(abrir)
    const timeout = setTimeout(() => setHighlightTarget(null), 2600)

    // Scroll para o bloco certo
    const scrollToElement = (el: HTMLElement | null) => {
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (abrir === 'alimentacao') {
      scrollToElement(cuidadosCardRef.current)
    } else if (abrir === 'sono') {
      scrollToElement(sonoSectionRef.current ?? cuidadosBlockRef.current)
    } else if (abrir === 'conexao' || abrir === 'rituais') {
      scrollToElement(vinculoCardRef.current ?? cuidadosBlockRef.current)
    }

    return () => clearTimeout(timeout)
  }, [isHydrated, searchParams])

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
        <div className="max-w-6xl mx-auto px-4 pb-12 md:pb-16 space-y-6 md:space-y-8">
          {/* BLOCO 1 — Hoje com seu filho */}
          <Reveal delay={0}>
            <SoftCard className="rounded-[32px] md:rounded-[36px] p-5 md:p-7 lg:p-8 bg-white/5 border border-white/40 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="space-y-6 md:space-y-7">
                {/* Header do bloco */}
                <div className="space-y-2 md:space-y-3">
                  <p className="text-[11px] md:text-xs font-semibold tracking-[0.16em] uppercase text-white/80">
                    Hoje com seu filho
                  </p>
                  <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug">
                    Entenda o momento do seu filho com carinho.
                  </h2>
                  <p className="text-xs md:text-sm text-white/80 max-w-2xl">
                    Observe os sinais do dia e escolha formas suaves de acolher o que ele está
                    vivendo — sem pressa, sem perfeição.
                  </p>
                </div>

                {/* Grid: Sinais do Dia + Cuidado Emocional por Idade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-7">
                  {/* CARD — Sinais do Dia */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="space-y-3 pb-1 md:pb-2">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon name="smile" size={18} className="text-[#ff005e]" decorative />
                          Sinais do Dia
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                          Observe pequenos sinais que podem mostrar como seu filho está hoje.
                        </p>
                      </div>

                      <div className="space-y-4 flex-1">
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

                  {/* CARD — Cuidado Emocional por Idade */}
                  <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="space-y-3 pb-1 md:pb-2">
                        <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                          <AppIcon name="heart" size={18} className="text-[#ff005e]" decorative />
                          Cuidado Emocional por Idade
                        </h3>
                        <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                          Sugestões suaves para acolher o momento do seu filho.
                        </p>
                      </div>

                      <div className="space-y-4 flex-1">
                        <div className="p-4 rounded-2xl bg-[#FFE5EF]/40 border border-[#ffd8e6]/50">
                          <p className="text-xs md:text-sm text-[#545454]">
                            Cadastre a idade do seu filho no Eu360 para sugestões ainda mais
                            próximas da rotina de vocês.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {EMOTIONAL_CARE_TIPS.map((tip, idx) => (
                            <div key={idx} className="flex gap-3">
                              <div className="flex-shrink-0 text-[#6A2C70] mt-0.5 font-semibold">
                                •
                              </div>
                              <p className="text-sm text-[#545454] leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => console.log('ver mais cuidado emocional')}
                        className="text-sm font-semibold text-[#ff005e] hover:text-[#ff005e]/80 transition-colors inline-flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff005e]/60"
                      >
                        Ver mais ideias de cuidado →
                      </button>
                    </div>
                  </SoftCard>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCO 2 — Cuidados & vínculo */}
          <Reveal delay={80}>
            <div ref={cuidadosBlockRef}>
              <SoftCard className="rounded-[32px] md:rounded-[36px] p-5 md:p-7 lg:p-8 bg-white/5 border border-white/40 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <div className="space-y-6 md:space-y-7">
                  {/* Header do bloco */}
                  <div className="space-y-2 md:space-y-3">
                    <p className="text-[11px] md:text-xs font-semibold tracking-[0.16em] uppercase text-white/80">
                      Cuidados & vínculo
                    </p>
                    <h2 className="text-lg md:text-2xl font-semibold text-white leading-snug">
                      Acompanhe os cuidados do dia e escolha um gesto especial.
                    </h2>
                    <p className="text-xs md:text-sm text-white/80 max-w-2xl">
                      Marque o que já conseguiu cuidar hoje e defina um gesto ou ritual simples para
                      fortalecer o vínculo com seu filho.
                    </p>

                    {entryLabel && (
                      <div className="mt-2 rounded-2xl bg-white/8 border border-white/20 px-3 py-2 inline-flex items-center gap-2">
                        <AppIcon
                          name="sparkles"
                          size={14}
                          className="text-white/90"
                          decorative
                        />
                        <p className="text-[11px] md:text-xs text-white/85">{entryLabel}</p>
                      </div>
                    )}
                  </div>

                  {/* Grid: Cuidados do Dia + Para Fortalecer o Vínculo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-7">
                    {/* CARD — Cuidados do Dia + Sono & Rotina */}
                    <div ref={cuidadosCardRef}>
                      <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <div className="space-y-6 flex flex-col h-full">
                          <div className="space-y-3 pb-1 md:pb-2">
                            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                              <AppIcon
                                name="check-circle"
                                size={18}
                                className="text-[#ff005e]"
                                decorative
                              />
                              Cuidados do Dia
                            </h3>
                            <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                              Acompanhe cuidados importantes de forma leve.
                            </p>
                          </div>

                          <div className="space-y-4 flex-1">
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-[#2f3a56] uppercase tracking-wide">
                                Marque o que você já conseguiu cuidar hoje:
                              </p>
                              <div className="space-y-2.5">
                                {CARE_ITEMS.map((item) => {
                                  const isHighlighted =
                                    (highlightTarget === 'sono' &&
                                      item === 'Sono respeitado') ||
                                    (highlightTarget === 'alimentacao' &&
                                      item === 'Alimentação equilibrada')

                                  return (
                                    <label
                                      key={item}
                                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 focus-within:ring-2 focus-within:ring-[#ff005e]/20 ${
                                        isHighlighted
                                          ? 'bg-[#ffd8e6]/40 border border-[#ff005e]/40 shadow-sm'
                                          : 'hover:bg-[#ffd8e6]/10 border border-transparent'
                                      }`}
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
                                  )
                                })}
                              </div>
                            </div>

                            {/* SONO & ROTINA – audios (placeholder) */}
                            <div
                              ref={sonoSectionRef}
                              className={`mt-4 rounded-2xl border ${
                                highlightTarget === 'sono'
                                  ? 'border-[#ff005e]/60 bg-[#ffd8e6]/35'
                                  : 'border-[#ffd8e6]/70 bg-[#ffd8e6]/20'
                              } p-4 space-y-3`}
                            >
                              <div className="flex items-center gap-2">
                                <AppIcon
                                  name="moon"
                                  size={18}
                                  className="text-[#ff005e]"
                                  decorative
                                />
                                <div>
                                  <h4 className="text-sm font-semibold text-[#2f3a56]">
                                    Sono & rotina
                                  </h4>
                                  <p className="text-xs text-[#545454]">
                                    Quando o sono está puxado, pequenos áudios podem deixar a noite
                                    um pouco mais leve.
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2.5">
                                {SLEEP_AUDIO_PLACEHOLDERS.map((audio) => (
                                  <div
                                    key={audio.id}
                                    className="flex items-center gap-3 rounded-xl bg-white/70 border border-[#ffd8e6]/70 px-3 py-2.5"
                                  >
                                    <button
                                      type="button"
                                      disabled
                                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ff005e]/30 text-[#ff005e]/80 text-xs font-semibold"
                                      title="Em breve"
                                    >
                                      <AppIcon name="play" size={16} decorative />
                                    </button>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-[#2f3a56]">
                                        {audio.title}
                                      </p>
                                      <p className="text-[11px] text-[#545454]">
                                        {audio.description}
                                      </p>
                                    </div>
                                    <span className="text-[10px] font-medium text-[#545454]/70">
                                      Em breve
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <p className="text-[11px] text-[#545454]/80 pt-1">
                                Para questões de sono mais específicas ou persistentes, vale sempre
                                conversar com o pediatra de confiança. Aqui, o foco é só rotina e
                                acolhimento.
                              </p>
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
                    </div>

                    {/* CARD — Para Fortalecer o Vínculo */}
                    <div ref={vinculoCardRef}>
                      <SoftCard className="h-full rounded-3xl p-6 md:p-7 bg-white border border-[#ffd8e6] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                        <div className="space-y-6 flex flex-col h-full">
                          <div className="space-y-3 pb-1 md:pb-2">
                            <h3 className="text-base md:text-lg font-semibold text-[#2f3a56] flex items-center gap-2">
                              <AppIcon
                                name="heart-handshake"
                                size={18}
                                className="text-[#ff005e]"
                                decorative
                              />
                              Para Fortalecer o Vínculo
                            </h3>
                            <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                              Escolha um gesto especial para hoje.
                            </p>
                          </div>

                          <div className="space-y-3 flex-1">
                            {/* Gesto Option */}
                            <label
                              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                bondData.selectedOption === 'gesto'
                                  ? 'border-[#ff005e] bg-[#ffd8e6]/20'
                                  : 'border-[#ffd8e6] bg-[#ffd8e6]/10 hover:bg-[#ffd8e6]/20'
                              } ${
                                highlightTarget === 'conexao'
                                  ? 'ring-2 ring-[#ff005e]/35'
                                  : ''
                              }`}
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
                                  Gesto de Hoje
                                </h4>
                                <p className="text-xs text-[#545454] leading-relaxed">
                                  Escolha um pequeno gesto para deixar o dia do seu filho mais leve
                                  (ex.: bilhete, elogio, tempo de colo).
                                </p>
                              </div>
                            </label>

                            {/* Ritual Option */}
                            <label
                              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                                bondData.selectedOption === 'ritual'
                                  ? 'border-[#ff005e] bg-[#ffd8e6]/20'
                                  : 'border-[#ffd8e6] bg-[#ffd8e6]/10 hover:bg-[#ffd8e6]/20'
                              } ${
                                highlightTarget === 'rituais'
                                  ? 'ring-2 ring-[#ff005e]/35'
                                  : ''
                              }`}
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
                                  Ritual Rápido
                                </h4>
                                <p className="text-xs text-[#545454] leading-relaxed">
                                  Defina um mini-ritual de conexão para antes de dormir ou depois da
                                  escola.
                                </p>
                              </div>
                            </label>

                            {/* Espaço futuro para IA de conexão (placeholder suave) */}
                            <div className="mt-2 rounded-2xl bg-[#FFE5EF]/35 border border-[#ffd8e6]/70 px-3.5 py-3">
                              <p className="text-[11px] text-[#545454] leading-relaxed">
                                Em breve, este espaço traz ideias suaves de gestos e rituais de
                                conexão sugeridos pela IA do Materna360 — sempre com foco em
                                presença e acolhimento, nunca em regras rígidas.
                              </p>
                            </div>
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
                    </div>
                  </div>
                </div>
              </SoftCard>
            </div>
          </Reveal>

          <MotivationalFooter routeKey="cuidar-cuidar-com-amor" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
