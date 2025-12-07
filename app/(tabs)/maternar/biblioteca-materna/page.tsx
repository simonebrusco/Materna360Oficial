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

const FORMATS = ['PDF', 'eBook', 'Guia Prático', 'Checklist', 'Trilha educativa']

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
    description:
      'Pequenas ideias para apoiar a fala no meio da rotina real.',
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

  // Lê o ?filtro= vindo do hub Maternar
  useEffect(() => {
    const filtro = searchParams.get('filtro')
    if (!filtro) return

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
    setPresetFilter(null)
    setSelectedFormat(prev => (prev === format ? null : format))
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
        <div className="max-w-5xl mx-auto pt-6 pb-16 space-y-10 px-4 md:px-6">
          {/* INTRO */}
          <Reveal delay={0}>
            <div className="max-w-3xl">
              <p className="text-sm md:text-base text-white">
                <span className="font-semibold">
                  Encontre materiais que conversam com o seu momento.
                </span>{' '}
                PDFs, eBooks, guias práticos e trilhas educativas selecionadas
                com carinho para facilitar sua jornada — sem pressão, no seu tempo.
              </p>
            </div>
          </Reveal>

          {/* BLOCO 1 — FILTROS */}
          <Reveal delay={40}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white/95 border border-[#ffd8e6] shadow-[0_14px_40px_rgba(0,0,0,0.16)]">
              <div className="space-y-6 md:space-y-7">
                <header className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                    Explorar conteúdos
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                    Filtre a Biblioteca para o que faz sentido hoje.
                  </h2>
                  <p className="text-sm text-[#545454] max-w-2xl">
                    Escolha um tema e um formato para encontrar materiais que
                    acompanham a fase da sua família. Você pode usar tudo, ou
                    apenas o que encaixar na rotina real — sem metas impossíveis.
                  </p>

                  {!hasActiveFilter && (
                    <p className="text-[11px] text-[#545454]/80 mt-1">
                      Nenhum filtro ativo no momento — você está vendo uma amostra
                      geral da Biblioteca Materna.
                    </p>
                  )}

                  {presetLabel && (
                    <p className="inline-flex items-center gap-1 rounded-full bg-[#fff7fb] px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[#cf285f] mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#ff005e]" />
                      {presetLabel}
                    </p>
                  )}
                </header>

                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  {/* TEMA */}
                  <div className="rounded-2xl border border-[#ffd8e6] bg-white px-4 py-4 md:px-5 md:py-5 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
                    <label className="mb-3 block text-[11px] md:text-xs font-semibold uppercase tracking-wide text-[#2f3a56]">
                      Tema
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {THEMES.map(theme => (
                        <FilterPill
                          key={theme}
                          active={selectedTheme === theme}
                          onClick={() => handleThemeSelect(theme)}
                        >
                          {theme}
                        </FilterPill>
                      ))}
                    </div>
                  </div>

                  {/* FORMATO */}
                  <div className="rounded-2xl border border-[#ffd8e6] bg-white px-4 py-4 md:px-5 md:py-5 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
                    <label className="mb-3 block text-[11px] md:text-xs font-semibold uppercase tracking-wide text-[#2f3a56]">
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
                  </div>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCO 2 — MATERIAIS DISPONÍVEIS */}
          <Reveal delay={80}>
            <div ref={materialsRef}>
              <SoftCard className="rounded-3xl p-6 md:p-7 bg-white/95 border border-[#ffd8e6] shadow-[0_10px_32px_rgba(0,0,0,0.14)]">
                <div className="space-y-5">
                  <header className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-[0.26em] uppercase text-[#ff005e]/80">
                      Materiais disponíveis
                    </p>
                    <h2 className="text-lg md:text-xl font-semibold text-[#2f3a56]">
                      Uma prateleira de conteúdos para consultar quando precisar.
                    </h2>
                    <p className="text-sm text-[#545454] max-w-xl">
                      {presetLabel
                        ? `Você está vendo uma seleção de materiais baseada no atalho “${presetLabel.replace(
                            'Atalho: ',
                            '',
                          )}”.`
                        : 'Essa é uma prévia de como os materiais da Biblioteca Materna vão aparecer por aqui.'}
                    </p>
                  </header>

                  {filteredMaterials.length === 0 ? (
                    <SoftCard className="mt-2 rounded-3xl bg-[#fff7fb] p-6 text-sm text-[#545454] border border-[#ffd8e6] shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
                      Nenhum material encontrado para esse filtro. Você pode
                      ajustar as opções ou limpar as seleções para ver a lista
                      completa novamente.
                    </SoftCard>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
                      {filteredMaterials.map((material, index) => (
                        <Reveal key={material.id} delay={100 + index * 30}>
                          <SoftCard className="flex h-full flex-col rounded-2xl bg-white p-5 border border-[#ffd8e6] shadow-[0_8px_22px_rgba(0,0,0,0.10)] transition-all duration-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
                            <div className="mb-4 flex items-start justify-between">
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffe5ef]">
                                <AppIcon
                                  name={material.icon as any}
                                  size={22}
                                  className="text-[#ff005e]"
                                  decorative
                                />
                              </div>
                            </div>

                            <h3 className="mb-1 text-sm md:text-base font-semibold text-[#2f3a56]">
                              {material.title}
                            </h3>
                            <p className="mb-4 text-xs md:text-sm text-[#545454]">
                              {material.description}
                            </p>

                            <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
                              <span className="inline-flex items-center rounded-full bg-[#ffd8e6]/60 px-2.5 py-1 font-medium text-[#cf285f]">
                                {material.theme}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-[#fff2f8] px-2.5 py-1 font-medium text-[#545454]">
                                {material.format}
                              </span>
                            </div>

                            <Button
                              variant="primary"
                              size="sm"
                              className="mt-auto w-full"
                              onClick={() => {
                                if (!material.href) return
                                if (material.external) {
                                  window.open(
                                    material.href,
                                    '_blank',
                                    'noopener,noreferrer',
                                  )
                                } else {
                                  window.location.href = material.href
                                }
                              }}
                            >
                              Acessar
                            </Button>
                          </SoftCard>
                        </Reveal>
                      ))}
                    </div>
                  )}
                </div>
              </SoftCard>
            </div>
          </Reveal>

          {/* BLOCO 3 — INSIGHT PERSONALIZADO */}
          <Reveal delay={120}>
            <SoftCard className="rounded-3xl bg-white/95 p-6 md:p-8 border border-white/70 shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#545454]">
                    Em breve
                  </p>
                  <h2 className="text-base md:text-lg font-semibold text-[#2f3a56]">
                    Insight personalizado para a fase do seu filho.
                  </h2>
                  <p className="text-xs md:text-sm text-[#545454]">
                    A Biblioteca vai conversar com o Eu360 para sugerir materiais
                    sob medida para a idade e o momento da sua família.
                  </p>
                </div>

                <div className="mt-1 flex items-start gap-3 md:gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffe5ef]">
                    <AppIcon
                      name="idea"
                      size={20}
                      className="text-[#ff005e]"
                      decorative
                    />
                  </div>
                  <p className="text-xs md:text-sm text-[#545454] leading-relaxed">
                    Quando essa área estiver ativa, você vai receber aqui
                    recomendações explicadas com carinho: por que aquele material
                    foi sugerido, em qual contexto ele ajuda mais e como pode
                    deixar o seu dia um pouco mais leve.
                  </p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* BLOCO 4 — CTA PREMIUM */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8 shadow-[0_14px_38px_rgba(0,0,0,0.22)] border border-white/60 bg-[radial-gradient(circle_at_top_left,#FF7BB1_0,#FF1475_40%,#9B4D96_100%)] text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide">
                    <AppIcon name="sparkles" size={12} decorative />
                    <span>Premium</span>
                  </div>
                  <h3 className="mb-1 text-lg md:text-xl font-semibold">
                    Desbloqueie conteúdos completos
                  </h3>
                  <p className="text-xs md:text-sm text-white/90 max-w-xl">
                    PDFs avançados, eBooks exclusivos, trilhas educativas e guias
                    profissionais em um só lugar — tudo pensado para caber na sua
                    rotina real, sem exigir perfeição.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex-shrink-0 whitespace-nowrap sm:w-auto bg-white/95 hover:bg-white shadow-[0_10px_26px_rgba(0,0,0,0.25)] rounded-full px-5 !text-[#ff005e]"
                >
                  <AppIcon
                    name="crown"
                    size={14}
                    decorative
                    className="mr-2 !text-[#ff005e]"
                  />
                  Conhecer Materna+
                </Button>
              </div>
            </SoftCard>
          </Reveal>

          <MotivationalFooter routeKey="biblioteca-materna" />
        </div>
      </ClientOnly>
    </PageTemplate>
  )
}
