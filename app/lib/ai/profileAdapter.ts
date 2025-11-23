// app/lib/ai/profileAdapter.ts

export type MaternaChildProfile = {
  name?: string
  ageInMonths?: number | null
  ageInYears?: number | null
}

export type MaternaUserProfile = {
  motherName?: string
  mainChallenges?: string[]
  availableTimePerDayMinutes?: number | null
  energyLevel?: 'baixa' | 'media' | 'alta' | null
  children?: MaternaChildProfile[]
}

/**
 * Tipo de contexto base que será passado para a IA.
 */
export type BaseAIContext = {
  profile: MaternaUserProfile | null
}

/**
 * Aqui vamos buscar o perfil real armazenado no EU360.
 * POR ENQUANTO, retornamos null para garantir segurança.
 * Depois vamos integrar com sua fonte real (Supabase, API interna ou persist local).
 */
export async function getMaternaProfile(): Promise<MaternaUserProfile | null> {
  // TODO: integrar com o perfil real do EU360.
  // Temporariamente retornamos null para não quebrar fluxos.
  return null
}

/**
 * Constrói o contexto base da IA usando o perfil da mãe.
 */
export async function buildAIContextFromProfile(): Promise<BaseAIContext> {
  const profile = await getMaternaProfile()
  return { profile }
}
