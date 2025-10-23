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
  whatsapp?: string
  calendlyUrl?: string
  priceInfo?: string
}
