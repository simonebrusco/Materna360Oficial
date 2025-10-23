import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyAllergyFilter,
  ensureRecipeCompliance,
  isUnderSixMonths,
  mapMonthsToRecipeBand,
  validateRecipeResponseShape,
  type HealthyRecipe,
  type RecipeGenerationResponse,
} from '@/app/lib/healthyRecipes'

const sampleRecipe: HealthyRecipe = {
  title: 'Purê de batata-doce com frango',
  readyInMinutes: 20,
  servings: 2,
  ageBand: '9-12m',
  rationale: ['Textura macia adequada para 9-12 meses', 'Inclui proteína magra e carboidrato complexo'],
  ingredients: [
    { name: 'Batata-doce cozida', quantity: '1 unidade média' },
    { name: 'Frango desfiado', quantity: '2 colheres de sopa' },
    { name: 'Leite integral', quantity: '2 colheres', usesPantry: true },
  ],
  steps: ['Cozinhar a batata-doce até ficar macia.', 'Misturar com o frango desfiado e amassar.', 'Adicionar leite até atingir textura macia.'],
  textureNote: 'Textura de purê espesso, sem pedaços.',
  safetyNotes: ['Servir em temperatura morna.'],
  nutritionBadge: ['Fonte de proteína'],
  planner: {
    suggestedCategory: 'Almoço',
    suggestedWindow: '<=30',
    tags: ['receita'],
  },
}

test('gating below six months', () => {
  assert.equal(isUnderSixMonths(0), true)
  assert.equal(isUnderSixMonths(5.5), true)
  assert.equal(isUnderSixMonths(6), false)
  assert.equal(mapMonthsToRecipeBand(7), '6-8m')
  assert.equal(mapMonthsToRecipeBand(15), '1-2y')
})

test('allergen filtering removes unsafe ingredients and adds safety notes', () => {
  const filtered = applyAllergyFilter(sampleRecipe, ['leite'])
  assert.equal(filtered.ingredients.some((ingredient) => ingredient.name.includes('Leite')), false)
  assert.ok(
    filtered.safetyNotes?.some((note) =>
      note.toLocaleLowerCase('pt-BR').includes('ingrediente removido devido à alergia registrada')
    )
  )
})

test('ensureRecipeCompliance limits recipe count and normalizes data', () => {
  const response: RecipeGenerationResponse = {
    educationalMessage: null,
    noResultMessage: null,
    recipes: [sampleRecipe, sampleRecipe, sampleRecipe, sampleRecipe],
  }

  const sanitized = ensureRecipeCompliance(response, [])
  assert.equal(sanitized.recipes.length, 3)
  sanitized.recipes.forEach((recipe) => {
    assert.ok(recipe.ingredients.every((ingredient) => ingredient.name.trim().length > 0))
    assert.ok(Array.isArray(recipe.rationale))
  })
})

test('validateRecipeResponseShape rejects invalid payload', () => {
  const invalid: any = {
    educationalMessage: null,
    noResultMessage: null,
    recipes: [
      {
        readyInMinutes: 10,
        servings: 1,
        ageBand: '6-8m',
        rationale: ['Motivo'],
        ingredients: [],
        steps: ['Passo'],
        planner: { suggestedCategory: 'Almoço', suggestedWindow: '<=15', tags: [] },
      },
    ],
  }

  assert.throws(() => validateRecipeResponseShape(invalid))
})
