import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToString } from 'react-dom/server'

import { PROFESSIONALS_MOCK } from '@/app/data/professionals.mock'
import { ProfessionalsSectionClient } from '@/components/support/ProfessionalsSectionClient'

const SAMPLE_PROS = PROFESSIONALS_MOCK.slice(0, 4)

test('renders card for each professional in the mock', () => {
  const html = renderToString(<ProfessionalsSectionClient professionals={SAMPLE_PROS} />)

  assert.ok(html.includes('Ver perfil'), 'should render CTA')
  const cardOccurrences = html.split('Ver perfil').length - 1
  assert.equal(cardOccurrences, SAMPLE_PROS.length)
})

test('modal render includes council when professional has registry', () => {
  const professionalWithCouncil = PROFESSIONALS_MOCK.find((item) => item.council)
  assert.ok(professionalWithCouncil, 'expected at least one professional with council data')

  const html = renderToString(
    <ProfessionalsSectionClient
      professionals={[professionalWithCouncil!]}
      initialOpenId={professionalWithCouncil!.id}
    />
  )

  if (professionalWithCouncil?.council) {
    const registry = `${professionalWithCouncil.council.type} ${professionalWithCouncil.council.number}`
    assert.ok(html.includes(registry))
  }
})
