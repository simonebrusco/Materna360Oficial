// app/lib/supabase.client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Client = SupabaseClient

let _browser: Client | null = null

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`[supabase] Missing env: ${name}`)
  return value
}

/**
 * Browser client (client-side)
 * - Único ponto de criação do supabase no client
 */
export function supabaseBrowser(): Client {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (_browser) return _browser
  _browser = createBrowserClient(url, anon)
  return _browser
}
