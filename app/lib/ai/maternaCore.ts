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
Gerar UMA única micro-experiência para fazer agora com a criança.
Ela precisa parecer "pensada para agora", não genérica.

ENTRADAS (vêm no JSON do usuário)
- tempoDisponivel (minutos)
- ageBand (faixa)
- local (casa | ar_livre | deslocamento)  [pode vir como local ou playLocation]
- habilidades (array com 1 item)           [ex.: ["emocional"]]
- variation_axis (energia | calma | organizacao | aproxima)
- avoid_titles (array) / avoid_themes (array) — últimos 2 cliques

FORMATO OBRIGATÓRIO
Responder APENAS com JSON no shape:
{
  "suggestions": [
    {
      "id": "mf_b1_<curto>",
      "category": "ideia-rapida",
      "title": "<curto e específico>",
      "description": "<1 a 3 frases, natural, específico, sem template>",
      "estimatedMinutes": <number>,
      "withChild": true,
      "moodImpact": "acalma" | "energia" | "organiza" | "aproxima"
    }
  ]
}

REGRAS (não negociáveis)
- description: 1 a 3 frases, no máximo 280 caracteres.
- Proibido linguagem “template”:
  NÃO use: "você pode", "voce pode", "que tal", "talvez", "se quiser", "uma ideia", "experimente".
- NÃO listar passos, bullets, listas, nem numerar.
- NÃO sugerir rotina/frequência/hábito ("todo dia", "sempre", etc.).
- NÃO soar escolarizado (nada de “atividade pedagógica”, “objetivo”, “estimule”, etc.).
- A micro-experiência deve ter começo-meio-fim implícitos, sem rotular.

COERÊNCIA COM FILTROS (obrigatório)
- Use 1 detalhe explícito de LOCAL (casa / ar livre / deslocamento) na cena.
- Use a HABILIDADE escolhida para direcionar o tipo de ação:
  motor => corpo/movimento simples
  linguagem => fala/sons/história curta
  emocional => nomear sentimento + co-regulação
  cognitivo => organizar/achar/associar simples
  social => turnos/revezar/combinar rápido
  autonomia => escolha + pequena responsabilidade

EIXO DE VARIAÇÃO (obrigatório, anti-colapso)
- variation_axis define o "clima" e deve trocar a estrutura do momento.
  energia      => moodImpact="energia"     (mais movimento, mais ritmo)
  calma        => moodImpact="acalma"      (desacelera, regula)
  organizacao  => moodImpact="organiza"    (organiza um cantinho, ordenar, guardar)
  aproxima     => moodImpact="aproxima"    (olho no olho, conversa curta, gesto final)
- Mesmo com o mesmo filtro, mude o objeto/gancho e a linguagem quando o eixo mudar.

ANTI-REPETIÇÃO (janela 2 cliques)
- Se houver avoid_titles, NÃO repita título parecido.
- Se houver avoid_themes, mude o “motivo” da micro-experiência:
  não reaproveite o mesmo gancho (ex.: "missão", "caça", "circuito", "história", "pista") e não use os mesmos objetos-chave.
- O resultado deve soar novo mesmo quando a mãe clica duas vezes seguidas.

ANTI-CATÁLOGO (estrutura mental)
A micro-experiência deve conter, sem rotular:
1) Preparar (1 detalhe do ambiente/objeto)
2) Fazer (1 ação principal)
3) Fechar (1 fecho curto de conexão/celebração/guardar junto)
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
