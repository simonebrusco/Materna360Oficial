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
    title: 'Checklist da rotina da manhã',
    description: 'Um passo a passo simples para começar o dia com mais calma.',
    theme: 'Rotinas',
    format: 'Checklist',
    icon: 'book-open',
  },
  {
    id: 'material-2',
    title: 'Guia leve sobre birras',
    description: 'Ideias práticas para lidar com explosões emocionais sem culpa.',
    theme: 'Birras & Comportamento',
    format: 'Guia Prático',
    icon: 'book-open',
  },
  {
    id: 'material-3',
    title: 'PDF – Sono em noites difíceis',
    description: 'Sugestões de pequenos ajustes para noites um pouco mais tranquilas.',
    theme: 'Sono',
    format: 'PDF',
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
        <div className="mx-auto max-w-4xl px-4 pb-24 pt-2 md:px-6 space-y-10">
          {/* INTRO */}
          <Reveal delay={0}>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
              Encontre materiais selecionados — PDFs, eBooks, guias práticos e
              conteúdos personalizados — filtrados por tema e formato para
              facilitar sua jornada.
            </p>
          </Reveal>

          {/* FILTROS — CARD GLASS (TEXTO BRANCO) */}
          <Reveal delay={40}>
            <SoftCard className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/10 px-5 py-6 shadow-[0_22px_55px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:px-8 md:py-8">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                <div className="absolute -bottom-12 -right-10 h-28 w-28 rounded-full bg-[rgba(155,77,150,0.2)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="space-y-2">
                  <h2 className="text-base font-semibold text-white md:text-lg">
                    Filtrar por
                  </h2>
                  <p className="text-xs leading-relaxed text-white/80 md:text-sm">
                    Escolha um tema e um formato para encontrar conteúdos que
                    conversem com o seu momento.
                  </p>
                </div>

                {/* Tema */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/90">
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

                {/* Formato */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-white/90">
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

          {/* MATERIAIS DISPONÍVEIS — CARD BRANCO PREMIUM */}
          <Reveal delay={80}>
            <SoftCard className="rounded-3xl border border-white/80 bg-white/95 px-5 py-6 shadow-[0_16px_45px_rgba(0,0,0,0.10)] md:px-8 md:py-8">
              <div className="space-y-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--color-text-main)] md:text-lg">
                      Materiais disponíveis
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)] md:text-sm">
                      {selectedTheme || selectedFormat
                        ? `Filtrando por ${selectedTheme ? `tema: ${selectedTheme}` : ''}${selectedTheme && selectedFormat ? ' · ' : ''}${selectedFormat ? `formato: ${selectedFormat}` : ''}.`
                        : 'Uma amostra dos conteúdos que irão morar aqui.'}
                    </p>
                  </div>

                  <span className="mt-1 inline-flex items-center rounded-full bg-[var(--color-soft-strong)]/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-main)] md:text-xs">
                    Versão inicial da biblioteca — em evolução
                  </span>
                </div>

                <div className="h-px w-full bg-[var(--color-soft-strong)]/80" />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                  {PLACEHOLDER_MATERIALS.map((material, index) => (
                    <Reveal key={material.id} delay={100 + index * 40}>
                      <SoftCard className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#ffd8e6] bg-white p-5 shadow-[0_8px_26px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                        {/* Thumb */}
                        <div className="mb-4 flex h-28 items-center justify-center rounded-2xl bg-[var(--color-soft-strong)]/80">
                          <AppIcon
                            name={material.icon as any}
                            size={40}
                            className="text-[var(--color-brand)]/70"
                            decorative
                          />
                        </div>

                        {/* Conteúdo */}
                        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-[var(--color-text-main)]">
                          {material.title}
                        </h3>
                        <p className="mb-4 line-clamp-3 text-sm text-[var(--color-text-muted)]">
                          {material.description}
                        </p>

                        {/* Tags */}
                        <div className="mb-4 flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center rounded-full bg-[var(--color-brand)]/10 px-2.5 py-1 font-medium text-[var(--color-brand)]">
                            {material.theme}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[var(--color-soft-bg)] px-2.5 py-1 font-medium text-[var(--color-text-muted)]">
                            {material.format}
                          </span>
                        </div>

                        {/* CTA */}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => (window.location.href = '#')}
                          className="mt-auto w-full"
                        >
                          Acessar
                        </Button>
                      </SoftCard>
                    </Reveal>
                  ))}
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* INSIGHT PERSONALIZADO — GLASS COM TEXTO BRANCO */}
          <Reveal delay={120}>
            <SoftCard className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/10 px-5 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:px-8 md:py-8">
              <div className="pointer-events-none absolute inset-0 opacity-80">
                <div className="absolute -left-12 -top-8 h-24 w-24 rounded-full bg-[rgba(255,20,117,0.25)] blur-3xl" />
              </div>

              <div className="relative z-10 space-y-3">
                <h2 className="text-base font-semibold text-white md:text-lg">
                  Insight personalizado
                </h2>
                <p className="text-xs text-white/80 md:text-sm">
                  Em breve, a Biblioteca vai conversar com o perfil do Eu360
                  para sugerir materiais sob medida para a fase do seu filho.
                </p>

                <div className="mt-4 flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/90">
                    <AppIcon
                      name="idea"
                      size={22}
                      className="text-[var(--color-brand)]"
                      decorative
                    />
                  </div>
                  <p className="text-sm leading-relaxed text-white/90">
                    Quando essa área estiver ativa, você verá aqui recomendações
                    explicadas com carinho: por que aquele material foi sugerido
                    e como ele pode deixar o seu dia mais leve.
                  </p>
                </div>
              </div>
            </SoftCard>
          </Reveal>

          {/* CTA PREMIUM — GLASS COM TEXTO BRANCO */}
          <Reveal delay={140}>
            <SoftCard className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/10 px-5 py-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:px-8 md:py-8">
              <div className="pointer-events-none absolute inset-0 opacity-90">
                <div className="absolute -right-20 top-0 h-28 w-28 rounded-full bg-[rgba(255,20,117,0.22)] blur-3xl" />
                <div className="absolute -bottom-16 left-0 h-32 w-32 rounded-full bg-[rgba(155,77,150,0.3)] blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--color-brand)]">
                    <AppIcon name="sparkles" size={14} decorative />
                    <span>Premium</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white md:text-xl">
                    Desbloqueie conteúdos completos
                  </h3>
                  <p className="text-sm text-white/80">
                    PDFs avançados, eBooks exclusivos, trilhas educativas e
                    guias profissionais em um só lugar — tudo pensado para a
                    sua rotina real.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full flex-shrink-0 whitespace-nowrap sm:w-auto"
                >
                  <AppIcon
                    name="crown"
                    size={16}
                    decorative
                    className="mr-1"
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
