// app/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

export type Client = SupabaseClient

let _browser: Client | null = null

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`[supabase] Missing env: ${name}`)
  return value
}

/**
 * Browser client (client-side only)
 */
export function supabaseBrowser(): Client {
  if (typeof window === 'undefined') {
    throw new Error('[supabaseBrowser] called on server')
  }

  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anon = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (_browser) return _browser
  _browser = createBrowserClient(url, anon)
  return _browser
}

/**
 * Server client (server-side only)
 * - Prefere SUPABASE_SERVICE_ROLE_KEY (ADM/cron/server trusted)
 * - Cai para anon em último caso (não recomendado para ADM)
 */
export function supabaseServer(): Client {
  // garante que isso não vá parar em bundle client
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('server-only')

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
