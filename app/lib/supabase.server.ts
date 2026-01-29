// app/lib/supabase.server.ts
import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type Client = SupabaseClient

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`[supabase] Missing env: ${name}`)
  return value
}

/**
 * Server client (server-side)
 * - Usa SERVICE_ROLE quando disponível (ADM / operações confiáveis)
 * - Fallback para anon (apenas se você quiser permitir leitura não privilegiada)
 */
export function supabaseServer(): Client {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const key = service || anon

  if (!key) {
    throw new Error(
      '[supabaseServer] Missing env: SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
