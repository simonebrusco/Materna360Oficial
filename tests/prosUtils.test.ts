import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POST } from '@/app/api/telemetry/pros-click/route'
import { buildWaLink, normalizeE164 } from '@/lib/pros/whatsapp'
import { trackProsClick } from '@/lib/telemetry/pros'

test('normalizeE164 converte números locais para E.164 com default do Brasil', () => {
  assert.equal(normalizeE164('11 99999-8888'), '+5511999998888')
  assert.equal(normalizeE164('+55 11 99999-8888'), '+5511999998888')
  assert.equal(normalizeE164('0044 20 7946 0000'), '+442079460000')
})

test('buildWaLink normaliza número e codifica mensagem em pt-BR', () => {
  process.env.NEXT_PUBLIC_DEFAULT_COUNTRY = '55'
  const url = buildWaLink({
    phone: '11 98888-7777',
    name: 'Clara Silva',
    profession: 'Psicologia',
    selectedTopic: 'Sono do bebê',
  })
  assert.ok(url.startsWith('https://wa.me/+5511988887777?text='))
  const decoded = decodeURIComponent(url.split('text=')[1] ?? '')
  assert.ok(decoded.includes('Olá, vim do Materna360 e gostaria da primeira avaliação gratuita.'))
  assert.ok(decoded.includes('Profissional: Clara Silva (Psicologia)'))
  assert.ok(decoded.includes('Tema/necessidade: Sono do bebê'))
})

test('trackProsClick envia payload via sendBeacon quando disponível', async () => {
  const payload = {
    professionalId: 'pro-1',
    action: 'whatsapp' as const,
    profession: 'psicologia',
    specialties: ['sono'],
    page: 2,
    filters: { specialties: ['sono'], page: 2 },
  }

  const originalNavigator = globalThis.navigator
  const originalWindow = globalThis.window

  let capturedUrl: string | null = null
  let textPromise: Promise<string> | null = null
  let fetchCalled = false

  globalThis.navigator = {
    sendBeacon: (url: string, data: Blob) => {
      capturedUrl = url
      textPromise = data.text()
      return true
    },
  } as unknown as Navigator

  globalThis.window = {
    fetch: () => {
      fetchCalled = true
      return Promise.resolve(new Response(null, { status: 204 }))
    },
  } as unknown as Window & typeof globalThis.window

  try {
    trackProsClick(payload)
    const body = textPromise ? await textPromise : ''
    assert.equal(capturedUrl, '/api/telemetry/pros-click')
    assert.equal(fetchCalled, false)
    assert.deepEqual(JSON.parse(body), payload)
  } finally {
    if (originalNavigator) {
      globalThis.navigator = originalNavigator
    } else {
      // @ts-expect-error navigator cleanup when undefined initially
      delete globalThis.navigator
    }
    if (originalWindow) {
      globalThis.window = originalWindow
    } else {
      // @ts-expect-error window cleanup when undefined initially
      delete globalThis.window
    }
  }
})

test('API de telemetry retorna ok', async () => {
  const response = await POST(
    new Request('http://localhost/api/telemetry/pros-click', {
      method: 'POST',
      body: JSON.stringify({ professionalId: 'pro-2', action: 'agendar' }),
      headers: { 'Content-Type': 'application/json' },
    })
  )

  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.deepEqual(payload, { ok: true })
})
