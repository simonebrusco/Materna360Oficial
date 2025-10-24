import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToString } from 'react-dom/server'

import { ProfessionalsResults } from '@/components/support'
import ProfessionalsSearchForm from '@/components/support/ProfessionalsSearchForm'
import ProfessionalCard from '@/components/support/ProfessionalCard'

const SAMPLE_PRO = {
  id: 'pro-1',
  nome: 'Ana Luiza Prado',
  especialidade: 'Fonoaudiologia',
  bioCurta: 'Fonoaudióloga especializada em amamentação e introdução alimentar.',
  avatarUrl: 'https://cdn.example.com/avatar.png',
  whatsUrl: 'https://wa.me/5511999999999?text=Ola',
  verificado: true,
  primeiraAvaliacaoGratuita: true,
  temas: ['amamentação', 'fala', 'introdução alimentar'],
}

test('ProfessionalCard renderiza badges corretas', () => {
  const html = renderToString(<ProfessionalCard pro={SAMPLE_PRO} />)

  assert.ok(html.includes('Verificado Materna360'))
  assert.ok(html.includes('Primeira avaliação gratuita'))
  assert.ok(html.includes('Vamos conversar?'))
})

test('ProfessionalCard não exibe pill gratuita quando não aplicável', () => {
  const html = renderToString(
    <ProfessionalCard
      pro={{
        ...SAMPLE_PRO,
        primeiraAvaliacaoGratuita: false,
      }}
    />
  )

  assert.equal(html.includes('Primeira avaliação gratuita'), false)
})

test('ProfessionalsResults exibe estado vazio antes da busca', () => {
  const html = renderToString(<ProfessionalsResults />)

  assert.ok(html.includes('Use os filtros acima e clique em'))
})

test('ProfessionalsSearchForm exibe botão Buscar profissionais', () => {
  const html = renderToString(<ProfessionalsSearchForm onSearch={() => undefined} />)

  assert.ok(html.includes('Buscar profissionais'))
})
