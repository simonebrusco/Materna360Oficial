// app/lib/profissionais.ts

export type SpecialtyId =
  | 'psicologia-infantil'
  | 'psicopedagogia'
  | 'nutricao-materno-infantil'
  | 'sono-infantil'
  | 'parentalidade-familia'

export interface ProfessionalApi {
  id: string
  name: string
  specialtyId: SpecialtyId
  specialtyLabel: string
  focus: string
  city: string
  tags: string[]
  shortBio: string
  whatsappUrl: string
}

/**
 * Busca a lista de profissionais a partir da API interna do Materna360.
 * - Se a API responder com sucesso, usamos os dados reais.
 * - Se der qualquer erro, devolvemos uma lista vazia (o próprio Materna+ já trata isso).
 */
export async function getProfessionals(): Promise<ProfessionalApi[]> {
  try {
    const res = await fetch('/api/professionals', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      console.error(
        '[Materna360][Materna+] Falha ao carregar profissionais. Status:',
        res.status,
      )
      return []
    }

    const data = (await res.json()) as unknown

    if (!Array.isArray(data)) {
      console.error(
        '[Materna360][Materna+] Resposta inesperada da API de profissionais:',
        data,
      )
      return []
    }

    // Validação leve de formato, para evitar quebrar o front caso algo venha errado
    const safeList: ProfessionalApi[] = data
      .map(item => {
        const p = item as Partial<ProfessionalApi>

        if (!p.id || !p.name || !p.specialtyId || !p.specialtyLabel) {
          return null
        }

        return {
          id: String(p.id),
          name: String(p.name),
          specialtyId: p.specialtyId as SpecialtyId,
          specialtyLabel: String(p.specialtyLabel),
          focus: p.focus ? String(p.focus) : '',
          city: p.city ? String(p.city) : '',
          tags: Array.isArray(p.tags)
            ? p.tags.map(String)
            : [],
          shortBio: p.shortBio ? String(p.shortBio) : '',
          whatsappUrl: p.whatsappUrl ? String(p.whatsappUrl) : '',
        } satisfies ProfessionalApi
      })
      .filter(Boolean) as ProfessionalApi[]

    return safeList
  } catch (error) {
    console.error(
      '[Materna360][Materna+] Erro inesperado ao buscar profissionais:',
      error,
    )
    return []
  }
}
