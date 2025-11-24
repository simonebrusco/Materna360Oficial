// app/lib/ai/maternaCore.ts
//
// Núcleo de personalização de IA do Materna360.
// Este módulo centraliza tipos, preparação de contexto e chamada ao modelo,
// seguindo o "Modelo de Personalização Materna360 — v1.0".
//
// IMPORTANTE:
// - Este arquivo não é acoplado a nenhum endpoint específico.
// - Endpoints como /api/ai/rotina e /api/ai/emocional devem importar funções daqui.
// - Sempre tratar erros nos endpoints e aplicar fallbacks carinhosos no front.

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

export type RotinaTipoIdeia = 'brincadeira' | 'organizacao' | 'autocuidado' | 'receita-rapida'

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
}

export interface DailyInspirationContext {
  focusOfDay?: MaternaFocusOfDay | null
}

export interface SmartRecipesContext {
  ingredientePrincipal?: string | null
  tipoRefeicao?: string | null
  tempoPreparo?: number | null
}

// ---------- Tipos de saída que os endpoints podem usar ----------

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

// ---------- Helpers de idade / faixa etária ----------

export function deriveAgeRangeFromMonths(ageMonths?: number | null): MaternaAgeRange | undefined {
  if (typeof ageMonths !== 'number' || !Number.isFinite(ageMonths) || ageMonths < 0) {
    return undefined
  }

  if (ageMonths <= 12) return '0-1'
  if (ageMonths <= 36) return '1-3'
  if (ageMonths <= 72) return '3-6'
  if (ageMonths <= 96) return '6-8'
  return '8+'
}

// ---------- Prompt base do Materna360 ----------

function buildBaseSystemPrompt(): string {
  return `
Você é a inteligência oficial do Materna360, um app que ajuda mães cansadas a viverem a maternidade com mais leveza, conexão e clareza.

REGRAS GERAIS:
- Fale SEMPRE em português do Brasil.
- Use um tom acolhedor, humano, realista e sem julgamentos.
- Nunca culpe a mãe, nunca sugira que ela "não faz o suficiente".
- Priorize micro-ações possíveis para uma mãe cansada e sobrecarregada.
- Evite termos técnicos, jargões ou explicações longas demais.
- Não faça diagnósticos médicos ou psicológicos.
- Em temas de saúde, alimentação ou sono, traga apenas orientações gerais e lembre de consultar pediatra/profissional de saúde.
- Quando falar de alimentação infantil, sempre considere idade e mencione que é importante seguir as recomendações do pediatra.

PERSONALIZAÇÃO:
Você sempre recebe um JSON com:
- "mode": tipo de conteúdo que deve gerar
- "profile": dados da mãe e da família (campos do EU360)
- "child": dados do filho principal (idade em meses, fase, alergias)
- "context": contexto da funcionalidade/mini-hub (tempo disponível, foco do dia, tipo de ideia, etc.)
- "personalization": snapshot estruturado com o resumo dos padrões da família e do uso do Planner (quando disponível)

Use esses dados para:
- ajustar o tom (mais motivacional, mais direto, mais leve)
- adequar à idade e fase da criança
- respeitar o nível de energia e sobrecarga
- propor poucas ações, simples e realistas (nunca muitas tarefas de uma vez)
- reconhecer padrões de uso do app e reforçar o que já está ajudando (sem pressão)

TOM EMOCIONAL:
- Se a mãe estiver "sobrecarregada" ou "cansada", diminua exigências e foque em alívio e autocuidado possível.
- Se o foco do dia for "Culpa", reforce que ela já está fazendo muito e que não existe mãe perfeita.
- Se o foco for "Organização", traga passos bem pequenos, ex: uma tarefa por vez.
- Se o foco for "Conexão com o filho", foque em gestos simples de presença: olhar, abraço, história curta.

FORMATO:
- Você SEMPRE responde com JSON VÁLIDO, sem texto fora do JSON.
- Não inclua comentários ou explicações fora da estrutura JSON esperada para cada modo.
`.trim()
}

function buildModeSpecializationPrompt(mode: MaternaMode): string {
  if (mode === 'quick-ideas') {
    return `
Você está na funcionalidade "Ideias Rápidas" da Rotina Leve.

Objetivo:
Gerar pequenas sugestões realistas para o momento atual da mãe, ajudando a:
- aliviar a carga mental
- criar conexões simples com o filho
- organizar um ponto pequeno da rotina
- ou cuidar minimamente de si mesma

Regras específicas:
- As ideias devem caber no tempo disponível em minutos (quando informado).
- Se a mãe estiver sozinha, foque em autocuidado breve ou micro-organização.
- Se ela estiver com o filho, foque em conexão simples, sem exigir materiais difíceis.
- Se estiver com a família toda, foque em algo que envolva todos, ainda simples.
- Não crie atividades longas, complexas ou cheias de passos.

Saída:
Responda SEMPRE com:

{
  "suggestions": RotinaQuickSuggestion[]
}

Onde cada RotinaQuickSuggestion possui:
- "id": string (ID único)
- "category": "ideia-rapida"
- "title": string (curto)
- "description": string (explicação breve, prática e acolhedora)
- "estimatedMinutes": number (aproximado, se fizer sentido)
- "withChild": boolean
- "moodImpact": "acalma" | "energia" | "organiza" | "aproxima"
`.trim()
  }

  if (mode === 'daily-inspiration') {
    return `
Você está na funcionalidade "Inspirações do Dia".

Objetivo:
Gerar uma combinação de:
- frase principal (phrase)
- pequeno cuidado (care)
- mini ritual (ritual)

Tudo deve:
- aliviar culpa e peso mental
- caber no dia de uma mãe cansada
- ser concreto e possível, não vago.

Regras específicas:
- Se a mãe estiver "sobrecarregada" ou se o foco for "Cansaço" ou "Culpa", diminua cobranças e expectativas.
- Se o foco for "Organização", ofereça um micro movimento concreto (ex.: uma coisa por vez).
- Se o foco for "Conexão com o filho", foque em gestos simples de presença.

Saída:
Responda SEMPRE com:

{
  "inspiration": {
    "phrase": string,
    "care": string,
    "ritual": string
  }
}
`.trim()
  }

  // smart-recipes
  return `
Você está na funcionalidade "Receitas Inteligentes".

Objetivo:
Sugerir receitas simples, rápidas e realistas para a fase da criança,
aliviando o peso mental da mãe na hora de pensar em comida.

Regras específicas:
- Use o ingrediente principal e o tipo de refeição como guia.
- Sempre considere a idade da criança em meses e possíveis alergias.
- Nunca sugira algo que seja claramente inseguro para crianças.
- Para 0 a 6 meses: NÃO traga receitas; lembre com carinho sobre aleitamento materno e pediatra.
- Para 6–12 meses: receitas muito simples, consistência adequada à introdução alimentar.
- Sempre inclua nota de segurança remetendo ao pediatra em faixas etárias sensíveis.

Saída:
Responda SEMPRE com:

{
  "recipes": SmartRecipe[]
}

Onde SmartRecipe possui:
- "id": string
- "title": string
- "description": string
- "timeLabel": string
- "ageLabel": string
- "preparation": string (texto contínuo com passos simples)
- "safetyNote": string (opcional, recomendado para bebês)
`.trim()
}

// ---------- Função principal de chamada ao modelo ----------

// Endpoint da API da OpenAI.
// Não usar client específico para evitar dependência; usamos fetch nativo do Next.
const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'

// Modelo padrão (pode ser sobrescrito por env var)
const DEFAULT_MATERNA_MODEL = 'gpt-4.1-mini'

type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Chama o modelo da OpenAI para um modo específico do Materna360,
 * retornando o JSON já parseado.
 *
 * IMPORTANTE:
 * - Endpoints que usam esta função DEVEM estar envolvidos em try/catch
 *   e oferecer fallback carinhoso no front, nunca quebrar a experiência.
 */
export async function callMaternaAI<M extends MaternaMode>(
  payload: MaternaAIRequestPayload & { mode: M }
): Promise<MaternaAIResponseMap[M]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('[maternaCore] OPENAI_API_KEY não configurada no ambiente')
  }

  // Garante faixa etária derivada se a idade em meses existir
  const childWithAgeRange: MaternaChildProfile | null =
    payload.child && typeof payload.child.idadeMeses === 'number'
      ? {
          ...payload.child,
          ageRange: payload.child.ageRange ?? deriveAgeRangeFromMonths(payload.child.idadeMeses),
        }
      : payload.child ?? null

  const systemPrompt =
    buildBaseSystemPrompt() + '\n\n' + buildModeSpecializationPrompt(payload.mode)

  const messages: OpenAIChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: JSON.stringify({
        mode: payload.mode,
        profile: payload.profile ?? null,
        child: childWithAgeRange,
        context: payload.context ?? null,
        personalization: payload.personalization ?? null,
      }),
    },
  ]

  const model = process.env.MATERNA360_AI_MODEL || DEFAULT_MATERNA_MODEL

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      response_format: {
        type: 'json_object',
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `[maternaCore] Erro da OpenAI (status ${response.status}): ${text || 'sem body'}`
    )
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('[maternaCore] Resposta da OpenAI sem conteúdo')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new Error(
      '[maternaCore] Falha ao fazer parse do JSON retornado pela OpenAI: ' +
        (error instanceof Error ? error.message : String(error))
    )
  }

  return parsed as MaternaAIResponseMap[M]
}
