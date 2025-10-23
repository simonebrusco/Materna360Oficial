import type { Professional, ProfessionalsFilters } from '@/app/types/professionals'

import type { Professional, ProfessionalsFilters } from '@/app/types/professionals'

const normalizeText = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const includesNormalized = (haystack: string, needle: string) => {
  if (!needle) return true
  return normalizeText(haystack).includes(normalizeText(needle))
}

const normalizeArray = (value: string[] | undefined) => value?.map((item) => item.trim()).filter(Boolean) ?? []

export function matchesFilters(professional: Professional, filters: ProfessionalsFilters): boolean {
  const {
    profession,
    specialties,
    formats,
    region,
    ageBand,
    language,
    availableIn48h,
    q,
  } = filters

  if (profession && profession !== 'todas' && professional.profession !== profession) {
    return false
  }

  if (specialties?.length) {
    const required = normalizeArray(specialties)
    const hasAll = required.every((specialty) => professional.specialties.includes(specialty))
    if (!hasAll) {
      return false
    }
  }

  if (formats?.length) {
    const wantsOnline = formats.includes('online')
    const wantsInPerson = formats.includes('presencial')
    const matchesOnline = wantsOnline ? professional.formats.online : false
    const matchesInPerson = wantsInPerson ? professional.formats.inPerson : false
    if (!(matchesOnline || matchesInPerson)) {
      return false
    }
  }

  if (region && region.trim()) {
    const wantsInPerson = formats?.includes('presencial') ?? true
    if (!professional.formats.inPerson || !wantsInPerson) {
      return false
    }
    const regions = professional.formats.regions ?? []
    const normalizedRegion = normalizeText(region)
    const hasRegion = regions.some((entry) => includesNormalized(entry, normalizedRegion))
    if (!hasRegion) {
      return false
    }
  }

  if (ageBand && ageBand !== 'todas' && !professional.ageBands.includes(ageBand)) {
    return false
  }

  if (language && language !== 'todas' && !professional.languages.includes(language)) {
    return false
  }

  if (availableIn48h && !professional.availableIn48h) {
    return false
  }

  if (q && q.trim()) {
    const query = normalizeText(q)
    const composite = normalizeText(
      [
        professional.name,
        professional.bioShort,
        professional.profession,
        ...(professional.howHelps ?? []),
        ...(professional.specialties ?? []),
      ].join(' ')
    )
    if (!composite.includes(query)) {
      return false
    }
  }

  return true
}

export function sortProfessionals(items: Professional[], sortBy: ProfessionalsFilters['sort']) {
  if (sortBy === 'nome') {
    return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
  return [...items]
}

export const buildFilterComparisonKey = (filters: ProfessionalsFilters) => {
  const {
    profession = 'todas',
    specialties = [],
    formats = [],
    region = '',
    ageBand = 'todas',
    language = 'todas',
    availableIn48h = false,
    q = '',
    sort = 'relevancia',
  } = filters

  const normalized = {
    profession,
    specialties: [...specialties].sort(),
    formats: [...formats].sort(),
    region,
    ageBand,
    language,
    availableIn48h,
    q,
    sort,
  }

  return JSON.stringify(normalized)
}

export const sanitizeFilters = (filters: ProfessionalsFilters): ProfessionalsFilters => {
  const sanitizedSpecialties = Array.from(new Set(normalizeArray(filters.specialties)))
  const rawFormats = Array.isArray(filters.formats) ? filters.formats : []
  const sanitizedFormats = Array.from(
    new Set(
      rawFormats.filter((format): format is 'online' | 'presencial' => format === 'online' || format === 'presencial')
    )
  )

  return {
    profession: filters.profession ?? 'todas',
    specialties: sanitizedSpecialties,
    formats: sanitizedFormats,
    region: filters.region?.trim() ?? '',
    ageBand: filters.ageBand ?? 'todas',
    language: filters.language ?? 'pt-BR',
    availableIn48h: Boolean(filters.availableIn48h),
    q: filters.q ?? '',
    sort: filters.sort ?? 'relevancia',
    page: filters.page && filters.page > 0 ? filters.page : 1,
  }
}
