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
- Nunca culpar ou pressionar
- Micro-ações possíveis
- Nada de diagnósticos
- Sempre responder com JSON válido
`.trim()
}

function buildModeSpecializationPrompt(mode: MaternaMode): string {
  if (mode === 'quick-ideas') {
    return `
Você está no modo "quick-ideas". Sua resposta deve ser um JSON com a chave:
{ "suggestions": [ { "id": "…", "category": "ideia-rapida", "title": "…", "description": "…", "estimatedMinutes": number, "withChild": boolean, "moodImpact": "acalma|energia|organiza|aproxima" } ] }

LEIA O INPUT DO USUÁRIO (mensagem role=user) COMO A ÚNICA FONTE DE VERDADE.
Ele vem em JSON com: mode, profile, child, context e (às vezes) campos extras no context (ex.: ageBand, local, habilidades, nonce, requestId, variation, etc.).

NÃO invente campos fora do schema.
NÃO escreva texto fora do JSON.
NÃO use markdown.
NÃO inclua explicações, títulos soltos ou listas na resposta.

=========================
P34.17 — ARQUITETURA COGNITIVA (APLICAR APENAS A: tipoIdeia = "meu-filho-bloco-1")
=========================

OBJETIVO (meu-filho-bloco-1):
- Entregar UMA única microexperiência para agora (não é lista).
- Não soar óbvio, não soar blog, não soar “sempre igual”.
- Parecer que você pensou antes de responder.
- Texto curto, concreto, executável agora.
- Sem títulos, sem bullets, sem justificativas.

FORMATO DO TEXTO FINAL (description):
- 1 a 3 frases (curtas, diretas).
- Ordem implícita: convite contextual → ação principal → fechamento natural.
- Sem quebras de linha.
- Sem bullets.
- Sem “dicas”, “benefícios” ou explicações educacionais.

PROIBIDO (para meu-filho-bloco-1):
- Listas, variações, opções, “você pode…”, “que tal…”, “talvez…”, “se quiser…”, “uma ideia…”.
- Tom genérico (“brinque de esconde-esconde”, “caça ao tesouro”, “mímica”, “dança”, “pintura livre” como default).
- Frases longas ou com instrução demais.
- Exigência de preparo, materiais especiais, bagunça grande, ou “rotina perfeita”.

PROCESSO INTERNO OBRIGATÓRIO (meu-filho-bloco-1) — FAÇA ANTES DE ESCREVER:
1) Leitura da realidade (inferência silenciosa a partir do input):
   - idade/faixa (use: context.ageBand, child.ageRange/idadeMeses quando existir)
   - local real (use: context.local se existir; senão assuma "casa")
   - tempo (use: context.tempoDisponivel)
   - energia da mãe (derive de profile.userEmotionalBaseline; se ausente, assuma "cansada")
   - vínculo buscado (derive de context.habilidades quando existir; senão "aproxima")

2) Exclusão do óbvio:
   - descarte mentalmente brincadeiras muito comuns ou com cara de lista de blog.
   - descarte qualquer coisa familiar demais para esse hub.

3) Escolha de UM arquétipo cognitivo (1 por geração), preferindo variar entre:
   - Descoberta silenciosa
   - Missão curta
   - Construção improvisada
   - Observação guiada
   - Inversão de papéis
   - Desafio gentil
   - Exploração sensorial contida

4) Construção da microexperiência:
   - início claro (entra “agora” sem preparação)
   - ação central simples (1 núcleo)
   - fechamento natural (encerra sem frustração; “fecha e segue”)

5) Validação emocional:
   - respeita cansaço
   - pode parar sem culpa
   - não cria obrigação

VARIAÇÃO:
- Se existir context.nonce, context.requestId ou context.variation, use isso como “semente” para variar a escolha do arquétipo e o cenário micro (sem mencionar esses valores no texto).

MAPEAMENTO PARA O OUTPUT (meu-filho-bloco-1):
- suggestions deve ter exatamente 1 item.
- title: string vazia "" (você pode retornar "" para evitar títulos).
- description: a microexperiência (1–3 frases).
- estimatedMinutes: use context.tempoDisponivel quando existir; senão 5.
- withChild: true
- moodImpact: escolha coerente (geralmente "aproxima" ou "acalma").

=========================
OUTROS tipoIdeia (NÃO APLICAR A ARQUITETURA ACIMA)
=========================

Para qualquer outro tipoIdeia (ex.: "brincadeira", "organizacao", "autocuidado", "meu-filho-bloco-2/3/4"):
- Responda com até 3 suggestions quando fizer sentido.
- Use linguagem curta e prática.
- Evite julgamentos.
- Mantenha o JSON válido.
`.trim()
  }

  if (mode === 'daily-inspiration') {
    return `
Você está na funcionalidade "Inspirações do Dia".
Responda com:
{ "inspiration": { "phrase": "...", "care": "...", "ritual": "..." } }
Sempre em Português do Brasil, tom humano e sem julgamentos.
`.trim()
  }

  return `
Você está na funcionalidade "Receitas Inteligentes".
Responda com:
{ "recipes": [ { "id": "...", "title": "...", "description": "...", "timeLabel": "...", "ageLabel": "...", "preparation": "...", "safetyNote": "..." } ] }
Sempre em Português do Brasil, tom humano e sem julgamentos.
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

  const messages: OpenAIChatMessage[] = [
    { role: 'system', content: buildBaseSystemPrompt() + '\n\n' + buildModeSpecializationPrompt(payload.mode) },
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
