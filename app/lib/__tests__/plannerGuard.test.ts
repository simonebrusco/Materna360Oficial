import { describe, expect, it } from 'vitest'

import { validatePlannerItem } from '../plannerGuard'

describe('validatePlannerItem', () => {
  it('normalizes idea payloads and trims materials', () => {
    const result = validatePlannerItem({
      type: 'idea',
      id: 'idea-123',
      title: '  Brincadeira Sensorial  ',
      duration_min: 12,
      materials: ['  papel crepom  ', ' ', 'Tesoura '],
      extra: 'ignored',
    })

    expect(result).toMatchObject({
      type: 'idea',
      id: 'idea-123',
      title: 'Brincadeira Sensorial',
      duration_min: 12,
      materials: ['papel crepom', 'Tesoura'],
    })
  })

  it('accepts routines with exactly three steps', () => {
    const result = validatePlannerItem({
      type: 'routine',
      id: 'routine-1',
      title: 'Rotina Calma',
      totalMin: 15,
      steps: [
        { title: 'Respira', minutes: 5 },
        { title: 'Alongar', minutes: 5, ideaId: 'idea-1' },
        { title: 'Relaxar', minutes: 5 },
      ],
      materials: ['tapete', 'playlist suave'],
      safetyNotes: ['Supervisione sempre.'],
    })

    expect(result.steps).toHaveLength(3)
    expect(result.materials).toEqual(['tapete', 'playlist suave'])
  })

  it('rejects products with invalid affiliate url', () => {
    expect(() =>
      validatePlannerItem({
        type: 'product',
        id: 'prod-1',
        title: 'Livro Ilustrado',
        kind: 'book',
        imageUrl: 'https://example.com/book.png',
        retailer: 'Livraria',
        affiliateUrl: 'notaurl',
      })
    ).toThrow()
  })

  it('defaults optional arrays and trims values for recipes', () => {
    const result = validatePlannerItem({
      type: 'recipe',
      id: 'recipe-1',
      title: 'Purê de Abóbora',
      readyInMinutes: 25,
      servings: 4,
      shoppingList: ['  abóbora ', ' azeite ', '', 'sal'],
      note: ' Servir morno ',
    })

    expect(result).toMatchObject({
      shoppingList: ['abóbora', 'azeite', 'sal'],
      note: 'Servir morno',
    })
  })
})
