'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageTemplate } from '@/components/common/PageTemplate'
import { SoftCard } from '@/components/ui/card'
import { FilterPill } from '@/components/ui/FilterPill'
import { Button } from '@/components/ui/Button'
import AppIcon from '@/components/ui/AppIcon'
import { Reveal } from '@/components/ui/Reveal'
import { ClientOnly } from '@/components/common/ClientOnly'
import { MotivationalFooter } from '@/components/common/MotivationalFooter'

interface MaterialCard {
  id: string
  title: string
  description: string
  theme: string
  format: string
  icon: string
  href: string
  external?: boolean
}

const THEMES = [
  'Sono',
  'Alimentação',
  'Emoções & Autorregulação',
  'Birras & Comportamento',
  'Rotinas',
  'Desenvolvimento Motor',
  'Linguagem & Comunicação',
  'Desenvolvimento Cognitivo',
  'Socialização & Vínculo',
  'Parentalidade Sem Culpa',
]

// Inclui “Trilha educativa” no sistema de formatos
const FORMATS = ['PDF', 'eBook', 'Guia Prático', 'Checklist', 'Trilha educativa']

// Versão inicial – placeholders
const MATERIALS: MaterialCard[] = [
  {
    id: 'checklist-rotina-manha',
    title: 'Checklist da Rotina da Manhã',
    description:
      'Um passo a passo simples para começar o dia com um pouco mais de calma.',
    theme: 'Rotinas',
    format: 'Checklist',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'guia-leve-birras',
    title: 'Guia Leve Sobre Birras',
    description:
      'Ideias práticas para lidar com explosões emocionais sem culpa.',
    theme: 'Birras & Comportamento',
    format: 'Guia Prático',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'pdf-sono-noturno',
    title: 'PDF – Sono em Noites Difíceis',
    description:
      'Sugestões de pequenos ajustes para noites um pouco mais tranquilas.',
    theme: 'Sono',
    format: 'PDF',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'caderno-emocoes-familia',
    title: 'Caderno de Emoções da Família',
    description:
      'Um material para ajudar todos a nomearem o que sentem com mais gentileza.',
    theme: 'Emoções & Autorregulação',
    format: 'eBook',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'guia-linguagem-brincar',
    title: 'Guia – Linguagem no Brincar Diário',
    description: 'Pequenas ideias para apoiar a fala no meio da rotina real.',
    theme: 'Linguagem & Comunicação',
    format: 'Guia Prático',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'trilha-parentalidade-leve',
    title: 'Trilha Educativa – Parentalidade Mais Leve',
    description:
      'Uma sequência de conteúdos para ajudar você a sair da culpa e caminhar com mais calma, um passo por vez.',
    theme: 'Parentalidade Sem Culpa',
    format: 'Trilha educativa',
    icon: 'book-open',
    href: '#',
  },
]

type PresetFilter = 'guias' | 'pdfs-ebooks' | 'trilhas' | 'tema-fase' | null

export default function BibliotecaMaternaPage() {
  const searchParams = useSearchParams()

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [presetFilter, setPresetFilter] = useState<PresetFilter>(null)

  const materialsRef = useRef<HTMLDivElement | null>(null)

  // Lê o ?filtro= vindo do hub Maternar (Biblioteca Materna)
  useEffect(() => {
    const filtro = searchParams.get('filtro')
    if (!filtro) return

    // sempre que vier um novo filtro via URL, limpamos seleções manuais
    setSelectedTheme(null)
    setSelectedFormat(null)

    if (filtro === 'guias') {
      setPresetFilter('guias')
    } else if (filtro === 'ebooks') {
      setPresetFilter('pdfs-ebooks')
    } else if (filtro === 'trilhas') {
      setPresetFilter('trilhas')
    } else if (filtro === 'tema-fase' || filtro === 'idade-tema') {
      setPresetFilter('tema-fase')
    }
  }, [searchParams])

  // Quando vier de um atalho do hub, desce direto para a lista de materiais
  useEffect(() => {
    if (presetFilter && materialsRef.current) {
      materialsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [presetFilter])

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(prev => (prev === theme ? null : theme))
  }

  const handleFormatSelect = (format: string) => {
    // ao escolher um formato manualmente, saímos do preset vindo do hub
    setPresetFilter(null)
    setSelectedFormat(prev => (prev === format ? null : format))
  }

  const handleMaterialOpen = (material: MaterialCard) => {
    if (!material.href || material.href === '#') return

    if (material.external) {
      window.open(material.href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = material.href
    }
  }

  const filteredMaterials = useMemo(
    () =>
      MATERIALS.filter(material => {
        if (selectedTheme && material.theme !== selectedTheme) return false

        if (presetFilter) {
          if (presetFilter === 'guias') {
            if (
              !(
                material.format === 'Guia Prático' ||
                material.format === 'Checklist'
              )
            ) {
              return false
            }
          } else if (presetFilter === 'pdfs-ebooks') {
            if (!(material.format === 'PDF' || material.format === 'eBook')) {
              return false
            }
          } else if (presetFilter === 'trilhas') {
            if (material.format !== 'Trilha educativa') {
              return false
            }
          }
        } else if (selectedFormat && material.format !== selectedFormat) {
          return false
        }

        return true
      }),
    [selectedTheme, selectedFormat, presetFilter],
  )

  const hasActiveFilter =
    !!selectedTheme || !!selectedFormat || !!presetFilter

  const presetLabel =
    presetFilter === 'guias'
      ? 'Atalho: Guias & checklists'
      : presetFilter === 'pdfs-ebooks'
        ? 'Atalho: PDFs & e-books'
        : presetFilter === 'trilhas'
          ? 'Atalho: Trilhas educativas'
          : presetFilter === 'tema-fase'
            ? 'Atalho: Por idade & fase'
            : null

  const formatIsActive = (format: string) => {
    if (presetFilter === 'guias') {
      return format === 'Guia Prático' || format === 'Checklist'
    }
    if (presetFilter === 'pdfs-ebooks') {
      return format === 'PDF' || format === 'eBook'
    }
    if (presetFilter === 'trilhas') {
      return format === 'Trilha educativa'
    }
    return !presetFilter && selectedFormat === format
  }

  return (
    <PageTemplate
      label="MATERNAR"
      title="Biblioteca Materna"
      subtitle="Guias, trilhas e materiais que apoiam sua jornada, no seu tempo."
    >
      <ClientOnly>
        {/* padrão central Materna360 */}
        <div className="pt-6 pb-12 space-y-10 max-w-5xl mx-auto">
          {/* INTRO */}
          <Reveal delay={0}>
            <div className="max-w-2xl">
              <p className="text-sm md:text-base leading-relaxed text-[#545454]">
                Encontre materiais selecionados — PDFs, eBooks, guias práticos e
                conteúdos personalizados — filtrados por tema e formato para
                facilitar sua jornada.
              </p>
            </div>
          </Reveal>

          {/* FILTRAR & EXPLORAR */}
          <Reveal delay={40}>
            <SoftCard className="rounded-[32px] border border-[#F5D7E5] bg-white/95 shadow-[0_6px_22px_rgba(0,0,0,0.06)] p-5 md:p-8 space-y-6 md:space-y-8">
              <div className="space-y-2">
                <h2 className="text-base md:text-lg font-semibold text-[#545454]">
                  Filtrar e explorar
                </h2>
                <p className="text-xs md:text-sm text-[#545454] max-w-2xl">
                  Escolha um formato e, se quiser, um tema. A lista abaixo já
                  mostra os materiais que combinam com o seu momento.
                </p>

                {!hasActiveFilter && (
                  <p className="text-[11px] md:text-xs text-[#6A6A6A]">
                    Nenhum filtro ativo no momento — você está vendo uma amostra
                    geral da biblioteca.
                  </p>
                )}

                {presetLabel && (
                  <p className="inline-flex items-center gap-1 rounded-full bg-[#ffe1f1] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#b8236b] mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#fd2597]" />
                    {presetLabel}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                {/* Tema */}
                <SoftCard className="rounded-3xl bg-white p-4 md:p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
                  <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#545454] md:text-xs">
                    Tema
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {THEMES.map(theme => {
                      const active = selectedTheme === theme
                      return (
                        <button
                          key={theme}
                          type="button"
                          onClick={() => handleThemeSelect(theme)}
                          className={[
                            'w-full rounded-full px-4 py-2.5 text-sm md:text-[15px] font-medium',
                            'border transition-all shadow-[0_4px_16px_rgba(0,0,0,0.04)]',
                            active
                              ? 'border-[#fd2597] bg-[#fdbed7]/80 text-[#fd2597]'
                              : 'border-[#F5D7E5] bg-white text-[#545454] hover:border-[#fd2597]/70 hover:bg-[#fdbed7]/30',
                          ].join(' ')}
                        >
                          {theme}
                        </button>
                      )
                    })}
                  </div>
                </SoftCard>

                {/* Resultados por filtro */}
                <SoftCard className="rounded-3xl bg-white p-4 md:p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#545454] md:text-xs">
                        Resultados por filtro
                      </p>
                      <p className="mt-1 text-[11px] md:text-xs text-[#6A6A6A] max-w-sm">
                        Clique em um material na lista abaixo para abrir. Quando
                        os downloads estiverem ativos, você poderá salvar direto
                        no seu dispositivo.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {filteredMaterials.length === 0 ? (
                      <p className="text-xs md:text-sm text-[#6A6A6A]">
                        Nenhum material encontrado para esse filtro. Você pode
                        ajustar os filtros ou limpar as seleções para ver a
                        lista completa novamente.
                      </p>
                    ) : (
                      <p className="text-xs md:text-sm text-[#6A6A6A]">
                        {filteredMaterials.length} material
                        {filteredMaterials.length > 1 ? 'es' : ''} encontrado
                        {filteredMaterials.length > 1 ? 's' : ''} para esse
                        filtro.
                      </p>
                    )}
                  </div>
                </SoftCard>
              </div>

              {/* Formato */}
              <SoftCard className="rounded-3xl bg-white p-4 md:p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
                <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#545454] md:text-xs">
                  Formato
                </label>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map(format => (
                    <FilterPill
                      key={format}
                      active={formatIsActive(format)}
                      onClick={() => handleFormatSelect(format)}
                    >
                      {format}
                    </FilterPill>
                  ))}
                </div>
              </SoftCard>
            </SoftCard>
          </Reveal>

          {/* MATERIAIS DISPONÍVEIS — CARDS */}
          <Reveal delay={80}>
            <div ref={materialsRef} className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-[#545454]">
                    Materiais disponíveis
                  </h2>
                  <p className="text-xs md:text-sm text-[#545454] max-w-xl">
                    {presetLabel
                      ? `Você está vendo uma seleção de materiais baseada no atalho “${presetLabel.replace(
                          'Atalho: ',
                          '',
                        )}”.`
                      : 'Visualize os materiais como um quadro: cada card representa um cuidado possível para a sua jornada.'}
                  </p>

                  {filteredMaterials.length > 0 && (
                    <p className="text-[11px] md:text-xs text-[#6A6A6A] mt-1">
                      {filteredMaterials.length} material
                      {filteredMaterials.length > 1 ? 'es' : ''} encontrado
                      {filteredMaterials.length > 1 ? 's' : ''} para esse
                      filtro.
                    </p>
                  )}
                </div>
              </div>

              {filteredMaterials.length === 0 ? (
                <SoftCard className="mt-2 rounded-3xl bg-white p-6 text-sm text-[#6A6A6A] shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
                  Nenhum material encontrado para esse filtro. Você pode
                  ajustar os filtros ou limpar as seleções para ver a lista
                  completa novamente.
                </SoftCard>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
                  {filteredMaterials.map(material => (
                    <SoftCard
                      key={material.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleMaterialOpen(material)}
                      className="flex h-full cursor-pointer flex-col rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5] transition-all duration-200 hover:shadow-[0_10px_26px_rgba(0,0,0,0.12)] hover:border-[#fd2597]/70"
                    >
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8236b]">
                        {material.format.toUpperCase()} ·{' '}
                        {material.theme.toUpperCase()}
                      </p>

                      <h3 className="mb-1 text-sm font-semibold text-[#545454] md:text-base">
                        {material.title}
                      </h3>

                      <p className="mb-3 text-xs text-[#6A6A6A] md:text-sm">
                        {material.description}
                      </p>

                      <div className="mt-auto pt-1 text-[11px] font-semibold text-[#fd2597]">
                        {material.href && material.href !== '#'
                          ? 'Clique para acessar o material'
                          : 'Em breve disponível para download'}
                      </div>
                    </SoftCard>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* INSIGHT PERSONALIZADO */}
          <Reveal delay={120}>
            <SoftCard className="rounded-3xl bg-white p-6 md:p-8 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
              <h2 className="mb-2 text-base md:text-lg font-semibold text-[#545454]">
                Insight personalizado
              </h2>
              <p className="mb-4 text-xs md:text-sm text-[#6A6A6A]">
                Em breve, a Biblioteca vai conversar com o Eu360 para sugerir
                materiais sob medida para a fase do seu filho.
              </p>

              <div className="mt-2 flex items-start gap-3 md:gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffe1f1]">
                  <AppIcon name="idea" className="h-5 w-5 text-[#fd2597]" />
                </div>
                <p className="text-xs md:text-sm text-[#6A6A6A] leading-relaxed">
                  Quando essa área estiver ativa, você vai receber aqui
                  recomendações explicadas com carinho: por que aquele material
                  foi sugerido e como ele pode deixar o seu dia um pouco mais
                  leve.
                </p>
              </div>
            </SoftCard>
          </Reveal>

          {/* CTA PREMIUM — BANNER COLORIDO */}
          <Reveal delay={150}>
            <SoftCard className="p-0 bg-transparent border-none shadow-none">
              <div className="rounded-3xl p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.22)] bg-[radial-gradient(circle_at_top_left,#fdbed7_0,#fd2597_45%,#b8236b_100%)] text-white">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide">
                      <AppIcon name="sparkles" className="h-3 w-3" />
                      <span>Premium</span>
                    </div>

                    <h3 className="mb-1 text-lg font-semibold md:text-xl">
                      Desbloqueie conteúdos completos
                    </h3>
                    <p className="text-xs md:text-sm text-white/90 max-w-xl">
                      PDFs avançados, eBooks exclusivos, trilhas educativas e
                      guias profissionais em um só lugar — tudo pensado para a
                      sua rotina real.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full flex-shrink-0 whitespace-nowrap sm:w-auto rounded-full px-5 bg-white text-[#fd2597] hover:bg-[#ffe1f1] shadow-[0_10px_26px_rgba(0,0,0,0.25)]"
                  >
                    <AppIcon
                      name="crown"
                      className="mr-2 h-4 w-4 text-[#fd2597]"
                    />
                    Conhecer Materna+
                  </Button>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="biblioteca-materna" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
