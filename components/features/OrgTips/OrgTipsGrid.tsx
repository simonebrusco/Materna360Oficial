'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { ORG_TIPS, type OrgTip } from '@/data/org-tips'

import { OrgTipModal } from './OrgTipModal'

const LOTEA_COUNT = 6

const TIP_TAGS: Record<string, string> = {
  'ritual-de-manha-leve': 'tempo_0_5 tema_tempo_rotina formato_ritual com_sozinha',
  'dia-das-micro-tarefas': 'tempo_10_15 tema_tempo_rotina formato_checklist com_sozinha',
  'reuniao-ativa-5-min': 'tempo_0_5 tema_mental_clarity formato_passos com_sozinha',
  'rede-de-apoio-ativa': 'tempo_0_5 tema_rede_apoio formato_checklist com_familia',
  'noite-serena': 'tempo_15_20 tema_energia_pausas formato_ritual com_sozinha',
  'cesto-salva-sala': 'tempo_0_5 tema_casa_fluida formato_passos com_familia',
  'pomodoro-do-cuidado': 'tempo_15_20 tema_mental_clarity formato_passos com_sozinha',
  'estoque-do-basico': 'tempo_10_15 tema_casa_fluida formato_checklist com_familia',
  'lista-unica-semana': 'tempo_5_10 tema_tempo_rotina formato_checklist com_sozinha',
  'notas-para-o-futuro-eu': 'tempo_0_5 tema_mental_clarity formato_ritual com_sozinha',
  'apps-modo-foco': 'tempo_0_5 tema_mental_clarity formato_passos com_sozinha',
  'kits-de-lanches': 'tempo_5_10 tema_casa_fluida formato_passos com_familia',
}

const TEMPO_OPTIONS = [
  { label: '0–5 min', value: 'tempo_0_5' },
  { label: '5–10 min', value: 'tempo_5_10' },
  { label: '10–15 min', value: 'tempo_10_15' },
  { label: '15–20 min', value: 'tempo_15_20' },
] as const

const TEMA_OPTIONS = [
  { label: 'Tempo & Rotina', value: 'tema_tempo_rotina' },
  { label: 'Casa fluida', value: 'tema_casa_fluida' },
  { label: 'Clareza mental', value: 'tema_mental_clarity' },
  { label: 'Rede de apoio', value: 'tema_rede_apoio' },
  { label: 'Energia & Pausas', value: 'tema_energia_pausas' },
] as const

const FORMATO_OPTIONS = [
  { label: 'Ritual rápido', value: 'formato_ritual' },
  { label: 'Checklist', value: 'formato_checklist' },
  { label: 'Passo a passo', value: 'formato_passos' },
] as const

const COM_QUEM_OPTIONS = [
  { label: 'Sozinha', value: 'com_sozinha' },
  { label: 'Com o bebê', value: 'com_bebe' },
  { label: 'Em família', value: 'com_familia' },
] as const

type ToastState = {
  message: string
  type?: 'success' | 'error' | 'info'
}

export function OrgTipsGrid() {
  const [selectedTip, setSelectedTip] = useState<OrgTip | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [fTempo, setFTempo] = useState<string | null>(null)
  const [fTema, setFTema] = useState<string | null>(null)
  const [fFormato, setFFormato] = useState<string | null>(null)
  const [fComQuem, setFComQuem] = useState<string | null>(null)

  useEffect(() => {
    ORG_TIPS.forEach((tip) => {
      console.debug('org_tip_card_view', { id: tip.id })
    })
  }, [])

  const cards = useMemo(() => ORG_TIPS, [])
  const loteA = useMemo(() => cards.slice(0, LOTEA_COUNT), [cards])
  const loteB = useMemo(() => cards.slice(LOTEA_COUNT), [cards])

  const matchesFilters = useCallback(
    (tip: OrgTip) => {
      const tags = TIP_TAGS[tip.id] ?? ''
      const includes = (value: string | null) => !value || (tags ? tags.includes(value) : false)
      return includes(fTempo) && includes(fTema) && includes(fFormato) && includes(fComQuem)
    },
    [fComQuem, fFormato, fTema, fTempo]
  )

  const matchingLoteA = useMemo(() => loteA.filter((tip) => matchesFilters(tip)), [loteA, matchesFilters])
  const matchingLoteB = useMemo(() => loteB.filter((tip) => matchesFilters(tip)), [loteB, matchesFilters])
  const hasAnyMatch = matchingLoteA.length > 0 || matchingLoteB.length > 0

  const handleViewMore = (tip: OrgTip) => {
    setSelectedTip(tip)
    setIsModalOpen(true)
    console.debug('org_tip_modal_open', { id: tip.id })
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTip(null)
  }

  const handleComplete = (tip: OrgTip) => {
    console.debug('org_tip_complete', { id: tip.id })
    handleCloseModal()
  }

  const handleAddToPlanner = (tip: OrgTip) => {
    console.debug('planner:add:not-implemented', { id: tip.id })
    setToast({ message: 'Em breve você poderá salvar no planner ❤️', type: 'info' })
  }

  const handleToggleTempo = (value: string) => {
    setFTempo((previous) => (previous === value ? null : value))
  }

  const handleToggleTema = (value: string) => {
    setFTema((previous) => (previous === value ? null : value))
  }

  const handleToggleFormato = (value: string) => {
    setFFormato((previous) => (previous === value ? null : value))
  }

  const handleToggleComQuem = (value: string) => {
    setFComQuem((previous) => (previous === value ? null : value))
  }

  const clearFilters = () => {
    setFTempo(null)
    setFTema(null)
    setFFormato(null)
    setFComQuem(null)
  }

  const applyPreset = (preset: 'exausta' | 'casa_fluida' | 'clareza' | 'tempo_rotina') => {
    switch (preset) {
      case 'exausta':
        setFTempo('tempo_0_5')
        setFTema(null)
        setFFormato(null)
        setFComQuem(null)
        break
      case 'casa_fluida':
        setFTempo('tempo_5_10')
        setFTema('tema_casa_fluida')
        setFFormato(null)
        setFComQuem(null)
        break
      case 'clareza':
        setFTempo('tempo_0_5')
        setFTema('tema_mental_clarity')
        setFFormato(null)
        setFComQuem(null)
        break
      case 'tempo_rotina':
        setFTempo('tempo_5_10')
        setFTema('tema_tempo_rotina')
        setFFormato(null)
        setFComQuem(null)
        break
    }
    setShowAll(false)
  }

  const handleShowResults = () => {
    setShowResults(true)
    setShowAll(false)
  }

  const handleShowAll = () => {
    setShowAll(true)
  }

  const handleShowLess = () => {
    setShowAll(false)
  }

  const renderTipCard = (tip: OrgTip) => {
    const tags = TIP_TAGS[tip.id] ?? ''
    return (
      <article
        key={tip.id}
        data-testid={tip.testId}
        data-tags={tags}
        className="group flex h-full min-h-[168px] flex-col justify-between rounded-3xl border border-white/70 bg-gradient-to-br from-white/95 via-white/90 to-secondary/15 p-6 shadow-[0_22px_48px_-26px_rgba(47,58,86,0.3)] transition-all duration-300 ease-gentle hover:-translate-y-0.5 hover:shadow-[0_28px_60px_-26px_rgba(255,0,94,0.26)]"
      >
        <div className="space-y-3">
          <span aria-hidden="true" className="text-3xl">
            {tip.icon}
          </span>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-support-1 md:text-xl">{tip.title}</h3>
            <p className="text-sm text-support-2/80 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-ellipsis">
              {tip.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary/80">
              <span aria-hidden="true">⏱</span>
              {tip.duration}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-support-2/10 px-3 py-1 text-xs font-semibold text-support-2">
              <span aria-hidden="true">🧩</span>
              {tip.category}
            </span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" className="min-w-[120px]" onClick={() => handleViewMore(tip)}>
            Ver mais
          </Button>
          <Button size="sm" variant="outline" className="min-w-[140px]" onClick={() => handleAddToPlanner(tip)}>
            Adicionar ao planner
          </Button>
        </div>
      </article>
    )
  }

  const resultsStyles = useMemo(
    () => ({
      maxHeight: showResults ? '9999px' : '0px',
      opacity: showResults ? 1 : 0,
      transition: 'max-height 400ms ease, opacity 300ms ease',
    }),
    [showResults]
  )

  const chipClasses = (active: boolean) =>
    `inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
      active
        ? 'border-primary bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(255,0,94,0.35)]'
        : 'border-white/60 bg-white text-support-2 hover:border-primary/40 hover:text-primary'
    }`

  const textActionClass =
    'text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60'

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/70 bg-white/92 p-4 shadow-[0_24px_48px_-30px_rgba(47,58,86,0.32)] backdrop-blur-sm sm:p-5 md:p-6">
          <div className="space-y-5">
            <header className="space-y-2">
              <h3 className="text-lg font-semibold text-support-1">Dicas de Organização</h3>
              <p className="text-sm text-support-2/80 md:text-base">Sugestões rápidas para organizar a rotina com leveza.</p>
            </header>

            <div className="space-y-4">
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-support-2/80">Tempo livre</h4>
                <div className="flex flex-wrap gap-2">
                  {TEMPO_OPTIONS.map((option) => {
                    const active = fTempo === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleToggleTempo(option.value)}
                        className={chipClasses(active)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-support-2/80">Tema</h4>
                <div className="flex flex-wrap gap-2">
                  {TEMA_OPTIONS.map((option) => {
                    const active = fTema === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleToggleTema(option.value)}
                        className={chipClasses(active)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-support-2/80">Formato</h4>
                <div className="flex flex-wrap gap-2">
                  {FORMATO_OPTIONS.map((option) => {
                    const active = fFormato === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleToggleFormato(option.value)}
                        className={chipClasses(active)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-support-2/80">Com quem</h4>
                <div className="flex flex-wrap gap-2">
                  {COM_QUEM_OPTIONS.map((option) => {
                    const active = fComQuem === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleToggleComQuem(option.value)}
                        className={chipClasses(active)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-support-2/70">Presets rápidos</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="bg-white/80 px-4 text-sm font-semibold text-support-2/90 hover:text-primary"
                  onClick={() => applyPreset('exausta')}
                >
                  Exausta (até 5 min)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="bg-white/80 px-4 text-sm font-semibold text-support-2/90 hover:text-primary"
                  onClick={() => applyPreset('casa_fluida')}
                >
                  Casa fluida (4–10 min)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="bg-white/80 px-4 text-sm font-semibold text-support-2/90 hover:text-primary"
                  onClick={() => applyPreset('clareza')}
                >
                  Clareza mental (3–5 min)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="bg-white/80 px-4 text-sm font-semibold text-support-2/90 hover:text-primary"
                  onClick={() => applyPreset('tempo_rotina')}
                >
                  Tempo &amp; Rotina (5–10 min)
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <Button type="button" variant="primary" size="sm" className="px-6" onClick={handleShowResults}>
                Ver sugestões
              </Button>
              <Button type="button" variant="outline" size="sm" className="px-6" onClick={clearFilters}>
                Limpar filtros
              </Button>
              {showResults && !showAll ? (
                <button type="button" onClick={handleShowAll} className={textActionClass}>
                  Ver todos (12)
                </button>
              ) : null}
              {showResults && showAll ? (
                <button type="button" onClick={handleShowLess} className={textActionClass}>
                  Ver menos
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-hidden" style={resultsStyles} aria-hidden={!showResults}>
          <div className="grid grid-cols-1 gap-y-4 gap-x-3 md:grid-cols-2 md:gap-y-5 md:gap-x-4 lg:grid-cols-3 lg:gap-y-6 lg:gap-x-6">
            {showResults ? (
              <>
                <div className="contents" data-lote="A">
                  {matchingLoteA.map((tip) => renderTipCard(tip))}
                </div>
                {showAll ? (
                  <div className="contents" data-lote="B">
                    {matchingLoteB.map((tip) => renderTipCard(tip))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {showResults && !hasAnyMatch ? (
            <p className="mt-4 text-sm text-support-2/80">Nenhuma dica combina com esses filtros no momento.</p>
          ) : null}

          {showResults && !showAll && matchingLoteA.length === 0 && matchingLoteB.length > 0 ? (
            <p className="mt-2 text-xs text-support-2/70">Toque em “Ver todos (12)” para ver dicas que combinam com esses filtros.</p>
          ) : null}
        </div>
      </div>

      {selectedTip && (
        <OrgTipModal tip={selectedTip} open={isModalOpen} onClose={handleCloseModal} onComplete={handleComplete} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
