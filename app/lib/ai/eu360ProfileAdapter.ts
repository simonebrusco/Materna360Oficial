// app/lib/ai/eu360ProfileAdapter.ts
//
// Adaptador entre o payload do /api/eu360/profile
// e os tipos de personalização do núcleo de IA (maternaCore).
//
// Objetivo: ter um único lugar responsável por "traduzir" o que vem
// do Eu360 para { profile, child } no formato MaternaProfile / MaternaChildProfile.

import type {
  MaternaProfile,
  MaternaChildProfile,
  MaternaAgeRange,
} from '@/app/lib/ai/maternaCore'
import { deriveAgeRangeFromMonths } from '@/app/lib/ai/maternaCore'

// Tipo auxiliar opcional (não precisamos confiar 100% nele, é só guia)
type Eu360Child = {
  id?: string
  genero?: 'menino' | 'menina'
  idadeMeses?: number
  nome?: string
  alergias?: string[]
  ageRange?: MaternaAgeRange
  currentPhase?: 'sono' | 'birras' | 'escolar' | 'socializacao' | 'alimentacao'
  notes?: string
}

type Eu360ProfileApiResponse = {
  // campos principais
  name?: string
  nomeMae?: string
  userPreferredName?: string
  userRole?: 'mae' | 'pai' | 'outro'
  userEmotionalBaseline?: 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'

  // filhos / crianças
  children?: Eu360Child[]
  filhos?: Eu360Child[] // fallback, caso a API use esse nome em algum momento

  // rotina
  routineChaosMoments?: string[]
  routineScreenTime?: 'nada' | 'ate1h' | '1-2h' | 'mais2h'
  routineDesiredSupport?: string[]

  // rede de apoio
  supportNetwork?: string[]
  supportAvailability?: 'sempre' | 'as-vezes' | 'raramente'

  // preferências de conteúdo
  userContentPreferences?: string[]
  userGuidanceStyle?: 'diretas' | 'explicacao' | 'motivacionais'
  userSelfcareFrequency?: 'diario' | 'semana' | 'pedido'

  figurinha?: string

  // campos auxiliares de idade (vindo da tabela babies)
  birthdate?: string | null
  age_months?: number | null
}

/**
 * Garante que um array seja sempre um array de strings.
 */
function asStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0)
  }
  return []
}

/**
 * Normaliza um array de crianças vindo do Eu360,
 * convertendo para MaternaChildProfile[].
 */
function normalizeChildren(raw: unknown): MaternaChildProfile[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((child): MaternaChildProfile | null => {
      if (!child || typeof child !== 'object') return null
      const c = child as Eu360Child

      const idadeMeses =
        typeof c.idadeMeses === 'number' && Number.isFinite(c.idadeMeses) && c.idadeMeses >= 0
          ? Math.floor(c.idadeMeses)
          : undefined

      return {
        id: c.id ?? undefined,
        genero: c.genero === 'menina' ? 'menina' : c.genero === 'menino' ? 'menino' : undefined,
        idadeMeses,
        nome: typeof c.nome === 'string' ? c.nome.trim() : undefined,
        alergias: asStringArray(c.alergias),
        ageRange: c.ageRange ?? deriveAgeRangeFromMonths(idadeMeses ?? null),
        currentPhase: c.currentPhase,
        notes: typeof c.notes === 'string' ? c.notes.trim() : undefined,
      }
    })
    .filter((c): c is MaternaChildProfile => c !== null)
}

/**
 * Pega a mãe/principal cuidador e monta um MaternaProfile.
 */
function buildMaternaProfileFromEu360(raw: Eu360ProfileApiResponse): MaternaProfile {
  const nomeMae =
    typeof raw.nomeMae === 'string' && raw.nomeMae.trim().length > 0
      ? raw.nomeMae.trim()
      : typeof raw.name === 'string'
      ? raw.name.trim()
      : undefined

  const children = normalizeChildren(raw.children ?? raw.filhos) // aceita tanto children quanto filhos

  return {
    nomeMae,
    userPreferredName:
      typeof raw.userPreferredName === 'string' && raw.userPreferredName.trim().length > 0
        ? raw.userPreferredName.trim()
        : undefined,
    userRole: raw.userRole,
    userEmotionalBaseline: raw.userEmotionalBaseline,
    userMainChallenges: asStringArray(raw.userMainChallenges),
    userEnergyPeakTime: raw.userEnergyPeakTime,
    filhos: children,
    routineChaosMoments: asStringArray(raw.routineChaosMoments),
    routineScreenTime: raw.routineScreenTime,
    routineDesiredSupport: asStringArray(raw.routineDesiredSupport),
    supportNetwork: asStringArray(raw.supportNetwork),
    supportAvailability: raw.supportAvailability,
    userContentPreferences: asStringArray(raw.userContentPreferences),
    userGuidanceStyle: raw.userGuidanceStyle,
    userSelfcareFrequency: raw.userSelfcareFrequency,
    figurinha: typeof raw.figurinha === 'string' ? raw.figurinha : undefined,
  }
}

/**
 * Seleciona a "criança principal" para personalização:
 * - primeiro filho com idade conhecida
 * - senão, o primeiro da lista
 * - senão, null
 */
function pickPrimaryChild(children: MaternaChildProfile[]): MaternaChildProfile | null {
  if (!children.length) return null

  const withAge = children.find(
    (c) => typeof c.idadeMeses === 'number' && Number.isFinite(c.idadeMeses)
  )
  if (withAge) {
    return {
      ...withAge,
      ageRange: withAge.ageRange ?? deriveAgeRangeFromMonths(withAge.idadeMeses ?? null),
    }
  }

  const first = children[0]
  return {
    ...first,
    ageRange: first.ageRange ?? deriveAgeRangeFromMonths(first.idadeMeses ?? null),
  }
}

/**
 * Função principal de adaptação:
 * recebe o JSON cru do /api/eu360/profile
 * e devolve { profile, child } já normalizados para o núcleo de IA.
 *
 * IMPORTANTE:
 * - Esta função NÃO faz chamadas externas nem mexe com cookies.
 * - É pura: apenas transforma dados.
 * - Endpoints server-side podem usá-la tranquilamente.
 */
export function adaptEu360ProfileToMaterna(
  raw: unknown
): { profile: MaternaProfile | null; child: MaternaChildProfile | null } {
  if (!raw || typeof raw !== 'object') {
    return {
      profile: null,
      child: null,
    }
  }

  const data = raw as Eu360ProfileApiResponse
  const baseProfile = buildMaternaProfileFromEu360(data)

  // Começamos com as crianças vindas do próprio perfil (children/filhos)
  let children = baseProfile.filhos ?? []

  // Se não houver nenhuma criança cadastrada, tentamos usar age_months
  // do Eu360 para criar uma criança "principal" sintética, garantindo
  // que a IA tenha pelo menos uma faixa etária de referência.
  if (!children.length && typeof data.age_months === 'number' && Number.isFinite(data.age_months)) {
    const idadeMeses = Math.max(0, Math.floor(data.age_months))

    const syntheticChild: MaternaChildProfile = {
      id: undefined,
      genero: undefined,
      idadeMeses,
      nome: undefined,
      alergias: [],
      ageRange: deriveAgeRangeFromMonths(idadeMeses),
      currentPhase: undefined,
      notes: undefined,
    }

    children = [syntheticChild]
  }

  const primaryChild = pickPrimaryChild(children)
  const profile: MaternaProfile = {
    ...baseProfile,
    filhos: children,
  }

  return {
    profile,
    child: primaryChild,
  }
}
