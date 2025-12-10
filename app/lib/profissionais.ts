export type ProfessionalApi = {
  id: string
  nome: string
  especialidade: string
  foto: string | null
  bio: string
  cidade: string
  tags: string[]
  whatsapp: string
}

type ProfessionalsResponse = {
  professionals: ProfessionalApi[]
}

/**
 * Busca a lista de profissionais na API mock do Materna360.
 * Pode ser usada tanto em client components quanto em server components.
 */
export async function getProfessionals(): Promise<ProfessionalApi[]> {
  const res = await fetch('/api/profissionais', {
    method: 'GET',
    // Importante para permitir reuso em client-side sem cache agressivo
    cache: 'no-store',
  })

  if (!res.ok) {
    // Em produção podemos logar isso em um serviço de observabilidade
    throw new Error('Não foi possível carregar a lista de profissionais.')
  }

  const data = (await res.json()) as ProfessionalsResponse
  return data.professionals
}
