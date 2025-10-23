import { NextResponse } from 'next/server'

import {
  BREASTFEEDING_MESSAGE,
  MAX_RECIPE_RESULTS,
  RecipeGenerationRequest,
  RecipeGenerationResponse,
  RecipeTimeOption,
  ensureRecipeCompliance,
  isUnderSixMonths,
  mapMonthsToRecipeBand,
  sanitizeAllergies,
  sanitizeIngredients,
  validateRecipeResponseShape,
} from '@/app/lib/healthyRecipes'
import { trackTelemetry } from '@/app/lib/telemetry'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const MODEL = process.env.OPENAI_RECIPES_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
const API_KEY = process.env.OPENAI_API_KEY ?? process.env.GEN_AI_API_KEY

const SYSTEM_PROMPT = `Você é uma assistente culinária com foco em nutrição infantil e rotinas familiares no Brasil.
Sempre responda em português do Brasil.
Gere receitas saudáveis, práticas e seguras utilizando apenas os ingredientes fornecidos pela mãe e itens de despensa básicos (água, azeite, ervas, especiarias leves).
Respeite rigorosamente as faixas etárias, texturas ideais, limites de sódio/açúcar e alergias informadas.
Se child.months < 6, não gere receitas e retorne apenas a mensagem educativa recomendando amamentação exclusiva.
Não use álcool, cafeína, adoçantes artificiais nem ultraprocessados como base.
Retorne SOMENTE JSON válido seguindo o schema enviado pelo desenvolvedor, sem comentários ou texto adicional.`

const RESPONSE_SCHEMA = {
  name: 'recipes_response',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      educationalMessage: { type: ['string', 'null'] },
      noResultMessage: { type: ['string', 'null'] },
      recipes: {
        type: 'array',
        maxItems: MAX_RECIPE_RESULTS,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'title',
            'readyInMinutes',
            'servings',
            'ageBand',
            'rationale',
            'ingredients',
            'steps',
            'planner',
          ],
          properties: {
            title: { type: 'string' },
            readyInMinutes: { type: 'number' },
            servings: { type: 'number' },
            ageBand: { enum: ['6-8m', '9-12m', '1-2y', '2-6y'] },
            rationale: {
              type: 'array',
              minItems: 2,
              items: { type: 'string' },
            },
            ingredients: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'string' },
                  usesPantry: { type: 'boolean' },
                  providedByUser: { type: 'boolean' },
                },
              },
            },
            steps: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
            },
            textureNote: { type: 'string' },
            safetyNotes: {
              type: 'array',
              items: { type: 'string' },
            },
            nutritionBadge: {
              type: 'array',
              items: { type: 'string' },
            },
            planner: {
              type: 'object',
              additionalProperties: false,
              required: ['suggestedCategory', 'suggestedWindow', 'tags'],
              properties: {
                suggestedCategory: {
                  enum: ['Café da manhã', 'Almoço', 'Jantar', 'Lanche'],
                },
                suggestedWindow: {
                  enum: ['<=15', '<=30', '<=45', '>45'],
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    required: ['educationalMessage', 'noResultMessage', 'recipes'],
  },
}

const clampServings = (value: number) => {
  if (!Number.isFinite(value)) {
    return 2
  }
  return Math.min(Math.max(Math.round(value), 1), 6)
}

const normalizeTimeFilter = (time?: string | null): RecipeTimeOption | undefined => {
  if (!time) {
    return undefined
  }

  if (time === '<=15' || time === '<=30' || time === '<=45' || time === '>45') {
    return time
  }

  return undefined
}

export async function POST(request: Request) {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Modelo de IA não configurado.' }, { status: 500 })
  }

  let payload: RecipeGenerationRequest

  try {
    const body = await request.json()
    payload = {
      ingredients: sanitizeIngredients(body?.ingredients),
      filters: {
        courses: Array.isArray(body?.filters?.courses) ? sanitizeIngredients(body.filters.courses) : [],
        dietary: Array.isArray(body?.filters?.dietary) ? sanitizeIngredients(body.filters.dietary) : [],
        time: normalizeTimeFilter(body?.filters?.time),
      },
      servings: clampServings(Number(body?.servings ?? 2)),
      child: {
        months: Number(body?.child?.months ?? 0),
        allergies: sanitizeAllergies(body?.child?.allergies),
      },
      variationOf: typeof body?.variationOf === 'string' ? body.variationOf.trim() || null : null,
    }
  } catch (error) {
    console.error('Falha ao processar request de receitas:', error)
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  if (payload.ingredients.length === 0) {
    return NextResponse.json({ error: 'Informe pelo menos um ingrediente.' }, { status: 400 })
  }

  if (isUnderSixMonths(payload.child.months)) {
    trackTelemetry('recipes.generate', { result: 'under-six-months' })
    const response: RecipeGenerationResponse = {
      educationalMessage: BREASTFEEDING_MESSAGE,
      noResultMessage: null,
      recipes: [],
    }
    return NextResponse.json(response)
  }

  const requestSummary = {
    ingredientes: payload.ingredients,
    filtros: {
      cursos: payload.filters.courses,
      dieta: payload.filters.dietary,
      tempo: payload.filters.time,
    },
    porcoes: payload.servings,
    crianca: {
      meses: payload.child.months,
      faixaEtaria: mapMonthsToRecipeBand(payload.child.months),
      alergias: payload.child.allergies,
    },
    variacao: payload.variationOf,
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        response_format: {
          type: 'json_schema',
          json_schema: RESPONSE_SCHEMA,
        },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Dados do pedido (JSON):\n${JSON.stringify(requestSummary, null, 2)}\nLembre-se: máximo de ${MAX_RECIPE_RESULTS} receitas.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('OpenAI recipes response not ok:', response.status, text)
      trackTelemetry('recipes.generate.error', { status: response.status })
      return NextResponse.json({ error: 'Não foi possível gerar receitas no momento.' }, { status: 502 })
    }

    const completion = await response.json()
    const content = completion?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      trackTelemetry('recipes.generate.error', { reason: 'empty-content' })
      return NextResponse.json({ error: 'Resposta inválida do modelo de receitas.' }, { status: 502 })
    }

    let parsed: RecipeGenerationResponse
    try {
      parsed = JSON.parse(content) as RecipeGenerationResponse
    } catch (error) {
      console.error('Failed to parse recipes JSON:', error, content)
      trackTelemetry('recipes.generate.error', { reason: 'json-parse' })
      return NextResponse.json({ error: 'Formato inválido retornado pelo modelo.' }, { status: 502 })
    }

    validateRecipeResponseShape(parsed)

    const sanitized = ensureRecipeCompliance(parsed, payload.child.allergies ?? [])

    // Garantir flag providedByUser baseada nos ingredientes enviados
    const userIngredientsLower = payload.ingredients.map((item) => item.toLocaleLowerCase('pt-BR'))
    sanitized.recipes = sanitized.recipes.map((recipe) => ({
      ...recipe,
      ingredients: recipe.ingredients.map((ingredient) => {
        const lowerName = ingredient.name.toLocaleLowerCase('pt-BR')
        const provided = userIngredientsLower.some((value) => lowerName.includes(value))
        return { ...ingredient, providedByUser: provided }
      }),
    }))

    trackTelemetry('recipes.generate', { result: 'success', recipes: sanitized.recipes.length })
    return NextResponse.json(sanitized)
  } catch (error) {
    console.error('Recipes generation failure:', error)
    trackTelemetry('recipes.generate.error', { reason: 'exception' })
    return NextResponse.json({ error: 'Erro inesperado ao gerar receitas.' }, { status: 500 })
  }
}
