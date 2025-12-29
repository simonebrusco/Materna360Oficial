// app/lib/premium/request.contract.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { getRequestEntitlements } from './request'
import { PREMIUM_CAPABILITIES } from './capabilities'
import { hasCapability } from './entitlements'

test('getRequestEntitlements mantém default free (P32)', async () => {
  const ent = await getRequestEntitlements()
  assert.equal(ent.tier, 'free')

  for (const cap of PREMIUM_CAPABILITIES) {
    assert.equal(hasCapability(ent, cap), false)
  }
})
