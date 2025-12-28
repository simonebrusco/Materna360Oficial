'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
    description: 'Um passo a passo simples para começar o dia com um pouco mais de calma.',
    theme: 'Rotinas',
    format: 'Checklist',
    icon: 'book-open',
    href: '#',
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
type ViewStep = 'sugestao' | 'filtrar' | 'materiais' | 'insight'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, value)
  } catch {}
}

function inferSuggestionFromEu360(): { preset: PresetFilter; theme: string | null } {
  // Best effort (sem acoplamento): se não existir nada, cai no padrão “Rotinas + Guias”
  const euRitmo = safeGetLS('eu360_ritmo') // leve | cansada | animada | sobrecarregada
  const euFocus = safeGetLS('eu360_focus') // opcional (se você quiser usar depois)
  const euChildAge = safeGetLS('eu360_child_age_band') // opcional: "0-2" | "3-4" | "5-6" | "6+"

  // Heurística operacional (não “terapia”): sugere o que resolve mais rápido
  if (euRitmo === 'sobrecarregada') return { preset: 'guias', theme: 'Rotinas' }
  if (euRitmo === 'cansada') return { preset: 'pdfs-ebooks', theme: 'Sono' }
  if (euRitmo === 'animada') return { preset: 'trilhas', theme: null }

  // Se tiver idade, podemos sugerir tema leve (placeholder, ajusta depois)
  if (euChildAge) return { preset: 'tema-fase', theme: null }

  // fallback
  void euFocus
  return { preset: 'guias', theme: 'Rotinas' }
}

export default function BibliotecaMaternaPage() {
  const searchParams = useSearchParams()

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [presetFilter, setPresetFilter] = useState<PresetFilter>(null)
  const [view, setView] = useState<ViewStep>('sugestao')

  const materialsRef = useRef<HTMLDivElement | null>(null)

  // --- URL preset (?filtro=...)
  useEffect(() => {
    const filtro = searchParams.get('filtro')
    if (!filtro) return

    setSelectedTheme(null)
    setSelectedFormat(null)

    if (filtro === 'guias') setPresetFilter('guias')
    else if (filtro === 'ebooks') setPresetFilter('pdfs-ebooks')
    else if (filtro === 'trilhas') setPresetFilter('trilhas')
    else if (filtro === 'tema-fase' || filtro === 'idade-tema') setPresetFilter('tema-fase')

    // quando vem do hub, já cai em “Materiais”
    setView('materiais')
  }, [searchParams])

  // --- “Pensa por ela”: se não veio nada do hub, sugere um caminho pronto
  useEffect(() => {
    const cameFromHub = !!searchParams.get('filtro')
    if (cameFromHub) return

    const inferred = inferSuggestionFromEu360()

    // não força tema se a pessoa não quer; mas dá um ponto de partida “pronto”
    setPresetFilter(inferred.preset)
    setSelectedTheme(inferred.theme)
    setSelectedFormat(null)

    // guarda pra personalização futura (opcional)
    safeSetLS('biblioteca_last_preset', inferred.preset ?? '')
    if (inferred.theme) safeSetLS('biblioteca_last_theme', inferred.theme)
  }, [searchParams])

  // scroll suave quando abre materiais
  useEffect(() => {
    if (view === 'materiais' && materialsRef.current) {
      materialsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [view])

  const handleThemeSelect = (theme: string) => {
    // tema não “quebra” preset — ele refina a seleção
    setSelectedTheme((prev) => (prev === theme ? null : theme))
  }

  const handleFormatSelect = (format: string) => {
    // ao escolher formato manual, sai do preset “atalho”
    setPresetFilter(null)
    setSelectedFormat((prev) => (prev === format ? null : format))
  }

  const handleMaterialOpen = (material: MaterialCard) => {
    if (!material.href || material.href === '#') return
    if (material.external) window.open(material.href, '_blank', 'noopener,noreferrer')
    else window.location.href = material.href
  }

  const filteredMaterials = useMemo(() => {
    return MATERIALS.filter((material) => {
      if (selectedTheme && material.theme !== selectedTheme) return false

      if (presetFilter) {
        if (presetFilter === 'guias') {
          if (!(material.format === 'Guia Prático' || material.format === 'Checklist')) return false
        } else if (presetFilter === 'pdfs-ebooks') {
          if (!(material.format === 'PDF' || material.format === 'eBook')) return false
        } else if (presetFilter === 'trilhas') {
          if (material.format !== 'Trilha educativa') return false
        } else if (presetFilter === 'tema-fase') {
          // hoje: sem backend de fase — mantém “amostra geral”
          // depois: aqui entra a lógica Eu360 (idade/fase) real.
        }
      } else if (selectedFormat && material.format !== selectedFormat) {
        return false
      }

      return true
    })
  }, [selectedTheme, selectedFormat, presetFilter])

  const hasActiveFilter = !!selectedTheme || !!selectedFormat || !!presetFilter

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
    if (presetFilter === 'guias') return format === 'Guia Prático' || format === 'Checklist'
    if (presetFilter === 'pdfs-ebooks') return format === 'PDF' || format === 'eBook'
    if (presetFilter === 'trilhas') return format === 'Trilha educativa'
    return !presetFilter && selectedFormat === format
  }

  const suggestionTitle =
    presetFilter === 'guias'
      ? 'Sugestão pronta para agora: Guias e checklists'
      : presetFilter === 'pdfs-ebooks'
        ? 'Sugestão pronta para agora: PDFs e e-books'
        : presetFilter === 'trilhas'
          ? 'Sugestão pronta para agora: Trilhas educativas'
          : presetFilter === 'tema-fase'
            ? 'Sugestão pronta para agora: por idade e fase'
            : 'Sugestão pronta para agora'

  const suggestionSubtitle =
    presetFilter === 'guias'
      ? 'Para quando você quer clareza e um passo a passo rápido.'
      : presetFilter === 'pdfs-ebooks'
        ? 'Para quando você quer ler algo curto e direto, sem ficar caçando.'
        : presetFilter === 'trilhas'
          ? 'Para quando você quer seguir uma sequência pronta e consistente.'
          : presetFilter === 'tema-fase'
            ? 'Para quando você quer algo que combine com a fase do seu filho.'
            : 'A biblioteca já pode te mostrar o que resolve primeiro.'

  function setChip(next: ViewStep) {
    setView(next)
  }

  return (
    <main
      data-layout="page-template-v1"
      data-tab="maternar"
      className="
        min-h-[100dvh]
        pb-32
        bg-[#ffe1f1]
        bg-[linear-gradient(to_bottom,#fd2597_0%,#fd2597_22%,#fdbed7_48%,#ffe1f1_78%,#fff7fa_100%)]
      "
    >
      <ClientOnly>
        <div className="mx-auto max-w-5xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6">
          {/* HERO (mesmo padrão das outras) */}
          <header className="pt-8 md:pt-10 mb-6 md:mb-8">
            <div className="space-y-3">
              <Link
                href="/maternar"
                className="inline-flex items-center text-[12px] text-white/85 hover:text-white transition mb-1"
              >
                <span className="mr-1.5 text-lg leading-none">←</span>
                Voltar para o Maternar
              </Link>

              <h1 className="text-2xl md:text-3xl font-semibold text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                Biblioteca Materna
              </h1>

              <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-2xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)]">
                Você entra sem saber o que procurar e sai com um material certo para o seu momento — sem ficar caçando.
              </p>
            </div>
          </header>

          <div className="space-y-7 md:space-y-8 pb-10">
            {/* PAINEL TRANSLÚCIDO (mesmo container) */}
            <div
              className="
                rounded-3xl
                bg-white/10
                border border-white/35
                backdrop-blur-xl
                shadow-[0_18px_45px_rgba(184,35,107,0.25)]
                p-4 md:p-6
                space-y-6
              "
            >
              {/* Top “Sugestão pronta” (modo jornada) */}
              <Reveal>
                <div
                  className="
                    rounded-3xl
                    bg-white/10
                    border border-white/25
                    shadow-[0_14px_40px_rgba(0,0,0,0.12)]
                    p-4 md:p-5
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                        <AppIcon name="book-open" size={22} className="text-white" />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[12px] text-white/85">
                          {presetLabel ? presetLabel : 'Sugestão do Materna • pronta para usar'}
                          {selectedTheme ? ` • tema: ${selectedTheme}` : ''}
                        </div>

                        <div className="text-[18px] md:text-[20px] font-semibold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                          {suggestionTitle}
                        </div>

                        <div className="text-[13px] text-white/85 leading-relaxed max-w-2xl">
                          {suggestionSubtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChip('filtrar')}
                        className="
                          rounded-full
                          bg-white/90 hover:bg-white
                          text-[#2f3a56]
                          px-4 py-2
                          text-[12px]
                          shadow-[0_6px_18px_rgba(0,0,0,0.12)]
                          transition
                        "
                      >
                        Ajustar
                      </button>

                      <button
                        onClick={() => setChip('materiais')}
                        className="
                          rounded-full
                          bg-[#fd2597]
                          text-white
                          px-4 py-2
                          text-[12px]
                          shadow-[0_10px_26px_rgba(253,37,151,0.35)]
                          hover:opacity-95
                          transition
                        "
                      >
                        Ver materiais
                      </button>
                    </div>
                  </div>

                  {/* Chips internos (igual à lógica das outras páginas) */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'sugestao' as const, label: 'Sugestão' },
                        { id: 'filtrar' as const, label: 'Filtrar' },
                        { id: 'materiais' as const, label: 'Materiais' },
                        { id: 'insight' as const, label: 'Insight' },
                      ] as const
                    ).map((it) => {
                      const active = view === it.id
                      return (
                        <button
                          key={it.id}
                          onClick={() => setChip(it.id)}
                          className={[
                            'rounded-full px-3.5 py-2 text-[12px] border transition',
                            active
                              ? 'bg-white/95 border-white/40 text-[#2f3a56]'
                              : 'bg-white/20 border-white/30 text-white/90 hover:bg-white/25',
                          ].join(' ')}
                        >
                          {it.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Reveal>

              {/* Card branco interno (mesmo padrão) */}
              <Reveal>
                <SoftCard
                  className="
                    p-5 md:p-6 rounded-3xl
                    bg-white/95
                    border border-[#f5d7e5]
                    shadow-[0_10px_28px_rgba(184,35,107,0.12)]
                  "
                >
                  {/* VIEW: Sugestão (atalhos rápidos) */}
                  {view === 'sugestao' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">
                        Se você não quer pensar: escolha um atalho.
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <button
                          onClick={() => {
                            setPresetFilter('guias')
                            setSelectedFormat(null)
                            setChip('materiais')
                          }}
                          className="rounded-3xl border border-[#f5d7e5] bg-white hover:bg-[#ffe1f1] transition p-4 text-left"
                        >
                          <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">atalho</div>
                          <div className="text-[13px] font-semibold text-[#2f3a56] mt-1">Guias & checklists</div>
                          <div className="text-[12px] text-[#6a6a6a] mt-2">
                            Passo a passo curto pra resolver mais rápido.
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setPresetFilter('pdfs-ebooks')
                            setSelectedFormat(null)
                            setChip('materiais')
                          }}
                          className="rounded-3xl border border-[#f5d7e5] bg-white hover:bg-[#ffe1f1] transition p-4 text-left"
                        >
                          <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">atalho</div>
                          <div className="text-[13px] font-semibold text-[#2f3a56] mt-1">PDFs & e-books</div>
                          <div className="text-[12px] text-[#6a6a6a] mt-2">
                            Leitura direta, sem excesso de tela.
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setPresetFilter('trilhas')
                            setSelectedFormat(null)
                            setChip('materiais')
                          }}
                          className="rounded-3xl border border-[#f5d7e5] bg-white hover:bg-[#ffe1f1] transition p-4 text-left"
                        >
                          <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">atalho</div>
                          <div className="text-[13px] font-semibold text-[#2f3a56] mt-1">Trilhas educativas</div>
                          <div className="text-[12px] text-[#6a6a6a] mt-2">
                            Uma sequência pronta pra seguir.
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setPresetFilter('tema-fase')
                            setSelectedFormat(null)
                            setChip('insight')
                          }}
                          className="rounded-3xl border border-[#f5d7e5] bg-white hover:bg-[#ffe1f1] transition p-4 text-left"
                        >
                          <div className="text-[11px] text-[#b8236b] font-semibold uppercase tracking-wide">em breve</div>
                          <div className="text-[13px] font-semibold text-[#2f3a56] mt-1">Por idade & fase</div>
                          <div className="text-[12px] text-[#6a6a6a] mt-2">
                            Vai conectar com o Eu360 e sugerir sozinho.
                          </div>
                        </button>
                      </div>

                      {!hasActiveFilter ? (
                        <div className="text-[12px] text-[#6a6a6a]">
                          Nenhum filtro ativo — você está vendo uma amostra geral da biblioteca.
                        </div>
                      ) : (
                        <div className="text-[12px] text-[#6a6a6a]">
                          {presetLabel ? presetLabel : 'Filtro ativo'} • {filteredMaterials.length} resultado(s) agora.
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* VIEW: Filtrar */}
                  {view === 'filtrar' ? (
                    <div className="space-y-5">
                      <div className="flex flex-col gap-1">
                        <div className="text-[14px] text-[#2f3a56] font-semibold">Ajuste rápido</div>
                        <div className="text-[12px] text-[#6a6a6a]">
                          Se quiser refinar, escolha tema e/ou formato. Se não quiser, só vá em “Materiais”.
                        </div>

                        {presetLabel ? (
                          <div className="inline-flex w-max items-center gap-2 rounded-full bg-[#ffe1f1] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#b8236b] mt-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#fd2597]" />
                            {presetLabel}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <SoftCard className="rounded-3xl bg-white p-4 md:p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
                          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#545454] md:text-xs">
                            Tema
                          </label>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {THEMES.map((theme) => {
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

                        <SoftCard className="rounded-3xl bg-white p-4 md:p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
                          <label className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#545454] md:text-xs">
                            Formato
                          </label>

                          <div className="flex flex-wrap gap-2">
                            {FORMATS.map((format) => (
                              <FilterPill key={format} active={formatIsActive(format)} onClick={() => handleFormatSelect(format)}>
                                {format}
                              </FilterPill>
                            ))}
                          </div>

                          <div className="mt-4 text-[12px] text-[#6a6a6a]">
                            {filteredMaterials.length === 0
                              ? 'Nenhum material encontrado para esse ajuste.'
                              : `${filteredMaterials.length} material(is) para esse ajuste.`}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => setChip('materiais')}
                              className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                            >
                              Ver materiais
                            </button>

                            <button
                              onClick={() => {
                                setSelectedTheme(null)
                                setSelectedFormat(null)
                                setPresetFilter(null)
                              }}
                              className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                            >
                              Limpar filtros
                            </button>
                          </div>
                        </SoftCard>
                      </div>
                    </div>
                  ) : null}

                  {/* VIEW: Materiais */}
                  {view === 'materiais' ? (
                    <div ref={materialsRef} className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-[14px] text-[#2f3a56] font-semibold">Materiais disponíveis</div>
                        <div className="text-[12px] text-[#6a6a6a]">
                          Clique em um card para abrir. (Downloads: em breve.)
                        </div>
                        <div className="text-[12px] text-[#6a6a6a]">
                          {filteredMaterials.length} resultado(s) agora.
                        </div>
                      </div>

                      {filteredMaterials.length === 0 ? (
                        <SoftCard className="rounded-3xl bg-white p-6 text-sm text-[#6A6A6A] shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5]">
                          Nenhum material encontrado para esse filtro. Ajuste em “Filtrar” ou limpe os filtros.
                        </SoftCard>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
                          {filteredMaterials.map((material) => (
                            <SoftCard
                              key={material.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleMaterialOpen(material)}
                              className="flex h-full cursor-pointer flex-col rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(0,0,0,0.06)] border border-[#F5D7E5] transition-all duration-200 hover:shadow-[0_10px_26px_rgba(0,0,0,0.12)] hover:border-[#fd2597]/70"
                            >
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8236b]">
                                {material.format.toUpperCase()} · {material.theme.toUpperCase()}
                              </p>

                              <h3 className="mb-1 text-sm font-semibold text-[#545454] md:text-base">{material.title}</h3>

                              <p className="mb-3 text-xs text-[#6A6A6A] md:text-sm">{material.description}</p>

                              <div className="mt-auto pt-1 text-[11px] font-semibold text-[#fd2597]">
                                {material.href && material.href !== '#' ? 'Clique para acessar o material' : 'Em breve disponível para download'}
                              </div>
                            </SoftCard>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => setChip('filtrar')}
                          className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                        >
                          Ajustar filtros
                        </button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full px-5 bg-[#fd2597] text-white hover:opacity-95 shadow-[0_10px_26px_rgba(253,37,151,0.35)]"
                        >
                          <AppIcon name="crown" className="mr-2 h-4 w-4 text-white" />
                          Conhecer Materna+
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* VIEW: Insight */}
                  {view === 'insight' ? (
                    <div className="space-y-4">
                      <div className="text-[14px] text-[#2f3a56] font-semibold">Insight personalizado</div>
                      <div className="text-[12px] text-[#6a6a6a] max-w-2xl">
                        Em breve, a Biblioteca vai conversar com o Eu360 para sugerir materiais sob medida para a fase do seu filho
                        e explicar por que aquele material é o “certo para agora”.
                      </div>

                      <div className="rounded-3xl bg-[#fff7fb] border border-[#f5d7e5] p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffe1f1]">
                            <AppIcon name="idea" className="h-5 w-5 text-[#fd2597]" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-[13px] font-semibold text-[#2f3a56]">Como vai funcionar</div>
                            <div className="text-[12px] text-[#6a6a6a] leading-relaxed">
                              1) Eu360 entende seu dia e a fase do seu filho.
                              <br />
                              2) A Biblioteca sugere um material e diz o motivo.
                              <br />
                              3) Você aplica sem ficar procurando.
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => setChip('materiais')}
                            className="rounded-full bg-[#fd2597] text-white px-4 py-2 text-[12px] shadow-lg hover:opacity-95 transition"
                          >
                            Ver materiais agora
                          </button>
                          <button
                            onClick={() => setChip('filtrar')}
                            className="rounded-full bg-white border border-[#f5d7e5] text-[#2f3a56] px-4 py-2 text-[12px] hover:bg-[#ffe1f1] transition"
                          >
                            Ajustar manualmente
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </SoftCard>
              </Reveal>
            </div>

            <MotivationalFooter routeKey="biblioteca-materna" />
          </div>
        </div>
      </ClientOnly>
    </main>
  )
}
