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
 * Mantém compat com usos existentes da Rotina Leve.
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

export interface RotinaQuickIdeasContext {
  tempoDisponivel?: number | null
  comQuem?: RotinaComQuem | null
  tipoIdeia?: RotinaTipoIdeia | null

  // extras (sem tipagem rígida no endpoint, mas o core recebe e pode usar)
  ageBand?: string | null
  contexto?: string | null
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
 */
function buildPromptMeuFilhoBloco1Cognitivo(): string {
  return `
Você está no Materna360, no hub "Meu Filho → Brincadeiras", e sua missão é entregar UMA microexperiência única, pensada para este momento.

PROCESSO OBRIGATÓRIO (execute mentalmente antes de escrever):
1) Leitura da realidade: idade/faixa, tempo disponível, energia implícita da mãe, contexto, vínculo buscado agora.
2) Exclusão do óbvio: descarte ideias de blog/lista e brincadeiras “padrão”.
3) Escolha de UM arquétipo (silencioso): descoberta silenciosa, missão curta, observação guiada, inversão de papéis, desafio gentil, exploração sensorial contida.
4) Microexperiência: início claro + ação central simples + fechamento natural.
5) Validação emocional: sem preparo, sem bagunça grande, pode parar sem frustração, respeita o cansaço.

OBRIGAÇÕES (não negocie):
A) Varie a abertura: NÃO comece sempre com "Agora,".
B) Proibido repetir padrões comuns que viram “cara de IA”: evite "sente no chão", "caminhem devagar", "observe um objeto por um minuto" e variações diretas disso.
C) Proibido “roteiro em etapas”: não use estrutura "Depois..., depois..." e não entregue 3 tarefas/3 passos.

PROIBIÇÕES:
- Sem título.
- Sem listas.
- Sem bullets.
- Sem explicações educacionais.
- Sem “você pode”, sem “que tal”, sem “talvez”, sem “se quiser”, sem “uma ideia”.

FORMATO DO TEXTO (obrigatório):
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

function buildQuickIdeasGenericPrompt(): string {
  return `
Você está no Materna360 na funcionalidade "Rotina Leve / Ideias Rápidas".

Regras:
- Responda em JSON válido.
- Gere 3 sugestões curtas e executáveis.
- Sem julgamentos.
- Evite clichês e listas de blog.

Formato:
{
  "suggestions": [
    { "id":"...", "category":"ideia-rapida", "title":"", "description":"...", "estimatedMinutes": <number>, "withChild": <boolean>, "moodImpact":"..." }
  ]
}
`.trim()
}

function buildModeSpecializationPrompt(
  mode: MaternaMode,
  quickContext?: RotinaQuickIdeasContext | null,
): string {
  if (mode === 'quick-ideas') {
    // ✅ Decisão de governança P34.17:
    // Prompt por tipoIdeia, APENAS para meu-filho-bloco-1.
    if (quickContext?.tipoIdeia === 'meu-filho-bloco-1') {
      return buildPromptMeuFilhoBloco1Cognitivo()
    }

    // Mantém comportamento genérico para os demais (sem expandir escopo nesta P).
    return buildQuickIdeasGenericPrompt()
  }

  if (mode === 'daily-inspiration') {
    return `
Você está na funcionalidade "Inspirações do Dia".
Responda com inspiration contendo phrase, care e ritual.
Formato:
{ "inspiration": { "phrase":"...", "care":"...", "ritual":"..." } }
`.trim()
  }

  return `
Você está na funcionalidade "Receitas Inteligentes".
Responda com recipes.
Formato:
{ "recipes": [ { "id":"...", "title":"...", "description":"...", "timeLabel":"...", "ageLabel":"...", "preparation":"...", "safetyNote":"..." } ] }
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
      content: buildBaseSystemPrompt() + '\n\n' + buildModeSpecializationPrompt(payload.mode, quickContext),
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
