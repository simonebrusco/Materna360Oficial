// app/lib/ai/maternaCore.ts
//
// Núcleo de IA do Materna360.
// Centraliza tipos e chamada ao modelo (OpenAI).
//
// Regras:
// - Este módulo deve ser independente de rotas/endpoints específicos.
// - As rotas importam tipos e callMaternaAI daqui.
// - Em caso de erro, a rota decide fallback/UX.
//
// Observação: este arquivo existe para manter compatibilidade com imports
// em:
// - app/api/ai/rotina/route.ts
// - app/api/ai/meu-dia/route.ts
// - app/lib/ai/profileAdapter.ts (+ eu360ProfileAdapter.ts)

import OpenAI from 'openai'

/* =========================
   Tipos de domínio (compat)
========================= */

export type MaternaGuidanceStyle = 'diretas' | 'explicacao' | 'motivacionais'
export type MaternaEmotionalBaseline = 'sobrecarregada' | 'cansada' | 'equilibrada' | 'leve'
export type MaternaUserRole = 'mae' | 'pai' | 'outro'
export type MaternaScreenTime = 'nada' | 'ate1h' | '1-2h' | 'mais2h'
export type MaternaSupportAvailability = 'sempre' | 'as-vezes' | 'raramente'
export type MaternaUserSelfcareFrequency = 'diario' | 'semana' | 'pedido'
export type MaternaAgeRange = '0-1' | '1-3' | '3-6' | '6-8' | '8+'
export type MaternaChildPhase = 'sono' | 'birras' | 'escolar' | 'socializacao' | 'alimentacao'
export type MaternaFocusOfDay = 'Cansaço' | 'Culpa' | 'Organização' | 'Conexão com o filho'

export type MaternaMode = 'quick-ideas' | 'daily-inspiration' | 'smart-recipes'
export type RotinaComQuem = 'so-eu' | 'eu-e-meu-filho' | 'familia-toda'

export type RotinaTipoIdeia =
  | 'brincadeira'
  | 'organizacao'
  | 'autocuidado'
  | 'receita-rapida'
  | 'meu-filho-bloco-1'
  | 'meu-filho-bloco-2'
  | 'meu-filho-bloco-3'
  | 'meu-filho-bloco-4'

export interface MaternaProfile {
  nomeMae?: string
  userPreferredName?: string
  userRole?: MaternaUserRole
  userEmotionalBaseline?: MaternaEmotionalBaseline
  userMainChallenges?: string[]
  userEnergyPeakTime?: 'manha' | 'tarde' | 'noite'
  filhos?: MaternaChildProfile[]
  routineChaosMoments?: string[]
  routineScreenTime?: MaternaScreenTime
  routineDesiredSupport?: string[]
  supportNetwork?: string[]
  supportAvailability?: MaternaSupportAvailability
  userContentPreferences?: string[]
  userGuidanceStyle?: MaternaGuidanceStyle
  userSelfcareFrequency?: MaternaUserSelfcareFrequency
  figurinha?: string
}

export interface MaternaChildProfile {
  id?: string
  genero?: 'menino' | 'menina'
  idadeMeses?: number
  nome?: string
  alergias?: string[]
  ageRange?: MaternaAgeRange
  currentPhase?: MaternaChildPhase
  notes?: string
}

export interface RotinaQuickIdeasContext {
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null
  // campos extras que rotas podem enviar
  [k: string]: any
}

export interface DailyInspirationContext {
  focusOfDay?: MaternaFocusOfDay | null
  [k: string]: any
}

export interface SmartRecipesContext {
  ingredientePrincipal?: string | null
  tipoRefeicao?: string | null
  tempoPreparo?: number | null
  [k: string]: any
}

/* =========================
   Tipos de saída
========================= */

export type RotinaQuickSuggestion = {
  id: string
  category: 'ideia-rapida'
  title: string
  description: string
  estimatedMinutes?: number
  withChild: boolean
  moodImpact?: 'acalma' | 'energia' | 'organiza' | 'aproxima'
}

export type DailyInspiration = {
  phrase: string
  care: string
  ritual: string
}

export type SmartRecipe = {
  id: string
  title: string
  description: string
  timeLabel: string
  ageLabel: string
  preparation: string
  safetyNote?: string
}

export type MaternaAIRequestPayload =
  | {
      mode: 'quick-ideas'
      profile: MaternaProfile | null
      child?: MaternaChildProfile | null
      context: RotinaQuickIdeasContext
      personalization?: unknown | null
    }
  | {
      mode: 'daily-inspiration'
      profile: MaternaProfile | null
      child?: MaternaChildProfile | null
      context: DailyInspirationContext
      personalization?: unknown | null
    }
  | {
      mode: 'smart-recipes'
      profile: MaternaProfile | null
      child?: MaternaChildProfile | null
      context: SmartRecipesContext
      personalization?: unknown | null
    }

export interface MaternaAIResponseMap {
  'quick-ideas': { suggestions: RotinaQuickSuggestion[] }
  'daily-inspiration': { inspiration: DailyInspiration }
  'smart-recipes': { recipes: SmartRecipe[] }
}

/* =========================
   Helpers
========================= */

export function deriveAgeRangeFromMonths(ageMonths?: number | null): MaternaAgeRange | undefined {
  if (typeof ageMonths !== 'number' || ageMonths < 0) return undefined
  if (ageMonths < 12) return '0-1'
  if (ageMonths < 36) return '1-3'
  if (ageMonths < 72) return '3-6'
  if (ageMonths < 96) return '6-8'
  return '8+'
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function buildBaseSystemPrompt(): string {
  return `
Você é a inteligência oficial do Materna360, um app que ajuda mães cansadas a viverem a maternidade com mais leveza, conexão e clareza.

REGRAS:
- Português do Brasil
- Tom humano, direto e sem julgamentos
- Micro-ações possíveis
- Nada de diagnósticos
- Não use linguagem de cobrança
- Responda sempre com JSON válido
`.trim()
}

/**
 * P34.17 — recorte controlado: MEU FILHO (Bloco 1)
 */
function buildMeuFilhoBloco1BrainPrompt(): string {
  return `
VOCÊ ESTÁ EM: MATERNAR > MEU FILHO > BLOCO 1 (micro-experiência única)

MISSÃO
Gerar UMA única micro-experiência para fazer agora com a criança — pensada para o momento real.

DADOS DISPONÍVEIS (use 1 ou 2 para ancorar o "agora", sem explicar)
- context.tempoDisponivel (minutos)
- personalization.local (ex.: casa / ao ar livre) e/ou personalization.contexto
- personalization.ageBand e/ou child.idadeMeses
- personalization.habilidades (se vier)
- personalization.avoid_titles / avoid_themes (evitar repetir clima/tema)
- personalization.requestId / nonce / variation (se vier)

FORMATO OBRIGATÓRIO
Responder APENAS com JSON no shape:
{
  "suggestions": [
    {
      "id": "mf_b1_<curto>",
      "category": "ideia-rapida",
      "title": "",
      "description": "<1 a 3 frases, natural, específico, sem template>",
      "estimatedMinutes": <number>,
      "withChild": true,
      "moodImpact": "acalma" | "energia" | "organiza" | "aproxima"
    }
  ]
}

REGRAS (não negociáveis)
- description: 1 a 3 frases, no máximo 280 caracteres.
- Proibido: "você pode", "voce pode", "que tal", "talvez", "se quiser", "uma ideia".
- Proibido: listas, bullets, passos numerados, hífens, quebras de linha.
- Proibido: rotina/frequência/hábito ("todo dia", "sempre", etc.).
- Não escolarizar. Não dar aula. Não explicar “porquê”.
- A experiência deve ter começo-meio-fim, mas sem virar checklist.

ANTI-COLAPSO (OBRIGATÓRIO)
Para evitar respostas parecidas, escolha UM “arco” diferente a cada geração.
Use requestId/nonce/variation se existir; se não existir, varie mesmo assim.
Nunca nomeie o arco; apenas escreva a micro-experiência.

Arcos possíveis (escolha 1):
A) Silêncio + detalhe (acalmar com um microfoco sensorial)
B) Missão-relâmpago (energia com um desafio curtíssimo)
C) Dupla de arrumação (organiza com um gesto simples compartilhado)
D) História-objeto (aproxima com narrativa de 1 objeto do ambiente)
E) Espelho (aproxima imitando um ao outro por 20–40 segundos)
F) “Escolha pequena” (autonomia: a criança escolhe entre 2 coisas simples)

EVITAR REPETIÇÃO
- Se houver avoid_titles/avoid_themes, não reutilize os mesmos substantivos/objetos/“clima”.
- Se o último tema parecia “corrida/movimento”, mude para “calma/observação” (ou vice-versa).
- Mude o cenário (mesa/chão/porta/janela/banheiro/quintal) quando possível.

QUALIDADE
A micro-experiência deve soar como algo pensado para agora, não como conselho genérico.
`.trim()
}

function buildModeSpecializationPrompt(payload: MaternaAIRequestPayload): string {
  if (payload.mode === 'quick-ideas') {
    const tipoIdeia = payload.context?.tipoIdeia as RotinaTipoIdeia | undefined
    if (tipoIdeia === 'meu-filho-bloco-1') return buildMeuFilhoBloco1BrainPrompt()

    // comportamento genérico de quick-ideas (mantido simples e compatível)
    return `
Você está em QUICK IDEAS do Materna360.
Gere sugestões práticas, acolhedoras e possíveis agora.
Sem cobrança. Sem diagnóstico. Sem listas longas.
Retorne JSON no shape: { "suggestions": [ ... ] }.
`.trim()
  }

  if (payload.mode === 'daily-inspiration') {
    return `
Você está em DAILY INSPIRATION do Materna360.
Retorne JSON no shape:
{ "inspiration": { "phrase": "...", "care": "...", "ritual": "..." } }.
Tom acolhedor e direto.
`.trim()
  }

  // smart-recipes
  return `
Você está em SMART RECIPES do Materna360.
Retorne JSON no shape: { "recipes": [ ... ] }.
Receitas simples, seguras e realistas.
`.trim()
}

/* =========================
   Cliente OpenAI
========================= */

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const MODEL = process.env.MATERNA360_AI_MODEL || 'gpt-4.1-mini'

/* =========================
   callMaternaAI
========================= */

export async function callMaternaAI<TMode extends MaternaMode>(
  payload: Extract<MaternaAIRequestPayload, { mode: TMode }>,
): Promise<MaternaAIResponseMap[TMode]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY ausente')
  }

  const system = [buildBaseSystemPrompt(), buildModeSpecializationPrompt(payload)].join('\n\n')
  const user = JSON.stringify(
    {
      profile: payload.profile,
      child: payload.child ?? null,
      context: payload.context,
      personalization: payload.personalization ?? null,
    },
    null,
    0,
  )

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.75,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    })

    const content = completion.choices?.[0]?.message?.content ?? ''
    const parsed = safeJsonParse<any>(content)

    // Caminhos esperados por mode
    if (payload.mode === 'quick-ideas') {
      const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : null
      if (suggestions) return { suggestions } as MaternaAIResponseMap[TMode]

      // fallback mínimo se o modelo não devolver JSON
      return {
        suggestions: [
          {
            id: 'fallback_1',
            category: 'ideia-rapida',
            title: '',
            description: String(content || '').slice(0, 280),
            estimatedMinutes:
              typeof (payload.context as any)?.tempoDisponivel === 'number'
                ? Math.max(1, Math.round((payload.context as any).tempoDisponivel))
                : 5,
            withChild: true,
            moodImpact: 'aproxima',
          },
        ],
      } as MaternaAIResponseMap[TMode]
    }

    if (payload.mode === 'daily-inspiration') {
      const insp = parsed?.inspiration
      if (insp?.phrase && insp?.care && insp?.ritual) {
        return { inspiration: insp } as MaternaAIResponseMap[TMode]
      }
      return {
        inspiration: {
          phrase: 'Respire. Você não precisa dar conta de tudo sozinha.',
          care: 'Beba um copo d’água e solte os ombros por 10 segundos.',
          ritual: 'Escolha uma pequena prioridade e deixe o resto para depois.',
        },
      } as MaternaAIResponseMap[TMode]
    }

    // smart-recipes
    const recipes = Array.isArray(parsed?.recipes) ? parsed.recipes : []
    return { recipes } as MaternaAIResponseMap[TMode]
  } catch (err) {
    console.error('[callMaternaAI] Erro na OpenAI', err)
    throw new Error('Erro na OpenAI')
  }
}
