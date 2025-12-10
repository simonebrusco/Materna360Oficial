import type { SpecialtyId, ProfessionalRecord } from '@/app/api/profissionais/route'

export type { SpecialtyId }

export type ProfessionalApi = ProfessionalRecord

type ProfessionalsResponse = {
  professionals: ProfessionalApi[]
}

/**
 * Busca a lista de profissionais na API mock do Materna360.
 * Pode ser usada em client components.
 */
export async function getProfessionals(): Promise<ProfessionalApi[]> {
  const res = await fetch('/api/profissionais', {
    method: 'GET',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Não foi possível carregar a lista de profissionais.')
  }

  const data = (await res.json()) as ProfessionalsResponse
  return data.professionals
}
