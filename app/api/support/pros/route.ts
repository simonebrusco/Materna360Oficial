import { NextResponse } from 'next/server'

import { NextResponse } from 'next/server'

import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import type { Professional } from '@/app/types/professionals'
import { buildWaLink, normalizeE164 } from '@/lib/pros/whatsapp'

const PAGE_SIZE = 6

const PROFESSION_LABEL: Record<string, string> = {
  psicologia: 'Psicologia',
  fonoaudiologia: 'Fonoaudiologia',
  psicopedagogia: 'Psico-pedagogia',
  pedagogia_parental: 'Pedagogia parental',
  doula: 'Doula',
  consultora_amamentacao: 'Consultoria em amamentação',
  nutricao_materno_infantil: 'Nutrição materno-infantil',
  fisio_pelvica: 'Fisioterapia pélvica',
}

const PROFESSION_LOOKUP: Record<string, Professional['profession'] | 'todas'> = {
  Todas: 'todas',
  Psicologia: 'psicologia',
  Fonoaudiologia: 'fonoaudiologia',
  'Psico-pedagogia': 'psicopedagogia',
  'Pedagogia parental': 'pedagogia_parental',
  Doula: 'doula',
}

const LANGUAGE_LOOKUP: Record<string, string> = {
  'Português (Brasil)': 'pt-BR',
  Inglês: 'en',
  Espanhol: 'es',
}

const AGE_LOOKUP: Record<string, string[]> = {
  Todas: [],
  '0–6 meses': ['gestante', '0-6m'],
  '6–24 meses': ['7-12m', '1-3a'],
  '2–5 anos': ['1-3a', '4-6a'],
  '6–12 anos': ['4-6a'],
}

const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || '55'

const sanitize = (value: string | null) => value?.trim() ?? ''

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')

const formatChip = (value: string) =>
  value
    .split(/[_-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')

const ensureArray = <T,>(input: T[] | undefined | null): T[] => (Array.isArray(input) ? input : [])

const mapProfessional = (professional: Professional) => {
  const professionLabel = PROFESSION_LABEL[professional.profession] ?? 'Especialista Materna360'
  const whatsapp = professional.whatsapp ?? ''
  const phone = normalizeE164(whatsapp, DEFAULT_COUNTRY)
  const whatsUrl = phone
    ? buildWaLink({
        phone,
        name: professional.name,
        profession: professionLabel,
      })
    : ''

  return {
    id: professional.id,
    nome: professional.name,
    especialidade: professionLabel,
    bioCurta: professional.bioShort,
    avatarUrl: professional.avatarUrl ?? undefined,
    cidade: professional.formats?.regions?.[0],
    whatsUrl: whatsUrl || undefined,
    verificado: Boolean(professional.approvedByMaterna360),
    primeiraAvaliacaoGratuita: Boolean(professional.firstAssessmentFree),
    temas: ensureArray(professional.specialties).map(formatChip),
  }
}

const filterProfessionals = (
  professionals: Professional[],
  filters: {
    profession?: Professional['profession'] | 'todas'
    ageBand?: string[]
    language?: string
    terms?: string
  }
) => {
  const { profession, ageBand, language, terms } = filters
  const normalizedTerm = terms ? normalizeText(terms) : ''

  return professionals.filter((professional) => {
    if (!professional.formats?.online) {
      return false
    }

    if (profession && profession !== 'todas' && professional.profession !== profession) {
      return false
    }

    if (ageBand && ageBand.length > 0) {
      const matchesAge = ensureArray(professional.ageBands).some((band) => ageBand.includes(band))
      if (!matchesAge) {
        return false
      }
    }

    if (language) {
      const matchesLanguage = ensureArray(professional.languages).some((lang) => lang === language)
      if (!matchesLanguage) {
        return false
      }
    }

    if (normalizedTerm) {
      const haystacks = [professional.name, professional.bioShort, ...ensureArray(professional.specialties).map(formatChip)]
      const found = haystacks.some((entry) => normalizeText(entry).includes(normalizedTerm))
      if (!found) {
        return false
      }
    }

    return true
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const professionParam = sanitize(searchParams.get('profissao'))
  const ageParam = sanitize(searchParams.get('faixaEtaria'))
  const languageParam = sanitize(searchParams.get('idioma'))
  const termsParam = sanitize(searchParams.get('termos'))
  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)

  const professionKey = PROFESSION_LOOKUP[professionParam] ?? 'todas'
  const ageBands = AGE_LOOKUP[ageParam] ?? []
  const languageCode = LANGUAGE_LOOKUP[languageParam] ?? undefined
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1

  const filtered = filterProfessionals(PROFESSIONALS_MOCK, {
    profession: professionKey,
    ageBand: ageBands,
    language: languageCode,
    terms: termsParam,
  })

  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const items = filtered.slice(start, end).map(mapProfessional)
  const hasMore = end < filtered.length

  return NextResponse.json({ items, hasMore })
}
