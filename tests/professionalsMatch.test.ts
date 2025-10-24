import assert from 'node:assert/strict'
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import {
  matchesFilters,
  sanitizeFilters,
  sortProfessionals,
} from '@/app/lib/professionals/match'
import type { ProfessionalsFilters } from '@/app/types/professionals'

const sanitize = (input: ProfessionalsFilters) => sanitizeFilters(input)

const findByProfession = (profession: string) =>
  PROFESSIONALS_MOCK.filter((professional) => professional.profession === profession)

const samplePsychologist = PROFESSIONALS_MOCK.find((professional) => professional.profession === 'psicologia')!
const sampleFono = PROFESSIONALS_MOCK.find((professional) => professional.profession === 'fonoaudiologia')!
const sampleDoula = PROFESSIONALS_MOCK.find((professional) => professional.profession === 'doula')!
const sampleInPerson = PROFESSIONALS_MOCK.find((professional) => professional.formats.inPerson)!

test('matches by profissão and temas (specialties with AND logic)', () => {
  const filters = sanitize({ profession: 'psicologia', specialties: ['puerperio', 'sono'] })
  assert.equal(matchesFilters(samplePsychologist, filters), true)
  assert.equal(matchesFilters(sampleFono, filters), false)
})

test('filters by formato with presencial and região combinados', () => {
  const filters = sanitize({ formats: ['presencial'], region: 'curitiba' })
  assert.equal(matchesFilters(sampleInPerson, filters), sampleInPerson.formats.regions?.some((region) => region.toLowerCase().includes('curitiba')) ?? false)

  const rioFilters = sanitize({ formats: ['presencial'], region: 'rio de janeiro' })
  assert.equal(matchesFilters(sampleDoula, rioFilters), true)
})

test('filters by faixa etária e idioma', () => {
  const filters = sanitize({ ageBand: 'gestante', language: 'pt-BR' })
  PROFESSIONALS_MOCK.forEach((professional) => {
    assert.equal(matchesFilters(professional, filters), professional.ageBands.includes('gestante') && professional.languages.includes('pt-BR'))
  })
})

test('filters by disponibilidade em 48h e busca textual', () => {
  const filters = sanitize({ availableIn48h: true, q: 'plano de parto' })
  const matches = PROFESSIONALS_MOCK.filter((professional) => matchesFilters(professional, filters))
  assert.ok(matches.every((professional) => professional.availableIn48h))
  assert.ok(matches.some((professional) => professional.howHelps.some((item) => item.toLowerCase().includes('plano de parto'))))
})

test('sorting by nome mantém ordem estável', () => {
  const psychologists = findByProfession('psicologia')
  const sorted = sortProfessionals(psychologists, 'nome')
  const expected = [...psychologists].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  assert.deepEqual(sorted.map((professional) => professional.id), expected.map((professional) => professional.id))
})
