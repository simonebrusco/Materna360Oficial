'use client'

import { useState } from 'react'
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

const PLACEHOLDER_MATERIALS: MaterialCard[] = [
  {
    id: 'material-1',
    title: 'Título do Material',
    description: 'Descrição breve do conteúdo selecionado.',
    theme: 'Sono',
    format: 'PDF',
    icon: 'book-open',
  },
  {
    id: 'material-2',
    title: 'Título do Material',
    description: 'Descrição breve do conteúdo selecionado.',
    theme: 'Alimentação',
    format: 'eBook',
    icon: 'book-open',
  },
  {
    id: 'material-3',
    title: 'Título do Material',
    description: 'Descrição breve do conteúdo selecionado.',
    theme: 'Desenvolvimento Motor',
    format: 'Guia Prático',
    icon: 'book-open',
  },
]

export default function BibliotecaMaternaPage() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(selectedTheme === theme ? null : theme)
  }

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(selectedFormat === format ? null : format)
  }

  return (
    <PageTemplate
      label="MATERNAR"
      title="Biblioteca materna"
      subtitle="Guias, trilhas e materiais que apoiam sua jornada, no seu tempo."
    >
      <ClientOnly>
        <div className="mx-auto max-w-4xl px-4 md:px-6 space-y-10 pb-20">
          {/* INTRO TEXT */}
          <Reveal delay={0}>
            <div className="max-w-2xl">
              <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
                Encontre materiais selecionados — PDFs, eBooks, guias práticos e
                conteúdos personalizados — filtrados por tema e formato para
                facilitar sua jornada.
              </p>
            </div>
          </Reveal>

          {/* FILTER SECTION */}
          <Reveal delay={50}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[var(--color-border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 border-b border-[var(--color-border-soft)] pb-4 mb-8">
                <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                  Filtrar por
                </h2>
                <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  Selecione um tema e um formato para encontrar conteúdos que
                  façam sentido para o seu momento.
                </p>
              </div>

              <div className="space-y-8">
                {/* Theme Filter */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide mb-3">
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
                </div>

                {/* Format Filter */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-main)] uppercase tracking-wide mb-3">
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
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* RESULTS SECTION */}
          <Reveal delay={80}>
            <div className="space-y-3 border-b border-[var(--color-border-soft)] pb-4 mb-8">
              <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                Materiais disponíveis
              </h2>
              <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
                {selectedTheme || selectedFormat
                  ? `Resultados filtrados por ${
                      selectedTheme ? `tema: ${selectedTheme}` : ''
                    }${
                      selectedTheme && selectedFormat ? ' e ' : ''
                    }${selectedFormat ? `formato: ${selectedFormat}` : ''}`
                  : 'Todos os materiais'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {PLACEHOLDER_MATERIALS.map((material, index) => (
                <Reveal key={material.id} delay={100 + index * 30}>
                  <SoftCard className="rounded-3xl p-5 sm:p-6 flex flex-col h-full bg-white border border-[var(--color-border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(255,0,94,0.1)] overflow-hidden">
                    {/* Thumbnail Placeholder */}
                    <div className="mb-4 h-32 bg-gradient-to-br from-[var(--color-soft-strong)]/40 to-[var(--color-soft-strong)] rounded-2xl flex items-center justify-center">
                      <AppIcon
                        name={material.icon as any}
                        size={48}
                        className="text-[var(--color-brand)]/40"
                        decorative
                      />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2 line-clamp-2">
                      {material.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-4 line-clamp-2">
                      {material.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                        {material.theme}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-soft-bg)] text-[var(--color-text-muted)]">
                        {material.format}
                      </span>
                    </div>

                    {/* CTA */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        // placeholder por enquanto
                      }}
                      className="w-full mt-auto"
                    >
                      Acessar
                    </Button>
                  </SoftCard>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* INSIGHT SECTION */}
          <Reveal delay={120}>
            <div className="space-y-3 border-b border-[var(--color-border-soft)] pb-4 mb-8">
              <h2 className="text-base md:text-lg font-semibold text-[var(--color-text-main)]">
                Insight personalizado
              </h2>
              <p className="text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Em breve, você verá aqui recomendações inteligentes com base na
                idade e fase do seu filho.
              </p>
            </div>

            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[var(--color-border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-[var(--color-soft-strong)]/60 flex items-center justify-center">
                  <AppIcon name="idea" size={24} className="text-[var(--color-brand)]" decorative />
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
                    Seu filho está passando por uma fase importante de
                    desenvolvimento. Quando a Biblioteca estiver ativa, você vai
                    receber aqui sugestões feitas para esse momento.
                  </p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* PREMIUM CTA SECTION */}
          <Reveal delay={150}>
            <SoftCard className="rounded-3xl p-6 md:p-8 bg-white border border-[var(--color-border-soft)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-soft)]/60 text-[var(--color-brand)] text-xs font-semibold mb-3">
                    <AppIcon name="sparkles" size={12} decorative />
                    <span>Premium</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-main)] mb-2">
                    Desbloqueie conteúdos completos
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    PDFs avançados, eBooks exclusivos, trilhas educativas e
                    guias profissionais em um só lugar.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-shrink-0 whitespace-nowrap w-full sm:w-auto"
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
