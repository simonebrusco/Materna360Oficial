'use client'

import { useState, useMemo } from 'react'
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

const FORMATS = ['PDF', 'eBook', 'Guia Prático', 'Checklist', 'Insights (IA)']

// Versão inicial – placeholders. Depois é só trocar title/description/href pelos materiais reais.
const MATERIALS: MaterialCard[] = [
  {
    id: 'checklist-rotina-manha',
    title: 'Checklist da Rotina da Manhã',
    description: 'Um passo a passo simples para começar o dia com um pouco mais de calma.',
    theme: 'Rotinas',
    format: 'Checklist',
    icon: 'book-open',
    href: '#', // futuro: link para download / admin
  },
  {
    id: 'guia-leve-birras',
    title: 'Guia Leve Sobre Birras',
    description: 'Ideias práticas para lidar com explosões emocionais sem culpa.',
    theme: 'Birras & Comportamento',
    format: 'Guia Prático',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'pdf-sono-noturno',
    title: 'PDF – Sono em Noites Difíceis',
    description: 'Sugestões de pequenos ajustes para noites um pouco mais tranquilas.',
    theme: 'Sono',
    format: 'PDF',
    icon: 'book-open',
    href: '#',
  },
  {
    id: 'caderno-emocoes-familia',
    title: 'Caderno de Emoções da Família',
    description: 'Um material para ajudar todos a nomearem o que sentem com mais gentileza.',
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
    id: 'insights-parentalidade',
    title: 'Insights de Parentalidade Sem Culpa',
    description: 'Reflexões curtas para dias em que a cobrança pesa demais.',
    theme: 'Parentalidade Sem Culpa',
    format: 'Insights (IA)',
    icon: 'book-open',
    href: '#',
  },
]

export default function BibliotecaMaternaPage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme((prev) => (prev === theme ? null : theme))
  }

  const handleFormatSelect = (format: string) => {
    setSelectedFormat((prev) => (prev === format ? null : format))
  }

  const filteredMaterials = useMemo(
    () =>
      MATERIALS.filter((material) => {
        if (selectedTheme && material.theme !== selectedTheme) return false
        if (selectedFormat && material.format !== selectedFormat) return false
        return true
      }),
    [selectedTheme, selectedFormat],
  )

  const hasActiveFilter = !!selectedTheme || !!selectedFormat

  return (
    <PageTemplate
      label="MATERNAR"
      title="Biblioteca Materna"
      subtitle="Guias, trilhas e materiais que apoiam sua jornada, no seu tempo."
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:px-6 space-y-10 md:space-y-12">
          {/* Intro */}
          <Reveal delay={0}>
            <div className="max-w-3xl">
              <p className="text-sm md:text-base leading-relaxed text-white/90">
                Encontre materiais selecionados — PDFs, eBooks, guias práticos e conteúdos
                personalizados — filtrados por tema e formato para facilitar sua jornada.
              </p>
            </div>
          </Reveal>

          {/* FILTROS */}
          <Reveal delay={40}>
            <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/10 px-4 py-6 shadow-[0_22px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:px-8 md:py-8">
              {/* glow de fundo */}
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-6 md:space-y-8">
                <div className="space-y-2">
                  <h2 className="text-base md:text-lg font-semibold text-white">
                    Filtrar por
                  </h2>
                  <p className="text-xs md:text-sm text-white/90 max-w-2xl">
                    Escolha um tema e um formato para encontrar conteúdos que conversem com o seu
                    momento.
                  </p>
                  {!hasActiveFilter && (
                    <p className="text-[11px] md:text-xs text-white/75">
                      Nenhum filtro ativo no momento — você está vendo uma amostra geral da
                      biblioteca.
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                  {/* Tema */}
                  <SoftCard className="rounded-2xl bg-white/90 p-4 md:p-5 shadow-md border border-[var(--color-border-soft)]">
                    <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-main)] md:text-xs">
                      Tema
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {THEMES.map((theme) => (
                        <FilterPill
                          key={theme}
                          active={selectedTheme === theme}
                          onClick={() => handleThemeSelect(theme)}
                        >
                          {theme}
                        </FilterPill>
                      ))}
                    </div>
                  </SoftCard>

                  {/* Formato */}
                  <SoftCard className="rounded-2xl bg-white/90 p-4 md:p-5 shadow-md border border-[var(--color-border-soft)]">
                    <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-main)] md:text-xs">
                      Formato
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FORMATS.map((format) => (
                        <FilterPill
                          key={format}
                          active={selectedFormat === format}
                          onClick={() => handleFormatSelect(format)}
                        >
                          {format}
                        </FilterPill>
                      ))}
                    </div>
                  </SoftCard>
                </div>
              </div>
            </div>
          </Reveal>

          {/* MATERIAIS DISPONÍVEIS */}
          <Reveal delay={80}>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                    Materiais disponíveis
                  </h2>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-xl">
                    Uma prévia de como os materiais da Biblioteca Materna vão aparecer por aqui.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)] shadow-sm">
                  Versão inicial — em construção
                </span>
              </div>

              {filteredMaterials.length === 0 ? (
                <SoftCard className="mt-2 rounded-3xl bg-white p-6 text-sm text-[var(--color-text-muted)] shadow-md">
                  Nenhum material encontrado para esse filtro. Você pode ajustar os filtros ou
                  limpar as seleções para ver a lista completa novamente.
                </SoftCard>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
                  {filteredMaterials.map((material, index) => (
                    <Reveal key={material.id} delay={100 + index * 30}>
                      <SoftCard className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-md border border-[var(--color-border-soft)] transition-all duration-200 hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="h-10 w-10 rounded-2xl bg-[var(--color-soft-strong)]/60 flex items-center justify-center">
                            <AppIcon
                              name={material.icon as any}
                              size={24}
                              className="text-[var(--color-brand)]"
                              decorative
                            />
                          </div>
                        </div>

                        <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-main)] md:text-base">
                          {material.title}
                        </h3>
                        <p className="mb-4 text-xs text-[var(--color-text-muted)] md:text-sm">
                          {material.description}
                        </p>

                        <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
                          <span className="inline-flex items-center rounded-full bg-[var(--color-brand)]/10 px-2.5 py-1 font-medium text-[var(--color-brand)]">
                            {material.theme}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[var(--color-soft-bg)] px-2.5 py-1 font-medium text-[var(--color-text-muted)]">
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
                              window.open(material.href, '_blank', 'noopener,noreferrer')
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
          </Reveal>

          {/* INSIGHT PERSONALIZADO */}
          <Reveal delay={120}>
            <SoftCard className="rounded-3xl bg-white p-6 md:p-8 shadow-md border border-[var(--color-border-soft)]">
              <h2 className="mb-2 text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                Insight personalizado
              </h2>
              <p className="mb-4 text-xs md:text-sm text-[var(--color-text-muted)]">
                Em breve, a Biblioteca vai conversar com o Eu360 para sugerir materiais sob medida
                para a fase do seu filho.
              </p>

              <div className="mt-2 flex items-start gap-3 md:gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-soft-strong)]/60">
                  <AppIcon name="idea" size={20} className="text-[var(--color-brand)]" decorative />
                </div>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Quando essa área estiver ativa, você vai receber aqui recomendações explicadas com
                  carinho: por que aquele material foi sugerido e como ele pode deixar o seu dia um
                  pouco mais leve.
                </p>
              </div>
            </SoftCard>
          </Reveal>

          {/* CTA PREMIUM */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl bg-white p-6 md:p-8 shadow-md border border-[var(--color-border-soft)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-soft-strong)]/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                    <AppIcon name="sparkles" size={12} decorative />
                    <span>Premium</span>
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-[var(--color-text-main)] md:text-xl">
                    Desbloqueie conteúdos completos
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--color-text-muted)] max-w-xl">
                    PDFs avançados, eBooks exclusivos, trilhas educativas e guias profissionais em
                    um só lugar — tudo pensado para a sua rotina real.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex-shrink-0 whitespace-nowrap sm:w-auto"
                >
                  <AppIcon name="crown" size={14} decorative className="mr-1" />
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
