export type CouncilType = 'CRP' | 'CRFa' | 'CRN' | 'CREFITO' | 'OUTRO'

export type Professional = {
  id: string
  name: string
  profession:
    | 'psicologia'
    | 'fonoaudiologia'
    | 'psicopedagogia'
    | 'pedagogia_parental'
    | 'consultora_amamentacao'
    | 'nutricao_materno_infantil'
    | 'fisio_pelvica'
    | 'doula'
  council?: { type: CouncilType; number: string }
  avatarUrl: string
  yearsExperience?: number
  approvedByMaterna360: boolean
  firstAssessmentFree: boolean
  formats: { online: boolean; inPerson: boolean; regions?: string[] }
  languages: string[]
  ageBands: ('gestante' | '0-6m' | '7-12m' | '1-3a' | '4-6a')[]
  specialties: string[]
  bioShort: string
  howHelps: string[]
  approaches?: string[]
  availableIn48h?: boolean
  whatsapp?: string
  calendlyUrl?: string
  priceInfo?: string
}

export type ProfessionalsFilters = {
  profession?: Professional['profession'] | 'todas'
  specialties?: string[]
  formats?: ('online' | 'presencial')[]
  region?: string
  ageBand?: 'gestante' | '0-6m' | '7-12m' | '1-3a' | '4-6a' | 'todas'
  language?: string
  availableIn48h?: boolean
  q?: string
  sort?: 'relevancia' | 'nome'
  page?: number
}

export const DEFAULT_PROFESSIONAL_FILTERS: ProfessionalsFilters = {
  profession: 'todas',
  specialties: [],
  formats: [],
  ageBand: 'todas',
  language: 'pt-BR',
  availableIn48h: false,
  q: '',
  sort: 'relevancia',
  page: 1,
}
