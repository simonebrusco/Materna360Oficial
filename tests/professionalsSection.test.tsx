import React from 'react'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToString } from 'react-dom/server'

import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import {
  ProfessionalsSectionClient,
  filtersToSearchString,
  parseFiltersFromSearch,
} from '@/components/support/ProfessionalsSectionClient'
import { DEFAULT_PROFESSIONAL_FILTERS } from '@/app/types/professionals'

const SAMPLE_PROS = PROFESSIONALS_MOCK.slice(0, 4)

test('renders card for each professional em modo básico (sem URL sync)', () => {
  const html = renderToString(
    <ProfessionalsSectionClient
      professionals={SAMPLE_PROS}
      renderPlainImages
      enableUrlSync={false}
      initialFilters={DEFAULT_PROFESSIONAL_FILTERS}
    />
  )

  SAMPLE_PROS.forEach((professional) => {
    assert.ok(html.includes(professional.name))
  })
})

test('aplicar filtro de profissão reduz a lista renderizada', () => {
  const html = renderToString(
    <ProfessionalsSectionClient
      professionals={PROFESSIONALS_MOCK}
      renderPlainImages
      enableUrlSync={false}
      initialFilters={{ ...DEFAULT_PROFESSIONAL_FILTERS, profession: 'fonoaudiologia' }}
    />
  )

  assert.ok(html.includes('Ana Luiza Prado'))
  assert.equal(html.includes('Dra. Carolina Nunes'), false)
})

test('modal render inclui conselho quando presente', () => {
  const professionalWithCouncil = PROFESSIONALS_MOCK.find((item) => item.council)
  assert.ok(professionalWithCouncil, 'expected at least one professional with council data')

  const html = renderToString(
    <ProfessionalsSectionClient
      professionals={[professionalWithCouncil!]}
      initialOpenId={professionalWithCouncil!.id}
      renderPlainImages
      enableUrlSync={false}
      initialFilters={DEFAULT_PROFESSIONAL_FILTERS}
    />
  )

  if (professionalWithCouncil?.council) {
    const registry = `${professionalWithCouncil.council.type} ${professionalWithCouncil.council.number}`
    assert.ok(html.includes(registry))
  }
})

test('serialização e parsing dos filtros preserva estado', () => {
  const search = filtersToSearchString({
    ...DEFAULT_PROFESSIONAL_FILTERS,
    profession: 'doula',
    specialties: ['puerperio'],
    formats: ['presencial'],
    region: 'Rio',
    page: 2,
  })
  const parsed = parseFiltersFromSearch(search)

  assert.equal(parsed.profession, 'doula')
  assert.deepEqual(parsed.specialties, ['puerperio'])
  assert.deepEqual(parsed.formats, ['presencial'])
  assert.equal(parsed.region, 'Rio')
  assert.equal(parsed.page, 2)
})
