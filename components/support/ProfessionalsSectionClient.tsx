'use client'

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Image from 'next/image'

import {
  DEFAULT_PROFESSIONAL_FILTERS,
  type Professional,
  type ProfessionalsFilters,
} from '@/app/types/professionals'
import {
  buildFilterComparisonKey,
  matchesFilters,
  sanitizeFilters,
  sortProfessionals,
} from '@/app/lib/professionals/match'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Reveal } from '@/components/ui/Reveal'

import { ProfessionalModal } from './ProfessionalModal'

type ProfessionalsSectionClientProps = {
  professionals: Professional[]
  initialOpenId?: string
  renderPlainImages?: boolean
  initialFilters?: ProfessionalsFilters
  enableUrlSync?: boolean
}

const PROFESSION_LABEL: Record<Professional['profession'], string> = {
  psicologia: 'Psicologia',
  fonoaudiologia: 'Fonoaudiologia',
  psicopedagogia: 'Psicopedagogia',
  pedagogia_parental: 'Pedagogia Parental',
  consultora_amamentacao: 'Consultora de Amamentação',
  nutricao_materno_infantil: 'Nutrição Materno-Infantil',
  fisio_pelvica: 'Fisioterapia Pélvica',
  doula: 'Doula',
}

const AGE_BAND_LABEL: Record<NonNullable<ProfessionalsFilters['ageBand']>, string> = {
  gestante: 'Gestante',
  '0-6m': '0 a 6 meses',
  '7-12m': '7 a 12 meses',
  '1-3a': '1 a 3 anos',
  '4-6a': '4 a 6 anos',
  todas: 'Todas',
}

const SORT_LABEL: Record<NonNullable<ProfessionalsFilters['sort']>, string> = {
  relevancia: 'Relevância',
  nome: 'Nome (A-Z)',
}

const PAGE_SIZE = 8
const URL_DEBOUNCE_MS = 250
const SKELETON_DURATION_MS = 480

const buildFormatBadges = (professional: Professional) => {
  const badges: string[] = []
  if (professional.formats.online) {
    badges.push('Online')
  }
  if (professional.formats.inPerson) {
    badges.push('Presencial')
  }
  return badges
}

const titleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase())

export const parseFiltersFromSearch = (search: string): ProfessionalsFilters => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)

  const parsed: ProfessionalsFilters = {
    ...DEFAULT_PROFESSIONAL_FILTERS,
    profession: (params.get('profession') as ProfessionalsFilters['profession']) ?? 'todas',
    specialties: params.get('specialties')?.split(',').filter(Boolean) ?? [],
    formats: (params.get('formats')?.split(',').filter(Boolean) as ('online' | 'presencial')[]) ?? [],
    region: params.get('region') ?? '',
    ageBand: (params.get('ageBand') as ProfessionalsFilters['ageBand']) ?? 'todas',
    language: params.get('language') ?? DEFAULT_PROFESSIONAL_FILTERS.language,
    availableIn48h: params.get('availableIn48h') === 'true',
    q: params.get('q') ?? '',
    sort: (params.get('sort') as ProfessionalsFilters['sort']) ?? 'relevancia',
    page: Number.parseInt(params.get('page') ?? '1', 10) || 1,
  }

  return sanitizeFilters(parsed)
}

export const filtersToSearchString = (filters: ProfessionalsFilters) => {
  const sanitized = sanitizeFilters(filters)
  const params = new URLSearchParams()

  if (sanitized.profession && sanitized.profession !== 'todas') {
    params.set('profession', sanitized.profession)
  }

  if (sanitized.specialties && sanitized.specialties.length > 0) {
    params.set('specialties', sanitized.specialties.join(','))
  }

  if (sanitized.formats && sanitized.formats.length > 0) {
    params.set('formats', sanitized.formats.join(','))
  }

  if (sanitized.region) {
    params.set('region', sanitized.region)
  }

  if (sanitized.ageBand && sanitized.ageBand !== 'todas') {
    params.set('ageBand', sanitized.ageBand)
  }

  if (sanitized.language && sanitized.language !== DEFAULT_PROFESSIONAL_FILTERS.language) {
    params.set('language', sanitized.language)
  }

  if (sanitized.availableIn48h) {
    params.set('availableIn48h', 'true')
  }

  if (sanitized.q) {
    params.set('q', sanitized.q)
  }

  if (sanitized.sort && sanitized.sort !== DEFAULT_PROFESSIONAL_FILTERS.sort) {
    params.set('sort', sanitized.sort)
  }

  if (sanitized.page && sanitized.page > 1) {
    params.set('page', String(sanitized.page))
  }

  const search = params.toString()
  return search
}

const areFiltersEqual = (a: ProfessionalsFilters, b: ProfessionalsFilters) =>
  buildFilterComparisonKey({ ...sanitizeFilters(a), page: 1 }) === buildFilterComparisonKey({ ...sanitizeFilters(b), page: 1 }) &&
  sanitizeFilters(a).page === sanitizeFilters(b).page

export function ProfessionalsSectionClient({
  professionals,
  initialOpenId,
  renderPlainImages = false,
  initialFilters,
  enableUrlSync = true,
}: ProfessionalsSectionClientProps) {
  const [filters, setFilters] = useState<ProfessionalsFilters>(() => sanitizeFilters(initialFilters ?? DEFAULT_PROFESSIONAL_FILTERS))
  const [searchDraft, setSearchDraft] = useState(filters.q ?? '')
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(initialOpenId ?? null)
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(false)

  const baseFilterKeyRef = useRef(buildFilterComparisonKey({ ...filters, page: 1 }))
  const hasMountedRef = useRef(false)

  const updateFilters = useCallback((updater: (previous: ProfessionalsFilters) => ProfessionalsFilters) => {
    setFilters((previous) => sanitizeFilters(updater(previous)))
  }, [])

  // URL → state on mount & popstate
  useEffect(() => {
    if (!enableUrlSync || typeof window === 'undefined') {
      return
    }

    const applyFromUrl = () => {
      const fromUrl = parseFiltersFromSearch(window.location.search)
      setFilters((previous) => {
        if (areFiltersEqual(previous, fromUrl)) {
          return previous
        }
        return sanitizeFilters(fromUrl)
      })
      setSearchDraft((previousDraft) => {
        const next = fromUrl.q ?? ''
        return previousDraft === next ? previousDraft : next
      })
    }

    applyFromUrl()
    window.addEventListener('popstate', applyFromUrl)
    return () => window.removeEventListener('popstate', applyFromUrl)
  }, [enableUrlSync])

  // State → URL sync
  useEffect(() => {
    if (!enableUrlSync || typeof window === 'undefined') {
      return
    }

    const search = filtersToSearchString(filters)
    const url = new URL(window.location.href)
    const nextUrl = `${url.pathname}${search ? `?${search}` : ''}`
    const currentUrl = `${url.pathname}${url.search}`

    if (nextUrl !== currentUrl) {
      const timeoutId = setTimeout(() => {
        window.history.replaceState(null, '', nextUrl)
      }, URL_DEBOUNCE_MS)
      return () => clearTimeout(timeoutId)
    }

    return undefined
  }, [filters, enableUrlSync])

  // Sync search input when filters change externally
  useEffect(() => {
    const next = filters.q ?? ''
    if (next !== searchDraft) {
      setSearchDraft(next)
    }
  }, [filters.q, searchDraft])

  // Debounced search updates filters
  useEffect(() => {
    const handler = setTimeout(() => {
      updateFilters((previous) => {
        if (previous.q === searchDraft) {
          return previous
        }
        return { ...previous, q: searchDraft, page: 1 }
      })
    }, URL_DEBOUNCE_MS)

    return () => clearTimeout(handler)
  }, [searchDraft, updateFilters])

  // Skeleton handling for non-page changes
  const baseFilterKey = useMemo(
    () => buildFilterComparisonKey({ ...filters, page: 1 }),
    [filters]
  )

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      baseFilterKeyRef.current = baseFilterKey
      return
    }
    if (baseFilterKeyRef.current === baseFilterKey) {
      return
    }
    baseFilterKeyRef.current = baseFilterKey
    setIsSkeletonVisible(true)
    const timeoutId = setTimeout(() => setIsSkeletonVisible(false), SKELETON_DURATION_MS)
    return () => clearTimeout(timeoutId)
  }, [baseFilterKey])

  const sanitizedFilters = useMemo(() => sanitizeFilters(filters), [filters])

  const filteredProfessionals = useMemo(() => {
    const matched = professionals.filter((professional) => matchesFilters(professional, sanitizedFilters))
    return sortProfessionals(matched, sanitizedFilters.sort)
  }, [professionals, sanitizedFilters])

  const totalResults = filteredProfessionals.length
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE))
  const currentPage = Math.min(sanitizedFilters.page ?? 1, totalPages)

  useEffect(() => {
    if (totalResults === 0 && sanitizedFilters.page !== 1) {
      updateFilters((previous) => ({ ...previous, page: 1 }))
    } else if (sanitizedFilters.page && sanitizedFilters.page > totalPages) {
      updateFilters((previous) => ({ ...previous, page: totalPages }))
    }
  }, [sanitizedFilters.page, totalResults, totalPages, updateFilters])

  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageProfessionals = filteredProfessionals.slice(pageStart, pageStart + PAGE_SIZE)

  const professionOptions = useMemo(() => {
    const unique = new Set(professionals.map((professional) => professional.profession))
    return ['todas', ...Array.from(unique).sort((a, b) => PROFESSION_LABEL[a].localeCompare(PROFESSION_LABEL[b], 'pt-BR'))]
  }, [professionals])

  const specialtyOptions = useMemo(() => {
    const unique = new Set(professionals.flatMap((professional) => professional.specialties))
    return Array.from(unique).sort((a, b) => titleCase(a).localeCompare(titleCase(b), 'pt-BR'))
  }, [professionals])

  const languageOptions = useMemo(() => {
    const unique = new Set(professionals.flatMap((professional) => professional.languages))
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [professionals])

  const regionOptions = useMemo(() => {
    const unique = new Set(
      professionals
        .flatMap((professional) => professional.formats.inPerson ? professional.formats.regions ?? [] : [])
        .filter(Boolean)
    )
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [professionals])

  const selectedProfessional = useMemo(
    () => professionals.find((item) => item.id === selectedProfessionalId) ?? null,
    [professionals, selectedProfessionalId]
  )

  useEffect(() => {
    if (selectedProfessionalId && !professionals.some((professional) => professional.id === selectedProfessionalId)) {
      setSelectedProfessionalId(null)
    }
  }, [professionals, selectedProfessionalId])

  const formattedResultsLabel = totalResults === 1 ? '1 profissional encontrado' : `${totalResults} profissionais encontrados`

  const showEmptyState = !isSkeletonVisible && totalResults === 0

  const handleResetFilters = () => {
    setFilters(sanitizeFilters(DEFAULT_PROFESSIONAL_FILTERS))
    setSearchDraft('')
  }

  const toggleMultiValue = useCallback(
    (key: 'specialties' | 'formats', value: string) => {
      updateFilters((previous) => {
        const set = new Set(previous[key] ?? [])
        if (set.has(value)) {
          set.delete(value)
        } else {
          set.add(value)
        }
        return {
          ...previous,
          [key]: Array.from(set),
          page: 1,
        }
      })
    },
    [updateFilters]
  )

  const renderCard = (professional: Professional, index: number) => {
    const formatBadges = buildFormatBadges(professional)

    return (
      <Reveal key={professional.id} delay={index * 60}>
        <Card className="section-card flex h-full flex-col gap-5 p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/70 bg-secondary/60 shadow-soft">
              {renderPlainImages ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={professional.avatarUrl} alt={`Foto de ${professional.name}`} className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={professional.avatarUrl}
                  alt={`Foto de ${professional.name}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold text-support-1">{professional.name}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                  {PROFESSION_LABEL[professional.profession]}
                </p>
                {professional.approvedByMaterna360 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                    Aprovado pelo Materna360
                  </span>
                ) : null}
              </div>
              {professional.council ? (
                <p className="text-xs text-support-2/80">
                  {professional.council.type} {professional.council.number}
                </p>
              ) : null}
            </div>
          </div>

          <p className="text-sm text-support-2">{professional.bioShort}</p>

          <div className="flex flex-wrap gap-2">
            {formatBadges.map((badge) => (
              <span
                key={`${professional.id}-format-${badge}`}
                className="inline-flex items-center rounded-full bg-support-1/10 px-3 py-0.5 text-xs font-semibold text-support-1"
              >
                {badge}
              </span>
            ))}
            {professional.firstAssessmentFree ? (
              <span className="inline-flex items-center rounded-full bg-secondary/70 px-3 py-0.5 text-xs font-semibold text-support-1 shadow-soft">
                Primeira avaliação gratuita
              </span>
            ) : null}
            {professional.availableIn48h ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                Disponível em até 48h
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {professional.specialties.slice(0, 3).map((specialty) => (
              <span
                key={`${professional.id}-spec-${specialty}`}
                className="rounded-full bg-white/85 px-3 py-0.5 text-xs font-semibold text-support-1 shadow-soft"
              >
                #{titleCase(specialty)}
              </span>
            ))}
          </div>

          {professional.formats.regions && professional.formats.regions.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-support-2">
              {professional.formats.regions.map((region) => (
                <span key={`${professional.id}-region-${region}`} className="rounded-full bg-support-1/10 px-3 py-0.5">
                  {region}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedProfessionalId(professional.id)}
              aria-label={`Ver perfil de ${professional.name}`}
            >
              Ver perfil
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled
              title="Disponível em breve"
              aria-label={`Vamos conversar com ${professional.name} em breve`}
            >
              Vamos conversar?
            </Button>
          </div>
        </Card>
      </Reveal>
    )
  }

  const skeletonCards = Array.from({ length: PAGE_SIZE }, (_, index) => (
    <Reveal key={`skeleton-${index}`} delay={index * 45}>
      <Card className="section-card flex h-full flex-col gap-5 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-secondary/40 animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 rounded bg-support-1/20 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-support-1/10 animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-support-1/10 animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-full rounded bg-support-1/10 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-support-1/10 animate-pulse" />
          <div className="h-6 w-24 rounded-full bg-support-1/10 animate-pulse" />
          <div className="h-6 w-28 rounded-full bg-support-1/10 animate-pulse" />
        </div>
        <div className="mt-auto flex gap-3">
          <div className="h-9 w-28 rounded-full bg-primary/10 animate-pulse" />
          <div className="h-9 w-32 rounded-full bg-support-1/15 animate-pulse" />
        </div>
      </Card>
    </Reveal>
  ))

  return (
    <div className="space-y-6">
      <div className="section-card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-semibold text-support-1">
            Profissão
            <select
              value={sanitizedFilters.profession ?? 'todas'}
              onChange={(event) =>
                updateFilters((previous) => ({ ...previous, profession: event.target.value as ProfessionalsFilters['profession'], page: 1 }))
              }
              className="rounded-full border border-support-1/20 bg-white px-4 py-2 text-sm text-support-2 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
            >
              {professionOptions.map((value) => (
                <option key={value} value={value}>
                  {value === 'todas' ? 'Todas' : PROFESSION_LABEL[value as Professional['profession']]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-support-1">
            Faixa etária
            <select
              value={sanitizedFilters.ageBand ?? 'todas'}
              onChange={(event) =>
                updateFilters((previous) => ({ ...previous, ageBand: event.target.value as ProfessionalsFilters['ageBand'], page: 1 }))
              }
              className="rounded-full border border-support-1/20 bg-white px-4 py-2 text-sm text-support-2 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
            >
              {Object.entries(AGE_BAND_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-support-1">
            Idioma
            <select
              value={sanitizedFilters.language ?? 'pt-BR'}
              onChange={(event) =>
                updateFilters((previous) => ({ ...previous, language: event.target.value, page: 1 }))
              }
              className="rounded-full border border-support-1/20 bg-white px-4 py-2 text-sm text-support-2 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="todas">Todos os idiomas</option>
              {languageOptions
                .filter((language) => language !== 'pt-BR')
                .map((language) => (
                  <option key={language} value={language}>
                    {language === 'en'
                      ? 'Inglês'
                      : language === 'es'
                      ? 'Espanhol'
                      : language.toUpperCase()}
                  </option>
                ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-support-1">
            Ordenar por
            <select
              value={sanitizedFilters.sort ?? 'relevancia'}
              onChange={(event) =>
                updateFilters((previous) => ({ ...previous, sort: event.target.value as ProfessionalsFilters['sort'], page: 1 }))
              }
              className="rounded-full border border-support-1/20 bg-white px-4 py-2 text-sm text-support-2 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
            >
              {Object.entries(SORT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-support-1">
            Região presencia
            <input
              type="text"
              value={sanitizedFilters.region ?? ''}
              onChange={(event) => updateFilters((previous) => ({ ...previous, region: event.target.value, page: 1 }))}
              list="region-options"
              disabled={!sanitizedFilters.formats?.includes('presencial')}
              placeholder="Cidade ou estado"
              className="rounded-full border border-support-1/20 bg-white px-4 py-2 text-sm text-support-2 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 disabled:cursor-not-allowed disabled:bg-support-1/10"
            />
            <datalist id="region-options">
              {regionOptions.map((region) => (
                <option key={region} value={region} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-support-1">
            Buscar
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar por nome, tema ou palavra-chave"
              className="rounded-full border border-support-1/20 bg-white px-4 py-2 text-sm text-support-2 shadow-inner focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
            />
          </label>

          <label className="mt-1 flex items-center gap-2 text-sm font-semibold text-support-1">
            <input
              type="checkbox"
              checked={Boolean(sanitizedFilters.availableIn48h)}
              onChange={(event) =>
                updateFilters((previous) => ({ ...previous, availableIn48h: event.target.checked, page: 1 }))
              }
              className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
            />
            Agendamento disponível em até 48h
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">Temas</p>
          <div className="flex flex-wrap gap-2">
            {specialtyOptions.map((specialty) => {
              const isActive = sanitizedFilters.specialties?.includes(specialty)
              return (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleMultiValue('specialties', specialty)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                    isActive
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-white text-support-1 shadow-inner hover:bg-primary/10'
                  }`}
                >
                  #{titleCase(specialty)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-support-2/80">Formato</p>
          <div className="flex flex-wrap gap-2">
            {['online', 'presencial'].map((format) => {
              const isSelected = sanitizedFilters.formats?.includes(format as 'online' | 'presencial')
              return (
                <button
                  key={format}
                  type="button"
                  onClick={() => toggleMultiValue('formats', format)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/60 ${
                    isSelected
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-white text-support-1 shadow-inner hover:bg-primary/10'
                  }`}
                >
                  {format === 'online' ? 'Online' : 'Presencial'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-sm text-support-2">{formattedResultsLabel}</span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {isSkeletonVisible ? (
        <div className="mt-6 grid grid-cols-1 gap-6 md:gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonCards}
        </div>
      ) : showEmptyState ? (
        <Card className="section-card flex flex-col items-start gap-4 text-support-2">
          <h3 className="text-lg font-semibold text-support-1">Não encontramos profissionais com esses filtros.</h3>
          <p className="text-sm">
            Tente remover algum tema ou alterar a região para ampliar as opções.
          </p>
          <Button size="sm" variant="ghost" onClick={handleResetFilters}>
            Limpar filtros
          </Button>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {pageProfessionals.map((professional, index) => renderCard(professional, index))}
        </div>
      )}

      {!showEmptyState && !isSkeletonVisible && totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-4" aria-label="Paginação de profissionais">
          <Button
            size="sm"
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => updateFilters((previous) => ({ ...previous, page: Math.max(1, currentPage - 1) }))}
            aria-label="Página anterior"
          >
            Anterior
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
              const isCurrent = page === currentPage
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => updateFilters((previous) => ({ ...previous, page }))}
                  className={`min-w-[2.5rem] rounded-full px-3 py-1 text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-primary text-white shadow-soft'
                      : 'bg-white text-support-2 shadow-inner hover:bg-primary/10'
                  }`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={currentPage === totalPages}
            onClick={() => updateFilters((previous) => ({ ...previous, page: Math.min(totalPages, currentPage + 1) }))}
            aria-label="Próxima página"
          >
            Próxima
          </Button>
        </nav>
      ) : null}

      <ProfessionalModal
        professional={selectedProfessional}
        open={Boolean(selectedProfessional)}
        onClose={() => setSelectedProfessionalId(null)}
        renderPlainImages={renderPlainImages}
      />
    </div>
  )
}
