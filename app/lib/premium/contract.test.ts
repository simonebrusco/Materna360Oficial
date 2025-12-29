// app/lib/premium/contract.test.ts
/**
 * Teste de contrato (P32).
 * Não depende de Jest/Vitest. Usa node:test + assert.
 *
 * Se o projeto não rodar node:test hoje, este arquivo ainda serve como
 * "contrato vivo" e pode ser executado quando desejarem.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_ENTITLEMENTS, getEntitlements, hasCapability } from './entitlements'
import { PREMIUM_CAPABILITIES } from './capabilities'

test('DEFAULT_ENTITLEMENTS é sempre free e estável', () => {
  assert.equal(DEFAULT_ENTITLEMENTS.tier, 'free')

  for (const cap of PREMIUM_CAPABILITIES) {
    assert.equal(hasCapability(DEFAULT_ENTITLEMENTS, cap), false)
  }
})

test('getEntitlements retorna free por padrão (P32 no-op)', async () => {
  const ent = await getEntitlements()
  assert.equal(ent.tier, 'free')

  for (const cap of PREMIUM_CAPABILITIES) {
    assert.equal(hasCapability(ent, cap), false)
  }
})
