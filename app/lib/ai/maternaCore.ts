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

/**
 * RotinaTipoIdeia
 * ----------------
 * Expandido para suportar o Hub "Meu Filho" (P33.6) SEM criar nova rota/mode.
 * Mantém compat com usos existentes.
 */
export type RotinaTipoIdeia =
  | 'brincadeira'
  | 'organizacao'
  | 'autocuidado'
  | 'receita-rapida'
  // Hub Meu Filho — blocos canônicos
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

/**
 * RotinaQuickIdeasContext
 * - Campos básicos + extras por hub.
 * - O backend pode incluir mais campos (sem quebrar o contrato),
 *   mas estes são os suportados oficialmente aqui no core.
 */
export interface RotinaQuickIdeasContext {
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null

  // Meu Filho (todos os blocos)
  ageBand?: string | null // ex: '0-2' | '3-4' | '5-6' | '6+'
  contexto?: string | null

  // Bloco 2 (filtros)
  local?: string | null // ex: 'casa' | 'ar_livre' | 'deslocamento'
  habilidades?: string[] | null // ex: ['emocional'] (ou 1 item se UI for single-select)

  // Anti-repetição assistida (opcional; quem decide enviar é o front/endpoint)
  avoid_titles?: string[] | null
  avoid_themes?: string[] | null

  // rastreio / variação
  requestId?: string | null
  nonce?: string | null
}

export interface DailyInspirationContext {
  focusOfDay?: MaternaFocusOfDay | null
}

export interface SmartRecipesContext {
  ingredientePrincipal?: string | null
  tipoRefeicao?: string | null
  tempoPreparo?: number | null
}

// ---------- Tipos de saída ----------

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

// ---------- Helpers ----------

export function deriveAgeRangeFromMonths(ageMonths?: number | null): MaternaAgeRange | undefined {
  if (typeof ageMonths !== 'number' || ageMonths < 0) return undefined
  if (ageMonths < 12) return '0-1'
  if (ageMonths < 36) return '1-3'
  if (ageMonths < 72) return '3-6'
  if (ageMonths < 96) return '6-8'
  return '8+'
}

function inferAgeHint(context: RotinaQuickIdeasContext | null | undefined, child: MaternaChildProfile | null | undefined) {
  // Obrigação: NÃO inventar idade.
  // Regra: usar context.ageBand; senão child.ageRange; senão undefined.
  const fromContext = String(context?.ageBand ?? '').trim()
  if (fromContext) return fromContext
  const fromChild = String(child?.ageRange ?? '').trim()
  if (fromChild) return fromChild
  return undefined
}

function compactList(arr: unknown, maxItems: number): string[] {
  if (!Array.isArray(arr)) return []
  const out: string[] = []
  for (const x of arr) {
    const s = String(x ?? '').trim()
    if (!s) continue
    out.push(s.slice(0, 80))
    if (out.length >= maxItems) break
  }
  return out
}

// ---------- Prompts ----------

function buildBaseSystemPrompt(): string {
  return `
Você é a inteligência oficial do Materna360, um app que ajuda mães cansadas a viverem a maternidade com mais leveza, conexão e clareza.

REGRAS:
- Português do Brasil
- Tom humano, direto e sem julgamentos
- Micro-ações possíveis
- Nada de diagnósticos
- Sempre responder com JSON válido
`.trim()
}

/**
 * P34.17 — Prompt cognitivo autorizado APENAS para:
 * tipoIdeia === "meu-filho-bloco-1"
 * (Maternar → Meu Filho → Brincadeiras)
 *
 * Regras adicionais críticas:
 * - Entregar UMA única microexperiência (não lista, não variações)
 * - Sem títulos, sem bullets, sem explicações educacionais
 * - Texto curto, concreto, executável agora
 * - Precisa parecer pensado para o momento, não “catálogo”
 *
 * 3 obrigações reforçadas (escopo):
 * 1) AUTORIZAÇÃO: só usar este prompt quando tipoIdeia for meu-filho-bloco-1.
 * 2) IDADE: não inventar idade; use context.ageBand ou child.ageRange quando disponível.
 * 3) ANTI-REPETIÇÃO: se existirem avoid_titles/avoid_themes, não repetir.
 */
function buildPromptMeuFilhoBloco1Cognitivo(args: {
  ageHint?: string
  avoidTitles?: string[]
  avoidThemes?: string[]
}): string {
  const avoidTitles = (args.avoidTitles ?? []).filter(Boolean)
  const avoidThemes = (args.avoidThemes ?? []).filter(Boolean)

  const ageLine = args.ageHint ? `IDADE/FAIXA DISPONÍVEL: ${args.ageHint}` : `IDADE/FAIXA: não informada (não afirme idade).`

  const antiRepeatBlock =
    avoidTitles.length || avoidThemes.length
      ? `
ANTI-REPETIÇÃO (obrigatório):
- NÃO gere nada com o mesmo núcleo/ideia que combine com estas referências.
- avoid_titles: ${JSON.stringify(avoidTitles).slice(0, 500)}
- avoid_themes: ${JSON.stringify(avoidThemes).slice(0, 500)}
`
      : `
ANTI-REPETIÇÃO (obrigatório):
- Evite brincar “de blog/lista” e evite repetir ideias muito comuns.
`

  return `
Você está no Materna360, no hub "Meu Filho → Brincadeiras", e sua missão é entregar UMA microexperiência única, pensada para este momento.

${ageLine}

PROCESSO OBRIGATÓRIO (execute mentalmente antes de escrever):
1) Leitura da realidade: idade/faixa (se disponível), tempo disponível, energia implícita da mãe, contexto de casa, vínculo buscado agora.
2) Exclusão do óbvio: descarte brincadeiras comuns, ideias de blog/lista, sugestões familiares demais (ex.: caça ao tesouro genérico, massinha, pintura, circuito, dança livre, historinha inventada padrão, “pular corda”, “pega-pega”).
3) Escolha de UM arquétipo cognitivo (silencioso, sem nomear): descoberta silenciosa, missão curta, observação guiada, inversão de papéis, desafio gentil, exploração sensorial contida.
4) Construção de microexperiência: início claro, ação central simples, fechamento natural.
5) Validação emocional: sem preparo, sem bagunça grande, sem obrigação, pode parar sem frustração, respeita o cansaço.

${antiRepeatBlock}

ENTREGA FINAL (obrigatória):
- Sem título.
- Sem listas.
- Sem bullets.
- Sem explicações educacionais.
- Sem “você pode”, sem “que tal”, sem “talvez”, sem “se quiser”, sem “uma ideia”.
- 1 a 3 frases, no máximo 280 caracteres.
- Convite contextual + ação principal + fechamento natural.
- Uma única ideia por resposta.

FORMATO DE RESPOSTA:
Responda APENAS com JSON válido no shape:
{
  "suggestions": [
    {
      "id": "mf-b1-001",
      "category": "ideia-rapida",
      "title": "",
      "description": "…",
      "estimatedMinutes": <number>,
      "withChild": true,
      "moodImpact": "aproxima"
    }
  ]
}
`.trim()
}

function buildGenericQuickIdeasPrompt(): string {
  // Mantém o comportamento para outros tipoIdeia sem expandir escopo de P.
  // (Serve como base segura para não retornar vazio.)
  return `
Você está na funcionalidade "Ideias rápidas" do Materna360.

Regras:
- Responda em Português do Brasil.
- Sem julgamentos e sem discurso longo.
- Sugestões práticas e viáveis.
- Responda sempre com JSON válido no shape:
{
  "suggestions": [
    { "id": "…", "category": "ideia-rapida", "title": "…", "description": "…", "estimatedMinutes": <number>, "withChild": <boolean>, "moodImpact": "acalma|energia|organiza|aproxima" }
  ]
}
`.trim()
}

function buildModeSpecializationPrompt(
  mode: MaternaMode,
  quickContext?: RotinaQuickIdeasContext | null,
  child?: MaternaChildProfile | null,
): string {
  if (mode === 'quick-ideas') {
    // ✅ Decisão de governança P34.17:
    // Prompt por tipoIdeia, APENAS para meu-filho-bloco-1.
    if (quickContext?.tipoIdeia === 'meu-filho-bloco-1') {
      const avoidTitles = compactList(quickContext?.avoid_titles, 12)
      const avoidThemes = compactList(quickContext?.avoid_themes, 12)
      const ageHint = inferAgeHint(quickContext, child ?? null)

      return buildPromptMeuFilhoBloco1Cognitivo({
        ageHint,
        avoidTitles,
        avoidThemes,
      })
    }

    return buildGenericQuickIdeasPrompt()
  }

  if (mode === 'daily-inspiration') {
    return `
Você está na funcionalidade "Inspirações do Dia".
Responda com inspiration: { phrase, care, ritual }.
`.trim()
  }

  return `
Você está na funcionalidade "Receitas Inteligentes".
Responda com recipes (lista).
`.trim()
}

// ---------- OpenAI ----------

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MATERNA_MODEL = 'gpt-4.1-mini'

type OpenAIChatMessage = {
  role: 'system' | 'user'
  content: string
}

export async function callMaternaAI<M extends MaternaMode>(
  payload: MaternaAIRequestPayload & { mode: M },
): Promise<MaternaAIResponseMap[M]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada')

  const childWithAgeRange =
    payload.child?.idadeMeses != null
      ? { ...payload.child, ageRange: deriveAgeRangeFromMonths(payload.child.idadeMeses) }
      : payload.child ?? null

  const quickContext = payload.mode === 'quick-ideas' ? (payload.context as RotinaQuickIdeasContext) : null

  const messages: OpenAIChatMessage[] = [
    {
      role: 'system',
      content:
        buildBaseSystemPrompt() +
        '\n\n' +
        buildModeSpecializationPrompt(payload.mode, quickContext, childWithAgeRange),
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

  const res = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.MATERNA360_AI_MODEL || DEFAULT_MATERNA_MODEL,
      messages,
      temperature: 0.6,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) throw new Error('Erro na OpenAI')

  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}
