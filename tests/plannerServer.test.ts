import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  MAX_PLANNER_ITEMS_PER_DAY,
  VALID_PLANNER_CATEGORIES,
  buildPlannerPayload,
  mergePlannerPayload,
  parsePlannerCookie,
  type PlannerCookieShape,
} from '@/app/lib/plannerServer'

const mockIdFactory = () => 'planner-test-id'
const mockNowFactory = () => new Date('2024-06-01T12:00:00.000Z')

test('buildPlannerPayload sanitizes data and trims tags', () => {
  const payload = buildPlannerPayload(
    {
      title: '  Receita: Vitamina verde  ',
      dateISO: '2024-06-10',
      timeISO: '09:30',
      category: VALID_PLANNER_CATEGORIES[0],
      tags: ['  Receita  ', 'receita', 'Alimentação '],
    },
    { idFactory: mockIdFactory, nowFactory: mockNowFactory }
  )

  assert.equal(payload.id, 'planner-test-id')
  assert.equal(payload.title, 'Receita: Vitamina verde')
  assert.equal(payload.dateISO, '2024-06-10')
  assert.equal(payload.timeISO, '09:30')
  assert.deepEqual(payload.tags, ['Receita', 'Alimentação'])
  assert.equal(payload.createdAt, '2024-06-01T12:00:00.000Z')
})

test('buildPlannerPayload rejects invalid inputs', () => {
  assert.throws(() => buildPlannerPayload({ title: '', dateISO: '2024-06-10', timeISO: '09:30', category: 'Almoço' }))
  assert.throws(() => buildPlannerPayload({ title: 'Receita', dateISO: '10-06-2024', timeISO: '09:30', category: 'Almoço' }))
  assert.throws(() => buildPlannerPayload({ title: 'Receita', dateISO: '2024-06-10', timeISO: '9:30', category: 'Almoço' }))
  assert.throws(() =>
    buildPlannerPayload({ title: 'Receita', dateISO: '2024-06-10', timeISO: '09:30', category: 'Outro' })
  )
})

test('mergePlannerPayload limits stored items per day', () => {
  const existing: PlannerCookieShape = {
    '2024-06-10': Array.from({ length: MAX_PLANNER_ITEMS_PER_DAY }, (_, index) => ({
      id: `id-${index}`,
      title: `Item ${index}`,
      dateISO: '2024-06-10',
      timeISO: '08:00',
      category: 'Almoço',
      createdAt: new Date().toISOString(),
    })),
  }

  const payload = buildPlannerPayload(
    {
      title: 'Nova receita',
      dateISO: '2024-06-10',
      timeISO: '12:00',
      category: 'Almoço',
    },
    { idFactory: mockIdFactory, nowFactory: mockNowFactory }
  )

  const merged = mergePlannerPayload(existing, payload)
  assert.equal(merged['2024-06-10'].length, MAX_PLANNER_ITEMS_PER_DAY)
  assert.equal(merged['2024-06-10'][0].id, 'planner-test-id')
})

test('parsePlannerCookie returns empty object for invalid JSON', () => {
  assert.deepEqual(parsePlannerCookie(undefined), {})
  assert.deepEqual(parsePlannerCookie(''), {})
  assert.deepEqual(parsePlannerCookie('{ invalid json'), {})
})
