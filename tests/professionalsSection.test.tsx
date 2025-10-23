import React from 'react'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToString } from 'react-dom/server'

import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import { ProfessionalsSectionClient } from '@/components/support/ProfessionalsSectionClient'

const SAMPLE_PROS = PROFESSIONALS_MOCK.slice(0, 4)

test('renders card for each professional in the mock', () => {
  const html = renderToString(
    <ProfessionalsSectionClient professionals={SAMPLE_PROS} renderPlainImages />
  )

  SAMPLE_PROS.forEach((professional) => {
    assert.ok(html.includes(professional.name))
  })
})

test('modal render includes council when professional has registry', () => {
  const professionalWithCouncil = PROFESSIONALS_MOCK.find((item) => item.council)
  assert.ok(professionalWithCouncil, 'expected at least one professional with council data')

  const html = renderToString(
    <ProfessionalsSectionClient
      professionals={[professionalWithCouncil!]}
      initialOpenId={professionalWithCouncil!.id}
      renderPlainImages
    />
  )

  if (professionalWithCouncil?.council) {
    const registry = `${professionalWithCouncil.council.type} ${professionalWithCouncil.council.number}`
    assert.ok(html.includes(registry))
  }
})
