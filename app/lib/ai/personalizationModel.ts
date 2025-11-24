// app/lib/ai/personalizationModel.ts
// Materna360 — Personalization Model v1.0 (código)

// Papel da pessoa usuária no app
export type MaternaUserRole = 'mae' | 'pai' | 'outro'

// Como ela costuma se sentir na base do dia a dia
export type MaternaEmotionalBaseline =
  | 'sobrecarregada'
  | 'cansada'
  | 'equilibrada'
  | 'leve'

// Horário em que sente mais energia
export type MaternaEnergyPeakTime = 'manha' | 'tarde' | 'noite'

// Faixas etárias principais que usamos para personalizar
export type MaternaAgeRange = '0-6m' | '6-12m' | '1-3' | '3-6' | '6-8' | '8+'

// Fases atuais mais comuns dos filhos
export type MaternaChildPhase =
  | 'sono'
  | 'birras'
  | 'escolar'
  | 'socializacao'
  | 'alimentacao'

// Tempo de telas na rotina
export type MaternaScreenTimeRange = 'nada' | 'ate1h' | '1-2h' | 'mais2h'

// Disponibilidade da rede de apoio
export type MaternaSupportAvailability = 'sempre' | 'as-vezes' | 'raramente'

// Como ela prefere receber orientações
export type MaternaGuidanceStyle = 'diretas' | 'explicacao' | 'motivacionais'

// Frequência de autocuidado
export type MaternaSelfcareFrequency = 'diario' | 'semana' | 'pedido'

export interface MaternaChildProfileModel {
  id: string
  name: string | null
  gender: 'menino' | 'menina' | null
  ageMonths: number | null
  ageRange: MaternaAgeRange | null
  currentPhase: MaternaChildPhase | null
  allergies: string[]
  notes?: string | null
}

export interface MaternaUserProfileModel {
  // Identidade
  motherName: string | null
  preferredName: string | null
  role: MaternaUserRole | null

  // Emoções & energia
  emotionalBaseline: MaternaEmotionalBaseline | null
  mainChallenges: string[]
  energyPeakTime: MaternaEnergyPeakTime | null

  // Rotina & momentos críticos
  routineChaosMoments: string[]
  routineScreenTime: MaternaScreenTimeRange | null
  routineDesiredSupport: string[]

  // Rede de apoio
  supportNetwork: string[]
  supportAvailability: MaternaSupportAvailability | null

  // Preferências no app
  contentPreferences: string[]
  guidanceStyle: MaternaGuidanceStyle | null
  selfcareFrequency: MaternaSelfcareFrequency | null

  // Visual / figurinha
  stickerId: string | null

  // Filhos
  children: MaternaChildProfileModel[]
}

// Snapshot consolidado que a IA vai usar
export interface MaternaPersonalizationSnapshot {
  user: MaternaUserProfileModel
  primaryChild: MaternaChildProfileModel | null
}

/**
 * Converte idade em meses para a faixa etária usada no Materna360.
 */
export function deriveAgeRange(
  ageMonths: number | null | undefined
): MaternaAgeRange | null {
  if (ageMonths == null || !Number.isFinite(ageMonths)) {
    return null
  }

  const value = Math.max(0, Math.floor(ageMonths))

  if (value < 6) return '0-6m'
  if (value < 12) return '6-12m'
  if (value < 36) return '1-3'
  if (value < 72) return '3-6'
  if (value < 96) return '6-8'
  return '8+'
}
