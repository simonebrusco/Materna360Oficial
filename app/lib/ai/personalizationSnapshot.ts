// app/lib/ai/personalizationSnapshot.ts
// Converte os dados do Eu360 para o modelo de personalização da IA (Materna360 v1.0)

import {
  deriveAgeRange,
  type MaternaAgeRange,
  type MaternaChildProfileModel,
  type MaternaUserProfileModel,
  type MaternaPersonalizationSnapshot,
  type MaternaUserRole,
  type MaternaEmotionalBaseline,
  type MaternaEnergyPeakTime,
  type MaternaScreenTimeRange,
  type MaternaSupportAvailability,
  type MaternaGuidanceStyle,
  type MaternaSelfcareFrequency,
} from '@/app/lib/ai/personalizationModel'

// Shape esperado da API /api/eu360/profile (lado servidor)
export type Eu360ChildFromAPI = {
  id: string
  genero?: 'menino' | 'menina'
  idadeMeses?: number
  nome?: string
  alergias?: string[]
  ageRange?: MaternaAgeRange
  currentPhase?: 'sono' | 'birras' | 'escolar' | 'socializacao' | 'alimentacao'
  notes?: string
}

export type Eu360ProfileFromAPI = {
  name?: string
  birthdate?: string | null
  age_months?: number | null
  userPreferredName?: string
  userRole?: MaternaUserRole | null
  userEmotionalBaseline?: MaternaEmotionalBaseline | null
  userMainChallenges?: string[]
  userEnergyPeakTime?: MaternaEnergyPeakTime | null
  routineChaosMoments?: string[]
  routineScreenTime?: MaternaScreenTimeRange | null
  routineDesiredSupport?: string[]
  supportNetwork?: string[]
  supportAvailability?: MaternaSupportAvailability | null
  userContentPreferences?: string[]
  userGuidanceStyle?: MaternaGuidanceStyle | null
  userSelfcareFrequency?: MaternaSelfcareFrequency | null
  figurinha?: string | null
  children?: Eu360ChildFromAPI[]
}

/**
 * Normaliza e sanitiza um filho vindo da API do Eu360 para o modelo usado pela IA.
 */
function normalizeChild(child: Eu360ChildFromAPI, index: number): MaternaChildProfileModel {
  const rawAgeMonths =
    typeof child.idadeMeses === 'number' && Number.isFinite(child.idadeMeses)
      ? Math.max(0, Math.floor(child.idadeMeses))
      : null

  const ageRange = child.ageRange ?? deriveAgeRange(rawAgeMonths)

  return {
    id: child.id || `child-${index}`,
    name: child.nome?.trim() || null,
    gender: child.genero === 'menina' || child.genero === 'menino' ? child.genero : null,
    ageMonths: rawAgeMonths,
    ageRange,
    currentPhase:
      child.currentPhase && ['sono', 'birras', 'escolar', 'socializacao', 'alimentacao'].includes(child.currentPhase)
        ? child.currentPhase
        : null,
    allergies: Array.isArray(child.alergias)
      ? child.alergias
          .map((a) => (typeof a === 'string' ? a.trim() : ''))
          .filter((a) => a.length > 0)
      : [],
    notes: child.notes?.trim() || null,
  }
}

/**
 * Constrói o modelo de usuário (mãe/pai/cuidador) a partir do payload do Eu360.
 */
function buildUserModel(data: Eu360ProfileFromAPI): MaternaUserProfileModel {
  const childrenRaw = Array.isArray(data.children) ? data.children : []
  const children: MaternaChildProfileModel[] = childrenRaw.map(normalizeChild)

  return {
    // Identidade
    motherName: data.name?.trim() || null,
    preferredName: data.userPreferredName?.trim() || null,
    role: data.userRole ?? null,

    // Emoções & energia
    emotionalBaseline: data.userEmotionalBaseline ?? null,
    mainChallenges: Array.isArray(data.userMainChallenges)
      ? data.userMainChallenges.filter((c) => typeof c === 'string' && c.trim().length > 0)
      : [],
    energyPeakTime: data.userEnergyPeakTime ?? null,

    // Rotina & momentos críticos
    routineChaosMoments: Array.isArray(data.routineChaosMoments)
      ? data.routineChaosMoments.filter((m) => typeof m === 'string' && m.trim().length > 0)
      : [],
    routineScreenTime: data.routineScreenTime ?? null,
    routineDesiredSupport: Array.isArray(data.routineDesiredSupport)
      ? data.routineDesiredSupport.filter((s) => typeof s === 'string' && s.trim().length > 0)
      : [],

    // Rede de apoio
    supportNetwork: Array.isArray(data.supportNetwork)
      ? data.supportNetwork.filter((s) => typeof s === 'string' && s.trim().length > 0)
      : [],
    supportAvailability: data.supportAvailability ?? null,

    // Preferências no app
    contentPreferences: Array.isArray(data.userContentPreferences)
      ? data.userContentPreferences.filter((p) => typeof p === 'string' && p.trim().length > 0)
      : [],
    guidanceStyle: data.userGuidanceStyle ?? null,
    selfcareFrequency: data.userSelfcareFrequency ?? null,

    // Visual / figurinha
    stickerId: typeof data.figurinha === 'string' && data.figurinha.trim().length > 0
      ? data.figurinha
      : null,

    // Filhos
    children,
  }
}

/**
 * A partir do payload cru do Eu360, constrói um snapshot completo de personalização
 * que pode ser enviado para o core de IA.
 */
export function buildPersonalizationSnapshotFromEu360(
  raw: Eu360ProfileFromAPI | null | undefined
): MaternaPersonalizationSnapshot | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const user = buildUserModel(raw)
  const primaryChild =
    user.children.find((c) => typeof c.ageMonths === 'number' && c.ageMonths !== null) ||
    user.children[0] ||
    null

  return {
    user,
    primaryChild,
  }
}
