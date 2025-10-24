import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'

import { DailyMessageCard } from '@/components/blocks/MessageOfDay'

const extractGreeting = (markup: string) => {
  const match = markup.match(/<p[^>]*>“([^<]*)”<\/p>/)
  return match ? match[1] : null
}

test('DailyMessageCard renders greeting verbatim', () => {
  const greeting = 'Boa tarde, Mariana!'
  const markup = renderToStaticMarkup(<DailyMessageCard greeting={greeting} />)
  assert.equal(extractGreeting(markup), greeting)
})

test('DailyMessageCard keeps fallback text unchanged', () => {
  const greeting = 'Boa noite, Mãe!'
  const markup = renderToStaticMarkup(<DailyMessageCard greeting={greeting} />)
  assert.equal(extractGreeting(markup), greeting)
})
