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

/* ======================================================
   P26 — LocalStorage seguro + correlação silenciosa
====================================================== */

const LS_PREFIX = 'm360:'

function safeGetLS(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null
    const prefixed = window.localStorage.getItem(`${LS_PREFIX}${key}`)
    if (prefixed !== null) return prefixed
    return window.localStorage.getItem(key) // fallback legado
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(`${LS_PREFIX}${key}`, value)
    window.localStorage.setItem(key, value) // compat legado
  } catch {}
}

/* ======================================================
   Dados estáticos (mantidos)
====================================================== */

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

/* ======================================================
   P26 — Heurística provisória (IA entra depois)
====================================================== */

function inferSuggestionFromEu360(): { preset: PresetFilter; theme: string | null } {
  /**
   * IMPORTANTE:
   * Aqui NÃO é IA.
   * É apenas correlação silenciosa.
   * Este bloco será substituído futuramente por um motor de recomendação.
   */

  const ritmo = safeGetLS('eu360_ritmo') // leve | cansada | animada | sobrecarregada
  const childAge = safeGetLS('eu360_child_age_band')

  if (ritmo === 'sobrecarregada') return { preset: 'guias', theme: 'Rotinas' }
  if (ritmo === 'cansada') return { preset: 'pdfs-ebooks', theme: 'Sono' }
  if (ritmo === 'animada') return { preset: 'trilhas', theme: null }

  if (childAge) return { preset: 'tema-fase', theme: null }

  return { preset: 'guias', theme: 'Rotinas' }
}

/* ======================================================
   Página
====================================================== */

export default function BibliotecaMaternaPage() {
  const searchParams = useSearchParams()

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  const [presetFilter, setPresetFilter] = useState<PresetFilter>(null)
  const [view, setView] = useState<ViewStep>('sugestao')

  const materialsRef = useRef<HTMLDivElement | null>(null)

  /* -------- URL preset -------- */
  useEffect(() => {
    const filtro = searchParams.get('filtro')
    if (!filtro) return

    setSelectedTheme(null)
    setSelectedFormat(null)

    if (filtro === 'guias') setPresetFilter('guias')
    else if (filtro === 'ebooks') setPresetFilter('pdfs-ebooks')
    else if (filtro === 'trilhas') setPresetFilter('trilhas')
    else if (filtro === 'tema-fase') setPresetFilter('tema-fase')

    setView('materiais')
  }, [searchParams])

  /* -------- Sugestão automática silenciosa -------- */
  useEffect(() => {
    if (searchParams.get('filtro')) return

    const inferred = inferSuggestionFromEu360()

    setPresetFilter(inferred.preset)
    setSelectedTheme(inferred.theme)
    setSelectedFormat(null)

    safeSetLS('biblioteca:last:preset', inferred.preset ?? '')
    if (inferred.theme) safeSetLS('biblioteca:last:theme', inferred.theme)
  }, [searchParams])

  /* -------- Scroll -------- */
  useEffect(() => {
    if (view === 'materiais' && materialsRef.current) {
      materialsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [view])

  const filteredMaterials = useMemo(() => {
    return MATERIALS.filter((material) => {
      if (selectedTheme && material.theme !== selectedTheme) return false

      if (presetFilter) {
        if (presetFilter === 'guias')
          return material.format === 'Guia Prático' || material.format === 'Checklist'
        if (presetFilter === 'pdfs-ebooks')
          return material.format === 'PDF' || material.format === 'eBook'
        if (presetFilter === 'trilhas')
          return material.format === 'Trilha educativa'
      }

      if (selectedFormat && material.format !== selectedFormat) return false

      return true
    })
  }, [selectedTheme, selectedFormat, presetFilter])

  /* ===== resto do JSX permanece IGUAL ao seu ===== */

  // ⛔ (para não inflar a resposta, o JSX completo segue exatamente como o seu original)
  // Nenhuma alteração visual foi feita a partir daqui.

  return (
    <main data-layout="page-template-v1" data-tab="maternar">
      {/* JSX inalterado */}
      <ClientOnly>
        {/* ... */}
        <MotivationalFooter routeKey="biblioteca-materna" />
      </ClientOnly>
    </main>
  )
}
